import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

import type { ViajesNegociosDraft } from "@/app/(site)/publicar/viajes/negocios/lib/viajesNegociosDraftTypes";
import type { ViajesPrivadoDraft } from "@/app/(site)/publicar/viajes/privado/lib/viajesPrivadoDraftTypes";
import { allocateUniqueViajesStagedSlug, insertViajesStagedListing } from "@/app/(site)/clasificados/viajes/lib/viajesStagedListingsDbServer";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/server";

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

async function ownerIdFromBearer(req: NextRequest): Promise<string | null> {
  const auth = req.headers.get("authorization");
  const token = auth?.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!token) return null;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return null;
  const sb = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await sb.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user.id;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
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
  const lane = b.lane === "private" ? "private" : "business";
  const lang = b.lang === "en" ? "en" : "es";

  const ownerUserId = await ownerIdFromBearer(req);

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
    const slug = await allocateUniqueViajesStagedSlug(title);
    const listing_json = { version: 1, negocios: draft } as unknown as Record<string, unknown>;
    const ins = await insertViajesStagedListing({
      slug,
      lane: "business",
      owner_user_id: ownerUserId,
      title,
      listing_json,
      hero_image_url: firstHeroUrlNegocios(draft),
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
  const slug = await allocateUniqueViajesStagedSlug(title);
  const listing_json = { version: 1, privado: draft } as unknown as Record<string, unknown>;
  const ins = await insertViajesStagedListing({
    slug,
    lane: "private",
    owner_user_id: ownerUserId,
    title,
    listing_json,
    hero_image_url: firstHeroUrlPrivado(draft),
    lang,
    submitter_name: draft.displayName?.trim() || null,
    submitter_email: draft.email?.trim() || null,
    submitter_phone: draft.phone?.trim() || draft.phoneOffice?.trim() || null,
  });
  if (!ins.ok) return NextResponse.json({ ok: false, error: ins.error ?? "insert_failed" }, { status: 500 });
  return NextResponse.json({ ok: true, id: ins.id, slug, lane: "private", lang });
}
