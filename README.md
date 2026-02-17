# ChainLens

A personal Ethereum developer knowledge hub that ingests documentation from websites, GitHub repositories, and PDFs, indexes them with vector embeddings, and exposes **Model Context Protocol (MCP) endpoints** for seamless integration with Cursor IDE and other MCP-compatible tools.

## What It Does

ChainLens crawls and indexes Ethereum/EVM developer documentation — Solidity docs, OpenZeppelin contracts, Uniswap/Aave protocol docs, EIPs, security references, and more — then makes all of it semantically searchable through per-source MCP endpoints. When you connect an endpoint to Cursor IDE, your AI assistant can search your indexed docs in real time while you code.

**Example workflow:**
1. Add the OpenZeppelin ERC-20 docs as a source in ChainLens
2. ChainLens crawls, chunks, and embeds the documentation
3. Copy the MCP endpoint URL into your `.cursor/mcp.json`
4. Ask Cursor: *"How do I create an ERC-20 token with a mint function?"*
5. Cursor queries ChainLens via MCP, retrieves the relevant docs, and generates a correct contract

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 14 (App Router) + TypeScript |
| **UI** | Tailwind CSS + shadcn/ui + Framer Motion |
| **State** | Zustand (global) + TanStack Query (server) |
| **Database** | Supabase PostgreSQL + pgvector |
| **ORM** | Prisma |
| **Embeddings** | Voyage AI `voyage-code-3` (1024 dimensions, code-optimized, 200M tokens/month free) |
| **Search** | Hybrid vector similarity + full-text search with Reciprocal Rank Fusion (RRF) |
| **Crawling** | Playwright (JS-rendered sites) + Cheerio (static HTML) + Octokit (GitHub repos) |
| **Background Jobs** | Inngest (serverless, Vercel-compatible) |
| **MCP** | `@modelcontextprotocol/sdk` — exposes `search_docs` and `get_sources` tools |
| **Hosting** | Vercel Hobby tier (free) |

## Features

- **Multi-source ingestion** — Crawl documentation websites (static and JavaScript-rendered SPAs), GitHub repositories (with structured NatSpec extraction for Solidity), and PDFs
- **Smart chunking** — Content-aware splitting with code block preservation, heading hierarchy, and configurable overlap
- **Hybrid search** — Combines vector similarity (cosine distance via pgvector) with PostgreSQL full-text search, re-ranked with Reciprocal Rank Fusion
- **Dynamic MCP endpoints** — Each source, subsection, and section gets its own MCP endpoint. Connect any combination to your IDE
- **Solidity-aware indexing** — Extracts NatSpec documentation, function visibility/mutability, modifiers, and creates function-level chunks for Solidity 0.8+ files
- **Live indexing progress** — Real-time status updates on the dashboard via polling
- **Drag-and-drop organization** — Reorder sections and subsections with drag handles
- **Background job queue** — Inngest handles indexing asynchronously with step functions, retries, and scheduled refreshes
- **Dark mode** — Default dark theme with toggle

## Project Structure

```
chainlens/
├── app/
│   ├── (dashboard)/          # Dashboard pages (sources, sections, endpoints, settings)
│   ├── api/
│   │   ├── mcp/[endpoint]/   # Dynamic MCP endpoint handler
│   │   ├── sources/          # CRUD for documentation sources
│   │   ├── sections/         # CRUD for sections
│   │   ├── subsections/      # CRUD for subsections
│   │   ├── reorder/          # Drag-and-drop reordering
│   │   ├── health/           # Service health checks
│   │   ├── validate-url/     # URL reachability validation
│   │   └── webhooks/inngest/ # Inngest webhook receiver
│   ├── layout.tsx            # Root layout (fonts, providers, toaster)
│   └── globals.css           # Tailwind + custom CSS variables
├── components/
│   ├── endpoints/            # MCP endpoint display cards
│   ├── layout/               # Sidebar, TopBar, ThemeToggle
│   ├── providers/            # QueryProvider, ThemeProvider
│   ├── sections/             # Section tree, forms, drag-and-drop
│   ├── sources/              # Source cards, add modal, indexing progress
│   └── ui/                   # Shared UI primitives (Modal, StatusBadge, CopyButton)
├── hooks/
│   └── useRealtimeSource.ts  # Polling hook for live indexing updates
├── lib/
│   ├── indexing/
│   │   ├── crawl-url.ts      # URL crawler (Playwright + Cheerio, JS detection)
│   │   ├── crawl-github.ts   # GitHub repo crawler (Octokit, NatSpec extraction)
│   │   ├── chunk.ts          # Content-aware text chunking
│   │   ├── embed.ts          # Batch embed + store to pgvector
│   │   └── parse-pdf.ts      # PDF text extraction
│   ├── inngest/
│   │   ├── client.ts         # Inngest client configuration
│   │   └── functions/        # index-source, refresh-sources step functions
│   ├── mcp/
│   │   ├── server.ts         # MCP request handler + endpoint resolver
│   │   └── tools.ts          # search_docs and get_sources tool definitions
│   ├── db.ts                 # Prisma client singleton
│   ├── embeddings.ts         # Voyage AI embedding (single + batch)
│   ├── search.ts             # Hybrid search (vector + FTS + RRF)
│   ├── store.ts              # Zustand global state
│   └── utils.ts              # Utility functions
├── prisma/
│   └── schema.prisma         # Database schema (DocSource, DocChunk, Section, Subsection)
├── scripts/
│   ├── seed.ts               # Seeds 8 sections, 20+ subsections, 28 sources
│   ├── post-migration.sql    # pgvector index, FTS index, tsvector trigger
│   └── migrate-to-voyage.ts  # One-time migration script (Gemini -> Voyage AI)
└── package.json
```

## Prerequisites

- **Node.js** 18+ and npm
- **Supabase** account (free tier) with a PostgreSQL database and the `vector` extension enabled
- **Voyage AI** API key (free at [dash.voyageai.com](https://dash.voyageai.com) — 200M tokens/month)
- **GitHub Personal Access Token** (optional but recommended for repo indexing — avoids rate limits)
- **Inngest** account (free tier, optional for local dev — the dev server works without authentication)

## Setup

### 1. Clone and install

```bash
git clone https://github.com/AduAkorful/Chainlens.git
cd Chainlens
npm install
```

### 2. Configure environment

Create a `.env.local` file in the project root:

```env
# ── Supabase ──────────────────────────────────────────────
DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-[region].pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres.[project-ref]:[password]@aws-[region].pooler.supabase.com:5432/postgres

NEXT_PUBLIC_SUPABASE_URL=https://[project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# ── Voyage AI (embeddings) ────────────────────────────────
VOYAGE_API_KEY=your_voyage_api_key

# ── GitHub (optional, recommended) ────────────────────────
GITHUB_TOKEN=ghp_your_github_token

# ── Inngest (background jobs) ─────────────────────────────
INNGEST_EVENT_KEY=test
INNGEST_SIGNING_KEY=
INNGEST_DEV=1

# ── App ───────────────────────────────────────────────────
NEXTAUTH_SECRET=your_random_secret
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Also create a `.env` file with the same `DATABASE_URL` and `DIRECT_URL` (needed by Prisma CLI and scripts):

```env
DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-[region].pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres.[project-ref]:[password]@aws-[region].pooler.supabase.com:5432/postgres
VOYAGE_API_KEY=your_voyage_api_key
GITHUB_TOKEN=ghp_your_github_token
```

### 3. Set up the database

Enable the `vector` extension in your Supabase project (SQL Editor):

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

Push the Prisma schema to create tables:

```bash
npx prisma db push
```

### 4. Apply post-migration SQL

Open `scripts/post-migration.sql` in the Supabase SQL Editor and run it. This creates:

- **IVFFlat index** on the `embedding` column for fast vector similarity search
- **GIN index** on the `tsv` column for full-text search
- **Trigger** to auto-compute `tsvector` on chunk insert/update

> **Note:** The vector index was originally created for 768 dimensions (Gemini). If you're setting up fresh, the schema already uses `vector(1024)` for Voyage AI and the IVFFlat index will work correctly with the current column type.

### 5. Seed the database

```bash
npm run seed
```

This creates 8 sections, 20+ subsections, and 28 pre-configured documentation sources covering Solidity, OpenZeppelin, Uniswap, Aave, Chainlink, Foundry, EIPs, security references, and more.

### 6. Start the Inngest dev server

In a separate terminal:

```bash
npx inngest-cli@latest dev
```

This starts the Inngest dev server at `http://localhost:8288`, which handles background indexing jobs.

### 7. Start the development server

```bash
npm run dev
```

The app runs at [http://localhost:3000](http://localhost:3000).

### 8. Trigger indexing

Open the dashboard, go to **Settings**, and click **Reindex All Sources** — or click the refresh icon on individual source cards. Inngest will process each source in the background: crawling, chunking, embedding, and storing.

## Using MCP Endpoints

### In Cursor IDE

1. Go to the **Endpoints** page in the ChainLens dashboard
2. Copy any endpoint URL (source, subsection, or section level)
3. Add it to your `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "chainlens-openzeppelin": {
      "url": "http://localhost:3000/api/mcp/src-openzeppelin-contracts-v5-docs",
      "transport": "http"
    },
    "chainlens-uniswap-v3": {
      "url": "http://localhost:3000/api/mcp/sub-defi-protocols-uniswap-v3",
      "transport": "http"
    },
    "chainlens-all-security": {
      "url": "http://localhost:3000/api/mcp/sec-security-auditing",
      "transport": "http"
    }
  }
}
```

### Endpoint hierarchy

- **Source endpoints** (`src-*`) — search within a single documentation source
- **Subsection endpoints** (`sub-*`) — search across all sources in a subsection
- **Section endpoints** (`sec-*`) — search across all sources in an entire section

### MCP tools exposed

| Tool | Description |
|------|-------------|
| `search_docs` | Semantic search across indexed documentation. Accepts `query` (string) and optional `limit` (number, default 10). Returns ranked results with headings, content snippets, source info, and relevance scores. |
| `get_sources` | Lists all indexed sources available on this endpoint with their status, chunk counts, and last indexed timestamps. |

## Deployment to Vercel

1. Push the repository to GitHub
2. Import in [Vercel](https://vercel.com) and add all `.env.local` variables to Environment Variables
3. Set `INNGEST_DEV` to empty or remove it for production
4. Add your production `INNGEST_EVENT_KEY` and `INNGEST_SIGNING_KEY` from the [Inngest dashboard](https://app.inngest.com)
5. Deploy
6. In Supabase SQL Editor, run `scripts/post-migration.sql` against your production database
7. Run the seed script with your production `DATABASE_URL`:
   ```bash
   DATABASE_URL="your_prod_url" npm run seed
   ```
8. Install the Inngest integration in Vercel (Vercel Dashboard > Integrations > Inngest)
9. Update your MCP endpoint URLs from `localhost:3000` to your Vercel deployment URL

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run seed` | Seed sections, subsections, and sources |
| `npm run db:push` | Push Prisma schema to database |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:studio` | Open Prisma Studio (database browser) |

## API Routes

| Method | Route | Description |
|--------|-------|-------------|
| `GET/POST` | `/api/sources` | List / create documentation sources |
| `GET/PUT/DELETE` | `/api/sources/[id]` | Get / update / delete a source |
| `POST` | `/api/sources/[id]/reindex` | Trigger re-indexing for a source |
| `GET/POST` | `/api/sections` | List / create sections |
| `GET/PUT/DELETE` | `/api/sections/[id]` | Get / update / delete a section |
| `GET/POST` | `/api/subsections` | List / create subsections |
| `PUT/DELETE` | `/api/subsections/[id]` | Update / delete a subsection |
| `PATCH` | `/api/reorder` | Reorder sections or subsections |
| `POST` | `/api/validate-url` | Check if a URL is reachable |
| `GET` | `/api/health` | Health check (database, Voyage AI, Inngest) |
| `POST` | `/api/mcp/[endpoint]` | MCP JSON-RPC endpoint (supports batch) |
| `POST` | `/api/webhooks/inngest` | Inngest webhook receiver |

## License

Private — personal developer tool.
