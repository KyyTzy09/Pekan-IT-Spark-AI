```mermaid
flowchart TD
    subgraph ORTU["Aktor: Orang Tua"]
        style ORTU fill:#fce7f3,stroke:#db2777
    end

    ORTU --> UC1["Hubungkan Akun Anak"]
    ORTU --> UC2["Lihat Dashboard Perkembangan"]
    ORTU --> UC3["Lihat Riwayat Aktivitas"]
    ORTU --> UC4["Lihat Rekomendasi AI"]
    ORTU --> UC5["Lihat Notifikasi & Alerts"]
    ORTU --> UC6["Ganti Anak yang Dipantau"]

    subgraph UC1_DETAIL["Hubungkan Akun"]
        UC1 --> UC1a["Masukkan kode undangan"]
        UC1 --> UC1b["Verifikasi koneksi"]
    end

    subgraph UC2_DETAIL["Dashboard Perkembangan"]
        UC2 --> UC2a["Lihat statistik belajar"]
        UC2 --> UC2b["Lihat level & XP anak"]
        UC2 --> UC2c["Lihat streak belajar"]
        UC2 --> UC2d["Lihat progress per mapel"]
        UC2 --> UC2e["Lihat konsep dikuasai & kesulitan"]
    end

    subgraph UC3_DETAIL["Riwayat Aktivitas"]
        UC3 --> UC3a["Filter berdasarkan hari"]
        UC3 --> UC3b["Lihat aktivitas tantangan"]
        UC3 --> UC3c["Lihat aktivitas latihan"]
        UC3 --> UC3d["Lihat aktivitas chat"]
        UC3 --> UC3e["Lihat aktivitas baca materi"]
    end

    subgraph UC4_DETAIL["Rekomendasi AI"]
        UC4 --> UC4a["Lihat tips dukungan belajar"]
        UC4 --> UC4b["Lihat saran pendampingan"]
    end

    subgraph UC5_DETAIL["Notifikasi"]
        UC5 --> UC5a["Alert inaktivitas belajar"]
        UC5 --> UC5b["Alert kesulitan konsep"]
        UC5 --> UC5c["Reinforcement positif"]
    end

    subgraph SISTEM["Sistem Spark Ai"]
        style SISTEM fill:#fef3c7,stroke:#f59e0b
        SYS1[("Parent-Student Link")]
        SYS2[("Analytics Engine")]
        SYS3[("AI Recommendation Engine")]
        SYS4[("Alert System")]
    end

    UC1 -.-> SYS1
    UC2 -.-> SYS2
    UC3 -.-> SYS2
    UC4 -.-> SYS3
    UC5 -.-> SYS4
```

Render: buka [mermaid.live](https://mermaid.live) ➜ paste ➜ export PNG
