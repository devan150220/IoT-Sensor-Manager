import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export const runtime = "nodejs"

export async function GET() {
  try {
    const sensors = await prisma.sensor.findMany({ orderBy: { createdAt: "desc" } })
    return NextResponse.json({ sensors })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { sensorId, brokerUrl, topic, description, samplePayload, nodeRedFlowId } = body as {
      sensorId: string
      brokerUrl: string
      topic: string
      description?: string
      samplePayload: string
      nodeRedFlowId?: string
    }
    if (!sensorId || !brokerUrl || !topic || !samplePayload) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }
    const created = await prisma.sensor.upsert({
      where: { sensorId },
      update: { brokerUrl, topic, description, samplePayload, nodeRedFlowId },
      create: { sensorId, brokerUrl, topic, description, samplePayload, nodeRedFlowId },
    })
    return NextResponse.json({ success: true, sensor: created })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}


