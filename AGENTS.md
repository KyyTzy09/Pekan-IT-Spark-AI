<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:project-structure-rules -->
# Project Structure Rules

## 1. Wajib ikut struktur yang sudah ditetapkan
- Semua file dan folder WAJIB mengikuti struktur di `frontend_route.md` (bagian "Struktur File").
- DILARANG membuat file/folder di luar struktur yang sudah ditentukan tanpa persetujuan.
- Tidak ada file nyasar di root project.

## 2. Server Component first
- Default = Server Component. `"use client"` hanya jika ada `useState`/`useEffect`/event handler/Framer Motion/tRPC hook/Context Provider.
- DILARANG pakai `"use client"` karena malas mikir.
- DILARANG bikin Route Handler (`route.ts`) cuma buat baca Prisma — panggil langsung di Server Component.

## 3. Component placement
- `components/ui/` — cuma untuk shadcn primitives dan turunannya.
- `components/landing/` — komponen halaman publik (landing, about, help).
- `components/student/` — komponen spesifik area siswa.
- `components/parent/` — komponen spesifik area orang tua.
- `components/admin/` — komponen spesifik area admin.
- `components/shared/` — komponen yang dipakai di banyak tempat (bukan ui primitive).
- DILARANG campur aduk — komponen login taruh di `components/student/` atau `components/auth/` yang sesuai.

## 4. Naming convention
- Folder: `kebab-case` (contoh: `daily-quest`, `study-buddy`, `forgot-password`).
- File komponen: `PascalCase.tsx` (contoh: `StudyBuddyCard.tsx`, `DailyQuestList.tsx`).
- File utility/helper: `kebab-case.ts` (contoh: `auth.ts`, `prisma.ts`, `query-client.ts`).
- File route page: `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx` — konsisten Next.js App Router.

## 5. Route groups dan middleware
- Route groups di `src/app/` wajib sesuai `frontend_route.md`:
  - `(public)/` — landing, legal, marketing
  - `(auth)/` — login, register, forgot-password
  - `(onboarding)/` — onboarding siswa
  - `(student)/` — semua fitur siswa (wajib login)
  - `(parent)/` — monitoring orang tua
  - `(admin)/` — admin panel
- Middleware proteksi role sesuai tabel di `frontend_route.md`.

## 6. API / tRPC
- `src/trpc/routers/` — setiap domain punya file sendiri (auth, subject, topic, chat, gamification, dll).
- Server Actions di `src/server/actions/` — jangan campur di file route atau komponen.
- AI logic di `src/server/ai/` — pisah dari handler HTTP.

## 7. Prisma schema
- Schema hanya di `prisma/schema.prisma` — DILARANG bikin model di luar sana.
- Migration lewat `bunx prisma migrate dev` — jangan edit langsung di DB.
- Seed data di `prisma/seed.ts`.

## 8. Library / dependency
- Cek `package.json` dulu sebelum install package baru — jangan double.
- Jangan install package yang ga dipake.
- Jangan pindahin dependency dari devDependencies ke dependencies atau sebaliknya sembarangan.

## 9. Code quality
- Wajib `bun run lint` (Biome) sebelum commit.
- Wajib `bun run typecheck` (tsc) sebelum commit.
- Tidak ada `any`, `@ts-ignore`, `@ts-expect-error` tanpa alasan tertulis.
- Tidak ada console.log di production code.

## 10. Perubahan struktur
- Kalau mau nambah route, file, atau folder BARU di luar yang sudah ditentukan, tanyakan dulu.
- Kalau disetujui, update `frontend_route.md` dan `todo.md` biar sinkron.
- Jangan biarkan dokumentasi struktur ketinggalan dari kode.
<!-- END:project-structure-rules -->
