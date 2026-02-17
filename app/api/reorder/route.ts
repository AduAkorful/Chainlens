import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { type, items } = body as {
      type: "sections" | "subsections"
      items: { id: string; order: number }[]
    }

    if (!type || !items || !Array.isArray(items)) {
      return NextResponse.json(
        { error: "type and items[] are required" },
        { status: 400 }
      )
    }

    if (type === "sections") {
      await prisma.$transaction(
        items.map((item) =>
          prisma.section.update({
            where: { id: item.id },
            data: { order: item.order },
          })
        )
      )
    } else if (type === "subsections") {
      await prisma.$transaction(
        items.map((item) =>
          prisma.subsection.update({
            where: { id: item.id },
            data: { order: item.order },
          })
        )
      )
    } else {
      return NextResponse.json(
        { error: "type must be 'sections' or 'subsections'" },
        { status: 400 }
      )
    }

    return NextResponse.json({ reordered: true, count: items.length })
  } catch (error) {
    console.error("PATCH /api/reorder error:", error)
    return NextResponse.json(
      { error: "Failed to reorder" },
      { status: 500 }
    )
  }
}
