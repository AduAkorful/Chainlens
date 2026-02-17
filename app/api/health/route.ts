import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET() {
  const results = {
    db: false,
    voyage: false,
    inngest: false,
  }

  try {
    await prisma.$queryRaw`SELECT 1`
    results.db = true
  } catch {
    // db not connected
  }

  try {
    if (process.env.VOYAGE_API_KEY) {
      const res = await fetch("https://api.voyageai.com/v1/embeddings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.VOYAGE_API_KEY}`,
        },
        body: JSON.stringify({
          input: ["health check"],
          model: "voyage-code-3",
          input_type: "document",
          output_dimension: 1024,
        }),
        signal: AbortSignal.timeout(10000),
      })
      results.voyage = res.ok
    }
  } catch {
    // voyage not reachable
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
