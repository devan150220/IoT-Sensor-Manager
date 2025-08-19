import { NextResponse } from "next/server"

export const runtime = "nodejs"

const NODE_RED_BASE_URL = process.env.NODE_RED_BASE_URL || process.env.NODE_RED_URL || "http://localhost:1880"

export async function GET() {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 2000)
    const response = await fetch(`${NODE_RED_BASE_URL}/settings`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
    })
    clearTimeout(timeout)
    if (!response.ok) {
      return NextResponse.json({ ok: false, url: NODE_RED_BASE_URL, status: response.status }, { status: 503 })
    }
    return NextResponse.json({ ok: true, url: NODE_RED_BASE_URL })
  } catch (error) {
    return NextResponse.json({ ok: false, url: NODE_RED_BASE_URL, error: "ECONNREFUSED" }, { status: 503 })
  }
}


