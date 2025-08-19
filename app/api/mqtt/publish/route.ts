import mqtt from "mqtt"
import { type NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { brokerUrl, topic, payload, qos = 0 } = body

    if (!brokerUrl || !topic || !payload) {
      return NextResponse.json({ error: "Missing required fields: brokerUrl, topic, payload" }, { status: 400 })
    }

    // Validate JSON payload
    try {
      JSON.parse(payload)
    } catch {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 })
    }

    const url = `mqtt://${brokerUrl}:1883`

    const client = mqtt.connect(url, {
      protocol: "mqtt",
      host: brokerUrl,
      port: 1883,
      clean: true,
      connectTimeout: 4000,
      reconnectPeriod: 0,
      clientId: `publisher_${Math.random().toString(16).slice(2)}`,
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
      client.publish(topic, payload, { qos, retain: false }, (err) => {
        if (err) return reject(err)
        resolve({})
      })
    })

    const result = await publishPromise
    client.end(true)

    return NextResponse.json({
      success: true,
      message: "Message published",
      messageId: result.messageId,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error publishing MQTT message:", error)
    const message = error instanceof Error ? error.message : "MQTT publish failed"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}


export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { brokerUrl, topic, payload, qos = 0 } = body

    if (!brokerUrl || !topic || !payload) {
      return NextResponse.json({ error: "Missing required fields: brokerUrl, topic, payload" }, { status: 400 })
    }

    // Validate JSON payload
    let parsedPayload
    try {
      parsedPayload = JSON.parse(payload)
    } catch {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 })
    }

    // In a real implementation, you would use mqtt.js or similar
    // For simulation purposes, we'll return success
    const publishResult = {
      success: true,
      brokerUrl,
      topic,
      payload: parsedPayload,
      qos,
      messageId: `msg_${Date.now()}`,
      timestamp: new Date().toISOString(),
      message: "Message published successfully",
    }

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500))

    return NextResponse.json(publishResult)
  } catch (error) {
    console.error("Error publishing MQTT message:", error)
    return NextResponse.json({ error: "Failed to publish MQTT message" }, { status: 500 })
  }
}
