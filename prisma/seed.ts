import { prisma } from "../src/lib/prisma";
import bcrypt from "bcryptjs";

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

  const subjects = await Promise.all(
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
      prisma.subject.upsert({
        where: { slug: s.slug },
        update: {},
        create: s,
      }),
    ),
  );
  console.log("Subjects created:", subjects.length);

  const matematika = subjects[0];
  await Promise.all(
    [
      { name: "Aljabar", slug: "aljabar", order: 1 },
      { name: "Geometri", slug: "geometri", order: 2 },
      { name: "Trigonometri", slug: "trigonometri", order: 3 },
      { name: "Kalkulus", slug: "kalkulus", order: 4 },
      { name: "Statistika", slug: "statistika", order: 5 },
    ].map((t) =>
      prisma.topic.upsert({
        where: { subjectId_slug: { subjectId: matematika.id, slug: t.slug } },
        update: {},
        create: { ...t, subjectId: matematika.id },
      }),
    ),
  );
  console.log("Topics for Matematika created");

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
      prisma.level.upsert({
        where: { level: l.level },
        update: {},
        create: l,
      }),
    ),
  );
  console.log("Levels created:", levels.length);

  const badges = await Promise.all(
    [
      {
        name: "Penakluk Trigonometri",
        description: "Kuasai semua konsep Trigonometri",
        category: "AKADEMIK",
        xpReward: 200,
      },
      {
        name: "Teman Aljabar",
        description: "Kuasai semua konsep Aljabar",
        category: "AKADEMIK",
        xpReward: 200,
      },
      {
        name: "Penjelajah Tata Bahasa",
        description: "Selesaikan semua topik Bahasa Indonesia",
        category: "AKADEMIK",
        xpReward: 200,
      },
      {
        name: "Grammar Hero",
        description: "Kuasai 10 konsep Bahasa Inggris",
        category: "AKADEMIK",
        xpReward: 150,
      },
      {
        name: "Ilmuwan Cilik",
        description: "Kuasai semua konsep IPA",
        category: "AKADEMIK",
        xpReward: 200,
      },
      {
        name: "Streak Master 7 Hari",
        description: "Belajar 7 hari berturut-turut",
        category: "KEBIASAAN",
        xpReward: 100,
      },
      {
        name: "Konsisten 30 Hari",
        description: "Belajar 30 hari berturut-turut",
        category: "KEBIASAAN",
        xpReward: 500,
      },
      {
        name: "Pagi yang Produktif",
        description: "Belajar sebelum jam 6 pagi",
        category: "KEBIASAAN",
        xpReward: 50,
      },
      {
        name: "Penanya Ulung",
        description: "Tanyakan 50 pertanyaan di mode Socratic",
        category: "KEBERANIAN",
        xpReward: 150,
      },
      {
        name: "Pemikir Kritis",
        description: "Jawab 100 soal dengan benar berturut-turut",
        category: "KEBERANIAN",
        xpReward: 300,
      },
      {
        name: "Pantang Menyerah",
        description: "Coba ulang soal yang salah sampai benar",
        category: "KEBERANIAN",
        xpReward: 100,
      },
      {
        name: "Petualang Matematika",
        description: "Selesaikan 50 soal Matematika",
        category: "AKADEMIK",
        xpReward: 150,
      },
      {
        name: "Sang Penjelajah",
        description: "Pelajari 20 topik berbeda",
        category: "KEBIASAAN",
        xpReward: 250,
      },
    ].map((b) =>
      prisma.badge.upsert({
        where: { name: b.name },
        update: {},
        create: b,
      }),
    ),
  );
  console.log("Badges created:", badges.length);

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
