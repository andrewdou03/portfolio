import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const next = await prisma.aboutQA.findFirst({
    where: { answer: null },
    orderBy: [{ weight: "desc" }, { createdAt: "asc" }],
  });
  const total = await prisma.aboutQA.count();
  const answered = await prisma.aboutQA.count({
    where: { NOT: { answer: null } },
  });
  return NextResponse.json({
    next,
    progress: {
      answered,
      total,
      pct: total ? Math.round((answered / total) * 100) : 0,
    },
  });
}
