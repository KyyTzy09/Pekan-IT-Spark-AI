import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma";

const STUDENT_EMAIL = "siswa@sparkai.id";
const STUDENT_PASSWORD = "siswa123";
const STUDENT_NAME = "Siswa Demo";
const STUDENT_SCHOOL = "SMA Negeri 1 Demo";
const FOCUSED_SUBJECT_SLUGS = ["MATEMATIKA", "IPA"] as const;

async function main() {
  const passwordHash = await bcrypt.hash(STUDENT_PASSWORD, 12);

  const subjects = await prisma.subject.findMany({
    where: { slug: { in: [...FOCUSED_SUBJECT_SLUGS] } },
    select: { id: true, slug: true },
  });
  if (subjects.length !== FOCUSED_SUBJECT_SLUGS.length) {
    const found = new Set(subjects.map((s) => s.slug));
    const missing = FOCUSED_SUBJECT_SLUGS.filter((s) => !found.has(s));
    throw new Error(
      `Subject belum ada di DB, jalankan \`bun run db:seed\` dulu. Missing: ${missing.join(", ")}`,
    );
  }
  const focusedSubjectIds = subjects.map((s) => s.id);

  const user = await prisma.user.upsert({
    where: { email: STUDENT_EMAIL },
    update: {
      name: STUDENT_NAME,
      passwordHash,
      role: "STUDENT",
      isOnboarded: true,
    },
    create: {
      email: STUDENT_EMAIL,
      name: STUDENT_NAME,
      passwordHash,
      role: "STUDENT",
      isOnboarded: true,
    },
  });

  await prisma.studentProfile.upsert({
    where: { userId: user.id },
    update: {
      educationLevel: "SMA",
      grade: 11,
      school: STUDENT_SCHOOL,
      focusedSubjects: focusedSubjectIds,
      learningStyle: "VISUAL",
      reminderEnabled: false,
      reminderTime: null,
    },
    create: {
      userId: user.id,
      educationLevel: "SMA",
      grade: 11,
      school: STUDENT_SCHOOL,
      focusedSubjects: focusedSubjectIds,
      learningStyle: "VISUAL",
      reminderEnabled: false,
      reminderTime: null,
    },
  });

  console.log(`✓ Akun siswa dibuat: ${STUDENT_EMAIL} / ${STUDENT_PASSWORD}`);
  console.log(`  - isOnboarded: true`);
  console.log(`  - Profile: SMA kelas 11, ${STUDENT_SCHOOL}`);
  console.log(`  - Fokus: ${FOCUSED_SUBJECT_SLUGS.join(", ")}`);
  console.log(`  - Learning style: VISUAL`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
