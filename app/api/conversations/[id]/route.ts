import { NextRequest, NextResponse } from "next/server";
import {
  getConversation,
  updateConversation,
  listMessages,
} from "@/lib/ceo-conversations";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const conversation = await getConversation(params.id);
    if (!conversation) {
      return NextResponse.json({ error: "Conversation nahi mili" }, { status: 404 });
    }
    const messages = await listMessages(params.id);
    return NextResponse.json({ conversation, messages });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Kuch galat ho gaya.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const updates = await req.json();
    await updateConversation(params.id, updates);
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Kuch galat ho gaya.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
