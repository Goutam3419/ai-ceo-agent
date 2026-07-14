/**
 * CENTRALIZED TYPES / ENUMS
 * ==========================
 * Every collection references these instead of raw string literals.
 * Using TypeScript string-literal unions (not the `enum` keyword) —
 * these serialize cleanly to Firestore as plain strings and tree-shake
 * better, while still giving full autocomplete/type-safety.
 */

export type ProjectType = "rangoli" | "website" | "app";

export type ProjectStatus = "draft" | "published" | "archived";

// What KIND of template it is — separate from Rangoli's design
// `category` (YouTube/Instagram/etc). Lets templates/{id} eventually
// cover more than just Rangoli canvas designs (e.g. website blocks).
export type TemplateType = "rangoli-design" | "website-block" | "document";

export type MarketplaceStatus =
  | "active"
  | "pending-review"
  | "removed"
  | "sold-out";

export type VisibilityType = "public" | "private" | "unlisted";

// Who/what created or last touched a document. Either one of these
// fixed system actors, or a real user's uid string.
export type CreatorType = "owner" | "ceo-agent" | "system" | (string & {});

// Role stored on users/{uid}.role — governs elevated Firestore Rules
// permissions (e.g. a moderator approving marketplace submissions).
// "owner" is reserved for future use — the real project owner does
// NOT authenticate via Firebase today (see /admin architecture notes),
// so in practice most accounts will be "user", with "moderator"/"staff"
// assigned manually later as the platform grows.
export type UserRole = "user" | "moderator" | "staff" | "admin" | "owner";
