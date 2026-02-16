export interface RawContent {
  content: string
  heading?: string
  url?: string
  filePath?: string
}

export interface Chunk {
  content: string
  heading: string | null
  url: string | null
  filePath: string | null
  chunkIndex: number
  tokenCount: number
}

const APPROX_CHARS_PER_TOKEN = 4
const TARGET_TOKENS = 512
const OVERLAP_TOKENS = 50
const CODE_BLOCK_MAX_TOKENS = 800

const TARGET_CHARS = TARGET_TOKENS * APPROX_CHARS_PER_TOKEN
const OVERLAP_CHARS = OVERLAP_TOKENS * APPROX_CHARS_PER_TOKEN
const _CODE_BLOCK_MAX_CHARS = CODE_BLOCK_MAX_TOKENS * APPROX_CHARS_PER_TOKEN

function estimateTokens(text: string): number {
  return Math.ceil(text.length / APPROX_CHARS_PER_TOKEN)
}

function splitAtSentenceBoundary(text: string, maxChars: number): [string, string] {
  if (text.length <= maxChars) return [text, ""]

  const cutRegion = text.slice(0, maxChars + 100)
  const sentenceEnders = /[.!?]\s/g
  let lastEnd = -1
  let match

  while ((match = sentenceEnders.exec(cutRegion)) !== null) {
    if (match.index <= maxChars) {
      lastEnd = match.index + 1
    }
  }

  if (lastEnd > maxChars * 0.5) {
    return [text.slice(0, lastEnd).trim(), text.slice(lastEnd).trim()]
  }

  const lineBreak = text.lastIndexOf("\n", maxChars)
  if (lineBreak > maxChars * 0.5) {
    return [text.slice(0, lineBreak).trim(), text.slice(lineBreak).trim()]
  }

  const space = text.lastIndexOf(" ", maxChars)
  if (space > maxChars * 0.3) {
    return [text.slice(0, space).trim(), text.slice(space).trim()]
  }

  return [text.slice(0, maxChars).trim(), text.slice(maxChars).trim()]
}

function extractCodeBlocks(
  text: string
): { type: "text" | "code"; content: string }[] {
  const parts: { type: "text" | "code"; content: string }[] = []
  const codeBlockRegex = /```[\s\S]*?```/g
  let lastIndex = 0
  let match

  while ((match = codeBlockRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: "text", content: text.slice(lastIndex, match.index) })
    }
    parts.push({ type: "code", content: match[0] })
    lastIndex = match.index + match[0].length
  }

  if (lastIndex < text.length) {
    parts.push({ type: "text", content: text.slice(lastIndex) })
  }

  return parts
}

function chunkSingleContent(raw: RawContent): Chunk[] {
  const chunks: Chunk[] = []
  const parts = extractCodeBlocks(raw.content)
  let buffer = ""
  let chunkIndex = 0

  const flushBuffer = () => {
    if (buffer.trim()) {
      chunks.push({
        content: buffer.trim(),
        heading: raw.heading || null,
        url: raw.url || null,
        filePath: raw.filePath || null,
        chunkIndex: chunkIndex++,
        tokenCount: estimateTokens(buffer.trim()),
      })
      const overlap = buffer.trim().slice(-OVERLAP_CHARS)
      buffer = overlap
    }
  }

  for (const part of parts) {
    if (part.type === "code") {
      if (estimateTokens(part.content) <= CODE_BLOCK_MAX_TOKENS) {
        if (estimateTokens(buffer + part.content) > TARGET_TOKENS + 100) {
          flushBuffer()
        }
        buffer += "\n" + part.content + "\n"
      } else {
        flushBuffer()
        buffer = ""

        const lines = part.content.split("\n")
        let codeBuf = ""
        for (const line of lines) {
          if (estimateTokens(codeBuf + line) > TARGET_TOKENS) {
            chunks.push({
              content: codeBuf.trim(),
              heading: raw.heading || null,
              url: raw.url || null,
              filePath: raw.filePath || null,
              chunkIndex: chunkIndex++,
              tokenCount: estimateTokens(codeBuf.trim()),
            })
            codeBuf = line + "\n"
          } else {
            codeBuf += line + "\n"
          }
        }
        if (codeBuf.trim()) {
          buffer = codeBuf
        }
      }
    } else {
      buffer += part.content
      while (estimateTokens(buffer) > TARGET_TOKENS) {
        const [chunk, rest] = splitAtSentenceBoundary(buffer, TARGET_CHARS)
        if (!chunk) break
        chunks.push({
          content: chunk,
          heading: raw.heading || null,
          url: raw.url || null,
          filePath: raw.filePath || null,
          chunkIndex: chunkIndex++,
          tokenCount: estimateTokens(chunk),
        })
        const overlap = chunk.slice(-OVERLAP_CHARS)
        buffer = overlap + rest
      }
    }
  }

  if (buffer.trim()) {
    chunks.push({
      content: buffer.trim(),
      heading: raw.heading || null,
      url: raw.url || null,
      filePath: raw.filePath || null,
      chunkIndex: chunkIndex++,
      tokenCount: estimateTokens(buffer.trim()),
    })
  }

  return chunks
}

export function chunkContent(rawContents: RawContent[]): Chunk[] {
  const allChunks: Chunk[] = []

  for (const raw of rawContents) {
    const chunks = chunkSingleContent(raw)
    allChunks.push(...chunks)
  }

  let globalIndex = 0
  for (const chunk of allChunks) {
    chunk.chunkIndex = globalIndex++
  }

  return allChunks
}
