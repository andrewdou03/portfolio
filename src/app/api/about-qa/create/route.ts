import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const { category, question, sources = [], weight = 1 } = await req.json();
  if (!category || !question)
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  const item = await prisma.aboutQA.create({
    data: { category, question, sources, weight },
  });
  return NextResponse.json({ item });
}
