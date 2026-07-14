import { tryGetAdminDb } from "./firebase-admin";
import type { CeoTaskDoc } from "@/types/firestore";
import { randomUUID } from "crypto";

const COLLECTION = "ceoTasks";

export async function listTasks(): Promise<CeoTaskDoc[]> {
  const db = tryGetAdminDb();
  if (!db) return [];
  const snap = await db
    .collection(COLLECTION)
    .where("deleted", "==", false)
    .get();
  return snap.docs
    .map((d) => d.data() as CeoTaskDoc)
    .sort((a, b) => b.createdAt - a.createdAt);
}

export async function createTask(
  title: string,
  priority: CeoTaskDoc["priority"] = "medium",
  description?: string
): Promise<CeoTaskDoc> {
  const db = tryGetAdminDb();
  const now = Date.now();
  const task: CeoTaskDoc = {
    id: randomUUID(),
    title,
    description,
    status: "todo",
    priority,
    createdAt: now,
    updatedAt: now,
    createdBy: "ceo-agent",
    deleted: false,
  };
  if (db) await db.collection(COLLECTION).doc(task.id).set(task);
  return task;
}

export async function updateTaskStatus(
  taskId: string,
  status: CeoTaskDoc["status"]
): Promise<void> {
  const db = tryGetAdminDb();
  if (!db) return;
  await db
    .collection(COLLECTION)
    .doc(taskId)
    .update({
      status,
      updatedAt: Date.now(),
      ...(status === "done" ? { completedAt: Date.now() } : {}),
    });
}

export async function buildTaskContext(): Promise<string> {
  const tasks = await listTasks();
  const active = tasks.filter((t) => t.status !== "done");
  if (active.length === 0) return "";
  const lines = active.map(
    (t) => `- [${t.status}] (${t.priority}) ${t.title}`
  );
  return `\n\nCurrent open tasks:\n${lines.join("\n")}`;
}
