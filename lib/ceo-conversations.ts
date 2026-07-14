import { tryGetAdminDb } from "./firebase-admin";
import type {
  CeoConversationDoc,
  CeoConversationMessageDoc,
} from "@/types/firestore";
import { randomUUID } from "crypto";

const COLLECTION = "ceoConversations";

export async function listConversations(
  includeArchived = false
): Promise<CeoConversationDoc[]> {
  const db = tryGetAdminDb();
  if (!db) return [];
  const snap = await db.collection(COLLECTION).where("deleted", "==", false).get();
  const all = snap.docs.map((d) => d.data() as CeoConversationDoc);
  const filtered = includeArchived ? all : all.filter((c) => !c.archived);
  return filtered.sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function createConversation(
  title = "New chat"
): Promise<CeoConversationDoc> {
  const db = tryGetAdminDb();
  const now = Date.now();
  const conversation: CeoConversationDoc = {
    id: randomUUID(),
    title,
    createdAt: now,
    updatedAt: now,
    archived: false,
    deleted: false,
    messageCount: 0,
  };
  if (db) await db.collection(COLLECTION).doc(conversation.id).set(conversation);
  return conversation;
}

export async function getConversation(
  id: string
): Promise<CeoConversationDoc | null> {
  const db = tryGetAdminDb();
  if (!db) return null;
  const doc = await db.collection(COLLECTION).doc(id).get();
  return doc.exists ? (doc.data() as CeoConversationDoc) : null;
}

export async function updateConversation(
  id: string,
  updates: Partial<Pick<CeoConversationDoc, "title" | "archived" | "deleted">>
): Promise<void> {
  const db = tryGetAdminDb();
  if (!db) return;
  const patch: Record<string, unknown> = { ...updates, updatedAt: Date.now() };
  if (updates.deleted) patch.deletedAt = Date.now();
  await db.collection(COLLECTION).doc(id).update(patch);
}

export async function listMessages(
  conversationId: string
): Promise<CeoConversationMessageDoc[]> {
  const db = tryGetAdminDb();
  if (!db) return [];
  const snap = await db
    .collection(COLLECTION)
    .doc(conversationId)
    .collection("messages")
    .get();
  return snap.docs
    .map((d) => d.data() as CeoConversationMessageDoc)
    .sort((a, b) => a.createdAt - b.createdAt);
}

export async function appendMessage(
  conversationId: string,
  message: Omit<CeoConversationMessageDoc, "id" | "createdAt">
): Promise<void> {
  const db = tryGetAdminDb();
  if (!db) return;
  const now = Date.now();
  const doc: CeoConversationMessageDoc = {
    ...message,
    id: randomUUID(),
    createdAt: now,
  };
  const convoRef = db.collection(COLLECTION).doc(conversationId);
  await convoRef.collection("messages").doc(doc.id).set(doc);
  await convoRef.update({
    updatedAt: now,
    messageCount: (await convoRef.collection("messages").count().get()).data().count,
    lastMessagePreview: message.content.slice(0, 120),
  });
}
