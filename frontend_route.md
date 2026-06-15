# Frontend Routes — Spark Ai

> **Dokumen hidup** — sinkron dengan `todo.md` & `SparkAi.md` (PRD).
> **Catatan penting:** Platform ini **gratis untuk semua pengguna** — tidak ada halaman pricing, subscription, premium, atau pembayaran apa pun (PRD 2.3, 6.7). Juri dapat mengakses langsung tanpa biaya.
> **Fokus:** Siswa sebagai pengguna utama. Orang tua hanya monitoring via link. **Tidak ada role guru, tidak ada teacher dashboard.** Spark Ai bukan LMS — ini tutor AI personal untuk siswa.

---

## Aturan Routing

### Route Groups

| Group | URL Prefix | Untuk |
|-------|-----------|--------|
| `(public)` | `/` | Landing, marketing, legal |
| `(auth)` | `/login`, `/register`, `/forgot-password` | Auth flow |
| `(onboarding)` | `/onboarding/*` | Onboarding siswa baru |
| `(student)` | `/dashboard`, `/chat`, `/subjects`, `/practice`, `/upload`, dst. | Fitur siswa (wajib login + role `STUDENT` + onboarded) |
| `(parent)` | `/parent/*` | Monitoring orang tua (akses via kode undangan `ParentStudentLink`) |
| `(admin)` | `/admin/*` | Admin (role `ADMIN`) |
| `api/` | `/api/*` | Backend endpoints |

### Tipe Komponen

| Simbol | Tipe | Kapan |
|--------|------|-------|
| SC | Server Component | Default. Initial fetch, SEO, render langsung dari Prisma |
| CC | Client Component | Ada `useState`/`useEffect`/`onClick`/Framer Motion/tRPC hook/Context Provider |

### Proteksi Role

| URL | Role | Aturan |
|-----|------|--------|
| `/`, `/about`, `/help`, `/privacy`, `/terms`, `/pdp` | Publik | Siapa saja |
| `/login`, `/register` | Logged out only | Kalau sudah login -> redirect ke role-home |
| `/onboarding/*` | `STUDENT` belum onboarded | Kalau sudah -> `/dashboard` |
| `/dashboard`, `/chat/*`, `/subjects/*`, `/topics/*`, `/practice/*`, `/upload`, `/documents/*`, `/constellation`, `/plan`, `/badges`, `/daily-quest`, `/weekly-challenge`, `/study-buddy`, `/shop`, `/profile`, `/notifications`, `/settings/*` | `STUDENT` | |
| `/parent/*` | `PARENT` (linked via `ParentStudentLink`) | Monitoring only - read-only |
| `/admin/*` | `ADMIN` | |

Middleware (`src/middleware.ts`): cek session + role + onboarding status.

---

## Halaman Publik - `(public)/`

| Path | Tipe | Tujuan | Prioritas |
|------|------|--------|-----------|
| `/` | SC | Landing page | P0 |
| `/about` | SC | Tentang Spark Ai | P0 |
| `/help` | SC | Pusat bantuan + FAQ | P0 |
| `/contact` | SC | Kontak | P0 |
| `/privacy` | SC | Kebijakan Privasi | P0 (PRD 6.5) |
| `/terms` | SC | Syarat & Ketentuan | P0 (PRD 6.5) |
| `/pdp` | SC | Kepatuhan UU PDP | P0 (PRD 6.5) |
| `/blog` | CC | Blog | P3 |
| `/blog/[slug]` | SC | Artikel blog | P3 |

> **TIDAK ADA halaman:** `/pricing`, `/subscription`, `/premium`, `/payment`, `/checkout`, `/promo`, `/enterprise` - Spark Ai GRATIS untuk semua siswa (PRD 2.3).

Error pages per route group: `not-found.tsx`, `error.tsx`.

---

## Auth - `(auth)/`

| Path | Tipe | Tujuan | Referensi |
|------|------|--------|-----------|
| `/login` | CC | Form email + password (Credentials) | todo 0.3, 2.1 |
| `/register` | CC | Pilih role: **Siswa / Orang Tua** | todo 2.1 |
| `/register/student` | CC | Form: nama, email, password | todo 2.1 |
| `/register/parent` | CC | Form: nama, email, password, + input kode anak | todo 2.1, 2.3 |
| `/forgot-password` | CC | Form email untuk reset | todo 0.3 |
| `/reset-password/[token]` | CC | Form password baru | todo 0.3 |
| `/verify-email/[token]` | CC | Verifikasi email | todo 0.3 |

> **Tidak ada:** `/register/teacher`, `/register/premium`, `/register/enterprise`.

Validasi semua form dengan Zod. Provider: Credentials + Google OAuth opsional (P1).

---

## Onboarding Siswa - `(onboarding)/`

> Hanya untuk `STUDENT` baru. Sequential.

| Path | Tipe | Tujuan | Referensi |
|------|------|--------|-----------|
| `/onboarding` | CC | Welcome screen + karakter Spark | todo 2.2 |
| `/onboarding/profile` | CC | Isi profil: jenjang (SMA/SMK), kelas, sekolah | todo 2.2, PRD 3.1 |
| `/onboarding/subjects` | CC | Pilih mapel fokus (multi-select) | todo 2.2 |
| `/onboarding/pretest` | CC | 5-10 soal per mapel -> generate `StudentKnowledgeProfile` | todo 1.2, 2.2 |
| `/onboarding/style` | CC | Pilih gaya belajar (visual/textual/example-heavy/Socratic) | todo 1.2, 2.2 |
| `/onboarding/reminder` | CC | Setup daily reminder (opt-in) | todo 2.2 |

Middleware: redirect ke `/onboarding/pretest` kalau `StudentKnowledgeProfile` belum ada.

---

## Student Area - `(student)/`

> Layout: dashboard dengan sidebar (desktop) + bottom nav (mobile).
> Wajib: login + role `STUDENT` + onboarded.
> **Semua fitur gratis, tanpa paywall.**

### Dashboard

| Path | Tipe | Tujuan | Referensi |
|------|------|--------|-----------|
| `/dashboard` | SC | Home: sapaan Spark, rekomendasi harian, progress per mapel, aksi utama | todo 3.1, 3.2 |

### Subject & Topic Explorer

| Path | Tipe | Tujuan | Referensi |
|------|------|--------|-----------|
| `/subjects` | SC | Daftar 4 mapel: Matematika, B.Indo, B.Inggris, IPA | todo 1.1, 3.3, PRD 6.1 |
| `/subjects/[slug]` | SC | Detail mapel: progress, daftar topik | todo 3.3 |
| `/topics/[topicId]` | SC | Detail topik: skill tree + progress bar | todo 1.1, 3.3 |
| `/topics/[topicId]/concepts/[conceptId]` | SC | Detail konsep: penjelasan, status, contoh | todo 1.1, 3.3 |
| `/constellation` | CC | Visualisasi Knowledge Star per mapel | todo 7.6, PRD 4.7.2e |

### Learning Plan

| Path | Tipe | Tujuan | Referensi |
|------|------|--------|-----------|
| `/plan` | SC | Rencana belajar mingguan personal, adaptif | todo 3.4 |

### Chat Socratic

| Path | Tipe | Tujuan | Referensi |
|------|------|--------|-----------|
| `/chat` | SC | List sesi chat sebelumnya + tombol "Mulai baru" | todo 4.1, 4.3 |
| `/chat/new` | CC | Form pilih mapel/topik -> buat `ChatSession` | todo 4.3 |
| `/chat/[sessionId]` | CC | UI chat app. Bubble siswa vs Spark. Loading state. Streaming AI | todo 4.1, 4.2, 4.3 |

Anti-cheating guardrails: Socratic method + deteksi contekan + disclaimer AI. Diimplementasi di AI service layer, bukan route.

### Document Upload (PDF/DOCX)

| Path | Tipe | Tujuan | Referensi |
|------|------|--------|-----------|
| `/upload` | CC | Form upload PDF/DOCX. Validasi: max 10 MB, 50 halaman | todo 5.1, PRD 4.8 |
| `/documents` | SC | Daftar dokumen yang sudah diunggah | todo 5.1 |
| `/documents/[docId]` | SC | Viewer Markdown + ringkasan + aksi AI | todo 5.2, 5.3, PRD 4.8 |

Pipeline: `pdf-parse`/`mammoth` -> Markdown -> simpan `@db.Text`.

### Practice & Evaluation

| Path | Tipe | Tujuan | Referensi |
|------|------|--------|-----------|
| `/practice` | SC | Pilih mode latihan (topik/konsep) | todo 6.1 |
| `/practice/[topicId]` | CC | Soal adaptif. Auto-select next question | todo 6.1, 6.5 |
| `/practice/[topicId]/quiz/[quizId]` | CC | Quiz mode dengan timer. Auto-submit | todo 6.2 |
| `/practice/results/[attemptId]` | SC | Hasil quiz + breakdown per konsep + rekomendasi | todo 6.3 |

Adaptive difficulty: update `StudentKnowledgeProfile.masteryScore` setelah attempt.

### Gamification

| Path | Tipe | Tujuan | Referensi |
|------|------|--------|-----------|
| `/badges` | SC | Koleksi badge (locked + unlocked). Filter kategori | todo 7.3, PRD 4.7.2c |
| `/daily-quest` | SC | 3 misi harian + progress + bonus XP | todo 7.4, PRD 4.7.2d |
| `/weekly-challenge` | CC | Tantangan mingguan + badge eksklusif | todo 7.5, PRD 4.7.2j |
| `/study-buddy` | CC | Tanaman virtual (bibit -> kecambah -> bunga -> pohon) | todo 7.7, PRD 4.7.2f |
| `/shop` | CC | Kustomisasi Spark (warna, aksesoris). **Unlock pakai XP, BUKAN uang** | todo 7.8, PRD 4.7.2g |

> **TIDAK ADA route untuk:** gacha, pay-to-win, energy system, leaderboard global toxic, FOMO, streak punishment.

### Profile & Settings

| Path | Tipe | Tujuan | Referensi |
|------|------|--------|-----------|
| `/profile` | CC | Profil siswa: avatar, statistik, personal best | todo 7.7, PRD 4.7.2i |
| `/notifications` | SC | List notifikasi (badge unlock, reminder) | todo 7.3 |
| `/settings` | CC | Settings: notifikasi, tema, preferensi | - |
| `/settings/account` | CC | Ubah password, email | - |
| `/settings/privacy` | CC | Hapus akun, export data (UU PDP) | todo 12.2, PRD 5.4, 6.5 |
| `/settings/invite` | CC | Generate kode undangan untuk orang tua | todo 2.3 |

> **Tidak ada:** `/settings/billing`, `/settings/subscription`, `/settings/premium`.

---

## Parent Monitoring - `(parent)/parent/*`

> Orang tua = pengguna pendukung (PRD 3.2). **Read-only monitoring.**
> **TIDAK bisa:** edit profil/progress anak, akses chat, generate soal, intervensi langsung.
> Akses via kode undangan `ParentStudentLink` (todo 2.3).

| Path | Tipe | Tujuan | Referensi |
|------|------|--------|-----------|
| `/parent` | SC | Dashboard: ringkasan perkembangan anak | todo 8.1, PRD 5.2 |
| `/parent/link` | CC | Form input kode undangan hubungkan ke anak. Hanya muncul kalau BELUM linked | todo 2.3 |
| `/parent/children` | SC | Daftar anak yang di-link | todo 8.4 |
| `/parent/children/[childId]` | SC | Detail progress satu anak | todo 8.1 |
| `/parent/children/[childId]/reports` | SC | Ringkasan mingguan + grafik progress | todo 8.2, PRD 5.2 |
| `/parent/children/[childId]/recommendations` | SC | Rekomendasi dukungan (non-menyalahkan) | todo 8.2 |
| `/parent/notifications` | SC | Alert: anak tidak belajar / kesulitan. **Positif, bukan menyalahkan** | todo 8.3, PRD 6.7 |
| `/parent/settings` | CC | Email digest mingguan (opt-in) | todo 8.3 |

---

## Admin - `(admin)/admin/*`

> Middleware: role `ADMIN`. `adminProcedure` di tRPC.
> Admin manages: students, parents, content, moderation. **Tidak ada teacher.**

| Path | Tipe | Tujuan | Referensi |
|------|------|--------|-----------|
| `/admin` | SC | Dashboard: jumlah user, aktivitas, error | todo 10.1 |
| `/admin/users` | CC | CRUD users. Filter by role (student/parent/admin) | todo 10.1 |
| `/admin/users/new` | CC | Form buat user baru | todo 10.1 |
| `/admin/users/[userId]` | CC | Edit user, role, suspend, hapus | todo 10.1 |
| `/admin/content` | SC | Index halaman kelola konten | todo 10.1 |
| `/admin/content/subjects` | CC | CRUD subjects (4 mapel) | todo 10.1, 1.1 |
| `/admin/content/subjects/[subjectId]/topics` | CC | CRUD topics per subject | todo 10.1, 1.1 |
| `/admin/content/topics/[topicId]/concepts` | CC | CRUD concepts + `ConceptPrerequisite` | todo 10.1, 1.1 |
| `/admin/content/questions` | CC | Bank soal. Filter by subject/topic/difficulty | todo 1.3, 10.1 |
| `/admin/content/questions/new` | CC | Form buat soal (PG/esai/true-false) | todo 1.3, 10.1 |
| `/admin/content/questions/[questionId]` | CC | Edit soal + common misconceptions | todo 1.3, 10.1 |
| `/admin/content/badges` | CC | CRUD badges + achievements | todo 7.3, 10.1 |
| `/admin/content/documents` | CC | Upload materi referensi untuk RAG | todo 5.4, 10.2 |
| `/admin/moderation` | CC | Review flagged chat. Ban/suspend user | todo 10.3 |
| `/admin/audit-log` | SC | Audit log aktivitas admin | todo 10.3 |
| `/admin/settings` | CC | System settings | - |

> **Tidak ada:** `/admin/payments`, `/admin/subscriptions`, `/admin/plans`.

---

## API Routes - `api/`

| Path | Tipe | Tujuan | Referensi |
|------|------|--------|-----------|
| `/api/auth/[...nextauth]` | Route Handler | next-auth handler | todo 0.3 |
| `/api/trpc/[trpc]` | Route Handler | tRPC fetch adapter | todo 0.4 |
| `/api/upload` | Route Handler (opsional) | Upload file besar langsung | todo 5.1 |

> **DILARANG** bikin Route Handler cuma buat baca data Prisma. Server Component + Prisma langsung. tRPC hanya untuk endpoint dari client.

---

## Flow Kritis

### 1. Auth -> Onboarding -> Dashboard
```
Logged out -> /login -> /register
    - Pilih "Siswa"  -> /register/student -> /onboarding -> /onboarding/profile -> /onboarding/subjects -> /onboarding/pretest -> /onboarding/style -> /onboarding/reminder -> /dashboard
    - Pilih "Ortu"   -> /register/parent (input kode anak) -> /parent
    - (Login existing) -> /<role-home>
```

### 2. Chat butuh profile (PRD 4.1, 4.2, 4.6)
Sebelum `/chat` aktif, siswa wajib punya `StudentKnowledgeProfile` (dari pretest). Middleware redirect ke `/onboarding/pretest` kalau belum.

### 3. Practice adaptif (PRD 4.2)
`/practice/[topicId]` butuh `StudentKnowledgeProfile` + `Question` ter-tag `conceptId`. Update `masteryScore` setelah attempt.

### 4. Document upload (PRD 4.8)
`/upload` -> extract text -> simpan Markdown -> embed -> `/documents/[id]`. AI: explain/summarize/quiz.

### 5. Parent-child linking (todo 2.3)
- Student generate kode 8-karakter di `/settings/invite` (7 hari valid)
- Parent input kode di `/parent/link` -> `ParentStudentLink` (status: pending)
- Parent lihat progress di `/parent/children/[childId]`

### 6. Gamification triggers (PRD 4.7)
Trigger otomatis via Server Action / tRPC mutation:
- `addXp(userId, amount, source, metadata)` - setelah: jawab benar, selesai chat, kuasai konsep, daily quest done
- Update `Streak` setelah aktivitas harian
- Check `Badge` unlock setelah event
- Generate `DailyQuest` per hari

### 7. Anti-pattern enforcement (PRD 4.7.3, todo 7.10)

| Anti-pattern | Enforcement |
|--------------|-------------|
| Gacha/loot box | Tidak ada route/shop logic untuk itu |
| Pay-to-win | Semua unlock via XP/bintang. **Tidak ada payment integration** |
| Energy/life | Tidak ada middleware yang block aktivitas |
| FOMO messages | Notification copy di-review manual |
| Streak punishment | Copy: "Gapapa, yuk mulai lembaran baru!" |
| Global toxic leaderboard | Tidak ada route `/leaderboard` global |
| Teacher-class | Tidak ada route sama sekali. Bukan LMS. |
| Pricing/subscription | Tidak ada route `/pricing`, `/premium`, `/payment` |

### 8. UU PDP (todo 12.2, PRD 6.5)
- `/settings/privacy` -> hapus akun + export data
- `/privacy`, `/terms`, `/pdp` -> transparansi
- Document metadata log untuk audit
- 1-2 notifikasi/hari max, opt-in

---

## Struktur File

```
src/
  app/
    (public)/
      layout.tsx
      page.tsx                    # /
      about/page.tsx
      help/page.tsx
      contact/page.tsx
      blog/                       # P3
        page.tsx
        [slug]/page.tsx
      privacy/page.tsx
      terms/page.tsx
      pdp/page.tsx
      not-found.tsx
      error.tsx

    (auth)/
      layout.tsx
      login/page.tsx
      register/
        page.tsx
        student/page.tsx
        parent/page.tsx
      forgot-password/page.tsx
      reset-password/[token]/page.tsx
      verify-email/[token]/page.tsx

    (onboarding)/
      layout.tsx
      onboarding/
        page.tsx
        subjects/page.tsx
        pretest/page.tsx
        style/page.tsx
        reminder/page.tsx

    (student)/
      layout.tsx                  # Dashboard layout
      dashboard/page.tsx
      chat/
        page.tsx
        new/page.tsx
        [sessionId]/page.tsx
      subjects/
        page.tsx
        [slug]/
          page.tsx
          topics/[topicId]/
            page.tsx
            concepts/[conceptId]/page.tsx
      constellation/page.tsx
      plan/page.tsx
      practice/
        page.tsx
        [topicId]/
          page.tsx
          quiz/[quizId]/page.tsx
          results/[attemptId]/page.tsx
      upload/page.tsx
      documents/
        page.tsx
        [docId]/page.tsx
      badges/page.tsx
      daily-quest/page.tsx
      weekly-challenge/page.tsx
      study-buddy/page.tsx
      shop/page.tsx
      profile/page.tsx
      notifications/page.tsx
      settings/
        page.tsx
        account/page.tsx
        privacy/page.tsx
        invite/page.tsx         # generate kode ortu

    (parent)/
      layout.tsx
      parent/
        page.tsx
        link/page.tsx
        children/
          page.tsx
          [childId]/
            page.tsx
            reports/page.tsx
            recommendations/page.tsx
        notifications/page.tsx
        settings/page.tsx

    (admin)/
      layout.tsx
      admin/
        page.tsx
        users/
          page.tsx
          new/page.tsx
          [userId]/page.tsx
        content/
          page.tsx
          subjects/
            page.tsx
            [subjectId]/topics/page.tsx
          topics/[topicId]/concepts/page.tsx
          questions/
            page.tsx
            new/page.tsx
            [questionId]/page.tsx
          badges/page.tsx
          documents/page.tsx
        moderation/page.tsx
        audit-log/page.tsx
        settings/page.tsx

    api/
      auth/[...nextauth]/route.ts
      trpc/[trpc]/route.ts
      upload/route.ts             # opsional

    layout.tsx                    # Root
    providers.tsx
    globals.css

  components/
    ui/                           # shadcn primitives
    landing/                      # Marketing
    student/                      # Student-specific
    parent/                       # Parent monitoring
    admin/
    shared/

  server/
    ai/
      tutor.ts                    # Socratic engine (PRD 4.6)
      evaluator.ts                # Answer feedback
      rag.ts                      # Document retrieval
    actions/                      # Server Actions
    documents/                    # PDF/DOCX processing

  trpc/
    init.ts
    routers/
      _app.ts
      auth.ts
      subject.ts
      topic.ts
      concept.ts
      question.ts
      quiz.ts
      chat.ts
      document.ts
      gamification.ts             # XP, streak, badge, quest
      link.ts                     # Parent-student invite
      user.ts                     # Admin
      moderation.ts
    client.tsx
    server.tsx
    query-client.ts

  lib/
    auth.ts
    prisma.ts
    utils.ts
    validators/                   # Zod schemas

  types/
    next-auth.d.ts

  middleware.ts                   # Role-based routing
```

> **Tidak ada:** `teacher/`, `(teacher)/`, route group `class.ts` di tRPC, `TeacherProfile` di Prisma. Semua yang nyebut guru/teacher sudah dihapus.
> **Tidak ada:** `pricing/`, `payment/`, `subscription/`, `premium/`. Spark Ai gratis.

---

## Checklist Sinkronisasi

- [x] **PRD 2.3 Gratis untuk semua siswa** -> tidak ada route pricing/payment/premium
- [x] **PRD 3.1 Siswa = pengguna utama** -> semua route utama di `/dashboard`, `/chat`, `/subjects`, `/practice`, `/upload`, dll
- [x] **PRD 3.2 Orang Tua = pengguna pendukung (read-only monitoring)** -> route group `(parent)/` dengan `/parent/*`
- [x] **Tidak ada guru/teacher** -> tidak ada route, role `TEACHER`, `/register/teacher`
- [x] **PRD 4.1-4.6 kemampuan inti** -> route: `/chat/*`, `/practice/*`, `/subjects/*`, `/dashboard`
- [x] **PRD 4.7 gamifikasi** -> `/badges`, `/daily-quest`, `/weekly-challenge`, `/study-buddy`, `/shop`, `/constellation`
- [x] **PRD 4.7.3 anti-patterns** -> tidak ada route gacha/pay-to-win/energy/leaderboard global toxic
- [x] **PRD 4.8 dokumen** -> `/upload`, `/documents/*`
- [x] **PRD 6.1 scope mapel** -> 4 mapel di `/subjects`
- [x] **PRD 6.5 UU PDP** -> `/settings/privacy` (hapus akun, export data)
- [x] **PRD 6.7 tanpa monetisasi** -> semua fitur gratis, XP-based, tidak ada payment integration
- [x] **todo 2.3 parent linking** -> `/settings/invite` + `/parent/link` + `/parent/*`
- [x] **Aturan Server Component First** -> publik & detail = SC, form/interaksi = CC
