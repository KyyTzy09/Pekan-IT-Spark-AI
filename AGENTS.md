# Spark AI — Agent Guide

## Stack

Next.js 16 (App Router) + React 19 + Bun + Prisma 7 + PostgreSQL + Biome + Vitest + Tailwind v4 + shadcn (radix-rhea)

## Commands

```bash
rtk bun dev                    # dev server
rtk bun run build              # prisma generate + next build
rtk bun run lint               # biome check
rtk bun run format             # biome format --write
rtk bun run typecheck          # tsc --noEmit
rtk bun test                   # vitest run
rtk bun run db:migrate         # prisma migrate dev
rtk bun run db:generate        # prisma generate
rtk bun run db:seed            # seed curriculum data
rtk bun run db:seed:student    # seed test student
```

Always run `typecheck` + `lint` before claiming work is done.

## Architecture

- **Route groups**: `(student)/`, `(admin)/`, `(parent)/`, `(public)/`, `(onboarding)/` — each has its own layout
- **Server actions**: `src/server/actions/*.ts` — all use `"use server"` directive, Zod validation, return `{ error?, fieldErrors? }`
- **API routes**: `src/app/api/` — RESTful endpoints for chat streaming, challenges, documents, etc.
- **AI layer**: `src/server/ai/` — tutor, challenge generator, evaluator, RAG, curriculum
- **Auth**: Custom JWT via `jose` (NOT NextAuth). Session stored in httpOnly cookie. See `src/lib/session.ts`
- **Prisma client**: Generated to `generated/prisma` (NOT `@prisma/client` default). Import from `../../generated/prisma/client` in server files, or `@/lib/prisma` for the singleton
- **Path alias**: `@/` maps to `src/`

## AI Integration

Multi-provider fallback chain in `src/lib/ai.ts`:
1. Groq (with key rotation across `GROQ_API_KEY`, `GROQ_API_KEY_2`, `GROQ_API_KEY_3`)
2. Gemini (free fallback)
3. Sumopod (deepseek-v4-flash)

Model selection: `model: "heavy"` uses Groq/fallback chain; `model: "fast"` uses Sumopod directly.

## Prisma

- Schema: `prisma/schema.prisma`
- Migrations: `prisma/migrations/`
- Seeds: `prisma/seed.ts`, `prisma/seed-student.ts`, `prisma/seed-parent.ts`
- Config: `prisma.config.ts` (runs with `bun --bun run prisma`)
- Prisma commands need `rtk bunx prisma <cmd>` or the npm script equivalents

## Testing

- Vitest, config in `vitest.config.ts`
- Tests live in `__tests__/` directories adjacent to source: `src/server/ai/__tests__/`, `src/server/learning/__tests__/`, `src/server/__tests__/`
- Pattern: `*.test.ts`
- Run: `rtk bun test`

## UI

- shadcn components in `src/components/ui/` (style: radix-rhea)
- Tailwind v4 via `@tailwindcss/postcss`
- Fonts: Fredoka (headings), Nunito (body), Geist (mono)
- Animations: Framer Motion
- Icons: Lucide

## Key Patterns

- Server actions return `AuthActionState` shape: `{ error?: string, fieldErrors?: Record<string, string> }`
- Rate limiting via DB-backed `RateLimit` model (`src/lib/rate-limit.ts`)
- AI quota tracking per user per day (`DailyAiQuota` model)
- Embeddings stored as text (JSON-serialized arrays), not native pgvector
- `safeParseJson()` in `src/lib/ai.ts` handles messy LLM JSON output (code fences, trailing commas, comments)
