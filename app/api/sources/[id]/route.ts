import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const source = await prisma.docSource.findUnique({
      where: { id: params.id },
      include: {
        section: { select: { id: true, name: true, slug: true } },
        subsection: { select: { id: true, name: true, slug: true } },
        _count: { select: { chunks: true } },
      },
    })

    if (!source) {
      return NextResponse.json({ error: "Source not found" }, { status: 404 })
    }

    return NextResponse.json(source)
  } catch (error) {
    console.error("GET /api/sources/[id] error:", error)
    return NextResponse.json(
      { error: "Failed to fetch source" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json()
    const { name, version, description, sectionId, subsectionId, refreshCron } =
      body

    const data: Record<string, unknown> = {}
    if (name !== undefined) data.name = name
    if (version !== undefined) data.version = version
    if (description !== undefined) data.description = description
    if (sectionId !== undefined) data.sectionId = sectionId
    if (subsectionId !== undefined) data.subsectionId = subsectionId
    if (refreshCron !== undefined) data.refreshCron = refreshCron

    const source = await prisma.docSource.update({
      where: { id: params.id },
      data,
    })

    return NextResponse.json(source)
  } catch (error) {
    console.error("PATCH /api/sources/[id] error:", error)
    return NextResponse.json(
      { error: "Failed to update source" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const source = await prisma.docSource.findUnique({
      where: { id: params.id },
      include: { _count: { select: { chunks: true } } },
    })

    if (!source) {
      return NextResponse.json({ error: "Source not found" }, { status: 404 })
    }

    const chunkCount = source._count.chunks

    await prisma.docSource.update({
      where: { id: params.id },
      data: { status: "INDEXING" },
    })

    await prisma.docChunk.deleteMany({ where: { sourceId: params.id } })
    await prisma.docSource.delete({ where: { id: params.id } })

    return NextResponse.json({
      deleted: true,
      sourceName: source.name,
      chunksRemoved: chunkCount,
    })
  } catch (error) {
    console.error("DELETE /api/sources/[id] error:", error)
    return NextResponse.json(
      { error: "Failed to delete source" },
      { status: 500 }
    )
  }
}
