```mermaid
flowchart TD
    A[Siswa menjawab soal] --> B[Sistem catat benar/salah]
    B --> C[Hitung rolling accuracy: 5 attempt terakhir]
    C --> D{Cek kondisi akurasi}

    D -->|Accuracy >= 70% & attempt >= 5| E[Naikkan level kesulitan]
    D -->|3 jawaban salah berturut-turut| F[Turunkan level kesulitan]
    D -->|Lainnya| G[Level kesulitan tetap]

    E --> H[Cek prerequisite mastery]
    F --> H
    G --> H

    H -->|Prerequisite >= 60%| I[Tampilkan soal berikutnya]
    H -->|Prerequisite belum| J[Tampilkan soal remedial]
    I --> A
    J --> A
```

Render: buka [mermaid.live](https://mermaid.live) ➜ paste ➜ export PNG
