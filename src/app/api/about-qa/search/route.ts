import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { embed } from "@/lib/embeddings";
import { toVectorText } from "@/lib/pgvector";

// Type representing a QA item with similarity for search results
type QAItem = {
  id: string;
  category: string;
  question: string;
  answer: string | null;
  sources: string[];
  similarity: number;
};

async function semantic(query: string, k: number): Promise<QAItem[] | null> {
  const qvec = await embed(query);
  if (!qvec) return null;

  const vecText = toVectorText(qvec);

  const items = await prisma.$queryRawUnsafe<QAItem[]>(
    `
    SELECT q.id, q.category, q.question, q.answer, q.sources,
           1 - (v.embedding <=> CAST($1 AS vector)) AS similarity
    FROM "QAVector" v
    JOIN "AboutQA" q ON q.id = v."qaId"
    WHERE q.answer IS NOT NULL
    ORDER BY v.embedding <=> CAST($1 AS vector) ASC
    LIMIT $2
    `,
    vecText,
    Number(k)
  );

  return items;
}

async function keyword(query: string, k: number): Promise<QAItem[]> {
  const rows = await prisma.aboutQA.findMany({
    where: {
      answer: { not: null },
      OR: [
        { question: { contains: query, mode: "insensitive" } },
        { answer: { contains: query, mode: "insensitive" } },
      ],
    },
    take: k,
    orderBy: { updatedAt: "desc" },
  });

  return rows.map(
    (r): QAItem => ({
      id: r.id,
      category: r.category,
      question: r.question,
      answer: r.answer ?? null,
      sources: r.sources,
      similarity: 0.5,
    })
  );
}

export async function POST(req: NextRequest) {
  try {
    const { query, k = 6 }: { query: string; k?: number } = await req.json();
    if (!query?.trim()) return NextResponse.json({ items: [] });

    const items = (await semantic(query, k)) ?? (await keyword(query, k));
    return NextResponse.json({ items });
  } catch (e) {
    console.error("[about-qa/search] fatal:", e);
    return NextResponse.json({ items: [] }, { status: 200 });
  }
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q") ?? "";
  const k = Number(url.searchParams.get("k") ?? "6");

  if (!q.trim()) return NextResponse.json({ items: [] });

  const items = (await semantic(q, k)) ?? (await keyword(q, k));
  return NextResponse.json({ items });
}
