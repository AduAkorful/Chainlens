import "dotenv/config"

const BASE = "https://chainlens-pi.vercel.app"
const DIV = "=".repeat(60)
let passed = 0
let failed = 0
const issues: string[] = []

function mark(label: string, ok: boolean, detail?: string) {
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}`)
  if (detail) console.log(`         ${detail}`)
  if (ok) passed++
  else {
    failed++
    issues.push(`${label}${detail ? `: ${detail}` : ""}`)
  }
}

async function apiCall(method: string, path: string, body?: any, timeout = 30000) {
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeout)
    const res = await fetch(`${BASE}${path}`, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    })
    clearTimeout(timer)
    let data: any
    const text = await res.text()
    try {
      data = JSON.parse(text)
    } catch {
      data = { _raw: text.slice(0, 500) }
    }
    return { status: res.status, data, ok: res.ok }
  } catch (err: any) {
    return { status: 0, data: { error: err.message }, ok: false }
  }
}

// ═══════════════════════════════════════════════════════════
// TEST 1: Health check
// ═══════════════════════════════════════════════════════════
async function testHealth() {
  console.log(`\n${DIV}`)
  console.log("TEST 1: Health Check")
  console.log(DIV)

  const health = await apiCall("GET", "/api/health")
  console.log(`  Status: ${health.status}`)
  console.log(`  Response:`, JSON.stringify(health.data, null, 2))

  mark("Health endpoint reachable", health.status === 200)

  if (health.data) {
    if (health.data.database !== undefined) {
      mark("Database connected", health.data.database === true || health.data.database === "ok")
    }
    if (health.data.voyage !== undefined) {
      mark("Voyage AI connected", health.data.voyage === true || health.data.voyage === "ok")
    }
    if (health.data.inngest !== undefined) {
      mark("Inngest connected", health.data.inngest === true || health.data.inngest === "ok")
    }
  }
}

// ═══════════════════════════════════════════════════════════
// TEST 2: API routes
// ═══════════════════════════════════════════════════════════
async function testApiRoutes() {
  console.log(`\n${DIV}`)
  console.log("TEST 2: API Routes")
  console.log(DIV)

  // GET sections
  console.log("\n  [2a] GET /api/sections")
  const sections = await apiCall("GET", "/api/sections")
  console.log(`  Status: ${sections.status}`)
  if (sections.ok) {
    const count = Array.isArray(sections.data) ? sections.data.length : 0
    console.log(`  Sections: ${count}`)
    mark("GET /api/sections works", sections.ok)
    mark("Sections seeded", count > 0, `found ${count}`)
  } else {
    console.log(`  Error:`, JSON.stringify(sections.data).slice(0, 300))
    mark("GET /api/sections works", false, `status ${sections.status}`)
  }

  // GET sources
  console.log("\n  [2b] GET /api/sources")
  const sources = await apiCall("GET", "/api/sources")
  console.log(`  Status: ${sources.status}`)
  if (sources.ok) {
    const count = Array.isArray(sources.data) ? sources.data.length : 0
    console.log(`  Sources: ${count}`)
    if (count > 0) {
      const statuses = Array.isArray(sources.data)
        ? sources.data.reduce((acc: any, s: any) => { acc[s.status] = (acc[s.status] || 0) + 1; return acc }, {})
        : {}
      console.log(`  Status breakdown:`, statuses)
    }
    mark("GET /api/sources works", sources.ok)
    mark("Sources seeded", count > 0, `found ${count}`)
  } else {
    console.log(`  Error:`, JSON.stringify(sources.data).slice(0, 300))
    mark("GET /api/sources works", false, `status ${sources.status}`)
  }

  // POST source (create test source)
  console.log("\n  [2c] POST /api/sources (create test source)")
  const createRes = await apiCall("POST", "/api/sources", {
    name: "DEPLOY-TEST-Source",
    type: "URL",
    url: "https://eips.ethereum.org/EIPS/eip-20",
    crawlDepth: 0,
  })
  console.log(`  Status: ${createRes.status}`)
  console.log(`  Response:`, JSON.stringify(createRes.data).slice(0, 300))
  mark("POST /api/sources creates source", createRes.ok || createRes.status === 201)

  const testSourceId = createRes.data?.id
  const testEndpoint = createRes.data?.mcpEndpoint

  if (testSourceId) {
    // GET single source
    console.log("\n  [2d] GET /api/sources/[id]")
    const getOne = await apiCall("GET", `/api/sources/${testSourceId}`)
    mark("GET single source works", getOne.ok)

    // Validate URL endpoint
    console.log("\n  [2e] POST /api/validate-url")
    const validate = await apiCall("POST", "/api/validate-url", { url: "https://eips.ethereum.org" })
    console.log(`  Reachable: ${validate.data?.reachable}`)
    mark("URL validation works", validate.ok && validate.data?.reachable === true)

    // Reorder endpoint
    console.log("\n  [2f] PATCH /api/reorder")
    const reorder = await apiCall("PATCH", "/api/reorder", {
      type: "sections",
      items: [],
    })
    console.log(`  Status: ${reorder.status}`)
    mark("Reorder endpoint responds", reorder.ok || reorder.status === 200)

    // Delete test source
    console.log("\n  [2g] DELETE /api/sources/[id]")
    const del = await apiCall("DELETE", `/api/sources/${testSourceId}`)
    console.log(`  Status: ${del.status}, deleted: ${del.data?.deleted}`)
    mark("DELETE source works", del.ok && del.data?.deleted === true)

    // Verify deleted
    const getDeleted = await apiCall("GET", `/api/sources/${testSourceId}`)
    mark("Source returns 404 after delete", getDeleted.status === 404)
  } else {
    mark("Skipped CRUD tests (source creation failed)", false)
  }
}

// ═══════════════════════════════════════════════════════════
// TEST 3: MCP endpoint
// ═══════════════════════════════════════════════════════════
async function testMcp() {
  console.log(`\n${DIV}`)
  console.log("TEST 3: MCP Endpoint")
  console.log(DIV)

  // Use the SWC Registry endpoint which should have data
  const sources = await apiCall("GET", "/api/sources")
  let testEndpoint = ""
  let hasReadySources = false

  if (sources.ok && Array.isArray(sources.data)) {
    const ready = sources.data.find((s: any) => s.status === "READY" && s.chunkCount > 0)
    if (ready) {
      testEndpoint = ready.mcpEndpoint
      hasReadySources = true
      console.log(`  Using READY source: ${ready.name} (${ready.chunkCount} chunks, endpoint: ${testEndpoint})`)
    } else {
      // Try any source endpoint
      const any = sources.data[0]
      if (any) {
        testEndpoint = any.mcpEndpoint
        console.log(`  No READY sources. Testing with: ${any.name} [${any.status}] (endpoint: ${testEndpoint})`)
      }
    }
  }

  if (!testEndpoint) {
    console.log("  No sources available to test MCP")
    mark("MCP test skipped (no sources)", false)
    return
  }

  // MCP initialize
  console.log(`\n  [3a] MCP initialize on /api/mcp/${testEndpoint}`)
  const init = await apiCall("POST", `/api/mcp/${testEndpoint}`, {
    jsonrpc: "2.0", id: 1, method: "initialize",
  })
  console.log(`  Status: ${init.status}`)
  console.log(`  Response:`, JSON.stringify(init.data).slice(0, 300))
  mark("MCP initialize works", init.ok && init.data?.result?.serverInfo?.name === "chainlens")

  // MCP tools/list
  console.log("\n  [3b] MCP tools/list")
  const tools = await apiCall("POST", `/api/mcp/${testEndpoint}`, {
    jsonrpc: "2.0", id: 2, method: "tools/list",
  })
  const toolNames = (tools.data?.result?.tools || []).map((t: any) => t.name)
  console.log(`  Tools: ${toolNames.join(", ") || "none"}`)
  mark("MCP tools/list returns tools", toolNames.includes("search_docs"))

  if (hasReadySources) {
    // MCP search
    console.log("\n  [3c] MCP search_docs")
    const search = await apiCall("POST", `/api/mcp/${testEndpoint}`, {
      jsonrpc: "2.0", id: 3, method: "tools/call",
      params: { name: "search_docs", arguments: { query: "reentrancy vulnerability", limit: 3 } },
    }, 60000)
    console.log(`  Status: ${search.status}`)
    if (search.data?.result?.content?.[0]?.text) {
      const parsed = JSON.parse(search.data.result.content[0].text)
      console.log(`  Results: ${parsed.totalResults}, time: ${parsed.queryTimeMs}ms`)
      mark("MCP search returns results", parsed.totalResults > 0)
    } else if (search.data?.error) {
      console.log(`  Error:`, JSON.stringify(search.data.error).slice(0, 300))
      mark("MCP search returns results", false, search.data.error.message)
    } else {
      mark("MCP search returns results", false, "unexpected response")
    }
  }
}

// ═══════════════════════════════════════════════════════════
// TEST 4: Inngest webhook
// ═══════════════════════════════════════════════════════════
async function testInngest() {
  console.log(`\n${DIV}`)
  console.log("TEST 4: Inngest Webhook")
  console.log(DIV)

  // Check if the inngest webhook route is responding
  const inngest = await apiCall("GET", "/api/webhooks/inngest")
  console.log(`  GET /api/webhooks/inngest status: ${inngest.status}`)
  console.log(`  Response:`, JSON.stringify(inngest.data).slice(0, 300))
  // Inngest introspection responds on GET with discovery info
  mark("Inngest webhook endpoint responds", inngest.status !== 0 && inngest.status !== 404)
}

// ═══════════════════════════════════════════════════════════
// TEST 5: Page routes (SSR)
// ═══════════════════════════════════════════════════════════
async function testPages() {
  console.log(`\n${DIV}`)
  console.log("TEST 5: Page Routes (SSR)")
  console.log(DIV)

  const pages = [
    "/",
    "/sources",
    "/sections",
    "/endpoints",
    "/settings",
  ]

  for (const page of pages) {
    try {
      const res = await fetch(`${BASE}${page}`, {
        signal: AbortSignal.timeout(15000),
        redirect: "follow",
      })
      const ok = res.status === 200
      mark(`Page ${page} loads`, ok, `status ${res.status}`)
    } catch (err: any) {
      mark(`Page ${page} loads`, false, err.message)
    }
  }
}

// ═══════════════════════════════════════════════════════════
async function main() {
  console.log(`\n${DIV}`)
  console.log("  ChainLens Deployment Test Suite")
  console.log(`  Target: ${BASE}`)
  console.log(DIV)

  await testHealth()
  await testApiRoutes()
  await testMcp()
  await testInngest()
  await testPages()

  console.log(`\n${DIV}`)
  console.log(`  FINAL: ${passed} passed, ${failed} failed`)
  if (issues.length > 0) {
    console.log(`\n  Issues found:`)
    issues.forEach((iss, i) => console.log(`    ${i + 1}. ${iss}`))
  }
  console.log(DIV)

  process.exit(failed > 0 ? 1 : 0)
}

main()
