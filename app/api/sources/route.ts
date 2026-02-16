import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { generateSourceSlug, sourceEndpoint } from "@/lib/slug"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const sectionId = searchParams.get("sectionId")
    const subsectionId = searchParams.get("subsectionId")
    const status = searchParams.get("status")

    const where: Record<string, unknown> = {}
    if (sectionId) where.sectionId = sectionId
    if (subsectionId) where.subsectionId = subsectionId
    if (status) where.status = status

    const sources = await prisma.docSource.findMany({
      where,
      include: {
        section: { select: { id: true, name: true } },
        subsection: { select: { id: true, name: true } },
        _count: { select: { chunks: true } },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(sources)
  } catch (error) {
    console.error("GET /api/sources error:", error)
    return NextResponse.json(
      { error: "Failed to fetch sources" },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      name,
      type,
      url,
      version,
      description,
      sectionId,
      subsectionId,
      refreshCron,
      crawlDepth,
      includePatterns,
      excludePatterns,
      branch,
      indexOptions,
    } = body

    if (!name || !type) {
      return NextResponse.json(
        { error: "Name and type are required" },
        { status: 400 }
      )
    }

    if (!["URL", "GITHUB_REPO", "PDF"].includes(type)) {
      return NextResponse.json(
        { error: "Type must be URL, GITHUB_REPO, or PDF" },
        { status: 400 }
      )
    }

    const slug = generateSourceSlug(name)
    const mcpEp = sourceEndpoint(slug)

    const source = await prisma.docSource.create({
      data: {
        name,
        type,
        url: url || null,
        version: version || null,
        description: description || null,
        sectionId: sectionId || null,
        subsectionId: subsectionId || null,
        mcpEndpoint: mcpEp,
        refreshCron: refreshCron || null,
        crawlDepth: crawlDepth ?? 1,
        includePatterns: includePatterns || null,
        excludePatterns: excludePatterns || null,
        branch: branch || null,
        indexOptions: indexOptions ? JSON.stringify(indexOptions) : null,
      },
    })

    return NextResponse.json(source, { status: 201 })
  } catch (error) {
    console.error("POST /api/sources error:", error)
    return NextResponse.json(
      { error: "Failed to create source" },
      { status: 500 }
    )
  }
}
