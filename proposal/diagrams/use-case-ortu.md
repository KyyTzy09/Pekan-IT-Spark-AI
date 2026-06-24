```mermaid
flowchart LR
    A((Orang Tua)) --> UC1[Hubungkan Akun]
    A --> UC2[Dashboard Perkembangan]
    A --> UC3[Riwayat Aktivitas]
    A --> UC4[Rekomendasi AI]
    A --> UC5[Notifikasi & Alerts]
    A --> UC6[Ganti Anak]

    UC1 --- D1[Input Kode Undangan]

    UC2 --- D2[Statistik Belajar]
    UC2 --- D3[Progress per Mapel]
    UC2 --- D4[Konsep Dikuasai & Kesulitan]

    UC3 --- D5[Filter per Hari]
    UC3 --- D6[Timeline Aktivitas]

    UC4 --- D7[Tips Dukungan Belajar]
    UC4 --- D8[Saran Pendampingan]

    UC5 --- D9[Alert Inaktivitas]
    UC5 --- D10[Alert Kesulitan]
    UC5 --- D11[Reinforcement Positif]
```

Render: buka [mermaid.live](https://mermaid.live) ➜ paste ➜ export PNG
