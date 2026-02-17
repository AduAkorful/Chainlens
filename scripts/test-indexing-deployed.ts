import "dotenv/config"

const BASE = "https://chainlens-pi.vercel.app"

async function apiCall(method: string, path: string, body?: any, timeout = 30000) {
  try {
    const res = await fetch(`${BASE}${path}`, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(timeout),
    })
    let data: any
    const text = await res.text()
    try { data = JSON.parse(text) } catch { data = { _raw: text.slice(0, 1000) } }
    return { status: res.status, data, ok: res.ok }
  } catch (err: any) {
    return { status: 0, data: { error: err.message }, ok: false }
  }
}

async function main() {
  console.log("=== Deployment Indexing Diagnostic ===\n")

  // 1. Check stuck INDEXING sources
  console.log("[1] Checking source statuses...")
  const sources = await apiCall("GET", "/api/sources")
  if (!sources.ok) { console.error("Failed to fetch sources"); process.exit(1) }

  const all = sources.data as any[]
  const indexing = all.filter((s: any) => s.status === "INDEXING")
  const pending = all.filter((s: any) => s.status === "PENDING")
  const ready = all.filter((s: any) => s.status === "READY")
  const error = all.filter((s: any) => s.status === "ERROR")

  console.log(`  Total: ${all.length}`)
  console.log(`  PENDING: ${pending.length}`)
  console.log(`  INDEXING: ${indexing.length}`)
  console.log(`  READY: ${ready.length}`)
  console.log(`  ERROR: ${error.length}`)

  if (indexing.length > 0) {
    console.log("\n  Stuck INDEXING sources:")
    indexing.forEach((s: any) => {
      console.log(`    - ${s.name} [${s.id}]`)
      console.log(`      chunkCount: ${s.chunkCount}, error: ${s.errorLog || "none"}`)
      console.log(`      updatedAt: ${s.updatedAt}`)
    })
  }

  if (error.length > 0) {
    console.log("\n  ERROR sources:")
    error.forEach((s: any) => {
      console.log(`    - ${s.name}: ${s.errorLog}`)
    })
  }

  // 2. Create a small test source and trigger indexing
  console.log("\n[2] Creating small test source...")
  const create = await apiCall("POST", "/api/sources", {
    name: "DEPLOY-INDEX-TEST",
    type: "URL",
    url: "https://eips.ethereum.org/EIPS/eip-20",
    crawlDepth: 0,
  })

  if (!create.ok) {
    console.error("  Failed to create test source:", create.data)
    process.exit(1)
  }

  const sourceId = create.data.id
  const ep = create.data.mcpEndpoint
  console.log(`  Created: ${sourceId} (endpoint: ${ep})`)

  // 3. Trigger reindex
  console.log("\n[3] Triggering reindex...")
  const reindex = await apiCall("POST", `/api/sources/${sourceId}/reindex`)
  console.log(`  Status: ${reindex.status}`)
  console.log(`  Response:`, JSON.stringify(reindex.data))

  // 4. Poll for status changes
  console.log("\n[4] Polling for indexing progress (up to 120s)...")
  const startTime = Date.now()
  const maxWait = 120000
  let lastStatus = ""

  while (Date.now() - startTime < maxWait) {
    await new Promise(r => setTimeout(r, 5000))
    const check = await apiCall("GET", `/api/sources/${sourceId}`)
    if (!check.ok) {
      console.log(`  Poll error: ${check.status}`)
      continue
    }

    const s = check.data
    const elapsed = Math.round((Date.now() - startTime) / 1000)

    if (s.status !== lastStatus) {
      console.log(`  [${elapsed}s] Status: ${s.status}, chunks: ${s.chunkCount}, error: ${s.errorLog || "none"}`)
      lastStatus = s.status
    }

    if (s.status === "READY") {
      console.log(`\n  SUCCESS: Source indexed in ${elapsed}s with ${s.chunkCount} chunks`)

      // Test MCP search on this source
      console.log("\n[5] Testing MCP search on indexed source...")
      const search = await apiCall("POST", `/api/mcp/${ep}`, {
        jsonrpc: "2.0", id: 1, method: "tools/call",
        params: { name: "search_docs", arguments: { query: "ERC-20 token transfer", limit: 3 } },
      }, 60000)

      if (search.data?.result?.content?.[0]?.text) {
        const parsed = JSON.parse(search.data.result.content[0].text)
        console.log(`  MCP search: ${parsed.totalResults} results in ${parsed.queryTimeMs}ms`)
        parsed.results?.forEach((r: any, i: number) => {
          console.log(`    [${i + 1}] ${r.heading} — ${r.content.slice(0, 100)}...`)
        })
        console.log("\n  PASS: Full pipeline works on deployment!")
      } else {
        console.log(`  MCP search response:`, JSON.stringify(search.data).slice(0, 500))
      }

      // Clean up
      console.log("\n[6] Cleaning up test source...")
      const del = await apiCall("DELETE", `/api/sources/${sourceId}`)
      console.log(`  Deleted: ${del.data?.deleted}, chunks removed: ${del.data?.chunksRemoved}`)

      process.exit(0)
    }

    if (s.status === "ERROR") {
      console.log(`\n  FAILED: Indexing errored after ${elapsed}s`)
      console.log(`  Error: ${s.errorLog}`)

      // Clean up
      const del = await apiCall("DELETE", `/api/sources/${sourceId}`)
      console.log(`  Cleaned up test source`)

      process.exit(1)
    }
  }

  console.log(`\n  TIMEOUT: Source still ${lastStatus} after ${maxWait / 1000}s`)
  console.log("  Inngest may not be processing events. Check Inngest dashboard.")

  // Clean up
  const del = await apiCall("DELETE", `/api/sources/${sourceId}`)
  console.log(`  Cleaned up test source`)

  process.exit(1)
}

main()
