```mermaid
flowchart TD
    A[Pengguna membuka Spark Ai] --> B{Sudah punya akun?}
    B -->|Belum| C[Register: pilih role Siswa / Orang Tua]
    C --> D[Buat akun & verifikasi]
    D --> E{Login sebagai}
    B -->|Sudah| E

    E -->|Siswa| F[Beranda Siswa]
    E -->|Orang Tua| G[Beranda Orang Tua]

    %% === ALUR SISWA ===
    F --> S1{Pilih fitur}

    S1 -->|Socratic Tutor| S2[Buka halaman chat]
    S2 --> S3[Ketik pertanyaan]
    S3 --> S4[Sistem ambil konteks dari knowledge graph]
    S4 --> S5[AI merespon dengan pertanyaan pancingan]
    S5 --> S6[Jawab pertanyaan pancingan]
    S6 --> S7[Mastery score diupdate]
    S7 --> S3

    S1 -->|Daily Challenge| S8[Buka halaman Daily Challenge]
    S8 --> S9[Kerjakan soal harian]
    S9 --> S10[Sistem hitung skor & reward XP]
    S10 --> S11{Mendapat badge baru?}
    S11 -->|Ya| S12[Tampilkan badge baru]
    S11 -->|Tidak| S13[Lihat leaderboard]
    S12 --> S13
    S13 --> F

    S1 -->|Upload Dokumen| S14[Pilih file materi belajar]
    S14 --> S15[Sistem proses & rangkum dokumen]
    S15 --> S16[Dokumen masuk ke knowledge base]
    S16 --> F

    S1 -->|Lihat Progress| S17[Buka halaman Progress]
    S17 --> S18[Lihat XP, streak, & badge]
    S18 --> S19[Lihat mastery per topik]
    S19 --> F

    %% === ALUR ORANG TUA ===
    G --> O1{Pilih fitur}

    O1 -->|Ringkasan Perkembangan| O2[Buka dashboard anak]
    O2 --> O3[Lihat statistik belajar anak]
    O3 --> O4[Lihat topik dikuasai & perlu perbaikan]
    O4 --> G

    O1 -->|Notifikasi| O5[Lihat daftar notifikasi]
    O5 --> O6[Baca update aktivitas anak]
    O6 --> G
```

Render: buka [mermaid.live](https://mermaid.live) ➜ paste ➜ export PNG
