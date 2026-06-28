# Mastery System Overhaul — Design Spec

> **Tanggal:** 2026-06-28
> **Status:** Draft

## 1. Masalah Saat Ini

### 1.1 Mastery Calculation (computeMasteryUpdate)
```ts
// SAAT INI — terlalu sederhana
const target = isCorrect ? 1 : 0;
const learningRate = 0.2;
const updated = prevScore + learningRate * (target - prevScore);
```

**Masalah:**
- Hanya `correct/incorrect` — tidak peduli difficulty
- Learning rate statis 0.2
- 5 soal benar langsung naik tinggi (0 → 0.67)
- Tidak ada confidence tracking
- Mastery tidak pernah turun kalau tidak latihan

### 1.2 Difficulty System
```ts
// SAAT INI — level discrete
enum Difficulty { EASY, MEDIUM, HARD, ADVANCED }
```

**Masalah:**
- Terlalu kasar (hanya 4 level)
- Tidak ada korelasi dengan mastery siswa
- Soal EASY benar = poin sama dengan HARD benar

### 1.3 Tidak Ada Decay
- Mastery 0.9 tetap 0.9 walau tidak latihan 6 bulan
- Tidak ada konsep "lupa"

---

## 2. Sistem Baru: Continuous Mastery Score (CMS)

### 2.1 Konsep Inti

Setiap siswa punya **mastery score 0-100** per konsep, dihitung dengan:

```
CMS = (Base Score × Weight) + (Performance Score × Weight) - Decay + Bonus
```

**Komponen:**
1. **Base Score** — rata-rata performa historis (bukan cuma 5 terakhir)
2. **Performance Score** — performa terkini dengan difficulty weighting
3. **Decay** — penurunan karena tidak latihan (7 hari)
4. **Bonus** — streak, materi dibaca, refleksi

### 2.2 Difficulty sebagai Kontinu (0-100)

Hapus `enum Difficulty`. Ganti dengan `difficultyScore: Float` (0-100).

| Range | Label (untuk UI) | Contoh |
|-------|------------------|--------|
| 0-20 | Sangat Mudah | Hafalan sederhana |
| 21-40 | Mudah | Pemahaman dasar |
| 41-60 | Sedang | Aplikasi |
| 42-80 | Sulit | Analisis |
| 81-100 | Sangat Sulit | Evaluasi & Kreasi |

**Mapping dari soal yang ada:**
- EASY → 20
- MEDIUM → 45
- HARD → 70
- ADVANCED → 90

### 2.3 Mastery Update Formula (Running Score)

Mastery berubah SETIAP attempt. Formula:

```ts
function computeNewMastery(params: {
  currentMastery: number;      // 0-100, running score
  attemptCount: number;         // total attempts sebelumnya
  isCorrect: boolean;
  difficultyScore: number;      // 0-100
  timeSpentSeconds: number;
  avgTimeForDifficulty: number; // baseline waktu untuk difficulty ini
  daysSinceLastAttempt: number; // untuk decay
}): number {
  const {
    currentMastery, attemptCount, isCorrect,
    difficultyScore, timeSpentSeconds, avgTimeForDifficulty,
    daysSinceLastAttempt
  } = params;

  // 1. DECAY — jika > 7 hari tidak latihan
  let decay = 0;
  if (daysSinceLastAttempt > 7) {
    const decayDays = daysSinceLastAttempt - 7;
    decay = Math.min(decayDays * 0.5, 20); // max 20 poin decay
  }

  // 2. DIFFICULTY WEIGHT — soal sulit lebih berbobot
  // Gap antara difficulty soal dan mastery saat ini
  const difficultyGap = difficultyScore - currentMastery;
  // Gap positif (soal lebih sulit dari mastery) → weight tinggi
  // Gap negatif (soal lebih mudah dari mastery) → weight rendah
  const difficultyWeight = clamp(0.3 + (difficultyGap / 200), 0.1, 1.0);

  // 3. BASE DELTA — berapa poin berubah jika benar/salah
  let baseDelta: number;
  if (isCorrect) {
    // Benar: naik berdasarkan difficulty
    // Soal sulit benar → naik banyak, soal mudah benar → naik sedikit
    baseDelta = (difficultyScore / 100) * 10 * difficultyWeight;
    // Cap: max 10 poin per attempt untuk soal difficulty 100
  } else {
    // Salah: turun berdasarkan difficulty
    // Soal mudah salah → turun banyak (harusnya bisa)
    // Soal sulit salah → turun sedikit (wajar)
    baseDelta = -((100 - difficultyScore) / 100) * 8 * difficultyWeight;
    // Cap: max -8 poin per attempt untuk soal difficulty 0
  }

  // 4. TIME BONUS/PENALTY
  let timeFactor = 1.0;
  if (isCorrect && timeSpentSeconds < avgTimeForDifficulty * 0.75) {
    timeFactor = 1.15; // bonus 15% untuk jawaban cepat
  } else if (!isCorrect && timeSpentSeconds < avgTimeForDifficulty * 0.5) {
    timeFactor = 0.85; // penalty 15% untuk jawaban terlalu cepat (mungkin asal)
  }

  // 5. CONFIDENCE FACTOR — semakin banyak attempt, semakin kecil perubahan
  const confidenceFactor = 1 / (1 + Math.log2(attemptCount + 1));
  
  // 6. FINAL CALCULATION
  const delta = baseDelta * timeFactor * confidenceFactor;
  let newMastery = currentMastery + delta - decay;
  
  // Clamp 0-100
  return Math.max(0, Math.min(100, newMastery));
}
```

**Parameter Kunci:**
- `attemptCount` = total attempts SELAMA INI (bukan rolling window)
- `confidenceFactor` = semakin banyak attempt → perubahan semakin kecil
- `difficultyWeight` = gap antara difficulty soal dan mastery saat ini
- `baseDelta` = perubahan dasar sebelum dikali factor

### 2.4 Perjalanan Mastery (Running Score)

Mastery berubah SETIAP attempt. Bukan rolling window, tapi running score yang terakumulasi.

**Contoh Perjalanan User (100 soal):**

```
Attempt 1:   EASY benar    → mastery: 0 → 3.0     (+3.0)
Attempt 2:   EASY benar    → mastery: 3.0 → 5.8   (+2.8)
Attempt 3:   EASY salah    → mastery: 5.8 → 3.1   (-2.7)
Attempt 4:   MEDIUM benar  → mastery: 3.1 → 8.2   (+5.1)
Attempt 5:   HARD benar    → mastery: 8.2 → 16.5  (+8.3)
...
Attempt 50:  MEDIUM benar  → mastery: 52.3 → 53.1 (+0.8)
Attempt 51:  HARD salah    → mastery: 53.1 → 49.8 (-3.3)
Attempt 52:  EASY benar    → mastery: 49.8 → 50.0 (+0.2)
...
Attempt 100: HARD benar    → mastery: 78.2 → 78.9 (+0.7)
```

**Grafik Perjalanan:**
```
Mastery
100 |
 90 |
 80 |                                          ___---‾‾‾
 70 |                              ___----‾‾‾‾‾‾
 60 |                   ___----‾‾‾‾
 50 |          ___---‾‾‾
 40 |     _---‾
 30 |   /‾
 20 |  /
 10 | /
  0 |______________________________________________
    0    10    20    30    40    50    60    70    80    90   100
                        Attempt Number
```

**Kenapa Bukan Rolling Window?**
- Rolling window (5 terakhir) → mastery bisa "lompat" drastis
- Running score → mastery berubah gradual, mencerminkan total pemahaman
- User bisa lihat progress nyata dari attempt 1 sampai 100

### 2.5 Confidence Factor (Stabilizer)

Semakin banyak attempt, semakin KEcil perubahan mastery per attempt. Ini mencegah:
- 5 soal benar → mastery langsung tinggi
- 3 soal salah → mastery langsung hancur

```ts
// Confidence factor: semakin banyak attempt, semakin kecil perubahan
const confidenceFactor = 1 / (1 + Math.log2(attemptCount + 1));

// Contoh:
// attemptCount = 1   → factor = 1.0  (perubahan besar)
// attemptCount = 5   → factor = 0.39 (perubahan sedang)
// attemptCount = 20  → factor = 0.20 (perubahan kecil)
// attemptCount = 100 → factor = 0.12 (perubahan sangat kecil)
```

**Efek pada perjalanan:**
```
Attempt 1:   factor=1.00 → perubahan ±3.0 poin
Attempt 10:  factor=0.31 → perubahan ±1.0 poin
Attempt 50:  factor=0.16 → perubahan ±0.5 poin
Attempt 100: factor=0.12 → perubahan ±0.3 poin
```

### 2.6 Kenapa Sistem Ini Lebih Baik

| Skenario | Sistem Lama | Sistem Baru |
|----------|-------------|-------------|
| 5 soal EASY benar | 0 → 67 (langsung tinggi) | 0 → 14 (masih rendah) |
| 100 soal campuran (70% benar) | ~70 (statis) | ~75 (fluktuatif, naik-turun) |
| Tidak latihan 14 hari | tetap | -7 poin |
| Mastery 90, soal EASY benar | naik sedikit | naik 0.2 poin (sudah puncak) |
| Mastery 90, soal HARD salah | turun sedikit | turun 1.5 poin |

### 2.5 Confidence Score

Selain mastery, kita track **confidence (0-100)** yang menunjukkan seberapa yakin sistem dengan mastery score.

```ts
function computeConfidence(attemptCount: number, recency: number): number {
  // attemptCount: jumlah total attempts
  // recency: 0-1, seberapa baru attempt terakhir (1 = hari ini)
  
  const attemptFactor = Math.min(attemptCount / 30, 1); // max setelah 30 attempts
  const recencyFactor = recency;
  
  return Math.round((attemptFactor * 0.6 + recencyFactor * 0.4) * 100);
}
```

**Interpretasi:**
- Confidence 0-20: Data kurang, mastery bisa berubah drastis
- Confidence 21-50: Data cukup, mastery mulai stabil
- Confidence 51-80: Data bagus, mastery stabil
- Confidence 81-100: Data sangat bagus, mastery sangat stabil

---

## 3. Per-Subject Mastery

### 3.1 Agregasi Konsep → Topik → Mapel

```
Subject Mastery = weighted_avg(Topic Mastery)
Topic Mastery = weighted_avg(Concept Mastery)
```

**Weight per konsep:**
- Jumlah attempts → lebih banyak attempt = lebih reliable
- Recency → attempt terbaru = lebih penting

### 3.2 Schema Baru

```prisma
model StudentMastery {
  id            String   @id @default(cuid())
  userId        String
  conceptId     String
  
  // Core mastery
  score         Float    @default(0)        // 0-100
  confidence    Float    @default(0)        // 0-100
  
  // Stats
  attemptCount  Int      @default(0)
  correctCount  Int      @default(0)
  totalTimeSpent Int     @default(0)        // detik
  
  // Decay tracking
  lastAttemptAt DateTime?
  lastDecayAt   DateTime?
  
  // History
  peakScore     Float    @default(0)        // skor tertinggi pernah dicapai
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  @@unique([userId, conceptId])
  @@index([userId])
  @@index([score])
  @@map("student_mastery")
}

model SubjectMastery {
  id            String   @id @default(cuid())
  userId        String
  subjectId     String
  
  // Aggregated mastery
  score         Float    @default(0)        // 0-100
  confidence    Float    @default(0)        // 0-100
  
  // Stats
  conceptsMastered Int   @default(0)
  conceptsTotal    Int   @default(0)
  
  // For challenge generation
  recommendedDifficulty Float @default(50)  // 0-100
  
  updatedAt     DateTime @updatedAt
  
  @@unique([userId, subjectId])
  @@index([userId])
  @@map("subject_mastery")
}
```

---

## 4. Integrasi dengan AI Generation

### 4.1 Question Generation

Ketika generate soal, kirim context mastery ke AI:

```ts
const prompt = `
Generate soal untuk konsep "${conceptName}".
- Mastery siswa: ${mastery.score}/100 (confidence: ${mastery.confidence}%)
- Difficulty target: ${targetDifficulty}/100
- Siswa sering salah di: ${weakAreas.join(', ')}
- Siswa sudah paham: ${strongAreas.join(', ')}

Buat soal yang:
- Difficulty sesuai target
- Fokus pada area yang lemah
- Tidak terlalu mudah jika mastery sudah tinggi
`;
```

### 4.2 Material Generation

```ts
const prompt = `
Generate materi untuk konsep "${conceptName}".
- Mastery siswa: ${mastery.score}/100
- Gaya belajar: ${learningStyle}
- Siswa sudah paham: ${strongAreas}
- Siswa masih lemah: ${weakAreas}

Buat materi yang:
- Fokus pada area lemah
- Jangan ulang yang sudah dikuasai
- Sesuai depth untuk level mastery
`;
```

### 4.3 Challenge Generation

```ts
// Difficulty challenge = rata-rata mastery subject × faktor tantangan
const challengeDifficulty = subjectMastery.score * 1.1; // 10% lebih sulit dari mastery

// Jika mastery rendah → challenge lebih mudah
// Jika mastery tinggi → challenge lebih sulit
```

---

## 5. Decay System

### 5.1 Aturan Decay

| Hari Tidak Latihan | Decay per Hari | Max Decay |
|-------------------|----------------|-----------|
| 1-7 hari | 0 (grace period) | 0 |
| 8-14 hari | 0.5 poin/hari | 3.5 |
| 15-30 hari | 1.0 poin/hari | 15 |
| 31+ hari | 1.5 poin/hari | 20 (cap) |

### 5.2 Implementasi Decay

Decay dihitung **on-demand** ketika ada request, bukan background job.

```ts
function applyDecay(mastery: StudentMastery, now: Date): StudentMastery {
  const daysSinceLastAttempt = daysBetween(mastery.lastAttemptAt, now);
  
  if (daysSinceLastAttempt <= 7) return mastery; // grace period
  
  const daysSinceLastDecay = daysBetween(mastery.lastDecayAt ?? mastery.lastAttemptAt, now);
  const decayDays = Math.min(daysSinceLastDecay - 7, daysSinceLastAttempt - 7);
  
  let decayAmount = 0;
  if (decayDays <= 7) {
    decayAmount = decayDays * 0.5;
  } else if (decayDays <= 23) {
    decayAmount = 3.5 + (decayDays - 7) * 1.0;
  } else {
    decayAmount = 3.5 + 16 + (decayDays - 23) * 1.5;
  }
  
  decayAmount = Math.min(decayAmount, 20); // max 20 poin
  
  return {
    ...mastery,
    score: Math.max(0, mastery.score - decayAmount),
    lastDecayAt: now,
  };
}
```

---

## 6. UI Changes

### 6.1 Mastery Display

**Sebelum:** "Mastery: 80%"
**Sesudah:** "Mastery: 80/100 (Confidence: 65%)"

### 6.2 Status Labels

| Range | Label | Warna |
|-------|-------|-------|
| 0-15 | Baru Mulai | Abu-abu |
| 16-35 | Belajar Dasar | Biru muda |
| 36-55 | Berkembang | Biru |
| 56-75 | Cukup Paham | Hijau muda |
| 76-88 | Paham Baik | Hijau |
| 89-100 | Menguasai | Emas |

### 6.3 Confidence Indicator

Tampilkan confidence sebagai:
- **Tinggi (81-100):** Progress bar solid
- **Sedang (51-80):** Progress bar dengan stripe pattern
- **Rendah (0-50):** Progress bar dotted + tooltip "Perlu lebih banyak latihan"

---

## 7. Migration Plan

### 7.1 Data Migration

```ts
// Konversi mastery lama (0-1) ke baru (0-100)
const newScore = oldMasteryScore * 100;

// Set confidence berdasarkan attempt count
const confidence = Math.min(attemptCount / 30, 1) * 100;
```

### 7.2 Backward Compatibility

- `Question.difficulty` tetap ada untuk kompatibilitas, tambah `difficultyScore`
- Lama: `difficulty: "HARD"` → Baru: `difficulty: "HARD", difficultyScore: 70`
- Migration script konversi semua soal yang ada

---

## 8. File Changes Required

### 8.1 New Files
- `src/server/learning/mastery.ts` — core mastery calculation
- `src/server/learning/decay.ts` — decay system
- `src/server/learning/confidence.ts` — confidence calculation
- `src/server/learning/difficulty.ts` — continuous difficulty
- `prisma/migrations/xxx_add_mastery_tables/` — schema migration

### 8.2 Modified Files
- `prisma/schema.prisma` — new models, update Question model
- `src/server/learning/adaptive.ts` — rewrite with new system
- `src/server/actions/subjects.ts` — update recordQuestionAttempt
- `src/server/actions/practice.ts` — use new mastery
- `src/server/actions/challenges.ts` — use new mastery for generation
- `src/server/ai/challenge.ts` — pass mastery context to AI
- `src/server/ai/curriculum.ts` — pass mastery context to AI
- `src/components/student/` — UI updates for new mastery display

### 8.3 Deleted/Deprecated
- `computeMasteryUpdate` in adaptive.ts → replaced by mastery.ts
- `deriveConceptStatus` → replaced by status labels based on score range
- `enum Difficulty` in usage → replaced by difficultyScore

---

## 9. Success Criteria

### 9.1 Perilaku Mastery

| Skenario | Expected Behavior |
|----------|-------------------|
| 5 soal EASY benar (attempt 1-5) | mastery naik ~14 poin (bukan 67) |
| 5 soal HARD benar (attempt 1-5) | mastery naik ~32 poin |
| 100 soal campuran (70% benar) | mastery ~70-80, fluktuatif naik-turun |
| 3 soal EASY salah (mastery 50) | mastery turun ~8 poin |
| 3 soal HARD salah (mastery 50) | mastery turun ~4 poin |
| Tidak latihan 14 hari | mastery turun ~7 poin |
| Mastery 90, soal EASY benar | mastery naik < 0.5 poin |
| Mastery 90, soal HARD salah | mastery turun ~1.5 poin |
| Attempt 100, soal EASY benar | mastery naik ~0.3 poin (stabil) |

### 9.2 Grafik Perjalanan Mastery

User harus bisa lihat grafik mastery yang:
- Naik-turun (bukan garis lurus ke atas)
- Fluktuasi besar di awal (attempt 1-20)
- Fluktuasi kecil di akhir (attempt 80-100)
- Trend naik jika performa bagus
- Trend turun jika performa buruk
- Drop jika tidak latihan > 7 hari

### 9.3 Integrasi

- Soal yang di-generate → difficulty sesuai mastery siswa
- Materi yang di-generate → fokus pada area lemah
- Challenge → difficulty = mastery × 1.1 (10% lebih sulit)

---

## 10. Open Questions

1. Apakah perlu ada "mastery lock" — jika mastery sudah 95+, tidak bisa turun di bawah 80?
2. Apakah refleksi/challenge harus punya bobot berbeda dari soal biasa?
3. Apakah perlu ada "mastery history" untuk tracking trend?
