```mermaid
flowchart TD
    A[Admin membuka Spark Ai] --> B{Sudah login?}
    B -->|Belum| C[Login / Register]
    C --> D{Verifikasi berhasil?}
    D -->|Gagal| C
    D -->|Berhasil| E[Beranda Admin]
    B -->|Sudah| E

    E --> F{Pilih fitur}

    F -->|Kelola Kurikulum| G[Buka Manajemen Kurikulum]
    G --> G1[Tambah / Edit / Hapus Mata Pelajaran]
    G1 --> G2[Kelola topik & subtopik materi]
    G2 --> G3[Tambah soal & kunci jawaban]
    G3 --> E

    F -->|Verifikasi Mapel Custom| H[Lihat daftar permintaan mapel custom]
    H --> H1{Review & approve?}
    H1 -->|Setujui| H2[Mapel custom aktif untuk siswa]
    H1 -->|Tolak| H3[Kirim alasan penolakan]
    H2 --> E
    H3 --> E

    F -->|Kelola Akun| I[Buka Manajemen Pengguna]
    I --> I1[Lihat daftar akun siswa, orang tua, guru]
    I1 --> I2[Tambah / Edit / Nonaktifkan akun]
    I2 --> I3[Reset password jika diperlukan]
    I3 --> E

    F -->|Lihat Statistik| J[Buka Dashboard Statistik]
    J --> J1[Lihat jumlah pengguna aktif]
    J1 --> J2[Lihat metrik pembelajaran per mapel]
    J2 --> J3[Export laporan]
    J3 --> E

    F -->|Atur Daily Challenge| K[Buka Manajemen Daily Challenge]
    K --> K1[Pilih mapel & tingkat kesulitan]
    K1 --> K2[Atur jadwal rilis soal]
    K2 --> K3[Preview & publish challenge]
    K3 --> E
```

Render: buka [mermaid.live](https://mermaid.live) ➜ paste ➜ export PNG
