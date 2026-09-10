/**
 * Master Operating Book §17 Global Search Contract — "the company patch panel."
 *
 * Extends `adminOpsUnifiedSearch.ts` to cover the remaining named sources that had zero
 * presence in Global Search: admin_team_members (staff), leonix_leads (advertising/promo leads
 * not already surfaced via the profile match), payments/entitlements (leonix_payment_records),
 * community_resources (Recursos), and magazine_issues (Revista). Support tickets get their own
 * standalone keyword match here too, since the existing `adminOpsSupportContext.ts` only
 * surfaces a business's tickets when exactly one profile matches — a ticket id/subject typed
 * directly would otherwise return nothing.
 *
 * Noticias has no canonical searchable entity at all (confirmed: it is an RSS aggregator with no
 * article table — see docs/admin-os/ADMIN_OS_CABLE_MAP.md, WEBSITE domain, "Treat as
 * PLANNED/NOT-A-CMS BY DESIGN"). It is deliberately NOT given a search adapter here; it is
 * reported via `unsupportedSources` instead of being silently omitted.
 *
 * Same isolation pattern as `adminDedicatedCategorySearch.ts`: one try/catch per source, a
 * bounded scan window for sources with no server-side `q` filter, one source's failure never
 * blocks another's results.
 */
import "server-only";

import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import { listLeonixLeadsForAdmin } from "./leonixLeadsData";
import { fetchPaymentTrackerSnapshot } from "./paymentTrackerData";
import { dbListCommunityResources } from "@/app/lib/recursos/server/communityResourcesDb";
import { fetchAllMagazineIssuesForAdmin } from "@/app/lib/magazine/magazineManifestServer";

export type AdminExtendedSearchRow = {
  id: string;
  title: string | null;
  entityType: "team_member" | "lead" | "payment" | "resource" | "magazine_issue" | "support_ticket";
  entityLabel: string;
  status: string | null;
  adminHref: string;
};

export type AdminExtendedSearchBundle = {
  rows: AdminExtendedSearchRow[];
  errors: string[];
  /** Sources this contract names that genuinely have no canonical searchable entity today. */
  unsupportedSources: Array<{ source: string; reason: string }>;
};

/** Bounded scan window for sources whose read function has no server-side `q` filter. */
const SCAN_WINDOW = 300;
const PER_SOURCE_LIMIT = 8;

function matches(haystack: Array<string | null | undefined>, needle: string): boolean {
  const n = needle.toLowerCase();
  return haystack.some((h) => h && h.toLowerCase().includes(n));
}

function isUuid(v: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
}

type TeamMemberSearchRow = {
  id: string;
  email: string | null;
  display_name: string | null;
  role: string | null;
  is_active: boolean | null;
};

type SupportTicketSearchRow = {
  id: string;
  subject: string | null;
  status: string | null;
  user_id: string | null;
};

export async function searchExtendedAdminSources(q: string): Promise<AdminExtendedSearchBundle> {
  const trimmed = q.trim();
  const rows: AdminExtendedSearchRow[] = [];
  const errors: string[] = [];
  const unsupportedSources: Array<{ source: string; reason: string }> = [
    {
      source: "Noticias",
      reason: "RSS aggregator only — no article entity/table exists to search (confirmed: PLANNED/NOT-A-CMS by design).",
    },
  ];

  if (!trimmed) return { rows, errors, unsupportedSources };

  // --- Team / staff roster (admin_team_members) — no existing exported list fn; minimal, bounded, read-only ---
  if (isSupabaseAdminConfigured()) {
    try {
      const supabase = getAdminSupabase();
      const { data, error } = await supabase
        .from("admin_team_members")
        .select("id, email, display_name, role, is_active")
        .order("created_at", { ascending: false })
        .limit(SCAN_WINDOW);
      if (error) throw error;
      const found = ((data ?? []) as TeamMemberSearchRow[])
        .filter((row) => (isUuid(trimmed) ? row.id === trimmed : matches([row.display_name, row.email, row.role], trimmed)))
        .slice(0, PER_SOURCE_LIMIT);
      for (const row of found) {
        rows.push({
          id: row.id,
          title: row.display_name ?? row.email,
          entityType: "team_member",
          entityLabel: "Staff",
          status: row.is_active === false ? "inactive" : "active",
          adminHref: "/admin/team/roster",
        });
      }
    } catch (e) {
      errors.push(`Staff roster: ${e instanceof Error ? e.message : "search failed"}`);
    }
  }

  // --- Leonix leads (advertising/promo/general inquiries) — bounded scan + in-memory match ---
  try {
    const { rows: leadRows } = await listLeonixLeadsForAdmin(SCAN_WINDOW, "all_non_deleted");
    const found = leadRows
      .filter((row) =>
        isUuid(trimmed)
          ? row.id === trimmed
          : matches([row.full_name, row.email, row.phone, row.business_name], trimmed),
      )
      .slice(0, PER_SOURCE_LIMIT);
    for (const row of found) {
      rows.push({
        id: row.id,
        title: row.full_name || row.business_name || row.email,
        entityType: "lead",
        entityLabel: "Lead",
        status: row.status,
        // No per-lead deep link exists in the inbox today — honest general-queue link, not fabricated precision.
        adminHref: "/admin/leads/inbox",
      });
    }
  } catch (e) {
    errors.push(`Leads: ${e instanceof Error ? e.message : "search failed"}`);
  }

  // --- Payments / entitlements (leonix_payment_records) — server-side q already supported ---
  try {
    const snap = await fetchPaymentTrackerSnapshot({ q: trimmed, limit: 200 });
    if (snap.unavailable) throw new Error(snap.note ?? "payment tracker unavailable");
    for (const row of snap.rows.slice(0, PER_SOURCE_LIMIT)) {
      rows.push({
        id: row.id,
        title: row.business_name ?? row.customer_name ?? row.customer_email,
        entityType: "payment",
        entityLabel: "Payment / entitlement",
        status: row.payment_status,
        adminHref: `/admin/workspace/payment-tracker?q=${encodeURIComponent(trimmed)}`,
      });
    }
  } catch (e) {
    errors.push(`Payments/entitlements: ${e instanceof Error ? e.message : "search failed"}`);
  }

  // --- Community resources (Recursos) — no q param on the read fn; bounded in-memory match ---
  try {
    const { rows: resourceRows, unavailable } = await dbListCommunityResources();
    if (unavailable) throw new Error("community resources unavailable");
    const found = resourceRows
      .filter((row) =>
        isUuid(trimmed) ? row.id === trimmed : matches([row.organizationName, row.programName], trimmed),
      )
      .slice(0, PER_SOURCE_LIMIT);
    for (const row of found) {
      rows.push({
        id: row.id,
        title: row.organizationName,
        entityType: "resource",
        entityLabel: "Recursos",
        status: null,
        adminHref: `/admin/recursos/${row.id}`,
      });
    }
  } catch (e) {
    errors.push(`Recursos: ${e instanceof Error ? e.message : "search failed"}`);
  }

  // --- Magazine issues (Revista) — no q param on the read fn; bounded in-memory match ---
  try {
    const { rows: issueRows, error } = await fetchAllMagazineIssuesForAdmin();
    if (error) throw new Error(error);
    const found = issueRows
      .filter((row) => matches([row.title_es, row.title_en, row.year, row.month_slug], trimmed))
      .slice(0, PER_SOURCE_LIMIT);
    for (const row of found) {
      rows.push({
        id: row.id,
        title: row.title_es || row.title_en || `${row.year} ${row.month_slug}`,
        entityType: "magazine_issue",
        entityLabel: "Revista issue",
        status: row.status,
        adminHref: "/admin/workspace/revista",
      });
    }
  } catch (e) {
    errors.push(`Revista: ${e instanceof Error ? e.message : "search failed"}`);
  }

  // --- Support tickets — no existing exported search fn; minimal, bounded, read-only ---
  if (isSupabaseAdminConfigured()) {
    try {
      const supabase = getAdminSupabase();
      const { data, error } = await supabase
        .from("support_tickets")
        .select("id, subject, status, user_id")
        .order("created_at", { ascending: false })
        .limit(SCAN_WINDOW);
      if (error) throw error;
      const found = ((data ?? []) as SupportTicketSearchRow[])
        .filter((row) => (isUuid(trimmed) ? row.id === trimmed || row.user_id === trimmed : matches([row.subject], trimmed)))
        .slice(0, PER_SOURCE_LIMIT);
      for (const row of found) {
        rows.push({
          id: row.id,
          title: row.subject,
          entityType: "support_ticket",
          entityLabel: "Support ticket",
          status: row.status,
          // No per-ticket deep link exists today — honest general-queue link, not fabricated precision.
          adminHref: row.user_id ? `/admin/support?profile=${row.user_id}` : "/admin/support",
        });
      }
    } catch (e) {
      errors.push(`Support tickets: ${e instanceof Error ? e.message : "search failed"}`);
    }
  }

  return { rows, errors, unsupportedSources };
}
