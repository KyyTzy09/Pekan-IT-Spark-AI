```mermaid
flowchart TB
    subgraph "Spark Ai — Fitur Admin"
        UC1[Kelola Kurikulum & Materi]
        UC2[Verifikasi Mapel Custom]
        UC3[Kelola Akun Pengguna]
        UC4[Lihat Statistik Pengguna]
        UC5[Atur Konten Daily Challenge]
    end

    subgraph "Authentication"
        AUTH[Login/Register Admin]
    end

    ADMIN[Admin] --> UC1
    ADMIN --> UC2
    ADMIN --> UC3
    ADMIN --> UC4
    ADMIN --> UC5

    UC1 --> AUTH
    UC2 --> AUTH
    UC3 --> AUTH
    UC4 --> AUTH
    UC5 --> AUTH
```

Render: buka [mermaid.live](https://mermaid.live) ➜ paste ➜ export PNG
