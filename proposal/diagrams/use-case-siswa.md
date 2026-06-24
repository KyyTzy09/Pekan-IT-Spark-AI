@startuml
left to right direction
skinparam actorStyle awesome
skinparam packageStyle rectangle

actor Siswa

rectangle "Sistem Spark Ai" {
    usecase "Socratic Tutor" as UC1
    usecase "Daily Challenge" as UC2
    usecase "Practice Quiz" as UC3
    usecase "Upload Dokumen" as UC4
    usecase "Lihat Materi" as UC5
    usecase "Lihat Progress" as UC6
    usecase "Leaderboard" as UC7
    usecase "Kelola Mata Pelajaran" as UC8
    usecase "Undang Orang Tua" as UC9

    usecase "Ketik Pertanyaan" as UC1a
    usecase "Jawab Pertanyaan Pancingan" as UC1b
    usecase "Lihat Riwayat Chat" as UC1c

    usecase "Kerjakan Soal Harian" as UC2a
    usecase "Lihat Hasil & Skor" as UC2b
    usecase "Klaim Reward XP" as UC2c

    usecase "Pilih Mata Pelajaran" as UC3a
    usecase "Kerjakan Soal Adaptif" as UC3b

    usecase "Upload PDF/DOCX" as UC4a
    usecase "Sistem Rangkum Dokumen" as UC4b
    usecase "Chat dengan Dokumen" as UC4c

    usecase "Lihat XP & Level" as UC6a
    usecase "Lihat Streak & Badge" as UC6b
    usecase "Lihat Mastery per Topik" as UC6c
}

Siswa --> UC1
Siswa --> UC2
Siswa --> UC3
Siswa --> UC4
Siswa --> UC5
Siswa --> UC6
Siswa --> UC7
Siswa --> UC8
Siswa --> UC9

UC1 ..> UC1a : <<include>>
UC1 ..> UC1b : <<include>>
UC1 ..> UC1c : <<extend>>

UC2 ..> UC2a : <<include>>
UC2 ..> UC2b : <<include>>
UC2 ..> UC2c : <<extend>>

UC3 ..> UC3a : <<include>>
UC3 ..> UC3b : <<include>>

UC4 ..> UC4a : <<include>>
UC4 ..> UC4b : <<include>>
UC4 ..> UC4c : <<extend>>

UC6 ..> UC6a : <<include>>
UC6 ..> UC6b : <<include>>
UC6 ..> UC6c : <<include>>
@enduml

Render: buka https://www.plantuml.com/plantuml/uml/ ➜ paste ➜ export PNG
