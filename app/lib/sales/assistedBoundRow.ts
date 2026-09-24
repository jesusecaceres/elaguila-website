/**
 * ASSISTED REOPEN — read the SERVER truth for the canonical row a signed assisted context is bound to.
 *
 * Staff "Save for Client" writes the canonical row; "reopen" must show that saved row, not whatever
 * the browser happens to remember. Every category's owner-edit hydration reads the row through the
 * OWNER's Supabase session / dashboard bearer, which a staff member (correctly) does not have. This
 * reader is the staff-side equivalent: it authorizes strictly from the signed cookie + the custody
 * ledger and hands back the raw stored row so each intake can run its OWN existing row -> draft
 * mapper (no second mapper, no second listing truth).
 *
 * Authority model (nothing here trusts the browser):
 *  - the caller already proved a staff session with `assisted_category_publishing`;
 *  - the row id comes ONLY from the signed context (`ctx.listingId`), never from a query string;
 *  - the row must be in the custody ledger for `ctx.businessId` (`business_listing_links`, verified);
 *  - the row is read through the admin client and never mutated.
 */
import "server-only";

import { isListingLinkedToBusiness } from "@/app/lib/business/assistedListingCustody";
import { QUICK_SALES_CATEGORY_MAP, isQuickSalesCategory, type QuickSalesCategory } from "@/app/lib/sales/quickSalesCategories";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";

export type AssistedBoundRowContext = {
  category: string;
  businessId: string;
  listingId?: string | null;
};

export type AssistedBoundRow = {
  category: QuickSalesCategory;
  listingSource: string;
  listingId: string;
  /** The raw stored canonical row. */
  row: Record<string, unknown>;
  /** Autos Dealer only: the inventory vehicle child(ren) under the dealer parent, oldest first. */
  children: Record<string, unknown>[];
};

export type AssistedBoundRowResult =
  | { ok: true; bound: AssistedBoundRow | null }
  | { ok: false; status: 403 | 404 | 500 | 503; error: string };

/** `listings` rows are shared by Rentas and Bienes Raices; the row's own category must match. */
const LISTINGS_TABLE_CATEGORY: Partial<Record<QuickSalesCategory, string>> = {
  rentas: "rentas",
  "bienes-raices": "bienes-raices",
};

export async function readAssistedBoundRow(ctx: AssistedBoundRowContext): Promise<AssistedBoundRowResult> {
  if (!isQuickSalesCategory(ctx.category)) return { ok: true, bound: null };
  const listingId = typeof ctx.listingId === "string" ? ctx.listingId.trim() : "";
  if (!listingId) return { ok: true, bound: null };
  if (!isSupabaseAdminConfigured()) return { ok: false, status: 503, error: "supabase_not_configured" };

  const descriptor = QUICK_SALES_CATEGORY_MAP[ctx.category];
  const linked = await isListingLinkedToBusiness({
    businessId: ctx.businessId,
    listingSource: descriptor.listingSource,
    listingId,
  });
  if (!linked) return { ok: false, status: 403, error: "listing_not_linked_to_business" };

  const admin = getAdminSupabase();
  const { data: row, error } = await admin.from(descriptor.listingSource).select("*").eq("id", listingId).maybeSingle();
  if (error) return { ok: false, status: 500, error: "row_read_failed" };
  if (!row) return { ok: false, status: 404, error: "listing_not_found" };

  const expectedCategory = LISTINGS_TABLE_CATEGORY[ctx.category];
  if (expectedCategory && String((row as Record<string, unknown>).category ?? "") !== expectedCategory) {
    // A ledger link to a row of another family is never hydrated into this family's form.
    return { ok: false, status: 403, error: "listing_category_mismatch" };
  }

  let children: Record<string, unknown>[] = [];
  if (ctx.category === "autos") {
    const { data: kids, error: kidsError } = await admin
      .from("autos_classifieds_listings")
      .select("*")
      .eq("dealer_inventory_parent_listing_id", listingId)
      .eq("inventory_role", "inventory_vehicle")
      .order("created_at", { ascending: true });
    if (kidsError) return { ok: false, status: 500, error: "children_read_failed" };
    children = (kids ?? []) as Record<string, unknown>[];
  }

  return {
    ok: true,
    bound: {
      category: ctx.category,
      listingSource: descriptor.listingSource,
      listingId,
      row: row as Record<string, unknown>,
      children,
    },
  };
}
