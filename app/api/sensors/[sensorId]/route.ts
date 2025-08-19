import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export const runtime = "nodejs"

type Params = { params: Promise<{ sensorId: string }> }

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
    await prisma.sensor.delete({ where: { sensorId } })
    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    if (message.includes("Record to delete does not exist")) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json({ error: message }, { status: 500 })
  }
}


