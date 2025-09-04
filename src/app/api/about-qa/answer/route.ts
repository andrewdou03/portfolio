// app/api/about-qa/answer/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { embed } from "@/lib/embeddings";
import { toVectorText } from "@/lib/pgvector";

export async function POST(req: NextRequest) {
  try {
    const { qaId, answer } = await req.json();
    if (!qaId || !answer?.trim()) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const updated = await prisma.aboutQA.update({
      where: { id: qaId },
      data: { answer },
    });

    try {
      const vec = await embed(`${updated.question}\n${answer}`);
      if (vec) {
        const vecText = toVectorText(vec);
        await prisma.$executeRawUnsafe(
          `
          INSERT INTO "QAVector" ("qaId","embedding")
          VALUES ($1, CAST($2 AS vector))
          ON CONFLICT ("qaId") DO UPDATE SET "embedding" = CAST($2 AS vector)
          `,
          qaId,
          vecText
        );
        return NextResponse.json({ ok: true, embedded: true });
      }
      return NextResponse.json({
        ok: true,
        embedded: false,
        warn: "Saved, but embedding failed",
      });
    } catch (e) {
      console.error("[about-qa/answer] embed/index fail:", e);
      return NextResponse.json({
        ok: true,
        embedded: false,
        warn: "Saved, but embedding failed",
      });
    }
  } catch (e) {
    console.error("[about-qa/answer] fatal:", e);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}
