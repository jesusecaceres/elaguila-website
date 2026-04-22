import { NextResponse } from "next/server";
import { getServiciosPublicListingBySlugFromDb } from "@/app/clasificados/servicios/lib/serviciosPublicListingsServer";
import { SERVICIOS_LISTING_STATUS_PUBLISHED } from "@/app/clasificados/servicios/lib/serviciosListingLifecycle";
import { insertServiciosAnalyticsEvent, insertServiciosReviewPending } from "@/app/clasificados/servicios/lib/serviciosOpsTablesServer";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ ok: false, error: "supabase_not_configured" }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }
  const b = body as Record<string, unknown>;
  const listingSlug = String(b.listingSlug ?? "").trim();
  const authorName = String(b.authorName ?? "").trim();
  const bodyText = String(b.body ?? "").trim();
  const rating = Number(b.rating);
  const honeypot = String(b.companyUrl ?? "").trim();

  if (honeypot.length > 0) {
    return NextResponse.json({ ok: true, accepted: false }, { status: 200 });
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(listingSlug) || listingSlug.length > 120) {
    return NextResponse.json({ ok: false, error: "invalid_slug" }, { status: 400 });
  }
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ ok: false, error: "invalid_rating" }, { status: 400 });
  }
  if (authorName.length < 2 || authorName.length > 120) {
    return NextResponse.json({ ok: false, error: "invalid_author" }, { status: 400 });
  }
  if (bodyText.length < 12 || bodyText.length > 2000) {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  const row = await getServiciosPublicListingBySlugFromDb(listingSlug, { visibility: "published_only" });
  if (!row || row.listing_status !== SERVICIOS_LISTING_STATUS_PUBLISHED) {
    return NextResponse.json({ ok: false, error: "listing_not_found" }, { status: 404 });
  }

  const ins = await insertServiciosReviewPending({
    listingSlug,
    rating,
    authorName,
    body: bodyText,
  });
  if (!ins.ok) {
    return NextResponse.json({ ok: false, error: ins.error }, { status: 500 });
  }

  await insertServiciosAnalyticsEvent({
    listingSlug,
    eventType: "review_submit_pending",
    meta: { reviewId: ins.id },
  });

  return NextResponse.json({ ok: true, id: ins.id, status: "pending" });
}
