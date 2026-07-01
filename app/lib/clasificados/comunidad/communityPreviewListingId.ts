/** Stable preview listing UUID for Comunidad/Clases quick drafts (Leonix Ad ID before publish). */

export function newCommunityPreviewListingId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `com-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function ensureCommunityPreviewListingId(raw: unknown): string {
  const id = String(raw ?? "").trim();
  return id || newCommunityPreviewListingId();
}
