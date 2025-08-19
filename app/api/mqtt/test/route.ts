import mqtt from "mqtt"
import { type NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { brokerUrl, topic, payload, port, transport, wsPath, timeoutMs } = body as {
      brokerUrl: string
      topic: string
      payload: string
      port?: number
      transport?: "tcp" | "ws" | "tls"
      wsPath?: string
      timeoutMs?: number
    }

    if (!brokerUrl || !topic || !payload) {
      return NextResponse.json({ error: "Missing required fields: brokerUrl, topic, payload" }, { status: 400 })
    }

    // Validate JSON payload
    try {
      JSON.parse(payload)
    } catch {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 })
    }

    const rawHost = brokerUrl.replace(/^mqtts?:\/\//, "").replace(/^wss?:\/\//, "")
    const host = rawHost.replace(/:\d+$/, "")

    const tryConnect = (proto: "mqtt" | "mqtts" | "ws" | "wss", p: number, path = "/mqtt") => {
      const isWs = proto === "ws" || proto === "wss"
      const url = isWs ? `${proto}://${host}:${p}${path}` : `${proto}://${host}:${p}`
      const client = mqtt.connect(url, {
        protocol: proto as any,
        host,
        port: p,
        clean: true,
        connectTimeout: Math.max(4000, timeoutMs || 8000),
        reconnectPeriod: 0,
        clientId: `tester_${Math.random().toString(16).slice(2)}`,
      })
      const promise = new Promise<mqtt.MqttClient>((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error("connack timeout")), Math.max(5000, (timeoutMs || 8000) + 500))
        client.once("connect", () => { clearTimeout(timer); resolve(client) })
        client.once("error", (err) => { clearTimeout(timer); reject(err) })
      })
      return promise
    }

    let client: mqtt.MqttClient | null = null
    const preferred = transport || "tcp"
    try {
      if (preferred === "tls") {
        client = await tryConnect("mqtts", port || 8883)
      } else if (preferred === "ws") {
        client = await tryConnect("ws", port || 8000, wsPath || "/mqtt")
      } else {
        // tcp first
        client = await tryConnect("mqtt", port || 1883)
      }
    } catch (err) {
      // Fallback: if tcp failed and no explicit transport, try ws on common HiveMQ port
      if (!transport) {
        try {
          client = await tryConnect("ws", 8000, wsPath || "/mqtt")
        } catch (e2) {
          throw err instanceof Error ? err : new Error("connack timeout")
        }
      } else {
        throw err instanceof Error ? err : new Error("connack timeout")
      }
    }

    const publishPromise = new Promise<{ messageId?: number }>((resolve, reject) => {
      client!.publish(topic, payload, { qos: 0, retain: false }, (err) => {
        if (err) return reject(err)
        resolve({})
      })
    })

    const result = await publishPromise
    client!.end(true)

    return NextResponse.json({
      success: true,
      message: `MQTT publish successful to ${host}`,
      messageId: result.messageId,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error testing MQTT connection:", error)
    const message = error instanceof Error ? error.message : "MQTT connection test failed"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
