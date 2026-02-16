# ChainLens — EVM Knowledge Hub · MCP-Powered

A personal Ethereum developer knowledge hub that ingests documentation from websites, GitHub repositories, and PDFs, indexes them with vector embeddings, and exposes **Model Context Protocol (MCP) endpoints** for Cursor IDE integration.

## Stack

- **Framework:** Next.js 14 (App Router) + TypeScript
- **Database:** Supabase PostgreSQL + pgvector
- **Embeddings:** Google Gemini `text-embedding-004` (free tier, 768 dimensions)
- **Search:** Hybrid vector + full-text with Reciprocal Rank Fusion
- **Background Jobs:** Inngest (serverless, Vercel-compatible)
- **MCP:** `@modelcontextprotocol/sdk` — exposes `search_docs` and `get_sources` tools
- **Hosting:** Vercel Hobby tier (free)

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Fill in your credentials in `.env.local` (template already created).

### 3. Run database migration

```bash
npx prisma migrate dev
```

### 4. Apply post-migration SQL

Open `scripts/post-migration.sql` in the Supabase SQL Editor and run it. This creates the vector similarity index, full-text search index, and auto-compute tsvector trigger.

### 5. Seed the database

```bash
npm run seed
```

### 6. Start development server

```bash
npm run dev
```

## Deployment to Vercel

1. Push to GitHub
2. Import in Vercel → add all `.env.local` variables to Environment Variables
3. Deploy
4. Run `npx prisma migrate deploy` locally (with prod DATABASE_URL)
5. Run post-migration SQL in Supabase SQL Editor
6. Run `npm run seed` locally (with prod DATABASE_URL)
7. Connect Inngest: dashboard → Apps → Connect → authorize Vercel

## MCP Endpoint Usage

Copy endpoint URLs from the Endpoints page into your `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "chainlens-uniswap-v3": {
      "url": "https://your-app.vercel.app/api/mcp/sub-defi-protocols-uniswap-v3",
      "transport": "http"
    }
  }
}
```

## License

Private — personal developer tool.
