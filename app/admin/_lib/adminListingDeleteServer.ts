/**
 * Server-side evaluation of the Admin delete guard (closeout 2). Loads the freshly-fetched rows, the
 * linked inventory rows and the commercial evidence, then applies the pure predicates in
 * `adminInventoryActionGuard.ts`. Fails CLOSED: a lookup that errors refuses the delete.
 *
 * Kept out of `actions.ts` because that file is a "use server" module (every export must be an async
 * server action).
 */
import { isBrNegocioListing } from "@/app/(site)/clasificados/lib/leonixBrPropertyInventoryPolicy";
import {
  adminDeleteGuardMessage,
  assertAdminListingDeleteAllowed,
  type AdminDeleteGuardCode,
  type AdminDeleteLinkedRow,
  type AdminDeleteMode,
  type AdminDeletePaymentEvidence,
} from "@/app/admin/_lib/adminInventoryActionGuard";

type SupabaseLike = {
  from: (table: string) => any; // eslint-disable-line @typescript-eslint/no-explicit-any
};

export type AdminDeleteVerdict =
  | { ok: true; found: boolean }
  | { ok: false; code: AdminDeleteGuardCode | "guard_lookup_failed"; message: string };

const ROW_SELECT =
  "id, category, seller_type, detail_pairs, status, is_published, owner_id, br_inventory_group_id, br_inventory_parent_listing_id, inventory_role";

function lookupFailed(): AdminDeleteVerdict {
  return { ok: false, code: "guard_lookup_failed", message: "Could not verify this listing's inventory / payment state; nothing was deleted." };
}

export async function evaluateAdminListingDeletes(
  supabase: SupabaseLike,
  ids: readonly string[],
  mode: AdminDeleteMode,
): Promise<Map<string, AdminDeleteVerdict>> {
  const out = new Map<string, AdminDeleteVerdict>();
  const unique = [...new Set(ids.map((i) => i.trim()).filter(Boolean))];
  if (unique.length === 0) return out;
  const failAll = () => {
    for (const id of unique) out.set(id, lookupFailed());
    return out;
  };

  const rowsRes = await supabase.from("listings").select(ROW_SELECT).in("id", unique);
  if (rowsRes.error) return failAll();
  const rows = (rowsRes.data ?? []) as Array<Record<string, unknown>>;
  const byId = new Map<string, Record<string, unknown>>(rows.map((r) => [String(r.id), r]));
  for (const id of unique) if (!byId.has(id)) out.set(id, { ok: true, found: false });

  // Linked inventory rows — only needed for Bienes Raices Negocio parents.
  const negocioIds = rows
    .filter((r) => isBrNegocioListing(r as never))
    .map((r) => String(r.id));
  const groupIds = [
    ...new Set(
      rows
        .filter((r) => negocioIds.includes(String(r.id)))
        .map((r) => (typeof r.br_inventory_group_id === "string" ? r.br_inventory_group_id.trim() : ""))
        .filter(Boolean),
    ),
  ];
  const linkedByParent = new Map<string, Map<string, AdminDeleteLinkedRow>>();
  if (negocioIds.length > 0) {
    const LINK_SELECT = "id, status, is_published, inventory_role, br_inventory_parent_listing_id, br_inventory_group_id";
    const byParent = await supabase.from("listings").select(LINK_SELECT).in("br_inventory_parent_listing_id", negocioIds);
    if (byParent.error) return failAll();
    let byGroup: Array<Record<string, unknown>> = [];
    if (groupIds.length > 0) {
      const g = await supabase.from("listings").select(LINK_SELECT).in("br_inventory_group_id", groupIds);
      if (g.error) return failAll();
      byGroup = (g.data ?? []) as Array<Record<string, unknown>>;
    }
    const link = (parentId: string, r: Record<string, unknown>) => {
      if (String(r.id) === parentId) return;
      const m = linkedByParent.get(parentId) ?? new Map<string, AdminDeleteLinkedRow>();
      m.set(String(r.id), {
        id: String(r.id),
        status: (r.status as string | null) ?? null,
        is_published: (r.is_published as boolean | null) ?? null,
        inventory_role: (r.inventory_role as string | null) ?? null,
      });
      linkedByParent.set(parentId, m);
    };
    for (const r of (byParent.data ?? []) as Array<Record<string, unknown>>) {
      const pid = String(r.br_inventory_parent_listing_id ?? "");
      if (pid) link(pid, r);
    }
    for (const r of byGroup) {
      const gid = String(r.br_inventory_group_id ?? "");
      for (const nid of negocioIds) {
        const parent = byId.get(nid);
        if (parent && String(parent.br_inventory_group_id ?? "").trim() === gid) link(nid, r);
      }
    }
  }

  // Commercial evidence — permanent delete only.
  const evidenceById = new Map<string, AdminDeletePaymentEvidence>();
  if (mode === "permanent" && rows.length > 0) {
    const rowIds = rows.map((r) => String(r.id));
    const pay = await supabase
      .from("leonix_payment_records")
      .select("listing_id, payment_status, stripe_subscription_id, canceled_at")
      .in("listing_id", rowIds);
    if (pay.error) return failAll();
    for (const p of (pay.data ?? []) as Array<Record<string, unknown>>) {
      const lid = String(p.listing_id ?? "");
      if (!lid) continue;
      const ev = evidenceById.get(lid) ?? {};
      const paid = p.payment_status === "paid" || p.payment_status === "succeeded";
      if (paid) ev.hasPaidRecord = true;
      if (paid && typeof p.stripe_subscription_id === "string" && p.stripe_subscription_id.trim() && !p.canceled_at) {
        ev.hasActiveSubscription = true;
      }
      evidenceById.set(lid, ev);
    }
    const nowIso = new Date().toISOString();
    const ent = await supabase
      .from("listing_package_entitlements")
      .select("listing_id, status, ends_at")
      .in("listing_id", rowIds)
      .in("status", ["active", "scheduled"])
      .gt("ends_at", nowIso);
    if (ent.error) return failAll();
    for (const e of (ent.data ?? []) as Array<Record<string, unknown>>) {
      const lid = String(e.listing_id ?? "");
      if (!lid) continue;
      evidenceById.set(lid, { ...(evidenceById.get(lid) ?? {}), hasLiveEntitlement: true });
    }
  }

  for (const r of rows) {
    const id = String(r.id);
    const verdict = assertAdminListingDeleteAllowed({
      row: {
        id,
        category: r.category as string | null,
        seller_type: r.seller_type as string | null,
        detail_pairs: r.detail_pairs,
        status: r.status as string | null,
        is_published: r.is_published as boolean | null,
        br_inventory_group_id: r.br_inventory_group_id as string | null,
        br_inventory_parent_listing_id: r.br_inventory_parent_listing_id as string | null,
        inventory_role: r.inventory_role as string | null,
      },
      linkedRows: [...(linkedByParent.get(id)?.values() ?? [])],
      evidence: evidenceById.get(id),
      mode,
    });
    out.set(id, verdict.ok ? { ok: true, found: true } : { ok: false, code: verdict.code, message: adminDeleteGuardMessage(verdict.code) });
  }
  return out;
}

/** Mux assets that no OTHER `listings` row references (so a shared asset is never destroyed). */
export async function muxAssetsSafeToDelete(
  supabase: SupabaseLike,
  candidateAssetIds: readonly string[],
  excludingListingIds: readonly string[],
): Promise<string[]> {
  const ids = [...new Set(candidateAssetIds.map((s) => s.trim()).filter((s) => /^[A-Za-z0-9_-]+$/.test(s)))];
  if (ids.length === 0) return [];
  const list = ids.join(",");
  const res = await supabase
    .from("listings")
    .select("id, mux_asset_id, mux_asset_id_2")
    .or(`mux_asset_id.in.(${list}),mux_asset_id_2.in.(${list})`);
  // Fail closed: if the reference check errors, leave the assets alone (orphaned, never wrongly destroyed).
  if (res.error) return [];
  const excluded = new Set(excludingListingIds);
  const stillReferenced = new Set<string>();
  for (const r of (res.data ?? []) as Array<Record<string, unknown>>) {
    if (excluded.has(String(r.id))) continue;
    for (const k of ["mux_asset_id", "mux_asset_id_2"]) {
      const v = r[k];
      if (typeof v === "string" && v.trim()) stillReferenced.add(v.trim());
    }
  }
  return ids.filter((a) => !stillReferenced.has(a));
}
