# Repository Guidelines

## Project Overview

Spark AI is an adaptive AI tutoring platform for Indonesian high school (SMA/SMK) students. It provides personalized learning through a Socratic AI tutor, daily adaptive challenges, mastery tracking, document-based RAG, gamification (XP/streaks/badges), and role-based dashboards for students, parents, and admins.

## Architecture & Data Flow

Next.js 16 (App Router) + React 19 + Bun + Prisma 7 + PostgreSQL (Neon).

**Layer architecture:**

| Layer | Path | Purpose |
|-------|------|---------|
| UI | `src/components/` | Client components by role: `student/`, `parent/`, `admin/`, `auth/`, `onboarding/`, `shared/`, `ui/` (shadcn) |
| Routes | `src/app/` | Server components as pages, API routes for streaming (SSE), auth redirect |
| Actions | `src/server/actions/` | `"use server"` functions with Zod validation, return `{ error?, fieldErrors? }` |
| AI | `src/server/ai/` | Tutor (Socratic), challenge generator, evaluator, RAG, curriculum |
| Learning | `src/server/learning/` | Mastery (0–100), difficulty (continuous), adaptive (rolling window), mix composition |
| Documents | `src/server/documents/` | Upload → extract → chunk → embed → RAG retrieval |
| Infra | `src/lib/` | Auth (JWT), Prisma client, rate limiting, AI quota, prompt sanitization, gamification, DB locks |

**Route groups** (role-based): `(student)/`, `(parent)/`, `(admin)/`, `(public)/`, `(onboarding)/`, `auth/` — each has its own layout.

**Key data flows:**

- **Chat**: Client → `POST /api/chat/[sessionId]/stream` → quota check → load session → embed query → RAG retrieve → `generateTutorStream` (system prompt with mastery/style/context) → SSE stream → save to DB
- **Challenge**: Server action → DB lock → quota check → build `DailyMixInput` from mastery/weak concepts/history → AI generates mix plan (Zod-validated JSON) → persist → release lock
- **Document**: Upload → extract text (PDF/DOCX) → chunk (900 chars) → embed → store as JSON arrays → cosine similarity retrieval at query time

**AI provider chain** (`src/lib/ai.ts`): Groq (3 API keys, round-robin, LLaMA 3.3 70B) → Gemini 2.0 Flash → Sumopod (DeepSeek v4 Flash) → glm-5. Heavy model for tutoring/challenges; fast model uses DeepSeek directly. Timeouts: 30s text, 60s stream, 15s embedding.

## Key Directories

```
src/
├── app/                    # Next.js App Router pages & API routes
│   ├── (student)/          # Student dashboard, chat, challenges, subjects
│   ├── (parent)/           # Parent dashboard
│   ├── (admin)/            # Admin panel
│   ├── (public)/           # Landing page
│   ├── (onboarding)/       # Onboarding wizard
│   ├── auth/               # Login, register, OAuth callback
│   └── api/                # API routes (chat streaming, etc.)
├── components/
│   ├── student/            # Student-specific client components
│   ├── parent/             # Parent components
│   ├── admin/              # Admin components
│   ├── onboarding/         # Onboarding wizard
│   ├── shared/             # Cross-role shared components
│   └── ui/                 # shadcn primitives (radix-rhea style)
├── lib/                    # Infrastructure: ai, session, prisma, rate-limit, gamification
├── server/
│   ├── actions/            # Server actions (auth, chat, challenges, etc.)
│   ├── ai/                 # AI logic: tutor, challenge, evaluator, rag, curriculum
│   ├── learning/           # Adaptive engine: mastery, difficulty, mix, strength
│   └── documents/          # Document pipeline: embeddings, features
prisma/
├── schema.prisma           # 990-line schema, 30+ models, pgvector embeddings
├── migrations/             # PostgreSQL migrations
├── seed.ts                 # Curriculum seed data
├── seed-student.ts         # Test student seed
└── seed-parent.ts          # Test parent seed
```

## Development Commands

```bash
bun dev                     # Start dev server (Next.js with turbopack)
bun run build               # prisma generate + next build
bun run lint                # biome check
bun run format              # biome format --write
bun run typecheck           # bunx tsc --noEmit
bun test                    # vitest run
bun test:watch              # vitest (watch mode)
bun run db:migrate          # bunx prisma migrate dev
bun run db:generate         # bunx prisma generate
bun run db:seed             # bunx prisma db seed (curriculum data)
bun run db:seed:student     # bun ./prisma/seed-student.ts
bun run db:seed:parent      # bun ./prisma/seed-parent.ts
bun run db:studio           # bunx prisma studio
bun run db:push             # bunx prisma db push
```

## Code Conventions & Common Patterns

**TypeScript**: Strict mode, ES2017 target, bundler module resolution. Path alias `@/` → `./src/`.

**Server actions** follow a consistent pattern:
```ts
"use server";
// Zod schema for input validation
// Auth check via getSession()
// Business logic
// Return { error?: string, fieldErrors?: Record<string, string> }
```

**Auth**: Custom JWT via `jose` (NOT NextAuth). Session stored in httpOnly cookie with `sessionVersion` tracking. See `src/lib/session.ts`.

**AI integration**: All AI calls go through `src/lib/ai.ts` which handles provider fallback, key rotation, timeouts, and rate limit detection. Use `generateText()` / `streamText()` / `embed()` from that module — never call providers directly.

**LLM output parsing**: Use `safeParseJson()` from `src/lib/ai.ts` for messy LLM JSON (handles code fences, trailing commas, comments). Pair with Zod schemas for validation.

**Prisma client**: Import from `@/lib/prisma` (singleton). Schema generates to `generated/prisma` — do NOT import from `@prisma/client` default path.

**Prompt sanitization**: All user input to AI is sanitized via `src/lib/prompt-sanitize.ts` (strips injection patterns, control chars, limits lengths).

**Rate limiting**: DB-backed via `RateLimit` model (`src/lib/rate-limit.ts`). 5 attempts per 15-minute window.

**AI quota**: Per-user-per-day limits tracked in `DailyAiQuota` model (`src/lib/ai-quota.ts`). Chat: 50, questions: 20, materials: 5, practiceGen: 2, topicGen: 2.

**DB locks**: Generation locks via unique constraint (`src/lib/db-lock.ts`) for race prevention on serverless, 5-min TTL.

**Gamification**: Pure functions in `src/lib/gamification.ts` — XP rewards, quadratic level formula beyond L50, streak milestones.

**Embeddings**: Stored as JSON-serialized arrays (not native pgvector vectors). Retrieved via cosine similarity in `src/server/documents/embeddings.ts`.

**UI**: shadcn components (radix-rhea style) in `src/components/ui/`. Tailwind CSS v4. Framer Motion for animations. Three.js/R3F for 3D constellation view. Lucide icons.

## Important Files

| File | Purpose |
|------|---------|
| `src/lib/ai.ts` | Multi-provider AI fallback chain, text/embed/stream functions |
| `src/lib/session.ts` | JWT auth, sign/verify/refresh/invalidate |
| `src/lib/prisma.ts` | Prisma singleton with pg.Pool adapter |
| `src/lib/rate-limit.ts` | DB-backed rate limiting |
| `src/lib/ai-quota.ts` | Daily AI usage quotas |
| `src/lib/prompt-sanitize.ts` | Prompt injection defense |
| `src/lib/gamification.ts` | XP/level/streak calculations |
| `src/lib/db-lock.ts` | Generation race condition locks |
| `src/server/ai/tutor.ts` | Socratic AI tutor logic |
| `src/server/ai/challenge.ts` | Adaptive challenge generation |
| `src/server/ai/evaluator.ts` | Answer evaluation (MC/TF/open-ended) |
| `src/server/ai/rag.ts` | RAG context retrieval |
| `src/server/learning/mastery.ts` | Mastery score engine (0–100) |
| `src/server/learning/difficulty.ts` | Continuous difficulty system |
| `src/server/learning/adaptive.ts` | Rolling-window adaptive difficulty |
| `src/server/documents/embeddings.ts` | Document chunking & embedding |
| `src/server/actions/auth.ts` | Login/register server actions |
| `src/server/actions/challenges.ts` | Challenge generation actions (largest file) |
| `src/app/api/chat/[sessionId]/stream/route.ts` | Chat SSE streaming endpoint |
| `prisma/schema.prisma` | Database schema (990 lines, 30+ models) |
| `.env.example` | Environment variable template |

## Runtime & Tooling

- **Runtime**: Bun (package manager + runtime). Lockfile: `bun.lock`.
- **Framework**: Next.js 16.2.9 with App Router, React Compiler enabled.
- **Database**: PostgreSQL (Neon cloud) via Prisma 7.8 with `@prisma/adapter-pg`.
- **Linting**: Biome 2.2.0 (replaces ESLint + Prettier). Space indent, width 2. Recommended rules + Next.js/React domains. `noUnknownAtRules: off` for Tailwind.
- **Styling**: Tailwind CSS v4 via `@tailwindcss/postcss`. CSS vars in `src/app/globals.css`.
- **UI Library**: shadcn (radix-rhea style), Lucide icons, Framer Motion, Three.js/R3F.
- **Validation**: Zod for all input/output validation.
- **No Docker**, no monorepo, no CI/CD config, no git hooks.

## Testing & QA

**Framework**: Vitest 4.1.9, configured in `vitest.config.ts` with `globals: true`, `environment: 'node'`.

**Test location**: Colocated in `__tests__/` directories next to source:
- `src/server/ai/__tests__/` — AI generation tests
- `src/server/learning/__tests__/` — Learning algorithm tests
- `src/server/actions/__tests__/` — Server action tests
- `src/server/__tests__/` — Shared utility tests

**Naming**: `*.test.ts` exclusively.

**Test categories**:
- **Pure function tests** (majority): mastery, difficulty, quota, mix computation — no mocking needed
- **Zod schema validation tests**: regression guards for production validation rules
- **Server action tests**: mock prisma/session/navigation/AI, test full action flows
- **Source-code-reading tests**: reads production `.ts` files with `fs.readFileSync` to verify structural bug fixes remain in place

**Mocking patterns**:
```ts
vi.mock('server-only', () => ({}))  // bypass Next.js server-only guard
vi.mock('@/lib/prisma', ...)        // Prisma client mock
vi.mock('@/lib/session', ...)       // Auth mock
vi.mock('next/navigation', ...)     // Redirect mock (use vi.hoisted())
vi.mock('@/lib/ai', ...)            // AI/LLM mock
```

**No coverage config**, no e2e tests, no CI/CD pipeline.

**Quality gates**: Run `bun run typecheck` + `bun run lint` before committing.
