# PRODUCT REQUIREMENTS DOCUMENT (PRD)
# Spark Ai — Asisten Tutor Adaptif Berbasis Kecerdasan Buatan

**Versi:** 1.0
**Tanggal:** 14 Juni 2026
**Tim:** [Nama Tim Anda]

---

## 1. Latar Belakang dan Permasalahan

Pendidikan di Indonesia, khususnya jenjang SMK/SMA, masih menghadapi tantangan struktural yang berdampak langsung pada kualitas pembelajaran siswa. Berdasarkan data dan observasi lapangan, teridentifikasi **enam permasalahan utama** yang saling berkaitan:

### 1.1 Kurangnya Pendampingan Belajar di Rumah
- **Kondisi saat ini:** Mayoritas orang tua siswa bekerja penuh waktu (8–12 jam/hari) sehingga tidak memiliki waktu untuk mendampingi anak belajar sepulang sekolah. Banyak orang tua juga tidak menguasai materi pelajaran (terutama matematika, sains, dan bahasa Inggris) karena latar belakang pendidikan yang berbeda.
- **Dampak:** Pekerjaan rumah (PR) sering tidak terbantu, konsep yang tidak dikuasai di sekolah menumpuk, dan siswa belajar dengan cara menghafal tanpa memahami.
- **Gap:** Siswa membutuhkan pendamping yang sabar, tersedia kapan saja, dan mampu menjelaskan materi dengan bahasa yang mudah dipahami.

### 1.2 Akses Pendidikan yang Tidak Merata
- **Kondisi saat ini:** Les privat atau bimbingan belajar (bimbel) berkualitas biasanya hanya tersedia di kota besar dengan biaya Rp 100.000–500.000 per bulan per mata pelajaran. Di daerah 3T (terdepan, terluar, tertinggal), akses terhadap tutor privat sangat terbatas.
- **Dampak:** Kesenjangan kualitas pendidikan antara siswa di kota dan di daerah semakin lebar. Siswa dari keluarga kurang mampu tidak memiliki kesempatan yang sama untuk mendapatkan bimbingan belajar tambahan.
- **Gap:** Diperlukan solusi pendidikan berkualitas yang dapat diakses secara merata dengan biaya yang terjangkau, bahkan gratis.

### 1.3 Metode Pembelajaran yang Kurang Personal
- **Kondisi saat ini:** Satu guru di sekolah biasanya mengajar 30–40 siswa dengan tingkat kemampuan yang sangat beragam. Materi disampaikan secara *one-size-fits-all* dengan kecepatan yang seragam, sehingga siswa yang lambat tertinggal dan siswa yang cepat merasa bosan.
- **Dampak:** Materi terasa terlalu mudah bagi sebagian siswa dan terlalu sulit bagi yang lain. Minat belajar menurun karena tidak ada tantangan yang sesuai.
- **Gap:** Diperlukan pendekatan pembelajaran yang dapat menyesuaikan tingkat kesulitan, jenis penjelasan, dan kecepatan materi dengan kemampuan masing-masing siswa.

### 1.4 Rendahnya Motivasi, Kebosanan, dan Literasi Belajar Siswa
- **Kondisi saat ini:** Banyak siswa mudah menyerah ketika menghadapi materi yang sulit, tidak memahami cara belajar yang efektif, dan lebih memilih jalan pintas seperti menyalin jawaban teman. **Selain itu, proses belajar sering terasa monoton dan membosankan** — siswa dipaksa duduk berjam-jam membaca buku atau mengerjakan soal tanpa variasi, umpan balik yang menarik, atau rasa pencapaian yang jelas. Literasi belajar (bagaimana cara belajar yang baik) juga masih rendah.
- **Dampak:** Ketergantungan pada hafalan jangka pendek, rendahnya retensi konsep, menurunnya kepercayaan diri siswa, **serta menurunnya kebiasaan dan minat belajar karena belajar dianggap sebagai beban, bukan aktivitas yang menyenangkan.**
- **Gap:** Siswa membutuhkan pendamping yang tidak hanya mengajarkan materi, tetapi juga memberikan motivasi, membangun kepercayaan diri, **membuat proses belajar terasa menarik dan tidak membosankan,** serta membentuk kebiasaan belajar yang baik.

### 1.5 Kesulitan Belajar Mandiri
- **Kondisi saat ini:** Ketika siswa mencoba belajar sendiri, mereka kesulitan mencari penjelasan yang mudah dipahami, terutama untuk mata pelajaran inti seperti Matematika, Bahasa Inggris, dan mata pelajaran kejuruan SMK. Sumber belajar di internet sering terlalu akademis, terlalu singkat, atau tidak sesuai dengan kurikulum yang berlaku.
- **Dampak:** Siswa frustrasi saat belajar sendiri, waktu belajar tidak efektif, dan konsep yang dipahami sering keliru karena sumber yang tidak terverifikasi.
- **Gap:** Diperlukan "tutor pribadi" yang dapat menjelaskan materi dengan bahasa sederhana, memberikan contoh kontekstual, dan menyesuaikan penjelasan dengan tingkat pemahaman siswa.

### 1.6 Tidak Adanya Feedback yang Cepat dan Personal
- **Kondisi saat ini:** Ujian atau kuis di sekolah biasanya dikoreksi dalam hitungan hari hingga minggu. Siswa jarang mendapatkan penjelasan mendetail tentang di mana letak kesalahannya dan bagaimana cara memperbaikinya.
- **Dampak:** Kelemahan belajar siswa sering terlambat terdeteksi, kesalahan konsep menumpuk, dan siswa tidak tahu area mana yang perlu ditingkatkan.
- **Gap:** Diperlukan sistem yang dapat memberikan evaluasi langsung, menjelaskan kesalahan secara personal, dan merekomendasikan langkah perbaikan yang spesifik.

### 1.7 Permasalahan Turunan (Akibat dari Enam Permasalahan di Atas)
Permasalahan-permasalahan di atas menyebabkan:
- **Rendahnya kualitas pembelajaran** secara nasional.
- **Penurunan motivasi belajar** siswa yang berdampak pada kehadiran dan partisipasi di kelas.
- **Kesenjangan akses pendidikan** yang semakin melebar antara siswa di kota besar, kota kecil, dan daerah.
- **Ketergantungan pada bimbel mahal** yang membebani ekonomi keluarga.
- **Penggunaan AI secara tidak efektif** (seperti copy-paste jawaban dari ChatGPT tanpa memahami konsep) yang menjadi fenomena baru di kalangan pelajar sejak 2024.

---

## 2. Tujuan Proyek

Spark Ai dirancang dengan empat tujuan utama yang saling terkait untuk menjawab permasalahan pada Bagian 1:

### 2.1 Memberikan Solusi Pembelajaran yang Personal dan Adaptif
- **Sasaran:** Setiap siswa mendapatkan penjelasan, latihan, dan evaluasi yang disesuaikan dengan tingkat kemampuan, gaya belajar, dan kebutuhan individunya.
- **Indikator pencapaian:**
  - Sistem mampu menyesuaikan tingkat kesulitan soal secara otomatis berdasarkan performa siswa.
  - Sistem mampu memberikan penjelasan dengan berbagai kedalaman (dasar, menengah, lanjutan) sesuai permintaan siswa.
  - Setiap siswa memiliki *knowledge profile* unik yang diperbarui secara real-time.

### 2.2 Meningkatkan Kualitas Pembelajaran dan Literasi Siswa
- **Sasaran:** Membantu siswa tidak hanya menghafal, tetapi **memahami konsep** melalui dialog interaktif dan pendekatan Socratic.
- **Indikator pencapaian:**
  - Peningkatan skor post-test minimal 15% dibanding pre-test pada topik yang dipelajari.
  - Penurunan tingkat miskonsepsi siswa yang teridentifikasi oleh sistem.
  - Meningkatnya kebiasaan belajar mandiri yang dilaporkan melalui survei pengguna.

### 2.3 Memperluas Akses Pendidikan Berkualitas
- **Sasaran:** Menyediakan pendamping belajar berkualitas yang dapat diakses kapan saja, di mana saja, tanpa terkendala biaya atau lokasi geografis.
- **Indikator pencapaian:**
   - Website dapat diakses gratis untuk siswa.
   - Website dapat berjalan optimal di browser dengan spesifikasi rendah dan koneksi internet terbatas.
   - Website dapat digunakan oleh siswa di daerah 3T tanpa hambatan akses yang berarti.

### 2.4 Membangun Website yang Inovatif dan Berdampak Sosial
- **Sasaran:** Menghadirkan solusi berbasis kecerdasan buatan yang memberikan dampak sosial nyata di bidang pendidikan, sekaligus menjadi contoh inovasi teknologi yang berpusat pada manusia.
- **Indikator pencapaian:**
   - Website mengikuti perkembangan terkini dalam riset AI dan pedagogi.
   - Adopsi website oleh siswa dalam skala yang bermakna.
   - Umpan balik positif dari siswa, orang tua, dan guru tentang dampak penggunaan website terhadap hasil belajar.

---

## 3. Target Pengguna

Spark Ai dirancang untuk melayani **dua kelompok pengguna**:

### 3.1 Pengguna Utama: Siswa SMK/SMA Kelas X–XII
**Karakteristik umum:**
- Berusia 15–18 tahun, melek digital, mayoritas menggunakan smartphone Android sebagai perangkat utama.
- Aktif di media sosial, terbiasa dengan aplikasi berbasis chat dan video pendek.
- Memiliki keterbatasan paket data sehingga membutuhkan aplikasi yang ringan.
- Mengerjakan PR dan belajar secara mandiri di luar jam sekolah.

**Kebutuhan utama:**
- Penjelasan materi yang mudah dipahami dan relevan dengan kurikulum.
- Latihan soal yang sesuai dengan tingkat kemampuan.
- Pendamping belajar yang sabar, tidak menghakimi, dan tersedia kapan saja.
- Motivasi dan dorongan untuk konsisten belajar.

**Contoh persona:**
> **Rina (16 tahun)** — Siswi kelas 11 SMK Jurusan TKJ. Nilai matematika 70, bahasa Inggris 60. Suka menonton tutorial YouTube. Target: lulus UTBK-SNBT dan masuk D4 IT. Frustrasi karena tidak ada yang bisa mengajari matematika di rumah, malu bertanya ke guru, dan bingung mengerjakan PR sendirian.

### 3.2 Pengguna Pendukung: Orang Tua Siswa
**Karakteristik umum:**
- Bekerja penuh waktu, memiliki keterbatasan waktu dan kemampuan untuk mendampingi anak belajar.
- Menggunakan smartphone berbasis WhatsApp sebagai kanal komunikasi utama.
- Menginginkan gambaran sederhana tentang perkembangan belajar anaknya tanpa harus memantau secara detail.

**Kebutuhan utama:**
- Ringkasan berkala (misalnya mingguan) tentang aktivitas dan perkembangan belajar anak.
- Notifikasi jika ada hal yang perlu diperhatikan (misalnya anak tidak belajar selama beberapa hari).
- Keyakinan bahwa anaknya belajar dengan benar dan aman.

**Catatan:** Orang tua **bukan pengguna primer**. Mereka hanya memiliki akses monitoring terhadap akun anak yang sudah di-link, tanpa kemampuan mengelola konten atau memodifikasi pembelajaran.

---

## 4. Solusi yang Ditawarkan (Spark Ai)

**Spark Ai** adalah platform web tutor pribadi berbasis kecerdasan buatan yang dirancang untuk menjadi pendamping belajar siswa setiap saat — sabar, adaptif, personal, **dan menyenangkan**. Platform ini memiliki **tujuh kemampuan inti** yang saling terintegrasi:

### 4.1 Penyesuaian Penjelasan Materi Sesuai Tingkat Pemahaman Siswa
- **Cara kerja:** Sistem menyimpan *knowledge graph* per siswa yang memetakan konsep mana yang sudah dikuasai, sedang dipelajari, dan belum dipahami. Berdasarkan pemetaan ini, sistem memilih strategi penjelasan yang sesuai.
- **Bentuk penyesuaian:**
  - **Kedalaman penjelasan:** dari konsep dasar hingga lanjutan.
  - **Gaya bahasa:** dari formal hingga kasual dan penuh analogi.
  - **Panjang respons:** dari ringkas (1–2 kalimat) hingga lengkap (langkah demi langkah).
  - **Media:** teks, contoh soal, analogi kehidupan sehari-hari.
- **Contoh:** Saat siswa kelas 10 bertanya tentang persamaan kuadrat, sistem akan menjelaskan dengan cara yang berbeda tergantung apakah siswa sudah memahami konsep fungsi kuadrat sebelumnya atau belum.

### 4.2 Latihan dan Evaluasi yang Adaptif
- **Cara kerja:** Bank soal yang terus diperbarui, dengan algoritma adaptif yang memilih soal berikutnya berdasarkan performa siswa. Kesulitan soal akan naik jika siswa menjawab benar berturut-turut, dan turun jika siswa kesulitan.
- **Bentuk latihan:**
  - Latihan bebas per topik.
  - Ujian mini dengan timer.
  - Tantangan harian untuk menjaga konsistensi.
- **Evaluasi:** Setiap jawaban langsung dievaluasi dengan umpan balik yang menjelaskan mengapa jawaban benar atau salah, bukan sekadar "benar" atau "salah".

### 4.3 Deteksi Kesulitan Belajar Siswa Secara Dini
- **Cara kerja:** Sistem menganalisis pola jawaban siswa, konsep yang sering ditanyakan berulang kali, dan waktu yang dihabiskan untuk memahami suatu topik. Pola-pola ini digunakan untuk mengidentifikasi tanda-tanda kesulitan sejak awal.
- **Bentuk respons sistem:**
  - Memberikan penjelasan tambahan secara proaktif.
  - Menyarankan untuk mengulang konsep prasyarat yang mungkin belum dikuasai.
  - Memberikan motivasi dan pendekatan yang lebih lembut jika siswa terlihat frustrasi.
- **Tujuan:** Mencegah kesulitan kecil menumpuk menjadi masalah besar yang menurunkan kepercayaan diri siswa.

### 4.4 Motivasi dan Dukungan Personal
- **Cara kerja:** Spark Ai dipersonifikasi sebagai tutor virtual dengan nama "Spark" yang memiliki karakter hangat, sabar, suportif, dan tidak menghakimi.
- **Bentuk dukungan:**
  - Mengakui usaha siswa, bukan hanya hasil ("Bagus, kamu sudah mencoba. Yuk kita liat bareng.").
  - Memberikan semangat saat siswa merasa gagal ("Wajar koq, materi ini emang tricky. Pelan-pelan aja, aku temani.").
  - Merayakan pencapaian kecil (misalnya mendapatkan badge, mempertahankan streak belajar).
  - **Menggunakan elemen gamifikasi (lihat 4.7) untuk memberikan rasa pencapaian yang jelas atas usaha belajar siswa.**
- **Prinsip:** Membangun *growth mindset* — kesalahan adalah bagian dari proses belajar, bukan tanda kegagalan.

### 4.5 Peningkatan Literasi dan Kemandirian Belajar Siswa
- **Cara kerja:** Selain menjawab pertanyaan, sistem juga mengajarkan **cara belajar** — bagaimana memecahkan masalah, bagaimana mengidentifikasi konsep yang belum dipahami, dan bagaimana mengevaluasi pemahaman sendiri.
- **Bentuk dukungan:**
  - Pertanyaan pemandu yang menstimulasi siswa berpikir ("Coba kamu tebak dulu, kira-kira langkah pertamanya apa?").
  - Refleksi rutin ("Dari topik ini, bagian mana yang menurutmu paling mudah? Paling sulit?").
  - Rekomendasi rencana belajar harian/mingguan yang personal.
- **Tujuan:** Membentuk siswa yang mampu belajar secara mandiri (*self-directed learner*) setelah lulus dari pendampingan AI.

### 4.6 Pendekatan Metodologis: Socratic Tutoring
Seluruh kemampuan di atas diimplementasikan menggunakan **pendekatan Socratic** — yaitu bertanya untuk membimbing siswa menemukan jawabannya sendiri, bukan langsung memberikan jawaban. Pendekatan ini dipilih karena:
- Lebih efektif dalam membangun pemahaman jangka panjang dibanding menyalin jawaban.
- Melatih kemampuan berpikir kritis dan pemecahan masalah.
- Mengurangi kecenderungan siswa untuk sekadar menyalin tanpa berpikir.

### 4.7 Gamifikasi: Belajar yang Menyenangkan dan Bermakna

Untuk menjawab masalah kebosanan dan menjaga motivasi belajar siswa, Spark Ai menyertakan elemen **gamifikasi** yang dirancang secara etis — bukan untuk membuat siswa ketagihan, melainkan untuk membuat proses belajar terasa **menyenangkan, bervariasi, dan penuh rasa pencapaian**.

#### 4.7.1 Prinsip Gamifikasi Spark Ai
Gamifikasi dalam Spark Ai dibangun di atas tiga pilar motivasi intrinsik (berdasarkan *Self-Determination Theory*):
- **Autonomy (Otonomi):** Siswa punya pilihan bagaimana belajar dan apa yang ingin dicapai.
- **Competence (Kompetensi):** Siswa merasa mampu dan terus berkembang melalui tantangan yang sesuai.
- **Relatedness (Keterhubungan):** Siswa merasa ditemani dan didukung, tidak sendirian.

Prinsip tambahan:
- **Intrinsic first, extrinsic supporting:** Gamifikasi adalah pelengkap, bukan tujuan. Tujuan utamanya tetap pemahaman konsep.
- **Transparan:** Aturan reward jelas, tidak ada kejutan manipulatif.
- **Tanpa paksaan:** Tidak ada sistem energi/hidup yang membatasi belajar, tidak ada punishment yang membuat stres.

#### 4.7.2 Elemen-Elemen Gamifikasi

**a. Sistem XP dan Level**
- Siswa mendapatkan poin pengalaman (XP) dari setiap aktivitas belajar: menjawab soal dengan benar, menyelesaikan sesi chat Socratic, mempertahankan streak, menguasai konsep baru.
- Level 1–50 dengan nama lokal Indonesia yang membangkitkan semangat, misalnya: *Pemula → Penjelajah → Pejuang → Ahli → Maestro → Legenda*.
- Progress bar level ditampilkan di beranda agar siswa selalu tahu posisinya dan sisa perjalanan.

**b. Streak Belajar Harian**
- Menghitung berapa hari berturut-turut siswa belajar (minimal satu aktivitas per hari).
- Ditampilkan dengan visual api 🔥 dan angka, contoh: *"7 hari berturut-turut!"*.
- **Streak Freeze:** Siswa mendapat 1 "beku streak" per minggu — jika suatu hari tidak sempat belajar, streak tidak putus.
- **Jika streak putus:** Bukan pesan menyalahkan, tapi ajakan ringan — *"Gapapa, yuk mulai lembaran baru hari ini!"*.

**c. Badge dan Pencapaian (Achievements)**
- Lebih dari 50 badge yang dapat dikumpulkan sejak awal, terbagi dalam beberapa kategori:
  - **Akademik:** *Penakluk Trigonometri*, *Teman Aljabar*, *Penjelajah Tata Bahasa*.
  - **Kebiasaan:** *Streak Master 7 Hari*, *Konsisten 30 Hari*, *Pagi yang Produktif*.
  - **Keberanian:** *Penanya Ulung* (sering bertanya di mode Socratic), *Pemikir Kritis*.
  - **Spesial:** *Penolong Teman* (menggunakan mode kolaboratif di versi berikutnya).
- Badge dapat dilihat di profil siswa dan dibagikan (jika siswa mau).

**d. Misi Harian (Daily Quest)**
- Setiap hari, siswa mendapat 3 misi sederhana yang dapat diselesaikan dalam 10–20 menit:
  - *"Selesaikan 5 soal matematika hari ini."*
  - *"Belajar 15 menit tanpa jeda."*
  - *"Uji pemahamanmu di 1 topik baru."*
- Selesai semua misi = bonus XP dan hadiah kecil (misal stiker avatar).

**e. Bintang Konsep (Knowledge Star)**
- Setiap konsep yang dikuasai siswa akan "menyalakan" satu bintang di langit konstelasi per mata pelajaran.
- Visual: langit malam yang perlahan dipenuhi bintang sesuai konsep yang dikuasai.
- **Tujuan:** Memberikan gambaran visual yang indah dan memuaskan dari kemajuan belajar, dikaitkan langsung dengan penguasaan konsep (bukan hanya jumlah soal).

**f. Tanaman Virtual "Teman Tumbuh" (Study Buddy)**
- Siswa memilih satu tanaman atau makhluk kecil (bunga, kaktus, pohon) yang **tumbuh seiring konsistensi belajar**.
- Hari ke-1 = bibit. Hari ke-7 = kecambah. Hari ke-30 = berbunga. Dan seterusnya.
- **Tujuan:** Membangun rasa tanggung jawab dan rutinitas. Tanaman hanya tumbuh jika siswa belajar — bukan pelengkap kosmetik, tapi cerminan kebiasaan.

**g. Kustomisasi Avatar "Spark"**
- Karakter "Spark" yang mendampingi siswa bisa di-customize: warna sapaan, aksesoris (kacamata, topi, jubah), background percakapan.
- Item customization dibuka menggunakan XP dan bintang — **bukan dibeli dengan uang**.
- **Tujuan:** Ekspresi identitas dan rasa memiliki (*sense of ownership*).

**h. Progress Bar dan Skill Tree**
- Setiap topik memiliki progress bar visual (0–100%).
- Skill tree memperlihatkan prasyarat antar konsep: untuk belajar integral, harus sudah kuasai turunan.
- **Tujuan:** Visualisasi jelas tentang "di mana saya sekarang" dan "apa selanjutnya".

**i. Personal Best (Rekor Pribadi)**
- Siswa dapat melihat rekor pribadinya: waktu tercepat menjawab soal, akurasi tertinggi di topik tertentu, streak terlama.
- Tantangan implisit: *"Kamu bisa kalahin rekormu sendiri?"*.

**j. Tantangan Mingguan (Weekly Challenge)**
- Setiap awal minggu, ada tantangan khusus yang lebih besar dari misi harian, misalnya: *"Selesaikan 20 soal aljabar minggu ini"* atau *"Kuasai 3 konsep baru."*
- Hadiah: badge eksklusif mingguan.

**k. Mini-Celebrations (Perayaan Kecil)**
- Animasi confetti dan suara positif saat siswa mencapai milestone.
- Pesan personal dari Spark: *"Yeay, kamu baru saja menaklukkan Trigonometri! Aku bangga!"*.
- Tidak berlebihan — cukup 2–3 detik, tidak mengganggu alur belajar.

#### 4.7.3 Yang TIDAK Ada di Gamifikasi Spark Ai (Anti-Pattern)

Demi menjaga kesehatan mental siswa dan etika produk, elemen-elemen berikut **sengaja TIDAK** disertakan:
- ❌ **Loot box / gacha** — tidak ada unsur judi atau ketidakpastian reward.
- ❌ **Pay-to-win** — semua item dan badge bisa diperoleh dengan belajar, bukan dengan uang.
- ❌ **FOMO manipulatif** — tidak ada pesan seperti *"STREAK AKAN HABIS DALAM 2 JAM!!!"* untuk memaksa siswa kembali.
- ❌ **Energy / life system** — tidak ada batasan harian yang membuat siswa tidak bisa belajar.
- ❌ **Komparasi sosial yang toxic** — tidak ada leaderboard global yang membandingkan siswa secara kasar.
- ❌ **Iklan** — tidak ada iklan dalam bentuk apa pun.
- ❌ **Notifikasi agresif** — reminder belajar maksimal 1–2 per hari, hanya jika siswa memilih untuk mengaktifkannya.
- ❌ **Variable ratio reward** (seperti *slot machine*) — tidak ada reward acak yang tidak bisa diprediksi.
- ❌ **Streak punishment yang menyalahkan** — streak putus bukan "hukuman", tapi kesempatan untuk mulai lagi.

#### 4.7.4 Dampak Gamifikasi yang Diharapkan
- Siswa termotivasi untuk **kembali belajar secara konsisten** (bukan karena terpaksa).
- Proses belajar terasa **menyenangkan dan tidak membosankan**.
- Siswa memiliki **rasa pencapaian yang jelas** atas usaha mereka.
- Terbentuk **kebiasaan belajar jangka panjang** melalui rutinitas streak dan pertumbuhan tanaman virtual.
- Meningkatkan **engagement dan retensi** penggunaan aplikasi secara sehat.

### 4.8 Asisten Materi dari Dokumen Guru (PDF/DOCX)

Untuk menjawab realita sehari-hari di mana guru sering membagikan materi, soal, atau tugas melalui WhatsApp dalam format PDF atau DOCX, Spark Ai menyediakan kemampuan untuk **mengunggah dokumen dan langsung memanfaatkannya sebagai bahan belajar personal**.

#### 4.8.1 Cara Kerja
- Siswa mengunggah file PDF atau DOCX yang diterima dari guru ke dalam aplikasi.
- Sistem mengekstrak isi teks dari dokumen tersebut dan menyimpannya dalam format **Markdown bersih** di database (bukan sebagai file biner di cloud storage).
- AI membaca konteks dokumen tersebut dan dapat:
  - **Menjelaskan materi** dengan bahasa yang disesuaikan tingkat pemahaman siswa.
  - **Membuat ringkasan materi inti** supaya siswa cepat memahami poin-poin penting.
  - **Mengubah pertanyaan/tugas dalam dokumen** menjadi sesi latihan interaktif dengan pendekatan Socratic.
  - **Menghasilkan quiz latihan** secara otomatis berdasarkan isi dokumen.
- Hasil ekstraksi dapat dimasukkan ke dalam *knowledge graph* siswa dan dijadikan bahan *retrieval* untuk sesi tanya-jawab berikutnya.

#### 4.8.2 Format Penyimpanan
- File asli tidak disimpan di storage/cloud storage untuk menghemat biaya dan mempercepat akses.
- Isi dokumen disimpan sebagai **teks Markdown** di dalam database PostgreSQL melalui Prisma (`@db.Text`).
- Metadata dokumen (nama file asli, ukuran, tanggal unggah, sumber) tetap disimpan untuk referensi.
- Untuk dokumen yang berisi gambar atau rumus, sistem akan melakukan konversi tambahan:
  - **Rumus matematika:** dideteksi dan di-render dalam format LaTeX/MathML.
  - **Gambar/diagram:** diekstrak sebagai referensi atau dijelaskan oleh AI jika diperlukan.
  - **Hasil scan/foto:** diolah dengan OCR sebelum dikonversi ke Markdown.

#### 4.8.3 Manfaat Fitur Ini
- Siswa tidak lagi hanya "menerima file" dari guru tanpa tahu cara mempelajarinya.
- Materi dari guru dapat langsung diintegrasikan ke dalam pengalaman belajar personal.
- Mengurangi beban guru untuk menulis ulang soal atau materi ke dalam aplikasi.
- Membuat setiap dokumen dari guru menjadi bahan latihan yang adaptif dan interaktif.

---

## 5. Manfaat yang Diharapkan

Spark Ai diharapkan memberikan manfaat nyata bagi seluruh pemangku kepentingan:

### 5.1 Manfaat bagi Siswa
- **Belajar lebih mudah, menyenangkan, dan sesuai kemampuan:** Materi dijelaskan dengan cara yang dipahami siswa, pada tingkat yang sesuai, dengan kecepatan yang bisa diatur.
- **Belajar terasa seru dan tidak membosankan:** Elemen gamifikasi yang etis membuat proses belajar lebih menarik, memberikan variasi, dan rasa pencapaian yang jelas tanpa membuat siswa ketagihan.
- **Peningkatan hasil belajar:** Pemahaman konsep yang lebih mendalam diharapkan berdampak pada peningkatan nilai akademis secara keseluruhan.
- **Peningkatan motivasi dan kepercayaan diri:** Dukungan personal dari Spark Ai membantu siswa merasa tidak sendirian dalam belajar.
- **Pembentukan kebiasaan belajar mandiri:** Dengan pendampingan yang konsisten, siswa diharapkan mampu belajar secara mandiri secara bertahap.
- **Akses belajar 24/7:** Kapan pun siswa membutuhkan penjelasan atau ingin latihan, Spark Ai siap mendampingi.
- **Bisa memanfaatkan materi dari guru:** File PDF atau DOCX yang dibagikan guru melalui WhatsApp dapat langsung diubah menjadi ringkasan, penjelasan, atau latihan soal yang dipersonalisasi.

### 5.2 Manfaat bagi Orang Tua
- **Gambaran jelas tentang perkembangan belajar anak:** Ringkasan berkala membantu orang tua memahami apa yang sudah dipelajari anak tanpa harus memeriksa secara detail.
- **Ketenangan pikiran:** Orang tua tidak perlu khawatir anak tidak mendapat pendampingan belajar, meskipun orang tua sibuk atau tidak menguasai materi.
- **Terlibat secara proporsional:** Orang tua dapat memberikan dukungan yang tepat berdasarkan informasi yang diterima, tanpa harus menjadi "guru" di rumah.

### 5.3 Manfaat bagi Sistem Pendidikan
- **Mengurangi kesenjangan pendidikan:** Akses gratis ke pendamping belajar berkualitas membantu siswa di daerah dan dari keluarga kurang mampu untuk tidak tertinggal.
- **Mendorong adopsi teknologi secara sehat di kalangan pelajar:** AI digunakan sebagai alat belajar, bukan sebagai jalan pintas untuk contekan.
- **Mendukung implementasi Kurikulum Merdeka:** Pendekatan personal dan adaptif selaras dengan semangat diferensiasi pembelajaran dalam Kurikulum Merdeka.

### 5.4 Dampak Jangka Panjang yang Diharapkan
- Peningkatan literasi dan numerasi siswa Indonesia secara bertahap.
- Terbentuknya generasi pembelajar mandiri yang adaptif terhadap perubahan.
- Berkontribusi pada peningkatan kualitas sumber daya manusia Indonesia di masa depan.

---

## 6. Batasan Aplikasi

Untuk menjaga fokus dan kualitas pengembangan, Spark Ai memiliki batasan-batasan yang jelas pada tahap awal:

### 6.1 Batasan Lingkup Mata Pelajaran
- **In scope:** Mata pelajaran utama siswa SMK/SMA, yaitu:
  - Matematika
  - Bahasa Indonesia
  - Bahasa Inggris
  - IPA (Fisika, Kimia, Biologi) — sebagai mata pelajaran terintegrasi sesuai Kurikulum Merdeka
- **Out of scope (tahap awal):**
  - Mata pelajaran IPS secara detail (sejarah, geografi, ekonomi, sosiologi) — dapat dipertimbangkan untuk versi berikutnya.
  - Mata pelajaran kejuruan SMK secara spesifik (misalnya pemrograman, akuntansi, tata boga) — memerlukan pengembangan konten khusus.
  - Mata pelajaran di luar jenjang SMK/SMA (SD, SMP, perguruan tinggi) — di luar target pengguna.

### 6.2 Batasan Peran Aplikasi
- **TIDAK dimaksudkan untuk menggantikan peran guru di sekolah.** Guru tetap memiliki peran utama dalam pendidikan karakter, diskusi kelas, proyek kolaboratif, dan penilaian formal.
- **TIDAK dimaksudkan untuk menggantikan peran orang tua.** Pendidikan karakter, nilai-nilai moral, dan dukungan emosional tetap menjadi tanggung jawab keluarga.
- **TIDAK dimaksudkan sebagai alat contekan.** Aplikasi ini dirancang untuk **membantu belajar**, bukan untuk memberikan jawaban instan untuk PR atau ujian.

### 6.3 Batasan Konten dan Akurasi
- **Pada tahap awal, menggunakan data dan materi pembelajaran standar** yang bersumber dari:
  - Capaian Pembelajaran (CP) dan Alur Tujuan Pembelajaran (ATP) Kurikulum Merdeka.
  - Buku teks elektronik resmi (BSE) dari Kemendikbud.
  - Soal-soal latihan yang sudah terverifikasi kesesuaiannya dengan kurikulum.
- **Keterbatasan pengakuan:** Sistem mungkin tidak selalu sempurna dalam menjawab pertanyaan di luar cakupan materi, atau dalam menafsirkan pertanyaan yang ambigu. Dalam kondisi seperti ini, sistem akan secara eksplisit mengakui keterbatasannya dan menyarankan siswa untuk mengonfirmasi dengan sumber lain (buku, guru).

### 6.4 Batasan Teknis dan Operasional (Tahap Awal)
- **Perangkat:** Website dioptimalkan untuk browser desktop dan mobile (responsif). Versi aplikasi mobile native (Android/iOS) dapat dikembangkan pada tahap berikutnya.
- **Koneksi:** Aplikasi membutuhkan koneksi internet untuk berfungsi penuh karena pemrosesan AI dilakukan di server. Mode offline penuh belum tersedia pada tahap awal.
- **Bahasa:** Antarmuka dan interaksi menggunakan Bahasa Indonesia. Dukungan bahasa daerah (Jawa, Sunda, dll) dapat dipertimbangkan untuk versi berikutnya.
- **Upload dokumen:** Pada tahap awal, sistem mendukung file PDF dan DOCX dengan ukuran maksimal tertentu (misalnya 10 MB atau maksimal 50 halaman). File disimpan dalam bentuk teks Markdown di database, bukan sebagai file biner di cloud storage. Dokumen hasil scan atau berisi gambar kompleks mungkin memerlukan OCR yang akan diperbaiki secara bertahap.

### 6.5 Batasan Etika dan Privasi
- **Data siswa:** Dikumpulkan dan dikelola sesuai dengan prinsip perlindungan data pribadi (UU PDP) — hanya untuk tujuan pembelajaran, tidak disalahgunakan, dan dapat dihapus atas permintaan pengguna.
- **Transparansi:** Siswa dan orang tua diberi pemahaman yang jelas bahwa mereka berinteraksi dengan AI, bukan dengan manusia.
- **Konten:** Sistem dirancang untuk tidak membahas topik di luar lingkup edukasi, serta menolak memberikan konten yang berbahaya, menyesatkan, atau tidak sesuai untuk pelajar.

### 6.6 Batasan Pengembangan Versi Awal
- Fitur-fitur canggih seperti input suara, input foto (untuk soal matematika/gambar), OCR dokumen hasil scan, dan integrasi dengan sistem sekolah akan dikembangkan secara bertahap.
- Fokus tahap awal adalah membangun fondasi yang kuat: pengalaman belajar yang personal, adaptif, dan aman sesuai dengan tujuan proyek, termasuk kemampuan dasar upload dan pemrosesan dokumen PDF/DOCX.

### 6.7 Batasan Etika Gamifikasi
Gamifikasi dalam Spark Ai dirancang untuk membuat belajar **menyenangkan dan bermakna**, **bukan** untuk membuat siswa **ketagihan atau tereksploitasi**. Batasan yang tegas:
- **Tanpa monetisasi tersembunyi:** Tidak ada item yang hanya bisa dibeli dengan uang, tidak ada iklan, tidak ada *pay-to-win*.
- **Tanpa manipulasi perilaku:** Tidak ada notifikasi agresif, FOMO, atau *dark pattern* untuk memaksa siswa kembali ke aplikasi.
- **Tanpa unsur judi:** Tidak ada *loot box*, gacha, atau reward acak yang tidak bisa diprediksi.
- **Tanpa komparasi sosial yang toxic:** Tidak ada leaderboard global yang merendahkan siswa berperingkat rendah.
- **Tanpa batasan belajar:** Tidak ada sistem energi/hidup yang membatasi berapa lama atau berapa banyak siswa boleh belajar.
- **Streak bukan hukuman:** Streak yang putus tidak disertai pesan menyalahkan; siswa selalu diberi kesempatan untuk memulai lagi.
- **Kesehatan siswa diprioritaskan:** Reminder belajar mengikuti preferensi siswa, bukan preferensi bisnis aplikasi.
- **Transparansi:** Aturan reward dan cara mendapatkannya jelas dan terbuka, tidak ada mekanisme tersembunyi.

---

**— Akhir Dokumen —**

*Dokumen ini menjadi acuan utama pengembangan Spark Ai dan akan dievaluasi secara berkala sesuai dengan perkembangan produk dan masukan dari pemangku kepentingan.*
