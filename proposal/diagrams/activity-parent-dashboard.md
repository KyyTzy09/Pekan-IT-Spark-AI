```mermaid
flowchart TD
    A[Mulai: Orang tua buka Portal Orang Tua] --> B{Sudah punya akun?}
    
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
    
    J --> K[Ambil statistik: level, XP, streak]
    K --> L[Ambil progress per mata pelajaran]
    L --> M[Ambil data konsep dikuasai & kesulitan]
    M --> N[Cek cache rekomendasi AI hari ini]
    
    N --> O{Cache ada?}
    O -->|Ada| P[Gunakan rekomendasi dari cache]
    O -->|Tidak ada| Q[Claim slot generate dengan DB create]
    
    Q --> R{Berhasil claim?}
    R -->|Ya| S[Generate rekomendasi AI via Groq/LLM]
    S --> T[Simpan hasil ke parent_tip_cache]
    T --> P
    R -->|Gagal — sudah diklaim request lain| U[Wait & poll cache sampai ready]
    U --> P
    
    P --> V[Generate alerts]
    V --> W{Ada inaktivitas >= 2 hari?}
    W -->|Ya| X[Tambah alert: Pengingat Keaktifan]
    W -->|Tidak| Y{Ada konsep struggling?}
    X --> Y
    Y -->|Ya| Z[Tambah alert: Dukungan Belajar Dibutuhkan]
    Y -->|Tidak| AA[Tambah alert: Reinforcement Positif]
    Z --> BB
    AA --> BB
    
    BB[Tampilkan dashboard lengkap]
    BB --> CC{Orang tua pilih menu}
    
    CC -->|Lihat Riwayat| DD[Ambil data aktivitas N hari terakhir]
    DD --> EE[Tampilkan timeline aktivitas]
    EE --> CC
    
    CC -->|Kembali ke Dashboard| BB
```

Render: buka [mermaid.live](https://mermaid.live) ➜ paste ➜ export PNG
