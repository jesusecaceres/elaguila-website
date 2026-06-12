/**
 * Centralized admin dashboard reads. Server-only via getAdminSupabase.
 *
 * REAL NOW:
 * - pendingReports: listing_reports.status = 'pending'
 * - pendingListingsReview: listings.status IN ('pending','flagged') when column supports it; else 0 + fallback note
 * - categoryCounts: grouped count by listings.category for active-ish rows
 * - expiringQueueItems: rows with En Venta visibility window end (`republished_at` + window) / optional `expires_at` (listings) or `viajes_staged_listings.expires_at`
 * - pendingReviewItems: pending/flagged listings, else recent listings fallback (not used as expiring)
 * - disabledUsersCount: profiles.is_disabled = true
 *
 * FUTURE / TODO:
 * - usersNeedingHelp: no support tickets table — proxy uses disabled users count only
 */
import { EN_VENTA_VISIBILITY_WINDOW_MS } from "@/app/clasificados/en-venta/boosts/enVentaVisibilityRenewal";
import { getAdminSupabase } from "@/app/lib/supabase/server";
import { resolvePublicMagazineManifest } from "@/app/lib/magazine/magazineManifestServer";
import { normalizeGenericListingForAdmin, type GenericListingAdminInput } from "@/app/admin/_lib/adminAdIdentity";

/** Ads expiring within this window surface under “Expiring soon” (dashboard MOBILE-01). */
export const ADMIN_DASHBOARD_EXPIRING_SOON_MS = 3 * 24 * 60 * 60 * 1000;
export const ADMIN_DASHBOARD_EXPIRING_SOON_DAYS = 3;
const EXPIRING_SOON_MS = ADMIN_DASHBOARD_EXPIRING_SOON_MS;
const MAX_EXPIRING_ROWS = 15;
const MAX_PENDING_REVIEW_ROWS = 12;

export type AdminDashboardExpiringQueueRow = {
  source: "generic_listings" | "viajes_staged";
  title: string;
  /** Human-readable source / lane (e.g. listings · rentas, Viajes staged). */
  categorySource: string;
  leonixAdId: string | null;
  internalId: string;
  ownerUserId: string | null;
  status: string | null;
  /** ISO 8601 — the deadline used for sorting and badges (soonest of visibility window end vs listing expiry when both exist). */
  expiresAtIso: string;
  /** Which DB field supplied the chosen deadline (or both, soonest). */
  expirationFieldLabel: string;
  isExpired: boolean;
  isExpiringSoon: boolean;
  adminHref: string;
  /** Null when there is no safe public URL for this row. */
  publicHref: string | null;
};

export type AdminDashboardPendingReviewQueueRow = {
  source: "generic_listings" | "empleos_public_listings" | "viajes_staged_listings";
  title: string;
  categorySource: string;
  leonixAdId: string | null;
  internalId: string;
  ownerUserId: string | null;
  status: string;
  reason: string | null;
  updatedAtIso: string | null;
  adminHref: string;
  publicHref: string | null;
};

export type AdminDashboardLeadsCounts = {
  unavailable: boolean;
  unavailableNote: string | null;
  launchLeadsActive: number;
  leadsNeedingReply: number;
  promoLeadsActive: number;
  advertisingLeadsActive: number;
  mediaKitActive: number;
  newsletterActive: number;
};

export type AdminDashboardSnapshot = {
  pendingListingsReview: number;
  pendingReports: number;
  usersNeedingHelpProxy: number;
  /** Explained in UI: best-effort proxy, not a ticket count. */
  usersNeedingHelpNote: string;
  disabledUsersCount: number;
  magazineFeaturedLabel: string | null;
  magazineUpdated: string | null;
  categoryCounts: Array<{ category: string; count: number }>;
  expiringQueueItems: AdminDashboardExpiringQueueRow[];
  pendingReviewQueueItems: AdminDashboardPendingReviewQueueRow[];
  /** When true, pending listing count may be incomplete (DB doesn't filter as expected). */
  listingsQueryFallback: boolean;
};

async function readMagazineFeatured(): Promise<{ label: string | null; updated: string | null }> {
  try {
    const m = await resolvePublicMagazineManifest();
    const f = m.featured;
    const title = f?.title?.es ?? f?.month ?? null;
    const label = title && f?.year ? `${title} · ${f.year}` : title;
    return { label, updated: f?.updated ?? null };
  } catch {
    return { label: null, updated: null };
  }
}

function parseDeadlineMs(iso: unknown): number | null {
  if (iso == null) return null;
  const t = Date.parse(String(iso));
  return Number.isFinite(t) ? t : null;
}

function nonEmptyString(v: unknown): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  return s.length ? s : null;
}

async function listingsTableHasColumn(
  supabase: ReturnType<typeof getAdminSupabase>,
  column: string,
): Promise<boolean> {
  const { error } = await supabase.from("listings").select(`id,${column}`).limit(1);
  if (error) {
    const m = String(error.message ?? "");
    if (/column|does not exist|Could not find/i.test(m)) return false;
  }
  return !error;
}

type ListingExpiringDbRow = {
  id: string;
  title: string | null;
  category: string | null;
  status: string | null;
  owner_id: string | null;
  is_published?: boolean | null;
  republished_at?: string | null;
  expires_at?: string | null;
  leonix_ad_id?: string | null;
};

function mapListingToExpiringRow(
  row: ListingExpiringDbRow,
  listingsHasExpiresAt: boolean,
  listingsHasRepublishedAt: boolean,
): AdminDashboardExpiringQueueRow | null {
  const repMs = listingsHasRepublishedAt ? parseDeadlineMs(row.republished_at) : null;
  const visibilityEndMs = repMs != null ? repMs + EN_VENTA_VISIBILITY_WINDOW_MS : null;
  const expMs = listingsHasExpiresAt ? parseDeadlineMs(row.expires_at) : null;
  const parts: Array<{ ms: number; label: string }> = [];
  if (visibilityEndMs != null) parts.push({ ms: visibilityEndMs, label: "visibility_window_end" });
  if (expMs != null) parts.push({ ms: expMs, label: "expires_at" });
  if (!parts.length) return null;
  parts.sort((a, b) => a.ms - b.ms);
  const chosen = parts[0];
  const now = Date.now();
  const isExpired = chosen.ms < now;
  const isExpiringSoon = !isExpired && chosen.ms - now <= EXPIRING_SOON_MS;
  const norm = normalizeGenericListingForAdmin(row as GenericListingAdminInput);
  const adminHref = norm?.adminUrl ?? `/admin/workspace/clasificados?q=${encodeURIComponent(row.id)}`;
  const leonix = norm?.publishedId ?? null;
  const title = norm?.title ?? (row.title?.trim() ? row.title : "(no title)");
  const cat = (row.category ?? "").trim() || "—";
  const fieldLabel = parts.length > 1 ? `${chosen.label} (soonest)` : chosen.label;

  return {
    source: "generic_listings",
    title,
    categorySource: `listings · ${cat}`,
    leonixAdId: leonix,
    internalId: row.id,
    ownerUserId: row.owner_id,
    status: row.status,
    expiresAtIso: new Date(chosen.ms).toISOString(),
    expirationFieldLabel: fieldLabel,
    isExpired,
    isExpiringSoon,
    adminHref,
    publicHref: `/clasificados/anuncio/${encodeURIComponent(row.id)}`,
  };
}

async function fetchGenericListingsExpiring(
  supabase: ReturnType<typeof getAdminSupabase>,
): Promise<AdminDashboardExpiringQueueRow[]> {
  const hasExpiresAt = await listingsTableHasColumn(supabase, "expires_at");
  const hasRepublishedAt = await listingsTableHasColumn(supabase, "republished_at");
  const hasLeonix = await listingsTableHasColumn(supabase, "leonix_ad_id");
  const baseCols = ["id", "title", "category", "status", "owner_id", "is_published"];
  if (hasRepublishedAt) baseCols.push("republished_at");
  if (hasExpiresAt) baseCols.push("expires_at");
  if (hasLeonix) baseCols.push("leonix_ad_id");
  const selectCols = baseCols.join(",");

  let q = supabase.from("listings").select(selectCols).limit(80);
  if (hasRepublishedAt && hasExpiresAt) {
    q = q.or("republished_at.not.is.null,expires_at.not.is.null");
  } else if (hasRepublishedAt) {
    q = q.not("republished_at", "is", null);
  } else if (hasExpiresAt) {
    q = q.not("expires_at", "is", null);
  } else {
    return [];
  }
  const { data, error } = await q;
  if (error) {
    const m = String(error.message ?? "");
    if (hasLeonix && /leonix_ad_id|column/i.test(m)) {
      const colsNoLx = baseCols.filter((c) => c !== "leonix_ad_id").join(",");
      let q2 = supabase.from("listings").select(colsNoLx).limit(80);
      if (hasRepublishedAt && hasExpiresAt) {
        q2 = q2.or("republished_at.not.is.null,expires_at.not.is.null");
      } else if (hasRepublishedAt) {
        q2 = q2.not("republished_at", "is", null);
      } else if (hasExpiresAt) {
        q2 = q2.not("expires_at", "is", null);
      }
      const { data: d2, error: e2 } = await q2;
      if (e2 || !d2) return [];
      return ((d2 as unknown) as ListingExpiringDbRow[])
        .map((r) => mapListingToExpiringRow(r, hasExpiresAt, hasRepublishedAt))
        .filter((x): x is AdminDashboardExpiringQueueRow => x != null);
    }
    return [];
  }
  return (((data as unknown) as ListingExpiringDbRow[]) ?? [])
    .map((r) => mapListingToExpiringRow(r, hasExpiresAt, hasRepublishedAt))
    .filter((x): x is AdminDashboardExpiringQueueRow => x != null);
}

type ViajesExpiringDbRow = {
  id: string;
  slug: string;
  title: string;
  lifecycle_status: string;
  owner_user_id: string | null;
  expires_at: string;
  is_public: boolean;
};

async function fetchViajesStagedExpiring(
  supabase: ReturnType<typeof getAdminSupabase>,
): Promise<AdminDashboardExpiringQueueRow[]> {
  const { data, error } = await supabase
    .from("viajes_staged_listings")
    .select("id,slug,title,lifecycle_status,owner_user_id,expires_at,is_public")
    .not("expires_at", "is", null)
    .limit(40);
  if (error || !data?.length) return [];

  const now = Date.now();
  const out: AdminDashboardExpiringQueueRow[] = [];
  for (const row of (data as unknown) as ViajesExpiringDbRow[]) {
    const ms = parseDeadlineMs(row.expires_at);
    if (ms == null) continue;
    const isExpired = ms < now;
    const isExpiringSoon = !isExpired && ms - now <= EXPIRING_SOON_MS;
    const publicOk = row.lifecycle_status === "approved" && row.is_public === true;
    out.push({
      source: "viajes_staged",
      title: row.title?.trim() ? row.title : "(no title)",
      categorySource: "viajes_staged_listings",
      leonixAdId: null,
      internalId: row.id,
      ownerUserId: row.owner_user_id,
      status: row.lifecycle_status,
      expiresAtIso: new Date(ms).toISOString(),
      expirationFieldLabel: "expires_at",
      isExpired,
      isExpiringSoon,
      adminHref: "/admin/clasificados/viajes/business-offers",
      publicHref: publicOk ? `/clasificados/viajes/oferta/${encodeURIComponent(row.slug)}` : null,
    });
  }
  return out;
}

async function buildExpiringQueueMerged(
  supabase: ReturnType<typeof getAdminSupabase>,
): Promise<AdminDashboardExpiringQueueRow[]> {
  const [generic, viajes] = await Promise.all([fetchGenericListingsExpiring(supabase), fetchViajesStagedExpiring(supabase)]);
  return [...generic, ...viajes]
    .sort((a, b) => Date.parse(a.expiresAtIso) - Date.parse(b.expiresAtIso))
    .slice(0, MAX_EXPIRING_ROWS);
}

type ListingsPendingReviewDbRow = {
  id: string;
  title: string | null;
  category: string | null;
  status: string;
  owner_id: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  leonix_ad_id?: string | null;
};

async function fetchListingsPendingReview(
  supabase: ReturnType<typeof getAdminSupabase>,
): Promise<AdminDashboardPendingReviewQueueRow[]> {
  const hasLeonix = await listingsTableHasColumn(supabase, "leonix_ad_id");
  const baseCols = ["id", "title", "category", "status", "owner_id", "created_at", "updated_at"];
  if (hasLeonix) baseCols.push("leonix_ad_id");
  const selectCols = baseCols.join(",");

  const { data, error } = await supabase
    .from("listings")
    .select(selectCols)
    .in("status", ["pending", "flagged"])
    .order("updated_at", { ascending: false })
    .limit(40);
  if (error || !data) return [];

  const out: AdminDashboardPendingReviewQueueRow[] = [];
  for (const row of (data as unknown) as ListingsPendingReviewDbRow[]) {
    const internalId = nonEmptyString(row.id);
    const status = nonEmptyString(row.status);
    if (!internalId || !status) continue;
    const category = nonEmptyString(row.category) ?? "unknown";
    const norm = normalizeGenericListingForAdmin(row as unknown as GenericListingAdminInput);
    out.push({
      source: "generic_listings",
      title: norm?.title ?? nonEmptyString(row.title) ?? "(no title)",
      categorySource: `listings · ${category}`,
      leonixAdId: norm?.publishedId ?? null,
      internalId,
      ownerUserId: nonEmptyString(row.owner_id),
      status,
      reason: null,
      updatedAtIso: nonEmptyString(row.updated_at) ?? nonEmptyString(row.created_at),
      adminHref: norm?.adminUrl ?? `/admin/workspace/clasificados?q=${encodeURIComponent(internalId)}`,
      publicHref: `/clasificados/anuncio/${encodeURIComponent(internalId)}`,
    });
  }
  return out;
}

type EmpleosPendingReviewDbRow = {
  id: string;
  slug: string;
  title: string;
  company_name: string;
  owner_user_id: string | null;
  lifecycle_status: string;
  moderation_reason: string | null;
  review_notes: string | null;
  updated_at: string | null;
  created_at: string | null;
  published_at: string | null;
  leonix_ad_id?: string | null;
};

async function fetchEmpleosPendingReview(
  supabase: ReturnType<typeof getAdminSupabase>,
): Promise<AdminDashboardPendingReviewQueueRow[]> {
  // Phase 5 added leonix_ad_id; still be defensive on older DBs.
  const cols =
    "id,slug,title,company_name,owner_user_id,lifecycle_status,moderation_reason,review_notes,updated_at,created_at,published_at,leonix_ad_id";
  const { data, error } = await supabase
    .from("empleos_public_listings")
    .select(cols)
    .eq("lifecycle_status", "pending_review")
    .order("updated_at", { ascending: false })
    .limit(40);
  if (error || !data) return [];

  const out: AdminDashboardPendingReviewQueueRow[] = [];
  for (const row of (data as unknown) as EmpleosPendingReviewDbRow[]) {
    const internalId = nonEmptyString(row.id);
    const status = nonEmptyString(row.lifecycle_status);
    if (!internalId || !status) continue;
    const title = `${nonEmptyString(row.title) ?? "(no title)"} · ${nonEmptyString(row.company_name) ?? "—"}`;
    const leonix = nonEmptyString((row as { leonix_ad_id?: unknown }).leonix_ad_id);
    const reason = nonEmptyString(row.moderation_reason) ?? nonEmptyString(row.review_notes);
    const adminHref = leonix
      ? `/admin/workspace/clasificados/empleos?q=${encodeURIComponent(leonix)}`
      : `/admin/workspace/clasificados/empleos?q=${encodeURIComponent(internalId)}`;

    out.push({
      source: "empleos_public_listings",
      title,
      categorySource: "empleos_public_listings",
      leonixAdId: leonix,
      internalId,
      ownerUserId: nonEmptyString(row.owner_user_id),
      status,
      reason,
      updatedAtIso: nonEmptyString(row.updated_at) ?? nonEmptyString(row.created_at) ?? nonEmptyString(row.published_at),
      adminHref,
      publicHref: null, // not safe/available while pending_review
    });
  }
  return out;
}

type ViajesPendingReviewDbRow = {
  id: string;
  slug: string;
  title: string;
  owner_user_id: string | null;
  lifecycle_status: string;
  review_notes: string | null;
  moderation_reason: string | null;
  updated_at: string | null;
  submitted_at: string | null;
  is_public: boolean;
};

async function fetchViajesPendingReview(
  supabase: ReturnType<typeof getAdminSupabase>,
): Promise<AdminDashboardPendingReviewQueueRow[]> {
  const { data, error } = await supabase
    .from("viajes_staged_listings")
    .select("id,slug,title,owner_user_id,lifecycle_status,review_notes,moderation_reason,updated_at,submitted_at,is_public")
    .in("lifecycle_status", ["submitted", "in_review", "changes_requested"])
    .order("updated_at", { ascending: false })
    .limit(40);
  if (error || !data) return [];

  const out: AdminDashboardPendingReviewQueueRow[] = [];
  for (const row of (data as unknown) as ViajesPendingReviewDbRow[]) {
    const internalId = nonEmptyString(row.id);
    const status = nonEmptyString(row.lifecycle_status);
    if (!internalId || !status) continue;
    const reason = nonEmptyString(row.moderation_reason) ?? nonEmptyString(row.review_notes);
    out.push({
      source: "viajes_staged_listings",
      title: nonEmptyString(row.title) ?? "(no title)",
      categorySource: "viajes_staged_listings",
      leonixAdId: null,
      internalId,
      ownerUserId: nonEmptyString(row.owner_user_id),
      status,
      reason,
      updatedAtIso: nonEmptyString(row.updated_at) ?? nonEmptyString(row.submitted_at),
      adminHref: "/admin/clasificados/viajes/business-offers",
      publicHref: null, // staged moderation rows should not be linked publicly from here
    });
  }
  return out;
}

async function buildPendingReviewQueueMerged(
  supabase: ReturnType<typeof getAdminSupabase>,
): Promise<AdminDashboardPendingReviewQueueRow[]> {
  const [listings, empleos, viajes] = await Promise.all([
    fetchListingsPendingReview(supabase),
    fetchEmpleosPendingReview(supabase),
    fetchViajesPendingReview(supabase),
  ]);

  const merged = [...listings, ...empleos, ...viajes].sort((a, b) => {
    const ta = a.updatedAtIso ? Date.parse(a.updatedAtIso) : 0;
    const tb = b.updatedAtIso ? Date.parse(b.updatedAtIso) : 0;
    return tb - ta;
  });

  return merged.slice(0, MAX_PENDING_REVIEW_ROWS);
}

export function splitAdminDashboardExpiringQueue(items: AdminDashboardExpiringQueueRow[]): {
  expiringSoon: AdminDashboardExpiringQueueRow[];
  expired: AdminDashboardExpiringQueueRow[];
  otherActive: AdminDashboardExpiringQueueRow[];
} {
  const expired = items.filter((row) => row.isExpired);
  const expiringSoon = items.filter((row) => row.isExpiringSoon && !row.isExpired);
  const otherActive = items.filter((row) => !row.isExpired && !row.isExpiringSoon);
  return { expiringSoon, expired, otherActive };
}

export function adminDashboardReviewReasonLabel(reason: string | null): string {
  const trimmed = reason?.trim();
  return trimmed ? trimmed : "Reason unavailable — inspect review source";
}

export function isAdminDashboardUrgentReviewRow(row: AdminDashboardPendingReviewQueueRow): boolean {
  const status = row.status.toLowerCase();
  return status === "flagged" || status === "changes_requested" || status.includes("flag");
}

export async function getAdminDashboardLeadsCounts(): Promise<AdminDashboardLeadsCounts> {
  try {
    const supabase = getAdminSupabase();
    const base = () => supabase.from("leonix_leads").select("id", { count: "exact", head: true }).is("deleted_at", null).is("archived_at", null);

    const [activeRes, needsReplyRes, promoRes, adRes, mediaRes, newsRes] = await Promise.all([
      base(),
      base().in("status", ["new", "needs_reply"]),
      base().or("source_cta.eq.promo_quote,inquiry_type.eq.promotionalProducts"),
      base().eq("inquiry_type", "advertising"),
      supabase
        .from("leonix_media_kit_leads")
        .select("id", { count: "exact", head: true })
        .is("deleted_at", null)
        .is("archived_at", null),
      supabase
        .from("leonix_newsletter_subscribers")
        .select("id", { count: "exact", head: true })
        .is("deleted_at", null)
        .is("archived_at", null)
        .eq("status", "subscribed"),
    ]);

    const firstErr = activeRes.error ?? needsReplyRes.error ?? promoRes.error ?? adRes.error ?? mediaRes.error ?? newsRes.error;
    if (firstErr) {
      const msg = String(firstErr.message ?? "");
      if (/does not exist|schema cache|PGRST205/i.test(msg)) {
        return {
          unavailable: true,
          unavailableNote: "Lead capture tables are not available. Apply the Supabase migration first.",
          launchLeadsActive: 0,
          leadsNeedingReply: 0,
          promoLeadsActive: 0,
          advertisingLeadsActive: 0,
          mediaKitActive: 0,
          newsletterActive: 0,
        };
      }
    }

    return {
      unavailable: false,
      unavailableNote: null,
      launchLeadsActive: typeof activeRes.count === "number" ? activeRes.count : 0,
      leadsNeedingReply: typeof needsReplyRes.count === "number" ? needsReplyRes.count : 0,
      promoLeadsActive: typeof promoRes.count === "number" ? promoRes.count : 0,
      advertisingLeadsActive: typeof adRes.count === "number" ? adRes.count : 0,
      mediaKitActive: typeof mediaRes.count === "number" ? mediaRes.count : 0,
      newsletterActive: typeof newsRes.count === "number" ? newsRes.count : 0,
    };
  } catch {
    return {
      unavailable: true,
      unavailableNote: "Could not load lead counts.",
      launchLeadsActive: 0,
      leadsNeedingReply: 0,
      promoLeadsActive: 0,
      advertisingLeadsActive: 0,
      mediaKitActive: 0,
      newsletterActive: 0,
    };
  }
}

export async function getAdminDashboardSnapshot(): Promise<AdminDashboardSnapshot> {
  const supabase = getAdminSupabase();
  let listingsQueryFallback = false;

  const { count: pendingReports } = await supabase
    .from("listing_reports")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");

  let pendingListingsReview = 0;
  try {
    const { count: cPending, error: e1 } = await supabase
      .from("listings")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending");
    const { count: cFlagged, error: e2 } = await supabase
      .from("listings")
      .select("id", { count: "exact", head: true })
      .eq("status", "flagged");
    if (e1 || e2) listingsQueryFallback = true;
    pendingListingsReview = (typeof cPending === "number" ? cPending : 0) + (typeof cFlagged === "number" ? cFlagged : 0);
  } catch {
    listingsQueryFallback = true;
  }

  let disabledUsersCount = 0;
  try {
    const { count } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("is_disabled", true);
    if (typeof count === "number") disabledUsersCount = count;
  } catch {
    /* ignore */
  }

  const mag = await readMagazineFeatured();

  let categoryRows: { category: string | null }[] = [];
  try {
    const { data } = await supabase.from("listings").select("category").limit(500);
    categoryRows = (data as { category: string | null }[]) ?? [];
  } catch {
    categoryRows = [];
  }
  const catMap = new Map<string, number>();
  for (const row of categoryRows) {
    const c = (row.category ?? "").trim() || "unknown";
    catMap.set(c, (catMap.get(c) ?? 0) + 1);
  }
  const categoryCounts = Array.from(catMap.entries())
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);

  const expiringQueueItems = await buildExpiringQueueMerged(supabase);
  const pendingReviewQueueItems = await buildPendingReviewQueueMerged(supabase);

  return {
    pendingListingsReview,
    pendingReports: typeof pendingReports === "number" ? pendingReports : 0,
    usersNeedingHelpProxy: disabledUsersCount,
    usersNeedingHelpNote:
      "Proxy: disabled accounts count. TODO: wire support_tickets or help_queue when available.",
    disabledUsersCount,
    magazineFeaturedLabel: mag.label,
    magazineUpdated: mag.updated,
    categoryCounts,
    expiringQueueItems,
    pendingReviewQueueItems,
    listingsQueryFallback,
  };
}
