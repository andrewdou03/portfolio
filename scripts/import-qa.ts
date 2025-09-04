import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import fs from "fs";

type Row = {
  category: string;
  question: string;
  weight?: number;
  sources?: string[];
  answer?: string;
};

(async () => {
  const rows: Row[] = JSON.parse(fs.readFileSync("qa-import.json", "utf8"));
  for (const r of rows) {
    const item = await prisma.aboutQA.upsert({
      where: { question: r.question },
      update: {
        category: r.category,
        sources: r.sources ?? [],
        weight: r.weight ?? 1,
        answer: r.answer ?? null,
      },
      create: {
        category: r.category,
        question: r.question,
        sources: r.sources ?? [],
        weight: r.weight ?? 1,
        answer: r.answer ?? null,
      },
    });
    console.log("Upserted", item.id);
  }
  console.log("Done.");
  await prisma.$disconnect();
})();
