import { NextResponse } from "next/server";
import { getAutosPublishUserIdFromRequest } from "@/app/lib/clasificados/autos/autosListingBearerAuth";
import {
  getAutosClassifiedsListingById,
  isAutosClassifiedsDbConfigured,
  markAutosClassifiedsListingRestoredIfOwner,
} from "@/app/lib/clasificados/autos/autosClassifiedsListingService";
import { assertCommercialCapacityForWrite } from "@/app/lib/listingPlans/commercialWriteGuard";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

/**
 * Globalization Package A Gate 5 — restore an owner-unpublished Autos listing to public
 * surfaces (owner only; strictly "removed" → "active", never admin-suspended rows). Mirror of
 * the existing unpublish route.
 *
 * Package C Build 1 (decision 11) — restore INCREASES active inventory, so dealer-lane
 * restores now pass the commercial write guard: capacity (10 base / 20 with boost) and
 * grace/suspension state are enforced server-side. A payment-suspended or over-capacity
 * dealer cannot re-activate inventory through restore. Privado restores are single-listing
 * and unaffected.
 */
export async function POST(request: Request, { params }: Props) {
  if (!isAutosClassifiedsDbConfigured()) {
    return NextResponse.json({ ok: false, error: "db_not_configured" }, { status: 503 });
  }
  const userId = await getAutosPublishUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  const row = await getAutosClassifiedsListingById(id);
  if (row && String(row.lane) === "negocios") {
    const role = String(row.inventory_role ?? "").trim().toLowerCase();
    const parentListingId =
      role === "inventory_vehicle"
        ? String(row.dealer_inventory_parent_listing_id ?? "").trim() || id
        : id;
    const guard = await assertCommercialCapacityForWrite({
      category: "autos",
      parentListingId,
      ownerUserId: userId,
      operation: "child_restore",
      capacityDelta: 1,
      childListingId: id,
    });
    if (!guard.allowed) {
      return NextResponse.json(
        { ok: false, error: guard.code, message: guard.message, messageEs: guard.messageEs },
        { status: guard.code === "parent_not_owned" ? 403 : 409 },
      );
    }
  }

  const ok = await markAutosClassifiedsListingRestoredIfOwner(id, userId);
  if (!ok) {
    return NextResponse.json({ ok: false, error: "not_found_or_not_removed" }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
