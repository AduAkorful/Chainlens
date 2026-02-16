import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { generateSlug, sectionEndpoint } from "@/lib/slug"

export async function GET() {
  try {
    const sections = await prisma.section.findMany({
      include: {
        subsections: {
          include: {
            sources: {
              select: { id: true, name: true, status: true, chunkCount: true },
            },
          },
          orderBy: { order: "asc" },
        },
        sources: {
          select: { id: true, name: true, status: true, chunkCount: true },
        },
      },
      orderBy: { order: "asc" },
    })

    return NextResponse.json(sections)
  } catch (error) {
    console.error("GET /api/sections error:", error)
    return NextResponse.json(
      { error: "Failed to fetch sections" },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, description, icon } = body

    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      )
    }

    const slug = generateSlug(name)
    const mcpEndpoint = sectionEndpoint(slug)

    const existing = await prisma.section.findUnique({ where: { slug } })
    if (existing) {
      return NextResponse.json(
        { error: "A section with this name already exists" },
        { status: 409 }
      )
    }

    const maxOrder = await prisma.section.aggregate({ _max: { order: true } })
    const nextOrder = (maxOrder._max.order ?? -1) + 1

    const section = await prisma.section.create({
      data: {
        name,
        slug,
        description: description || null,
        icon: icon || null,
        order: nextOrder,
        mcpEndpoint,
      },
    })

    return NextResponse.json(section, { status: 201 })
  } catch (error) {
    console.error("POST /api/sections error:", error)
    return NextResponse.json(
      { error: "Failed to create section" },
      { status: 500 }
    )
  }
}
