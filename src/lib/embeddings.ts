import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function embed(text: string): Promise<number[] | null> {
  try {
    const { data } = await client.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
    });

    return data[0].embedding as number[];
  } catch (e: unknown) {
    // Narrow the error before accessing properties
    if (e instanceof OpenAI.APIError) {
      console.error("[embeddings] APIError:", e.status, e.code, e.message);
    } else if (e instanceof Error) {
      console.error("[embeddings] Error:", e.message);
    } else {
      console.error("[embeddings] Unknown error:", e);
    }

    return null;
  }
}
