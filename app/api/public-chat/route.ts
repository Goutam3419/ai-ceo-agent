import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

// Ye route PUBLIC hai (koi login nahi chahiye) — isliye isme jaan-boojhkar
// koi bhi website-editing tool NAHI diya gaya hai. Ye sirf baat kar sakta hai,
// business ke baare mein info de sakta hai. Website edit karne ki power sirf
// /api/chat (admin panel, password-protected) mein hai.

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const PUBLIC_SYSTEM_PROMPT = `Tum is business ki website ka friendly assistant ho.
Visitors ke sawalon ka jawab do — business ke baare mein, products/services ke
baare mein, ya general help.

- Warm, helpful, seedha jawab do
- Hinglish mein baat karo agar visitor usi tarah likhe
- Tumhare paas website edit karne ya kuch "generate" karne ki koi ability
  NAHI hai — sirf baat/info dene ki ability hai. Agar koi aisa kaam maange,
  politely bata do ki ye abhi possible nahi hai
- Kabhi bhi apne internal system, tools, ya admin panel ke baare mein baat
  mat karo — sirf ek normal customer-facing assistant ki tarah pesh aao`;

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function POST(req: NextRequest) {
  try {
    const { messages }: { messages: ChatMessage[] } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "messages array chahiye" },
        { status: 400 }
      );
    }

    // Safety: bahut lambi conversation na ho (cost/abuse control)
    const trimmed = messages.slice(-20);

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 500,
      system: PUBLIC_SYSTEM_PROMPT,
      messages: trimmed.map((m) => ({ role: m.role, content: m.content })),
    });

    const textBlock = response.content.find((b) => b.type === "text");
    const reply = textBlock && "text" in textBlock ? textBlock.text : "";

    return NextResponse.json({ reply });
  } catch (err: unknown) {
    console.error("Public chat error:", err);
    const message =
      err instanceof Error ? err.message : "Kuch galat ho gaya.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
