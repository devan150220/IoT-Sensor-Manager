import mqtt from "mqtt"
import { type NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { brokerUrl, topic, payload } = body

    if (!brokerUrl || !topic || !payload) {
      return NextResponse.json({ error: "Missing required fields: brokerUrl, topic, payload" }, { status: 400 })
    }

    // Validate JSON payload
    try {
      JSON.parse(payload)
    } catch {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 })
    }

    const host = brokerUrl.replace(/^mqtt:\/\//, "").replace(/:\d+$/, "")
    const url = `mqtt://${host}:1883`

    const client = mqtt.connect(url, {
      protocol: "mqtt",
      host,
      port: 1883,
      clean: true,
      connectTimeout: 4000,
      reconnectPeriod: 0,
      clientId: `tester_${Math.random().toString(16).slice(2)}`,
    })

    const connectPromise = new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("Connection timeout")), 5000)
      client.on("connect", () => {
        clearTimeout(timer)
        resolve()
      })
      client.on("error", (err) => {
        clearTimeout(timer)
        reject(err)
      })
    })

    await connectPromise

    const publishPromise = new Promise<{ messageId?: number }>((resolve, reject) => {
      client.publish(topic, payload, { qos: 0, retain: false }, (err) => {
        if (err) return reject(err)
        resolve({})
      })
    })

    const result = await publishPromise
    client.end(true)

    return NextResponse.json({
      success: true,
      message: `MQTT publish successful to ${host}:1883`,
      messageId: result.messageId,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error testing MQTT connection:", error)
    const message = error instanceof Error ? error.message : "MQTT connection test failed"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
