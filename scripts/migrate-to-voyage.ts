/**
 * Migration: Gemini (768d) -> Voyage AI (1024d)
 *
 * This script:
 * 1. Alters the vector column from vector(768) to vector(1024)
 * 2. Clears all existing embeddings (they're incompatible)
 * 3. Marks all READY sources as PENDING so they get re-indexed
 *
 * Run: npx tsx scripts/migrate-to-voyage.ts
 */
import "dotenv/config"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  console.log("=== Migrating from Gemini (768d) to Voyage AI (1024d) ===\n")

  // Step 1: Alter the vector column
  console.log("[1/4] Altering vector column from vector(768) to vector(1024)...")
  try {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "DocChunk" ALTER COLUMN embedding TYPE vector(1024) USING NULL`
    )
    console.log("  Done.\n")
  } catch (err: any) {
    if (err.message?.includes("already")) {
      console.log("  Column already at correct dimension.\n")
    } else {
      throw err
    }
  }

  // Step 2: Clear all existing embeddings
  console.log("[2/4] Clearing all existing embeddings...")
  const cleared = await prisma.$executeRawUnsafe(
    `UPDATE "DocChunk" SET embedding = NULL WHERE embedding IS NOT NULL`
  )
  console.log(`  Cleared ${cleared} embeddings.\n`)

  // Step 3: Mark READY sources as PENDING for re-indexing
  console.log("[3/4] Marking READY sources as PENDING for re-indexing...")
  const updated = await prisma.docSource.updateMany({
    where: { status: "READY" },
    data: { status: "PENDING" },
  })
  console.log(`  Marked ${updated.count} sources as PENDING.\n`)

  // Step 4: Verify
  console.log("[4/4] Verification...")
  const embedCount: [{ count: bigint }] = await prisma.$queryRaw`
    SELECT COUNT(*) as count FROM "DocChunk" WHERE embedding IS NOT NULL
  `
  console.log(`  Chunks with embeddings: ${embedCount[0].count} (should be 0)`)

  const pendingCount = await prisma.docSource.count({ where: { status: "PENDING" } })
  console.log(`  Sources in PENDING state: ${pendingCount}`)

  console.log("\n=== Migration complete ===")
  console.log("Next steps:")
  console.log("  1. Get your Voyage API key from https://dash.voyageai.com")
  console.log("  2. Set VOYAGE_API_KEY in .env.local and .env")
  console.log("  3. Run: npx prisma db push")
  console.log("  4. Start the app and trigger indexing from Settings page")

  await prisma.$disconnect()
}

main().catch(async (err) => {
  console.error("Migration failed:", err)
  await prisma.$disconnect()
  process.exit(1)
})
