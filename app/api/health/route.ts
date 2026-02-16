import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET() {
  const results = {
    db: false,
    gemini: false,
    inngest: false,
  }

  try {
    await prisma.$queryRaw`SELECT 1`
    results.db = true
  } catch {
    // db not connected
  }

  try {
    if (process.env.GEMINI_API_KEY) {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`,
        { signal: AbortSignal.timeout(5000) }
      )
      results.gemini = res.ok
    }
  } catch {
    // gemini not reachable
  }

  try {
    if (process.env.INNGEST_EVENT_KEY) {
      results.inngest = true
    }
  } catch {
    // inngest not configured
  }

  return NextResponse.json(results)
}
