/**
 * Empleos listing lifecycle — scaffolding for DB/API (no persistence in this pass).
 */
export type EmpleosListingLifecycleStatus =
  | "draft"
  | "ready_for_publish"
  | "published"
  | "paused"
  | "archived"
  | "rejected"
  | "unpublished"
  | "removed"
  | "expired";

export type EmpleosLane = "quick" | "premium" | "feria";
