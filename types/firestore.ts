/**
 * SHARED FIRESTORE DATA LAYER
 * ============================
 * Single source of truth for document shapes across every module
 * (Rangoli, future Website Builder, future Marketplace).
 *
 * Design principles (per Master Reference Part 5, decision 4):
 * - One shared schema, no per-feature duplicate collections.
 * - "Workspace" is NOT a separate collection — it's just
 *   `projects where ownerId == uid`, queried on demand.
 * - /admin (owner) NEVER talks to Firestore through the client SDK.
 *   Any future owner-side Firestore access goes through server-side
 *   API routes using the Firebase Admin SDK, protected by the existing
 *   ADMIN_PASSWORD middleware — never through firestore.rules.
 * - Client Firestore Security Rules only govern the public/multi-tenant
 *   side: Rangoli, future Website Builder, Marketplace.
 * - Nothing is ever hard-deleted. Every user-generated collection
 *   supports soft delete (`deleted` + `deletedAt`) so data can be
 *   recovered and so deletions can be audited.
 */

import {
  ProjectType,
  ProjectStatus,
  TemplateType,
  VisibilityType,
  CreatorType,
  UserRole,
} from "./enums";

// ── users/{uid} ──────────────────────────────────────────────
export interface UserDoc {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role: UserRole; // governs elevated Firestore Rules permissions
  createdAt: number; // epoch ms
  plan: "free" | "pro" | "business";
  storageUsedBytes: number;
}

// ── projects/{projectId} ─────────────────────────────────────
// One collection for every kind of user-owned "thing" — a Rangoli
// design, a Website Builder site, a future app. The `type` field
// discriminates. Avoid creating a separate collection per feature.
export interface ProjectDoc {
  id: string;
  ownerId: string; // uid of the owning user — NEVER trust a client-supplied ownerId on write
  type: ProjectType;
  title: string;

  // ── Lifecycle ──
  status: ProjectStatus; // primary human-readable state
  version: number; // increments on every meaningful edit
  createdAt: number;
  updatedAt: number;
  lastPublishedAt?: number;
  published: boolean; // convenience flag mirroring status === "published"
  archived: boolean; // convenience flag mirroring status === "archived"
  deleted: boolean; // soft delete — never hard-delete a project
  deletedAt?: number;

  // ── Metadata ──
  thumbnail?: string;
  icon?: string;
  description?: string;
  tags?: string[];
  category?: string;
  visibility: VisibilityType;
  featured: boolean; // set by staff/admin to highlight in galleries
  favorite: boolean; // owner has marked their own project as a favorite
  // Note: this is the OWNER's own favorite flag. Other users favoriting
  // someone else's public/marketplace project needs a separate
  // per-user join (e.g. users/{uid}/favorites/{projectId}) — not yet
  // built, flagged as a future item since one boolean can't represent
  // "favorited by many different users."

  // ── Audit ──
  createdBy: CreatorType;
  updatedBy: CreatorType;

  // Only present when type === "website" and status === "published".
  // Used to build the public route, e.g. /site/u/{publicSlug}
  publicSlug?: string;

  // Type-specific payload. Keep small — large structures (like a
  // website's pages) go in a subcollection instead (see below).
  data: RangoliProjectData | WebsiteProjectData | Record<string, unknown>;
}

export interface RangoliProjectData {
  templateId: string;
  category: string;
  canvasJSON: object; // Fabric.js canvas.toJSON() output
}

export interface WebsiteProjectData {
  theme?: {
    primaryColor?: string;
    font?: string;
  };
  // Actual page content lives in the `pages` subcollection, not here.
}

// ── projects/{projectId}/pages/{pageId} ──────────────────────
// Subcollection, only used when the parent project has type "website".
// `ownerId` is denormalized here (duplicated from the parent) so
// Security Rules can check ownership without an extra read.
export interface WebsitePageDoc {
  id: string;
  ownerId: string;
  projectId: string;
  slug: string; // e.g. "home", "about" -> /site/u/{publicSlug}/{slug}
  title: string;
  order: number;
  blocksJSON: object; // Website Builder's block/section tree
  seo?: {
    title?: string;
    description?: string;
  };
  updatedAt: number;
  deleted: boolean;
  deletedAt?: number;
}

// ── templates/{templateId} ───────────────────────────────────
// System-provided templates (currently hardcoded in
// lib/rangoli-templates.ts). Designed so they CAN migrate into
// Firestore later without changing the shape.
export interface TemplateDoc {
  id: string;
  type: TemplateType;
  title: string;
  category: string;
  isPremium: boolean;
  thumbnail?: string;
  description?: string;
  tags?: string[];
  canvasJSON: object;
  featured: boolean;
  createdBy: CreatorType; // "system" for built-ins, else a creator's uid (future Creator Center)
  createdAt: number;
  updatedAt: number;
  deleted: boolean;
  deletedAt?: number;
}

// ── assets/{assetId} ──────────────────────────────────────────
export interface AssetDoc {
  id: string;
  ownerId: string;
  projectId?: string;
  url: string;
  type: "image" | "font" | "icon" | "video" | "audio";
  createdAt: number;
  deleted: boolean;
  deletedAt?: number;
}

// ── marketplace/{itemId} ─────────────────────────────────────
export interface MarketplaceItemDoc {
  id: string;
  sellerId: string;
  title: string;
  description?: string;
  category: string;
  tags?: string[];
  visibility: VisibilityType;
  isFree: boolean;
  price: number; // in paise/cents, 0 if free
  templateId?: string; // links to a templates/{id} if applicable
  assetId?: string;
  downloads: number;
  rating: number;
  featured: boolean;
  createdBy: CreatorType;
  updatedBy: CreatorType;
  createdAt: number;
  updatedAt: number;
  deleted: boolean;
  deletedAt?: number;
}

// ── orders/{orderId} ──────────────────────────────────────────
// NEVER created directly by client code. Only ever written by a
// server-side function after verifying a real payment (Razorpay
// webhook, once integrated). Security Rules must deny client writes.
export interface OrderDoc {
  id: string;
  buyerId: string;
  itemId: string;
  amount: number;
  status: "pending" | "paid" | "failed" | "refunded";
  createdAt: number;
}

// ── ceoMemory/{key} ───────────────────────────────────────────
// OWNER-ONLY. Documented exception to the standard "every collection
// needs ownerId" rule: there is exactly one owner in this system, this
// is not multi-tenant data, and it's never accessed via the client
// Firestore SDK at all — only through server-side Admin SDK inside
// password-protected /admin API routes. firestore.rules never applies
// to it (Admin SDK bypasses rules entirely).
export interface CeoMemoryDoc {
  key: string; // e.g. "project-context", "brand-identity", "roadmap"
  content: string;
  updatedAt: number;
  updatedBy: CreatorType;
}

// ── ceoTasks/{taskId} ─────────────────────────────────────────
// OWNER-ONLY, same documented exception as CeoMemoryDoc above.
export interface CeoTaskDoc {
  id: string;
  title: string;
  description?: string;
  status: "todo" | "in-progress" | "done";
  priority: "low" | "medium" | "high";
  progress?: number; // 0-100, for future project-management-style tracking
  labels?: string[];
  dependsOn?: string[]; // ids of other CeoTaskDoc this task depends on
  dueDate?: number; // epoch ms
  department?: string; // e.g. "frontend", "design" — internal CEO role tag, not a real person
  estimatedTimeMinutes?: number;
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
  createdBy: CreatorType;
  deleted: boolean;
  deletedAt?: number;
}

// ── ceoConversations/{conversationId} ────────────────────────
// OWNER-ONLY, same documented exception as CeoMemoryDoc above.
// This is TEMPORARY conversational history — never to be confused
// with CeoMemoryDoc, which is permanent long-term knowledge. A
// conversation can be deleted/archived freely; memory should not be
// derived from raw chat logs automatically.
export interface CeoConversationDoc {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  archived: boolean;
  deleted: boolean;
  deletedAt?: number;
  messageCount: number;
  lastMessagePreview?: string;
}

// ── ceoConversations/{conversationId}/messages/{messageId} ───
export interface CeoConversationMessageDoc {
  id: string;
  role: "user" | "assistant";
  content: string;
  category?: string;
  activity?: { tool: string; label: string }[];
  createdAt: number;
}
export interface NotificationDoc {
  id: string;
  title: string;
  body: string;
  type: "info" | "success" | "warning";
  read: boolean;
  createdAt: number;
}

