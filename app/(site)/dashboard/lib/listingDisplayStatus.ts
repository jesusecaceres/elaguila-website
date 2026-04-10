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

export function resolveListingUiStatus(row: RowLike): ListingUiStatus {
  const st = String(row.status ?? "active").toLowerCase().trim() || "active";
  if (row.is_published === false) return "draft";
  if (st === "sold") return "sold";
  if (st === "expired") return "expired";
  if (st === "paused") return "paused";
  if (st === "pending" || st === "flagged") return "pending";
  if (st === "unpublished" || st === "removed" || st === "archived") return "archived";
  if (st === "active") return "active";
  return "unknown";
}

export function listingUiStatusLabel(status: ListingUiStatus, lang: Lang): string {
  const es: Record<ListingUiStatus, string> = {
    draft: "Borrador",
    pending: "Pendiente",
    active: "Activo",
    paused: "Pausado",
    expired: "Expirado",
    sold: "Vendido",
    archived: "Archivado",
    unknown: "Estado",
  };
  const en: Record<ListingUiStatus, string> = {
    draft: "Draft",
    pending: "Pending",
    active: "Active",
    paused: "Paused",
    expired: "Expired",
    sold: "Sold",
    archived: "Archived",
    unknown: "Status",
  };
  return lang === "es" ? es[status] : en[status];
}

export function listingUiStatusChipClass(status: ListingUiStatus): string {
  switch (status) {
    case "active":
      return "bg-emerald-100 text-emerald-900";
    case "sold":
    case "archived":
    case "expired":
      return "bg-[#E8DFD0] text-[#5C5346]";
    case "pending":
      return "bg-amber-100 text-amber-950";
    case "paused":
      return "bg-sky-100 text-sky-950";
    case "draft":
      return "border border-amber-200 bg-amber-50 text-amber-900";
    default:
      return "bg-[#FAF7F2] text-[#5C5346]";
  }
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
