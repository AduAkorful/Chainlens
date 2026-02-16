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

    await inngest.send({
      name: "source/index.requested",
      data: { sourceId: params.id },
    })

    return NextResponse.json({
      success: true,
      message: "Reindex job queued",
    })
  } catch (error) {
    console.error("POST /api/sources/[id]/reindex error:", error)
    return NextResponse.json(
      { error: "Failed to trigger reindex" },
      { status: 500 }
    )
  }
}
