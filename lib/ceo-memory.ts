import { tryGetAdminDb } from "./firebase-admin";
import type { CeoMemoryDoc } from "@/types/firestore";

const COLLECTION = "ceoMemory";

export async function getAllMemory(): Promise<CeoMemoryDoc[]> {
  const db = tryGetAdminDb();
  if (!db) return [];
  const snap = await db.collection(COLLECTION).get();
  return snap.docs.map((d) => d.data() as CeoMemoryDoc);
}

export async function getMemory(key: string): Promise<string | null> {
  const db = tryGetAdminDb();
  if (!db) return null;
  const doc = await db.collection(COLLECTION).doc(key).get();
  if (!doc.exists) return null;
  return (doc.data() as CeoMemoryDoc).content;
}

export async function setMemory(key: string, content: string): Promise<void> {
  const db = tryGetAdminDb();
  if (!db) return;
  const entry: CeoMemoryDoc = {
    key,
    content,
    updatedAt: Date.now(),
    updatedBy: "ceo-agent",
  };
  await db.collection(COLLECTION).doc(key).set(entry);
}

// Builds a compact text block to inject into the CEO's system prompt
// so it "remembers" project context across separate conversations.
export async function buildMemoryContext(): Promise<string> {
  const entries = await getAllMemory();
  if (entries.length === 0) return "";
  const lines = entries.map((e) => `- ${e.key}: ${e.content}`);
  return `\n\nKnown project memory (from previous conversations):\n${lines.join("\n")}`;
}
