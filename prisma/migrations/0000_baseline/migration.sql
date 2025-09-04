-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "public"."AboutQA" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "sources" TEXT[],
    "weight" INTEGER NOT NULL DEFAULT 1,
    "answer" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AboutQA_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."QAVector" (
    "qaId" TEXT NOT NULL,
    "embedding" vector NOT NULL,

    CONSTRAINT "QAVector_pkey" PRIMARY KEY ("qaId")
);

-- CreateIndex
CREATE UNIQUE INDEX "AboutQA_question_key" ON "public"."AboutQA"("question" ASC);

-- CreateIndex
CREATE INDEX "QAVector_embedding_cos_idx" ON "public"."QAVector"("embedding" ASC);

-- AddForeignKey
ALTER TABLE "public"."QAVector" ADD CONSTRAINT "QAVector_qaId_fkey" FOREIGN KEY ("qaId") REFERENCES "public"."AboutQA"("id") ON DELETE CASCADE ON UPDATE CASCADE;

