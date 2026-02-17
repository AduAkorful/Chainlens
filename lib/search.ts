import { prisma } from "@/lib/db"
import { embedText } from "@/lib/embeddings"
import { Prisma } from "@prisma/client"

interface RawChunk {
  id: string
  content: string
  heading: string | null
  url: string | null
  filePath: string | null
  sourceId: string
  sourceName: string
  version: string | null
  vector_score?: number
  text_score?: number
}

export interface SearchResult {
  chunkId: string
  content: string
  heading: string | null
  sourceName: string
  sourceUrl: string | null
  filePath: string | null
  version: string | null
  relevanceScore: number
}

export async function hybridSearch(params: {
  query: string
  sourceIds: string[]
  limit?: number
  version?: string
}): Promise<{
  results: SearchResult[]
  totalResults: number
  sourcesSearched: string[]
  queryTimeMs: number
}> {
  const start = Date.now()
  const limit = Math.min(params.limit ?? 8, 20)

  if (params.sourceIds.length === 0) {
    return {
      results: [],
      totalResults: 0,
      sourcesSearched: [],
      queryTimeMs: Date.now() - start,
    }
  }

  const queryVector = await embedText(params.query, "query")
  const vectorLiteral = `[${queryVector.join(",")}]`

  const versionFilter = params.version
    ? Prisma.sql`AND s.version = ${params.version}`
    : Prisma.empty

  const vectorResults: RawChunk[] = await prisma.$queryRaw`
    SELECT
      c.id, c.content, c.heading, c.url, c."filePath",
      c."sourceId", s.name AS "sourceName", s.version,
      1 - (c.embedding <=> ${vectorLiteral}::vector) AS vector_score
    FROM "DocChunk" c
    JOIN "DocSource" s ON c."sourceId" = s.id
    WHERE c."sourceId" = ANY(${params.sourceIds}::text[])
    ${versionFilter}
    AND c.embedding IS NOT NULL
    ORDER BY c.embedding <=> ${vectorLiteral}::vector
    LIMIT 20
  `

  const textResults: RawChunk[] = await prisma.$queryRaw`
    SELECT
      c.id, c.content, c.heading, c.url, c."filePath",
      c."sourceId", s.name AS "sourceName", s.version,
      ts_rank(c.tsv, plainto_tsquery('english', ${params.query})) AS text_score
    FROM "DocChunk" c
    JOIN "DocSource" s ON c."sourceId" = s.id
    WHERE c."sourceId" = ANY(${params.sourceIds}::text[])
    ${versionFilter}
    AND c.tsv @@ plainto_tsquery('english', ${params.query})
    ORDER BY text_score DESC
    LIMIT 20
  `

  const k = 60
  const scores = new Map<string, { item: RawChunk; score: number }>()

  vectorResults.forEach((item, rank) => {
    const s = 1 / (k + rank + 1)
    const existing = scores.get(item.id)
    scores.set(item.id, { item, score: (existing?.score ?? 0) + s })
  })

  textResults.forEach((item, rank) => {
    const s = 1 / (k + rank + 1)
    const existing = scores.get(item.id)
    scores.set(item.id, { item, score: (existing?.score ?? 0) + s })
  })

  const sorted = Array.from(scores.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)

  const sourcesSearched = Array.from(
    new Set(sorted.map(({ item }) => item.sourceName))
  )

  return {
    results: sorted.map(({ item, score }) => ({
      chunkId: item.id,
      content: item.content,
      heading: item.heading,
      sourceName: item.sourceName,
      sourceUrl: item.url,
      filePath: item.filePath,
      version: item.version,
      relevanceScore: score,
    })),
    totalResults: sorted.length,
    sourcesSearched,
    queryTimeMs: Date.now() - start,
  }
}
