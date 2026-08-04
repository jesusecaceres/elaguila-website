import { NextRequest, NextResponse } from "next/server";

import type { ViajesNegociosDraft } from "@/app/(site)/publicar/viajes/negocios/lib/viajesNegociosDraftTypes";
import type { ViajesPrivadoDraft } from "@/app/(site)/publicar/viajes/privado/lib/viajesPrivadoDraftTypes";
import { isViajesPrivatePublishDisabled } from "@/app/(site)/clasificados/viajes/lib/viajesPrivateLaneLaunchPolicy";
import { revalidateViajesStagedPublicSurfaces } from "@/app/(site)/clasificados/viajes/lib/viajesRevalidatePublicSurfaces";
import {
  allocateUniqueViajesStagedSlug,
  fetchViajesStagedRowById,
  insertViajesStagedListing,
  updateViajesStagedListingOwnerRevision,
} from "@/app/(site)/clasificados/viajes/lib/viajesStagedListingsDbServer";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import type { ViajesOfferModelV2 } from "@/app/(site)/clasificados/viajes/lib/v2/viajesOfferModelV2";
import { normalizeViajesOfferToV2 } from "@/app/(site)/clasificados/viajes/lib/v2/normalizeViajesOfferToV2";
import { serializeViajesOfferV2ForStaged } from "@/app/(site)/clasificados/viajes/lib/v2/serializeViajesOfferV2ForStaged";
import { getViajesHeroAsset, validateViajesOfferForSubmit } from "@/app/(site)/clasificados/viajes/lib/v2/viajesOfferV2Validation";
import { isViajesDurableHttpsUrl } from "@/app/(site)/clasificados/viajes/lib/v2/viajesMediaDurableGuards";

import { viajesGetUserIdFromBearer } from "../_lib/viajesOwnerBearer";

export const runtime = "nodejs";

function resolveOfferFromBody(b: Record<string, unknown>, lane: "business" | "private", lang: "es" | "en"): ViajesOfferModelV2 | null {
  if (b.offer && typeof b.offer === "object") {
    return normalizeViajesOfferToV2(b.offer, { locale: lang, laneHint: lane });
  }
  if (b.listing_json && typeof b.listing_json === "object") {
    return normalizeViajesOfferToV2(b.listing_json, { locale: lang, laneHint: lane });
  }
  if (lane === "business" && b.negociosDraft && typeof b.negociosDraft === "object") {
    return normalizeViajesOfferToV2(
      { version: 1, negocios: b.negociosDraft as ViajesNegociosDraft },
      { locale: lang, laneHint: "business" }
    );
  }
  if (lane === "private" && b.privadoDraft && typeof b.privadoDraft === "object") {
    return normalizeViajesOfferToV2(
      { version: 1, privado: b.privadoDraft as ViajesPrivadoDraft },
      { locale: lang, laneHint: "private" }
    );
  }
  return null;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    if (!isSupabaseAdminConfigured()) {
      return NextResponse.json({ ok: false, error: "supabase_not_configured" }, { status: 503 });
    }

    const ownerUserId = await viajesGetUserIdFromBearer(req);
    if (!ownerUserId) {
      return NextResponse.json({ ok: false, error: "auth_required" }, { status: 401 });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
    }

    const b = body as Record<string, unknown>;
    const lane = b.lane === "private" ? "private" : "business";
    const lang = b.lang === "en" ? "en" : "es";
    const stagedListingId = typeof b.stagedListingId === "string" ? b.stagedListingId.trim() : "";

    if (lane === "private" && isViajesPrivatePublishDisabled()) {
      return NextResponse.json({ ok: false, error: "private_lane_disabled" }, { status: 409 });
    }

    const offerIn = resolveOfferFromBody(b, lane, lang);
    if (!offerIn) {
      return NextResponse.json(
        { ok: false, error: lane === "business" ? "missing_negocios_draft" : "missing_privado_draft" },
        { status: 400 }
      );
    }

    const offer: ViajesOfferModelV2 = {
      ...offerIn,
      lane: lane === "private" ? "private" : "business",
      locale: lang,
      lifecycle: {
        ...offerIn.lifecycle,
        locale: lang,
        ownerUserId,
        stagedListingId: stagedListingId || offerIn.lifecycle.stagedListingId,
      },
      source: { ...offerIn.source, lane: lane === "private" ? "private" : "business" },
    };

    if (lane === "private") {
      offer.locations = {
        ...offer.locations,
        privateExact: {
          ...offer.locations.privateExact,
          showPublicly: false,
          showMap: false,
        },
      };
    }

    const issues = validateViajesOfferForSubmit(offer);
    if (issues.length) {
      return NextResponse.json({ ok: false, error: "validation_failed", issues }, { status: 422 });
    }

    const title = offer.basics.title.trim() || offer.provider.name.trim() || offer.contact.displayName.trim();
    const dest = offer.basics.destinationLabel.trim() || offer.locations.destination.city.trim();
    if (!title || !dest) {
      return NextResponse.json({ ok: false, error: "missing_title_or_destination" }, { status: 422 });
    }

    const listing_json = serializeViajesOfferV2ForStaged(offer) as unknown as Record<string, unknown>;
    const heroAsset = getViajesHeroAsset(offer.media.images);
    const hero =
      heroAsset && isViajesDurableHttpsUrl(heroAsset.url) ? heroAsset.url.trim() : null;

    const submitter_name =
      (lane === "private" ? offer.contact.displayName : offer.provider.name || offer.contact.displayName).trim() || null;
    const submitter_email = offer.contact.email.trim() || null;
    const submitter_phone =
      (offer.contact.phoneRaw || offer.contact.phone || offer.contact.phoneOfficeRaw || offer.contact.phoneOffice).trim() ||
      null;

    if (stagedListingId) {
      const existing = await fetchViajesStagedRowById(stagedListingId);
      if (!existing || existing.owner_user_id !== ownerUserId || existing.lane !== lane) {
        return NextResponse.json({ ok: false, error: "forbidden_or_missing" }, { status: 403 });
      }
      const prevSlug = existing.slug;
      const wasPublic = existing.lifecycle_status === "approved" && existing.is_public;
      const up = await updateViajesStagedListingOwnerRevision({
        id: stagedListingId,
        owner_user_id: ownerUserId,
        title,
        listing_json,
        hero_image_url: hero,
        lang,
        submitter_name,
        submitter_email,
        submitter_phone,
        lifecycle_status: "submitted",
        is_public: false,
      });
      if (!up.ok) return NextResponse.json({ ok: false, error: up.error ?? "update_failed" }, { status: 500 });
      if (wasPublic) revalidateViajesStagedPublicSurfaces(prevSlug);
      return NextResponse.json({ ok: true, id: stagedListingId, slug: existing.slug, lane, lang, updated: true });
    }

    const slug = await allocateUniqueViajesStagedSlug(title);
    const ins = await insertViajesStagedListing({
      slug,
      lane,
      owner_user_id: ownerUserId,
      title,
      listing_json,
      hero_image_url: hero,
      lang,
      submitter_name,
      submitter_email,
      submitter_phone,
    });
    if (!ins.ok) return NextResponse.json({ ok: false, error: ins.error ?? "insert_failed" }, { status: 500 });
    return NextResponse.json({ ok: true, id: ins.id, slug, lane, lang });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "error";
    return NextResponse.json({ ok: false, error: "internal_error", detail: msg }, { status: 500 });
  }
}
