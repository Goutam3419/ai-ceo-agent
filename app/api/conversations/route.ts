import { NextRequest, NextResponse } from "next/server";
import { listConversations, createConversation } from "@/lib/ceo-conversations";

export async function GET(req: NextRequest) {
  try {
    const includeArchived = req.nextUrl.searchParams.get("archived") === "true";
    const conversations = await listConversations(includeArchived);
    return NextResponse.json({ conversations });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Kuch galat ho gaya.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { title } = await req.json().catch(() => ({}));
    const conversation = await createConversation(title);
    return NextResponse.json({ conversation });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Kuch galat ho gaya.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
