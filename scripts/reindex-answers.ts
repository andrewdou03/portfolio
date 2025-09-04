import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { embed } from "../src/lib/embeddings";
import { toVectorText } from "../src/lib/pgvector";

(async () => {
  const rows = await prisma.aboutQA.findMany({
    where: { answer: { not: null } },
    orderBy: { updatedAt: "asc" },
  });

  let ok = 0,
    fail = 0;
  for (const r of rows) {
    const vec = await embed(`${r.question}\n${r.answer}`);
    if (!vec) {
      console.warn("skip (no embedding):", r.id);
      fail++;
      continue;
    }

    const vecText = toVectorText(vec); // e.g. "[0.1,0.2,...]"

    await prisma.$executeRawUnsafe(
      `
      INSERT INTO "QAVector" ("qaId","embedding")
      VALUES ($1, CAST($2 AS vector))
      ON CONFLICT ("qaId") DO UPDATE SET "embedding" = CAST($2 AS vector)
      `,
      r.id,
      vecText
    );
    ok++;
  }
  console.log(`Reindexed: ok=${ok}, skipped=${fail}`);
  await prisma.$disconnect();
})();
