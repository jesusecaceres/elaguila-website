/**
 * Package C Build 2 (C4) — verified-intro-15% eligibility resolver (impure, server-only).
 *
 * This is a PREVIEW read (used by GET /api/verified-intro-discount/status and the checkout
 * route's initial eligibility check) — it checks for any 'reserved' or 'redeemed' row across
 * all four anti-repeat boundaries (owner_user_id, verified email hash, verified phone hash,
 * composite business identity). The real, atomic concurrency gate at checkout time is the
 * reservation INSERT in verifiedIntroDiscountRedemptions.ts, not this function — this preview
 * can be momentarily stale between two racing requests, which is fine because the atomic INSERT
 * is authoritative.
 */

import "server-only";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import { getRevenuePackageDefinition } from "./revenuePricingMatrix";
import {
  decideVerifiedIntroDiscountEligibility,
  type VerifiedIntroDiscountDecision,
} from "./verifiedIntroDiscountPolicy";
import { resolveCommercialBusinessIdentity } from "./commercialBusinessIdentity";
import { hashVerifiedIdentity } from "@/app/lib/security/verifiedIdentityHash";

const REDEMPTIONS_TABLE = "leonix_verified_intro_discount_redemptions";
const PHONE_IDENTITIES_TABLE = "leonix_verified_phone_identities";

export type ResolveVerifiedIntroDiscountEligibilityInput = {
  ownerUserId: string | null;
  /** Server-confirmed authenticated email (never a client-submitted value). */
  email: string | null;
  emailConfirmedAt: string | null;
  category: string;
  packageKey: string;
  listingId: string | null;
  activeDiscountSource: "promo_code" | null;
};

export type ResolveVerifiedIntroDiscountEligibilityResult =
  | (VerifiedIntroDiscountDecision & {
      ok: true;
      emailVerified: boolean;
      phoneVerified: boolean;
      businessIdentityType: string;
      businessIdentityKey: string;
      businessIdentityFallbackReason: string | null;
    })
  | { ok: false; code: "supabase_not_configured" | "owner_required" | "identity_hash_unavailable"; message: string };

export async function resolveVerifiedIntroDiscountEligibility(
  input: ResolveVerifiedIntroDiscountEligibilityInput,
): Promise<ResolveVerifiedIntroDiscountEligibilityResult> {
  if (!isSupabaseAdminConfigured()) {
    return { ok: false, code: "supabase_not_configured", message: "Supabase admin not configured." };
  }
  const ownerUserId = String(input.ownerUserId ?? "").trim();
  if (!ownerUserId) {
    return { ok: false, code: "owner_required", message: "Sign in required to check intro-discount eligibility." };
  }

  const supabase = getAdminSupabase();

  const packageDef = getRevenuePackageDefinition(input.packageKey);
  const packageEligible =
    packageDef != null &&
    packageDef.category === String(input.category ?? "").trim().toLowerCase() &&
    packageDef.promoEligible === true &&
    packageDef.verifiedIntroDiscountEligible !== false;

  const emailVerified = Boolean(input.emailConfirmedAt) && Boolean(input.email);
  const emailHash = emailVerified ? hashVerifiedIdentity(String(input.email)) : null;
  if (emailVerified && !emailHash) {
    return { ok: false, code: "identity_hash_unavailable", message: "Identity hashing is not configured." };
  }

  const { data: phoneRow } = await supabase
    .from(PHONE_IDENTITIES_TABLE)
    .select("id, phone_e164")
    .eq("owner_user_id", ownerUserId)
    .maybeSingle();
  const phoneVerified = Boolean(phoneRow?.id);
  const phoneHash = phoneVerified ? hashVerifiedIdentity(String(phoneRow?.phone_e164)) : null;
  if (phoneVerified && !phoneHash) {
    return { ok: false, code: "identity_hash_unavailable", message: "Identity hashing is not configured." };
  }

  const business = await resolveCommercialBusinessIdentity({
    category: input.category,
    listingSource: null,
    listingId: input.listingId,
    ownerUserId,
  });

  const orClauses = [
    `owner_user_id.eq.${ownerUserId}`,
    ...(emailHash ? [`verified_email_identity_hash.eq.${emailHash}`] : []),
    ...(phoneHash ? [`verified_phone_identity_hash.eq.${phoneHash}`] : []),
    `and(business_identity_type.eq.${business.identityType},business_identity_key.eq.${business.identityKey})`,
  ].join(",");

  const { data: priorRows } = await supabase
    .from(REDEMPTIONS_TABLE)
    .select("id, status")
    .in("status", ["reserved", "redeemed"])
    .or(orClauses)
    .limit(1);
  const hasPriorRedemption = Boolean(priorRows?.length);

  const decision = decideVerifiedIntroDiscountEligibility({
    emailVerified,
    phoneVerified,
    hasPriorRedemption,
    packageEligible,
    billingMode: packageDef?.billingMode ?? "free",
    activeDiscountSource: input.activeDiscountSource,
  });

  return {
    ok: true,
    ...decision,
    emailVerified,
    phoneVerified,
    businessIdentityType: business.identityType,
    businessIdentityKey: business.identityKey,
    businessIdentityFallbackReason: business.fallbackReason,
  };
}
