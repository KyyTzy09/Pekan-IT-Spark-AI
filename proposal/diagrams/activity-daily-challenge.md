```mermaid
flowchart TD
    A[Siswa buka Daily Challenge] --> B{Challenge sudah ada?}

    B -->|Belum| C[Acquire DB Lock]
    C --> D{Lock berhasil?}
    D -->|Gagal| E[Tunggu & retry]
    E --> B
    D -->|Berhasil| F[Generate soal via AI]
    F --> G[Simpan ke database]
    G --> H[Release Lock]
    H --> I[Tampilkan challenge]

    B -->|Sudah| I

    I --> J[Siswa kerjakan soal]
    J --> K{Jawaban benar?}
    K -->|Ya| L[+ XP & update mastery]
    K -->|Tidak| M[Tampilkan penjelasan]
    L --> N{Ada soal berikutnya?}
    M --> N

    N -->|Ya| J
    N -->|Tidak| O[Ringkasan hasil]
    O --> P[Update streak & leaderboard]
```

Render: buka [mermaid.live](https://mermaid.live) ➜ paste ➜ export PNG
