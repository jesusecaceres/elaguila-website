import { NextResponse, type NextRequest } from "next/server";

import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import { isLeonixEndorsementCategoryLive } from "@/app/lib/leonixCommunityTrust/leonixEndorsementRegistry";
import {
  resolveLeonixProfessionalIdentityId,
  type BrRentasCommunityTrustCategory,
} from "@/app/lib/leonixCommunityTrust/leonixProfessionalIdentityServer";

const CATEGORIES: readonly BrRentasCommunityTrustCategory[] = ["bienes_raices_negocio", "rentas_negocio"];

function isBrRentasCommunityTrustCategory(v: string): v is BrRentasCommunityTrustCategory {
  return (CATEGORIES as readonly string[]).includes(v);
}

/**
 * Item 21 — resolves (creating on first use) the durable professional-identity target id for a
 * BR Negocio / Rentas Negocio listing owner. Public (no auth required to READ a resolved id —
 * mirrors GET /api/leonix-endorsements' same public-aggregate-info posture); the identity row
 * itself carries no sensitive data (just an owner_id + category anchor).
 *
 * Gated on isLeonixEndorsementCategoryLive(): returns 503 until the prepared migration
 * (20260827180000_leonix_professional_identities_br_rentas_community_trust.sql) is applied and
 * that flag is flipped — never attempts a query against a table that may not exist yet.
 */
export async function GET(req: NextRequest) {
  const category = req.nextUrl.searchParams.get("category") ?? "";
  const ownerId = req.nextUrl.searchParams.get("ownerId") ?? "";
  const displayName = req.nextUrl.searchParams.get("displayName");

  if (!isBrRentasCommunityTrustCategory(category) || !ownerId.trim()) {
    return NextResponse.json({ ok: false, error: "invalid_input" }, { status: 400 });
  }
  if (!isLeonixEndorsementCategoryLive(category)) {
    return NextResponse.json({ ok: false, error: "not_yet_live" }, { status: 503 });
  }
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ ok: false, error: "supabase_admin_unconfigured" }, { status: 503 });
  }

  const result = await resolveLeonixProfessionalIdentityId(getAdminSupabase(), {
    ownerId,
    category,
    displayName,
  });
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: "resolve_failed" }, { status: 500 });
  }
  return NextResponse.json({ ok: true, id: result.id });
}
