import { prisma } from "@/lib/db"
import { hybridSearch } from "@/lib/search"
import { SEARCH_DOCS_TOOL, GET_SOURCES_TOOL } from "./tools"

interface McpRequest {
  jsonrpc: "2.0"
  id: number | string
  method: string
  params?: any
}

interface McpResponse {
  jsonrpc: "2.0"
  id: number | string | null
  result?: any
  error?: { code: number; message: string; data?: any }
}

export async function resolveEndpointSources(
  endpoint: string
): Promise<string[]> {
  if (endpoint.startsWith("src-")) {
    const source = await prisma.docSource.findUnique({
      where: { mcpEndpoint: endpoint },
      select: { id: true, status: true },
    })
    if (source && source.status === "READY") return [source.id]
    return []
  }

  if (endpoint.startsWith("sub-")) {
    const subsection = await prisma.subsection.findUnique({
      where: { mcpEndpoint: endpoint },
      include: {
        sources: {
          where: { status: "READY" },
          select: { id: true },
        },
      },
    })
    return subsection?.sources.map((s) => s.id) || []
  }

  if (endpoint.startsWith("sec-")) {
    const section = await prisma.section.findUnique({
      where: { mcpEndpoint: endpoint },
      include: {
        sources: {
          where: { status: "READY" },
          select: { id: true },
        },
        subsections: {
          include: {
            sources: {
              where: { status: "READY" },
              select: { id: true },
            },
          },
        },
      },
    })

    if (!section) return []

    const ids = section.sources.map((s) => s.id)
    for (const sub of section.subsections) {
      ids.push(...sub.sources.map((s) => s.id))
    }
    return ids
  }

  return []
}

export async function handleMcpRequest(
  request: McpRequest,
  sourceIds: string[]
): Promise<McpResponse> {
  const { id, method, params } = request

  switch (method) {
    case "initialize":
      return {
        jsonrpc: "2.0",
        id,
        result: {
          protocolVersion: "2024-11-05",
          capabilities: {
            tools: {},
          },
          serverInfo: {
            name: "chainlens",
            version: "0.8.0",
          },
        },
      }

    case "tools/list":
      return {
        jsonrpc: "2.0",
        id,
        result: {
          tools: [SEARCH_DOCS_TOOL, GET_SOURCES_TOOL],
        },
      }

    case "tools/call": {
      const toolName = params?.name
      const toolArgs = params?.arguments || {}

      if (toolName === "search_docs") {
        if (!toolArgs.query) {
          return {
            jsonrpc: "2.0",
            id,
            error: {
              code: -32602,
              message: "Missing required parameter: query",
            },
          }
        }

        const searchResult = await hybridSearch({
          query: toolArgs.query,
          sourceIds,
          limit: toolArgs.limit,
          version: toolArgs.version,
        })

        return {
          jsonrpc: "2.0",
          id,
          result: {
            content: [
              {
                type: "text",
                text: JSON.stringify(searchResult, null, 2),
              },
            ],
          },
        }
      }

      if (toolName === "get_sources") {
        const sources = await prisma.docSource.findMany({
          where: { id: { in: sourceIds } },
          select: {
            id: true,
            name: true,
            type: true,
            url: true,
            version: true,
            status: true,
            chunkCount: true,
            lastIndexedAt: true,
          },
        })

        return {
          jsonrpc: "2.0",
          id,
          result: {
            content: [
              {
                type: "text",
                text: JSON.stringify({ sources }, null, 2),
              },
            ],
          },
        }
      }

      return {
        jsonrpc: "2.0",
        id,
        error: { code: -32601, message: `Unknown tool: ${toolName}` },
      }
    }

    default:
      return {
        jsonrpc: "2.0",
        id,
        error: { code: -32601, message: `Method not found: ${method}` },
      }
  }
}
