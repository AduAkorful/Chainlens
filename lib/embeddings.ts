import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
const model = genAI.getGenerativeModel({ model: "text-embedding-004" })

export async function embedText(text: string): Promise<number[]> {
  const result = await model.embedContent(text)
  return result.embedding.values
}

export async function batchEmbed(texts: string[]): Promise<number[][]> {
  const results: number[][] = []
  const batchSize = 50

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize)
    const embeddings = await Promise.all(batch.map((t) => embedText(t)))
    results.push(...embeddings)

    if (i + batchSize < texts.length) {
      await new Promise((r) => setTimeout(r, 1200))
    }
  }

  return results
}
