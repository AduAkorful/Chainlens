import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const subsection = await prisma.subsection.findUnique({
      where: { id: params.id },
      include: {
        sources: true,
        section: { select: { id: true, name: true, slug: true } },
      },
    })

    if (!subsection) {
      return NextResponse.json(
        { error: "Subsection not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(subsection)
  } catch (error) {
    console.error("GET /api/subsections/[id] error:", error)
    return NextResponse.json(
      { error: "Failed to fetch subsection" },
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

    const subsection = await prisma.subsection.update({
      where: { id: params.id },
      data,
    })

    return NextResponse.json(subsection)
  } catch (error) {
    console.error("PATCH /api/subsections/[id] error:", error)
    return NextResponse.json(
      { error: "Failed to update subsection" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const subsection = await prisma.subsection.findUnique({
      where: { id: params.id },
      include: {
        sources: { include: { _count: { select: { chunks: true } } } },
      },
    })

    if (!subsection) {
      return NextResponse.json(
        { error: "Subsection not found" },
        { status: 404 }
      )
    }

    const sourceCount = subsection.sources.length
    const chunkCount = subsection.sources.reduce(
      (acc, s) => acc + s._count.chunks,
      0
    )

    await prisma.subsection.delete({ where: { id: params.id } })

    return NextResponse.json({
      deleted: true,
      subsectionName: subsection.name,
      sourceCount,
      chunkCount,
    })
  } catch (error) {
    console.error("DELETE /api/subsections/[id] error:", error)
    return NextResponse.json(
      { error: "Failed to delete subsection" },
      { status: 500 }
    )
  }
}
