```mermaid
flowchart LR
    A((Siswa)) --> UC1[Socratic Tutor]
    A --> UC2[Daily Challenge]
    A --> UC3[Practice Quiz]
    A --> UC4[Upload Dokumen]
    A --> UC5[Lihat Materi]
    A --> UC6[Lihat Progress]
    A --> UC7[Leaderboard]
    A --> UC8[Kelola Mapel]
    A --> UC9[Undang Orang Tua]

    UC1 --- D1[Ketik & Jawab Pertanyaan]
    UC1 --- D2[Lihat Riwayat Chat]

    UC2 --- D3[Kerjakan Soal Harian]
    UC2 --- D4[Klaim Reward XP]

    UC3 --- D5[Pilih Mapel]
    UC3 --- D6[Latihan Adaptif]

    UC4 --- D7[Upload PDF/DOCX]
    UC4 --- D8[Chat dengan Dokumen]

    UC6 --- D9[XP, Level, Badge]
    UC6 --- D10[Mastery per Topik]
```

Render: buka [mermaid.live](https://mermaid.live) ➜ paste ➜ export PNG
