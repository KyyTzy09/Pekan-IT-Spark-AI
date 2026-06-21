```mermaid
flowchart TB
    subgraph "Spark Ai — Fitur Siswa & Orang Tua"
        UC1[Socratic Tutor]
        UC2[Daily Challenge]
        UC3[Upload Dokumen]
        UC4[Lihat Progress Belajar]
        UC5[Gamifikasi: XP, Badge, Streak]
        UC6[Lihat Ringkasan Perkembangan]
        UC7[Terima Notifikasi]
    end

    subgraph "Authentication"
        AUTH[Login/Register]
    end

    SISWA[Siswa] --> UC1
    SISWA --> UC2
    SISWA --> UC3
    SISWA --> UC4
    SISWA --> UC5

    ORTU[Orang Tua] --> UC6
    ORTU --> UC7

    UC1 --> AUTH
    UC2 --> AUTH
    UC3 --> AUTH
    UC4 --> AUTH
    UC5 --> AUTH
    UC6 --> AUTH
    UC7 --> AUTH
```

Render: buka [mermaid.live](https://mermaid.live) ➜ paste ➜ export PNG
