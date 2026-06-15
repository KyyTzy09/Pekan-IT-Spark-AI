import { prisma } from "../src/lib/prisma";
import bcrypt from "bcryptjs";
import { embedMany } from "ai";
import { embeddingModel } from "../src/lib/ai";

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
    const subjId = subjects[subjectSlug].id;
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
  topicMap: Record<string, Record<string, { id: string }>>,
) {
  let total = 0;

  const concepts = await prisma.concept.findMany();
  const conceptByName: Record<string, string> = {};
  for (const c of concepts) {
    conceptByName[c.name] = c.id;
  }

  for (const [subjectSlug, questions] of Object.entries(QUESTIONS_BY_SUBJECT)) {
    const subjId = subjects[subjectSlug].id;

    for (const q of questions) {
      const conceptId = conceptByName[q.conceptName];
      if (!conceptId) {
        console.warn(`Concept "${q.conceptName}" not found, skipping question`);
        continue;
      }

      await prisma.question.create({
        data: {
          conceptId,
          questionText: q.question,
          type: "MULTIPLE_CHOICE",
          options: q.options,
          correctAnswer: String.fromCharCode(65 + q.correctIndex),
          difficulty: q.difficulty,
        },
      });
      total++;
    }
    console.log(`Questions created for ${subjectSlug}: ${questions.length}`);
  }
  console.log(`Total questions: ${total}`);
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
    ].map((b) =>
      prisma.badge.upsert({ where: { name: b.name }, update: {}, create: b }),
    ),
  );
  console.log("Badges created:", badges.length);

  await seedConcepts(subjects, topicMap);
  await generateAndSeedEmbeddings();
  await seedQuestions(subjects, topicMap);

  console.log("Seed completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
