```mermaid
flowchart TD
    A[Mulai: Siswa buka Daily Challenge] --> B{Challenge hari ini sudah ada?}

    B -->|Belum ada| C[Sistem mulai generate challenge]
    B -->|Sudah ada| M[Tampilkan daftar challenge]

    C --> D[Acquire DB Lock — cegah double generate]
    D --> E{Lock berhasil?}
    E -->|Gagal| F[Tampilkan pesan: sedang generate]
    F --> B
    E -->|Berhasil| G[Ambil profil siswa & mapel fokus]

    G --> H[Pilih 3-5 mapel secara acak]
    H --> I[Generate soal via AI dengan difficulty adaptif]
    I --> J[Simpan soal ke database]
    J --> K[Release DB Lock]
    K --> M

    M --> N[Siswa pilih challenge]
    N --> O[Tampilkan soal satu per satu]
    O --> P[Siswa memilih jawaban]
    P --> Q{Jawaban benar?}

    Q -->|Benar| R[Catat benar + update mastery + XP]
    Q -->|Salah| S[Catat salah + tampilkan penjelasan]

    R --> T{Ada soal berikutnya?}
    S --> T

    T -->|Ya| O
    T -->|Tidak| U[Tampilkan ringkasan hasil]
    U --> V[Update streak & leaderboard]
```

Render: buka [mermaid.live](https://mermaid.live) ➜ paste ➜ export PNG
