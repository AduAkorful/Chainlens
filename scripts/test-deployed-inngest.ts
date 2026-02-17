import "dotenv/config"

const BASE = "https://chainlens-pi.vercel.app"

async function apiCall(method: string, path: string, body?: any) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(30000),
  })
  return { status: res.status, data: await res.json() }
}

async function main() {
  console.log("=== Testing Inngest Event Delivery ===\n")

  // Create test source
  const create = await apiCall("POST", "/api/sources", {
    name: "INNGEST-DIAG-TEST",
    type: "URL",
    url: "https://eips.ethereum.org/EIPS/eip-20",
    crawlDepth: 0,
  })
  if (!create.data?.id) {
    console.error("Failed to create source:", create.data)
    process.exit(1)
  }
  const id = create.data.id
  console.log(`Created source: ${id}`)

  // Trigger reindex and check if Inngest event was sent
  const reindex = await apiCall("POST", `/api/sources/${id}/reindex`)
  console.log("\nReindex response:", JSON.stringify(reindex.data, null, 2))

  if (reindex.data.inngestSent === false) {
    console.log("\n>>> INNGEST EVENT FAILED TO SEND <<<")
    console.log("Error:", reindex.data.inngestError)
    console.log("\nThis means either:")
    console.log("  1. INNGEST_EVENT_KEY in Vercel is not a valid Inngest Cloud key")
    console.log("  2. Inngest integration is not installed on Vercel")
    console.log("  3. The app has not been synced with Inngest Cloud")
    console.log("\nTo fix:")
    console.log("  1. Go to https://app.inngest.com -> Apps -> Sync New App")
    console.log("  2. Enter URL: https://chainlens-pi.vercel.app/api/webhooks/inngest")
    console.log("  3. Or install the Inngest Vercel integration: https://vercel.com/integrations/inngest")
  } else if (reindex.data.inngestSent === true) {
    console.log("\n>>> INNGEST EVENT SENT SUCCESSFULLY <<<")
    console.log("Polling for status change...")

    for (let i = 0; i < 24; i++) {
      await new Promise(r => setTimeout(r, 5000))
      const check = await apiCall("GET", `/api/sources/${id}`)
      const elapsed = (i + 1) * 5
      console.log(`  [${elapsed}s] Status: ${check.data.status}, chunks: ${check.data.chunkCount}`)
      if (check.data.status === "READY" || check.data.status === "ERROR") {
        console.log(`\nFinal status: ${check.data.status}`)
        if (check.data.errorLog) console.log(`Error: ${check.data.errorLog}`)
        break
      }
    }
  } else {
    console.log("\n>>> RESPONSE FORMAT UNCHANGED — deploy the fix first <<<")
    console.log("The inngestSent field is missing. Push the code fix and redeploy.")
  }

  // Cleanup
  await apiCall("DELETE", `/api/sources/${id}`)
  console.log("\nCleaned up test source")
}

main().catch(console.error)
