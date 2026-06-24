```mermaid
flowchart TD
    A[Mulai: Orang tua buka Portal] --> B{Sudah punya akun?}

    B -->|Belum| C[Register dengan kode undangan dari anak]
    C --> D[Buat akun orang tua]
    D --> E[Hubungkan ke akun anak]
    E --> F[Beranda Portal Orang Tua]

    B -->|Sudah| F

    F --> G{Punya lebih dari 1 anak?}
    G -->|Ya| H[Tampilkan selector anak]
    H --> I[Orang tua pilih anak yang ingin dipantau]
    I --> J[Ambil data dashboard anak terpilih]
    G -->|Tidak| J

    J --> K[Ambil statistik: level, XP, streak, progress]
    K --> L[Cek cache rekomendasi AI hari ini]

    L --> M{Cache ada?}
    M -->|Ada| N[Gunakan rekomendasi dari cache]
    M -->|Tidak ada| O[Claim slot generate dengan DB create]
    O --> P[Generate rekomendasi AI via LLM]
    P --> Q[Simpan hasil ke parent_tip_cache]
    Q --> N

    N --> R[Generate alerts: inaktivitas / kesulitan / positif]
    R --> S[Tampilkan dashboard lengkap]
```

Render: buka [mermaid.live](https://mermaid.live) ➜ paste ➜ export PNG
