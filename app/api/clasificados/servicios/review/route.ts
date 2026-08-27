import { NextResponse } from "next/server";
import { getServiciosPublicListingBySlugFromDb } from "@/app/clasificados/servicios/lib/serviciosPublicListingsServer";
import { SERVICIOS_LISTING_STATUS_PUBLISHED } from "@/app/clasificados/servicios/lib/serviciosListingLifecycle";
import { insertServiciosAnalyticsEvent, insertServiciosReviewPending } from "@/app/clasificados/servicios/lib/serviciosOpsTablesServer";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/server";

export const runtime = "nodejs";

const REVIEW_BODY_MIN_LENGTH = 12;

/** Matches the review form's own `minLength`/`maxLength` (ServiciosReviewSubmitForm.tsx) so a
 * 400 here only ever happens when a caller bypassed that client-side constraint — and even then,
 * the response now says exactly why instead of a bare error code. */
const ERROR_MESSAGES: Record<string, { es: string; en: string }> = {
  invalid_slug: { es: "El enlace del anuncio no es válido.", en: "That listing link isn't valid." },
  invalid_rating: { es: "Selecciona una calificación de 1 a 5.", en: "Pick a rating from 1 to 5." },
  invalid_author: {
    es: "Escribe tu nombre (entre 2 y 120 caracteres).",
    en: "Enter your name (2–120 characters).",
  },
  invalid_body: {
    es: `Tu reseña debe tener al menos ${REVIEW_BODY_MIN_LENGTH} caracteres.`,
    en: `Your review must be at least ${REVIEW_BODY_MIN_LENGTH} characters.`,
  },
  listing_not_found: {
    es: "No se encontró este anuncio publicado.",
    en: "We couldn't find that published listing.",
  },
};

function reviewErrorResponse(error: keyof typeof ERROR_MESSAGES, lang: "es" | "en", status: number) {
  return NextResponse.json({ ok: false, error, message: ERROR_MESSAGES[error][lang] }, { status });
}

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
  const lang: "es" | "en" = b.lang === "en" ? "en" : "es";
  const listingSlug = String(b.listingSlug ?? "").trim();
  const authorName = String(b.authorName ?? "").trim();
  const bodyText = String(b.body ?? "").trim();
  const rating = Number(b.rating);
  const honeypot = String(b.companyUrl ?? "").trim();

  if (honeypot.length > 0) {
    return NextResponse.json({ ok: true, accepted: false }, { status: 200 });
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(listingSlug) || listingSlug.length > 120) {
    return reviewErrorResponse("invalid_slug", lang, 400);
  }
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return reviewErrorResponse("invalid_rating", lang, 400);
  }
  if (authorName.length < 2 || authorName.length > 120) {
    return reviewErrorResponse("invalid_author", lang, 400);
  }
  if (bodyText.length < REVIEW_BODY_MIN_LENGTH || bodyText.length > 2000) {
    return reviewErrorResponse("invalid_body", lang, 400);
  }

  const row = await getServiciosPublicListingBySlugFromDb(listingSlug, { visibility: "published_only" });
  if (!row || row.listing_status !== SERVICIOS_LISTING_STATUS_PUBLISHED) {
    return reviewErrorResponse("listing_not_found", lang, 404);
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
