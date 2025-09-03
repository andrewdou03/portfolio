import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs"; // or 'edge' if you prefer; swap to the Edge client accordingly

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// IMPORTANT: set this to your custom GPT's model ID in .env.local
// e.g. ABOUT_GPT_MODEL_ID=gpt-4.1-mini or gpt-4o-mini or your GPT's ID
const MODEL = process.env.ABOUT_GPT_MODEL_ID!;

// Optional: a strict system prompt to constrain scope & voice.
const SYSTEM = `
You are the portfolio owner's AI assistant answering in first person as "I".
Stay factual and concise. Topics allowed: skills, experience, projects, tools, process, availability.
If asked something outside scope, redirect politely and suggest viewing the resume or contacting me. Do not under any circumstance hallucinate details or make things up.
Tone: friendly, professional, confident.
`;

export async function POST(req: NextRequest) {
  try {
    const { messages } = (await req.json()) as {
      messages: { role: "user" | "assistant" | "system"; content: string }[];
    };

    const result = await client.chat.completions.create({
      model: MODEL,
      messages: [{ role: "system", content: SYSTEM }, ...(messages ?? [])],
      temperature: 0.3,
    });

    const content =
      result.choices[0]?.message?.content ?? "Sorry, no response.";
    return NextResponse.json({ content });
  } catch (err: any) {
    console.error("[about-chat]", err);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
