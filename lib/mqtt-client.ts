export interface MqttMessage {
  topic: string
  payload: string | Buffer
  qos: 0 | 1 | 2
  retain: boolean
  timestamp: string
}

export interface MqttConnectionOptions {
  brokerUrl: string
  port?: number
  clientId?: string
  username?: string
  password?: string
  keepalive?: number
  clean?: boolean
}

export class MqttSimulator {
  private connected = false
  private options: MqttConnectionOptions

  constructor(options: MqttConnectionOptions) {
    this.options = {
      port: 1883,
      clientId: `client_${Math.random().toString(16).substr(2, 8)}`,
      keepalive: 60,
      clean: true,
      ...options,
    }
  }

  async connect(): Promise<boolean> {
    try {
      // Simulate connection delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // For HiveMQ public broker, always succeed
      if (this.options.brokerUrl.includes("hivemq.com")) {
        this.connected = true
        return true
      }

      // For other brokers, simulate connection based on URL format
      const isValidUrl = /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(this.options.brokerUrl)
      this.connected = isValidUrl
      return isValidUrl
    } catch (error) {
      console.error("MQTT connection error:", error)
      this.connected = false
      return false
    }
  }

  async publish(topic: string, payload: string, qos: 0 | 1 | 2 = 0): Promise<MqttMessage> {
    if (!this.connected) {
      throw new Error("MQTT client not connected")
    }

    const message: MqttMessage = {
      topic,
      payload,
      qos,
      retain: false,
      timestamp: new Date().toISOString(),
    }

    // Simulate publish delay
    await new Promise((resolve) => setTimeout(resolve, 200))

    return message
  }

  async subscribe(topic: string, qos: 0 | 1 | 2 = 0): Promise<boolean> {
    if (!this.connected) {
      throw new Error("MQTT client not connected")
    }

    // Simulate subscription
    await new Promise((resolve) => setTimeout(resolve, 100))
    return true
  }

  disconnect(): void {
    this.connected = false
  }

  isConnected(): boolean {
    return this.connected
  }
}

export async function testMqttConnection(options: MqttConnectionOptions): Promise<{
  success: boolean
  message: string
  latency?: number
}> {
  const startTime = Date.now()

  try {
    const client = new MqttSimulator(options)
    const connected = await client.connect()
    const latency = Date.now() - startTime

    if (connected) {
      client.disconnect()
      return {
        success: true,
        message: "MQTT connection successful",
        latency,
      }
    } else {
      return {
        success: false,
        message: "Failed to connect to MQTT broker",
      }
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown connection error",
    }
  }
}

export function generateSensorData(
  sensorId: string,
  dataType: "temperature" | "humidity" | "pressure" | "generic" = "generic",
) {
  const baseData = {
    sensorId,
    timestamp: new Date().toISOString(),
  }

  switch (dataType) {
    case "temperature":
      return {
        ...baseData,
        value: Math.round((Math.random() * 40 + 10) * 10) / 10, // 10-50°C
        unit: "°C",
        type: "temperature",
      }
    case "humidity":
      return {
        ...baseData,
        value: Math.round(Math.random() * 100), // 0-100%
        unit: "%",
        type: "humidity",
      }
    case "pressure":
      return {
        ...baseData,
        value: Math.round((Math.random() * 200 + 900) * 10) / 10, // 900-1100 hPa
        unit: "hPa",
        type: "pressure",
      }
    default:
      return {
        ...baseData,
        value: Math.round(Math.random() * 100 * 10) / 10,
        unit: "units",
        type: "generic",
      }
  }
}
