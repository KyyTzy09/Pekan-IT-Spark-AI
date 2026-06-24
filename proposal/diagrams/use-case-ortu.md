@startuml
left to right direction
skinparam actorStyle awesome
skinparam packageStyle rectangle

actor "Orang Tua" as OrtU

rectangle "Sistem Spark Ai" {
    usecase "Hubungkan Akun Anak" as UC1
    usecase "Dashboard Perkembangan" as UC2
    usecase "Riwayat Aktivitas" as UC3
    usecase "Rekomendasi AI" as UC4
    usecase "Notifikasi & Alerts" as UC5
    usecase "Ganti Anak" as UC6

    usecase "Masukkan Kode Undangan" as UC1a
    usecase "Verifikasi Koneksi" as UC1b

    usecase "Lihat Statistik Belajar" as UC2a
    usecase "Lihat Level & XP Anak" as UC2b
    usecase "Lihat Progress per Mapel" as UC2c
    usecase "Lihat Konsep Dikuasai & Kesulitan" as UC2d

    usecase "Filter Berdasarkan Hari" as UC3a
    usecase "Lihat Timeline Aktivitas" as UC3b

    usecase "Lihat Tips Dukungan" as UC4a
    usecase "Lihat Saran Pendampingan" as UC4b

    usecase "Alert Inaktivitas" as UC5a
    usecase "Alert Kesulitan Konsep" as UC5b
    usecase "Reinforcement Positif" as UC5c
}

OrtU --> UC1
OrtU --> UC2
OrtU --> UC3
OrtU --> UC4
OrtU --> UC5
OrtU --> UC6

UC1 ..> UC1a : <<include>>
UC1 ..> UC1b : <<include>>

UC2 ..> UC2a : <<include>>
UC2 ..> UC2b : <<include>>
UC2 ..> UC2c : <<include>>
UC2 ..> UC2d : <<include>>

UC3 ..> UC3a : <<include>>
UC3 ..> UC3b : <<include>>

UC4 ..> UC4a : <<include>>
UC4 ..> UC4b : <<include>>

UC5 ..> UC5a : <<include>>
UC5 ..> UC5b : <<include>>
UC5 ..> UC5c : <<include>>
@enduml

Render: buka https://www.plantuml.com/plantuml/uml/ ➜ paste ➜ export PNG
