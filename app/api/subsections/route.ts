import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { generateSlug, subsectionEndpoint } from "@/lib/slug"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const sectionId = searchParams.get("sectionId")

    const where = sectionId ? { sectionId } : {}

    const subsections = await prisma.subsection.findMany({
      where,
      include: {
        sources: {
          select: { id: true, name: true, status: true, chunkCount: true },
        },
        section: { select: { name: true, slug: true } },
      },
      orderBy: { order: "asc" },
    })

    return NextResponse.json(subsections)
  } catch (error) {
    console.error("GET /api/subsections error:", error)
    return NextResponse.json(
      { error: "Failed to fetch subsections" },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, description, icon, sectionId } = body

    if (!name || !sectionId) {
      return NextResponse.json(
        { error: "Name and sectionId are required" },
        { status: 400 }
      )
    }

    const section = await prisma.section.findUnique({
      where: { id: sectionId },
    })
    if (!section) {
      return NextResponse.json(
        { error: "Parent section not found" },
        { status: 404 }
      )
    }

    const slug = generateSlug(name)
    const mcpEndpoint = subsectionEndpoint(section.slug, slug)

    const existing = await prisma.subsection.findUnique({
      where: { sectionId_slug: { sectionId, slug } },
    })
    if (existing) {
      return NextResponse.json(
        { error: "A subsection with this name already exists in this section" },
        { status: 409 }
      )
    }

    const maxOrder = await prisma.subsection.aggregate({
      where: { sectionId },
      _max: { order: true },
    })
    const nextOrder = (maxOrder._max.order ?? -1) + 1

    const subsection = await prisma.subsection.create({
      data: {
        name,
        slug,
        description: description || null,
        icon: icon || null,
        order: nextOrder,
        sectionId,
        mcpEndpoint,
      },
    })

    return NextResponse.json(subsection, { status: 201 })
  } catch (error) {
    console.error("POST /api/subsections error:", error)
    return NextResponse.json(
      { error: "Failed to create subsection" },
      { status: 500 }
    )
  }
}
