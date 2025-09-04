import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { prisma } from "@/lib/prisma";
import { embed } from "@/lib/embeddings";

// Shared helper to convert embedding vector to SQL string
const toVectorText = (arr: number[]) => `[${arr.join(",")}]`;

// Type representing a search result with similarity
type QAItem = {
  id: string;
  category: string;
  question: string;
  answer: string | null;
  sources: string[];
  similarity: number;
};

type ChatMessage = {
  role: "user" | "assistant" | "system";
  content: string;
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

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
const CHAT_MODEL = process.env.ABOUT_GPT_MODEL_ID ?? "gpt-4o-mini";

export async function POST(req: NextRequest) {
  const { messages }: { messages: ChatMessage[] } = await req.json();

  const lastUser =
    [...(messages ?? [])].reverse().find((m) => m.role === "user")?.content ??
    "";

  const k = 6;
  const retrieved =
    (await semantic(lastUser, k)) ?? (await keyword(lastUser, k));

  const facts = (retrieved ?? [])
    .map(
      (i, idx) =>
        `#${idx + 1} [${i.category}]\nQ: ${i.question}\nA: ${i.answer}`
    )
    .join("\n\n");

  const SYSTEM = `
You are the portfolio owner's assistant. Answer in FIRST PERSON as "I".
Paraphrase raw notes into clear, interview-ready answers.

Rules:
- Be concise (3–6 sentences) unless asked for more.
- Prefer the provided FACTS. Do NOT invent details.
- Emphasize: impact → approach → tools → outcome.
- Include concrete numbers/dates/tools if present.
- If not covered, say so briefly and suggest resume/contact. Do not hallucinate.
- If asked about previous work, answer and when referencing the portfolio remember that the user is currently on the portfolio site so direct them down to the work section.
- Tone: professional, warm, no buzzword salad.
`;

  const CONTEXT = facts
    ? `FACTS (my raw notes — paraphrase these, don't copy verbatim):\n\n${facts}`
    : `No prior facts found for this topic.`;

  const completion = await client.chat.completions.create({
    model: CHAT_MODEL,
    temperature: 0.4,
    messages: [
      { role: "system", content: SYSTEM },
      { role: "system", content: CONTEXT },
      ...(messages ?? []),
    ],
  });

  const content =
    completion.choices[0]?.message?.content ?? "Sorry, no response.";

  return NextResponse.json({ content });
}
