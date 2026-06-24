@startuml
left to right direction
skinparam actorStyle awesome
skinparam packageStyle rectangle

actor Admin

rectangle "Sistem Spark Ai" {
    usecase "Kelola Kurikulum" as UC1
    usecase "Kelola Akun" as UC2
    usecase "Lihat Statistik" as UC3
    usecase "Atur Daily Challenge" as UC4

    usecase "CRUD Mata Pelajaran" as UC1a
    usecase "CRUD Topik & Konsep" as UC1b
    usecase "CRUD Soal & Jawaban" as UC1c

    usecase "CRUD Akun User" as UC2a
    usecase "Reset Password" as UC2b

    usecase "Dashboard Statistik" as UC3a
    usecase "Export Laporan" as UC3b

    usecase "Atur Jadwal Challenge" as UC4a
    usecase "Preview & Publish" as UC4b
}

Admin --> UC1
Admin --> UC2
Admin --> UC3
Admin --> UC4

UC1 ..> UC1a : <<include>>
UC1 ..> UC1b : <<include>>
UC1 ..> UC1c : <<include>>

UC2 ..> UC2a : <<include>>
UC2 ..> UC2b : <<extend>>

UC3 ..> UC3a : <<include>>
UC3 ..> UC3b : <<extend>>

UC4 ..> UC4a : <<include>>
UC4 ..> UC4b : <<include>>
@enduml

Render: buka https://www.plantuml.com/plantuml/uml/ ➜ paste ➜ export PNG
