import { NextRequest, NextResponse } from "next/server";

import type { ViajesNegociosDraft } from "@/app/(site)/publicar/viajes/negocios/lib/viajesNegociosDraftTypes";
import type { ViajesPrivadoDraft } from "@/app/(site)/publicar/viajes/privado/lib/viajesPrivadoDraftTypes";
import { revalidateViajesStagedPublicSurfaces } from "@/app/(site)/clasificados/viajes/lib/viajesRevalidatePublicSurfaces";
import {
  allocateUniqueViajesStagedSlug,
  fetchViajesStagedRowById,
  insertViajesStagedListing,
  updateViajesStagedListingOwnerRevision,
} from "@/app/(site)/clasificados/viajes/lib/viajesStagedListingsDbServer";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/server";

import { viajesGetUserIdFromBearer } from "../_lib/viajesOwnerBearer";

export const runtime = "nodejs";

function firstHeroUrlNegocios(d: ViajesNegociosDraft): string | null {
  const u = d.imagenPrincipal.trim();
  if (u.startsWith("http")) return u;
  for (const g of d.galeriaUrls) {
    if (typeof g === "string" && g.startsWith("http")) return g;
  }
  return null;
}

function firstHeroUrlPrivado(d: ViajesPrivadoDraft): string | null {
  const u = d.imagenUrl.trim();
  if (u.startsWith("http")) return u;
  for (const g of d.galeriaUrls) {
    if (typeof g === "string" && g.startsWith("http")) return g;
  }
  return null;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
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

  if (lane === "business") {
    const draft = b.negociosDraft as ViajesNegociosDraft | undefined;
    if (!draft || typeof draft !== "object") {
      return NextResponse.json({ ok: false, error: "missing_negocios_draft" }, { status: 400 });
    }
    const title = String(draft.titulo ?? "").trim() || String(draft.businessName ?? "").trim();
    const dest = String(draft.destino ?? "").trim();
    if (!title || !dest) {
      return NextResponse.json({ ok: false, error: "missing_title_or_destination" }, { status: 422 });
    }
    const listing_json = { version: 1, negocios: draft } as unknown as Record<string, unknown>;
    const hero = firstHeroUrlNegocios(draft);

    if (stagedListingId) {
      const existing = await fetchViajesStagedRowById(stagedListingId);
      if (!existing || existing.owner_user_id !== ownerUserId || existing.lane !== "business") {
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
        submitter_name: draft.businessName?.trim() || null,
        submitter_email: draft.email?.trim() || null,
        submitter_phone: draft.phone?.trim() || draft.phoneOffice?.trim() || null,
        lifecycle_status: "submitted",
        is_public: false,
      });
      if (!up.ok) return NextResponse.json({ ok: false, error: up.error ?? "update_failed" }, { status: 500 });
      if (wasPublic) revalidateViajesStagedPublicSurfaces(prevSlug);
      return NextResponse.json({ ok: true, id: stagedListingId, slug: existing.slug, lane: "business", lang, updated: true });
    }

    const slug = await allocateUniqueViajesStagedSlug(title);
    const ins = await insertViajesStagedListing({
      slug,
      lane: "business",
      owner_user_id: ownerUserId,
      title,
      listing_json,
      hero_image_url: hero,
      lang,
      submitter_name: draft.businessName?.trim() || null,
      submitter_email: draft.email?.trim() || null,
      submitter_phone: draft.phone?.trim() || draft.phoneOffice?.trim() || null,
    });
    if (!ins.ok) return NextResponse.json({ ok: false, error: ins.error ?? "insert_failed" }, { status: 500 });
    return NextResponse.json({ ok: true, id: ins.id, slug, lane: "business", lang });
  }

  const draft = b.privadoDraft as ViajesPrivadoDraft | undefined;
  if (!draft || typeof draft !== "object") {
    return NextResponse.json({ ok: false, error: "missing_privado_draft" }, { status: 400 });
  }
  const title = String(draft.titulo ?? "").trim() || String(draft.displayName ?? "").trim();
  const dest = String(draft.destino ?? "").trim();
  if (!title || !dest) {
    return NextResponse.json({ ok: false, error: "missing_title_or_destination" }, { status: 422 });
  }
  const listing_json = { version: 1, privado: draft } as unknown as Record<string, unknown>;
  const hero = firstHeroUrlPrivado(draft);

  if (stagedListingId) {
    const existing = await fetchViajesStagedRowById(stagedListingId);
    if (!existing || existing.owner_user_id !== ownerUserId || existing.lane !== "private") {
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
      submitter_name: draft.displayName?.trim() || null,
      submitter_email: draft.email?.trim() || null,
      submitter_phone: draft.phone?.trim() || draft.phoneOffice?.trim() || null,
      lifecycle_status: "submitted",
      is_public: false,
    });
    if (!up.ok) return NextResponse.json({ ok: false, error: up.error ?? "update_failed" }, { status: 500 });
    if (wasPublic) revalidateViajesStagedPublicSurfaces(prevSlug);
    return NextResponse.json({ ok: true, id: stagedListingId, slug: existing.slug, lane: "private", lang, updated: true });
  }

  const slug = await allocateUniqueViajesStagedSlug(title);
  const ins = await insertViajesStagedListing({
    slug,
    lane: "private",
    owner_user_id: ownerUserId,
    title,
    listing_json,
    hero_image_url: hero,
    lang,
    submitter_name: draft.displayName?.trim() || null,
    submitter_email: draft.email?.trim() || null,
    submitter_phone: draft.phone?.trim() || draft.phoneOffice?.trim() || null,
  });
  if (!ins.ok) return NextResponse.json({ ok: false, error: ins.error ?? "insert_failed" }, { status: 500 });
  return NextResponse.json({ ok: true, id: ins.id, slug, lane: "private", lang });
}
