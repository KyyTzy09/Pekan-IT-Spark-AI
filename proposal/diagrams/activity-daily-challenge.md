```mermaid
flowchart TD
    A[Mulai: Siswa buka halaman Daily Challenge] --> B{Challenge hari ini sudah ada?}
    
    B -->|Belum ada| C[Sistem mulai generate challenge]
    B -->|Sudah ada| M[Tampilkan daftar challenge]
    
    C --> D[Acquire DB Lock — cegah double generate]
    D --> E{Lock berhasil?}
    E -->|Gagal| F[Tampilkan pesan: sedang generate, tunggu sebentar]
    F --> B
    E -->|Berhasil| G[Ambil profil siswa & mata pelajaran fokus]
    
    G --> H[Pilih 3-5 mapel secara acak dari focused subjects]
    H --> I[Untuk setiap mapel, generate soal via AI]
    I --> J[AI menghasilkan soal dengan difficulty adaptif]
    J --> K[Simpan soal ke database]
    K --> L[Release DB Lock]
    L --> M
    
    M --> N[Siswa pilih challenge yang ingin dikerjakan]
    N --> O[Tampilkan soal satu per satu]
    O --> P[Siswa memilih jawaban]
    P --> Q{Jawaban benar?}
    
    Q -->|Benar| R[Sistem catat: benar + update mastery]
    Q -->|Salah| S[Sistem catat: salah + tampilkan penjelasan]
    
    R --> T[Hitung XP yang didapat]
    S --> T
    
    T --> U{Ada soal berikutnya?}
    U -->|Ya| O
    U -->|Tidak| V[Tampilkan ringkasan hasil]
    
    V --> W[Update streak belajar]
    W --> X[Update leaderboard]
    X --> Y{Mendapat badge baru?}
    Y -->|Ya| Z[Tampilkan badge baru dengan animasi]
    Y -->|Tidak| AA[Selesai]
    Z --> AA
```

Render: buka [mermaid.live](https://mermaid.live) ➜ paste ➜ export PNG
