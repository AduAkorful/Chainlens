import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const section = await prisma.section.findUnique({
      where: { id: params.id },
      include: {
        subsections: {
          include: {
            sources: true,
          },
          orderBy: { order: "asc" },
        },
        sources: true,
      },
    })

    if (!section) {
      return NextResponse.json({ error: "Section not found" }, { status: 404 })
    }

    return NextResponse.json(section)
  } catch (error) {
    console.error("GET /api/sections/[id] error:", error)
    return NextResponse.json(
      { error: "Failed to fetch section" },
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
    const { name, description, icon, order } = body

    const data: Record<string, unknown> = {}
    if (name !== undefined) data.name = name
    if (description !== undefined) data.description = description
    if (icon !== undefined) data.icon = icon
    if (order !== undefined) data.order = order

    const section = await prisma.section.update({
      where: { id: params.id },
      data,
    })

    return NextResponse.json(section)
  } catch (error) {
    console.error("PATCH /api/sections/[id] error:", error)
    return NextResponse.json(
      { error: "Failed to update section" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const section = await prisma.section.findUnique({
      where: { id: params.id },
      include: {
        subsections: {
          include: { sources: { include: { _count: { select: { chunks: true } } } } },
        },
        sources: { include: { _count: { select: { chunks: true } } } },
      },
    })

    if (!section) {
      return NextResponse.json({ error: "Section not found" }, { status: 404 })
    }

    const subsectionCount = section.subsections.length
    const directSourceCount = section.sources.length
    const subsectionSourceCount = section.subsections.reduce(
      (acc, sub) => acc + sub.sources.length,
      0
    )
    const sourceCount = directSourceCount + subsectionSourceCount
    const chunkCount =
      section.sources.reduce((acc, s) => acc + s._count.chunks, 0) +
      section.subsections.reduce(
        (acc, sub) =>
          acc + sub.sources.reduce((a, s) => a + s._count.chunks, 0),
        0
      )

    await prisma.section.delete({ where: { id: params.id } })

    return NextResponse.json({
      deleted: true,
      sectionName: section.name,
      subsectionCount,
      sourceCount,
      chunkCount,
    })
  } catch (error) {
    console.error("DELETE /api/sections/[id] error:", error)
    return NextResponse.json(
      { error: "Failed to delete section" },
      { status: 500 }
    )
  }
}
