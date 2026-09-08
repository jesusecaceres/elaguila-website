import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { appendAdminAuditLog } from "@/app/admin/_lib/adminAuditLogServer";
import {
  canRepublishListing,
  listingsRowIsPublicLive,
} from "@/app/admin/_lib/classifiedsRepublishCapability";
import { getAdminSupabase, requireAdminCookie } from "@/app/lib/supabase/server";
import {
  ADMIN_INVENTORY_ACTION_FORBIDDEN_CODE,
  assertBrNegocioActionAllowed,
} from "@/app/admin/_lib/adminInventoryActionGuard";
import { activateBrNegocioListingAtomic } from "@/app/lib/listingPlans/capacityActivationRpc";

type ListingsStaffAction =
  | "suspend"
  | "unsuspend"
  | "promote_on"
  | "promote_off"
  | "verify_on"
  | "verify_off"
  | "archive"
  | "republish";

function isAction(x: unknown): x is ListingsStaffAction {
  return (
    x === "suspend" ||
    x === "unsuspend" ||
    x === "promote_on" ||
    x === "promote_off" ||
    x === "verify_on" ||
    x === "verify_off" ||
    x === "archive" ||
    x === "republish"
  );
}

export const dynamic = "force-dynamic";

/**
 * Staff mutations for `public.listings` (Rentas, En venta, Comunidad, Clases, …).
 */
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const jar = await cookies();
  if (!requireAdminCookie(jar)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  if (!id?.trim()) {
    return NextResponse.json({ ok: false, error: "missing_id" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }
  const action = (body as { action?: unknown }).action;
  if (!isAction(action)) {
    return NextResponse.json({ ok: false, error: "invalid_action" }, { status: 400 });
  }

  const supabase = getAdminSupabase();
  const { data: row, error: rErr } = await supabase
    .from("listings")
    .select(
      "id, category, leonix_ad_id, owner_id, detail_pairs, is_free, is_published, status, republish_count, republish_override, seller_type, br_inventory_group_id, br_inventory_parent_listing_id, inventory_role",
    )
    .eq("id", id)
    .maybeSingle();

  if (rErr || !row) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  const rowRec = row as Record<string, unknown>;
  const category = String(rowRec.category ?? "").trim();
  const now = new Date().toISOString();

  // Work Package I.9B — server-side parent/child role validation for Bienes Raíces Negocio,
  // resolved strictly from the freshly-fetched row (never trusts any client-supplied value).
  // Every other category (Rentas, En Venta, Bienes Privado, Comunidad, Clases, Busco, Mascotas)
  // and every non-parent-only action for Bienes Raíces are entirely unaffected — this only
  // rejects "archive" against a confirmed inventory-property child or an unresolved role.
  if (category.toLowerCase() === "bienes-raices") {
    const roleCheck = assertBrNegocioActionAllowed(
      {
        id: String(rowRec.id ?? ""),
        category: rowRec.category as string | null,
        seller_type: rowRec.seller_type as string | null,
        detail_pairs: rowRec.detail_pairs,
        status: rowRec.status as string | null,
        is_published: rowRec.is_published as boolean | null,
        br_inventory_group_id: rowRec.br_inventory_group_id as string | null,
        br_inventory_parent_listing_id: rowRec.br_inventory_parent_listing_id as string | null,
        inventory_role: rowRec.inventory_role as string | null,
      },
      action,
    );
    if (!roleCheck.ok) {
      return NextResponse.json({ ok: false, error: ADMIN_INVENTORY_ACTION_FORBIDDEN_CODE }, { status: 403 });
    }
  }

  if (action === "republish") {
    if (String(rowRec.status ?? "").toLowerCase() === "removed") {
      return NextResponse.json({ ok: false, error: "cannot_republish_removed" }, { status: 400 });
    }
    if (!canRepublishListing(rowRec, category)) {
      return NextResponse.json({ ok: false, error: "republish_not_eligible" }, { status: 400 });
    }
    const nextCount = Number(rowRec.republish_count ?? 0) + 1;
    const patch: Record<string, unknown> = {
      republished_at: now,
      republish_count: nextCount,
      last_republished_source: "admin",
      last_republished_by: null,
    };
    const republishReactivates = !listingsRowIsPublicLive(rowRec);
    const republishReactivatesBrNegocio = republishReactivates && category.toLowerCase() === "bienes-raices";
    if (republishReactivatesBrNegocio) {
      // Package C Build 4 (C7, Gate 4) — reactivating a bienes-raices row via republish is
      // capacity-increasing; route through the atomic RPC instead of folding status/is_published
      // into the generic patch below.
      const rpcResult = await activateBrNegocioListingAtomic({
        listingId: id,
        ownerId: String(rowRec.owner_id ?? ""),
        fromStatus: String(rowRec.status ?? ""),
      });
      if (!rpcResult.ok) {
        return NextResponse.json({ ok: false, error: "capacity_rpc_unavailable" }, { status: 500 });
      }
      if (!rpcResult.activated && !rpcResult.idempotent) {
        return NextResponse.json(
          { ok: false, error: rpcResult.blockedReason ?? "capacity_reached", activeCount: rpcResult.activeCount, effectiveLimit: rpcResult.effectiveLimit },
          { status: 409 },
        );
      }
    } else if (republishReactivates) {
      patch.is_published = true;
      patch.status = "active";
    }
    const { error } = await supabase.from("listings").update(patch).eq("id", id);
    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
    void appendAdminAuditLog({
      action: "republish",
      targetType: "listings",
      targetId: id,
      meta: { category, patch, leonix_ad_id: rowRec.leonix_ad_id, viaRpc: republishReactivatesBrNegocio },
    });
    revalidatePath("/admin/workspace/clasificados");
    revalidatePath(`/clasificados/anuncio/${id}`);
    const catLower = category.toLowerCase();
    if (category) {
      revalidatePath(`/admin/workspace/clasificados/${encodeURIComponent(catLower)}`);
    }
    if (catLower === "rentas") {
      revalidatePath("/clasificados/rentas");
      revalidatePath("/clasificados/rentas/results");
      revalidatePath(`/clasificados/rentas/anuncio/${id}`);
      revalidatePath(`/clasificados/rentas/listing/${id}`);
    } else if (catLower === "en-venta") {
      revalidatePath("/clasificados/en-venta");
      revalidatePath("/clasificados/en-venta/results");
    } else if (catLower === "comunidad") {
      revalidatePath("/clasificados/comunidad");
    } else if (catLower === "clases") {
      revalidatePath("/clasificados/clases");
    } else if (catLower === "bienes-raices") {
      revalidatePath("/clasificados/bienes-raices");
      revalidatePath("/clasificados/bienes-raices/resultados");
    } else if (category) {
      revalidatePath(`/clasificados/${encodeURIComponent(catLower)}`);
    }
    return NextResponse.json({ ok: true, id, ...patch });
  }

  const patch: Record<string, unknown> = {};

  // Package C Build 4 (C7, Gate 4) — reactivating a bienes-raices main/inventory_property row is
  // capacity-increasing; route it through the atomic RPC instead of an unconditional direct write.
  // `inventory_role` null is legacy pre-grouping data, treated as 'main' (self-parent) — mirrors
  // the RPC's own `IS DISTINCT FROM 'inventory_property'` legacy-compatibility branch.
  const isBrNegocioCapacityRow =
    category.toLowerCase() === "bienes-raices" &&
    (rowRec.inventory_role === "main" ||
      rowRec.inventory_role === "inventory_property" ||
      rowRec.inventory_role === null ||
      rowRec.inventory_role === undefined);

  if (action === "unsuspend" && isBrNegocioCapacityRow) {
    const rpcResult = await activateBrNegocioListingAtomic({
      listingId: id,
      ownerId: String(rowRec.owner_id ?? ""),
      fromStatus: String(rowRec.status ?? ""),
    });
    if (!rpcResult.ok) {
      return NextResponse.json({ ok: false, error: "capacity_rpc_unavailable" }, { status: 500 });
    }
    if (!rpcResult.activated && !rpcResult.idempotent) {
      return NextResponse.json(
        { ok: false, error: rpcResult.blockedReason ?? "capacity_reached", activeCount: rpcResult.activeCount, effectiveLimit: rpcResult.effectiveLimit },
        { status: 409 },
      );
    }
    void appendAdminAuditLog({
      action: `listings_admin_${action}`,
      targetType: "listings",
      targetId: id,
      meta: { category, viaRpc: true, idempotent: rpcResult.idempotent },
    });
    revalidatePath("/admin/workspace/clasificados");
    revalidatePath(`/clasificados/anuncio/${id}`);
    revalidatePath("/admin/workspace/clasificados/bienes-raices");
    revalidatePath("/clasificados/bienes-raices");
    revalidatePath("/clasificados/bienes-raices/resultados");
    return NextResponse.json({ ok: true, id, is_published: true, status: "active" });
  }

  switch (action) {
    case "suspend":
      patch.is_published = false;
      patch.status = "flagged";
      break;
    case "unsuspend":
      patch.is_published = true;
      patch.status = "active";
      break;
    case "promote_on":
      patch.admin_promoted = true;
      break;
    case "promote_off":
      patch.admin_promoted = false;
      break;
    case "verify_on":
      patch.leonix_verified = true;
      break;
    case "verify_off":
      patch.leonix_verified = false;
      break;
    case "archive":
      patch.status = "removed";
      patch.is_published = false;
      break;
    default:
      return NextResponse.json({ ok: false, error: "invalid_action" }, { status: 400 });
  }

  const { error } = await supabase.from("listings").update(patch).eq("id", id);
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  void appendAdminAuditLog({
    action: `listings_admin_${action}`,
    targetType: "listings",
    targetId: id,
    meta: { category: (row as { category?: string }).category, patch },
  });

  revalidatePath("/admin/workspace/clasificados");
  revalidatePath(`/clasificados/anuncio/${id}`);
  const cat = String((row as { category?: string }).category ?? "").trim();
  const catLower = cat.toLowerCase();
  if (cat) {
    revalidatePath(`/admin/workspace/clasificados/${encodeURIComponent(catLower)}`);
  }
  if (catLower === "en-venta") {
    revalidatePath("/admin/workspace/clasificados/en-venta");
  }
  if (catLower === "rentas") {
    revalidatePath("/clasificados/rentas");
    revalidatePath("/clasificados/rentas/results");
    revalidatePath(`/clasificados/rentas/anuncio/${id}`);
    revalidatePath(`/clasificados/rentas/listing/${id}`);
  } else if (catLower === "en-venta") {
    revalidatePath("/clasificados/en-venta");
    revalidatePath("/clasificados/en-venta/results");
  } else if (catLower === "comunidad") {
    revalidatePath("/clasificados/comunidad");
  } else if (catLower === "clases") {
    revalidatePath("/clasificados/clases");
  } else if (catLower) {
    revalidatePath(`/clasificados/${encodeURIComponent(catLower)}`);
  }

  return NextResponse.json({ ok: true, id, ...patch });
}
