import { prisma } from "../src/lib/prisma";

async function main() {
  const subjects = await prisma.subject.findMany({
    select: { slug: true, name: true, isCustom: true, source: true },
    orderBy: { order: "asc" },
  });
  console.log("=== SUBJECTS ===");
  for (const s of subjects) {
    console.log(
      `  ${s.slug.padEnd(20)} | ${s.name.padEnd(30)} | custom=${s.isCustom} | source=${s.source}`,
    );
  }

  console.log("\n=== CONCEPT COUNT BY SUBJECT ===");
  for (const s of subjects) {
    const count = await prisma.concept.count({
      where: {
        topic: { subjectId: s.slug === "MATEMATIKA" ? undefined : undefined },
      },
    });
    void count;
  }
  // Better: group by topic.subject
  const topicsBySubj = await prisma.topic.findMany({
    include: {
      subject: { select: { slug: true } },
      _count: { select: { concepts: true } },
    },
  });
  const bySubj: Record<string, { topics: number; concepts: number }> = {};
  for (const t of topicsBySubj) {
    const slug = t.subject.slug;
    if (!bySubj[slug]) bySubj[slug] = { topics: 0, concepts: 0 };
    bySubj[slug].topics += 1;
    bySubj[slug].concepts += t._count.concepts;
  }
  for (const [slug, v] of Object.entries(bySubj)) {
    console.log(
      `  ${slug.padEnd(20)} | topics=${v.topics.toString().padEnd(3)} | concepts=${v.concepts}`,
    );
  }

  console.log("\n=== QUESTION COUNT BY SUBJECT ===");
  for (const s of subjects) {
    const count = await prisma.question.count({
      where: { concept: { topic: { subject: { slug: s.slug } } } },
    });
    console.log(`  ${s.slug.padEnd(20)} | questions=${count}`);
  }

  console.log("\n=== BADGES ===");
  const badges = await prisma.badge.count();
  console.log(`  Total badges: ${badges}`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
