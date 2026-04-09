import { NextResponse } from "next/server";
import type { AutoDealerListing } from "@/app/clasificados/autos/negocios/types/autoDealerListing";
import { getAutosPublishUserIdFromRequest } from "@/app/lib/clasificados/autos/autosListingBearerAuth";
import {
  assertAutosListingOwner,
  isAutosClassifiedsDbConfigured,
  updateAutosClassifiedsListingDraft,
} from "@/app/lib/clasificados/autos/autosClassifiedsListingService";
import type { AutosClassifiedsLang } from "@/app/lib/clasificados/autos/autosClassifiedsTypes";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

type PatchBody = { listing?: AutoDealerListing; lang?: AutosClassifiedsLang };

export async function PATCH(request: Request, { params }: Props) {
  if (!isAutosClassifiedsDbConfigured()) {
    return NextResponse.json({ ok: false, error: "db_not_configured" }, { status: 503 });
  }
  const userId = await getAutosPublishUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  let body: PatchBody;
  try {
    body = (await request.json()) as PatchBody;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }
  if (!body.listing) {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }
  const lang: AutosClassifiedsLang | undefined = body.lang === "en" || body.lang === "es" ? body.lang : undefined;
  const row = await updateAutosClassifiedsListingDraft(id, userId, { listing: body.listing, lang });
  if (!row) {
    return NextResponse.json({ ok: false, error: "update_failed" }, { status: 400 });
  }
  return NextResponse.json({ ok: true, id: row.id, status: row.status, lang: row.lang });
}

export async function GET(request: Request, { params }: Props) {
  if (!isAutosClassifiedsDbConfigured()) {
    return NextResponse.json({ ok: false, error: "db_not_configured" }, { status: 503 });
  }
  const userId = await getAutosPublishUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const row = await assertAutosListingOwner(id, userId);
  if (!row) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }
  return NextResponse.json({
    ok: true,
    id: row.id,
    status: row.status,
    lane: row.lane,
    lang: row.lang,
    listing: row.listing_payload,
    stripe_checkout_session_id: row.stripe_checkout_session_id,
  });
}
