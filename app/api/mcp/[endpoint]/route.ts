import { NextRequest, NextResponse } from "next/server"
import { resolveEndpointSources, handleMcpRequest } from "@/lib/mcp/server"

export async function POST(
  req: NextRequest,
  { params }: { params: { endpoint: string } }
) {
  try {
    const endpoint = params.endpoint
    const sourceIds = await resolveEndpointSources(endpoint)

    if (sourceIds.length === 0) {
      const body = await req.json()
      return NextResponse.json({
        jsonrpc: "2.0",
        id: body.id ?? null,
        error: {
          code: -32000,
          message:
            "No indexed sources are ready in this endpoint. Sources may still be indexing. Check the ChainLens dashboard.",
        },
      })
    }

    const body = await req.json()

    if (Array.isArray(body)) {
      const results = await Promise.all(
        body.map((request: any) => handleMcpRequest(request, sourceIds))
      )
      return NextResponse.json(results)
    }

    const result = await handleMcpRequest(body, sourceIds)
    return NextResponse.json(result)
  } catch (error) {
    console.error("MCP endpoint error:", error)
    return NextResponse.json(
      {
        jsonrpc: "2.0",
        id: null,
        error: {
          code: -32603,
          message: "Internal server error",
        },
      },
      { status: 500 }
    )
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { endpoint: string } }
) {
  const sourceIds = await resolveEndpointSources(params.endpoint)

  return NextResponse.json({
    endpoint: params.endpoint,
    sourcesReady: sourceIds.length,
    status: sourceIds.length > 0 ? "active" : "no_ready_sources",
    protocol: "MCP",
    transport: "HTTP POST",
  })
}
