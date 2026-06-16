import { embedMany } from "ai";
import bcrypt from "bcryptjs";
import { embeddingModel } from "../src/lib/ai";
import { prisma } from "../src/lib/prisma";

const CONCEPTS_BY_SUBJECT: Record<
  string,
  { topicSlug: string; name: string; description: string; contentMd: string }[]
> = {
  MATEMATIKA: [
    {
      topicSlug: "aljabar",
      name: "Persamaan Linear",
      description: "Persamaan linear satu dan dua variabel",
      contentMd:
        "Persamaan linear adalah persamaan dengan pangkat tertinggi variabel adalah 1. Bentuk umum: ax + b = 0.",
    },
    {
      topicSlug: "aljabar",
      name: "Fungsi Kuadrat",
      description: "Fungsi dengan pangkat tertinggi 2",
      contentMd:
        "Fungsi kuadrat berbentuk f(x) = ax² + bx + c. Grafiknya berupa parabola.",
    },
    {
      topicSlug: "aljabar",
      name: "Sistem Persamaan",
      description: "SPLDV dan SPLTV",
      contentMd:
        "Sistem persamaan linear dapat diselesaikan dengan substitusi, eliminasi, atau matriks.",
    },
    {
      topicSlug: "geometri",
      name: "Teorema Pythagoras",
      description: "Hubungan sisi segitiga siku-siku",
      contentMd:
        "a² + b² = c², dimana c adalah sisi miring segitiga siku-siku.",
    },
    {
      topicSlug: "geometri",
      name: "Kesebangunan",
      description: "Dua bangun sebangun",
      contentMd:
        "Dua bangun datar sebangun jika sudut-sudut bersesuaian sama besar dan sisi bersesuaian sebanding.",
    },
    {
      topicSlug: "geometri",
      name: "Transformasi Geometri",
      description: "Translasi, refleksi, rotasi, dilatasi",
      contentMd:
        "Transformasi geometri memetakan suatu titik/bangun ke posisi lain.",
    },
    {
      topicSlug: "trigonometri",
      name: "Rasio Trigonometri",
      description: "Sinus, cosinus, tangen",
      contentMd:
        "sin θ = depan/miring, cos θ = samping/miring, tan θ = depan/samping.",
    },
    {
      topicSlug: "trigonometri",
      name: "Identitas Trigonometri",
      description: "Rumus-rumus identitas",
      contentMd: "sin²θ + cos²θ = 1. Identitas trigonometri dasar.",
    },
    {
      topicSlug: "kalkulus",
      name: "Limit Fungsi",
      description: "Konsep limit dalam kalkulus",
      contentMd:
        "Limit adalah nilai pendekatan suatu fungsi saat variabel mendekati nilai tertentu.",
    },
    {
      topicSlug: "kalkulus",
      name: "Turunan",
      description: "Diferensiasi fungsi",
      contentMd:
        "Turunan mengukur laju perubahan sesaat suatu fungsi. f'(x) = limit h→0 (f(x+h)-f(x))/h.",
    },
    {
      topicSlug: "statistika",
      name: "Ukuran Pemusatan",
      description: "Mean, median, modus",
      contentMd:
        "Mean adalah rata-rata, median adalah nilai tengah, modus adalah nilai paling sering muncul.",
    },
    {
      topicSlug: "statistika",
      name: "Peluang",
      description: "Probabilitas kejadian",
      contentMd:
        "Peluang = jumlah kejadian yang diinginkan / jumlah seluruh kemungkinan.",
    },
  ],
  BAHASA_INDONESIA: [
    {
      topicSlug: "tata-bahasa",
      name: "Kalimat Efektif",
      description: "Kalimat yang jelas dan mudah dipahami",
      contentMd:
        "Kalimat efektif memiliki struktur yang jelas, hemat kata, dan mudah dipahami pembaca.",
    },
    {
      topicSlug: "tata-bahasa",
      name: "Kata Baku",
      description: "Kata sesuai KBBI",
      contentMd:
        "Kata baku adalah kata yang penulisannya sesuai dengan kaidah KBBI dan EYD.",
    },
    {
      topicSlug: "tata-bahasa",
      name: "Konjungsi",
      description: "Kata hubung dalam kalimat",
      contentMd:
        "Konjungsi menghubungkan kata, frasa, atau klausa. Contoh: dan, atau, tetapi, karena.",
    },
    {
      topicSlug: "sastra",
      name: "Majas",
      description: "Gaya bahasa dalam karya sastra",
      contentMd:
        "Majas adalah gaya bahasa untuk menimbulkan efek estetis. Contoh: metafora, personifikasi, hiperbola.",
    },
    {
      topicSlug: "sastra",
      name: "Puisi",
      description: "Karya sastra dengan diksi padat",
      contentMd:
        "Puisi adalah karya sastra yang mengutamakan keindahan diksi, rima, dan irama.",
    },
    {
      topicSlug: "sastra",
      name: "Prosa",
      description: "Karya sastra naratif",
      contentMd:
        "Prosa adalah karya sastra berbentuk cerita yang disusun dalam paragraf. Contoh: novel, cerpen.",
    },
    {
      topicSlug: "menulis",
      name: "Paragraf Argumentasi",
      description: "Paragraf berisi argumen",
      contentMd:
        "Paragraf argumentasi bertujuan meyakinkan pembaca dengan disertai bukti dan alasan logis.",
    },
    {
      topicSlug: "menulis",
      name: "Surat Resmi",
      description: "Penulisan surat formal",
      contentMd:
        "Surat resmi menggunakan bahasa baku, format tertentu, dan tujuan formal.",
    },
    {
      topicSlug: "membaca",
      name: "Ide Pokok",
      description: "Gagasan utama paragraf",
      contentMd:
        "Ide pokok adalah gagasan utama yang mendasari sebuah paragraf.",
    },
    {
      topicSlug: "membaca",
      name: "Kesimpulan",
      description: "Simpulan dari teks",
      contentMd:
        "Kesimpulan adalah intisari yang ditarik dari keseluruhan isi teks.",
    },
  ],
  BAHASA_INGGRIS: [
    {
      topicSlug: "grammar",
      name: "Tenses",
      description: "Verb tenses",
      contentMd:
        "Tenses menunjukkan waktu kejadian: present, past, future. Masing-masing memiliki 4 aspek: simple, continuous, perfect, perfect continuous.",
    },
    {
      topicSlug: "grammar",
      name: "Passive Voice",
      description: "Kalimat pasif",
      contentMd:
        "Passive voice: be + past participle. Digunakan saat subjek dikenai tindakan.",
    },
    {
      topicSlug: "grammar",
      name: "Conditional Sentences",
      description: "If-clause sentences",
      contentMd:
        "Conditional sentences: Type 0 (general truth), Type 1 (possible), Type 2 (unlikely), Type 3 (impossible past).",
    },
    {
      topicSlug: "grammar",
      name: "Reported Speech",
      description: "Mengubah kalimat langsung ke tidak langsung",
      contentMd: "Reported speech mengubah tense, pronoun, dan time reference.",
    },
    {
      topicSlug: "vocabulary",
      name: "Synonyms & Antonyms",
      description: "Persamaan dan lawan kata",
      contentMd:
        "Synonyms: kata dengan makna mirip. Antonyms: kata dengan makna berlawanan.",
    },
    {
      topicSlug: "vocabulary",
      name: "Phrasal Verbs",
      description: "Verb + preposition/adverb",
      contentMd:
        "Phrasal verbs: give up, look after, run out of, put off. Maknanya berbeda dari kata dasarnya.",
    },
    {
      topicSlug: "reading",
      name: "Main Idea",
      description: "Finding main idea in a text",
      contentMd:
        "Main idea is the central point the author wants to convey. Usually found in the first or last sentence.",
    },
    {
      topicSlug: "reading",
      name: "Inference",
      description: "Drawing conclusions",
      contentMd:
        "Inference is a logical conclusion based on evidence in the text.",
    },
    {
      topicSlug: "writing",
      name: "Essay Structure",
      description: "Organization of an essay",
      contentMd:
        "Essay has: introduction (thesis), body paragraphs (arguments/examples), conclusion (restatement).",
    },
    {
      topicSlug: "writing",
      name: "Topic Sentence",
      description: "Kalimat topik paragraf",
      contentMd:
        "Topic sentence states the main idea of a paragraph. Usually at the beginning.",
    },
  ],
  IPA: [
    {
      topicSlug: "fisika",
      name: "Hukum Newton",
      description: "Tiga hukum gerak Newton",
      contentMd: "Hk I: ΣF=0 benda diam/GLB. Hk II: F=ma. Hk III: Aksi=Reaksi.",
    },
    {
      topicSlug: "fisika",
      name: "Listrik Dinamis",
      description: "Arus, tegangan, hambatan",
      contentMd:
        "Hukum Ohm: V=IR. Hambatan seri: Rs=R1+R2. Paralel: 1/Rp=1/R1+1/R2.",
    },
    {
      topicSlug: "fisika",
      name: "Termodinamika",
      description: "Hukum-hukum termodinamika",
      contentMd:
        "Hk I: ΔU=Q-W. Hk II: entropi selalu meningkat. Hk III: entropi mendekati nol pada 0K.",
    },
    {
      topicSlug: "fisika",
      name: "Gelombang",
      description: "Sifat-sifat gelombang",
      contentMd:
        "Gelombang: frekuensi (f), panjang gelombang (λ), cepat rambat (v=λf). Gelombang mekanik dan elektromagnetik.",
    },
    {
      topicSlug: "kimia",
      name: "Larutan Asam Basa",
      description: "Konsep asam-basa",
      contentMd:
        "Asam: pH<7, melepas H⁺. Basa: pH>7, melepas OH⁻. Indikator: lakmus, universal.",
    },
    {
      topicSlug: "kimia",
      name: "Stoikiometri",
      description: "Perhitungan kimia",
      contentMd:
        "Mol = massa/Mr. Pereaksi pembatas menentukan jumlah produk. Hukum kekekalan massa.",
    },
    {
      topicSlug: "kimia",
      name: "Reaksi Redoks",
      description: "Reaksi oksidasi-reduksi",
      contentMd:
        "Oksidasi: lepas elektron. Reduksi: terima elektron. Biloks: bilangan oksidasi.",
    },
    {
      topicSlug: "kimia",
      name: "Ikatan Kimia",
      description: "Ikatan ion, kovalen, logam",
      contentMd:
        "Ikatan ion: serah terima elektron. Kovalen: pemakaian bersama elektron. Logam: lautan elektron.",
    },
    {
      topicSlug: "biologi",
      name: "Fotosintesis",
      description: "Proses pembuatan makanan tumbuhan",
      contentMd:
        "6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂. Terjadi di kloroplas, membutuhkan cahaya matahari.",
    },
    {
      topicSlug: "biologi",
      name: "Sistem Peredaran Darah",
      description: "Jantung, pembuluh darah, darah",
      contentMd:
        "Jantung: 4 ruang (serambi kanan/kiri, bilik kanan/kiri). Peredaran darah besar dan kecil.",
    },
    {
      topicSlug: "biologi",
      name: "DNA dan RNA",
      description: "Materi genetik",
      contentMd:
        "DNA: double helix, nukleotida (A,T,G,C). RNA: single strand (A,U,G,C). Transkripsi dan translasi.",
    },
    {
      topicSlug: "biologi",
      name: "Evolusi",
      description: "Teori evolusi Darwin",
      contentMd:
        "Seleksi alam: organisme dengan sifat adaptif lebih mungkin bertahan hidup dan bereproduksi.",
    },
  ],
  SEJARAH: [
    {
      topicSlug: "indonesia-purba",
      name: "Manusia Purba",
      description: "Jenis-jenis manusia purba di Indonesia",
      contentMd:
        "Meganthropus paleojavanicus, Pithecanthropus erectus (Homo erectus), Homo sapiens. Ditemukan oleh Eugene Dubois di Trinil (1891).",
    },
    {
      topicSlug: "indonesia-purba",
      name: "Periode Neolithicum",
      description: "Zaman batu baru",
      contentMd:
        "Masa bercocok tanam, tinggal di rumah sederhana, gerabah, kapak persegi (Sumatra) dan kapak lonjong (Sulawesi).",
    },
    {
      topicSlug: "indonesia-purba",
      name: "Peradaban Awal Nusantara",
      description: "Kerajaan kuno sebelum Hindu-Buddha",
      contentMd:
        "Kerajaan Kutai (Tarumanagara, Kalimantan), Kerajaan Tarumanagara (Jawa Barat 4-5 M). Dipengaruhi India melalui perdagangan.",
    },
    {
      topicSlug: "hindu-buddha-islam",
      name: "Kerajaan Hindu-Buddha",
      description: "Kutai, Tarumanagara, Sriwijaya, Majapahit",
      contentMd:
        "Sriwijaya (Palembang) pusat Buddha & perdagangan. Majapahit (1293-1527) puncak kejayaan Hindu di Jawa Timur.",
    },
    {
      topicSlug: "hindu-buddha-islam",
      name: "Masuknya Islam ke Indonesia",
      description: "Perdagangan Gujarat & walisongo",
      contentMd:
        "Masuk abad 13 M melalui pedagang Gujarat & Persia. Disiarkan walisongo di Jawa. Kerajaan Islam: Demak, Mataram, Banten.",
    },
    {
      topicSlug: "hindu-buddha-islam",
      name: "Kerajaan Islam Nusantara",
      description: "Demak, Mataram, Banten, Makassar",
      contentMd:
        "Demak (1478-1554) kerajaan Islam pertama di Jawa. Sultan Trenggana menyebarkan Islam ke Sumatra, Kalimantan, Sulawesi.",
    },
    {
      topicSlug: "kolonialisme-kemerdekaan",
      name: "Kedatangan Portugis",
      description: "Malaka 1511, Malaka jatuh",
      contentMd:
        "1511 Portugis menguasai Malaka, awal kolonialisme Eropa di Nusantara. Tujuan: rempah, kristenisasi, monopoli dagang.",
    },
    {
      topicSlug: "kolonialisme-kemerdekaan",
      name: "VOC dan Tanam Paksa",
      description: "Verenigde Oostindische Compagnie",
      contentMd:
        "VOC berdiri 1602, bubar 1799. Cultuurstelsel (1830-1870) tanam paksa kopi, tebu, nila—mengeksploitasi petani Jawa.",
    },
    {
      topicSlug: "kolonialisme-kemerdekaan",
      name: "Perlawanan Rakyat",
      description: "Diponegoro, Imam Bonjol, Cut Nyak Dien",
      contentMd:
        "Perang Diponegoro (1825-1830), Perang Padri (1821-1837), Perang Aceh (1873-1914). Patriot melawan kolonialisme.",
    },
    {
      topicSlug: "kolonialisme-kemerdekaan",
      name: "Kebangkitan Nasional",
      description: "Budi Utomo, Sumpah Pemuda",
      contentMd:
        "Budi Utomo (1908) organisasi modern pertama. Sumpah Pemuda 28 Oktober 1928: satu nusa, satu bangsa, satu bahasa.",
    },
    {
      topicSlug: "kolonialisme-kemerdekaan",
      name: "Proklamasi Kemerdekaan",
      description: "17 Agustus 1945, pembacaan teks",
      contentMd:
        "Golongan muda (Sukarni, Chaerul Saleh) proklamasi 17 Agustus 1945 di Jalan Pegangsaan 56. Soekarno-Hatta atas nama bangsa.",
    },
    {
      topicSlug: "kolonialisme-kemerdekaan",
      name: "Masa Revolusi",
      description: "Agresi Militer Belanda I & II",
      contentMd:
        "1946-1949 Belanda coba kembali. Perjanjian Linggarjati 1947. Agresi Militer II 1948, Yogyakarta jatuh. Diplomatik & militer.",
    },
    {
      topicSlug: "orde-baru-reformasi",
      name: "Demokrasi Terpimpin",
      description: "1959-1966, demokrasi parlementer berakhir",
      contentMd:
        "1959 Soekarno kembali ke UUD 1945, demokrasi liberal diganti demokrasi terpimpin. Konfrontasi dengan Malaysia, keluar dari PBB.",
    },
    {
      topicSlug: "orde-baru-reformasi",
      name: "Orde Baru",
      description: "1966-1998, Soeharto",
      contentMd:
        "Soeharto naik 1966, Orde Baru fokus stabilitas politik & pertumbuhan ekonomi. Pembangunan jangka panjang (PELITA).",
    },
    {
      topicSlug: "orde-baru-reformasi",
      name: "Krisis 1998",
      description: "Kerusuhan Mei, Reformasi",
      contentMd:
        "Krisis moneter 1997, IMF bailout. 12-15 Mei 1998 kerusuhan Jakarta, Soeharto mundur 21 Mei. Awal era Reformasi.",
    },
    {
      topicSlug: "orde-baru-reformasi",
      name: "Era Reformasi",
      description: "Demokratisasi, otonomi daerah",
      contentMd:
        "Amandemen UUD 1945 (1999-2002). Pemilihan presiden langsung 2004. Otonomi daerah 2001. Kebebasan pers & multipartai.",
    },
    {
      topicSlug: "indonesia-purba",
      name: "Teori Masuknya Hindu",
      description: "Teori Brahmana, Ksatria, Waisya, Arus Balik",
      contentMd:
        "Brahmana: pendeta India. Ksatria: kaum bangsawan/pejabat. Waisya: pedagang. Arus Balik: orang Indonesia yang belajar ke India lalu kembali.",
    },
    {
      topicSlug: "hindu-buddha-islam",
      name: "Pengaruh Hindu-Buddha",
      description: "Warisan budaya",
      contentMd:
        "Pengaruh: candi (Borobudur, Prambanan), aksara Pallawa, sistem kasta, seni tari & wayang. Toleransi agama tetap dijaga.",
    },
    {
      topicSlug: "kolonialisme-kemerdekaan",
      name: "Sumpah Pemuda",
      description: "28 Oktober 1928",
      contentMd:
        "Sumpah Pemuda 28 Oktober 1928: satu nusa, satu bangsa, satu bahasa (Indonesia). Disusun dalam Kongres Pemuda II di Jakarta.",
    },
    {
      topicSlug: "kolonialisme-kemerdekaan",
      name: "Pendudukan Jepang",
      description: "1942-1945, Jepang di Indonesia",
      contentMd:
        "Jepang menduduki Indonesia 1942-1945. Romusha (kerja paksa), BPUPKI/PPKI. Jepang kalah, Soekarno-Hatta proklamasi kemerdekaan.",
    },
    {
      topicSlug: "orde-baru-reformasi",
      name: "Tokoh Nasional",
      description: "Soekarno, Hatta, dll",
      contentMd:
        "Soekarno: proklamator, presiden pertama. Hatta: wakil presiden, ekonom. Soeharto: presiden Orde Baru. BJ Habibie: reformasi awal.",
    },
  ],
  GEOGRAFI: [
    {
      topicSlug: "geografi-fisik",
      name: "Lempeng Tektonik",
      description: "Lempeng bumi dan pergerakan",
      contentMd:
        "7 lempeng utama: Pasifik, Eurasia, Indo-Australia, Afrika, Amerika Selatan, Amerika Utara, Antartika. Batas: divergen, konvergen, transform.",
    },
    {
      topicSlug: "geografi-fisik",
      name: "Gempa Bumi",
      description: "Penyebab, jenis, skala Richter",
      contentMd:
        "Disebabkan pelepasan energi tiba-tiba dari pergerakan lempeng. Skala Richter mengukur magnitudo. Indonesia di Cincin Api Pasifik.",
    },
    {
      topicSlug: "geografi-fisik",
      name: "Vulkanisme",
      description: "Gunung api dan jenisnya",
      contentMd:
        "Gunung api terbentuk di zona subduksi. Tipe: strato (kerucut), perisai, maar. Indonesia: 130 gunung api aktif.",
    },
    {
      topicSlug: "geografi-fisik",
      name: "Iklim dan Cuaca",
      description: "Unsur-unsur iklim",
      contentMd:
        "Suhu, tekanan, angin, kelembapan, curah hujan. Faktor: lintang, ketinggian, jarak dari laut, arus laut.",
    },
    {
      topicSlug: "geografi-fisik",
      name: "Angin Monsun",
      description: "Monsun Asia & Australia",
      contentMd:
        "Monsun barat (Desember-Maret) membawa hujan. Monsun timur (Juni-September) kering. Sebab: perbedaan tekanan benua & lautan.",
    },
    {
      topicSlug: "geografi-fisik",
      name: "Hidrosfer",
      description: "Siklus air dan distribusi",
      contentMd:
        "97% air asin (laut), 2% es, 0,6% air tawar. Siklus: evaporasi, transpirasi, kondensasi, presipitasi, run-off, infiltrasi.",
    },
    {
      topicSlug: "geografi-manusia",
      name: "Pertumbuhan Penduduk",
      description: "Kelahiran, kematian, migrasi",
      contentMd:
        "Pertumbuhan alami = lahir - mati. Pertumbuhan total = alami + migrasi. Indonesia: TFR 2,18 (2020), pertumbuhan 1,1%/tahun.",
    },
    {
      topicSlug: "geografi-manusia",
      name: "Piramida Penduduk",
      description: "Struktur umur penduduk",
      contentMd:
        "Tiga bentuk: expansive (muda, banyak anak), constrictive (menua), stationary (stabil). Indonesia: expansive, bonus demografi 2020-2035.",
    },
    {
      topicSlug: "geografi-manusia",
      name: "Urbanisasi",
      description: "Pergerakan desa ke kota",
      contentMd:
        "Penarik: lapangan kerja, pendidikan, fasilitas. Pendorong: kemiskinan, lapangan kerja sempit. Masalah: slum, polusi, kriminalitas.",
    },
    {
      topicSlug: "geografi-manusia",
      name: "Pola Permukiman",
      description: "Memanjang, memusat, tersebar",
      contentMd:
        "Memanjang (linier) di sungai/pesisir. Memusat di dataran. Tersebar di pedesaan. Cluster: mengelompok karena faktor alam/sosial.",
    },
    {
      topicSlug: "geografi-regional",
      name: "Kondisi Geografis Indonesia",
      description: "Lokasi astronomis & geografis",
      contentMd:
        "95°BT-141°BT, 6°LU-11°LS. Diapit dua benua (Asia, Australia) dan dua samudra (Hindia, Pasifik). Iklim tropis.",
    },
    {
      topicSlug: "geografi-regional",
      name: "Karakteristik Pulau Besar",
      description: "Sumatra, Jawa, Kalimantan, Sulawesi, Papua",
      contentMd:
        "Sumatra: pegunungan Bukit Barisan. Jawa: padat penduduk, vulkanik. Kalimantan: hutan tropis. Papua: pegunungan Jaya Wijaya.",
    },
    {
      topicSlug: "geografi-regional",
      name: "Iklim Indonesia",
      description: "Tropical rainforest climate",
      contentMd:
        "Curah hujan 1500-3000 mm/tahun. Suhu rata-rata 26-28°C. Kelembapan tinggi 70-90%. Dua musim: hujan & kemarau.",
    },
    {
      topicSlug: "lingkungan-sda",
      name: "Sumber Daya Alam",
      description: "Hayati & non-hayati",
      contentMd:
        "SDA hayati: hutan, ikan, pertanian. Non-hayati: minerba, minyak bumi, gas. SDA dapat diperbarui atau tidak dapat diperbarui.",
    },
    {
      topicSlug: "lingkungan-sda",
      name: "Pemanasan Global",
      description: "Efek rumah kaca",
      contentMd:
        "CO₂, metana, N₂O menyerap radiasi inframerah → suhu naik. Indonesia: 1.5°C lebih panas dari 1900-an. Deforestasi kontribusi besar.",
    },
    {
      topicSlug: "lingkungan-sda",
      name: "Pencemaran Lingkungan",
      description: "Air, udara, tanah",
      contentMd:
        "Pencemaran air: BOD, COD tinggi. Udara: PM2.5, emisi kendaraan. Tanah: pestisida, sampah plastik. Solusi: 3R (reduce, reuse, recycle).",
    },
    {
      topicSlug: "lingkungan-sda",
      name: "Pelestarian Lingkungan",
      description: "Konservasi & pembangunan berkelanjutan",
      contentMd:
        "Taman nasional, cagar alam, suuka margasatwa. SDGs poin 13 & 14: aksi iklim & ekosistem. Pembangunan berkelanjutan (sustainability).",
    },
    {
      topicSlug: "geografi-fisik",
      name: "Tsunami",
      description: "Gelombang laut dahsyat",
      contentMd:
        "Tsunami: gelombang besar akibat gempa bawah laut, letusan gunung api, atau longsoran. Aceh 2004: 230.000 korban jiwa.",
    },
    {
      topicSlug: "geografi-manusia",
      name: "Kualitas Penduduk",
      description: "Indeks Pembangunan Manusia",
      contentMd:
        "IPM: angka harapan hidup, pendidikan (lama sekolah & harapan lama sekolah), pendapatan per kapita. Indonesia IPM sedang.",
    },
    {
      topicSlug: "lingkungan-sda",
      name: "Energi Terbarukan",
      description: "Solar, angin, air",
      contentMd:
        "Energi terbarukan: matahari (PLTS), angin (PLTB), air (PLTA), panas bumi (geothermal). Indonesia potensi geothermal terbesar dunia.",
    },
    {
      topicSlug: "lingkungan-sda",
      name: "Bencana Alam Indonesia",
      description: "Gempa, tsunami, banjir, gunung api",
      contentMd:
        "Indonesia rawan bencana: gempa (Lempeng Pasifik), tsunami, banjir (Jakarta), longsor, gunung meletus. Mitigasi & kesiapsiagaan penting.",
    },
    {
      topicSlug: "geografi-regional",
      name: "ASEAN",
      description: "Kerjasama Asia Tenggara",
      contentMd:
        "ASEAN 1967, 10 negara anggota. Indonesia pendiri. Tujuan: stabilitas regional, pertumbuhan ekonomi. Markas: Jakarta.",
    },
  ],
  EKONOMI: [
    {
      topicSlug: "konsep-dasar",
      name: "Kebutuhan Manusia",
      description: "Primer, sekunder, tersier",
      contentMd:
        "Kebutuhan primer: sandang, pangan, papan. Sekunder: pendidikan, kesehatan. Tersier: hiburan, kemewahan. Tidak terbatas vs alat pemuas terbatas.",
    },
    {
      topicSlug: "konsep-dasar",
      name: "Kelangkaan",
      description: "Inti masalah ekonomi",
      contentMd:
        "Kelangkaan = alat pemuas kebutuhan terbatas vs kebutuhan tidak terbatas. Memicu pilihan & biaya peluang (opportunity cost).",
    },
    {
      topicSlug: "konsep-dasar",
      name: "Sistem Ekonomi",
      description: "Tradisional, komando, pasar, campuran",
      contentMd:
        "Tradisional: kebiasaan, subsisten. Komando: negara pusat. Pasar: mekanisme harga. Campuran: kombinasi. Indonesia: campuran.",
    },
    {
      topicSlug: "konsep-dasar",
      name: "Pelaku Ekonomi",
      description: "Rumah tangga, perusahaan, pemerintah, luar negeri",
      contentMd:
        "Rumah tangga: konsumen & pemilik faktor produksi. Perusahaan: produsen. Pemerintah: regulator. Luar negeri: ekspor-impor.",
    },
    {
      topicSlug: "ekonomi-mikro",
      name: "Permintaan",
      description: "Hukum permintaan & kurva",
      contentMd:
        "Hukum permintaan: harga ↑ → jumlah diminta ↓ (ceteris paribus). Kurva permintaan slope negatif. Faktor: harga, pendapatan, selera.",
    },
    {
      topicSlug: "ekonomi-mikro",
      name: "Penawaran",
      description: "Hukum penawaran & kurva",
      contentMd:
        "Hukum penawaran: harga ↑ → jumlah ditawarkan ↑. Kurva penawaran slope positif. Faktor: biaya produksi, teknologi, ekspektasi.",
    },
    {
      topicSlug: "ekonomi-mikro",
      name: "Keseimbangan Pasar",
      description: "Titik equilibrium",
      contentMd:
        "Terjadi saat Qd = Qs. Harga keseimbangan: kurva permintaan & penawaran berpotongan. Excess demand saat harga di bawah.",
    },
    {
      topicSlug: "ekonomi-mikro",
      name: "Elastisitas",
      description: "Sensitivitas permintaan",
      contentMd:
        "Elastisitas permintaan: %ΔQd / %ΔP. Inelastik: |E| < 1, elastis: |E| > 1, unitary: |E| = 1. Faktor: kebutuhan pokok/mewah.",
    },
    {
      topicSlug: "ekonomi-mikro",
      name: "Biaya Produksi",
      description: "Tetap, variabel, total",
      contentMd:
        "Biaya tetap (FC): sewa, gaji. Variabel (VC): bahan baku. Total (TC) = FC + VC. Average: AFC, AVC, ATC. Marginal: MC.",
    },
    {
      topicSlug: "ekonomi-mikro",
      name: "Pasar Persaingan",
      description: "Sempurna & tidak sempurna",
      contentMd:
        "Sempurna: banyak penjual, barang homogen, bebas keluar-masuk. Tidak sempurna: monopoli, oligopoli, monopolistik. Indonesia: monopolistik.",
    },
    {
      topicSlug: "ekonomi-makro",
      name: "Produk Domestik Bruto",
      description: "PDB & perhitungan",
      contentMd:
        "PDB = total nilai barang/jasa diproduksi dalam negeri dalam 1 tahun. Pendekatan: produksi, pengeluaran, pendapatan. PDB per kapita = PDB/penduduk.",
    },
    {
      topicSlug: "ekonomi-makro",
      name: "Inflasi",
      description: "Naiknya harga barang umum",
      contentMd:
        "Inflasi = kenaikan harga umum持续. IHK (Indeks Harga Konsumen) mengukur. Hiperinflasi >100%/tahun. Indonesia moderat 2-4%.",
    },
    {
      topicSlug: "ekonomi-makro",
      name: "Pengangguran",
      description: "Jenis pengangguran",
      contentMd:
        "Tertutup: tidak kerja tapi cari kerja. Terbuka: tidak kerja tidak cari. Friksional: transisi. Struktural: skill tidak sesuai. Siklikal: resesi.",
    },
    {
      topicSlug: "ekonomi-makro",
      name: "Kebijakan Fiskal",
      description: "APBN, pajak, belanja negara",
      contentMd:
        "Fiskal: pemerintah ubah pajak & belanja. Ekspansif: turun pajak, naik belanja. Kontraktif: sebaliknya. Defisit anggaran ditutup utang.",
    },
    {
      topicSlug: "ekonomi-makro",
      name: "Kebijakan Moneter",
      description: "BI rate, giro, ORI",
      contentMd:
        "Bank Indonesia atur uang beredar. Naikkan BI rate → uang ketat → inflasi turun. Turunkan → stimulus. OMO, GWM, Operasi Pasar Terbuka.",
    },
    {
      topicSlug: "keuangan-pasar-modal",
      name: "Bank & Lembaga Keuangan",
      description: "Bank sentral, komersial, BPR",
      contentMd:
        "Bank Indonesia: bank sentral. Bank umum: komersial, BPR, syariah. Fungsi: penghimpun & penyalur dana. OJK: pengawas jasa keuangan.",
    },
    {
      topicSlug: "keuangan-pasar-modal",
      name: "Otoritas Jasa Keuangan",
      description: "OJK & tugas",
      contentMd:
        "OJK berdiri 2011, tugas: pengaturan & pengawasan bank, pasar modal, IKNB. Lindungi konsumen, jaga stabilitas sistem keuangan.",
    },
    {
      topicSlug: "keuangan-pasar-modal",
      name: "Investasi & Saham",
      description: "Instrumen pasar modal",
      contentMd:
        "Saham: bukti kepemilikan perusahaan. Obligasi: surat utang. Reksadana: kumpulan dana kelola manajer investasi. Risiko vs return berbanding lurus.",
    },
    {
      topicSlug: "keuangan-pasar-modal",
      name: "Perdagangan Internasional",
      description: "Ekspor, impor, kurs",
      contentMd:
        "Ekspor: jual ke LN. Impor: beli dari LN. Neraca perdagangan: ekspor-impor. Surplus = untung, defisit = rugi. Kurs: harga valuta asing.",
    },
    {
      topicSlug: "ekonomi-mikro",
      name: "Struktur Pasar",
      description: "Monopoli, oligopoli, dll",
      contentMd:
        "Monopoli: 1 penjual (contoh: PLN). Oligopoli: sedikit penjual (contoh: telko). Monopolistik: banyak penjual produk beda. Persaingan sempurna: banyak & homogen.",
    },
    {
      topicSlug: "ekonomi-makro",
      name: "Kemiskinan",
      description: "Indikator & solusi",
      contentMd:
        "Kemiskinan: ketidakmampuan penuhi kebutuhan dasar. Garis kemiskinan BPS. Solusi: pendidikan, lapangan kerja, bantuan sosial.",
    },
    {
      topicSlug: "ekonomi-makro",
      name: "Ketenagakerjaan",
      description: "Upah, hubungan industrial",
      contentMd:
        "Upah minimum (UMR/UMK). Hubungan industrial: pekerja, pengusaha, pemerintah. Serikat pekerja lindungi hak buruh.",
    },
  ],
  SOSIOLOGI: [
    {
      topicSlug: "individu-kelompok",
      name: "Sosiologi sebagai Ilmu",
      description: "Pengertian, objek, metode",
      contentMd:
        "Sosiologi = ilmu tentang masyarakat. Objek: gejala sosial, fakta sosial (Durkheim). Metode: kualitatif, kuantitatif, studi kasus.",
    },
    {
      topicSlug: "individu-kelompok",
      name: "Interaksi Sosial",
      description: "Syarat & bentuk interaksi",
      contentMd:
        "Syarat: kontak sosial & komunikasi. Bentuk: individu-individu, individu-kelompok, kelompok-kelompok. Asosiatif & disasosiatif.",
    },
    {
      topicSlug: "individu-kelompok",
      name: "Proses Sosial Asosiatif",
      description: "Kerja sama, akomodasi, asimilasi",
      contentMd:
        "Kerja sama: gotong royong, koalisi. Akomodasi: mediasi, arbitrasi, kompromi. Asimilasi: peleburan budaya. Akulturasi: pinjam unsur.",
    },
    {
      topicSlug: "individu-kelompok",
      name: "Proses Sosial Disasosiatif",
      description: "Persaingan, kontravensi, konflik",
      contentMd:
        "Persaingan: berebut sesuatu. Kontravensi: hambatan, provokasi. Konflik: pertentangan terbuka. Bisa positif (membangun) atau negatif.",
    },
    {
      topicSlug: "individu-kelompok",
      name: "Lembaga Sosial",
      description: "Fungsi, ciri, jenis",
      contentMd:
        "Lembaga sosial: norma & nilai untuk memenuhi kebutuhan. Ciri: simbol, tradisi, memiliki tujuan. Jenis: keluarga, pendidikan, agama, ekonomi.",
    },
    {
      topicSlug: "stratifikasi-mobilitas",
      name: "Stratifikasi Sosial",
      description: "Penggolongan masyarakat",
      contentMd:
        "Stratifikasi: perbedaan kedudukan. Dasar: ekonomi, kekuasaan, kehormatan, pendidikan. Terbuka vs tertutup. Kelas vs kasta.",
    },
    {
      topicSlug: "stratifikasi-mobilitas",
      name: "Mobilitas Sosial",
      description: "Pergerakan strata sosial",
      contentMd:
        "Vertikal: naik/turun kelas. Horizontal: pindah peran setara. Antar-generasi (orang tua-anak) atau intra-generasi (dalam satu hidup).",
    },
    {
      topicSlug: "stratifikasi-mobilitas",
      name: "Faktor Mobilitas",
      description: "Pendidikan, ekonomi, dll",
      contentMd:
        "Faktor pendorong: pendidikan, keahlian, kerja keras. Penghambat: diskriminasi, kemiskinan, kurangnya akses. Saluran: sekolah, kerja, organisasi.",
    },
    {
      topicSlug: "sosialisasi-kebudayaan",
      name: "Sosialisasi",
      description: "Proses belajar nilai & norma",
      contentMd:
        "Sosialisasi: proses individu belajar budaya masyarakat. Agen: keluarga, sekolah, teman, media, pekerjaan. Tahap: primary, secondary, anticipatory.",
    },
    {
      topicSlug: "sosialisasi-kebudayaan",
      name: "Kebudayaan",
      description: "Wujud, unsur, sifat",
      contentMd:
        "Kebudayaan: hasil cipta-rasa-karsa. Wujud: ideas, activities, artifacts. 7 unsur: bahasa, pengetahuan, organisasi, mata pencaharian, dll.",
    },
    {
      topicSlug: "sosialisasi-kebudayaan",
      name: "Nilai dan Norma",
      description: "Tata aturan masyarakat",
      contentMd:
        "Nilai: ukuran baik/buruk. Norma: aturan konkret. Norma: kebiasaan, kesusilaan, kesopanan, hukum (sanksi jelas).",
    },
    {
      topicSlug: "sosialisasi-kebudayaan",
      name: "Multikulturalisme",
      description: "Keberagaman budaya",
      contentMd:
        "Multikultural: pengakuan & penghormatan pada keragaman. Indonesia: Bhinneka Tunggal Ika. Tantangan: primordialisme, etnosentrisme, stereotip.",
    },
    {
      topicSlug: "perubahan-sosial",
      name: "Perubahan Sosial",
      description: "Bentuk & faktor pendorong",
      contentMd:
        "Perubahan sosial: perbedaan keadaan t0 dan t1. Bentuk: evolusi, revolusi, planned, unplanned. Faktor: teknologi, pendidikan, kontak budaya.",
    },
    {
      topicSlug: "perubahan-sosial",
      name: "Globalisasi",
      description: "Keterkaitan dunia",
      contentMd:
        "Globalisasi: proses integrasi dunia. Aspek: ekonomi, budaya, teknologi, komunikasi. Dampak positif: pertukaran pengetahuan. Negatif: kesenjangan.",
    },
    {
      topicSlug: "perubahan-sosial",
      name: "Modernisasi",
      description: "Transformasi ke arah modern",
      contentMd:
        "Modernisasi: perubahan tradisional → modern. Ciri: rasional, teknologis, urban, mobilitas tinggi. Berbeda westernisasi (peniruan Barat).",
    },
    {
      topicSlug: "perubahan-sosial",
      name: "Masalah Sosial",
      description: "Kemiskinan, kriminalitas, dll",
      contentMd:
        "Masalah sosial: kondisi tak sesuai nilai/norma. Contoh: kemiskinan, pengangguran, kriminalitas, NAPZA, kenakalan remaja, diskriminasi.",
    },
    {
      topicSlug: "perubahan-sosial",
      name: "Penelitian Sosial",
      description: "Metode, teknik, langkah",
      contentMd:
        "Metode: kuantitatif (angka), kualitatif (narasi). Teknik: wawancara, kuesioner, observasi, dokumentasi. Langkah: identifikasi masalah, tinjauan pustaka, dll.",
    },
    {
      topicSlug: "individu-kelompok",
      name: "Solidaritas Sosial",
      description: "Mekanik & organik (Durkheim)",
      contentMd:
        "Solidaritas mekanik: masyarakat sederhana, kesamaan. Organik: masyarakat kompleks, saling ketergantungan (pembagian kerja). Durkheim.",
    },
    {
      topicSlug: "sosialisasi-kebudayaan",
      name: "Lembaga Pendidikan",
      description: "Keluarga, sekolah, masyarakat",
      contentMd:
        "Lembaga pendidikan: keluarga (pertama), sekolah (formal), masyarakat (nonformal). Transmisi nilai & norma untuk generasi berikutnya.",
    },
    {
      topicSlug: "perubahan-sosial",
      name: "Dampak Sosial Media",
      description: "Pengaruh medsos pada masyarakat",
      contentMd:
        "Positif: konektivitas, informasi cepat. Negatif: hoaks, cyberbullying, kecanduan, polarisasi. Literasi digital penting.",
    },
  ],
  PPKN: [
    {
      topicSlug: "pancasila",
      name: "Sejarah Pancasila",
      description: "Perumusan Pancasila",
      contentMd:
        "BPUPKI (1 Maret 1945)→ Soepomo, Moh. Yamin, Soekarno usulkan dasar negara. PPKI 18 Agustus 1945 mengesahkan.",
    },
    {
      topicSlug: "pancasila",
      name: "Sila Pertama",
      description: "Ketuhanan Yang Maha Esa",
      contentMd:
        "Negara berdasarkan Ketuhanan. Indonesia bukan negara agama, tapi negara ber-Tuhan. Bebas beragama, tidak memaksakan agama.",
    },
    {
      topicSlug: "pancasila",
      name: "Sila Kedua",
      description: "Kemanusiaan yang Adil dan Beradab",
      contentMd:
        "Menghargai harkat martabat manusia. Anti diskriminasi, anti kekerasan, menjunjung HAM. Kemanusiaan universal, bukan primordial.",
    },
    {
      topicSlug: "pancasila",
      name: "Sila Ketiga",
      description: "Persatuan Indonesia",
      contentMd:
        "Mengutamakan kepentingan bangsa di atas golongan. Bhinneka Tunggal Ika. Nasionalisme yang inklusif, bukan chauvinisme.",
    },
    {
      topicSlug: "pancasila",
      name: "Sila Keempat",
      description: "Kerakyatan yang Dipimpin oleh Hikmat Kebijaksanaan",
      contentMd:
        "Demokrasi, musyawarah mufakat. Bukan liberalisme, bukan otoriter. Keputusan bersama melalui deliberation, bukan voting tajam.",
    },
    {
      topicSlug: "pancasila",
      name: "Sila Kelima",
      description: "Keadilan Sosial bagi Seluruh Rakyat Indonesia",
      contentMd:
        "Pembangunan untuk semua, bukan segelintir. Keseimbangan hak & kewajiban. Tidak ada eksploitasi, kesetaraan ekonomi.",
    },
    {
      topicSlug: "uud-1945",
      name: "Struktur UUD 1945",
      description: "Pembukaan & batang tubuh",
      contentMd:
        "UUD 1945: 16 bab, 37 pasal (sebelum amandemen). Pembukaan (4 alinea) & Batang Tubuh. Amandemen I-IV: 1999-2002.",
    },
    {
      topicSlug: "uud-1945",
      name: "Amandemen UUD 1945",
      description: "Perubahan 1999-2002",
      contentMd:
        "Amandemen I (1999): kurangi kekuasaan presiden. II (2000): DPD. III (2001): MK, KY. IV (2002): pemilihan presiden langsung.",
    },
    {
      topicSlug: "uud-1945",
      name: "Lembaga Negara",
      description: "MPR, DPR, DPD, Presiden, MA, MK, BPK",
      contentMd:
        "MPR: gabungan DPR+DPD, tetapkan GBHN. DPR: legislasi, anggaran, pengawasan. MA: pengadilan tertinggi. MK: uji UU. BPK: audit keuangan.",
    },
    {
      topicSlug: "uud-1945",
      name: "Hak dan Kewajiban Warga Negara",
      description: "Pasal 27-34 UUD 1945",
      contentMd:
        "Hak: pendidikan, kerja, kesehatan, berserikat. Kewajiban: bela negara, bayar pajak, patuh hukum. Pasal 28: HAM, 31: pendidikan.",
    },
    {
      topicSlug: "bhinneka-tunggal-ika",
      name: "Makna Bhinneka Tunggal Ika",
      description: "Bhinneka = berbeda, Tunggal = satu, Ika = itu",
      contentMd:
        "Berbeda-beda tetapi tetap satu. Semboyan Garuda Pancasila. Mengakui keragaman suku, agama, ras, budaya sebagai kekuatan.",
    },
    {
      topicSlug: "bhinneka-tunggal-ika",
      name: "Keberagaman Indonesia",
      description: "Suku, agama, ras, bahasa",
      contentMd:
        "1.340 suku, 718 bahasa daerah, 6 agama resmi. Bhinneka Tunggal Ika diuji oleh primordialisme, separatisme. Solusi: NKRI + inklusi.",
    },
    {
      topicSlug: "bhinneka-tunggal-ika",
      name: "Ancaman terhadap Persatuan",
      description: "Paham radikal, separatisme",
      contentMd:
        "Paham radikal: intoleransi, ekstrimisme. Separatisme: OPM, GAM (sudah damai). Solusi: pendidikan multikultural, deradikalisasi.",
    },
    {
      topicSlug: "negara-warga-negara",
      name: "Hak Asasi Manusia",
      description: "HAM dan instrumennya",
      contentMd:
        "HAM: hak inherent pada manusia. Deklarasi Universal HAM 1948. Indonesia: UU 39/1999. Kategori: sipil-politik, ekonomi-sosial-budaya.",
    },
    {
      topicSlug: "negara-warga-negara",
      name: "Warga Negara Indonesia",
      description: "Status, syarat, dual citizenship",
      contentMd:
        "WNI: keturunan Indonesia, naturalisasi, menikah WNI, ditambah UU. Boleh dual citizenship hingga 18 tahun, harus pilih.",
    },
    {
      topicSlug: "negara-warga-negara",
      name: "Kedaulatan Negara",
      description: "Kedaulatan rakyat",
      contentMd:
        "Kedaulatan: kekuasaan tertinggi negara. Indonesia: kedaulatan rakyat (demokrasi). UUD 1945 Pasal 1 Ayat 2: sovereignty is in the hands of the people.",
    },
    {
      topicSlug: "negara-warga-negara",
      name: "Demokrasi Indonesia",
      description: "Demokrasi Pancasila",
      contentMd:
        "Demokrasi Pancasila: musyawarah mufakat, kekeluargaan. Berbeda demokrasi liberal. Pemilu setiap 5 tahun, pilpres, pileg, pilkada.",
    },
    {
      topicSlug: "negara-warga-negara",
      name: "Otonomi Daerah",
      description: "Desentralisasi",
      contentMd:
        "Otonomi daerah (UU 23/2014): berikan kewenangan ke daerah. Tujuannya: pelayanan publik lebih cepat, inisiatif lokal, kurangi beban pusat.",
    },
    {
      topicSlug: "negara-warga-negara",
      name: "Tata Urutan Peraturan",
      description: "Hierarki hukum Indonesia",
      contentMd:
        "Hierarki: UUD 1945 → UU/Perpu → PP → Perpres → Perda Provinsi → Perda Kabupaten/Kota. Asas lex superior derogat legi inferiori.",
    },
    {
      topicSlug: "negara-warga-negara",
      name: "Hak & Kewajiban Pajak",
      description: "Pajak dan APBN",
      contentMd:
        "Pajak: iuran wajib warga ke negara. Pasal 23A UUD 1945. Fungsi: anggaran (budgetair), mengatur (regulerend), stabilitas, redistribusi.",
    },
  ],
};

const QUESTIONS_BY_SUBJECT: Record<
  string,
  {
    conceptName: string;
    question: string;
    options: string[];
    correctIndex: number;
    difficulty: "EASY" | "MEDIUM" | "HARD";
  }[]
> = {
  MATEMATIKA: [
    {
      conceptName: "Persamaan Linear",
      question: "Nilai x dari persamaan 3x + 7 = 22 adalah...",
      options: ["3", "4", "5", "6"],
      correctIndex: 2,
      difficulty: "EASY",
    },
    {
      conceptName: "Persamaan Linear",
      question: "Jika 2x - 5 = 3x + 4, berapa nilai x?",
      options: ["-9", "-1", "1", "9"],
      correctIndex: 0,
      difficulty: "EASY",
    },
    {
      conceptName: "Fungsi Kuadrat",
      question: "Fungsi f(x) = x² - 4x + 3 memiliki akar-akar...",
      options: ["1 dan 3", "-1 dan -3", "-1 dan 3", "1 dan -3"],
      correctIndex: 0,
      difficulty: "MEDIUM",
    },
    {
      conceptName: "Fungsi Kuadrat",
      question: "Titik puncak fungsi f(x) = x² - 6x + 8 adalah...",
      options: ["(3, -1)", "(3, 1)", "(-3, -1)", "(-3, 1)"],
      correctIndex: 0,
      difficulty: "MEDIUM",
    },
    {
      conceptName: "Sistem Persamaan",
      question: "Himpunan penyelesaian dari 2x + y = 4 dan x - y = 5 adalah...",
      options: ["(3, -2)", "(2, 0)", "(1, 2)", "(4, -4)"],
      correctIndex: 0,
      difficulty: "MEDIUM",
    },
    {
      conceptName: "Sistem Persamaan",
      question: "Nilai x + y dari sistem x + 2y = 7 dan 3x - y = 7 adalah...",
      options: ["5", "6", "7", "8"],
      correctIndex: 1,
      difficulty: "MEDIUM",
    },
    {
      conceptName: "Teorema Pythagoras",
      question:
        "Segitiga siku-siku dengan sisi 6 cm dan 8 cm. Panjang sisi miringnya...",
      options: ["10 cm", "12 cm", "14 cm", "9 cm"],
      correctIndex: 0,
      difficulty: "EASY",
    },
    {
      conceptName: "Teorema Pythagoras",
      question:
        "Sebuah tangga 5 m bersandar di tembok. Jarak kaki tangga ke tembok 3 m. Tinggi tembok...",
      options: ["4 m", "3 m", "6 m", "5 m"],
      correctIndex: 0,
      difficulty: "EASY",
    },
    {
      conceptName: "Kesebangunan",
      question:
        "Segitiga A memiliki sisi 3, 4, 5. Jika sisi terpanjang segitiga B (sebangun) adalah 15, skala perbesarannya...",
      options: ["3", "4", "5", "2"],
      correctIndex: 0,
      difficulty: "MEDIUM",
    },
    {
      conceptName: "Transformasi Geometri",
      question: "Titik A(2,3) ditranslasikan oleh (3,-1). Bayangannya...",
      options: ["(5,2)", "(-1,4)", "(5,4)", "(6,3)"],
      correctIndex: 0,
      difficulty: "EASY",
    },
    {
      conceptName: "Rasio Trigonometri",
      question: "Nilai sin 30° adalah...",
      options: ["1/2", "√3/2", "1/√2", "1"],
      correctIndex: 0,
      difficulty: "EASY",
    },
    {
      conceptName: "Rasio Trigonometri",
      question: "Nilai cos 60° adalah...",
      options: ["1/2", "√3/2", "1/√2", "0"],
      correctIndex: 0,
      difficulty: "EASY",
    },
    {
      conceptName: "Limit Fungsi",
      question: "Nilai limit x→3 dari (x² - 9)/(x - 3) adalah...",
      options: ["6", "3", "9", "0"],
      correctIndex: 0,
      difficulty: "MEDIUM",
    },
    {
      conceptName: "Turunan",
      question: "Turunan dari f(x) = 3x² + 2x - 5 adalah...",
      options: ["6x + 2", "3x + 2", "6x - 2", "3x² + 2"],
      correctIndex: 0,
      difficulty: "MEDIUM",
    },
    {
      conceptName: "Ukuran Pemusatan",
      question: "Nilai rata-rata dari data: 7, 8, 6, 9, 7, 8, 7 adalah...",
      options: ["7", "7,5", "8", "6,5"],
      correctIndex: 0,
      difficulty: "EASY",
    },
    {
      conceptName: "Peluang",
      question: "Peluang muncul angka genap pada pelemparan dadu adalah...",
      options: ["1/2", "1/3", "1/6", "2/3"],
      correctIndex: 0,
      difficulty: "EASY",
    },
  ],
  BAHASA_INDONESIA: [
    {
      conceptName: "Kalimat Efektif",
      question: "Kalimat berikut yang paling efektif adalah...",
      options: [
        "Budi membaca buku di perpustakaan.",
        "Budi adalah membaca buku di perpustakaan.",
        "Yang membaca buku di perpustakaan adalah Budi.",
        "Di perpustakaan Budi membaca.",
      ],
      correctIndex: 0,
      difficulty: "EASY",
    },
    {
      conceptName: "Kata Baku",
      question: "Kata baku dari 'ijasah' adalah...",
      options: ["ijazah", "ijasah", "ijazah", "jazah"],
      correctIndex: 0,
      difficulty: "EASY",
    },
    {
      conceptName: "Kata Baku",
      question: "Penulisan kata yang BENAR adalah...",
      options: ["apotek", "apotik", "apothek", "apotik"],
      correctIndex: 0,
      difficulty: "EASY",
    },
    {
      conceptName: "Konjungsi",
      question: "Kata hubung yang menyatakan pertentangan adalah...",
      options: ["tetapi", "dan", "lalu", "karena"],
      correctIndex: 0,
      difficulty: "EASY",
    },
    {
      conceptName: "Konjungsi",
      question:
        "Konjungsi yang tepat untuk melengkapi 'Dia rajin belajar ___ nilai ujiannya bagus' adalah...",
      options: ["sehingga", "tetapi", "atau", "sedangkan"],
      correctIndex: 0,
      difficulty: "EASY",
    },
    {
      conceptName: "Majas",
      question: "'Wajahnya bersinar bagaikan bulan' mengandung majas...",
      options: ["personifikasi", "metafora", "hiperbola", "simile"],
      correctIndex: 3,
      difficulty: "MEDIUM",
    },
    {
      conceptName: "Majas",
      question: "'Hatinya terbuat dari batu' adalah contoh majas...",
      options: ["metafora", "litotes", "personifikasi", "ironi"],
      correctIndex: 0,
      difficulty: "MEDIUM",
    },
    {
      conceptName: "Puisi",
      question: "Baris dalam puisi disebut...",
      options: ["larik", "bait", "rima", "diksi"],
      correctIndex: 0,
      difficulty: "EASY",
    },
    {
      conceptName: "Prosa",
      question: "Berikut ini yang termasuk prosa adalah...",
      options: ["cerpen", "pantun", "syair", "gurindam"],
      correctIndex: 0,
      difficulty: "EASY",
    },
    {
      conceptName: "Ide Pokok",
      question: "Ide pokok paragraf biasanya terletak di...",
      options: [
        "kalimat pertama atau terakhir",
        "kalimat kedua",
        "tengah paragraf",
        "semua kalimat",
      ],
      correctIndex: 0,
      difficulty: "EASY",
    },
    {
      conceptName: "Paragraf Argumentasi",
      question: "Tujuan paragraf argumentasi adalah...",
      options: [
        "meyakinkan pembaca",
        "menghibur pembaca",
        "menjelaskan prosedur",
        "menggambarkan suasana",
      ],
      correctIndex: 0,
      difficulty: "EASY",
    },
    {
      conceptName: "Surat Resmi",
      question: "Ciri surat resmi adalah menggunakan...",
      options: [
        "bahasa baku",
        "bahasa sehari-hari",
        "singkatan gaul",
        "istilah daerah",
      ],
      correctIndex: 0,
      difficulty: "EASY",
    },
  ],
  BAHASA_INGGRIS: [
    {
      conceptName: "Tenses",
      question: "She ___ to school every day.",
      options: ["goes", "go", "going", "went"],
      correctIndex: 0,
      difficulty: "EASY",
    },
    {
      conceptName: "Tenses",
      question: "They ___ watching TV when I arrived.",
      options: ["were", "was", "are", "is"],
      correctIndex: 0,
      difficulty: "MEDIUM",
    },
    {
      conceptName: "Tenses",
      question: "I have ___ finished my homework.",
      options: ["just", "yet", "already", "since"],
      correctIndex: 0,
      difficulty: "MEDIUM",
    },
    {
      conceptName: "Passive Voice",
      question: "The cake ___ by my mother.",
      options: ["was baked", "baked", "bakes", "is bake"],
      correctIndex: 0,
      difficulty: "MEDIUM",
    },
    {
      conceptName: "Passive Voice",
      question: "English ___ in many countries.",
      options: ["is spoken", "speaks", "is speak", "spoken"],
      correctIndex: 0,
      difficulty: "EASY",
    },
    {
      conceptName: "Conditional Sentences",
      question: "If it rains, I ___ stay at home.",
      options: ["will", "would", "can", "am"],
      correctIndex: 0,
      difficulty: "MEDIUM",
    },
    {
      conceptName: "Synonyms & Antonyms",
      question: "The antonym of 'big' is...",
      options: ["small", "huge", "large", "giant"],
      correctIndex: 0,
      difficulty: "EASY",
    },
    {
      conceptName: "Synonyms & Antonyms",
      question: "The synonym of 'fast' is...",
      options: ["quick", "slow", "lazy", "late"],
      correctIndex: 0,
      difficulty: "EASY",
    },
    {
      conceptName: "Phrasal Verbs",
      question: "To 'give up' means to...",
      options: [
        "stop trying",
        "surrender something",
        "distribute",
        "quit a job",
      ],
      correctIndex: 0,
      difficulty: "MEDIUM",
    },
    {
      conceptName: "Phrasal Verbs",
      question: "To 'look after' means to...",
      options: ["take care of", "search for", "watch", "admire"],
      correctIndex: 0,
      difficulty: "MEDIUM",
    },
    {
      conceptName: "Main Idea",
      question:
        "The main idea of a paragraph is usually found in the ___ sentence.",
      options: ["first", "last", "middle", "every"],
      correctIndex: 0,
      difficulty: "EASY",
    },
    {
      conceptName: "Inference",
      question: "When you infer, you draw a conclusion based on...",
      options: [
        "evidence in the text",
        "your opinion",
        "the author's biography",
        "random guessing",
      ],
      correctIndex: 0,
      difficulty: "EASY",
    },
  ],
  IPA: [
    {
      conceptName: "Hukum Newton",
      question: "Hukum Newton II menyatakan bahwa F = ...",
      options: ["ma", "mv", "m/t", "m/s"],
      correctIndex: 0,
      difficulty: "EASY",
    },
    {
      conceptName: "Hukum Newton",
      question:
        "Sebuah benda diam akan tetap diam jika resultan gaya yang bekerja...",
      options: [
        "sama dengan nol",
        "tidak sama dengan nol",
        "positif",
        "negatif",
      ],
      correctIndex: 0,
      difficulty: "EASY",
    },
    {
      conceptName: "Hukum Newton",
      question: "Massa 5 kg, percepatan 2 m/s². Gaya yang bekerja...",
      options: ["10 N", "2,5 N", "7 N", "3 N"],
      correctIndex: 0,
      difficulty: "EASY",
    },
    {
      conceptName: "Listrik Dinamis",
      question: "Hukum Ohm menyatakan V = ...",
      options: ["IR", "I/R", "R/I", "I²R"],
      correctIndex: 0,
      difficulty: "EASY",
    },
    {
      conceptName: "Listrik Dinamis",
      question: "R total dari R₁=2Ω dan R₂=3Ω yang disusun seri adalah...",
      options: ["5Ω", "1,2Ω", "6Ω", "0,5Ω"],
      correctIndex: 0,
      difficulty: "EASY",
    },
    {
      conceptName: "Termodinamika",
      question: "Hukum I Termodinamika: ΔU = ...",
      options: ["Q - W", "Q + W", "W - Q", "Q × W"],
      correctIndex: 0,
      difficulty: "MEDIUM",
    },
    {
      conceptName: "Gelombang",
      question: "Cepat rambat gelombang v = ...",
      options: ["λf", "f/λ", "λ/f", "T/λ"],
      correctIndex: 0,
      difficulty: "EASY",
    },
    {
      conceptName: "Larutan Asam Basa",
      question: "pH larutan asam adalah...",
      options: ["< 7", "> 7", "= 7", "= 14"],
      correctIndex: 0,
      difficulty: "EASY",
    },
    {
      conceptName: "Larutan Asam Basa",
      question: "Indikator lakmus merah dalam basa berubah menjadi...",
      options: ["biru", "merah", "putih", "kuning"],
      correctIndex: 0,
      difficulty: "EASY",
    },
    {
      conceptName: "Stoikiometri",
      question: "1 mol zat mengandung ___ partikel.",
      options: ["6,02 × 10²³", "6,02 × 10²²", "3,01 × 10²³", "12,04 × 10²³"],
      correctIndex: 0,
      difficulty: "EASY",
    },
    {
      conceptName: "Reaksi Redoks",
      question: "Reaksi oksidasi adalah reaksi...",
      options: [
        "melepas elektron",
        "menerima elektron",
        "mengikat oksigen",
        "melepas proton",
      ],
      correctIndex: 0,
      difficulty: "MEDIUM",
    },
    {
      conceptName: "Fotosintesis",
      question: "Fotosintesis menghasilkan glukosa dan...",
      options: ["oksigen", "karbon dioksida", "air", "energi"],
      correctIndex: 0,
      difficulty: "EASY",
    },
    {
      conceptName: "Sistem Peredaran Darah",
      question: "Jantung manusia memiliki ___ ruang.",
      options: ["4", "2", "3", "5"],
      correctIndex: 0,
      difficulty: "EASY",
    },
    {
      conceptName: "DNA dan RNA",
      question: "DNA berbentuk...",
      options: ["double helix", "single strand", "triple helix", "circular"],
      correctIndex: 0,
      difficulty: "EASY",
    },
  ],
  SEJARAH: [
    {
      conceptName: "Manusia Purba",
      question: "Manusia purba Pithecanthropus erectus ditemukan oleh...",
      options: ["Eugene Dubois", "Ter Haar", "Van den Berg", "Teuku Jacob"],
      correctIndex: 0,
      difficulty: "EASY",
    },
    {
      conceptName: "Peradaban Awal Nusantara",
      question: "Kerajaan Hindu tertua di Indonesia adalah...",
      options: ["Kutai", "Tarumanagara", "Sriwijaya", "Majapahit"],
      correctIndex: 0,
      difficulty: "MEDIUM",
    },
    {
      conceptName: "Kerajaan Hindu-Buddha",
      question: "Kerajaan maritim Buddha terbesar di Nusantara adalah...",
      options: ["Sriwijaya", "Majapahit", "Tarumanagara", "Kutai"],
      correctIndex: 0,
      difficulty: "EASY",
    },
    {
      conceptName: "Masuknya Islam ke Indonesia",
      question: "Walisongo menyebarkan Islam terutama di pulau...",
      options: ["Jawa", "Sumatra", "Kalimantan", "Sulawesi"],
      correctIndex: 0,
      difficulty: "EASY",
    },
    {
      conceptName: "Kerajaan Islam Nusantara",
      question: "Kerajaan Islam pertama di Jawa adalah...",
      options: ["Demak", "Mataram", "Banten", "Ternate"],
      correctIndex: 0,
      difficulty: "MEDIUM",
    },
    {
      conceptName: "VOC dan Tanam Paksa",
      question: "Sistem tanam paksa (Cultuurstelsel) diperkenalkan oleh...",
      options: ["Van den Bosch", "Daendels", "Jansen", "Raffles"],
      correctIndex: 0,
      difficulty: "MEDIUM",
    },
    {
      conceptName: "Perlawanan Rakyat",
      question: "Perang Diponegoro terjadi pada tahun...",
      options: ["1825-1830", "1821-1837", "1873-1914", "1945-1949"],
      correctIndex: 0,
      difficulty: "MEDIUM",
    },
    {
      conceptName: "Kebangkitan Nasional",
      question: "Budi Utomo didirikan pada tanggal...",
      options: [
        "20 Mei 1908",
        "28 Oktober 1928",
        "17 Agustus 1945",
        "10 November 1945",
      ],
      correctIndex: 0,
      difficulty: "EASY",
    },
    {
      conceptName: "Proklamasi Kemerdekaan",
      question: "Teks proklamasi dibacakan di...",
      options: [
        "Jalan Pegangsaan 56, Jakarta",
        "Istana Merdeka",
        "Gedung Agung Yogyakarta",
        "Istana Negara",
      ],
      correctIndex: 0,
      difficulty: "EASY",
    },
    {
      conceptName: "Masa Revolusi",
      question: "Agresi Militer Belanda II terjadi pada tahun...",
      options: ["1948", "1946", "1947", "1949"],
      correctIndex: 0,
      difficulty: "HARD",
    },
    {
      conceptName: "Demokrasi Terpimpin",
      question: "Demokrasi Terpimpin diterapkan oleh Presiden...",
      options: ["Soekarno", "Soeharto", "B.J. Habibie", "Megawati"],
      correctIndex: 0,
      difficulty: "EASY",
    },
    {
      conceptName: "Orde Baru",
      question: "Orde Baru dimulai pada tahun...",
      options: ["1966", "1959", "1998", "1945"],
      correctIndex: 0,
      difficulty: "EASY",
    },
    {
      conceptName: "Krisis 1998",
      question: "Soeharto mengundurkan diri pada...",
      options: ["21 Mei 1998", "12 Mei 1998", "1 Juni 1999", "20 Oktober 1998"],
      correctIndex: 0,
      difficulty: "MEDIUM",
    },
    {
      conceptName: "Era Reformasi",
      question: "Pemilihan presiden secara langsung pertama kali pada tahun...",
      options: ["2004", "1999", "2001", "2002"],
      correctIndex: 0,
      difficulty: "MEDIUM",
    },
    {
      conceptName: "Teori Masuknya Hindu",
      question:
        "Teori yang menyatakan bahwa agama Hindu masuk ke Indonesia lewat pedagang adalah teori...",
      options: ["Waisya", "Brahmana", "Ksatria", "Arus Balik"],
      correctIndex: 0,
      difficulty: "MEDIUM",
    },
    {
      conceptName: "Pengaruh Hindu-Buddha",
      question: "Candi Borobudur merupakan peninggalan agama...",
      options: ["Buddha", "Hindu", "Islam", "Animisme"],
      correctIndex: 0,
      difficulty: "EASY",
    },
    {
      conceptName: "Sumpah Pemuda",
      question: "Sumpah Pemuda terjadi pada tanggal...",
      options: [
        "28 Oktober 1928",
        "20 Mei 1908",
        "17 Agustus 1945",
        "10 November 1945",
      ],
      correctIndex: 0,
      difficulty: "EASY",
    },
    {
      conceptName: "Pendudukan Jepang",
      question: "Jepang menyerah tanpa syarat kepada Sekutu pada tahun...",
      options: ["1945", "1942", "1944", "1946"],
      correctIndex: 0,
      difficulty: "EASY",
    },
    {
      conceptName: "Tokoh Nasional",
      question:
        "Soekarno dan Hatta memproklamasikan kemerdekaan Indonesia pada...",
      options: [
        "17 Agustus 1945",
        "18 Agustus 1945",
        "1 Juni 1945",
        "28 Oktober 1945",
      ],
      correctIndex: 0,
      difficulty: "EASY",
    },
    {
      conceptName: "Manusia Purba",
      question: "Manusia purba tertua di Indonesia adalah...",
      options: [
        "Meganthropus paleojavanicus",
        "Pithecanthropus erectus",
        "Homo sapiens",
        "Homo floresiensis",
      ],
      correctIndex: 0,
      difficulty: "HARD",
    },
    {
      conceptName: "Peradaban Awal Nusantara",
      question: "Kerajaan Hindu tertua di Indonesia adalah...",
      options: ["Kutai", "Tarumanagara", "Sriwijaya", "Majapahit"],
      correctIndex: 0,
      difficulty: "MEDIUM",
    },
    {
      conceptName: "Kerajaan Hindu-Buddha",
      question: "Kerajaan Majapahit mencapai puncak kejayaan pada masa raja...",
      options: [
        "Hayam Wuruk",
        "Raden Wijaya",
        "Hayam Wuruk dan Gajah Mada",
        "Kertanegara",
      ],
      correctIndex: 2,
      difficulty: "HARD",
    },
    {
      conceptName: "Masuknya Islam ke Indonesia",
      question:
        "Walisongo yang terkenal dengan metode dakwah melalui budaya adalah...",
      options: ["Sunan Kalijaga", "Sunan Ampel", "Sunan Bonang", "Sunan Giri"],
      correctIndex: 0,
      difficulty: "MEDIUM",
    },
    {
      conceptName: "VOC dan Tanam Paksa",
      question: "Tanam paksa (cultuurstelsel) diperkenalkan oleh...",
      options: [
        "Johannes van den Bosch",
        "Jan Pieterszoon Coen",
        "Cornelis de Houtman",
        "Herman Willem Daendels",
      ],
      correctIndex: 0,
      difficulty: "HARD",
    },
    {
      conceptName: "Perlawanan Rakyat",
      question: "Perang Aceh melawan Belanda berlangsung selama...",
      options: ["1873-1914", "1825-1830", "1821-1837", "1945-1949"],
      correctIndex: 0,
      difficulty: "MEDIUM",
    },
    {
      conceptName: "Kebangkitan Nasional",
      question: "Budi Utomo didirikan pada tanggal...",
      options: [
        "20 Mei 1908",
        "28 Oktober 1928",
        "17 Agustus 1945",
        "1 Juni 1945",
      ],
      correctIndex: 0,
      difficulty: "MEDIUM",
    },
    {
      conceptName: "Proklamasi Kemerdekaan",
      question: "Teks proklamasi dibacakan di jalan...",
      options: [
        "Pegangsaan 56, Jakarta",
        "Merdeka Barat, Jakarta",
        "Asia Afrika, Bandung",
        "Sudirman, Jakarta",
      ],
      correctIndex: 0,
      difficulty: "MEDIUM",
    },
    {
      conceptName: "Masa Revolusi",
      question: "Perjanjian yang mengakui kedaulatan Indonesia adalah...",
      options: [
        "Konferensi Meja Bundar (1949)",
        "Linggarjati (1947)",
        "Renville (1948)",
        "Roem-Royen (1949)",
      ],
      correctIndex: 0,
      difficulty: "HARD",
    },
    {
      conceptName: "Demokrasi Terpimpin",
      question: "Demokrasi Terpimpin berlangsung pada masa presiden...",
      options: ["Soekarno", "Soeharto", "Habibie", "Sukarno-Hatta"],
      correctIndex: 0,
      difficulty: "EASY",
    },
    {
      conceptName: "Orde Baru",
      question: "Pembangunan jangka panjang di Orde Baru disebut...",
      options: ["PELITA", "Repelita", "Inpres", "Pembangunan Nasional"],
      correctIndex: 0,
      difficulty: "MEDIUM",
    },
    {
      conceptName: "Manusia Purba",
      question: "Manusia purba tertua di Indonesia adalah...",
      options: [
        "Meganthropus paleojavanicus",
        "Pithecanthropus erectus",
        "Homo sapiens",
        "Homo floresiensis",
      ],
      correctIndex: 0,
      difficulty: "HARD",
    },
    {
      conceptName: "Periode Neolithicum",
      question: "Ciri utama zaman Neolithicum adalah...",
      options: [
        "Masa bercocok tanam",
        " Berburu & meramu",
        "Penggunaan logam",
        "Hidup nomaden",
      ],
      correctIndex: 0,
      difficulty: "EASY",
    },
    {
      conceptName: "Kedatangan Portugis",
      question: "Portugis berhasil menguasai Malaka pada tahun...",
      options: ["1511", "1500", "1602", "1596"],
      correctIndex: 0,
      difficulty: "MEDIUM",
    },
  ],
  GEOGRAFI: [
    {
      conceptName: "Lempeng Tektonik",
      question: "Indonesia terletak di antara lempeng...",
      options: [
        "Eurasia, Indo-Australia, Pasifik",
        "Pasifik, Amerika, Eurasia",
        "Afrika, Eurasia, Indo-Australia",
        "Antartika, Pasifik, Eurasia",
      ],
      correctIndex: 0,
      difficulty: "MEDIUM",
    },
    {
      conceptName: "Gempa Bumi",
      question: "Indonesia rawan gempa karena berada di...",
      options: [
        "Cincin Api Pasifik",
        "Sabuk Mediterania",
        "Mid-Atlantic Ridge",
        "Sirkum Pasifik Selatan",
      ],
      correctIndex: 0,
      difficulty: "EASY",
    },
    {
      conceptName: "Vulkanisme",
      question: "Indonesia memiliki gunung api aktif sekitar...",
      options: ["130", "80", "200", "50"],
      correctIndex: 0,
      difficulty: "MEDIUM",
    },
    {
      conceptName: "Angin Monsun",
      question: "Monsun barat membawa hujan di Indonesia pada bulan...",
      options: [
        "Desember-Maret",
        "Juni-September",
        "September-November",
        "April-Juni",
      ],
      correctIndex: 0,
      difficulty: "MEDIUM",
    },
    {
      conceptName: "Pertumbuhan Penduduk",
      question: "Pertumbuhan alami penduduk dihitung dari...",
      options: [
        "Lahir - Mati",
        "Lahir + Migrasi",
        "Mati - Migrasi",
        "Lahir - Mati + Migrasi",
      ],
      correctIndex: 0,
      difficulty: "EASY",
    },
    {
      conceptName: "Piramida Penduduk",
      question: "Piramida expansive menggambarkan penduduk dengan...",
      options: [
        "Proporsi anak besar",
        "Proporsi lansia besar",
        "Distribusi merata",
        "Penurunan angka kelahiran",
      ],
      correctIndex: 0,
      difficulty: "MEDIUM",
    },
    {
      conceptName: "Urbanisasi",
      question: "Faktor penarik urbanisasi ke kota adalah...",
      options: [
        "Lapangan kerja",
        "Lahan pertanian luas",
        "Biaya hidup murah",
        "Udara bersih",
      ],
      correctIndex: 0,
      difficulty: "EASY",
    },
    {
      conceptName: "Kondisi Geografis Indonesia",
      question: "Lokasi astronomis Indonesia adalah...",
      options: [
        "95°BT-141°BT dan 6°LU-11°LS",
        "100°BT-150°BT dan 0°-10°LS",
        "90°BT-130°BT dan 5°LU-5°LS",
        "95°BB-141°BB dan 6°LU-11°LS",
      ],
      correctIndex: 0,
      difficulty: "MEDIUM",
    },
    {
      conceptName: "Karakteristik Pulau Besar",
      question: "Pegunungan Bukit Barisan terdapat di pulau...",
      options: ["Sumatra", "Jawa", "Kalimantan", "Papua"],
      correctIndex: 0,
      difficulty: "EASY",
    },
    {
      conceptName: "Iklim Indonesia",
      question: "Curah hujan rata-rata Indonesia per tahun adalah...",
      options: ["1500-3000 mm", "500-1000 mm", "4000-5000 mm", "100-500 mm"],
      correctIndex: 0,
      difficulty: "MEDIUM",
    },
    {
      conceptName: "Pemanasan Global",
      question: "Gas rumah kaca utama penyebab pemanasan global adalah...",
      options: ["CO2", "O2", "N2", "H2"],
      correctIndex: 0,
      difficulty: "EASY",
    },
    {
      conceptName: "Pencemaran Lingkungan",
      question: "Indeks yang mengukur pencemaran air adalah...",
      options: ["BOD dan COD", "pH dan DO", "TDS dan TSS", "Semua benar"],
      correctIndex: 0,
      difficulty: "HARD",
    },
    {
      conceptName: "Pelestarian Lingkungan",
      question: "Kawasan konservasi untuk melindungi satwa langka disebut...",
      options: [
        "Suaka Margasatwa",
        "Taman Nasional",
        "Taman Wisata Alam",
        "Cagar Alam",
      ],
      correctIndex: 0,
      difficulty: "MEDIUM",
    },
    {
      conceptName: "Tsunami",
      question: "Tsunami Aceh 2004 disebabkan oleh gempa berkekuatan...",
      options: ["9,1 SR", "8,6 SR", "7,5 SR", "8,0 SR"],
      correctIndex: 0,
      difficulty: "HARD",
    },
    {
      conceptName: "Kualitas Penduduk",
      question: "IPM adalah singkatan dari...",
      options: [
        "Indeks Pembangunan Manusia",
        "Indeks Pertumbuhan Manusia",
        "Indeks Pendapatan Masyarakat",
        "Indeks Pemberdayaan Masyarakat",
      ],
      correctIndex: 0,
      difficulty: "EASY",
    },
    {
      conceptName: "Energi Terbarukan",
      question:
        "Indonesia merupakan negara dengan potensi energi panas bumi terbesar di...",
      options: ["Dunia", "Asia Tenggara", "Asia", "Pasifik"],
      correctIndex: 0,
      difficulty: "MEDIUM",
    },
    {
      conceptName: "Bencana Alam Indonesia",
      question: "BNPB adalah lembaga yang menangani...",
      options: [
        "Penanganan bencana",
        "Penelitian bencana",
        "Pencegahan penyakit",
        "Pembangunan nasional",
      ],
      correctIndex: 0,
      difficulty: "EASY",
    },
    {
      conceptName: "ASEAN",
      question: "ASEAN berdiri pada tahun...",
      options: ["1967", "1955", "1975", "1990"],
      correctIndex: 0,
      difficulty: "MEDIUM",
    },
    {
      conceptName: "Lempeng Tektonik",
      question: "Batas lempeng yang menjauh satu sama lain disebut...",
      options: ["Divergen", "Konvergen", "Transform", "Subduksi"],
      correctIndex: 0,
      difficulty: "MEDIUM",
    },
    {
      conceptName: "Vulkanisme",
      question: "Gunung api berbentuk strato terbentuk karena...",
      options: [
        "Letusan eksplosif berlapis",
        "Lava encer mengalir",
        "Letusan freatik",
        "Longsoran kawah",
      ],
      correctIndex: 0,
      difficulty: "HARD",
    },
    {
      conceptName: "Angin Monsun",
      question: "Monsun timur menyebabkan Indonesia mengalami musim...",
      options: ["Kemarau", "Hujan", "Pancaroba", "Salju"],
      correctIndex: 0,
      difficulty: "EASY",
    },
    {
      conceptName: "Hidrosfer",
      question: "Siklus air dimulai dari proses...",
      options: ["Evaporasi", "Kondensasi", "Presipitasi", "Infiltrasi"],
      correctIndex: 0,
      difficulty: "EASY",
    },
    {
      conceptName: "Urbanisasi",
      question: "Faktor penarik urbanisasi adalah...",
      options: [
        "Lapangan kerja di kota",
        "Kemiskinan di desa",
        "Tanah sempit",
        "Kurangnya fasilitas desa",
      ],
      correctIndex: 0,
      difficulty: "EASY",
    },
    {
      conceptName: "Karakteristik Pulau Besar",
      question: "Pulau dengan populasi terbesar di Indonesia adalah...",
      options: ["Jawa", "Sumatra", "Kalimantan", "Sulawesi"],
      correctIndex: 0,
      difficulty: "EASY",
    },
    {
      conceptName: "Iklim Indonesia",
      question: "Indonesia beriklim tropis dengan curah hujan rata-rata...",
      options: [
        "1500-3000 mm/tahun",
        "500-1000 mm/tahun",
        "3000-5000 mm/tahun",
        "100-500 mm/tahun",
      ],
      correctIndex: 0,
      difficulty: "MEDIUM",
    },
    {
      conceptName: "Sumber Daya Alam",
      question: "Hutan dan ikan termasuk SDA...",
      options: [
        "Hayati (dapat diperbarui)",
        "Non-hayati (tidak dapat diperbarui)",
        "Minerba",
        "Energi",
      ],
      correctIndex: 0,
      difficulty: "EASY",
    },
    {
      conceptName: "Pemanasan Global",
      question: "Gas rumah kaca utama penyebab pemanasan global adalah...",
      options: ["CO₂", "O₂", "N₂", "H₂"],
      correctIndex: 0,
      difficulty: "EASY",
    },
    {
      conceptName: "Tsunami",
      question: "Tsunami Aceh 2004 disebabkan oleh gempa berkekuatan...",
      options: ["9,1 SR", "8,6 SR", "7,5 SR", "8,0 SR"],
      correctIndex: 0,
      difficulty: "HARD",
    },
    {
      conceptName: "Iklim dan Cuaca",
      question: "Unsur-unsur iklim di antaranya...",
      options: [
        "Suhu, tekanan, angin, curah hujan",
        "Hanya suhu",
        "Hanya curah hujan",
        "Hanya angin",
      ],
      correctIndex: 0,
      difficulty: "EASY",
    },
    {
      conceptName: "Pola Permukiman",
      question: "Pola permukiman memanjang biasanya mengikuti...",
      options: ["Sungai atau pesisir", "Dataran tinggi", "Hutan", "Gunung"],
      correctIndex: 0,
      difficulty: "EASY",
    },
  ],
  EKONOMI: [
    {
      conceptName: "Kebutuhan Manusia",
      question: "Makanan, minuman, dan tempat tinggal termasuk kebutuhan...",
      options: ["Primer", "Sekunder", "Tersier", "Mewah"],
      correctIndex: 0,
      difficulty: "EASY",
    },
    {
      conceptName: "Kelangkaan",
      question: "Inti masalah ekonomi adalah...",
      options: ["Kelangkaan", "Inflasi", "Pengangguran", "Kemiskinan"],
      correctIndex: 0,
      difficulty: "EASY",
    },
    {
      conceptName: "Sistem Ekonomi",
      question:
        "Sistem ekonomi yang memberikan kebebasan penuh pada pasar adalah...",
      options: ["Pasar", "Komando", "Tradisional", "Campuran"],
      correctIndex: 0,
      difficulty: "MEDIUM",
    },
    {
      conceptName: "Pelaku Ekonomi",
      question: "Rumah tangga konsumsi berperan sebagai...",
      options: [
        "Pemilik faktor produksi",
        "Produsen barang",
        "Regulator",
        "Distributor",
      ],
      correctIndex: 0,
      difficulty: "EASY",
    },
    {
      conceptName: "Permintaan",
      question: "Hukum permintaan menyatakan bahwa...",
      options: [
        "Harga naik → permintaan turun",
        "Harga naik → permintaan naik",
        "Harga turun → permintaan turun",
        "Tidak ada hubungan",
      ],
      correctIndex: 0,
      difficulty: "EASY",
    },
    {
      conceptName: "Penawaran",
      question: "Kurva penawaran memiliki kemiringan...",
      options: ["Positif (naik)", "Negatif (turun)", "Datar", "Tidak tentu"],
      correctIndex: 0,
      difficulty: "EASY",
    },
    {
      conceptName: "Keseimbangan Pasar",
      question: "Keseimbangan pasar terjadi saat...",
      options: ["Qd = Qs", "Qd > Qs", "Qd < Qs", "Pd = Ps"],
      correctIndex: 0,
      difficulty: "MEDIUM",
    },
    {
      conceptName: "Elastisitas",
      question: "Permintaan inelastis jika koefisien elastisitasnya...",
      options: [
        "Kurang dari 1",
        "Lebih dari 1",
        "Sama dengan 1",
        "Lebih dari 2",
      ],
      correctIndex: 0,
      difficulty: "HARD",
    },
    {
      conceptName: "Biaya Produksi",
      question: "Sewa pabrik termasuk biaya...",
      options: ["Tetap (FC)", "Variabel (VC)", "Total (TC)", "Marginal (MC)"],
      correctIndex: 0,
      difficulty: "EASY",
    },
    {
      conceptName: "Pasar Persaingan",
      question: "Pasar dengan satu penjual disebut...",
      options: ["Monopoli", "Oligopoli", "Monopolistik", "Persaingan sempurna"],
      correctIndex: 0,
      difficulty: "EASY",
    },
    {
      conceptName: "Produk Domestik Bruto",
      question: "PDB per kapita Indonesia tahun 2023 sekitar...",
      options: ["USD 4.900", "USD 1.000", "USD 10.000", "USD 100.000"],
      correctIndex: 0,
      difficulty: "MEDIUM",
    },
    {
      conceptName: "Inflasi",
      question: "Indeks yang biasa dipakai untuk mengukur inflasi adalah...",
      options: ["IHK", "IPM", "Gini Ratio", "TFR"],
      correctIndex: 0,
      difficulty: "MEDIUM",
    },
    {
      conceptName: "Pengangguran",
      question:
        "Pengangguran yang terjadi karena skill tidak sesuai lapangan kerja disebut...",
      options: ["Struktural", "Friksional", "Siklikal", "Musiman"],
      correctIndex: 0,
      difficulty: "HARD",
    },
    {
      conceptName: "Kebijakan Fiskal",
      question:
        "Tindakan pemerintah menaikkan belanja untuk menstimulus ekonomi adalah kebijakan fiskal...",
      options: ["Ekspansif", "Kontraktif", "Moneter", "Neto"],
      correctIndex: 0,
      difficulty: "MEDIUM",
    },
    {
      conceptName: "Kebijakan Moneter",
      question: "Bank Indonesia menaikkan BI rate bertujuan untuk...",
      options: [
        "Mengurangi uang beredar",
        "Menambah uang beredar",
        "Menaikkan inflasi",
        "Menurunkan suku bunga",
      ],
      correctIndex: 0,
      difficulty: "MEDIUM",
    },
    {
      conceptName: "Bank & Lembaga Keuangan",
      question: "Bank yang berfungsi sebagai bank sentral Indonesia adalah...",
      options: ["Bank Indonesia", "Bank Mandiri", "BCA", "BRI"],
      correctIndex: 0,
      difficulty: "EASY",
    },
    {
      conceptName: "Investasi & Saham",
      question:
        "Instrumen yang menunjukkan kepemilikan atas perusahaan adalah...",
      options: ["Saham", "Obligasi", "Reksadana", "Deposito"],
      correctIndex: 0,
      difficulty: "EASY",
    },
    {
      conceptName: "Perdagangan Internasional",
      question: "Surplus neraca perdagangan terjadi saat...",
      options: [
        "Ekspor > Impor",
        "Impor > Ekspor",
        "Ekspor = Impor",
        "Tidak ada perdagangan",
      ],
      correctIndex: 0,
      difficulty: "EASY",
    },
    {
      conceptName: "Struktur Pasar",
      question: "Pasar di mana hanya ada satu penjual dikategorikan sebagai...",
      options: ["Monopoli", "Oligopoli", "Monopolistik", "Persaingan sempurna"],
      correctIndex: 0,
      difficulty: "EASY",
    },
    {
      conceptName: "Kemiskinan",
      question: "Garis kemiskinan di Indonesia ditetapkan oleh...",
      options: ["BPS", "Bank Indonesia", "Kemenkes", "Bappenas"],
      correctIndex: 0,
      difficulty: "MEDIUM",
    },
    {
      conceptName: "Ketenagakerjaan",
      question: "Upah Minimum Provinsi/UMR ditetapkan oleh...",
      options: ["Gubernur", "Menteri", "Buruh", "Pengusaha"],
      correctIndex: 0,
      difficulty: "EASY",
    },
    {
      conceptName: "Kebutuhan Manusia",
      question:
        "Kebutuhan yang tidak terbatas sedangkan alat pemuas terbatas disebut...",
      options: ["Kelangkaan", "Kebutuhan primer", "Pilihan", "Biaya peluang"],
      correctIndex: 0,
      difficulty: "EASY",
    },
    {
      conceptName: "Kelangkaan",
      question: "Biaya peluang adalah...",
      options: [
        "Nilai alternatif yang dikorbankan",
        "Harga barang",
        "Total produksi",
        "Selisih ekspor-impor",
      ],
      correctIndex: 0,
      difficulty: "MEDIUM",
    },
    {
      conceptName: "Sistem Ekonomi",
      question: "Indonesia menggunakan sistem ekonomi...",
      options: ["Campuran", "Komando", "Pasar bebas", "Tradisional"],
      correctIndex: 0,
      difficulty: "EASY",
    },
    {
      conceptName: "Pelaku Ekonomi",
      question: "Rumah tangga dalam circular flow berperan sebagai...",
      options: [
        "Konsumen & pemilik faktor produksi",
        "Produsen",
        "Regulator",
        "Eksportir",
      ],
      correctIndex: 0,
      difficulty: "EASY",
    },
    {
      conceptName: "Permintaan",
      question: "Hukum permintaan menyatakan bahwa...",
      options: [
        "Harga naik → permintaan turun",
        "Harga naik → permintaan naik",
        "Harga tetap → permintaan berubah",
        "Permintaan tidak dipengaruhi harga",
      ],
      correctIndex: 0,
      difficulty: "EASY",
    },
    {
      conceptName: "Penawaran",
      question: "Kurva penawaran memiliki slope...",
      options: [
        "Positif (menaik)",
        "Negatif (menurun)",
        "Horizontal",
        "Vertikal",
      ],
      correctIndex: 0,
      difficulty: "EASY",
    },
    {
      conceptName: "Keseimbangan Pasar",
      question: "Harga keseimbangan terjadi saat...",
      options: ["Qd = Qs", "Qd > Qs", "Qd < Qs", "Permintaan nol"],
      correctIndex: 0,
      difficulty: "EASY",
    },
    {
      conceptName: "Elastisitas",
      question: "Permintaan inelastis ditunjukkan oleh...",
      options: ["|E| < 1", "|E| > 1", "|E| = 1", "|E| = 0"],
      correctIndex: 0,
      difficulty: "HARD",
    },
    {
      conceptName: "Biaya Produksi",
      question: "TC = FC + VC berarti biaya total adalah...",
      options: [
        "Biaya tetap + biaya variabel",
        "Biaya tetap saja",
        "Biaya variabel saja",
        "Biaya marginal",
      ],
      correctIndex: 0,
      difficulty: "EASY",
    },
    {
      conceptName: "Pasar Persaingan",
      question: "Ciri pasar persaingan sempurna adalah...",
      options: [
        "Banyak penjual & barang homogen",
        "Satu penjual",
        "Beberapa penjual",
        "Barang berbeda",
      ],
      correctIndex: 0,
      difficulty: "MEDIUM",
    },
    {
      conceptName: "Produk Domestik Bruto",
      question: "PDB dihitung dengan pendekatan...",
      options: [
        "Produksi, pengeluaran, pendapatan",
        "Impor-ekspor saja",
        "Inflasi",
        "Pajak",
      ],
      correctIndex: 0,
      difficulty: "MEDIUM",
    },
    {
      conceptName: "Inflasi",
      question: "IHK digunakan untuk mengukur...",
      options: ["Inflasi", "PDB", "Pengangguran", "Kemiskinan"],
      correctIndex: 0,
      difficulty: "EASY",
    },
    {
      conceptName: "Bank & Lembaga Keuangan",
      question: "Bank sentral di Indonesia adalah...",
      options: ["Bank Indonesia (BI)", "Bank Mandiri", "BCA", "BRI"],
      correctIndex: 0,
      difficulty: "EASY",
    },
    {
      conceptName: "Otoritas Jasa Keuangan",
      question: "OJK berdiri pada tahun...",
      options: ["2011", "1997", "2008", "2015"],
      correctIndex: 0,
      difficulty: "MEDIUM",
    },
    {
      conceptName: "Masalah Sosial",
      question: "Masalah sosial yang berkaitan dengan NAPZA adalah...",
      options: [
        "Penyalahgunaan zat adiktif",
        "Pengangguran",
        "Kemiskinan",
        "Kriminalitas",
      ],
      correctIndex: 0,
      difficulty: "EASY",
    },
    {
      conceptName: "Penelitian Sosial",
      question: "Langkah pertama dalam penelitian sosial adalah...",
      options: [
        "Identifikasi masalah",
        "Pengumpulan data",
        "Analisis data",
        "Kesimpulan",
      ],
      correctIndex: 0,
      difficulty: "EASY",
    },
  ],
  SOSIOLOGI: [
    {
      conceptName: "Sosiologi sebagai Ilmu",
      question: "Istilah sosiologi pertama kali dikemukakan oleh...",
      options: ["Auguste Comte", "Emile Durkheim", "Max Weber", "Karl Marx"],
      correctIndex: 0,
      difficulty: "EASY",
    },
    {
      conceptName: "Interaksi Sosial",
      question: "Syarat terjadinya interaksi sosial adalah...",
      options: [
        "Kontak sosial & komunikasi",
        "Status & peran",
        "Norma & nilai",
        "Kelompok & individu",
      ],
      correctIndex: 0,
      difficulty: "EASY",
    },
    {
      conceptName: "Proses Sosial Asosiatif",
      question: "Gotong royong termasuk proses sosial...",
      options: [
        "Asosiatif (kerja sama)",
        "Disasosiatif",
        "Disintegrasi",
        "Konflik",
      ],
      correctIndex: 0,
      difficulty: "EASY",
    },
    {
      conceptName: "Proses Sosial Disasosiatif",
      question: "Tawuran antar warga termasuk proses sosial...",
      options: [
        "Disasosiatif (konflik)",
        "Asosiatif",
        "Asimilasi",
        "Akulturasi",
      ],
      correctIndex: 0,
      difficulty: "EASY",
    },
    {
      conceptName: "Lembaga Sosial",
      question: "Lembaga yang berfungsi mengembangkan iptek adalah...",
      options: ["Pendidikan", "Keluarga", "Agama", "Ekonomi"],
      correctIndex: 0,
      difficulty: "MEDIUM",
    },
    {
      conceptName: "Stratifikasi Sosial",
      question: "Sistem stratifikasi tertutup yang paling ketat adalah...",
      options: ["Kasta", "Kelas", "Golongan", "Pangkat"],
      correctIndex: 0,
      difficulty: "MEDIUM",
    },
    {
      conceptName: "Mobilitas Sosial",
      question:
        "Seorang guru diangkat menjadi kepala sekolah adalah mobilitas...",
      options: [
        "Vertikal naik",
        "Vertikal turun",
        "Horizontal",
        "Antar generasi",
      ],
      correctIndex: 0,
      difficulty: "MEDIUM",
    },
    {
      conceptName: "Faktor Mobilitas",
      question: "Pendidikan yang tinggi merupakan faktor...",
      options: [
        "Pendorong mobilitas sosial",
        "Penghambat mobilitas",
        "Tidak berpengaruh",
        "Memperlambat mobilitas",
      ],
      correctIndex: 0,
      difficulty: "EASY",
    },
    {
      conceptName: "Sosialisasi",
      question: "Agen sosialisasi pertama bagi anak adalah...",
      options: ["Keluarga", "Sekolah", "Media massa", "Teman sebaya"],
      correctIndex: 0,
      difficulty: "EASY",
    },
    {
      conceptName: "Kebudayaan",
      question: "Kebudayaan immaterial berupa...",
      options: [
        "Ide dan nilai",
        "Rumah adat",
        "Senjata tradisional",
        "Pakaian",
      ],
      correctIndex: 0,
      difficulty: "MEDIUM",
    },
    {
      conceptName: "Nilai dan Norma",
      question: "Norma yang sanksinya tegas dan tegas dari negara adalah...",
      options: [
        "Norma hukum",
        "Norma kesusilaan",
        "Norma kesopanan",
        "Norma kebiasaan",
      ],
      correctIndex: 0,
      difficulty: "EASY",
    },
    {
      conceptName: "Multikulturalisme",
      question: "Sikap yang mengagung-agungkan budaya sendiri disebut...",
      options: ["Etnosentrisme", "Primordialisme", "Stereotip", "Diskriminasi"],
      correctIndex: 0,
      difficulty: "MEDIUM",
    },
    {
      conceptName: "Perubahan Sosial",
      question: "Perubahan sosial yang direncanakan disebut...",
      options: ["Planned change", "Unplanned change", "Evolusi", "Revolusi"],
      correctIndex: 0,
      difficulty: "MEDIUM",
    },
    {
      conceptName: "Globalisasi",
      question: "Dampak positif globalisasi di bidang ekonomi adalah...",
      options: [
        "Pertukaran teknologi",
        "Hilangnya budaya lokal",
        "Kesenjangan digital",
        "Kerja paksa",
      ],
      correctIndex: 0,
      difficulty: "EASY",
    },
    {
      conceptName: "Modernisasi",
      question: "Ciri utama modernisasi adalah...",
      options: [
        "Penggunaan teknologi rasional",
        "Pertanian subsisten",
        "Gotong royong",
        "Tradisi lisan",
      ],
      correctIndex: 0,
      difficulty: "MEDIUM",
    },
    {
      conceptName: "Masalah Sosial",
      question: "Masalah sosial yang berkaitan dengan NAPZA adalah...",
      options: [
        "Penyalahgunaan zat adiktif",
        "Pengangguran",
        "Kemiskinan",
        "Kriminalitas",
      ],
      correctIndex: 0,
      difficulty: "EASY",
    },
    {
      conceptName: "Solidaritas Sosial",
      question:
        "Menurut Durkheim, solidaritas pada masyarakat sederhana disebut...",
      options: ["Mekanik", "Organik", "Vertikal", "Horizontal"],
      correctIndex: 0,
      difficulty: "HARD",
    },
    {
      conceptName: "Lembaga Pendidikan",
      question: "Lembaga pendidikan nonformal contohnya...",
      options: [
        "Pusat kegiatan belajar masyarakat",
        "Sekolah dasar",
        "Universitas",
        "Madrasah",
      ],
      correctIndex: 0,
      difficulty: "MEDIUM",
    },
    {
      conceptName: "Dampak Sosial Media",
      question: "Dampak negatif sosial media di antaranya...",
      options: [
        "Hoaks & cyberbullying",
        "Mempercepat komunikasi",
        "Memperluas jaringan",
        "Sumber informasi",
      ],
      correctIndex: 0,
      difficulty: "EASY",
    },
    {
      conceptName: "Sosiologi sebagai Ilmu",
      question: "Sosiologi mempelajari...",
      options: [
        "Gejala sosial & interaksi manusia",
        "Tumbuhan & hewan",
        "Benda mati",
        "Benda langit",
      ],
      correctIndex: 0,
      difficulty: "EASY",
    },
    {
      conceptName: "Interaksi Sosial",
      question: "Syarat terjadinya interaksi sosial adalah...",
      options: [
        "Kontak sosial & komunikasi",
        "Hanya kontak",
        "Hanya komunikasi",
        "Tidak ada syarat",
      ],
      correctIndex: 0,
      difficulty: "EASY",
    },
    {
      conceptName: "Proses Sosial Asosiatif",
      question: "Contoh gotong royong adalah bentuk proses sosial...",
      options: [
        "Asosiatif (kerja sama)",
        "Disasosiatif (konflik)",
        "Vertikal",
        "Horizontal",
      ],
      correctIndex: 0,
      difficulty: "EASY",
    },
    {
      conceptName: "Proses Sosial Disasosiatif",
      question: "Kompetisi dalam pasar termasuk proses sosial...",
      options: [
        "Disasosiatif (persaingan)",
        "Asosiatif",
        "Akulturasi",
        "Akomodasi",
      ],
      correctIndex: 0,
      difficulty: "MEDIUM",
    },
    {
      conceptName: "Faktor Mobilitas",
      question: "Faktor penghambat mobilitas sosial adalah...",
      options: [
        "Diskriminasi & kemiskinan",
        "Pendidikan tinggi",
        "Keahliaan",
        "Keinginan keras",
      ],
      correctIndex: 0,
      difficulty: "MEDIUM",
    },
    {
      conceptName: "Globalisasi",
      question: "Globalisasi di bidang komunikasi ditandai dengan...",
      options: [
        "Internet & media sosial",
        "Surat menyurat",
        "Telepon rumah",
        "Koran lokal",
      ],
      correctIndex: 0,
      difficulty: "EASY",
    },
    {
      conceptName: "Modernisasi",
      question: "Modernisasi berbeda dengan westernisasi karena...",
      options: [
        "Tidak selalu meniru Barat",
        "Selalu meniru Barat",
        "Anti teknologi",
        "Anti perubahan",
      ],
      correctIndex: 0,
      difficulty: "MEDIUM",
    },
    {
      conceptName: "Perubahan Sosial",
      question: "Revolusi adalah perubahan sosial yang...",
      options: [
        "Cepat & mendasar",
        "Lambat & gradual",
        "Tidak direncanakan",
        "Berulang",
      ],
      correctIndex: 0,
      difficulty: "MEDIUM",
    },
  ],
  PPKN: [
    {
      conceptName: "Sejarah Pancasila",
      question: "Tanggal disahkannya Pancasila sebagai dasar negara adalah...",
      options: [
        "18 Agustus 1945",
        "17 Agustus 1945",
        "1 Juni 1945",
        "28 Oktober 1928",
      ],
      correctIndex: 0,
      difficulty: "EASY",
    },
    {
      conceptName: "Sila Pertama",
      question: "Sila pertama Pancasila adalah...",
      options: [
        "Ketuhanan Yang Maha Esa",
        "Kemanusiaan yang Adil dan Beradab",
        "Persatuan Indonesia",
        "Kerakyatan yang Dipimpin oleh Hikmat Kebijaksanaan",
      ],
      correctIndex: 0,
      difficulty: "EASY",
    },
    {
      conceptName: "Sila Kedua",
      question: "Sila kedua menjunjung tinggi...",
      options: [
        "HAM & martabat manusia",
        "Kepentingan bersama",
        "Musyawarah mufakat",
        "Keadilan ekonomi",
      ],
      correctIndex: 0,
      difficulty: "EASY",
    },
    {
      conceptName: "Sila Ketiga",
      question: "Sila ketiga mencerminkan semangat...",
      options: [
        "Nasionalisme & kesatuan bangsa",
        "Demokrasi",
        "Ketuhanan",
        "Keadilan sosial",
      ],
      correctIndex: 0,
      difficulty: "EASY",
    },
    {
      conceptName: "Sila Keempat",
      question: "Musyawarah mufakat adalah pengamalan sila...",
      options: ["Keempat", "Pertama", "Kedua", "Kelima"],
      correctIndex: 0,
      difficulty: "EASY",
    },
    {
      conceptName: "Sila Kelima",
      question: "Sila kelima terkait dengan keadilan...",
      options: ["Sosial & ekonomi", "Hukum", "Politik", "Budaya"],
      correctIndex: 0,
      difficulty: "EASY",
    },
    {
      conceptName: "Struktur UUD 1945",
      question: "UUD 1945 memiliki pembukaan dan...",
      options: [
        "Batang tubuh (pasal-pasal)",
        "Penutup",
        "Lampiran",
        "Aturan tambahan",
      ],
      correctIndex: 0,
      difficulty: "EASY",
    },
    {
      conceptName: "Amandemen UUD 1945",
      question: "Amandemen keempat UUD 1945 dilakukan pada tahun...",
      options: ["2002", "1999", "2000", "2001"],
      correctIndex: 0,
      difficulty: "MEDIUM",
    },
    {
      conceptName: "Lembaga Negara",
      question: "Lembaga yang berwenang menguji undang-undang adalah...",
      options: [
        "Mahkamah Konstitusi (MK)",
        "Mahkamah Agung (MA)",
        "DPR",
        "BPK",
      ],
      correctIndex: 0,
      difficulty: "MEDIUM",
    },
    {
      conceptName: "Hak dan Kewajiban Warga Negara",
      question: "Hak warga negara dalam pendidikan diatur di UUD 1945 pasal...",
      options: ["31", "27", "28", "34"],
      correctIndex: 0,
      difficulty: "HARD",
    },
    {
      conceptName: "Makna Bhinneka Tunggal Ika",
      question: "Bhinneka Tunggal Ika tertulis pada...",
      options: [
        "Pita pada lambang Garuda Pancasila",
        "Batang tubuh UUD 1945",
        "Pembukaan UUD 1945",
        "Lambang negara",
      ],
      correctIndex: 0,
      difficulty: "EASY",
    },
    {
      conceptName: "Keberagaman Indonesia",
      question: "Jumlah bahasa daerah di Indonesia sekitar...",
      options: ["718", "100", "1000", "50"],
      correctIndex: 0,
      difficulty: "MEDIUM",
    },
    {
      conceptName: "Hak Asasi Manusia",
      question: "Deklarasi Universal HAM disahkan PBB pada tahun...",
      options: ["1948", "1945", "1950", "1966"],
      correctIndex: 0,
      difficulty: "MEDIUM",
    },
    {
      conceptName: "Demokrasi Indonesia",
      question: "Pemilu di Indonesia dilakukan setiap...",
      options: [
        "5 tahun sekali",
        "4 tahun sekali",
        "3 tahun sekali",
        "6 tahun sekali",
      ],
      correctIndex: 0,
      difficulty: "EASY",
    },
    {
      conceptName: "Hak & Kewajiban Pajak",
      question: "Pajak diatur dalam UUD 1945 Pasal...",
      options: ["23A", "27", "31", "33"],
      correctIndex: 0,
      difficulty: "HARD",
    },
    {
      conceptName: "Sila Kedua",
      question: "Pengamalan sila kedua di sekolah contohnya...",
      options: [
        "Tidak membully teman",
        "Berdoa sebelum belajar",
        "Musyawarah kelas",
        "Gotong royong",
      ],
      correctIndex: 0,
      difficulty: "EASY",
    },
    {
      conceptName: "Sila Ketiga",
      question: "Bhinneka Tunggal Ika artinya...",
      options: [
        "Berbeda-beda tetap satu",
        "Satu bangsa satu bahasa",
        "Bersatu dalam perbedaan",
        "Persatuan Indonesia",
      ],
      correctIndex: 0,
      difficulty: "EASY",
    },
    {
      conceptName: "Sila Keempat",
      question: "Musyawarah untuk mufakat mencerminkan pengamalan sila ke...",
      options: ["Empat", "Satu", "Dua", "Lima"],
      correctIndex: 0,
      difficulty: "EASY",
    },
    {
      conceptName: "Sila Kelima",
      question: "Pembangunan yang merata adalah pengamalan sila...",
      options: ["Kelima", "Pertama", "Kedua", "Ketiga"],
      correctIndex: 0,
      difficulty: "EASY",
    },
    {
      conceptName: "Amandemen UUD 1945",
      question: "Amandemen pertama UUD 1945 terjadi pada tahun...",
      options: ["1999", "2000", "2001", "2002"],
      correctIndex: 0,
      difficulty: "MEDIUM",
    },
    {
      conceptName: "Lembaga Negara",
      question: "Lembaga yang berwenang membentuk undang-undang adalah...",
      options: ["DPR", "MA", "MK", "BPK"],
      correctIndex: 0,
      difficulty: "EASY",
    },
    {
      conceptName: "Makna Bhinneka Tunggal Ika",
      question: "Semboyan Bhinneka Tunggal Ika tertulis pada lambang...",
      options: [
        "Garuda Pancasila",
        "Bendera Merah Putih",
        "UUD 1945",
        "Burung Cendrawasih",
      ],
      correctIndex: 0,
      difficulty: "EASY",
    },
    {
      conceptName: "Ancaman terhadap Persatuan",
      question: "Contoh paham radikal di Indonesia adalah...",
      options: [
        "Intoleransi terhadap perbedaan agama",
        "Menghormati budaya daerah",
        "Gotong royong",
        "Musyawarah",
      ],
      correctIndex: 0,
      difficulty: "MEDIUM",
    },
    {
      conceptName: "Hak Asasi Manusia",
      question: "Hak untuk hidup aman dan tenteram adalah...",
      options: ["Hak asasi manusia", "Hak cipta", "Hak paten", "Hak milik"],
      correctIndex: 0,
      difficulty: "EASY",
    },
    {
      conceptName: "Warga Negara Indonesia",
      question: "Warga negara Indonesia meliputi...",
      options: [
        "Keturunan Indonesia & yang dinaturalisasi",
        "Orang asing yang tinggal",
        "Wisatawan",
        "Diplomat",
      ],
      correctIndex: 0,
      difficulty: "MEDIUM",
    },
    {
      conceptName: "Kedaulatan Negara",
      question:
        "Kedaulatan Indonesia berdasarkan UUD 1945 adalah kedaulatan...",
      options: ["Rakyat", "Presiden", "Tuhan", "Militer"],
      correctIndex: 0,
      difficulty: "EASY",
    },
    {
      conceptName: "Demokrasi Indonesia",
      question: "Pemilu di Indonesia dilaksanakan setiap...",
      options: [
        "5 tahun sekali",
        "4 tahun sekali",
        "3 tahun sekali",
        "6 tahun sekali",
      ],
      correctIndex: 0,
      difficulty: "EASY",
    },
    {
      conceptName: "Otonomi Daerah",
      question: "UU yang mengatur otonomi daerah terbaru adalah...",
      options: ["UU 23/2014", "UU 22/1999", "UU 32/2004", "UU 5/1974"],
      correctIndex: 0,
      difficulty: "HARD",
    },
    {
      conceptName: "Keberagaman Indonesia",
      question: "Contoh kerja bakti membersihkan lingkungan mencerminkan...",
      options: ["Gotong royong", "Individualisme", "Kompetisi", "Diskriminasi"],
      correctIndex: 0,
      difficulty: "EASY",
    },
    {
      conceptName: "Hak dan Kewajiban Warga Negara",
      question: "Kewajiban warga negara dalam bidang pendidikan adalah...",
      options: [
        "Mengikuti wajib belajar 12 tahun",
        "Menerima beasiswa",
        "Mendirikan sekolah",
        "Memilih sekolah",
      ],
      correctIndex: 0,
      difficulty: "MEDIUM",
    },
  ],
};

const PREREQUISITES_BY_SUBJECT: Record<
  string,
  { dependent: string; prerequisite: string; minMasteryScore?: number }[]
> = {
  SEJARAH: [
    {
      dependent: "Periode Neolithicum",
      prerequisite: "Manusia Purba",
      minMasteryScore: 0.6,
    },
    {
      dependent: "Peradaban Awal Nusantara",
      prerequisite: "Periode Neolithicum",
      minMasteryScore: 0.6,
    },
    {
      dependent: "Kerajaan Hindu-Buddha",
      prerequisite: "Peradaban Awal Nusantara",
      minMasteryScore: 0.65,
    },
    {
      dependent: "Masuknya Islam ke Indonesia",
      prerequisite: "Kerajaan Hindu-Buddha",
      minMasteryScore: 0.65,
    },
    {
      dependent: "Kerajaan Islam Nusantara",
      prerequisite: "Masuknya Islam ke Indonesia",
      minMasteryScore: 0.65,
    },
    {
      dependent: "Kedatangan Portugis",
      prerequisite: "Kerajaan Islam Nusantara",
      minMasteryScore: 0.65,
    },
    {
      dependent: "VOC dan Tanam Paksa",
      prerequisite: "Kedatangan Portugis",
      minMasteryScore: 0.65,
    },
    {
      dependent: "Perlawanan Rakyat",
      prerequisite: "VOC dan Tanam Paksa",
      minMasteryScore: 0.7,
    },
    {
      dependent: "Kebangkitan Nasional",
      prerequisite: "Perlawanan Rakyat",
      minMasteryScore: 0.7,
    },
    {
      dependent: "Proklamasi Kemerdekaan",
      prerequisite: "Kebangkitan Nasional",
      minMasteryScore: 0.7,
    },
    {
      dependent: "Masa Revolusi",
      prerequisite: "Proklamasi Kemerdekaan",
      minMasteryScore: 0.7,
    },
    {
      dependent: "Demokrasi Terpimpin",
      prerequisite: "Masa Revolusi",
      minMasteryScore: 0.7,
    },
    {
      dependent: "Orde Baru",
      prerequisite: "Demokrasi Terpimpin",
      minMasteryScore: 0.7,
    },
    {
      dependent: "Krisis 1998",
      prerequisite: "Orde Baru",
      minMasteryScore: 0.7,
    },
    {
      dependent: "Era Reformasi",
      prerequisite: "Krisis 1998",
      minMasteryScore: 0.7,
    },
  ],
  GEOGRAFI: [
    {
      dependent: "Gempa Bumi",
      prerequisite: "Lempeng Tektonik",
      minMasteryScore: 0.6,
    },
    {
      dependent: "Vulkanisme",
      prerequisite: "Lempeng Tektonik",
      minMasteryScore: 0.6,
    },
    {
      dependent: "Iklim dan Cuaca",
      prerequisite: "Angin Monsun",
      minMasteryScore: 0.6,
    },
    {
      dependent: "Angin Monsun",
      prerequisite: "Hidrosfer",
      minMasteryScore: 0.6,
    },
    {
      dependent: "Hidrosfer",
      prerequisite: "Iklim dan Cuaca",
      minMasteryScore: 0.6,
    },
    {
      dependent: "Piramida Penduduk",
      prerequisite: "Pertumbuhan Penduduk",
      minMasteryScore: 0.6,
    },
    {
      dependent: "Urbanisasi",
      prerequisite: "Pertumbuhan Penduduk",
      minMasteryScore: 0.6,
    },
    {
      dependent: "Pola Permukiman",
      prerequisite: "Urbanisasi",
      minMasteryScore: 0.65,
    },
    {
      dependent: "Karakteristik Pulau Besar",
      prerequisite: "Kondisi Geografis Indonesia",
      minMasteryScore: 0.6,
    },
    {
      dependent: "Iklim Indonesia",
      prerequisite: "Kondisi Geografis Indonesia",
      minMasteryScore: 0.6,
    },
    {
      dependent: "Pemanasan Global",
      prerequisite: "Sumber Daya Alam",
      minMasteryScore: 0.65,
    },
    {
      dependent: "Pencemaran Lingkungan",
      prerequisite: "Sumber Daya Alam",
      minMasteryScore: 0.65,
    },
    {
      dependent: "Pelestarian Lingkungan",
      prerequisite: "Pencemaran Lingkungan",
      minMasteryScore: 0.7,
    },
  ],
  EKONOMI: [
    {
      dependent: "Kelangkaan",
      prerequisite: "Kebutuhan Manusia",
      minMasteryScore: 0.6,
    },
    {
      dependent: "Sistem Ekonomi",
      prerequisite: "Kelangkaan",
      minMasteryScore: 0.6,
    },
    {
      dependent: "Pelaku Ekonomi",
      prerequisite: "Sistem Ekonomi",
      minMasteryScore: 0.6,
    },
    {
      dependent: "Penawaran",
      prerequisite: "Permintaan",
      minMasteryScore: 0.65,
    },
    {
      dependent: "Keseimbangan Pasar",
      prerequisite: "Permintaan",
      minMasteryScore: 0.65,
    },
    {
      dependent: "Keseimbangan Pasar",
      prerequisite: "Penawaran",
      minMasteryScore: 0.65,
    },
    {
      dependent: "Elastisitas",
      prerequisite: "Permintaan",
      minMasteryScore: 0.7,
    },
    {
      dependent: "Biaya Produksi",
      prerequisite: "Pasar Persaingan",
      minMasteryScore: 0.7,
    },
    {
      dependent: "Pasar Persaingan",
      prerequisite: "Keseimbangan Pasar",
      minMasteryScore: 0.7,
    },
    {
      dependent: "Inflasi",
      prerequisite: "Produk Domestik Bruto",
      minMasteryScore: 0.65,
    },
    {
      dependent: "Pengangguran",
      prerequisite: "Produk Domestik Bruto",
      minMasteryScore: 0.65,
    },
    {
      dependent: "Kebijakan Fiskal",
      prerequisite: "Inflasi",
      minMasteryScore: 0.7,
    },
    {
      dependent: "Kebijakan Moneter",
      prerequisite: "Inflasi",
      minMasteryScore: 0.7,
    },
    {
      dependent: "Otoritas Jasa Keuangan",
      prerequisite: "Bank & Lembaga Keuangan",
      minMasteryScore: 0.65,
    },
    {
      dependent: "Investasi & Saham",
      prerequisite: "Otoritas Jasa Keuangan",
      minMasteryScore: 0.7,
    },
  ],
  SOSIOLOGI: [
    {
      dependent: "Interaksi Sosial",
      prerequisite: "Sosiologi sebagai Ilmu",
      minMasteryScore: 0.6,
    },
    {
      dependent: "Proses Sosial Asosiatif",
      prerequisite: "Interaksi Sosial",
      minMasteryScore: 0.65,
    },
    {
      dependent: "Proses Sosial Disasosiatif",
      prerequisite: "Interaksi Sosial",
      minMasteryScore: 0.65,
    },
    {
      dependent: "Lembaga Sosial",
      prerequisite: "Proses Sosial Asosiatif",
      minMasteryScore: 0.7,
    },
    {
      dependent: "Stratifikasi Sosial",
      prerequisite: "Lembaga Sosial",
      minMasteryScore: 0.65,
    },
    {
      dependent: "Mobilitas Sosial",
      prerequisite: "Stratifikasi Sosial",
      minMasteryScore: 0.7,
    },
    {
      dependent: "Faktor Mobilitas",
      prerequisite: "Mobilitas Sosial",
      minMasteryScore: 0.7,
    },
    {
      dependent: "Sosialisasi",
      prerequisite: "Lembaga Sosial",
      minMasteryScore: 0.65,
    },
    {
      dependent: "Kebudayaan",
      prerequisite: "Sosialisasi",
      minMasteryScore: 0.65,
    },
    {
      dependent: "Nilai dan Norma",
      prerequisite: "Kebudayaan",
      minMasteryScore: 0.7,
    },
    {
      dependent: "Multikulturalisme",
      prerequisite: "Nilai dan Norma",
      minMasteryScore: 0.7,
    },
    {
      dependent: "Perubahan Sosial",
      prerequisite: "Multikulturalisme",
      minMasteryScore: 0.7,
    },
    {
      dependent: "Globalisasi",
      prerequisite: "Perubahan Sosial",
      minMasteryScore: 0.7,
    },
    {
      dependent: "Modernisasi",
      prerequisite: "Globalisasi",
      minMasteryScore: 0.7,
    },
    {
      dependent: "Masalah Sosial",
      prerequisite: "Perubahan Sosial",
      minMasteryScore: 0.7,
    },
  ],
  PPKN: [
    {
      dependent: "Sila Kedua",
      prerequisite: "Sila Pertama",
      minMasteryScore: 0.6,
    },
    {
      dependent: "Sila Ketiga",
      prerequisite: "Sila Kedua",
      minMasteryScore: 0.6,
    },
    {
      dependent: "Sila Keempat",
      prerequisite: "Sila Ketiga",
      minMasteryScore: 0.6,
    },
    {
      dependent: "Sila Kelima",
      prerequisite: "Sila Keempat",
      minMasteryScore: 0.6,
    },
    {
      dependent: "Struktur UUD 1945",
      prerequisite: "Sila Kelima",
      minMasteryScore: 0.65,
    },
    {
      dependent: "Amandemen UUD 1945",
      prerequisite: "Struktur UUD 1945",
      minMasteryScore: 0.7,
    },
    {
      dependent: "Lembaga Negara",
      prerequisite: "Amandemen UUD 1945",
      minMasteryScore: 0.7,
    },
    {
      dependent: "Hak dan Kewajiban Warga Negara",
      prerequisite: "Lembaga Negara",
      minMasteryScore: 0.7,
    },
    {
      dependent: "Keberagaman Indonesia",
      prerequisite: "Makna Bhinneka Tunggal Ika",
      minMasteryScore: 0.65,
    },
    {
      dependent: "Ancaman terhadap Persatuan",
      prerequisite: "Keberagaman Indonesia",
      minMasteryScore: 0.7,
    },
    {
      dependent: "Hak Asasi Manusia",
      prerequisite: "Hak dan Kewajiban Warga Negara",
      minMasteryScore: 0.7,
    },
    {
      dependent: "Warga Negara Indonesia",
      prerequisite: "Hak Asasi Manusia",
      minMasteryScore: 0.65,
    },
    {
      dependent: "Kedaulatan Negara",
      prerequisite: "Warga Negara Indonesia",
      minMasteryScore: 0.7,
    },
    {
      dependent: "Demokrasi Indonesia",
      prerequisite: "Kedaulatan Negara",
      minMasteryScore: 0.7,
    },
    {
      dependent: "Otonomi Daerah",
      prerequisite: "Demokrasi Indonesia",
      minMasteryScore: 0.7,
    },
  ],
};

async function ensureTopics(subjects: Record<string, { id: string }>) {
  const topicDefs: Record<
    string,
    { subjectSlug: string; name: string; slug: string; order: number }[]
  > = {
    MATEMATIKA: [
      { subjectSlug: "MATEMATIKA", name: "Aljabar", slug: "aljabar", order: 1 },
      {
        subjectSlug: "MATEMATIKA",
        name: "Geometri",
        slug: "geometri",
        order: 2,
      },
      {
        subjectSlug: "MATEMATIKA",
        name: "Trigonometri",
        slug: "trigonometri",
        order: 3,
      },
      {
        subjectSlug: "MATEMATIKA",
        name: "Kalkulus",
        slug: "kalkulus",
        order: 4,
      },
      {
        subjectSlug: "MATEMATIKA",
        name: "Statistika",
        slug: "statistika",
        order: 5,
      },
    ],
    BAHASA_INDONESIA: [
      {
        subjectSlug: "BAHASA_INDONESIA",
        name: "Tata Bahasa",
        slug: "tata-bahasa",
        order: 1,
      },
      {
        subjectSlug: "BAHASA_INDONESIA",
        name: "Sastra",
        slug: "sastra",
        order: 2,
      },
      {
        subjectSlug: "BAHASA_INDONESIA",
        name: "Menulis",
        slug: "menulis",
        order: 3,
      },
      {
        subjectSlug: "BAHASA_INDONESIA",
        name: "Membaca",
        slug: "membaca",
        order: 4,
      },
    ],
    BAHASA_INGGRIS: [
      {
        subjectSlug: "BAHASA_INGGRIS",
        name: "Grammar",
        slug: "grammar",
        order: 1,
      },
      {
        subjectSlug: "BAHASA_INGGRIS",
        name: "Vocabulary",
        slug: "vocabulary",
        order: 2,
      },
      {
        subjectSlug: "BAHASA_INGGRIS",
        name: "Reading",
        slug: "reading",
        order: 3,
      },
      {
        subjectSlug: "BAHASA_INGGRIS",
        name: "Writing",
        slug: "writing",
        order: 4,
      },
    ],
    IPA: [
      { subjectSlug: "IPA", name: "Fisika", slug: "fisika", order: 1 },
      { subjectSlug: "IPA", name: "Kimia", slug: "kimia", order: 2 },
      { subjectSlug: "IPA", name: "Biologi", slug: "biologi", order: 3 },
    ],
    SEJARAH: [
      {
        subjectSlug: "SEJARAH",
        name: "Indonesia Purba & Awal Peradaban",
        slug: "indonesia-purba",
        order: 1,
      },
      {
        subjectSlug: "SEJARAH",
        name: "Masa Hindu-Buddha & Islam",
        slug: "hindu-buddha-islam",
        order: 2,
      },
      {
        subjectSlug: "SEJARAH",
        name: "Kolonialisme & Kemerdekaan",
        slug: "kolonialisme-kemerdekaan",
        order: 3,
      },
      {
        subjectSlug: "SEJARAH",
        name: "Orde Baru & Reformasi",
        slug: "orde-baru-reformasi",
        order: 4,
      },
    ],
    GEOGRAFI: [
      {
        subjectSlug: "GEOGRAFI",
        name: "Geografi Fisik",
        slug: "geografi-fisik",
        order: 1,
      },
      {
        subjectSlug: "GEOGRAFI",
        name: "Geografi Manusia",
        slug: "geografi-manusia",
        order: 2,
      },
      {
        subjectSlug: "GEOGRAFI",
        name: "Geografi Regional Indonesia",
        slug: "geografi-regional",
        order: 3,
      },
      {
        subjectSlug: "GEOGRAFI",
        name: "Lingkungan & Sumber Daya",
        slug: "lingkungan-sda",
        order: 4,
      },
    ],
    EKONOMI: [
      {
        subjectSlug: "EKONOMI",
        name: "Konsep Dasar Ekonomi",
        slug: "konsep-dasar",
        order: 1,
      },
      {
        subjectSlug: "EKONOMI",
        name: "Ekonomi Mikro",
        slug: "ekonomi-mikro",
        order: 2,
      },
      {
        subjectSlug: "EKONOMI",
        name: "Ekonomi Makro",
        slug: "ekonomi-makro",
        order: 3,
      },
      {
        subjectSlug: "EKONOMI",
        name: "Keuangan & Pasar Modal",
        slug: "keuangan-pasar-modal",
        order: 4,
      },
    ],
    SOSIOLOGI: [
      {
        subjectSlug: "SOSIOLOGI",
        name: "Individu, Kelompok & Interaksi",
        slug: "individu-kelompok",
        order: 1,
      },
      {
        subjectSlug: "SOSIOLOGI",
        name: "Stratifikasi & Mobilitas Sosial",
        slug: "stratifikasi-mobilitas",
        order: 2,
      },
      {
        subjectSlug: "SOSIOLOGI",
        name: "Sosialisasi & Kebudayaan",
        slug: "sosialisasi-kebudayaan",
        order: 3,
      },
      {
        subjectSlug: "SOSIOLOGI",
        name: "Perubahan Sosial & Masyarakat",
        slug: "perubahan-sosial",
        order: 4,
      },
    ],
    PPKN: [
      { subjectSlug: "PPKN", name: "Pancasila", slug: "pancasila", order: 1 },
      { subjectSlug: "PPKN", name: "UUD 1945", slug: "uud-1945", order: 2 },
      {
        subjectSlug: "PPKN",
        name: "Bhinneka Tunggal Ika",
        slug: "bhinneka-tunggal-ika",
        order: 3,
      },
      {
        subjectSlug: "PPKN",
        name: "Negara & Warga Negara",
        slug: "negara-warga-negara",
        order: 4,
      },
    ],
  };

  const topicMap: Record<string, Record<string, { id: string }>> = {};

  for (const [subjectSlug, topics] of Object.entries(topicDefs)) {
    topicMap[subjectSlug] = {};
    const subjId = subjects[subjectSlug].id;
    for (const t of topics) {
      const topic = await prisma.topic.upsert({
        where: { subjectId_slug: { subjectId: subjId, slug: t.slug } },
        update: {},
        create: {
          name: t.name,
          slug: t.slug,
          order: t.order,
          subjectId: subjId,
        },
      });
      topicMap[subjectSlug][t.slug] = { id: topic.id };
    }
  }
  return topicMap;
}

async function seedConcepts(
  subjects: Record<string, { id: string }>,
  topicMap: Record<string, Record<string, { id: string }>>,
) {
  for (const [subjectSlug, concepts] of Object.entries(CONCEPTS_BY_SUBJECT)) {
    const _subjId = subjects[subjectSlug].id;
    for (const c of concepts) {
      const topicId = topicMap[subjectSlug]?.[c.topicSlug]?.id;
      if (!topicId) {
        console.warn(`Topic ${c.topicSlug} not found for ${subjectSlug}`);
        continue;
      }
      const slug = c.name.toLowerCase().replace(/\s+/g, "-");
      await prisma.concept.upsert({
        where: { topicId_slug: { topicId, slug } },
        update: {},
        create: {
          name: c.name,
          slug,
          description: c.description,
          contentMd: c.contentMd,
          topicId,
        },
      });
    }
    console.log(`Concepts created for ${subjectSlug}: ${concepts.length}`);
  }
}

async function seedPrerequisites() {
  const allConcepts = await prisma.concept.findMany({
    select: {
      id: true,
      name: true,
      topic: { select: { subject: { select: { slug: true } } } },
    },
  });
  const conceptKey = new Map<string, string>();
  for (const c of allConcepts) {
    conceptKey.set(`${c.topic.subject.slug}::${c.name}`, c.id);
  }

  let total = 0;
  for (const [subjectSlug, edges] of Object.entries(PREREQUISITES_BY_SUBJECT)) {
    for (const edge of edges) {
      const dependentId = conceptKey.get(`${subjectSlug}::${edge.dependent}`);
      const prerequisiteId = conceptKey.get(
        `${subjectSlug}::${edge.prerequisite}`,
      );
      if (!dependentId || !prerequisiteId) {
        console.warn(
          `[prereq] ${subjectSlug}: missing "${edge.dependent}" or "${edge.prerequisite}"`,
        );
        continue;
      }
      if (dependentId === prerequisiteId) continue;
      await prisma.conceptPrerequisite.upsert({
        where: {
          prerequisiteId_conceptId: {
            prerequisiteId,
            conceptId: dependentId,
          },
        },
        update: { minMasteryScore: edge.minMasteryScore ?? 0.7 },
        create: {
          prerequisiteId,
          conceptId: dependentId,
          minMasteryScore: edge.minMasteryScore ?? 0.7,
        },
      });
      total++;
    }
  }
  console.log(`Prerequisites seeded: ${total}`);
}

async function generateAndSeedEmbeddings() {
  const concepts = await prisma.concept.findMany();
  const texts = concepts.map(
    (c) =>
      `Konsep: ${c.name}. Deskripsi: ${c.description}. ${c.contentMd || ""}`,
  );

  if (texts.length === 0) return;

  console.log(`Generating ${texts.length} embeddings...`);
  try {
    const { embeddings } = await embedMany({
      model: embeddingModel,
      values: texts,
    });

    for (let i = 0; i < concepts.length; i++) {
      const existing = await prisma.conceptEmbedding.findUnique({
        where: { conceptId: concepts[i].id },
      });
      if (!existing) {
        await prisma.conceptEmbedding.create({
          data: {
            conceptId: concepts[i].id,
            embedding: JSON.stringify(embeddings[i]),
          },
        });
      }
    }
    console.log(`Embeddings seeded for ${concepts.length} concepts`);
  } catch (e: any) {
    console.warn(
      "Embedding generation failed (maybe provider doesn't support embeddings):",
      e.message,
    );
    console.warn(
      "Skipping embeddings for now. RAG will fall back to keyword search.",
    );
  }
}

async function seedQuestions(
  subjects: Record<string, { id: string }>,
  _topicMap: Record<string, Record<string, { id: string }>>,
) {
  let total = 0;

  const concepts = await prisma.concept.findMany();
  const conceptByName: Record<string, string> = {};
  const conceptContent: Record<string, string> = {};
  for (const c of concepts) {
    conceptByName[c.name] = c.id;
    conceptContent[c.name] = c.contentMd ?? c.description ?? c.name;
  }

  for (const [subjectSlug, questions] of Object.entries(QUESTIONS_BY_SUBJECT)) {
    const _subjId = subjects[subjectSlug].id;

    for (const q of questions) {
      const conceptId = conceptByName[q.conceptName];
      if (!conceptId) {
        console.warn(`Concept "${q.conceptName}" not found, skipping question`);
        continue;
      }
      const conceptName = q.conceptName;
      const conceptBody = conceptContent[conceptName] ?? "";

      const existing = await prisma.question.findFirst({
        where: { conceptId, questionText: q.question },
        select: { id: true },
      });
      const data = {
        conceptId,
        questionText: q.question,
        type: "MULTIPLE_CHOICE" as const,
        options: q.options,
        correctAnswer: String.fromCharCode(65 + q.correctIndex),
        difficulty: q.difficulty,
        explanation: buildExplanation(q, conceptName, conceptBody),
        hint: buildHint(conceptName, q.difficulty),
        commonMisconceptions: buildMisconceptions(q, conceptName, conceptBody),
      };
      if (existing) {
        await prisma.question.update({ where: { id: existing.id }, data });
      } else {
        await prisma.question.create({ data });
      }
      total++;
    }
    console.log(`Questions created for ${subjectSlug}: ${questions.length}`);
  }
  console.log(`Total questions: ${total}`);

  // Backfill: isi explanation/hint/commonMisconceptions untuk question
  // yang udah ada tapi belum punya (mis. dari seed lama sebelum fase 6.3).
  const allQuestions = await prisma.question.findMany({
    where: {
      OR: [
        { explanation: null },
        { hint: null },
        { commonMisconceptions: null },
      ],
    },
    select: {
      id: true,
      questionText: true,
      options: true,
      correctAnswer: true,
      difficulty: true,
      concept: { select: { name: true, contentMd: true, description: true } },
    },
  });
  let backfilled = 0;
  for (const q of allQuestions) {
    const options = Array.isArray(q.options) ? (q.options as string[]) : [];
    const correctIndex = options.findIndex(
      (opt) => typeof opt === "string" && opt.trim() === q.correctAnswer.trim(),
    );
    if (correctIndex < 0) continue;
    const synthetic: QSeed = {
      question: q.questionText,
      options,
      correctIndex,
      difficulty: (q.difficulty as "EASY" | "MEDIUM" | "HARD") ?? "MEDIUM",
    };
    const conceptName = q.concept.name;
    const conceptBody = q.concept.contentMd ?? q.concept.description ?? "";
    await prisma.question.update({
      where: { id: q.id },
      data: {
        explanation: buildExplanation(synthetic, conceptName, conceptBody),
        hint: buildHint(conceptName, synthetic.difficulty),
        commonMisconceptions: buildMisconceptions(
          synthetic,
          conceptName,
          conceptBody,
        ),
      },
    });
    backfilled++;
  }
  console.log(
    `Questions backfilled with explanation/hint/misconceptions: ${backfilled}`,
  );
}

async function main() {
  console.log("Seeding database...");

  const adminPassword = await bcrypt.hash("admin123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@sparkai.id" },
    update: {},
    create: {
      email: "admin@sparkai.id",
      name: "Admin Spark",
      passwordHash: adminPassword,
      role: "ADMIN",
    },
  });
  console.log("Admin created:", admin.email);

  const subjectData = await Promise.all(
    [
      {
        slug: "MATEMATIKA" as const,
        name: "Matematika",
        description: "Aljabar, Geometri, Trigonometri, Kalkulus, Statistika",
        icon: "📐",
        color: "#3B82F6",
        order: 1,
      },
      {
        slug: "BAHASA_INDONESIA" as const,
        name: "Bahasa Indonesia",
        description: "Tata bahasa, sastra, menulis, membaca",
        icon: "📖",
        color: "#EF4444",
        order: 2,
      },
      {
        slug: "BAHASA_INGGRIS" as const,
        name: "Bahasa Inggris",
        description: "Grammar, vocabulary, reading, writing, speaking",
        icon: "🌍",
        color: "#F59E0B",
        order: 3,
      },
      {
        slug: "IPA" as const,
        name: "Ilmu Pengetahuan Alam",
        description: "Fisika, Kimia, Biologi",
        icon: "🔬",
        color: "#10B981",
        order: 4,
      },
      {
        slug: "SEJARAH" as const,
        name: "Sejarah",
        description: "Sejarah Indonesia dari masa purba hingga reformasi",
        icon: "📜",
        color: "#92400E",
        order: 5,
      },
      {
        slug: "GEOGRAFI" as const,
        name: "Geografi",
        description:
          "Geografi fisik, manusia, regional Indonesia, dan lingkungan",
        icon: "🌏",
        color: "#0EA5E9",
        order: 6,
      },
      {
        slug: "EKONOMI" as const,
        name: "Ekonomi",
        description: "Konsep dasar, ekonomi mikro, makro, dan pasar modal",
        icon: "💰",
        color: "#16A34A",
        order: 7,
      },
      {
        slug: "SOSIOLOGI" as const,
        name: "Sosiologi",
        description:
          "Interaksi sosial, stratifikasi, budaya, dan perubahan sosial",
        icon: "👥",
        color: "#DB2777",
        order: 8,
      },
      {
        slug: "PPKN" as const,
        name: "PPKN",
        description:
          "Pancasila, UUD 1945, Bhinneka Tunggal Ika, dan warga negara",
        icon: "🇮🇩",
        color: "#DC2626",
        order: 9,
      },
    ].map((s) =>
      prisma.subject.upsert({ where: { slug: s.slug }, update: {}, create: s }),
    ),
  );
  console.log("Subjects created:", subjectData.length);

  const subjects: Record<string, { id: string }> = {};
  for (const s of subjectData) {
    subjects[s.slug] = { id: s.id };
  }

  const topicMap = await ensureTopics(subjects);
  console.log("Topics created");

  const levels = await Promise.all(
    [
      { level: 1, name: "Pemula", minXp: 0, maxXp: 100 },
      { level: 2, name: "Pemula", minXp: 100, maxXp: 250 },
      { level: 3, name: "Pemula", minXp: 250, maxXp: 500 },
      { level: 4, name: "Pemula", minXp: 500, maxXp: 800 },
      { level: 5, name: "Pemula", minXp: 800, maxXp: 1200 },
      { level: 6, name: "Penjelajah", minXp: 1200, maxXp: 1800 },
      { level: 7, name: "Penjelajah", minXp: 1800, maxXp: 2500 },
      { level: 8, name: "Penjelajah", minXp: 2500, maxXp: 3500 },
      { level: 9, name: "Penjelajah", minXp: 3500, maxXp: 5000 },
      { level: 10, name: "Penjelajah", minXp: 5000, maxXp: 7000 },
      { level: 11, name: "Pejuang", minXp: 7000, maxXp: 9500 },
      { level: 12, name: "Pejuang", minXp: 9500, maxXp: 12500 },
      { level: 13, name: "Pejuang", minXp: 12500, maxXp: 16000 },
      { level: 14, name: "Pejuang", minXp: 16000, maxXp: 20000 },
      { level: 15, name: "Pejuang", minXp: 20000, maxXp: 25000 },
      { level: 16, name: "Ahli", minXp: 25000, maxXp: 31000 },
      { level: 17, name: "Ahli", minXp: 31000, maxXp: 38000 },
      { level: 18, name: "Ahli", minXp: 38000, maxXp: 46000 },
      { level: 19, name: "Ahli", minXp: 46000, maxXp: 55000 },
      { level: 20, name: "Ahli", minXp: 55000, maxXp: 65000 },
      { level: 21, name: "Ahli", minXp: 65000, maxXp: 77000 },
      { level: 22, name: "Ahli", minXp: 77000, maxXp: 91000 },
      { level: 23, name: "Ahli", minXp: 91000, maxXp: 107000 },
      { level: 24, name: "Ahli", minXp: 107000, maxXp: 125000 },
      { level: 25, name: "Ahli", minXp: 125000, maxXp: 145000 },
      { level: 26, name: "Ahli", minXp: 145000, maxXp: 167000 },
      { level: 27, name: "Ahli", minXp: 167000, maxXp: 191000 },
      { level: 28, name: "Ahli", minXp: 191000, maxXp: 217000 },
      { level: 29, name: "Ahli", minXp: 217000, maxXp: 245000 },
      { level: 30, name: "Maestro", minXp: 245000, maxXp: 275000 },
      { level: 31, name: "Maestro", minXp: 275000, maxXp: 307000 },
      { level: 32, name: "Maestro", minXp: 307000, maxXp: 341000 },
      { level: 33, name: "Maestro", minXp: 341000, maxXp: 377000 },
      { level: 34, name: "Maestro", minXp: 377000, maxXp: 415000 },
      { level: 35, name: "Maestro", minXp: 415000, maxXp: 455000 },
      { level: 36, name: "Maestro", minXp: 455000, maxXp: 497000 },
      { level: 37, name: "Maestro", minXp: 497000, maxXp: 541000 },
      { level: 38, name: "Maestro", minXp: 541000, maxXp: 587000 },
      { level: 39, name: "Maestro", minXp: 587000, maxXp: 635000 },
      { level: 40, name: "Maestro", minXp: 635000, maxXp: 685000 },
      { level: 41, name: "Maestro", minXp: 685000, maxXp: 737000 },
      { level: 42, name: "Maestro", minXp: 737000, maxXp: 791000 },
      { level: 43, name: "Maestro", minXp: 791000, maxXp: 847000 },
      { level: 44, name: "Maestro", minXp: 847000, maxXp: 905000 },
      { level: 45, name: "Maestro", minXp: 905000, maxXp: 965000 },
      { level: 46, name: "Legenda", minXp: 965000, maxXp: 1027000 },
      { level: 47, name: "Legenda", minXp: 1027000, maxXp: 1091000 },
      { level: 48, name: "Legenda", minXp: 1091000, maxXp: 1157000 },
      { level: 49, name: "Legenda", minXp: 1157000, maxXp: 1225000 },
      { level: 50, name: "Legenda", minXp: 1225000, maxXp: 9999999 },
    ].map((l) =>
      prisma.level.upsert({ where: { level: l.level }, update: {}, create: l }),
    ),
  );
  console.log("Levels created:", levels.length);

  const badges = await Promise.all(
    [
      {
        name: "Penakluk Trigonometri",
        description: "Kuasai semua konsep Trigonometri",
        category: "AKADEMIK" as const,
        xpReward: 200,
      },
      {
        name: "Teman Aljabar",
        description: "Kuasai semua konsep Aljabar",
        category: "AKADEMIK" as const,
        xpReward: 200,
      },
      {
        name: "Penjelajah Tata Bahasa",
        description: "Selesaikan semua topik Bahasa Indonesia",
        category: "AKADEMIK" as const,
        xpReward: 200,
      },
      {
        name: "Grammar Hero",
        description: "Kuasai 10 konsep Bahasa Inggris",
        category: "AKADEMIK" as const,
        xpReward: 150,
      },
      {
        name: "Ilmuwan Cilik",
        description: "Kuasai semua konsep IPA",
        category: "AKADEMIK" as const,
        xpReward: 200,
      },
      {
        name: "Streak Master 7 Hari",
        description: "Belajar 7 hari berturut-turut",
        category: "KEBIASAAN" as const,
        xpReward: 100,
      },
      {
        name: "Konsisten 30 Hari",
        description: "Belajar 30 hari berturut-turut",
        category: "KEBIASAAN" as const,
        xpReward: 500,
      },
      {
        name: "Pagi yang Produktif",
        description: "Belajar sebelum jam 6 pagi",
        category: "KEBIASAAN" as const,
        xpReward: 50,
      },
      {
        name: "Penanya Ulung",
        description: "Tanyakan 50 pertanyaan di mode Socratic",
        category: "KEBERANIAN" as const,
        xpReward: 150,
      },
      {
        name: "Pemikir Kritis",
        description: "Jawab 100 soal dengan benar berturut-turut",
        category: "KEBERANIAN" as const,
        xpReward: 300,
      },
      {
        name: "Pantang Menyerah",
        description: "Coba ulang soal yang salah sampai benar",
        category: "KEBERANIAN" as const,
        xpReward: 100,
      },
      {
        name: "Petualang Matematika",
        description: "Selesaikan 50 soal Matematika",
        category: "AKADEMIK" as const,
        xpReward: 150,
      },
      {
        name: "Sang Penjelajah",
        description: "Pelajari 20 topik berbeda",
        category: "KEBIASAAN" as const,
        xpReward: 250,
      },
      {
        name: "Penjelajah Sejarah",
        description: "Kuasai semua konsep Sejarah Indonesia",
        category: "AKADEMIK" as const,
        xpReward: 200,
      },
      {
        name: "Kartograf Cilik",
        description: "Kuasai semua konsep Geografi",
        category: "AKADEMIK" as const,
        xpReward: 200,
      },
      {
        name: "Ahli Ekonomi Muda",
        description: "Kuasai semua konsep Ekonomi",
        category: "AKADEMIK" as const,
        xpReward: 200,
      },
      {
        name: "Pengamat Sosial",
        description: "Kuasai semua konsep Sosiologi",
        category: "AKADEMIK" as const,
        xpReward: 200,
      },
      {
        name: "Pelindung Pancasila",
        description: "Kuasai semua konsep PPKN",
        category: "AKADEMIK" as const,
        xpReward: 200,
      },
      // ===== Streak =====
      {
        name: "Streak Master 3 Hari",
        description: "Belajar 3 hari berturut-turut",
        category: "KEBIASAAN" as const,
        xpReward: 30,
      },
      {
        name: "Streak Master 30 Hari",
        description: "Belajar 30 hari berturut-turut",
        category: "KEBIASAAN" as const,
        xpReward: 300,
      },
      {
        name: "Streak Master 100 Hari",
        description: "Belajar 100 hari berturut-turut",
        category: "KEBIASAAN" as const,
        xpReward: 1000,
      },
      {
        name: "Konsisten 7 Hari",
        description: "Streak aktif 7 hari",
        category: "KEBIASAAN" as const,
        xpReward: 50,
      },
      // ===== XP Milestones =====
      {
        name: "XP 100",
        description: "Kumpulkan 100 XP",
        category: "AKADEMIK" as const,
        xpReward: 20,
      },
      {
        name: "XP 500",
        description: "Kumpulkan 500 XP",
        category: "AKADEMIK" as const,
        xpReward: 50,
      },
      {
        name: "XP 1000",
        description: "Kumpulkan 1.000 XP",
        category: "AKADEMIK" as const,
        xpReward: 100,
      },
      {
        name: "XP 5000",
        description: "Kumpulkan 5.000 XP",
        category: "AKADEMIK" as const,
        xpReward: 250,
      },
      {
        name: "XP 10000",
        description: "Kumpulkan 10.000 XP",
        category: "AKADEMIK" as const,
        xpReward: 500,
      },
      // ===== Mastery Milestones =====
      {
        name: "Konsep Pertama Dikuasai",
        description: "Kuasai konsep pertamamu",
        category: "AKADEMIK" as const,
        xpReward: 30,
      },
      {
        name: "5 Konsep Dikuasai",
        description: "Kuasai 5 konsep",
        category: "AKADEMIK" as const,
        xpReward: 50,
      },
      {
        name: "10 Konsep Dikuasai",
        description: "Kuasai 10 konsep",
        category: "AKADEMIK" as const,
        xpReward: 100,
      },
      {
        name: "25 Konsep Dikuasai",
        description: "Kuasai 25 konsep",
        category: "AKADEMIK" as const,
        xpReward: 200,
      },
      {
        name: "50 Konsep Dikuasai",
        description: "Kuasai 50 konsep",
        category: "AKADEMIK" as const,
        xpReward: 400,
      },
      // ===== Quiz Milestones =====
      {
        name: "Soal Pertama Dijawab",
        description: "Jawab soal pertamamu",
        category: "KEBERANIAN" as const,
        xpReward: 10,
      },
      {
        name: "10 Soal Dijawab",
        description: "Jawab 10 soal",
        category: "KEBERANIAN" as const,
        xpReward: 30,
      },
      {
        name: "50 Soal Dijawab",
        description: "Jawab 50 soal",
        category: "KEBERANIAN" as const,
        xpReward: 80,
      },
      {
        name: "100 Soal Dijawab",
        description: "Jawab 100 soal",
        category: "KEBERANIAN" as const,
        xpReward: 150,
      },
      {
        name: "Akurasi 80% (10+ soal)",
        description: "Pertahankan akurasi 80% di minimal 10 soal",
        category: "KEBERANIAN" as const,
        xpReward: 100,
      },
      {
        name: "Akurasi 90% (25+ soal)",
        description: "Pertahankan akurasi 90% di minimal 25 soal",
        category: "KEBERANIAN" as const,
        xpReward: 250,
      },
      // ===== Activity Milestones =====
      {
        name: "Tantangan Pertama Selesai",
        description: "Selesaikan tantangan harian pertamamu",
        category: "KEBIASAAN" as const,
        xpReward: 25,
      },
      {
        name: "10 Tantangan Selesai",
        description: "Selesaikan 10 tantangan",
        category: "KEBIASAAN" as const,
        xpReward: 100,
      },
      {
        name: "Materi Pertama Dibaca",
        description: "Baca materi pertamamu",
        category: "KEBIASAAN" as const,
        xpReward: 20,
      },
      {
        name: "10 Materi Dibaca",
        description: "Baca 10 materi",
        category: "KEBIASAAN" as const,
        xpReward: 80,
      },
      {
        name: "Refleksi Pertama",
        description: "Tulis refleksi pertamamu",
        category: "KEBERANIAN" as const,
        xpReward: 30,
      },
      {
        name: "10 Refleksi Ditulis",
        description: "Tulis 10 refleksi",
        category: "KEBERANIAN" as const,
        xpReward: 150,
      },
      // ===== Additional Akademik =====
      {
        name: "Penjelajah Biologi",
        description: "Kuasai semua konsep Biologi",
        category: "AKADEMIK" as const,
        xpReward: 200,
      },
      {
        name: "Penjelajah Fisika",
        description: "Kuasai semua konsep Fisika",
        category: "AKADEMIK" as const,
        xpReward: 200,
      },
      {
        name: "Penjelajah Kimia",
        description: "Kuasai semua konsep Kimia",
        category: "AKADEMIK" as const,
        xpReward: 200,
      },
      {
        name: "Ahli Coding",
        description: "Kuasai semua konsep Coding",
        category: "AKADEMIK" as const,
        xpReward: 200,
      },
      {
        name: "Seniman Muda",
        description: "Kuasai semua konsep Seni Budaya",
        category: "AKADEMIK" as const,
        xpReward: 200,
      },
      {
        name: "Atlet Pelajar",
        description: "Kuasai semua konsep PJOK",
        category: "AKADEMIK" as const,
        xpReward: 200,
      },
      // ===== Engagement =====
      {
        name: "Quiz Master",
        description: "Selesaikan 10 quiz dengan skor 100%",
        category: "AKADEMIK" as const,
        xpReward: 300,
      },
      {
        name: "Daily Champion",
        description:
          "Selesaikan semua tantangan harian selama 7 hari berturut-turut",
        category: "KEBIASAAN" as const,
        xpReward: 400,
      },
      {
        name: "Kolektor Mapel",
        description: "Tambah 3 mapel custom ke koleksimu",
        category: "SPESIAL" as const,
        xpReward: 100,
      },
    ].map((b) =>
      prisma.badge.upsert({ where: { name: b.name }, update: {}, create: b }),
    ),
  );
  console.log("Badges created:", badges.length);

  await seedConcepts(subjects, topicMap);
  await seedPrerequisites();
  await generateAndSeedEmbeddings();
  await seedQuestions(subjects, topicMap);

  console.log("Seed completed!");
}

// ---------------------------------------------------------------------------
// Question enrichment helpers (explanation / hint / commonMisconceptions)
// ---------------------------------------------------------------------------

type QSeed = {
  question: string;
  options: string[];
  correctIndex: number;
  difficulty: "EASY" | "MEDIUM" | "HARD";
};

function truncate(text: string, max: number): string {
  if (!text) return "";
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trimEnd()}…`;
}

function pickConceptSnippet(content: string, sentence: number): string {
  if (!content) return "";
  const sentences = content
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (sentences.length === 0) return truncate(content, 200);
  const idx = Math.min(sentence, sentences.length - 1);
  return truncate(sentences[idx] ?? sentences[0] ?? "", 220);
}

function buildExplanation(
  q: QSeed,
  conceptName: string,
  conceptContent: string,
): string {
  const correctOpt = q.options[q.correctIndex] ?? "jawaban benar";
  const base = `Jawaban yang benar adalah **${correctOpt}**.`;
  const snippet = pickConceptSnippet(conceptContent, 0);
  if (snippet) {
    return `${base} ${snippet} Ingat konsep kunci: ${conceptName}.`;
  }
  return base;
}

function buildHint(
  conceptName: string,
  difficulty: "EASY" | "MEDIUM" | "HARD",
): string {
  const prompts: Record<string, string> = {
    EASY: `Coba inget lagi definisi "${conceptName}". Kalo lupa, buka dulu halaman konsep sebelum jawab.`,
    MEDIUM: `Pecah jadi langkah kecil: (1) apa yang diketahui dari soal? (2) konsep "${conceptName}" mana yang relevan? (3) eliminasi opsi yang ga masuk akal.`,
    HARD: `Ga apa-apa kalo belum ketemu. Tarik napas, baca ulang pelan-pelan, identifikasi kata kunci soal, lalu cocokin sama konsep "${conceptName}". Coba pake eliminasi dulu.`,
  };
  return prompts[difficulty] ?? prompts.MEDIUM!;
}

function buildMisconceptions(
  q: QSeed,
  conceptName: string,
  _conceptContent: string,
): string {
  const wrongIndices = q.options
    .map((_, i) => i)
    .filter((i) => i !== q.correctIndex)
    .slice(0, 3);
  const lines: string[] = [];
  for (const idx of wrongIndices) {
    const wrongOpt = q.options[idx];
    if (!wrongOpt) continue;
    const reason = pickDistractorReason(idx, q.correctIndex, conceptName);
    lines.push(`"${wrongOpt}" → ${reason}`);
  }
  if (lines.length === 0) {
    return `Kadang siswa salah karena buru-buru baca soal. Pelan-pelan ya, konsep "${conceptName}" butuh waktu.`;
  }
  return `Beberapa miskonsepsi umum:\n${lines.join("\n")}\n\nKalau kamu pilih salah satu di atas, coba cek lagi: apa yang bikin opsi itu menarik? Apakah ada asumsi yang keliru?`;
}

function pickDistractorReason(
  wrongIdx: number,
  correctIdx: number,
  conceptName: string,
): string {
  if (wrongIdx < correctIdx) {
    return `sering dipilih karena terlalu cepat pilih opsi pertama yang "kedengeran" bener, padahal belum dicek ulang ke konsep ${conceptName}.`;
  }
  if (wrongIdx === correctIdx + 1) {
    return `mengecoh — mirip sama jawaban benar tapi ada satu kata/detail yang beda. Baca opsi pelan-pelan.`;
  }
  return `kadang dipilih karena salah ingat konsep ${conceptName} (mis. kebalik definisi). Yuk review materi sekali lagi.`;
}

void pickConceptSnippet;

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
