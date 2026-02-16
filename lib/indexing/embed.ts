import { prisma } from "@/lib/db"
import { batchEmbed } from "@/lib/embeddings"
import type { Chunk } from "./chunk"

export async function embedAndStore(
  sourceId: string,
  chunks: Chunk[]
): Promise<void> {
  if (chunks.length === 0) return

  await prisma.docChunk.createMany({
    data: chunks.map((c) => ({
      sourceId,
      content: c.content,
      heading: c.heading,
      url: c.url,
      filePath: c.filePath,
      chunkIndex: c.chunkIndex,
      tokenCount: c.tokenCount,
    })),
  })

  const storedChunks = await prisma.docChunk.findMany({
    where: { sourceId },
    orderBy: { chunkIndex: "asc" },
    select: { id: true, content: true },
  })

  const texts = storedChunks.map((c) => c.content)
  const embeddings = await batchEmbed(texts)

  for (let i = 0; i < storedChunks.length; i++) {
    const vectorLiteral = `[${embeddings[i].join(",")}]`
    await prisma.$executeRawUnsafe(
      `UPDATE "DocChunk" SET embedding = $1::vector WHERE id = $2`,
      vectorLiteral,
      storedChunks[i].id
    )
  }
}
