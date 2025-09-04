import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q") ?? "";
  const page = Number(url.searchParams.get("page") ?? "1");
  const take = Number(url.searchParams.get("take") ?? "20");
  const skip = (page - 1) * take;

  // ✅ Type the where object so TS is happy about QueryMode enum
  const where: Prisma.AboutQAWhereInput = q
    ? {
        OR: [
          { question: { contains: q, mode: Prisma.QueryMode.insensitive } },
          { answer: { contains: q, mode: Prisma.QueryMode.insensitive } },
          { category: { contains: q, mode: Prisma.QueryMode.insensitive } },
        ],
      }
    : {};

  const [items, total] = await Promise.all([
    prisma.aboutQA.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip,
      take,
    }),
    prisma.aboutQA.count({ where }),
  ]);

  return NextResponse.json({ items, total, page, take });
}
