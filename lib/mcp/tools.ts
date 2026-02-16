export const SEARCH_DOCS_TOOL = {
  name: "search_docs",
  description: `Search the ChainLens knowledge base for Ethereum development documentation.
Returns relevant, chunked content with full source attribution.
Use this to find correct function signatures, interface definitions, events, errors,
EIP specifications, security patterns, and gas optimisation techniques
from authoritative, indexed documentation. Never guess — search first.`,
  inputSchema: {
    type: "object" as const,
    properties: {
      query: {
        type: "string",
        description:
          "Natural language or technical query — e.g. 'UniswapV3 slot0 function', 'ERC-4626 deposit', 'reentrancy guard pattern'",
      },
      limit: {
        type: "number",
        description: "Max results to return. Default: 8. Max: 20.",
      },
      version: {
        type: "string",
        description:
          "Filter strictly by version e.g. 'v3', 'v2', '0.8.x'. Omit to search all versions in scope.",
      },
    },
    required: ["query"],
  },
}

export const GET_SOURCES_TOOL = {
  name: "get_sources",
  description:
    "List all documentation sources available in this MCP endpoint scope, including their names, versions, source URLs, chunk counts, and indexing status.",
  inputSchema: {
    type: "object" as const,
    properties: {},
  },
}
