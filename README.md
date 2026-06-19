# RAG Knowledge Base - Next.js on Vercel

A structured JSON knowledge base designed for Retrieval-Augmented Generation (RAG) systems, covering common issues, patterns, and solutions for **Next.js applications hosted on Vercel**.

## Schema

Each entry follows this structure:

```json
{
  "type": "bug_fix | error | log_pattern | config_issue | doc | code_pattern | fix_snippet | diagnostic_step | root_cause | performance_case",
  "symptoms": ["array of symptoms or search queries that match this entry"],
  "root_cause": "description of the underlying cause",
  "fix": ["array of fix steps or solutions"],
  "tags": ["array of tags for filtering and categorization"],
  "severity": "low | medium | high",
  "frequency": "rare | occasional | common | very-common",
  "related_docs": ["array of URLs to official documentation"],
  "version": "package version or runtime version this applies to"
}
```

## Entry Types

| Type | Count | Description |
|------|-------|-------------|
| `fix_snippet` | 40 | Ready-to-use code solutions and implementation patterns |
| `code_pattern` | 35 | Best practice code patterns and architectural guidance |
| `bug_fix` | 26 | Known bugs with confirmed fixes |
| `doc` | 19 | How-to documentation and setup guides |
| `config_issue` | 14 | Configuration problems and corrections |
| `performance_case` | 13 | Performance optimization cases |
| `error` | 8 | Runtime errors and their resolutions |
| `diagnostic_step` | 8 | Step-by-step debugging procedures |
| `root_cause` | 6 | Deep-dive root cause analysis |
| `log_pattern` | 3 | Warning/error log patterns and their meaning |

**Total: 172 entries**

## Metadata Fields

| Field | Values | Purpose |
|-------|--------|---------|
| `severity` | `low`, `medium`, `high` | Impact level of the issue on application functionality |
| `frequency` | `rare`, `occasional`, `common`, `very-common` | How often this issue is encountered in practice |
| `related_docs` | Array of URLs | Links to official documentation for further reading |
| `version` | String | Package/runtime version this entry applies to (e.g., `next@13+`, `prisma@5+`) |

## Tech Stack Coverage

### Core Framework
- **Next.js** (App Router) — routing, server components, server actions, middleware, streaming
- **TypeScript** — strict mode, type safety, path aliases, generics, type guards
- **Tailwind CSS** — configuration, dark mode, responsive design, CVA variants, animations

### Databases
- **SQLite + Turso** — local development with libSQL, Drizzle ORM, FTS5 search, embedded replicas
- **PostgreSQL + Neon** — Prisma ORM, connection pooling, branching, migrations, serverless driver
- **PostgreSQL + Supabase** — realtime subscriptions, RLS, presence, storage, auth, type generation

### Event Processing & Background Jobs
- **Upstash QStash** — message queues, delayed delivery, retries, dead letter queue, signature verification
- **Inngest** — durable functions, multi-step workflows, throttling, cron, fan-out patterns

### Redis (Upstash)
- **Deduplication cache** — prevent duplicate event/webhook/request processing
- **Rate limiting** — sliding window, token bucket, fixed window implementations
- **Embedding cache** — cache vector embeddings to reduce AI API costs
- **Retrieval cache** — cache RAG query results and LLM responses
- **Session storage** — serverless session management with cookies
- **Temporary event buffer** — buffer events for batch processing
- **Retry state tracking** — track attempts, backoff, and failure metadata
- **General patterns** — cache-aside, invalidation, distributed locks, leaderboards, feature flags, pipelines

### File Storage
- **Local Filesystem** — development file storage, /tmp usage, serve local uploads
- **Vercel Blob** — production file storage, client/server uploads, storage abstraction pattern

### Google APIs
- **Google OAuth** — sign-in, scopes, token refresh, consent screen, database token persistence
- **Google Calendar API** — list/create/update events, webhooks, timezone handling, rate limits
- **Google Sheets API** — read/write data, batch operations, service accounts, Sheets-as-CMS pattern

### Deployment & Infrastructure
- **Vercel** — deployment, serverless functions, edge runtime, regions, caching, cron jobs, environment variables

## Tag Distribution (Top 25)

| Tag | Count |
|-----|-------|
| vercel | 27 |
| redis | 24 |
| performance | 22 |
| googleapis | 21 |
| serverless | 18 |
| typescript | 18 |
| supabase | 15 |
| configuration | 15 |
| tailwind | 14 |
| patterns | 14 |
| local-dev | 13 |
| google-api | 12 |
| database | 12 |
| inngest | 11 |
| debugging | 11 |
| storage | 8 |
| google-calendar | 7 |
| google-sheets | 7 |
| google-oauth | 6 |
| sqlite | 10 |
| prisma | 10 |
| upstash | 9 |
| postgresql | 9 |
| authentication | 9 |
| security | 8 |

## Usage

### Loading into a Vector Store

Load `knowledge-base.json` into your RAG vector store. Each entry's `symptoms` array provides natural-language queries that should match the entry, while `tags` enable filtered retrieval.

```typescript
import knowledgeBase from './knowledge-base.json';

// Index each entry with symptoms as searchable text
for (const entry of knowledgeBase) {
  const searchableText = [
    ...entry.symptoms,
    entry.root_cause,
    entry.tags.join(' ')
  ].join(' ');

  await vectorStore.upsert({
    id: generateId(entry),
    text: searchableText,
    metadata: {
      type: entry.type,
      severity: entry.severity,
      frequency: entry.frequency,
      tags: entry.tags,
      version: entry.version
    },
    document: entry
  });
}
```

### Filtering by Metadata

Use metadata fields for filtered retrieval:

```typescript
// Only high-severity issues
const critical = knowledgeBase.filter(e => e.severity === 'high');

// Redis-specific entries
const redisEntries = knowledgeBase.filter(e => e.tags.includes('redis'));

// Entries for a specific version
const nextEntries = knowledgeBase.filter(e => e.version.includes('next@'));
```

## Tech Stack

- **Framework:** Next.js 13+ (App Router)
- **Language:** TypeScript 5+
- **Styling:** Tailwind CSS 3+
- **Hosting:** Vercel (Serverless + Edge)
- **Databases:** SQLite/Turso, PostgreSQL/Neon, Supabase
- **Storage:** Local Filesystem (dev), Vercel Blob (prod)
- **Cache/Queue:** Upstash Redis, Upstash QStash
- **Orchestration:** Inngest
- **ORM:** Prisma, Drizzle
- **Google APIs:** OAuth, Calendar, Sheets (googleapis)
