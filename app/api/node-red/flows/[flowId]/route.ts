import { type NextRequest, NextResponse } from "next/server"

const NODE_RED_BASE_URL = process.env.NODE_RED_BASE_URL || process.env.NODE_RED_URL || "http://localhost:1880"

export const runtime = "nodejs"

export async function DELETE(request: NextRequest, { params }: { params: { flowId: string } }) {
  try {
    const { flowId } = params

    // Get current flows
    const currentFlowsResponse = await fetch(`${NODE_RED_BASE_URL}/flows`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!currentFlowsResponse.ok) {
      throw new Error(`Failed to fetch current flows: ${currentFlowsResponse.status}`)
    }

    const currentFlows = await currentFlowsResponse.json()

    // Filter out nodes belonging to the specified flow
    const updatedFlows = currentFlows.filter((node: any) => node.z !== flowId && node.id !== flowId)

    // Deploy updated flows
    const deployResponse = await fetch(`${NODE_RED_BASE_URL}/flows`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Node-RED-Deployment-Type": "full",
        "Node-RED-API-Version": "v2",
      },
      body: JSON.stringify(updatedFlows),
    })

    if (!deployResponse.ok) {
      throw new Error(`Failed to deploy updated flows: ${deployResponse.status}`)
    }

    return NextResponse.json({
      success: true,
      message: "Flow deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting Node-RED flow:", error)
    return NextResponse.json({ error: "Failed to delete Node-RED flow" }, { status: 500 })
  }
}

export async function GET(request: NextRequest, { params }: { params: { flowId: string } }) {
  try {
    const { flowId } = params

    // Get current flows
    const response = await fetch(`${NODE_RED_BASE_URL}/flows`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`Node-RED API error: ${response.status}`)
    }

    const flows = await response.json()

    // Filter nodes belonging to this flow
    const flowNodes = flows.filter((node: any) => node.z === flowId || node.id === flowId)

    return NextResponse.json({ flowNodes })
  } catch (error) {
    console.error("Error fetching Node-RED flow:", error)
    return NextResponse.json({ error: "Failed to fetch flow from Node-RED" }, { status: 500 })
  }
}
