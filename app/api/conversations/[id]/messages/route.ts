import { NextRequest, NextResponse } from "next/server";
import { appendMessage } from "@/lib/ceo-conversations";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const message = await req.json();
    await appendMessage(params.id, message);
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Kuch galat ho gaya.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
