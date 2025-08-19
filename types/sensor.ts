export interface Sensor {
  id: string
  sensorId: string
  brokerUrl: string
  topic: string
  description?: string
  samplePayload: string
  status: "connected" | "disconnected" | "error"
  createdAt: string
  lastSeen?: string
  nodeRedFlowId?: string
}

export interface SensorData {
  value: number
  timestamp: string
  unit?: string
  [key: string]: any
}

export interface NodeRedFlow {
  id: string
  label: string
  nodes: NodeRedNode[]
  configs: any[]
}

export interface NodeRedNode {
  id: string
  type: string
  name?: string
  topic?: string
  server?: string
  x: number
  y: number
  z: string
  wires: string[][]
  [key: string]: any
}

export interface MqttConnectionConfig {
  brokerUrl: string
  port?: number
  username?: string
  password?: string
  clientId?: string
  qos: 0 | 1 | 2
}
