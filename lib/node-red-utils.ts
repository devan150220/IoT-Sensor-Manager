import type { NodeRedNode } from "@/types/sensor"

interface FlowGenerationParams {
  sensorId: string
  brokerUrl: string
  topic: string
  samplePayload: string
}

export function generateNodeRedFlow(params: FlowGenerationParams) {
  const { sensorId, brokerUrl, topic, samplePayload } = params
  const flowId = `flow_${sensorId}_${Date.now()}`
  const mqttNodeId = `mqtt_${sensorId}_${Date.now()}`
  const jsonNodeId = `json_${sensorId}_${Date.now()}`
  const debugNodeId = `debug_${sensorId}_${Date.now()}`
  const brokerConfigId = `broker_${sensorId}_${Date.now()}`

  // Flow tab
  const flowTab: NodeRedNode = {
    id: flowId,
    type: "tab",
    label: `Sensor: ${sensorId}`,
    disabled: false,
    info: `Auto-generated flow for sensor ${sensorId}\nTopic: ${topic}\nBroker: ${brokerUrl}`,
    env: [],
    x: 0,
    y: 0,
    z: "",
    wires: [],
  }

  // MQTT Broker Configuration
  const brokerConfig = {
    id: brokerConfigId,
    type: "mqtt-broker",
    name: `${sensorId} Broker`,
    broker: brokerUrl,
    port: 1883,
    clientid: `nodered_${sensorId}`,
    autoConnect: true,
    usetls: false,
    protocolVersion: "4",
    keepalive: 60,
    cleansession: true,
    birthTopic: "",
    birthQos: "0",
    birthPayload: "",
    birthMsg: {},
    closeTopic: "",
    closeQos: "0",
    closePayload: "",
    closeMsg: {},
    willTopic: "",
    willQos: "0",
    willPayload: "",
    willMsg: {},
    userProps: "",
    sessionExpiry: "",
  }

  // MQTT Input Node
  const mqttNode: NodeRedNode = {
    id: mqttNodeId,
    type: "mqtt in",
    z: flowId,
    name: `${sensorId} Input`,
    topic: topic,
    qos: "0",
    datatype: "auto-detect",
    broker: brokerConfigId,
    nl: false,
    rap: true,
    rh: 0,
    inputs: 0,
    x: 120,
    y: 100,
    wires: [[jsonNodeId]],
  }

  // JSON Parser Node
  const jsonNode: NodeRedNode = {
    id: jsonNodeId,
    type: "json",
    z: flowId,
    name: "Parse JSON",
    property: "payload",
    action: "obj",
    pretty: false,
    x: 300,
    y: 100,
    wires: [[debugNodeId]],
  }

  // Debug Node
  const debugNode: NodeRedNode = {
    id: debugNodeId,
    type: "debug",
    z: flowId,
    name: `${sensorId} Debug`,
    active: true,
    tosidebar: true,
    console: false,
    tostatus: false,
    complete: "payload",
    targetType: "msg",
    statusVal: "",
    statusType: "auto",
    x: 480,
    y: 100,
    wires: [],
  }

  return {
    flowId,
    nodes: [flowTab, mqttNode, jsonNode, debugNode],
    configs: [brokerConfig],
    samplePayload: JSON.parse(samplePayload),
  }
}

export function validateNodeRedConnection(baseUrl = "http://localhost:1880") {
  return fetch(`${baseUrl}/settings`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((response) => response.ok)
    .catch(() => false)
}

export function generateFlowExport(flowId: string, sensorId: string, brokerUrl: string, topic: string) {
  const flow = generateNodeRedFlow({
    sensorId,
    brokerUrl,
    topic,
    samplePayload: '{"value": 0, "timestamp": "2025-01-01T00:00:00Z"}',
  })

  return {
    id: flowId,
    label: `Sensor: ${sensorId}`,
    nodes: flow.nodes,
    configs: flow.configs,
    env: [],
    meta: {
      module: "node-red",
      type: "flows",
      version: "1.0.0",
      desc: `Auto-generated flow for IoT sensor ${sensorId}`,
      keywords: ["iot", "mqtt", "sensor", sensorId],
      author: "IoT Sensor Manager",
    },
  }
}
