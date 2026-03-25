/**
 * Centralized admin dashboard reads. Server-only via getAdminSupabase.
 *
 * REAL NOW:
 * - pendingReports: listing_reports.status = 'pending'
 * - pendingListingsReview: listings.status IN ('pending','flagged') when column supports it; else 0 + fallback note
 * - categoryCounts: grouped count by listings.category for active-ish rows
 * - recentListingsForReview: newest listings (surface for moderation queue)
 * - disabledUsersCount: profiles.is_disabled = true
 *
 * FUTURE / TODO:
 * - boost_expires / listing duration for true "expiring soon" — wire when contract is stable
 * - usersNeedingHelp: no support tickets table — proxy uses disabled users count only
 */
import { getAdminSupabase } from "@/app/lib/supabase/server";
import { readFile } from "fs/promises";
import path from "path";

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
  recentQueueItems: Array<{
    id: string;
    title: string | null;
    category: string | null;
    status: string | null;
    created_at: string | null;
    owner_id: string | null;
  }>;
  pendingReviewItems: Array<{
    id: string;
    title: string | null;
    category: string | null;
    status: string | null;
    created_at: string | null;
    owner_id: string | null;
  }>;
  expiringNote: string;
  /** When true, pending listing count may be incomplete (DB doesn't filter as expected). */
  listingsQueryFallback: boolean;
};

async function readMagazineFeatured(): Promise<{ label: string | null; updated: string | null }> {
  try {
    const fp = path.join(process.cwd(), "public", "magazine", "editions.json");
    const raw = await readFile(fp, "utf-8");
    const j = JSON.parse(raw) as {
      featured?: { year?: string; month?: string; title?: { es?: string }; updated?: string };
    };
    const f = j.featured;
    if (!f) return { label: null, updated: null };
    const title = f.title?.es ?? f.month ?? null;
    const label = title && f.year ? `${title} · ${f.year}` : title;
    return { label, updated: f.updated ?? null };
  } catch {
    return { label: null, updated: null };
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

  let recentQueueItems: AdminDashboardSnapshot["recentQueueItems"] = [];
  try {
    const { data } = await supabase
      .from("listings")
      .select("id,title,category,status,created_at,owner_id")
      .order("created_at", { ascending: false })
      .limit(8);
    recentQueueItems = (data as AdminDashboardSnapshot["recentQueueItems"]) ?? [];
  } catch {
    recentQueueItems = [];
  }

  let pendingReviewItems: AdminDashboardSnapshot["pendingReviewItems"] = [];
  try {
    const { data } = await supabase
      .from("listings")
      .select("id,title,category,status,created_at,owner_id")
      .in("status", ["pending", "flagged"])
      .order("created_at", { ascending: false })
      .limit(6);
    if (data && data.length > 0) {
      pendingReviewItems = data as AdminDashboardSnapshot["pendingReviewItems"];
    } else {
      const { data: d2 } = await supabase
        .from("listings")
        .select("id,title,category,status,created_at,owner_id")
        .order("created_at", { ascending: false })
        .limit(6);
      pendingReviewItems = (d2 as AdminDashboardSnapshot["pendingReviewItems"]) ?? [];
    }
  } catch {
    pendingReviewItems = recentQueueItems.slice(0, 6);
  }

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
    recentQueueItems,
    pendingReviewItems,
    expiringNote:
      "TODO: expiring ads need listing duration / boost_expires contract. Showing recent listings as operational stand-in.",
    listingsQueryFallback,
  };
}
