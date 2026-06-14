> **Last updated:** 2026-06-14 (v0.3 — Added Document Upload & AI Material Assistant phase, synced with PRD)
> **Status:** Phase 0 starting; all phases planned
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
| Framework | Next.js 14+ App Router |
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
- [ ] 🔴 Inisialisasi Next.js 14+ dengan App Router: `bun create next-app@latest spark-ai`
- [ ] 🔴 Setup TypeScript strict mode
- [ ] 🔴 Install Tailwind CSS dan konfigurasi dasar
- [ ] 🔴 Install shadcn/ui: `bunx shadcn-ui@latest init`
- [ ] 🔴 Setup folder structure: `src/app`, `src/components`, `src/lib`, `src/server`, `src/types`, `prisma/seed`
- [ ] 🔴 Setup ESLint + Prettier config
- [ ] 🔴 Setup environment variables template (`.env.example`)

### 0.2 Backend Infrastructure (Prisma + PostgreSQL)
- [ ] 🔴 Install Prisma: `bun add prisma @prisma/client`
- [ ] 🔴 `bunx prisma init` → generate `prisma/schema.prisma` & `.env`
- [ ] 🔴 Set `DATABASE_URL` di `.env` (local Postgres: `spark_ai`, user: `postgres`, pass: `postgres`)
- [ ] 🔴 Define initial schema di `prisma/schema.prisma`:
  - User, Account, Session (Auth.js standard)
  - StudentProfile, ParentProfile, TeacherProfile
  - Subject, Topic, Concept, ConceptPrerequisite (knowledge graph)
  - Question, QuestionAttempt, Quiz, QuizAttempt
  - ChatSession, ChatMessage
  - Badge, UserBadge, Achievement, UserAchievement
  - XpTransaction, Level, Streak, DailyQuest, WeeklyChallenge
  - StudyBuddy, AvatarCustomization
  - LearningPlan, LearningActivity
  - Document (user uploaded PDF/DOCX as Markdown)
- [ ] 🔴 First migration: `bunx prisma migrate dev --name init`
- [ ] 🔴 Add Prisma client singleton di `src/lib/db.ts` (hot-reload safe)
- [ ] 🔴 Add seed script: `prisma/seed.ts` + `bunx prisma db seed`
- [ ] 🔴 Seed data: 1 admin, 1 teacher, sample subjects (Matematika, B.Indo, B.Inggris, IPA), topics, concepts, sample questions
- [ ] 🟢 Install dan enable pgvector untuk embeddings (RAG AI)
- [ ] 🟠 Setup Prisma Studio script: `bun run db:studio`

### 0.3 Auth Setup (Auth.js v5 atau Better Auth)
- [ ] 🔴 Install Auth.js: `bun add next-auth@beta @auth/prisma-adapter` atau `better-auth`
- [ ] 🔴 Konfigurasi auth adapter di Prisma schema
- [ ] 🔴 Setup Credentials provider (email + password dengan bcrypt)
- [ ] 🔴 Session strategy: database (bukan JWT) — agar bisa revoke
- [ ] 🔴 Extend Session type via `src/types/next-auth.d.ts` dengan role
- [ ] 🔴 Middleware proteksi route berdasarkan role (`student`, `parent`, `teacher`, `admin`)
- [ ] 🔴 Halaman login `/login` dan register `/register`
- [ ] 🟠 Setup OAuth provider opsional (Google) untuk kemudahan login

### 0.4 tRPC + TanStack Query Setup
- [ ] 🔴 Install tRPC: `bun add @trpc/server @trpc/client @trpc/react-query @trpc/next @tanstack/react-query zod`
- [ ] 🔴 Setup tRPC router di `src/server/trpc.ts`
- [ ] 🔴 Setup context dengan auth session
- [ ] 🔴 Setup provider di `src/app/providers.tsx`
- [ ] 🔴 Buat procedure protected (`authedProcedure`) dan admin procedure
- [ ] 🔴 Setup React Query client dengan default staleTime

### 0.5 AI SDK Setup
- [ ] 🔴 Install Vercel AI SDK: `bun add ai @ai-sdk/openai` (atau provider lain)
- [ ] 🔴 Setup environment variables: `OPENAI_API_KEY` / `GROQ_API_KEY` / `GEMINI_API_KEY`
- [ ] 🔴 Buat service layer AI di `src/server/ai/`:
  - `tutor.ts` — generate Socratic response
  - `evaluator.ts` — evaluate answer and give feedback
  - `rag.ts` — retrieve relevant context from vector DB
- [ ] 🟠 Setup rate limiting untuk API AI

### 0.6 UI Foundation
- [ ] 🔴 Install komponen shadcn dasar: button, input, card, dialog, sheet, avatar, badge, progress, tabs
- [ ] 🔴 Setup design tokens (colors, typography, spacing)
- [ ] 🔴 Buat layout dasar: root layout, auth layout, dashboard layout
- [ ] 🔴 Setup dark/light mode (optional, P2)
- [ ] 🔴 Buat loading skeleton reusable

### 0.7 Bun.js Specific Setup
- [ ] 🔴 Pastikan `bun` sudah terinstall (bukan npm/yarn/pnpm)
- [ ] 🔴 Tambahkan scripts di `package.json`:
  - `"dev": "bun dev"`
  - `"build": "bun run next build"`
  - `"start": "bun run next start"`
  - `"db:studio": "bunx prisma studio"`
  - `"db:migrate": "bunx prisma migrate dev"`
  - `"db:seed": "bunx prisma db seed"`
  - `"db:generate": "bunx prisma generate"`
  - `"db:push": "bunx prisma db push"`
  - `"lint": "bun run next lint"`
  - `"typecheck": "bunx tsc --noEmit"`
- [ ] 🔴 Setup Prisma binary target untuk Bun: `binaryTargets = ["native", "debian-openssl-3.0.x"]` (jika deploy ke Linux)
- [ ] 🟠 Pastikan Prisma generate compatible dengan Bun runtime

---

## Phase 1 — Data Model & Knowledge Graph (Minggu 1–2)

### 1.1 Core Learning Content Model
- [ ] 🔴 Finalisasi schema Subject, Topic, Subtopic, Concept
- [ ] 🔴 Setup enum untuk education level: `SMA`, `SMK`
- [ ] 🔴 Setup enum untuk subject: `MATEMATIKA`, `BAHASA_INDONESIA`, `BAHASA_INGGRIS`, `IPA`
- [ ] 🔴 Setup Concept status: `NOT_STARTED`, `LEARNING`, `MASTERED`, `STRUGGLING`
- [ ] 🔴 Seed kurikulum dasar: 4 mata pelajaran, minimal 5 topik per pelajaran
- [ ] 🔴 Setup `ConceptPrerequisite` untuk skill tree

### 1.2 Student Knowledge Profile
- [ ] 🔴 Buat model `StudentKnowledgeProfile`
- [ ] 🔴 Setup konsep mastery score (0–100%) per concept per student
- [ ] 🔴 Setup adaptive difficulty level per student per topic
- [ ] 🔴 Setup learning style preference (visual, textual, example-heavy, Socratic)
- [ ] 🔴 Setup response depth preference (ringkas, menengah, lengkap)

### 1.3 Question Bank
- [ ] 🔴 Buat model `Question` dengan tipe:
  - multiple choice
  - short answer
  - essay / problem solving
  - true/false
- [ ] 🔴 Setup difficulty level: `EASY`, `MEDIUM`, `HARD`, `ADVANCED`
- [ ] 🔴 Setup Bloom taxonomy level
- [ ] 🔴 Setup tagging: concept, topic, skill
- [ ] 🔴 Setup correct answer, explanation, hint, common misconceptions
- [ ] 🔴 Seed 50+ questions across subjects

### 1.4 Vector Embeddings for RAG
- [ ] 🟠 Setup `ConceptEmbedding` atau `DocumentEmbedding` model
- [ ] 🟠 Generate embeddings untuk konsep dan materi
- [ ] 🟠 Implement similarity search untuk kontekstualisasi jawaban AI

---

## Phase 2 — Authentication & Onboarding (Minggu 2)

### 2.1 Role-Based Registration
- [ ] 🔴 Halaman pilih role saat register: Siswa, Orang Tua, Guru
- [ ] 🔴 Form registrasi siswa: nama, email, password, jenjang (SMA/SMK), kelas, sekolah
- [ ] 🔴 Form registrasi orang tua: nama, email, password, kode/link hubungkan ke anak
- [ ] 🔴 Form registrasi guru: nama, email, password, sekolah, mata pelajaran
- [ ] 🔴 Validasi semua form dengan Zod

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

### 2.4 Teacher-Class Setup
- [ ] 🟠 Guru bisa membuat kelas virtual
- [ ] 🟠 Generate kode kelas untuk siswa bergabung
- [ ] 🟠 Model `Class`, `ClassStudent`, `ClassSubject`

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

## Phase 9 — Teacher Dashboard (Minggu 6–7)

### 9.1 Teacher Home
- [ ] 🟠 Dashboard kelas-kelas yang diajar
- [ ] 🟠 Ringkasan jumlah siswa, aktivitas, kesulitan umum

### 9.2 Class Management
- [ ] 🟠 Daftar siswa per kelas
- [ ] 🟠 Detail progress per siswa
- [ ] 🟠 Agregat konsep yang paling banyak belum dikuasai
- [ ] 🟠 Export laporan (CSV/PDF) untuk remedial/pengayaan

### 9.3 Insights & Analytics
- [ ] 🟠 Heatmap penguasaan konsep kelas
- [ ] 🟠 Identifikasi siswa yang perlu bantuan
- [ ] 🟠 Rekomendasi fokus pembelajaran di kelas

---

## Phase 10 — Content Management (Admin) (Minggu 7)

### 10.1 Admin Dashboard
- [ ] 🟠 CRUD users (siswa, orang tua, guru, admin)
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
- [ ] 🔴 Setup production PostgreSQL (Neon / Supabase / Railway)
- [ ] 🔴 Setup production environment variables
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
