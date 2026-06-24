```mermaid
flowchart TD
    A[Orang tua buka Portal] --> B{Sudah punya akun?}

    B -->|Belum| C[Register dengan kode undangan]
    C --> D[Hubungkan ke akun anak]
    D --> E[Beranda Portal]

    B -->|Sudah| E

    E --> F{Punya > 1 anak?}
    F -->|Ya| G[Pilih anak]
    G --> H[Ambil data dashboard]
    F -->|Tidak| H

    H --> I[Cek cache rekomendasi AI]
    I --> J{Cache ada?}

    J -->|Ada| K[Gunakan dari cache]
    J -->|Tidak| L[Claim slot & generate AI]
    L --> K

    K --> M[Generate alerts]
    M --> N[Tampilkan dashboard lengkap]
```

Render: buka [mermaid.live](https://mermaid.live) ➜ paste ➜ export PNG
