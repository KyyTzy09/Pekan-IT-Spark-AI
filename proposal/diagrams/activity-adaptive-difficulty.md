```mermaid
flowchart TD
    A[Siswa menjawab soal] --> B[Catat benar/salah]
    B --> C[Hitung rolling accuracy]
    C --> D{Cek akurasi}

    D -->|>= 70% & attempt >= 5| E[Naik level]
    D -->|3x salah berurutan| F[Turun level]
    D -->|Lainnya| G[Tetap]

    E --> H{Prerequisite >= 60%?}
    F --> H
    G --> H

    H -->|Ya| I[Soal berikutnya]
    H -->|Tidak| J[Soal remedial]
    I --> A
    J --> A
```

Render: buka [mermaid.live](https://mermaid.live) ➜ paste ➜ export PNG
