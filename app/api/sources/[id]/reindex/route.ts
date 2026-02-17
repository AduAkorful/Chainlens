import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { inngest } from "@/lib/inngest/client"

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const source = await prisma.docSource.findUnique({
      where: { id: params.id },
    })

    if (!source) {
      return NextResponse.json({ error: "Source not found" }, { status: 404 })
    }

    if (source.status === "INDEXING") {
      return NextResponse.json(
        { error: "Source is already being indexed" },
        { status: 409 }
      )
    }

    await prisma.docSource.update({
      where: { id: params.id },
      data: { status: "PENDING" },
    })

    let inngestSent = false
    let inngestError: string | null = null
    try {
      await inngest.send({
        name: "source/index.requested",
        data: { sourceId: params.id },
      })
      inngestSent = true
    } catch (err: any) {
      inngestError = err?.message || "Unknown Inngest error"
      console.warn("Failed to send Inngest event:", inngestError)
    }

    return NextResponse.json({
      success: true,
      message: inngestSent ? "Reindex job queued" : "Status set to PENDING but Inngest event failed to send",
      inngestSent,
      inngestError,
    })
  } catch (error) {
    console.error("POST /api/sources/[id]/reindex error:", error)
    return NextResponse.json(
      { error: "Failed to trigger reindex" },
      { status: 500 }
    )
  }
}
