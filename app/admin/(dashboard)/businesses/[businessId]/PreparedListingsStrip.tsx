import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import { QUICK_SALES_CATEGORY_MAP, type QuickSalesCategory } from "@/app/lib/sales/quickSalesCategories";
import { buildQuickSalesHref } from "@/app/lib/sales/quickSalesRoutes";

/**
 * LEONIX P0 FINAL ASSISTED PUBLISHING BRIDGE (Gate 3 — "must appear in a staff-visible
 * prepared-work/client inventory"). Pure read composed from the SAME `business_listing_links`
 * junction the admin "Leonix Managed" inventory (app/admin/_lib/leonixManagedInventory.ts)
 * already reads — no new table, no new query engine.
 *
 * QUICK SALES ENTRY CONSOLIDATION — generalized from Servicios-only to ALL FOUR listing sources
 * the Quick Sales workspace sells, read through the same verified links. "Reabrir / Reopen" now
 * lands on the Quick Sales cockpit with the business AND the row preselected, so custody is
 * re-established BOUND to that same canonical id (same-row server authority) — it no longer opens
 * a category's public listing-edit surface on the staff member's own browser.
 */
type PreparedRow = {
  category: QuickSalesCategory;
  listingSource: string;
  listingId: string;
  title: string;
  status: string;
  updatedAt: string;
  reopenHref: string;
};

const CATEGORY_LABEL: Record<QuickSalesCategory, string> = {
  servicios: "Servicios",
  restaurantes: "Restaurantes",
  autos: "Autos Dealer",
  "bienes-raices": "Bienes Raíces Negocio",
};

const STATUS_LABEL: Record<string, string> = {
  draft: "Borrador / Draft",
  pending: "Borrador / Draft",
  pending_payment: "Esperando pago / Awaiting payment",
  payment_failed: "Pago fallido / Payment failed",
  published: "Publicado / Published",
  active: "Publicado / Published",
  paused: "Pausado / Paused",
  paused_unpublished: "Pausado / Paused",
  pending_review: "En revisión / In review",
  suspended: "Suspendido / Suspended",
  rejected: "Rechazado / Rejected",
  expired: "Vencido / Expired",
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}
function str(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

/**
 * Per-source projection: the exact columns read (never `*`), where the lifecycle lives, which
 * column names the customer owner, and the best display title. Mirrors the whitelist doctrine of
 * `app/lib/sales/prospectPreviewReader.ts`.
 */
type SourceSpec = {
  select: string;
  status: (row: Record<string, unknown>) => string;
  owner: (row: Record<string, unknown>) => string | null;
  title: (row: Record<string, unknown>) => string | null;
};

const SOURCE_SPEC: Record<QuickSalesCategory, SourceSpec> = {
  servicios: {
    select: "id, business_name, listing_status, updated_at, owner_user_id",
    status: (r) => str(r.listing_status) ?? "",
    owner: (r) => str(r.owner_user_id),
    title: (r) => str(r.business_name),
  },
  restaurantes: {
    select: "id, status, updated_at, owner_user_id, listing_json",
    status: (r) => str(r.status) ?? "",
    owner: (r) => str(r.owner_user_id),
    title: (r) => {
      const listing = asRecord(r.listing_json);
      return str(listing?.businessName) ?? str(listing?.name);
    },
  },
  autos: {
    select: "id, status, updated_at, owner_user_id, listing_payload",
    status: (r) => str(r.status) ?? "",
    owner: (r) => str(r.owner_user_id),
    title: (r) => {
      const payload = asRecord(r.listing_payload);
      return str(payload?.businessName) ?? str(payload?.dealerName) ?? str(payload?.title);
    },
  },
  "bienes-raices": {
    select: "id, title, status, updated_at, owner_id",
    status: (r) => str(r.status) ?? "",
    owner: (r) => str(r.owner_id),
    title: (r) => str(r.title),
  },
};

async function listPreparedListingsForSource(businessId: string, category: QuickSalesCategory): Promise<PreparedRow[]> {
  const admin = getAdminSupabase();
  const listingSource = QUICK_SALES_CATEGORY_MAP[category].listingSource;
  const spec = SOURCE_SPEC[category];
  const { data: links } = await admin
    .from("business_listing_links")
    .select("listing_id, linked_by")
    .eq("business_id", businessId)
    .eq("listing_source", listingSource)
    .eq("status", "verified");
  const linkRows = (links ?? []) as { listing_id: string; linked_by: string }[];
  const listingIds = linkRows.map((l) => l.listing_id);
  if (!listingIds.length) return [];
  const linkedByByListingId = new Map(linkRows.map((l) => [l.listing_id, l.linked_by]));

  const { data: rows } = await admin.from(listingSource).select(spec.select).in("id", listingIds);

  return ((rows ?? []) as unknown as Record<string, unknown>[])
    // Gate QB-IDENTITY-01 — self-service publishing writes the same verified link that
    // staff-assisted publishing does, so this strip must distinguish them or its "Leonix-prepared"
    // label becomes false. A link whose `linked_by` IS the listing's own owner was created by the
    // customer for themselves; only a link created by someone OTHER than the owner is
    // Leonix-prepared. `linked_by` is attribution ("who linked this record"), never ownership.
    .filter((r) => {
      const id = str(r.id);
      if (!id) return false;
      const linkedBy = linkedByByListingId.get(id);
      const owner = spec.owner(r);
      return !linkedBy || !owner || linkedBy !== owner;
    })
    .map((r) => {
      const listingId = String(r.id);
      return {
        category,
        listingSource,
        listingId,
        title: spec.title(r) ?? CATEGORY_LABEL[category],
        status: spec.status(r),
        updatedAt: str(r.updated_at) ?? "",
        reopenHref: buildQuickSalesHref({ category, businessId, listingId }),
      };
    });
}

export async function listPreparedListings(businessId: string): Promise<PreparedRow[]> {
  if (!isSupabaseAdminConfigured()) return [];
  const perSource = await Promise.all(
    (Object.keys(SOURCE_SPEC) as QuickSalesCategory[]).map((category) => listPreparedListingsForSource(businessId, category).catch(() => [] as PreparedRow[])),
  );
  return perSource.flat().sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
}

export async function PreparedListingsStrip({ businessId }: { businessId: string }) {
  const rows = await listPreparedListings(businessId);
  if (!rows.length) return null;

  return (
    <section id="prepared-ads" className="scroll-mt-24 rounded-2xl border border-[#C9A84A]/50 bg-white p-4">
      <h2 className="text-[10px] font-bold uppercase tracking-wide text-[#8A6B1F]">
        Anuncios preparados por Leonix / Leonix-prepared listings
      </h2>
      <ul className="mt-2 divide-y divide-[#E8DFD0]">
        {rows.map((row) => (
          <li key={`${row.listingSource}:${row.listingId}`} data-prepared-listing={row.listingSource} className="flex flex-wrap items-center justify-between gap-2 py-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[#1E1810]">{row.title}</p>
              <p className="text-xs text-[#7A7164]">
                {CATEGORY_LABEL[row.category]} · {STATUS_LABEL[row.status] ?? row.status} · Leonix ID: {row.listingId}
              </p>
            </div>
            <a
              href={row.reopenHref}
              className="inline-flex min-h-[36px] shrink-0 items-center rounded-lg border border-[#C9A84A]/70 bg-[#FFFDF7] px-3 text-xs font-semibold text-[#1E1810] hover:bg-white"
            >
              Reabrir en Venta asistida / Reopen in Quick Sales
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
