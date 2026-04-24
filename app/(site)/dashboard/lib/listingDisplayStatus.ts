import { 
  isValidLifecycleStatus,
  getVisibilityBucket,
  getStatusLabel,
  getStatusChipClass,
  type ListingLifecycleStatus
} from "@/app/lib/clasificados/listingLifecycleDomain";

export type Lang = "es" | "en";

export type ListingUiStatus =
  | "draft"
  | "pending"
  | "active"
  | "paused"
  | "expired"
  | "sold"
  | "archived"
  | "unknown";

type RowLike = {
  status?: string | null;
  is_published?: boolean | null;
};

/**
 * Resolve legacy UI status from database row using canonical lifecycle domain.
 * Handles both legacy `listings` table and category-specific tables.
 */
export function resolveListingUiStatus(row: RowLike): ListingUiStatus {
  const st = String(row.status ?? "active").toLowerCase().trim() || "active";
  
  // Handle is_published flag (legacy)
  if (row.is_published === false) return "draft";
  
  // Try canonical status mapping first
  if (isValidLifecycleStatus(st)) {
    const canonical = st as ListingLifecycleStatus;
    const bucket = getVisibilityBucket(canonical);
    
    switch (bucket) {
      case "public":
        return "active";
      case "pre_publish":
        return canonical === "pending_review" ? "pending" : "draft";
      case "suspended":
        return "paused";
      case "inactive":
        if (canonical === "sold") return "sold";
        if (canonical === "expired") return "expired";
        return "archived";
    }
  }
  
  // Legacy fallback mapping
  if (st === "sold") return "sold";
  if (st === "expired") return "expired";
  if (st === "paused") return "paused";
  if (st === "pending" || st === "flagged") return "pending";
  if (st === "unpublished" || st === "removed" || st === "archived") return "archived";
  if (st === "active") return "active";
  
  return "unknown";
}

export function listingUiStatusLabel(status: ListingUiStatus, lang: Lang): string {
  // Map UI status to canonical status for consistent labeling
  const canonicalMapping: Record<ListingUiStatus, ListingLifecycleStatus> = {
    draft: "draft",
    pending: "pending_review",
    active: "active",
    paused: "paused",
    expired: "expired", 
    sold: "sold",
    archived: "archived",
    unknown: "draft" // fallback
  };
  
  const canonicalStatus = canonicalMapping[status];
  return getStatusLabel(canonicalStatus, lang);
}

export function listingUiStatusChipClass(status: ListingUiStatus): string {
  // Map UI status to canonical status for consistent styling
  const canonicalMapping: Record<ListingUiStatus, ListingLifecycleStatus> = {
    draft: "draft",
    pending: "pending_review",
    active: "active",
    paused: "paused",
    expired: "expired",
    sold: "sold", 
    archived: "archived",
    unknown: "draft" // fallback
  };
  
  const canonicalStatus = canonicalMapping[status];
  return getStatusChipClass(canonicalStatus);
}

/** Short public reference from UUID (first 8 hex without dashes). */
export function shortListingRef(id: string): string {
  const s = (id ?? "").replace(/-/g, "");
  if (s.length < 8) return "—";
  return s.slice(0, 8).toUpperCase();
}

export function expiresInDaysLabel(iso: string | null | undefined, lang: Lang): string | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return null;
  const days = Math.ceil((t - Date.now()) / (86400 * 1000));
  if (days < 0) return lang === "es" ? "Expiró" : "Expired";
  if (days === 0) return lang === "es" ? "Expira hoy" : "Expires today";
  if (days === 1) return lang === "es" ? "Expira en 1 día" : "Expires in 1 day";
  return lang === "es" ? `Expira en ${days} días` : `Expires in ${days} days`;
}
