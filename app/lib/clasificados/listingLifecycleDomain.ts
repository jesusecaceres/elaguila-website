/**
 * Canonical listing lifecycle domain for Leonix Clasificados.
 * Single source of truth for status, visibility, and lifecycle operations across all categories.
 * Replaces duplicated lifecycle logic in autos, servicios, empleos, etc.
 */

export type Lang = "es" | "en";

// ===== CORE LIFECYCLE STATUSES =====
// These are the canonical statuses that map to category-specific implementations

export type ListingLifecycleStatus =
  // Draft/pre-publish states
  | "draft"
  | "preview_ready" 
  | "publish_ready"
  | "pending_payment"
  | "pending_review"
  
  // Active/public states
  | "published"
  | "active"
  
  // Paused/suspended states
  | "paused"
  | "paused_unpublished"
  | "suspended"
  
  // Terminal/inactive states
  | "sold"
  | "expired"
  | "archived"
  | "removed"
  | "unpublished"
  | "cancelled"
  | "rejected"
  | "payment_failed";

// ===== VISIBILITY BUCKETS =====

export type ListingVisibilityBucket = "public" | "pre_publish" | "inactive" | "suspended";

export function getVisibilityBucket(status: ListingLifecycleStatus): ListingVisibilityBucket {
  switch (status) {
    case "published":
    case "active":
      return "public";
      
    case "draft":
    case "preview_ready":
    case "publish_ready":
    case "pending_payment":
    case "pending_review":
      return "pre_publish";
      
    case "paused":
    case "paused_unpublished":
    case "suspended":
      return "suspended";
      
    case "sold":
    case "expired":
    case "archived":
    case "removed":
    case "unpublished":
    case "cancelled":
    case "rejected":
    case "payment_failed":
      return "inactive";
      
    default:
      return "inactive";
  }
}

// ===== VISIBILITY HELPERS =====

export function isPubliclyVisible(status: ListingLifecycleStatus): boolean {
  return getVisibilityBucket(status) === "public";
}

export function isPrePublish(status: ListingLifecycleStatus): boolean {
  return getVisibilityBucket(status) === "pre_publish";
}

export function isEditableDraft(status: ListingLifecycleStatus): boolean {
  return isPrePublish(status) || getVisibilityBucket(status) === "suspended";
}

export function isTerminal(status: ListingLifecycleStatus): boolean {
  return getVisibilityBucket(status) === "inactive";
}

// ===== OWNER ACTIONS =====

export type OwnerAction = 
  | "edit"
  | "publish"
  | "unpublish"
  | "pause"
  | "resume"
  | "mark_sold"
  | "archive"
  | "delete"
  | "renew";

export function getAvailableOwnerActions(status: ListingLifecycleStatus): OwnerAction[] {
  switch (status) {
    case "draft":
    case "preview_ready":
    case "publish_ready":
      return ["edit", "publish", "delete"];
      
    case "pending_payment":
    case "payment_failed":
      return ["edit", "publish", "delete"];
      
    case "pending_review":
      return ["edit", "delete"];
      
    case "published":
    case "active":
      return ["edit", "pause", "mark_sold", "archive", "renew"];
      
    case "paused":
    case "paused_unpublished":
      return ["edit", "resume", "archive", "delete"];
      
    case "suspended":
      return ["edit", "archive", "delete"];
      
    case "sold":
    case "expired":
    case "archived":
      return ["renew", "delete"];
      
    case "removed":
    case "unpublished":
    case "cancelled":
    case "rejected":
      return ["renew", "delete"];
      
    default:
      return [];
  }
}

// ===== STATUS LABELS =====

export function getStatusLabel(status: ListingLifecycleStatus, lang: Lang): string {
  const labels: Record<ListingLifecycleStatus, { es: string; en: string }> = {
    draft: { es: "Borrador", en: "Draft" },
    preview_ready: { es: "Listo para vista previa", en: "Preview ready" },
    publish_ready: { es: "Listo para publicar", en: "Publish ready" },
    pending_payment: { es: "Pago pendiente", en: "Payment pending" },
    pending_review: { es: "En revisión", en: "Pending review" },
    published: { es: "Publicado", en: "Published" },
    active: { es: "Activo", en: "Active" },
    paused: { es: "Pausado", en: "Paused" },
    paused_unpublished: { es: "Pausado (no público)", en: "Paused (unpublished)" },
    suspended: { es: "Suspendido", en: "Suspended" },
    sold: { es: "Vendido", en: "Sold" },
    expired: { es: "Expirado", en: "Expired" },
    archived: { es: "Archivado", en: "Archived" },
    removed: { es: "Retirado", en: "Removed" },
    unpublished: { es: "No publicado", en: "Unpublished" },
    cancelled: { es: "Cancelado", en: "Cancelled" },
    rejected: { es: "Rechazado", en: "Rejected" },
    payment_failed: { es: "Pago fallido", en: "Payment failed" },
  };
  
  return labels[status]?.[lang] ?? status;
}

// ===== UI STYLING =====

export function getStatusChipClass(status: ListingLifecycleStatus): string {
  const bucket = getVisibilityBucket(status);
  switch (bucket) {
    case "public":
      return "bg-emerald-100 text-emerald-900";
    case "pre_publish":
      return "bg-amber-100 text-amber-950";
    case "suspended":
      return "bg-sky-100 text-sky-950";
    case "inactive":
      return "bg-[#E8DFD0] text-[#5C5346]";
    default:
      return "bg-[#FAF7F2] text-[#5C5346]";
  }
}

// ===== CATEGORY MAPPINGS =====
// Helper functions to map category-specific statuses to canonical ones

export function mapAutosStatusToCanonical(status: string): ListingLifecycleStatus {
  const mapping: Record<string, ListingLifecycleStatus> = {
    "draft": "draft",
    "pending_payment": "pending_payment", 
    "active": "active",
    "payment_failed": "payment_failed",
    "cancelled": "cancelled",
    "removed": "removed",
  };
  return mapping[status] ?? "draft";
}

export function mapServiciosStatusToCanonical(status: string): ListingLifecycleStatus {
  const mapping: Record<string, ListingLifecycleStatus> = {
    "draft": "draft",
    "preview_ready": "preview_ready",
    "publish_ready": "publish_ready", 
    "published": "published",
    "paused_unpublished": "paused_unpublished",
    "pending_review": "pending_review",
    "rejected": "rejected",
    "suspended": "suspended",
  };
  return mapping[status] ?? "draft";
}

export function mapEmpleosStatusToCanonical(status: string): ListingLifecycleStatus {
  const mapping: Record<string, ListingLifecycleStatus> = {
    "draft": "draft",
    "ready_for_publish": "publish_ready",
    "published": "published", 
    "paused": "paused",
    "archived": "archived",
    "rejected": "rejected",
    "unpublished": "unpublished",
    "removed": "removed",
    "expired": "expired",
  };
  return mapping[status] ?? "draft";
}

// ===== VALIDATION =====

export function isValidLifecycleStatus(status: string | null | undefined): status is ListingLifecycleStatus {
  if (!status || typeof status !== "string") return false;
  const validStatuses: ListingLifecycleStatus[] = [
    "draft", "preview_ready", "publish_ready", "pending_payment", "pending_review",
    "published", "active", "paused", "paused_unpublished", "suspended",
    "sold", "expired", "archived", "removed", "unpublished", "cancelled", "rejected", "payment_failed"
  ];
  return validStatuses.includes(status as ListingLifecycleStatus);
}
