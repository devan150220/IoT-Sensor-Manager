import { generateNodeRedFlow } from "@/lib/node-red-utils"
import { type NextRequest, NextResponse } from "next/server"

const NODE_RED_BASE_URL = process.env.NODE_RED_BASE_URL || process.env.NODE_RED_URL || "http://localhost:1880"

export const runtime = "nodejs"

async function checkNodeRedHealth(baseUrl: string) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 2000)
  try {
    const response = await fetch(`${baseUrl}/settings`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      signal: controller.signal,
    })
    return response.ok
  } catch {
    return false
  } finally {
    clearTimeout(timeout)
  }
}

export async function GET() {
  try {
    const isUp = await checkNodeRedHealth(NODE_RED_BASE_URL)
    if (!isUp) {
      return NextResponse.json(
        { error: `Node-RED is not running at ${NODE_RED_BASE_URL}. Start it with 'node-red' and retry.` },
        { status: 503 },
      )
    }
    const response = await fetch(`${NODE_RED_BASE_URL}/flows`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Node-RED-API-Version": "v2",
      },
    })

    if (!response.ok) {
      throw new Error(`Node-RED API error: ${response.status}`)
    }

    const flowsObj = await response.json()
    const flows = Array.isArray(flowsObj) ? flowsObj : flowsObj.flows
    return NextResponse.json({ flows })
  } catch (error) {
    console.error("Error fetching Node-RED flows:", error)
    return NextResponse.json({ error: "Failed to fetch Node-RED flows" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sensorId, brokerUrl, topic, samplePayload } = body

    if (!sensorId || !brokerUrl || !topic) {
      return NextResponse.json({ error: "Missing required fields: sensorId, brokerUrl, topic" }, { status: 400 })
    }

    const isUp = await checkNodeRedHealth(NODE_RED_BASE_URL)
    if (!isUp) {
      return NextResponse.json(
        { error: `Node-RED is not running at ${NODE_RED_BASE_URL}. Start it first, then try again.` },
        { status: 503 },
      )
    }

    // Generate Node-RED flow for the sensor
    const flowData = generateNodeRedFlow({
      sensorId,
      brokerUrl,
      topic,
      samplePayload,
    })

    // Basic validation: ensure brokerUrl is hostname only for Node-RED config
    const sanitizedBroker = brokerUrl.replace(/^mqtt:\/\//, "").replace(/:\d+$/, "")
    flowData.configs.forEach((cfg: any) => {
      if (cfg.type === "mqtt-broker") {
        cfg.broker = sanitizedBroker
        cfg.port = 1883
      }
    })

    // Get current flows from Node-RED
    const currentFlowsResponse = await fetch(`${NODE_RED_BASE_URL}/flows`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Node-RED-API-Version": "v2",
      },
    })

    if (!currentFlowsResponse.ok) {
      throw new Error(`Failed to fetch current flows: ${currentFlowsResponse.status}`)
    }

    const currentFlowsObj = await currentFlowsResponse.json()
    const currentFlows = Array.isArray(currentFlowsObj) ? currentFlowsObj : currentFlowsObj.flows
    const currentRev = Array.isArray(currentFlowsObj) ? undefined : currentFlowsObj.rev
    if (!Array.isArray(currentFlows)) {
      throw new Error("Unexpected Node-RED flows response format")
    }

    // Prevent duplicate flow tabs by id
    const existingIds = new Set(currentFlows.map((n: any) => n.id))
    const nodesToAdd = [...flowData.nodes, ...flowData.configs].filter((n) => !existingIds.has(n.id))
    const updatedFlows = [...currentFlows, ...nodesToAdd]

    // Deploy updated flows to Node-RED
    const deployResponse = await fetch(`${NODE_RED_BASE_URL}/flows`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Node-RED-Deployment-Type": "flows",
        "Node-RED-API-Version": "v2",
      },
      body: JSON.stringify({ flows: updatedFlows, rev: currentRev, deployment: "flows" }),
    })

    if (!deployResponse.ok) {
      const text = await deployResponse.text()
      throw new Error(`Failed to deploy flow: ${deployResponse.status} ${text}`)
    }

    return NextResponse.json({
      success: true,
      flowId: flowData.flowId,
      message: "Node-RED flow created and deployed successfully",
    })
  } catch (error) {
    console.error("Error creating Node-RED flow:", error)
    const message = error instanceof Error ? error.message : "Failed to create Node-RED flow"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
