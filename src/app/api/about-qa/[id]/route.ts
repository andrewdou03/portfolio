import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { embed } from "@/lib/embeddings";

const toVectorText = (arr: number[]) => `[${arr.join(",")}]`;

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const body = await req.json();

  const category =
    typeof body.category === "string" ? body.category.trim() : "";
  const question =
    typeof body.question === "string" ? body.question.trim() : "";
  const answer = typeof body.answer === "string" ? body.answer.trim() : "";
  const sources = Array.isArray(body.sources) ? body.sources : [];
  const weight =
    typeof body.weight === "number" && Number.isFinite(body.weight)
      ? body.weight
      : 1;

  if (!question || !category) {
    return NextResponse.json(
      { error: "category and question are required" },
      { status: 400 }
    );
  }

  const before = await prisma.aboutQA.findUnique({ where: { id } });
  if (!before) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await prisma.aboutQA.update({
    where: { id },
    data: {
      category,
      question,
      sources,
      weight,
      answer: answer || null,
    },
  });

  try {
    if (before.answer !== updated.answer) {
      if (updated.answer) {
        const vec = await embed(`${updated.question}\n${updated.answer}`);
        if (vec) {
          const vecText = toVectorText(vec);
          await prisma.$executeRawUnsafe(
            `INSERT INTO "QAVector" ("qaId", "embedding")
             VALUES ($1, CAST($2 AS vector))
             ON CONFLICT ("qaId") DO UPDATE SET "embedding" = CAST($2 AS vector)`,
            id,
            vecText
          );
        }
      } else {
        await prisma.qAVector.delete({ where: { qaId: id } }).catch(() => {});
      }
    }
  } catch (e) {
    console.error("[qa update] embedding error:", e);
  }

  return NextResponse.json({ item: updated });
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  await prisma.qAVector.delete({ where: { qaId: id } }).catch(() => {});
  await prisma.aboutQA.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
