import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import { serviciosListingPreviewHref } from "@/app/(site)/dashboard/lib/serviciosDashboardOffersAddonCheckout";

/**
 * LEONIX P0 FINAL ASSISTED PUBLISHING BRIDGE (Gate 3 — "must appear in a staff-visible
 * prepared-work/client inventory"). Pure read composed from the SAME `business_listing_links`
 * junction the admin "Leonix Managed" inventory (app/admin/_lib/leonixManagedInventory.ts)
 * already reads — no new table, no new query engine. Servicios only this round (see Gate 9);
 * a second `listingSource` can be added here the same way once its category gets the same
 * canonical-id adapter Servicios has.
 */
type PreparedRow = {
  listingId: string;
  businessName: string;
  listingStatus: string;
  updatedAt: string;
  reopenHref: string;
};

const STATUS_LABEL: Record<string, string> = {
  draft: "Borrador / Draft",
  published: "Publicado / Published",
  paused_unpublished: "Pausado / Paused",
  pending_review: "En revisión / In review",
  suspended: "Suspendido / Suspended",
  rejected: "Rechazado / Rejected",
};

async function listPreparedServiciosListings(businessId: string): Promise<PreparedRow[]> {
  if (!isSupabaseAdminConfigured()) return [];
  const admin = getAdminSupabase();
  const { data: links } = await admin
    .from("business_listing_links")
    .select("listing_id")
    .eq("business_id", businessId)
    .eq("listing_source", "servicios_public_listings")
    .eq("status", "verified");
  const listingIds = ((links ?? []) as { listing_id: string }[]).map((l) => l.listing_id);
  if (!listingIds.length) return [];

  const { data: rows } = await admin
    .from("servicios_public_listings")
    .select("id, business_name, listing_status, updated_at")
    .in("id", listingIds);

  return ((rows ?? []) as { id: string; business_name: string; listing_status: string; updated_at: string }[])
    .map((r) => ({
      listingId: r.id,
      businessName: r.business_name,
      listingStatus: r.listing_status,
      updatedAt: r.updated_at,
      reopenHref: serviciosListingPreviewHref({ lang: "es", listingId: r.id, mode: "listing-edit" }),
    }))
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
}

export async function PreparedListingsStrip({ businessId }: { businessId: string }) {
  const rows = await listPreparedServiciosListings(businessId);
  if (!rows.length) return null;

  return (
    <section id="prepared-ads" className="scroll-mt-24 rounded-2xl border border-[#C9A84A]/50 bg-white p-4">
      <h2 className="text-[10px] font-bold uppercase tracking-wide text-[#8A6B1F]">
        Anuncios preparados por Leonix / Leonix-prepared listings
      </h2>
      <ul className="mt-2 divide-y divide-[#E8DFD0]">
        {rows.map((row) => (
          <li key={row.listingId} className="flex flex-wrap items-center justify-between gap-2 py-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[#1E1810]">{row.businessName || "Servicios"}</p>
              <p className="text-xs text-[#7A7164]">
                {STATUS_LABEL[row.listingStatus] ?? row.listingStatus} · Leonix ID: {row.listingId}
              </p>
            </div>
            <a
              href={row.reopenHref}
              className="inline-flex min-h-[36px] shrink-0 items-center rounded-lg border border-[#C9A84A]/70 bg-[#FFFDF7] px-3 text-xs font-semibold text-[#1E1810] hover:bg-white"
            >
              Reabrir / Reopen
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
