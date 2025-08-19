import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export const runtime = "nodejs"

type Params = { params: Promise<{ sensorId: string }> }

const NODE_RED_BASE_URL = process.env.NODE_RED_BASE_URL || process.env.NODE_RED_URL || "http://localhost:1880"

async function getFlowsV2() {
  const res = await fetch(`${NODE_RED_BASE_URL}/flows`, {
    method: "GET",
    headers: { "Content-Type": "application/json", "Node-RED-API-Version": "v2" },
  })
  if (!res.ok) throw new Error(`Node-RED fetch flows failed: ${res.status}`)
  const body = await res.json()
  const flows = Array.isArray(body) ? body : body.flows
  const rev = Array.isArray(body) ? undefined : body.rev
  return { flows, rev }
}

async function deployFlowsV2(flows: any[], rev?: string) {
  const res = await fetch(`${NODE_RED_BASE_URL}/flows`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Node-RED-Deployment-Type": "flows",
      "Node-RED-API-Version": "v2",
    },
    body: JSON.stringify({ flows, rev, deployment: "flows" }),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Node-RED deploy flows failed: ${res.status} ${text}`)
  }
}

export async function GET(_request: Request, { params }: Params) {
  try {
    const { sensorId } = await params
    const sensor = await prisma.sensor.findUnique({ where: { sensorId } })
    if (!sensor) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json({ sensor })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: Params) {
  try {
    const body = await request.json()
    const { sensorId } = await params
    const allowed = (({
      brokerUrl,
      topic,
      description,
      samplePayload,
      status,
      nodeRedFlowId,
      lastSeen,
    }) => ({ brokerUrl, topic, description, samplePayload, status, nodeRedFlowId, lastSeen }))(body)

    // If status change requested, toggle Node-RED flow tab disabled accordingly
    if (typeof allowed.status === "string") {
      const current = await prisma.sensor.findUnique({ where: { sensorId } })
      if (current?.nodeRedFlowId) {
        const desiredDisabled = allowed.status === "disconnected"
        try {
          const { flows, rev } = await getFlowsV2()
          let changed = false
          const updatedFlows = flows.map((n: any) => {
            if (n.id === current.nodeRedFlowId && n.type === "tab") {
              if (n.disabled !== desiredDisabled) {
                changed = true
                return { ...n, disabled: desiredDisabled }
              }
            }
            return n
          })
          if (changed) {
            await deployFlowsV2(updatedFlows, rev)
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err)
          return NextResponse.json({ error: `Failed to update Node-RED flow state: ${msg}` }, { status: 502 })
        }
      }
    }

    const updated = await prisma.sensor.update({ where: { sensorId }, data: allowed })
    return NextResponse.json({ success: true, sensor: updated })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    if (message.includes("Record to update not found")) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const { sensorId } = await params
    const sensor = await prisma.sensor.findUnique({ where: { sensorId } })
    if (!sensor) return NextResponse.json({ error: "Not found" }, { status: 404 })

    let flowDeleted = false
    if (sensor.nodeRedFlowId) {
      try {
        const { flows, rev } = await getFlowsV2()
        const updated = flows.filter((n: any) => n.z !== sensor.nodeRedFlowId && n.id !== sensor.nodeRedFlowId)
        flowDeleted = updated.length !== flows.length
        if (flowDeleted) {
          await deployFlowsV2(updated, rev)
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        return NextResponse.json({ error: `Failed to delete Node-RED flow: ${msg}` }, { status: 502 })
      }
    }

    await prisma.sensor.delete({ where: { sensorId } })
    return NextResponse.json({ success: true, flowDeleted })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    if (message.includes("Record to delete does not exist")) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json({ error: message }, { status: 500 })
  }
}


