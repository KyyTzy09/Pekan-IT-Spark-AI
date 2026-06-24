```mermaid
flowchart LR
    A((Admin)) --> UC1[Kelola Kurikulum]
    A --> UC2[Kelola Akun]
    A --> UC3[Lihat Statistik]
    A --> UC4[Atur Daily Challenge]

    UC1 --- D1[CRUD Mapel]
    UC1 --- D2[CRUD Topik & Konsep]
    UC1 --- D3[CRUD Soal]

    UC2 --- D4[CRUD Akun User]
    UC2 --- D5[Reset Password]

    UC3 --- D6[Dashboard Statistik]
    UC3 --- D7[Export Laporan]

    UC4 --- D8[Atur Jadwal]
    UC4 --- D9[Preview & Publish]
```

Render: buka [mermaid.live](https://mermaid.live) ➜ paste ➜ export PNG
