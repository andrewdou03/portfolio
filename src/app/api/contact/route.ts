import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// Define expected shape of incoming JSON
type ContactFormInput = {
  name: string;
  email: string;
  message: string;
};

export async function POST(req: NextRequest) {
  try {
    const { name, email, message } = (await req.json()) as ContactFormInput;

    if (!name || !email || !message) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    await resend.emails.send({
      from: "Portfolio Contact <onboarding@resend.dev>",
      to: "andrew.dou2003@gmail.com",
      subject: `New message from ${name}`,
      replyTo: email,
      text: message,
    });

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    console.error("[contact]", e);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }
}
