> **Last updated:** 2026-06-15 (v0.6 — Phase 0 done, Phase 1 done, Phase 2.1 done: login + register + role selection + Google OAuth + Zod validation)
> **Status:** Phase 0 ✅; Phase 1 ✅; Phase 2.1 ✅; ready for Phase 2.2 (student onboarding flow)
> **Convention:** `[ ]` todo, `[x]` done, `[~]` in progress, `[!]` blocked
> **Package Manager:** `bun` — semua command di dokumen ini pakai `bun` / `bunx`

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
   - tRPC hooks atau TanStack Query hooks di client

### 2. DILARANG:
   - ❌ Pake `"use client"` cuma karena males mikir — itu dosa performa
   - ❌ Bikin Route Handler (`route.ts`) cuma buat baca data dari Prisma — panggil Prisma langsung di Server Component
   - ❌ Pake `fetch()` dari client kalo bisa Server Action atau tRPC

### 3. WAJIB:
   - ✅ Mutasi data → Server Action atau tRPC mutation, bukan fetch manual
   - ✅ Halaman publik (landing, courses, about, help) → Server Component → SEO optimal
   - ✅ Halaman private (dashboard, chat, onboarding) → boleh Client Component — gak butuh SEO
   - ✅ tRPC + TanStack Query untuk data fetching kompleks di client
   - ✅ Server Component untuk initial fetch, client hydration minimal

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
| State Management | Zustand (client state minimal), TanStack Query (server state) |
| Database | PostgreSQL (Neon / local) |
| ORM | Prisma |
| Auth | Auth.js v5 (NextAuth.js beta) atau Better Auth |
| API | tRPC + Server Actions |
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
- [x] 🔴 Install Prisma: `bun add prisma @prisma/client`
- [x] 🔴 `bunx prisma init` → generate `prisma/schema.prisma` & `.env`
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
- [x] 🔴 First migration: `bunx prisma migrate dev --name init`
- [x] 🔴 Add Prisma client singleton di `src/lib/prisma.ts` (hot-reload safe, adapter-pg)
- [x] 🔴 Add seed script: `prisma/seed.ts` + `bunx prisma db seed`
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
- [x] 🔴 Middleware proteksi route berdasarkan role (`student`, `parent`, `admin`) di `src/middleware.ts`
- [x] 🔴 Halaman login `/auth/login` dan register `/auth/register` + API register
- [x] 🟠 Setup OAuth provider opsional (Google) untuk kemudahan login — env-gated, auto-disable kalau env kosong

### 0.4 tRPC + TanStack Query Setup
- [x] 🔴 Install tRPC: `@trpc/server`, `@trpc/client`, `@trpc/tanstack-react-query`, `@tanstack/react-query`
- [x] 🔴 Setup tRPC router di `src/trpc/routers/_app.ts`
- [x] 🔴 Setup context dengan auth session
- [x] 🔴 Setup provider di `src/app/providers.tsx`
- [x] 🔴 Buat procedure protected (`authedProcedure`) dan admin procedure
- [x] 🔴 Setup React Query client dengan default staleTime

### 0.5 AI SDK Setup
- [x] 🔴 Install Vercel AI SDK: `ai` + `@ai-sdk/openai`
- [x] 🔴 Setup environment variables: `OPENAI_API_KEY` / `GROQ_API_KEY` / `GEMINI_API_KEY` (di `.env`)
- [x] 🔴 Buat service layer AI di `src/server/ai/`:
  - `tutor.ts` — generate Socratic response (streaming)
  - `evaluator.ts` — evaluate answer and give feedback
  - `rag.ts` — retrieve relevant context (pgvector similarity, fallback token-based)
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
  - `"db:studio": "bunx prisma studio"`
  - `"db:migrate": "bunx prisma migrate dev"`
  - `"db:seed": "bunx prisma db seed"`
  - `"db:generate": "bunx prisma generate"`
  - `"db:push": "bunx prisma db push"`
  - `"lint": "biome check"`
  - `"typecheck": "bunx tsc --noEmit"`
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
- [x] 🟠 Shared `AuthShell` component — left/right split dengan floating background, hero, trust signals, dan footer terms
- [x] 🟠 Auto-redirect onboarded baru ke `/onboarding` (middleware + JWT `isOnboarded` flag)

> **Catatan:** Role "Guru" dihapus dari registrasi publik. Guru tidak lagi jadi target user Spark Ai (lihat Phase 9 dihapus).

### 2.2 Student Onboarding Flow
- [ ] 🔴 Welcome screen dengan karakter Spark
- [ ] 🔴 Pilih mata pelajaran fokus
- [ ] 🔴 Pretest ringkas untuk menentukan level awal (5–10 soal per mapel)
- [ ] 🔴 Pilih gaya belajar preferensi
- [ ] 🔴 Generate initial knowledge profile dari pretest
- [ ] 🔴 Setup daily learning reminder (opsional)

### 2.3 Parent-Child Linking
- [ ] 🟠 Generate invitation code dari akun siswa
- [ ] 🟠 Orang tua input kode untuk hubungkan
- [ ] 🟠 Model `ParentStudentLink` dengan status pending/accepted

### 2.4 (Removed)
> **Catatan:** Fitur teacher-class dihapus dari scope awal. Spark Ai fokus ke siswa + monitoring orang tua. Tidak ada teacher dashboard, tidak ada invite code untuk guru.

---

## Phase 3 — Student Home & Dashboard (Minggu 2–3)

### 3.1 Student Dashboard Layout
- [ ] 🔴 Buat layout dashboard siswa dengan sidebar/bottom nav mobile-friendly
- [ ] 🔴 Section: continue learning, daily quest, streak, level progress
- [ ] 🔴 Quick access: chat dengan Spark, latihan, jelajah topik
- [ ] 🔴 Optimized for mobile (Android low-mid spec)

### 3.2 Home Feed
- [ ] 🔴 Tampilkan rekomendasi belajar harian
- [ ] 🔴 Tampilkan sapaan personal dari Spark
- [ ] 🔴 Tampilkan progress ringkasan per mata pelajaran
- [ ] 🔴 Tombol aksi utama: "Tanya Spark", "Latihan Hari Ini", "Lanjutkan Topik"

### 3.3 Subject & Topic Explorer
- [ ] 🔴 Halaman daftar mata pelajaran
- [ ] 🔴 Halaman detail topik dengan skill tree
- [ ] 🔴 Progress bar per topik (0–100%)
- [ ] 🔴 Tandai konsep yang sudah dikuasai, sedang dipelajari, belum
- [ ] 🔴 Visualisasi konstelasi bintang (Knowledge Star) per mapel

### 3.4 Learning Plan
- [ ] 🟠 Generate rencana belajar mingguan personal
- [ ] 🟠 Track completion learning plan
- [ ] 🟠 Adaptasi rencana berdasarkan performa

---

## Phase 4 — AI Tutor Chat (Socratic) (Minggu 3–4)

### 4.1 Chat Interface
- [ ] 🔴 Halaman chat `/chat` dengan UI mirip chat app
- [ ] 🔴 Tampilkan avatar Spark yang bisa dikustomisasi
- [ ] 🔴 Input teks untuk pertanyaan siswa
- [ ] 🔴 Bubble chat dengan styling berbeda untuk siswa dan Spark
- [ ] 🔴 Loading state saat AI merespons
- [ ] 🔴 Chat history persistent di database

### 4.2 Socratic Tutoring Engine
- [ ] 🔴 System prompt untuk karakter Spark: sabar, suportif, tidak menghakimi
- [ ] 🔴 Prompt strategy: jangan langsung kasih jawaban, tanya balik pemandu
- [ ] 🔴 Personifikasi bahasa Indonesia kasual yang ramah anak muda
- [ ] 🔴 Adaptive response berdasarkan knowledge profile siswa
- [ ] 🔴 Kontekstualisasi dengan kurikulum dan konsep yang sedang dipelajari

### 4.3 Chat Session Management
- [ ] 🔴 Model `ChatSession` dan `ChatMessage`
- [ ] 🔴 List chat session sebelumnya
- [ ] 🔴 Bisa melanjutkan chat lama atau mulai chat baru
- [ ] 🔴 Auto-title chat dari topik pertama

### 4.4 Anti-Cheating Guardrails
- [ ] 🔴 Deteksi jika siswa minta jawaban langsung untuk PR/ujian
- [ ] 🔴 Respon dengan bimbingan Socratic, bukan jawaban instan
- [ ] 🔴 Refuse topik di luar edukasi
- [ ] 🔴 Disclaimer bahwa ini AI, bukan manusia

### 4.5 Multimodal Input (P2)
- [ ] 🟡 Upload gambar soal matematika
- [ ] 🟡 Input suara (voice-to-text)
- [ ] 🟡 Render LaTeX / MathML untuk rumus

---

## Phase 5 — Document Upload & AI Material Assistant (Minggu 4)

### 5.1 Document Upload Interface
- [ ] 🔴 Halaman upload dokumen `/upload`
- [ ] 🔴 Support format PDF dan DOCX
- [ ] 🔴 Validasi file: max size (10 MB), max pages (50), tipe file
- [ ] 🔴 Progress upload dan loading state
- [ ] 🔴 Tampilkan daftar dokumen yang sudah diunggah per siswa

### 5.2 Document Processing Pipeline
- [ ] 🔴 Extract text dari PDF: `pdf-parse` atau `pdfjs-dist`
- [ ] 🔴 Extract text dari DOCX: `mammoth`
- [ ] 🔴 Convert extracted text ke Markdown bersih
- [ ] 🔴 Simpan Markdown di DB (`Document` model dengan `content` @db.Text)
- [ ] 🔴 Simpan metadata: originalName, size, pageCount, mimeType, uploadedAt
- [ ] 🔴 Link dokumen ke `User` (siswa) dan opsional ke `ChatSession`

### 5.3 AI-Powered Document Features
- [ ] 🔴 Generate ringkasan materi inti dari dokumen
- [ ] 🔴 Generate penjelasan materi berdasarkan dokumen dengan gaya siswa
- [ ] 🔴 Deteksi apakah dokumen berisi pertanyaan/tugas → ubah jadi sesi latihan Socratic
- [ ] 🔴 Generate quiz latihan otomatis dari isi dokumen
- [ ] 🔴 AI bisa di-tanya spesifik tentang isi dokumen (RAG-based Q&A)

### 5.4 Advanced Document Handling (P1–P2)
- [ ] 🟠 OCR untuk PDF hasil scan atau foto dokumen
- [ ] 🟠 Deteksi dan render rumus matematika (LaTeX/MathML)
- [ ] 🟠 Handle tabel dan formatting kompleks
- [ ] 🟠 Generate embeddings dari dokumen untuk retrieval context
- [ ] 🟠 Dokumen dapat di-share ke chat session tertentu

### 5.5 Document Anti-Cheating & Compliance
- [ ] 🔴 Dokumen hanya diproses untuk tujuan belajar
- [ ] 🔴 Tolak konten di luar edukasi saat upload/proses
- [ ] 🔴 Siswa tidak bisa minta AI mengerjakan tugas secara langsung tanpa proses Socratic
- [ ] 🟠 Log metadata dokumen untuk audit (UU PDP compliance)

---

## Phase 6 — Adaptive Practice & Evaluation (Minggu 5–6)

### 6.1 Practice Mode
- [ ] 🔴 Halaman latihan per topik/konsep
- [ ] 🔴 Generate soal berdasarkan knowledge profile
- [ ] 🔴 Adaptive difficulty: naik jika benar berturut-turut, turun jika salah
- [ ] 🔴 Tampilkan hint jika siswa meminta
- [ ] 🔴 Socratic step-by-step untuk problem solving

### 6.2 Quiz & Mini Exam
- [ ] 🔴 Quiz mode dengan timer (opsional)
- [ ] 🔴 Randomized question selection
- [ ] 🔴 Auto-submit saat waktu habis
- [ ] 🔴 Hasil quiz dengan breakdown per konsep

### 6.3 Answer Evaluation & Feedback
- [ ] 🔴 Evaluasi jawaban multiple choice instan
- [ ] 🔴 Evaluasi jawaban esai/kalkulasi dengan AI
- [ ] 🔴 Feedback personal: jelaskan mengapa benar/salah
- [ ] 🔴 Deteksi miskonsepsi umum
- [ ] 🔴 Rekomendasi konsep prasyarat jika belum kuat

### 6.4 Spaced Repetition (P1)
- [ ] 🟠 Sistem review soal yang pernah salah
- [ ] 🟠 Reminder konsep yang hampir lupa
- [ ] 🟠 Integrasi dengan daily quest

### 6.5 Knowledge Profile Update
- [ ] 🔴 Update mastery score setelah setiap attempt
- [ ] 🔴 Update adaptive difficulty level
- [ ] 🔴 Update concept status ( mastered / struggling / learning )
- [ ] 🔴 Trigger badge/achievement check

---

## Phase 7 — Gamification System (Minggu 5–6)

### 7.1 XP & Level System
- [ ] 🔴 Model `XpTransaction` dan `Level`
- [ ] 🔴 XP sources: jawab benar, selesai sesi chat, streak, kuasai konsep, daily quest
- [ ] 🔴 Level 1–50 dengan nama lokal: Pemula → Penjelajah → Pejuang → Ahli → Maestro → Legenda
- [ ] 🔴 Progress bar level di beranda
- [ ] 🔴 Fungsi `addXp(userId, amount, source, metadata)`

### 7.2 Streak Belajar
- [ ] 🔴 Model `Streak`
- [ ] 🔴 Hitung hari berturut-turut belajar
- [ ] 🔴 Visual api 🔥 dan angka streak
- [ ] 🔴 Streak freeze 1x per minggu
- [ ] 🔴 Pesan positif saat streak putus: "Gapapa, yuk mulai lembaran baru!"

### 7.3 Badges & Achievements
- [ ] 🔴 Model `Badge`, `Achievement`, `UserBadge`, `UserAchievement`
- [ ] 🔴 Seed 50+ badge across categories:
  - Akademik (Penakluk Trigonometri, Teman Aljabar, dll)
  - Kebiasaan (Streak Master 7 Hari, Konsisten 30 Hari)
  - Keberanian (Penanya Ulung, Pemikir Kritis)
  - Spesial (Penolong Teman — v2)
- [ ] 🔴 Badge check trigger setelah aktivitas
- [ ] 🔴 Notifikasi unlock badge dengan mini celebration

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
- [ ] 🟢 Offline mode (cache materi dan soal)
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
