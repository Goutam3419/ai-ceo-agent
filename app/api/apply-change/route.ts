import { NextRequest, NextResponse } from "next/server";
import { writeRepoFile } from "@/lib/github";

export async function POST(req: NextRequest) {
  try {
    const { path, content, commitMessage } = await req.json();

    if (!path || content === undefined || !commitMessage) {
      return NextResponse.json(
        { error: "path, content aur commitMessage zaroori hain" },
        { status: 400 }
      );
    }

    const result = await writeRepoFile(path, content, commitMessage);

    return NextResponse.json({ ok: true, ...result });
  } catch (err: unknown) {
    console.error("Apply change error:", err);
    const message =
      err instanceof Error ? err.message : "GitHub pe push karte waqt error aaya.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
