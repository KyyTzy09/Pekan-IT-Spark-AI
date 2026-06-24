```mermaid
flowchart TD
    subgraph SISWA["Aktor: Siswa"]
        style SISWA fill:#e0f2fe,stroke:#0284c7
    end

    SISWA --> UC1["Buka Socratic Tutor"]
    SISWA --> UC2["Kerjakan Daily Challenge"]
    SISWA --> UC3["Kerjakan Practice Quiz"]
    SISWA --> UC4["Upload Dokumen Belajar"]
    SISWA --> UC5["Lihat Materi Pembelajaran"]
    SISWA --> UC6["Lihat Progress & Statistik"]
    SISWA --> UC7["Lihat Leaderboard"]
    SISWA --> UC8["Kelola Mata Pelajaran"]
    SISWA --> UC9["Undang Orang Tua"]

    subgraph UC1_DETAIL["Socratic Tutor"]
        UC1 --> UC1a["Ketik pertanyaan"]
        UC1 --> UC1b["Jawab pertanyaan pancingan AI"]
        UC1 --> UC1c["Lihat riwayat chat"]
    end

    subgraph UC2_DETAIL["Daily Challenge"]
        UC2 --> UC2a["Kerjakan soal harian"]
        UC2 --> UC2b["Lihat hasil & skor"]
        UC2 --> UC2c["Klaim reward XP"]
    end

    subgraph UC3_DETAIL["Practice Quiz"]
        UC3 --> UC3a["Pilih mata pelajaran"]
        UC3 --> UC3b["Kerjakan soal adaptif"]
        UC3 --> UC3c["Lihat hasil quiz"]
    end

    subgraph UC4_DETAIL["Upload Dokumen"]
        UC4 --> UC4a["Upload file PDF/DOCX"]
        UC4 --> UC4b["Sistem rangkum dokumen"]
        UC4 --> UC4c["Chat dengan dokumen"]
    end

    subgraph UC6_DETAIL["Progress"]
        UC6 --> UC6a["Lihat XP & Level"]
        UC6 --> UC6b["Lihat Streak Belajar"]
        UC6 --> UC6c["Lihat Badge & Achievement"]
        UC6 --> UC6d["Lihat Mastery per Topik"]
    end

    subgraph SISTEM["Sistem Spark Ai"]
        style SISTEM fill:#fef3c7,stroke:#f59e0b
        SYS1[("AI Socratic Engine")]
        SYS2[("Adaptive Difficulty Engine")]
        SYS3[("Knowledge Graph")]
        SYS4[("Gamification Engine")]
        SYS5[("RAG Document Engine")]
    end

    UC1 -.-> SYS1
    UC2 -.-> SYS2
    UC2 -.-> SYS4
    UC3 -.-> SYS2
    UC4 -.-> SYS5
    UC6 -.-> SYS3
    UC6 -.-> SYS4
```

Render: buka [mermaid.live](https://mermaid.live) ➜ paste ➜ export PNG
