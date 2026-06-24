```mermaid
flowchart TD
    A[Siswa buka chat] --> B[Ketik pertanyaan]
    B --> C[Ambil konteks dari knowledge graph]
    C --> D[AI merespon dengan pertanyaan pancingan]

    D --> E{Siswa merespon?}
    E -->|Ya| F[Jawab pertanyaan pancingan]
    F --> G[Update mastery score]
    G --> B

    E -->|Tidak / keluar| H[Sesi selesai]
    H --> I[Simpan riwayat sesi]
```

Render: buka [mermaid.live](https://mermaid.live) ➜ paste ➜ export PNG
