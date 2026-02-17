const VOYAGE_API_KEY = process.env.VOYAGE_API_KEY!
const EMBED_MODEL = "voyage-code-3"
const EMBED_DIMENSIONS = 1024
const EMBED_URL = "https://api.voyageai.com/v1/embeddings"

export { EMBED_DIMENSIONS }

async function embedTextOnce(text: string, inputType: "query" | "document" = "document"): Promise<number[]> {
  const response = await fetch(EMBED_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${VOYAGE_API_KEY}`,
    },
    body: JSON.stringify({
      input: [text],
      model: EMBED_MODEL,
      input_type: inputType,
      output_dimension: EMBED_DIMENSIONS,
      output_dtype: "float",
    }),
    signal: AbortSignal.timeout(30000),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Voyage embed error (${response.status}): ${err}`)
  }

  const data = await response.json()
  return data.data[0].embedding
}

export async function embedText(text: string, inputType: "query" | "document" = "document"): Promise<number[]> {
  const maxRetries = 3
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await embedTextOnce(text, inputType)
    } catch (error: any) {
      const msg = error?.message ?? ""
      if (msg.includes("429") && attempt < maxRetries) {
        const waitSec = 5 * (attempt + 1)
        console.log(`Rate limited, waiting ${waitSec}s before retry ${attempt + 1}/${maxRetries}...`)
        await new Promise((r) => setTimeout(r, waitSec * 1000))
        continue
      }
      throw error
    }
  }
  throw new Error("Embedding failed after max retries")
}

export async function batchEmbed(texts: string[], inputType: "query" | "document" = "document"): Promise<number[][]> {
  const results: number[][] = []
  const BATCH_SIZE = 128

  for (let start = 0; start < texts.length; start += BATCH_SIZE) {
    const batch = texts.slice(start, start + BATCH_SIZE)

    const response = await fetch(EMBED_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${VOYAGE_API_KEY}`,
      },
      body: JSON.stringify({
        input: batch,
        model: EMBED_MODEL,
        input_type: inputType,
        output_dimension: EMBED_DIMENSIONS,
        output_dtype: "float",
      }),
      signal: AbortSignal.timeout(60000),
    })

    if (!response.ok) {
      const err = await response.text()
      if (response.status === 429) {
        console.log("Rate limited on batch, waiting 5s...")
        await new Promise((r) => setTimeout(r, 5000))
        start -= BATCH_SIZE
        continue
      }
      throw new Error(`Voyage batch embed error (${response.status}): ${err}`)
    }

    const data = await response.json()
    const embeddings = data.data.map((d: any) => d.embedding)
    results.push(...embeddings)

    if (start + BATCH_SIZE < texts.length) {
      console.log(`  Embedded ${Math.min(start + BATCH_SIZE, texts.length)}/${texts.length}...`)
    }
  }

  return results
}
