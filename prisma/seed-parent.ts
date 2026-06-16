import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma";

const PARENT_EMAIL = "orangtua@sparkai.id";
const PARENT_PASSWORD = "orangtua123";
const PARENT_NAME = "Orang Tua Demo";

const CHILD_EMAIL = "siswa@sparkai.id";

async function main() {
  const passwordHash = await bcrypt.hash(PARENT_PASSWORD, 12);

  const parent = await prisma.user.upsert({
    where: { email: PARENT_EMAIL },
    update: {
      name: PARENT_NAME,
      passwordHash,
      role: "PARENT",
      isOnboarded: true,
    },
    create: {
      email: PARENT_EMAIL,
      name: PARENT_NAME,
      passwordHash,
      role: "PARENT",
      isOnboarded: true,
    },
  });

  await prisma.parentProfile.upsert({
    where: { userId: parent.id },
    update: {},
    create: { userId: parent.id },
  });

  const child = await prisma.user.findUnique({
    where: { email: CHILD_EMAIL },
    select: { id: true },
  });

  if (child) {
    const existingLink = await prisma.parentStudentLink.findFirst({
      where: { parentId: parent.id, studentId: child.id },
    });

    if (!existingLink) {
      await prisma.parentStudentLink.create({
        data: {
          parentId: parent.id,
          studentId: child.id,
          inviteCode: `DEMO-${Date.now()}`,
          status: "ACCEPTED",
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        },
      });
    }
  }

  console.log(`✓ Akun orang tua dibuat: ${PARENT_EMAIL} / ${PARENT_PASSWORD}`);
  console.log(`  - isOnboarded: true`);
  if (child) {
    console.log(`  - Terhubung ke anak: ${CHILD_EMAIL}`);
  } else {
    console.log(
      `  ⚠ Anak (${CHILD_EMAIL}) belum ada di DB. Jalankan seed-student dulu.`,
    );
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
