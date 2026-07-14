import { NextResponse } from "next/server";
import { listTasks } from "@/lib/ceo-tasks";

export async function GET() {
  try {
    const tasks = await listTasks();
    return NextResponse.json({ tasks });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Kuch galat ho gaya.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
