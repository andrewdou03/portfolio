// scripts/seedAboutQA.ts
import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import seeds from "./seeds-about-qa";

async function main() {
  let created = 0;
  for (const q of seeds) {
    await prisma.aboutQA.upsert({
      where: { question: q.question },
      update: { category: q.category, sources: q.sources, weight: q.weight },
      create: {
        category: q.category,
        question: q.question,
        sources: q.sources,
        weight: q.weight,
      },
    });
    created++;
  }
  console.log(`Seeded ${created} questions.`);
}

main()
  .catch((e) => {
    console.error("[seedAboutQA] Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
