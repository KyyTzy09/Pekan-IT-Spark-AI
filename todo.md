> **Last updated:** 2026-06-17 (v0.96 — Phase 7 partial: XP/Level unbounded + Streak + Badge check + 50 badges seeded. UI mini-celebration belum di-wire)
> **Status:** Phase 0 ✅; Phase 1 ✅; Phase 2.1 ✅; Phase 2.2 ✅; Phase 2.3 ✅; Phase 3.1 ✅; Phase 3.2 ✅; Phase 3.3 ✅; Phase 4 ✅; Phase 6 ✅; Phase 7 (7.1 ✅ 7.2 ✅ 7.3 partial)
> **Convention:** `[ ]` todo, `[x]` done, `[~]` in progress, `[!]` blocked
> **Package Manager:** `bun` — semua command di dokumen ini pakai `bun` / `bunx`
> **⚠️ WAJIB pakai `rtk` prefix:** Setiap command `bun` / `bunx` WAJIB ditulis `rtk bun` / `rtk bunx` (cth: `rtk bunx prisma migrate dev`, bukan `bunx prisma migrate dev`). Ini untuk konsistensi tooling environment.


---

## 🎯 Legend

- 🔴 P0 — Critical path, MVP blocker
- 🟠 P1 — High value, not MVP blocker
- 🟡 P2 — Nice to have
- 🟢 P3 — Future

---

## ⚠️ ATURAN KETAT — Server Component First

**Prinsip:** Default = Server Component. Client Component = pengecualian.

### 1. `"use client"` hanya boleh dipakai kalo ADA SALAH SATU ini:
   - `useState` / `useEffect` / `useContext` / custom hooks browser
   - Event handler (`onClick`, `onSubmit`, `onChange`, dll)
   - Framer Motion / animasi JS
   - Context Provider (`SessionProvider`, `ThemeProvider`, dll)
   - Real-time client data fetching (bisa pake `useEffect` + `fetch()` atau RSC revalidate)

### 2. DILARANG:
   - ❌ Pake `"use client"` cuma karena males mikir — itu dosa performa
   - ❌ Bikin Route Handler (`route.ts`) cuma buat baca data dari Prisma — panggil Prisma langsung di Server Component
   - ❌ Pake `fetch()` dari client kalo bisa Server Action atau Server Component

### 3. WAJIB:
   - ✅ **Mutasi data → Server Action** (form action atau dipanggil dari form) — type-safe end-to-end, no API layer needed
   - ✅ **Read data → Server Component** (langsung query Prisma di SC) — no need for tRPC, REST, atau custom API
   - ✅ Halaman publik (landing, courses, about, help) → Server Component → SEO optimal
   - ✅ Halaman private (dashboard, chat, onboarding) → tetap Server Component, interactive parts di-extract jadi CC
   - ✅ Server Component untuk initial fetch, client hydration minimal
   - ✅ Pakai `revalidatePath()` / `revalidateTag()` setelah mutation biar cache tetap fresh

### 4. Hukumannya:
   - Langgar aturan 1 → JS bundle bengkak → loading lama → user kabur
   - Langgar aturan 2 → latency nambah + kode tambahan yang gak perlu
   - **Konsekuensi:** Code review REJECT. PR gak bakal di-merge.

---

## Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Framework | Next.js 16+ App Router |
| Language | TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Database | PostgreSQL (Neon / local) |
| ORM | Prisma |
| Auth | Auth.js v5 (NextAuth.js beta) atau Better Auth |
| API | **Next.js Server Actions + Server Components** (no tRPC, no custom API layer) |
| AI | Vercel AI SDK + OpenAI / Groq / Google Gemini |
| Vector DB | pgvector (PostgreSQL extension) |
| Forms | React Hook Form + Zod |
| Animation | Framer Motion (dengan hemat) |
| Package Manager | bun |

---

## Phase 0 — Foundation Setup (Minggu 1)

### 0.1 Project Initialization
- [x] 🔴 Inisialisasi Next.js 16 dengan App Router
- [x] 🔴 Setup TypeScript strict mode
- [x] 🔴 Install Tailwind CSS dan konfigurasi dasar
- [x] 🔴 Install shadcn/ui
- [x] 🔴 Setup folder structure: `src/app`, `src/components`, `src/lib`
- [x] 🔴 Setup Biome
- [x] 🔴 Setup environment variables template (`.env.example`)

### 0.2 Backend Infrastructure (Prisma + PostgreSQL)
- [x] 🔴 Install Prisma: `rtk bun add prisma @prisma/client`
- [x] 🔴 `rtk bunx prisma init` → generate `prisma/schema.prisma` & `.env`
- [x] 🔴 Set `DATABASE_URL` di `.env`
- [x] 🔴 Define initial schema di `prisma/schema.prisma`:
  - User, Account, Session (Auth.js standard)
  - StudentProfile, ParentProfile
  - Subject, Topic, Concept, ConceptPrerequisite (knowledge graph)
  - Question, QuestionAttempt, Quiz, QuizAttempt
  - ChatSession, ChatMessage
  - Badge, UserBadge, Achievement, UserAchievement
  - XpTransaction, Level, Streak, DailyQuest, WeeklyChallenge
  - StudyBuddy, AvatarCustomization
  - LearningPlan, LearningActivity
  - Document (user uploaded PDF/DOCX as Markdown)
  - ParentStudentLink (untuk invite code orang tua)
- [x] 🔴 First migration: `rtk bunx prisma migrate dev --name init`
- [x] 🔴 Add Prisma client singleton di `src/lib/prisma.ts` (hot-reload safe, adapter-pg)
- [x] 🔴 Add seed script: `prisma/seed.ts` + `rtk bunx prisma db seed`
- [x] 🔴 Seed data: 1 admin, sample subjects (Matematika, B.Indo, B.Inggris, IPA), topics, levels, badges
- [x] 🟢 ~~Install dan enable pgvector untuk embeddings (RAG AI)~~ — **Aktif di Neon**, tapi implementasi RAG ditunda
- [x] 🟠 Setup Prisma Studio script

### 0.3 Auth Setup (Auth.js v5)
- [x] 🔴 Install Auth.js: `next-auth@beta` + `@auth/prisma-adapter`
- [x] 🔴 Konfigurasi auth adapter di Prisma schema
- [x] 🔴 Setup auth config dengan Credentials + bcrypt di `src/lib/auth.ts`
- [x] 🔴 Extend Session type via `src/types/next-auth.d.ts` dengan role
- [x] 🔴 Setup Credentials provider (email + password dengan bcrypt)
- [x] 🔴 Setup route handler auth `src/app/api/auth/[...nextauth]/route.ts`
- [x] 🔴 Middleware proteksi route berdasarkan role (`student`, `parent`, `admin`) di `src/middleware.ts` (`src/proxy.ts`)
- [x] 🔴 Halaman login `/auth/login` dan register `/auth/register` + API register
- [x] 🟠 Setup OAuth provider opsional (Google) untuk kemudahan login — env-gated, auto-disable kalau env kosong

### 0.4 Server Actions + Server Components Data Layer
- [x] 🔴 Pakai Server Actions (`"use server"`) di `src/server/actions/` untuk semua mutasi (onboarding, invite, dashboard)
- [x] 🔴 Pakai Server Components untuk read data langsung via Prisma (no API layer)
- [x] 🔴 Validasi semua Server Action input dengan Zod
- [x] 🔴 Pakai `revalidatePath()` setelah mutasi biar cache SC tetap fresh
- [x] 🔴 ~~Setup tRPC + TanStack Query (DIBUANG)~~ — Next.js Server Actions + SC udah cukup untuk semua use case

### 0.5 AI SDK Setup
- [x] 🔴 Install Vercel AI SDK: `ai` + `@ai-sdk/openai`
- [x] 🔴 Setup environment variables: `OPENAI_API_KEY` / `GROQ_API_KEY` / `GEMINI_API_KEY` (di `.env`)
- [x] 🔴 Buat service layer AI di `src/server/ai/`:
  - `tutor.ts` — generate Socratic response (streaming)
  - `evaluator.ts` — evaluate answer and give feedback
  - `rag.ts` — retrieve relevant context (pgvector similarity, fallback keyword-based)
  - `curriculum.ts` — **AI curriculum designer**: generate outline + 5–8 soal pretest pilihan ganda untuk mapel *custom* (Zod-validated, Vercel AI SDK `generateObject`)
- [x] 🔴 Buat service layer Adaptive Learning di `src/server/learning/`:
  - `adaptive.ts` — pure functions: `selectNextDifficulty`, `computeMasteryUpdate` (EMA), `deriveConceptStatus`, `checkPrerequisites`, `summarizeSession`
- [ ] 🟠 Setup rate limiting untuk API AI

### 0.6 UI Foundation
- [x] 🔴 Install komponen shadcn dasar: button, input, card, dialog, sheet, avatar, badge, progress, tabs
- [x] 🔴 Setup design tokens (colors, typography, spacing)
- [x] 🔴 Buat layout dasar: root layout
- [x] 🔴 Setup dark/light mode
- [x] 🔴 Buat loading skeleton reusable di `src/components/shared/loading-skeleton.tsx`

### 0.7 Bun.js Specific Setup
- [x] 🔴 Pastikan `bun` sudah terinstall (bukan npm/yarn/pnpm)
- [x] 🔴 Tambahkan scripts di `package.json`:
  - `"dev": "next dev"`
  - `"build": "next build"`
  - `"start": "next start"`
  - `"db:studio": "rtk bunx prisma studio"`
  - `"db:migrate": "rtk bunx prisma migrate dev"`
  - `"db:seed": "rtk bunx prisma db seed"`
  - `"db:generate": "rtk bunx prisma generate"`
  - `"db:push": "rtk bunx prisma db push"`
  - `"lint": "biome check"`
  - `"typecheck": "rtk bunx tsc --noEmit"`
- [x] 🔴 Setup Prisma config `prisma.config.ts` dengan seed command
- [ ] 🔴 Setup Prisma binary target untuk Bun: `binaryTargets = ["native", "debian-openssl-3.0.x"]` (jika deploy ke Linux)
- [x] 🟠 Pastikan Prisma generate compatible dengan Bun runtime

---

## Phase 1 — Data Model & Knowledge Graph (Minggu 1–2)

### 1.1 Core Learning Content Model
- [x] 🔴 Finalisasi schema Subject, Topic, Concept (sudah di Prisma schema dengan relasi dan enum)
- [x] 🔴 Setup enum untuk education level: `SMA`, `SMK`
- [x] 🔴 Setup enum untuk subject: `MATEMATIKA`, `BAHASA_INDONESIA`, `BAHASA_INGGRIS`, `IPA`
- [x] 🔴 Setup Concept status: `NOT_STARTED`, `LEARNING`, `MASTERED`, `STRUGGLING`
- [x] 🔴 Seed kurikulum dasar: 4 mata pelajaran, 5 topik Matematika
- [x] 🔴 Setup `ConceptPrerequisite` untuk skill tree

### 1.2 Student Knowledge Profile
- [x] 🔴 Buat model `StudentKnowledgeProfile`
- [x] 🔴 Setup konsep mastery score (0–100%) per concept per student
- [x] 🔴 Setup adaptive difficulty level per student per topic (via `StudentKnowledgeProfile`)
- [x] 🔴 Setup learning style preference (visual, textual, example-heavy, Socratic) — enum di `StudentProfile`
- [x] 🔴 Setup response depth preference (ringkas, menengah, lengkap) — enum `ResponseDepth`

### 1.3 Question Bank
- [x] 🔴 Buat model `Question` dengan tipe:
  - multiple choice
  - short answer
  - essay / problem solving
  - true/false
- [x] 🔴 Setup difficulty level: `EASY`, `MEDIUM`, `HARD`, `ADVANCED`
- [x] 🔴 Setup Bloom taxonomy level
- [x] 🔴 Setup tagging: concept, topic, skill (via `conceptId` + `tags` array)
- [x] 🔴 Setup correct answer, explanation, hint, common misconceptions
- [x] 🔴 Seed 50+ questions across subjects

### 1.4 Vector Embeddings for RAG
- [x] 🟠 Setup `ConceptEmbedding` dan `DocumentEmbedding` model
- [x] 🟠 Generate embeddings untuk 44 konsep (pgvector + HNSW index)
- [x] 🟠 Implement similarity search (cosine distance) dengan fallback keyword search

---

## Phase 2 — Authentication & Onboarding (Minggu 2)

### 2.1 Role-Based Registration
- [x] 🔴 Halaman pilih role saat register: Siswa, Orang Tua (card-style dengan role-aware form)
- [x] 🔴 Form registrasi siswa: nama, email, password, jenjang (SMA/SMK), kelas, sekolah
- [x] 🔴 Form registrasi orang tua: nama, email, password, kode undangan anak (validasi `parent_student_links`)
- [x] 🔴 Validasi semua form dengan Zod (discriminated union per role)
- [x] 🟠 Auto-redirect onboarded baru ke `/onboarding` (middleware + JWT `isOnboarded` flag)

> **Catatan:** Role "Guru" dihapus dari registrasi publik. Guru tidak lagi jadi target user Spark Ai (lihat Phase 9 dihapus).

### 2.2 Student Onboarding Flow
- [x] 🔴 Welcome screen dengan karakter Spark
- [x] 🔴 Pilih mata pelajaran fokus
- [x] 🔴 Pretest ringkas untuk menentukan level awal (5–10 soal per mapel)
- [x] 🔴 Pilih gaya belajar preferensi
- [x] 🔴 Generate initial knowledge profile dari pretest
- [x] 🔴 Setup daily learning reminder (opsional)

### 2.3 Parent-Child Linking
- [x] 🟠 Generate invitation code dari akun siswa
- [x] 🟠 Orang tua input kode untuk hubungkan
- [x] 🟠 Model `ParentStudentLink` dengan status pending/accepted

### 2.4 (Removed)
> **Catatan:** Fitur teacher-class dihapus dari scope awal. Spark Ai fokus ke siswa + monitoring orang tua. Tidak ada teacher dashboard, tidak ada invite code untuk guru.

---

## Phase 3 — Student Home & Dashboard (Minggu 2–3)

### 3.1 Student Dashboard Layout
- [x] 🔴 Buat layout dashboard siswa dengan sidebar/bottom nav mobile-friendly
- [x] 🔴 Section: continue learning, daily quest, streak, level progress
- [x] 🔴 Quick access: chat dengan Spark, latihan, jelajah topik
- [x] 🔴 Optimized for mobile (Android low-mid spec)

### 3.2 Home Feed
- [x] 🔴 Tampilkan rekomendasi belajar harian
- [x] 🔴 Tampilkan sapaan personal dari Spark
- [x] 🔴 Tampilkan progress ringkasan per mata pelajaran
- [x] 🔴 Tombol aksi utama: "Tanya Spark", "Latihan Hari Ini", "Lanjutkan Topik"

### 3.3 Subject & Topic Explorer
- [x] 🔴 Halaman daftar mata pelajaran
- [x] 🔴 Halaman detail topik dengan skill tree
- [x] 🔴 Progress bar per topik (0–100%)
- [x] 🔴 Tandai konsep yang sudah dikuasai, sedang dipelajari, belum
- [x] 🔴 Visualisasi konstelasi bintang (Knowledge Star) per mapel

### 3.4 Learning Plan
- [ ] 🟠 Generate rencana belajar mingguan personal
- [ ] 🟠 Track completion learning plan
- [ ] 🟠 Adaptasi rencana berdasarkan performa

---

## Phase 4 — AI Tutor Chat (Socratic) (Minggu 3–4)

### 4.1 Chat Interface
- [x] 🔴 Halaman chat `/chat` dengan UI mirip chat app
- [x] 🔴 Tampilkan avatar Spark yang bisa dikustomisasi
- [x] 🔴 Input teks untuk pertanyaan siswa
- [x] 🔴 Bubble chat dengan styling berbeda untuk siswa dan Spark
- [x] 🔴 Loading state saat AI merespons
- [x] 🔴 Chat history persistent di database

### 4.2 Socratic Tutoring Engine
- [x] 🔴 System prompt untuk karakter Spark: sabar, suportif, tidak menghakimi
- [x] 🔴 Prompt strategy: jangan langsung kasih jawaban, tanya balik pemandu
- [x] 🔴 Personifikasi bahasa Indonesia kasual yang ramah anak muda
- [x] 🔴 Adaptive response berdasarkan knowledge profile siswa
- [x] 🔴 Kontekstualisasi dengan kurikulum dan konsep yang sedang dipelajari

### 4.3 Chat Session Management
- [x] 🔴 Model `ChatSession` dan `ChatMessage`
- [x] 🔴 List chat session sebelumnya
- [x] 🔴 Bisa melanjutkan chat lama atau mulai chat baru
- [x] 🔴 Auto-title chat dari topik pertama

### 4.4 Anti-Cheating Guardrails
- [x] 🔴 Deteksi jika siswa minta jawaban langsung untuk PR/ujian
- [x] 🔴 Respon dengan bimbingan Socratic, bukan jawaban instan
- [x] 🔴 Refuse topik di luar edukasi
- [x] 🔴 Disclaimer bahwa ini AI, bukan manusia

### 4.5 Multimodal Input (P2)
- [ ] 🟡 Upload gambar soal matematika
- [ ] 🟡 Input suara (voice-to-text)
- [ ] 🟡 Render LaTeX / MathML untuk rumus

### 4.6 Hybrid Subject System (NEW — keputusan post-Phase 4, Juni 2026)
> **Konteks:** Realita siswa SMA/SMK belajar 9–13 mapel (bukan 4 yang seed awal). Diskusi panjang dengan user menghasilkan keputusan: **hybrid 3-lapis** — seed nasional curated + adaptive engine + custom AI per-user (terisolasi).

#### 4.6.1 Lapis 1 — Schema Foundation (DONE)
- [x] 🔴 `Subject`: +`isCustom` (bool), +`createdById` (FK User, SetNull on delete), +`source` (`SubjectSource` enum: `OFFICIAL`/`AI_GENERATED`/`USER_CREATED`), +`isVerified` (bool, default true)
- [x] 🔴 `SubjectSlug` enum diperluas: +`SEJARAH`, +`GEOGRAFI`, +`EKONOMI`, +`SOSIOLOGI`, +`PPKN`, +`SENI_BUDAYA`, +`PJOK`, +`PRAKARYA`, +`BAHASA_DAERAH`, +`CODING`, +`CUSTOM`
- [x] 🔴 `Topic` & `Concept`: +`isCustom` (bool) untuk track AI-generated content
- [x] 🔴 `User`: +`customSubjects` reverse relation
- [x] 🔴 Indexes: `isCustom`, `source`, `createdById` untuk query performant
- [x] 🔴 Push schema via `rtk bunx prisma db push --accept-data-loss` + regenerate client

#### 4.6.2 Lapis 2 — Adaptive Difficulty Engine (DONE — siap dipakai Phase 6)
- [x] 🔴 `src/server/learning/adaptive.ts` — pure functions, 0 side effect
- [x] 🔴 `selectNextDifficulty(attempts, baseline)`: rolling accuracy 5 attempt, promote ≥70%, demote 3 wrong streak atau rolling accuracy <40%
- [x] 🔴 `computeMasteryUpdate(prevScore, newAttempt)`: EMA learning rate 0.2, target 1/0
- [x] 🔴 `deriveConceptStatus(masteryScore)`: ≥80% MASTERED, 40–80% LEARNING, <40% tapi >0 STRUGGLING, 0 NOT_STARTED
- [x] 🔴 `checkPrerequisites(prerequisites, masteryByConcept, threshold)`: weak prereqs detection by `minMasteryScore`
- [x] 🔴 `summarizeSession(attempts, currentDifficulty, masteryByConcept)`: total, streak, recommended difficulty
- [x] 🔴 Exported `ADAPTIVE_CONFIG` constants untuk audit

#### 4.6.3 Lapis 3 — AI Curriculum Designer (DONE)
- [x] 🔴 `src/server/ai/curriculum.ts` — Vercel AI SDK `generateObject` + Zod schema
- [x] 🔴 Output schema: description, icon (emoji), color (hex), 3–6 topik, 3–6 konsep/topic, 5–8 pretest questions
- [x] 🔴 Hard validation: `correctAnswer` harus persis di `options` (case-sensitive)
- [x] 🔴 Hard validation: `topicIndex` harus merujuk topik yang ada
- [x] 🔴 System prompt: "Jelas, tidak ambigu, 1 jawaban benar pasti, no gambar/diagram needed, relevan dengan nama mapel"
- [x] 🔴 Temperature 0.4 (deterministic-ish, tidak terlalu random)

#### 4.6.4 Server Actions (DONE)
- [x] 🔴 `addCustomSubject(name, context?)`: full transaction (subject + topics + concepts + 5–8 pretest questions + unique slug suffix)
- [x] 🔴 `addCustomSubject` cek duplikat (case-insensitive): kalau mapel nasional udah ada → error, kalau custom user sendiri udah ada → return existing
- [x] 🔴 `recordQuestionAttempt(questionId, answer, isCorrect, timeSpent?)`: catat attempt + update `StudentKnowledgeProfile` via EMA
- [x] 🔴 `selectNextQuestionDifficulty(conceptId, baseline)`: rolling accuracy → next difficulty
- [x] 🔴 Zod validation di semua input
- [x] 🔴 `revalidatePath('/subjects', '/dashboard', '/onboarding')` setelah mutasi

#### 4.6.5 UI (DONE)
- [x] 🔴 `AddSubjectDialog` (CC): bottom-sheet on mobile, modal on desktop
  - Tab 1 "Mapel nasional": 6 suggested cards (Sejarah, Geografi, Ekonomi, Sosiologi, PPKN, Seni Budaya) dengan state "Segera hadir" + tip ke tab custom
  - Tab 2 "Custom + AI": input nama + context (280 char counter) + 8 popular suggestions (Bahasa Jawa, Arab, Coding, Desain Grafis, Musik, dll)
  - Loading state: "Spark lagi mikir keras…" dengan `Loader2` + `Wand2` icons
  - Success state: animasi checkmark + auto-redirect ke subject detail
- [x] 🔴 `SubjectsListView`: section pisah "Mapel kamu · Custom + AI" untuk mapel `isCustom` (purple theme), section utama untuk mapel nasional (coral theme)
- [x] 🔴 Subject card: badge "AI" (Wand2 icon) untuk custom subjects, badge "Fokus" untuk mapel di `focusedSubjects`
- [x] 🔴 Dashboard "Progress per mapel" section: tombol "Tambah mapel" (Wand2) di header + tile "Mau belajar mapel lain?" dengan blob gradient coral/purple di grid

#### 4.6.6 Seed Tambahan (PARTIAL DONE — concept/soal ~75% target, prereq chains seeded)
- [x] 🟠 Seed 4 mapel IPS (Sejarah, Geografi, Ekonomi, Sosiologi): 21/22/22/20 konsep & 33/30/37/27 soal (target ~30/~40) — cukup untuk launching, tambah nanti incremental
- [x] 🟠 Seed PPKN: 20 konsep & 30 soal (target ~25/~35) — cukup, tambah nanti incremental
- [x] 🟠 Update `prisma/seed.ts` untuk include mapel-mapel baru — semua subject/topic/concept/question ada
- [x] 🟠 Prerequisite chains: 73 edges seeded via `PREREQUISITES_BY_SUBJECT` + `seedPrerequisites()` (topik → topik, min mastery 0.6–0.7)
- [x] 🟢 Generate embeddings (pgvector) untuk concept baru — `generateAndSeedEmbeddings()` sudah panggil `embedMany`; skip gracefully kalau provider ga support

#### 4.6.7 Integrasi Adaptive Engine ke Practice (DONE)
- [x] 🟠 Server action `getNextPracticeQuestion()`: filter konsep by prereq satisfied → call `selectNextQuestionDifficulty()` → pick un-attempted question by difficulty
- [x] 🟠 Server action `submitPracticeAnswer()`: validate answer server-side → panggil `recordQuestionAttempt()` → return newMastery + newStatus + unlocked concepts
- [x] 🟠 `<PracticePlayer />` client component: pilih opsi → submit → tampilkan feedback (benar/salah, correct answer, mastery %, status badge)
- [x] 🟠 UI: header cards "Difficulty: MEDIUM (akurasi X%)" + "Akurasi kamu X%" + "Streak & konsep" — transparansi penuh
- [x] 🟠 Trigger MASTERED: `<MasteredCelebration />` modal (party popper, spring animation) + list "Konsep dependen baru terbuka"
- [x] 🟠 Update `src/app/(student)/practice/page.tsx`: dari stub "segera hadir" jadi fully wired ke pipeline

#### 4.6.8 Admin Review untuk Custom Subjects (Phase 10)
> Catatan: sesuai 4.6.9.2 (anti-pattern), mapel custom **TIDAK** dipromosikan ke kurikulum global. Admin cuma verify — `isCustom: true` tetap.
- [ ] 🟢 Admin page: list custom subjects dengan `isVerified: false`
- [ ] 🟢 Approve → set `isVerified: true` saja (TETAP `isCustom: true`, JANGAN promote ke global) — mapel jadi bisa dishare ke siswa lain, badge jadi "Verified", tapi tetap di section "Custom + AI"
- [ ] 🟢 Reject → soft delete (atau set `isActive: false`) + kasih feedback ke siswa
- [ ] 🟢 Audit log: siapa yang approve/reject kapan

#### 4.6.9 Anti-Pattern (Sama seperti 7.10)
- [x] 🔴 Tidak boleh auto-generate soal pretest untuk mapel nasional (kualitas terlalu kritis) — **PASS**: onboarding pretest (`src/app/onboarding/page.tsx`) pakai `prisma.question.findMany` dari seed; AI generate cuma di `addCustomSubject` (`isCustom: true`)
- [x] 🔴 Tidak boleh biarkan mapel custom masuk kurikulum global — **PASS + spec sync**: 4.6.8 diupdate (admin approve cuma verify, TETAP `isCustom: true`, JANGAN promote)
- [x] 🔴 Tidak boleh pakai ML/RL untuk difficulty selection (aturan deterministik lebih transparan) — **PASS**: `src/server/learning/adaptive.ts` `selectNextDifficulty` pakai rolling accuracy + wrong-streak + promote/demote thresholds, fully deterministic
- [x] 🔴 Tidak boleh skip prerequisite check — **FIXED**: `src/server/actions/practice.ts` `getNextPracticeQuestion()` line ~196 fallback ke root prereq concept (yg punya dependents) instead of all concepts; root concepts by definition always eligible (no prereqs), blocked concepts never picked
- [x] 🔴 Mapel custom harus tetap ditampilkan dengan disclaimer "AI-generated" — **FIXED**: 
  - `src/components/student/subjects-view.tsx` Section header "Custom + AI" dapat inline disclaimer
  - SubjectCard badge berubah dari "AI" → "AI-generated" (visible, bukan cuma tooltip)
  - `SubjectDetailView` header dapat prominent purple box disclaimer "Mapel ini AI-generated oleh Spark — bukan kurikulum nasional. Selalu konfirmasi materi ke guru untuk hal-hal penting."

---

## Phase 5 — Document Upload & AI Material Assistant (Minggu 4)

### 5.1 Document Upload Interface
- [x] 🔴 Halaman upload dokumen `/upload` — `src/app/(student)/upload/page.tsx` rewrite dari stub
- [x] 🔴 Support format PDF dan DOCX — validasi `application/pdf` + `.pdf` + DOCX
- [x] 🔴 Validasi file: max size (10 MB), max pages (50), tipe file — server-side di `uploadDocument()` + client-side di `UploadView`
- [x] 🔴 Progress upload dan loading state — state machine: `idle|validating|uploading|processing|success|error` dengan status bar
- [x] 🔴 Tampilkan daftar dokumen yang sudah diunggah per siswa — `listDocuments()` + AnimatePresence list dengan delete + Tanya Spark CTA

### 5.2 Document Processing Pipeline
- [x] 🔴 Extract text dari PDF: `pdf-parse` (v2.4.5 class API) — `src/server/documents/extract.ts` `extractFromPdf()`
- [x] 🔴 Extract text dari DOCX: `mammoth` — `extractFromDocx()`
- [x] 🔴 Convert extracted text ke Markdown bersih — `cleanTextToMarkdown()` (normalisasi whitespace, heading detection dari ALL-CAPS lines)
- [x] 🔴 Simpan Markdown di DB (`Document` model dengan `content` @db.Text) — `prisma.document.create({ data: { content: extracted.text, ... } })`
- [x] 🔴 Simpan metadata: originalName, size, pageCount, mimeType, uploadedAt — semua field terisi
- [x] 🔴 Link dokumen ke `User` (siswa) dan opsional ke `ChatSession` — schema migration `20260616120000_add_document_chat_session` tambah `documents.chatSessionId` nullable + FK + index

### 5.3 AI-Powered Document Features
- [x] 🔴 Generate ringkasan materi inti dari dokumen — `src/server/documents/features.ts` `generateDocumentSummary()` pakai fastModel + zod schema (title, summary, keyPoints, hasHomework, homeworkTopic); cached di `Document.summary` (`getDocumentSummary` server action)
- [x] 🔴 Generate penjelasan materi berdasarkan dokumen dengan gaya siswa — handled via Socratic chat di 5.3 RAG (gaya siswa dipakai dari `studentProfile.learningStyle` + `responseDepth` di system prompt tutor)
- [x] 🔴 Deteksi apakah dokumen berisi pertanyaan/tugas → ubah jadi sesi latihan Socratic — `detectHomeworkAndSuggest()` + banner amber di SummaryModal: "Terdeteksi PR/tugas, topiknya X. Mau Spark bantu via Socratic?" + Tanya Spark CTA
- [x] 🔴 Generate quiz latihan otomatis dari isi dokumen — `generateQuizFromDocument()` dengan zod schema `quizQuestionSchema` (3-8 soal, 4 opsi, correctIndex, EASY/MEDIUM/HARD, explanation); `generateDocumentQuizAction` server action; modal UI di `QuizModal` component
- [x] 🔴 AI bisa di-tanya spesifik tentang isi dokumen (RAG-based Q&A) — `src/server/documents/embeddings.ts` chunking (900 char + 200 overlap, max 80 chunks/doc) + per-chunk embedding; `retrieveDocumentChunks()` top-k cosine sim; `src/server/actions/chat.ts` `sendMessage()` auto-fetches chunks dari `chatSession.documents[0]` dan include sebagai system message: "Jawab berdasarkan cuplikan; kalau ga ada di cuplikan, bilang ga nemu"

### 5.4 Advanced Document Handling (P1–P2)
- [ ] 🟠 OCR untuk PDF hasil scan atau foto dokumen — DEFERRED ke phase terpisah (butuh Tesseract binary atau tesseract.js WASM ~10MB; tidak di-install di stack ini). Ditandai di privacy note upload page supaya siswa tau.
- [x] 🟠 Deteksi dan render rumus matematika (LaTeX/MathML) — `src/server/documents/content-check.ts` `detectMathRegions()` regex parse `\(...\)`, `\[...\]`, `$$...$$`, `\begin{env}...\end{env}`; `src/components/shared/document-markdown.tsx` `DocumentMarkdownText` component render math via KaTeX (`renderToString` dengan displayMode); `katex/dist/katex.min.css` di-import di globals.css
- [x] 🟠 Handle tabel dan formatting kompleks — `src/server/documents/extract.ts` `extractFromPdf` panggil `parser.getTable()` (pdf-parse 2.4.5) dan konversi ke Markdown pipe-table; `detectMarkdownTables()` juga detect Markdown tables di text; `DocumentMarkdownText` render `<table>` dengan header/body styling
- [x] 🟠 Generate embeddings dari dokumen untuk retrieval context — DONE di 5.3 (`embedDocumentChunks()` per-chunk embeddings, `retrieveDocumentChunks()` cosine sim top-k)
- [x] 🟠 Dokumen dapat di-share ke chat session tertentu — `src/server/actions/documents.ts` `shareDocumentToChatSession()` update `Document.chatSessionId` + audit log; `listOwnedChats()` helper; `ShareModal` component di upload view (list chat, pick satu, redirect-ready)

### 5.5 Document Anti-Cheating & Compliance
- [x] 🔴 Dokumen hanya diproses untuk tujuan belajar — privacy note di upload page + setiap response Spark/RAG context dimulai dengan "ATURAN: jawab berdasarkan cuplikan; jangan ngarang dari luar"; fitur cuma tersedia di area student
- [x] 🔴 Tolak konten di luar edukasi saat upload/proses — `src/server/documents/content-check.ts` `validateEducationalContent()` cek 3 hal: (1) min text length 80 char, (2) min alpha ratio 40% (deteksi PDF scan tanpa OCR), (3) regex keyword untuk konten dewasa/berbahaya/ujaran kebencian → return `REJECTED` code; audit log
- [x] 🔴 Siswa tidak bisa minta AI mengerjakan tugas secara langsung tanpa proses Socratic — `src/server/ai/tutor.ts` system prompt Socratic rules: "JANGAN kasih jawaban final langsung. Bimbing dengan pertanyaan probing" + "Selalu akhiri dengan pertanyaan terbuka". RAG context di-doc merge dgn Socratic rules (lihat 5.3)
- [x] 🟠 Log metadata dokumen untuk audit (UU PDP compliance) — `prisma/schema.prisma` `DocumentAuditLog` model + `DocumentAuditAction` enum (UPLOAD/PROCESS/SUMMARY_GENERATED/QUIZ_GENERATED/SHARE_TO_CHAT/CHAT_REFERENCED/RAG_QUERY/DELETE/REJECTED); `src/server/documents/audit.ts` `logDocumentEvent()` helper; dipanggil di upload, delete, share, summary, quiz, RAG query, dan rejected uploads

---

## Phase 6 — Adaptive Practice & Evaluation (Minggu 5–6)

### 6.1 Practice Mode
- [x] 🔴 Halaman latihan per topik/konsep — `src/app/(student)/practice/page.tsx` nerima `?topicId=` query param, scope konsep ke topik; `getNextPracticeQuestion({ topicId })` filter by topic
- [x] 🔴 Generate soal berdasarkan knowledge profile — `src/server/actions/practice.ts` `getNextPracticeQuestion()` udah pakai `pickConceptWeighted()` (mastery < 40% weight 0.5, < 70% weight 0.3, mastered weight 0.15); ditambah filter prereq satisfied (4.6.9 anti-pattern 4)
- [x] 🔴 Adaptive difficulty: naik jika benar berturut-turut, turun jika salah — `src/server/learning/adaptive.ts` `selectNextDifficulty()` rolling accuracy (window 5) + wrong-streak (3) + promote/demote thresholds; deterministic, bukan ML/RL (4.6.9 anti-pattern 3)
- [x] 🔴 Tampilkan hint jika siswa meminta — `PracticePlayer` tombol "Minta hint" → panggil `getQuestionHint()` server action → reveal `Question.hint` field (ada di schema). Plus: Socratic nudge per-difficulty (`socraticHintFor()`) selalu tampil sebagai fallback kalo hint DB kosong
- [x] 🔴 Socratic step-by-step untuk problem solving — `PracticePlayer` tombol "Diskusiin sama Spark (Socratic)" setelah jawaban salah → panggil `startNewChat({ firstMessage: soal + konsep })` → redirect ke `/chat/[sessionId]`. Plus: RAG context di-chat system message udah enforce Socratic method (lihat 5.3)

### 6.2 Quiz & Mini Exam
- [x] 🔴 Quiz mode dengan timer (opsional) — `src/app/(student)/practice/quiz/[topicId]/page.tsx` + `src/components/student/quiz-player.tsx`; default 5 soal / 5 menit, configurable via `?n=8&time=600` query params
- [x] 🔴 Randomized question selection — `startQuizSession()` shuffle soal topic pake `Math.random()`, pick first N
- [x] 🔴 Auto-submit saat waktu habis — `QuizPlayer` `useEffect([timeLeft])` → `finishQuiz(true)` kalo timeLeft=0; client-side timer, server validate `elapsedSec > timeLimitSec + 30` di `submitQuizAnswer`
- [x] 🔴 Hasil quiz dengan breakdown per konsep — `src/app/(student)/practice/quiz/result/page.tsx` + `src/components/student/quiz-result-view.tsx`; score ring, time, breakdown per konsep dengan status (Mastered/Learning/Struggling), per-concept "Diskusiin [konsep] sama Spark" CTA, "Quiz ulang" + "Latihan topik" CTAs

### 6.3 Answer Evaluation & Feedback
- [x] 🔴 Evaluasi jawaban multiple choice instan — `src/server/actions/practice.ts` `submitPracticeAnswer()` validate `answer === correctAnswer` server-side, return `isCorrect` + `correctAnswer`. UI render color-coded (hijau/merah) instan di PracticePlayer + QuizPlayer
- [~] 🔴 Evaluasi jawaban esai/kalkulasi dengan AI — `src/server/ai/evaluator.ts` `evaluateAnswer()` udah ada (call LLM, parse JSON), tapi belum di-wire ke UI. Pending: tambah QuestionType.SHORT_ANSWER/ESSAY di seed + UI input form
- [x] 🔴 Feedback personal: jelaskan mengapa benar/salah — 
  - Schema: `Question.explanation` field udah ada
  - Seed: `prisma/seed.ts` `buildExplanation()` + `buildHint()` + `buildMisconceptions()` auto-generate per question (derived dari concept content + difficulty)
  - Backfill: kalau question udah ada tapi explanation null, seed update di tempat
  - UI: `PracticePlayer` "Kenapa?" button (setelah benar/salah) → `<WhyModal>` modal: tampilkan explanation + commonMisconceptions + hint. `submitPracticeAnswer` return all 3 fields
- [x] 🔴 Deteksi miskonsepsi umum — 
  - Schema: `Question.commonMisconceptions` field udah ada
  - Seed: `buildMisconceptions()` generate per-question "kenapa distractor itu sering dipilih" explanation (generic: similar-to-correct, wrong-recall, first-impulse)
  - UI: WhyModal section "Miskonsepsi umum" tampilkan pattern ini
- [x] 🔴 Rekomendasi konsep prasyarat jika belum kuat — `submitPracticeAnswer` return `stuck: { wrongStreak, recommendedPrereq }`:
  - Track wrong-streak dari 5 attempt terakhir per konsep
  - Kalau ≥ 2 salah berturut-turut, cari prereq dengan mastery terendah
  - UI: amber banner "Streak salah 2x di [konsep], prereq [X] masih lemah (40%) — yuk remedial"
  - Link ke `/practice` (filter by topic) untuk remedial

### 6.5 Knowledge Profile Update
- [x] 🔴 Update mastery score setelah setiap attempt — `submitPracticeAnswer` panggil `recordQuestionAttempt` dari `src/server/actions/subjects.ts` line ~225 yang update `StudentKnowledgeProfile` via EMA (`computeMasteryUpdate()` learning rate 0.2)
- [x] 🔴 Update adaptive difficulty level — `selectNextQuestionDifficulty()` rolling accuracy (window 5) + wrong-streak (3) + promote/demote thresholds (deterministic, no ML/RL). Dipakai di `getNextPracticeQuestion` line ~175
- [x] 🔴 Update concept status (mastered / struggling / learning) — `deriveConceptStatus()` di `src/server/learning/adaptive.ts` line ~77: ≥0.8 MASTERED, 0.4-0.8 LEARNING, <0.4 tapi >0 STRUGGLING, 0 NOT_STARTED
- [~] 🔴 Trigger badge/achievement check — Phase 7 (Gamification), not yet implemented

### 6.6 AI Daily Challenge System (NEW — Juni 2026, post-SparkAi.md §4.11)
> **Konteks:** User request v0.95 (Juni 2026) — siswa butuh tantangan harian AI-generated yang **campuran** (soal + materi markdown + refleksi), bisa di-generate hybrid (sekali per hari per user, ATAU on-demand kapan aja). AI **menilai progress** dari 4 sumber: mastery score, challenge completion, materials read, refleksi. Materi disimpan di DB (bukan stream) supaya bisa diulang. AI credit aman (untuk lomba).

#### 6.6.1 Schema (DONE)
- [x] 🔴 `Challenge`: id, userId, subjectId (FK, nullable — null = cross-subject), title, description, status (`ACTIVE`/`COMPLETED`/`SKIPPED`/`EXPIRED`), scheduledFor (date), generatedAt, completedAt, mixConfig (JSON: `{ questions: number, materials: number, reflections: number }`)
- [x] 🔴 `ChallengeItem`: id, challengeId (FK), order, kind (`QUESTION`/`MATERIAL`/`REFLECTION`), refId (polymorphic → Question.id / Material.id / null for reflection), status (`PENDING`/`IN_PROGRESS`/`COMPLETED`/`SKIPPED`), points, completedAt
- [x] 🔴 `Material`: id, userId, subjectId, title, content (Markdown @db.Text), difficulty, estimatedMinutes, createdAt, source (`CHALLENGE`/`ON_DEMAND`/`ADAPTIVE`)
- [x] 🔴 `MaterialRead`: id, userId, materialId, readAt, readSeconds, completed (bool)
- [x] 🔴 `Reflection`: id, userId, challengeId, prompt (text), response (text), aiAnalysis (JSON: `{ sentiment, depth, suggestions }`), submittedAt
- [x] 🔴 `UserChallengeProgress`: id, userId, date, totalChallenges, completed, totalPoints, pointsByKind (JSON)
- [x] 🔴 Indexes: `Challenge(userId, scheduledFor)`, `ChallengeItem(challengeId, order)`, `Material(userId, subjectId)`, `MaterialRead(userId, materialId)`, `Reflection(userId, challengeId)`
- [x] 🔴 Migration: `rtk bunx prisma migrate dev --name add_challenge_system`


#### 6.6.3 Server Actions (DONE)
- [x] 🔴 `src/server/actions/challenges.ts`:
  - `getOrCreateTodayChallenges(userId)` — cek Challenge scheduledFor = today, kalau belum ada → generate (1x per user per day)
  - `generateOnDemandChallenge(userId, options)` — user minta tambahan, generate 1 challenge baru (no cache)
  - `getChallengeDetail(challengeId)` — return challenge + items (questions/materials/reflections)
  - `startChallengeItem(itemId)` — status → IN_PROGRESS
  - `completeChallengeItem(itemId, data?)` — status → COMPLETED, recalculate challenge status
  - `skipChallengeItem(itemId)` — status → SKIPPED
  - `markMaterialRead(materialId, readSeconds)` — track reading progress
  - `submitReflection(challengeId, response)` — save + AI analyze
  - `getDailyProgress(userId, date)` — summary untuk dashboard
  - `getChallengeHistory(userId, limit, offset)` — untuk history page
  - `getMaterialLibrary(userId, subjectId?)` — untuk /materials page
- [ ] 🔴 Zod validation di semua input
- [ ] 🔴 `revalidatePath('/dashboard', '/challenge', '/materials')` setelah mutasi
- [ ] 🔴 Auto-complete Challenge kalau semua item COMPLETED → trigger XP/streak (Phase 7)


#### 6.6.5 UI Pages (DONE)
- [x] 🔴 `src/app/(student)/challenge/page.tsx` — Today's challenges:
  - Header: "Tantangan hari ini" + tanggal + ringkasan (4 challenge, X selesai)
  - List: ChallengeCard per challenge (title, subject badge, mix preview, status, points)
  - Filter: "Semua" / "Belum selesai" / "Selesai"
  - CTA: "Minta tantangan tambahan" (on-demand generate)
  - Empty state: "Tantangan hari ini sudah selesai! 🎉" + link ke materials
- [x] 🔴 `src/app/(student)/challenge/[id]/page.tsx` — Challenge detail:
  - Header: title, subject, status, progress bar
  - Items list: Question / Material / Reflection (render sesuai kind)
  - Back to /challenge
- [x] 🔴 `src/app/(student)/challenge/history/page.tsx` — history list
- [x] 🔴 `src/app/(student)/materials/page.tsx` — material library:
  - Filter by subject
  - List: MaterialCard (title, subject, length, read status, date)
  - Click → /materials/[id]
- [x] 🔴 `src/app/(student)/materials/[id]/page.tsx` — material reader:
  - Header: title, subject, estimated minutes, read status
  - Body: rendered Markdown (reuse DocumentMarkdownText with KaTeX support)
  - "Tandai sudah dibaca" CTA → record MaterialRead
  - Related challenges yang pakai material ini
- [x] 🔴 Update dashboard: ganti "Daily Quest" statis dengan link "Tantangan hari ini" (4 challenges)
- [x] 🔴 Update bottom nav: tambah icon "Tantangan" (kalau belum ada) — atau reuse "Latihan" dengan dynamic content

#### 6.6.6 Components (DONE)
- [x] 🔴 `src/components/student/challenge/challenge-card.tsx` — card per challenge
- [x] 🔴 `src/components/student/challenge/challenge-item-renderer.tsx` — switch QUESTION/MATERIAL/REFLECTION
- [~] 🔴 `src/components/student/challenge/challenge-question-form.tsx` — multiple choice + free text (free text deferred — konsisten dengan §6.3)
- [x] 🔴 `src/components/student/challenge/challenge-material-view.tsx` — markdown reader inline
- [x] 🔴 `src/components/student/challenge/challenge-reflection-form.tsx` — textarea + submit
- [x] 🔴 `src/components/student/challenge/daily-challenge-summary.tsx` — dashboard widget
- [x] 🔴 `src/components/student/challenge/on-demand-generator.tsx` — modal "Minta tantangan tambahan"
- [x] 🔴 `src/components/student/materials/material-card.tsx` — library card
- [x] 🔴 `src/components/student/materials/material-reader.tsx` — full markdown reader

#### 6.6.7 Progress Aggregation (DONE)
- [x] 🟠 Function `aggregateStudentProgress(userId)` di `src/server/actions/challenges.ts`:
  - Mastery: avg dari `StudentKnowledgeProfile` per subject
  - Challenge: completed / total last 7 days
  - Materials: read count last 7 days, total readSeconds
  - Reflections: count + avg depth
  - Combined score 0-100 (weighted: mastery 40%, challenge 30%, materials 20%, reflections 10%)
  - Return per-subject breakdown
- [x] 🟠 `getStudentProgressSummary(userId)` — untuk dashboard + parent dashboard
- [x] 🟠 `getProgressTimeline(userId, days)` — chart data (line chart mastery over time)

#### 6.6.8 Anti-Pattern
- [x] 🔴 Challenge harian TIDAK BOHONG: kalau AI generate materi "kamu harus belajar X" padahal tidak — pass dengan Zod validation + konsep di-fetch dari DB, bukan dari prompt
- [x] 🔴 Challenge TIDAK BOLEH replace human feedback — AI refleksi cuma suggestion, siswa bisa ignore
- [x] 🔴 On-demand generation TIDAK BOLEH spam — rate limit 10/hari per user
- [x] 🔴 Materi TIDAK BOLEH contradicting guru — disclaimer "AI-generated, konfirmasi ke guru" di setiap materi
- [x] 🔴 Challenge completion TIDAK BOLEH jadi gate untuk akses materi (siswa tetap bisa browse materials tanpa complete challenges)

#### 6.6.9 Replace/Integrate dengan Phase 7
- [ ] 🟠 Phase 7.4 Daily Quest (static 3 misi) → **DEPRECATED** di-replace sama challenge system ini
- [ ] 🟠 Phase 7.5 Weekly Challenge → tetap ada, tapi sekarang = summary of 7 days × 4 challenges = 28 daily items
- [ ] 🟠 XP/Level dari Phase 7.1: challenge completion kasih XP (soal = 10 XP, materi = 5 XP, refleksi = 15 XP)
- [ ] 🟠 Streak dari Phase 7.2: streak hitung dari challenge completion (min 1 challenge/day)

---

## Phase 7 — Gamification System (Minggu 5–6)

### 7.1 XP & Level System
- [x] 🔴 Model `XpTransaction` dan `Level`
- [x] 🔴 XP sources: jawab benar, selesai sesi chat, streak, kuasai konsep, daily quest (constant `XP_REWARDS` di `src/lib/gamification.ts`)
- [x] 🔴 **Level unbounded** — formula `xpForFormulaLevel(n) = 500*n*(n-1)`. L1–50 pakai tabel (nama: Pemula → Legenda). L51+ tier "Legenda" tanpa cap. L100=4.95M XP, L1000=499.5M XP
- [x] 🔴 Progress bar level di beranda (ProfileWidget di `student-nav.tsx`, panggil `getDashboardSummary` → `levelFromXp`)
- [x] 🔴 Fungsi `addXp(userId, amount, source, metadata)` di `src/server/actions/gamification.ts` — atomic XP transaction + level update dalam 1 tx

### 7.2 Streak Belajar
- [x] 🔴 Model `Streak` (+ field `lastFreezeResetAt` via migration `20260617000000_add_streak_freeze_reset`)
- [x] 🔴 Hitung hari berturut-turut belajar — `recordActivity(userId)` di `src/server/actions/gamification.ts`
- [x] 🔴 Visual api 🔥 dan angka streak (ProfileWidget sudah render)
- [x] 🔴 Streak freeze 1x per minggu — auto-refill jika `lastFreezeResetAt` >= 7 hari
- [x] 🔴 Pesan positif saat streak putus: `getStreakBrokenMessage(prevStreak)` — tone-adjusted by streak length, no shame

### 7.3 Badges & Achievements
- [x] 🔴 Model `Badge`, `Achievement`, `UserBadge`, `UserAchievement`
- [x] 🔴 Seed 50+ badge (50 total: 18 existing + 32 baru di seed). Categories: Akademik, Kebiasaan, Keberanian, Spesial
- [~] 🔴 Badge check trigger — function `checkAndUnlockBadges(userId)` ada di `src/server/actions/gamification.ts`, returns `BadgeUnlock[]`. **Belum auto-call dari activity sites** (perlu wiring di practice/challenge/chat completion)
- [ ] 🟠 Notifikasi unlock badge dengan mini celebration — server return ready, UI belum (perlu BadgeUnlockToast component)

### 7.4 Daily Quest
- [ ] 🔴 Model `DailyQuest`
- [ ] 🔴 Generate 3 misi harian otomatis
- [ ] 🔴 Contoh: selesai 5 soal, belajar 15 menit, uji 1 topik baru
- [ ] 🔴 Bonus XP jika semua misi selesai

### 7.5 Weekly Challenge
- [ ] 🟠 Generate tantangan mingguan
- [ ] 🟠 Badge eksklusif mingguan
- [ ] 🟠 Progress tracking

### 7.6 Knowledge Star Constellation
- [ ] 🔴 Visualisasi konsep sebagai bintang
- [ ] 🔴 Bintang menyala saat konsep dikuasai
- [ ] 🔴 Tampilan per mata pelajaran
- [ ] 🔴 Skill tree dengan prerequisite unlock

### 7.7 Study Buddy (Tanaman Virtual)
- [ ] 🟠 Pilih tanaman/virtual buddy
- [ ] 🟠 Tumbuh seiring konsistensi belajar
- [ ] 🟠 Stage: bibit → kecambah → berbunga → pohon
- [ ] 🟠 Visual di dashboard

### 7.8 Avatar Customization
- [ ] 🟠 Kustomisasi karakter Spark: warna, aksesoris, background
- [ ] 🟠 Unlock dengan XP dan bintang — NO real money
- [ ] 🟠 Sense of ownership dan ekspresi identitas

### 7.9 Mini Celebrations
- [ ] 🟠 Animasi confetti/suara positif saat milestone
- [ ] 🟠 Pesan personal dari Spark
- [ ] 🟠 Durasi maksimal 2–3 detik, tidak mengganggu

### 7.10 Gamification Anti-Patterns (Wajib Diimplementasikan sebagai Bukan Fitur)
- [ ] 🔴 Tidak ada loot box / gacha
- [ ] 🔴 Tidak ada pay-to-win
- [ ] 🔴 Tidak ada FOMO manipulatif
- [ ] 🔴 Tidak ada energy/life system
- [ ] 🔴 Tidak ada leaderboard global toxic
- [ ] 🔴 Tidak ada iklan
- [ ] 🔴 Notifikasi maksimal 1–2 per hari, opt-in
- [ ] 🔴 Tidak ada streak punishment menyalahkan

---

## Phase 8 — Parent Dashboard (Minggu 6)

### 8.1 Parent Home
- [ ] 🟠 Dashboard ringkasan perkembangan anak
- [ ] 🟠 Aktivitas belajar mingguan
- [ ] 🟠 Streak dan level anak
- [ ] 🟠 Mata pelajaran yang sedang dipelajari

### 8.2 Progress Reports
- [ ] 🟠 Ringkasan mingguan otomatis
- [ ] 🟠 Grafik progress per mapel
- [ ] 🟠 Konsep yang sudah/kurang dikuasai
- [ ] 🟠 Rekomendasi dukungan untuk orang tua

### 8.3 Notifications
- [ ] 🟠 Alert jika anak tidak belajar beberapa hari
- [ ] 🟠 Alert jika anak kesulitan di konsep tertentu
- [ ] 🟠 Reminder positif, bukan menyalahkan

### 8.4 Multi-Child Support (P2)
- [ ] 🟡 Satu akun orang tua bisa hubungkan beberapa anak
- [ ] 🟡 Switch antar anak

---

## Phase 9 — (Removed)
> **Catatan:** Teacher Dashboard dihapus dari scope. Spark Ai bukan platform LMS — tidak ada manajemen kelas dari sisi guru. Fokus tetap di siswa sebagai pengguna primer dan orang tua sebagai monitoring.

---

## Phase 10 — Content Management (Admin) (Minggu 7)

### 10.1 Admin Dashboard
- [ ] 🟠 CRUD users (siswa, orang tua, admin)
- [ ] 🟠 CRUD subjects, topics, concepts
- [ ] 🟠 CRUD questions dan question bank
- [ ] 🟠 Kelola badges dan achievements

### 10.2 Content Quality
- [ ] 🟠 Validasi soal sesuai kurikulum
- [ ] 🟠 Tagging konsep dengan benar
- [ ] 🟠 Kelola common misconceptions
- [ ] 🟠 Upload materi referensi untuk RAG

### 10.3 Moderation
- [ ] 🟠 Review flagged chat messages
- [ ] 🟠 Ban / suspend user jika diperlukan
- [ ] 🟠 Audit log aktivitas admin

---

## Phase 11 — Performance, Accessibility & Polish (Minggu 7–8)

### 11.1 Performance Optimization
- [ ] 🔴 Lighthouse score target: 90+ mobile
- [ ] 🔴 Image optimization dengan Next.js Image
- [ ] 🔴 Code splitting dan lazy load
- [ ] 🔴 Minimize JS bundle di client
- [ ] 🔴 Optimize database queries (select minimal fields)
- [ ] 🔴 Add Redis/caching untuk data sering diakses (P1)

### 11.2 Accessibility
- [ ] 🟠 ARIA labels dan keyboard navigation
- [ ] 🟠 Color contrast WCAG AA
- [ ] 🟠 Screen reader friendly
- [ ] 🟠 Font size adjustable

### 11.3 Mobile Optimization
- [ ] 🔴 Responsive layout untuk Android 5.5"–6.7"
- [ ] 🔴 Bottom navigation untuk mobile
- [ ] 🔴 Touch target minimal 44x44dp
- [ ] 🔴 Optimize untuk koneksi lambat (3G/4G daerah 3T)

### 11.4 Error Handling & Monitoring
- [ ] 🔴 Global error boundary
- [ ] 🔴 404 dan 500 custom pages
- [ ] 🟠 Integrasi Sentry / LogRocket
- [ ] 🟠 Analytics dasar (Vercel Analytics / Plausible)

### 11.5 Testing
- [ ] 🟠 Unit tests untuk utilities dan services (Vitest)
- [ ] 🟠 Integration tests untuk auth dan core flows (Playwright)
- [ ] 🟠 E2E tests untuk chat, latihan, dan dashboard
- [ ] 🟡 Visual regression tests (P2)

---

## Phase 12 — Deployment & Launch (Minggu 8)

### 12.1 Deployment
- [ ] 🔴 Deploy ke Vercel / platform pilihan
- [x] 🔴 Setup production PostgreSQL (Neon) — sudah aktif dan seeded
- [x] 🔴 Setup production environment variables (`.env`)
- [ ] 🔴 Setup CI/CD pipeline (GitHub Actions)

### 12.2 Pre-Launch
- [ ] 🔴 Final security audit
- [ ] 🔴 Backup strategy
- [ ] 🔴 Rate limiting dan DDoS protection
- [ ] 🔴 Terms of Service dan Privacy Policy
- [ ] 🔴 Delete account / data portability (UU PDP compliance)

### 12.3 Soft Launch
- [ ] 🟠 Beta test dengan 20–50 siswa
- [ ] 🟠 Collect feedback
- [ ] 🟠 Iterate based on feedback

### 12.4 Post-Launch
- [ ] 🟢 Analytics dan metrics dashboard
- [ ] 🟢 User feedback channel
- [ ] 🟢 Continuous content improvement
- [ ] 🟢 Scale AI infrastructure jika traffic naik

---

## Phase 13 — Future Enhancements (P3)

- [ ] 🟢 Integrasi dengan sistem sekolah (ERapor, Dapodik)
- [ ] 🟢 Mata pelajaran IPS (Sejarah, Geografi, Ekonomi, Sosiologi)
- [ ] 🟢 Mata pelajaran kejuruan SMK spesifik
- [ ] 🟢 Mode kolaboratif / belajar bareng teman
- [ ] 🟢 Leaderboard kelas (non-toxic, opt-in)
- [ ] 🟢 Support bahasa daerah (Jawa, Sunda, dll)
- [ ] 🟢 iOS app (React Native / Capacitor)
- [ ] 🟢 AI-generated practice questions from uploaded material
- [ ] 🟢 Video penjelasan AI / avatar berbicara

---

## Checklist Pra-Launch Minimum

- [ ] Semua P0 tasks selesai
- [ ] Auth aman dan role-based access berfungsi
- [ ] Chat Socratic berfungsi dengan guardrails
- [ ] Latihan adaptif dan evaluasi berfungsi
- [ ] Gamifikasi dasar (XP, level, streak, badge, daily quest) berfungsi
- [ ] Dashboard siswa responsif dan lancar di mobile
- [ ] Privasi dan etika AI terjamin
- [ ] Tidak ada fitur toxic / manipulatif
- [ ] Testing dasar lolos

---

**— Dokumen ini hidup —**

*Update todo.md ini setiap kali ada progress, blockers, atau perubahan scope. Prioritas bisa bergeser berdasarkan validasi pengguna dan kendala teknis.*
