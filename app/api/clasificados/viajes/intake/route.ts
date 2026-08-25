import { NextRequest, NextResponse } from "next/server";

import { normalizeViajesIntakeInput } from "@/app/(site)/clasificados/viajes/lib/viajesIntakeTypes";
import { upsertViajesIntakeStagedRow } from "@/app/(site)/clasificados/viajes/lib/viajesStagedListingsDbServer";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/server";

import { viajesGetUserIdFromBearer } from "../_lib/viajesOwnerBearer";

export const runtime = "nodejs";

/**
 * Package 3 — Community Opportunity Intake save (owner lock 2026-08-25).
 *
 * Authenticated owners only; the owner is ALWAYS derived from the bearer token, never from the
 * body. First save creates the early staged row (lifecycle "draft", business lane, not public);
 * repeat saves update the same intake-stage row (no duplicates). The provider may continue to
 * the full application immediately — there is no Leonix approval gate before continuation.
 * This route never publishes, never marks submitted, and never creates any Stripe checkout.
 */
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
    const lang = b.lang === "en" ? "en" : "es";
    const validated = normalizeViajesIntakeInput(b.intake);
    if (!validated.ok) {
      return NextResponse.json({ ok: false, error: "invalid_intake", errors: validated.errors }, { status: 422 });
    }

    const res = await upsertViajesIntakeStagedRow({
      owner_user_id: ownerUserId,
      intake: validated.intake,
      lang,
    });
    if (!res.ok) {
      return NextResponse.json({ ok: false, error: res.error }, { status: 500 });
    }

    return NextResponse.json({ ok: true, id: res.id, slug: res.slug, created: res.created });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "error";
    return NextResponse.json({ ok: false, error: "internal_error", detail: msg }, { status: 500 });
  }
}
