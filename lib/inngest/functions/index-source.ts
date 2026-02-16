import { inngest } from "../client"
import { prisma } from "@/lib/db"
import { crawlUrl } from "@/lib/indexing/crawl-url"
import { crawlGithub } from "@/lib/indexing/crawl-github"
import { parsePdf } from "@/lib/indexing/parse-pdf"
import { chunkContent, type RawContent } from "@/lib/indexing/chunk"
import { embedAndStore } from "@/lib/indexing/embed"

export const indexSource = inngest.createFunction(
  { id: "index-doc-source", name: "Index Documentation Source" },
  { event: "source/index.requested" },
  async ({ event, step }) => {
    const { sourceId } = event.data as { sourceId: string }

    const source = await step.run("fetch-source", async () => {
      const s = await prisma.docSource.findUnique({ where: { id: sourceId } })
      if (!s) throw new Error(`Source ${sourceId} not found`)
      return s
    })

    await step.run("set-indexing-status", async () => {
      await prisma.docSource.update({
        where: { id: sourceId },
        data: { status: "INDEXING", errorLog: null },
      })
    })

    await step.run("delete-existing-chunks", async () => {
      await prisma.docChunk.deleteMany({ where: { sourceId } })
      await prisma.docSource.update({
        where: { id: sourceId },
        data: { chunkCount: 0 },
      })
    })

    try {
      let rawContent: RawContent[] = []

      await step.run("crawl-content", async () => {
        switch (source.type) {
          case "URL":
            rawContent = await crawlUrl({
              url: source.url!,
              depth: source.crawlDepth ?? 1,
              includePatterns: source.includePatterns
                ? source.includePatterns.split(",").map((p) => p.trim())
                : undefined,
              excludePatterns: source.excludePatterns
                ? source.excludePatterns.split(",").map((p) => p.trim())
                : undefined,
            })
            break
          case "GITHUB_REPO":
            rawContent = await crawlGithub({
              url: source.url!,
              branch: source.branch ?? "main",
              indexOptions: source.indexOptions
                ? JSON.parse(source.indexOptions)
                : undefined,
            })
            break
          case "PDF":
            rawContent = await parsePdf(source.url!)
            break
        }
      })

      const chunks = await step.run("chunk-content", async () => {
        return chunkContent(rawContent)
      })

      await step.run("embed-and-store", async () => {
        await embedAndStore(sourceId, chunks)
      })

      await step.run("set-ready-status", async () => {
        await prisma.docSource.update({
          where: { id: sourceId },
          data: {
            status: "READY",
            chunkCount: chunks.length,
            lastIndexedAt: new Date(),
          },
        })
      })

      return { success: true, chunks: chunks.length }
    } catch (error) {
      await step.run("set-error-status", async () => {
        const message =
          error instanceof Error ? error.message : "Unknown error"
        await prisma.docSource.update({
          where: { id: sourceId },
          data: {
            status: "ERROR",
            errorLog: message,
          },
        })
      })

      throw error
    }
  }
)
