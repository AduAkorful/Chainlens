import type { RawContent } from "./chunk"

export async function parsePdf(url: string): Promise<RawContent[]> {
  const pdfParseModule = await import("pdf-parse")
  const pdfParse = (pdfParseModule as any).default || pdfParseModule
  const results: RawContent[] = []

  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(60000),
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch PDF: ${response.statusText}`)
    }

    const buffer = Buffer.from(await response.arrayBuffer())
    const data = await pdfParse(buffer)

    const text = data.text
    const lines = text.split("\n")
    let currentHeading = "Document"
    let currentContent = ""
    let lastPageNum = ""

    for (const line of lines) {
      const trimmed = line.trim()

      if (!trimmed) {
        currentContent += "\n"
        continue
      }

      if (/^\d+$/.test(trimmed) && trimmed.length <= 4) {
        lastPageNum = trimmed
        continue
      }

      const isHeading =
        (trimmed === trimmed.toUpperCase() &&
          trimmed.length > 3 &&
          trimmed.length < 100 &&
          !trimmed.includes(".") &&
          !/^\d/.test(trimmed)) ||
        /^\d+\.\s+[A-Z]/.test(trimmed)

      if (isHeading) {
        if (currentContent.trim()) {
          results.push({
            content: currentContent.trim(),
            heading: currentHeading,
            url,
          })
        }
        currentHeading = trimmed
        currentContent = ""
      } else {
        currentContent += trimmed + "\n"
      }
    }

    if (currentContent.trim()) {
      results.push({
        content: currentContent.trim(),
        heading: currentHeading,
        url,
      })
    }
  } catch (error) {
    throw new Error(
      `Failed to parse PDF from ${url}: ${error instanceof Error ? error.message : "Unknown error"}`
    )
  }

  return results
}
