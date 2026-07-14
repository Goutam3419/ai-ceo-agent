import { NextResponse } from "next/server";
import { getAllMemory } from "@/lib/ceo-memory";

export async function GET() {
  try {
    const memory = await getAllMemory();
    return NextResponse.json({ memory });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Kuch galat ho gaya.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
