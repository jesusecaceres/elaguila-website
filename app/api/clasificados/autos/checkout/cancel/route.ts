import { NextResponse } from "next/server";
import { getAutosPublishUserIdFromRequest } from "@/app/lib/clasificados/autos/autosListingBearerAuth";
import {
  assertAutosListingOwner,
  isAutosClassifiedsDbConfigured,
  markAutosListingCancelledFromCheckout,
} from "@/app/lib/clasificados/autos/autosClassifiedsListingService";

export const dynamic = "force-dynamic";

type Body = { listingId?: string };

/** Return listing to draft after user cancels Stripe Checkout (retry-friendly). */
export async function POST(request: Request) {
  if (!isAutosClassifiedsDbConfigured()) {
    return NextResponse.json({ ok: false, error: "db_not_configured" }, { status: 503 });
  }
  const userId = await getAutosPublishUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }
  const listingId = body.listingId?.trim();
  if (!listingId) {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }
  const row = await assertAutosListingOwner(listingId, userId);
  if (!row) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }
  if (row.status === "pending_payment") {
    await markAutosListingCancelledFromCheckout(listingId);
  }
  return NextResponse.json({ ok: true });
}
