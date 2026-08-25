/**
 * Package 3 (Viajes Free Community Opportunity Experience) — gate self-test.
 *
 * Pins: the free Viajes checkpoint truth, the Community Opportunity Intake data contract, the
 * one-row staged identity (intake → full application → submit), the intake→application prefill
 * map, community-benefit truth (owner can never self-approve; public badge is approved-only and
 * fail-closed), intake PII isolation from public mappers, and the protected Package 1 / Package
 * 2 Revenue OS truth.
 *
 * Pure functions + source-text pins — no network, no React, no Supabase. Run from repo root:
 *   npx tsx scripts/gate-pkg3-viajes-intake-selftest.ts
 */
import { strict as assert } from "node:assert";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { getViajesCheckpointCards } from "../app/(site)/clasificados/publicar/_lib/categoryPublishCheckpoints";
import {
  getRevenuePackageDefinition,
  isStripeEligiblePackageKey,
  REVENUE_PRICING_UNRESOLVED_OWNER_DECISIONS,
  VIAJES_BUSINESS_FREE_PACKAGE_KEY,
} from "../app/lib/listingPlans/revenuePricingMatrix";
import { resolveCanonicalListingSourceForPackageKey } from "../app/lib/listingPlans/revenueListingSourceResolver";
import {
  emptyViajesIntake,
  normalizeViajesIntakeInput,
  viajesIntakeClaimsBenefit,
  viajesIntakeProvisionalTitle,
  VIAJES_INTAKE_BENEFIT_TYPES,
  type ViajesIntakeV1,
} from "../app/(site)/clasificados/viajes/lib/viajesIntakeTypes";
import {
  resolveViajesStagedApplicationStage,
  type ViajesStagedListingRow,
} from "../app/(site)/clasificados/viajes/lib/viajesStagedListingTypes";
import { mapViajesIntakeToNegociosDraft } from "../app/(site)/publicar/viajes/negocios/lib/mapViajesIntakeToNegociosDraft";
import { mapViajesStagedRowToViajesBusinessResult } from "../app/(site)/clasificados/viajes/lib/mapViajesStagedRowToViajesResult";
import { mapViajesStagedRowToTravelOpportunityLead } from "../app/(site)/clasificados/viajes/lib/travelOpportunityLead";

const REPO_ROOT = path.resolve(__dirname, "..");
const read = (p: string) => readFileSync(path.join(REPO_ROOT, p), "utf8");

function validIntake(): ViajesIntakeV1 {
  return {
    ...emptyViajesIntake(),
    businessName: "Viajes El Sol",
    contactName: "María López",
    email: "maria@viajeselsol.com",
    phone: "(555) 123-4567",
    website: "viajeselsol.com",
    socials: "https://facebook.com/viajeselsol",
    offerType: "paquete",
    destino: "Cancún",
    ciudadSalida: "San José",
    precio: "$1,999",
    priceBasis: "per_person",
    communityBenefit: {
      types: ["exclusive_discount", "free_consultation"],
      description: "$250 de descuento y consulta en español para la comunidad Leonix",
      samePublicOffer: "extra",
      estimatedValueBand: "101_250",
      expiration: "hasta el 31 de diciembre",
      restrictions: "sujeto a disponibilidad",
    },
  };
}

function stagedRow(overrides: Partial<ViajesStagedListingRow>): ViajesStagedListingRow {
  return {
    id: "00000000-0000-0000-0000-000000000001",
    slug: "viajes-el-sol-cancun",
    category: "viajes",
    lane: "business",
    owner_user_id: "00000000-0000-0000-0000-0000000000aa",
    business_profile_slug: null,
    submitter_name: "Viajes El Sol",
    submitter_email: "maria@viajeselsol.com",
    submitter_phone: "(555) 123-4567",
    title: "Viajes El Sol — Cancún",
    lifecycle_status: "draft",
    is_public: false,
    review_notes: null,
    moderation_reason: null,
    hero_image_url: null,
    listing_json: { version: 1 },
    lang: "es",
    submitted_at: null,
    reviewed_at: null,
    published_at: null,
    expires_at: null,
    created_at: "2026-08-25T12:00:00Z",
    updated_at: "2026-08-25T12:00:00Z",
    ...overrides,
  };
}

/* 1–4 — Viajes business checkpoint is free, no $399, no paid-style (banner) card; private lane
 * unchanged. (gate-pkgA-checkpoints-selftest pins this too; re-asserted here so this gate is
 * self-sufficient.) */
{
  const cards = getViajesCheckpointCards("es", "/publicar/viajes/negocios", "/publicar/viajes/privado");
  assert.equal(cards.length, 2);
  assert.equal(cards[0].variant, "free");
  assert.equal(cards[0].priceLabel, "Gratis");
  assert.equal(cards[0].couponEligible, false);
  assert.equal(cards[0].ctaHref, "/publicar/viajes/negocios/intake");
  assert.ok(!JSON.stringify(cards).includes("$399"), "no $399 in any Viajes checkpoint card");
  assert.ok(
    cards.every((c) => c.variant !== "paid" && c.variant !== "dealer" && c.variant !== "upgrade"),
    "no paid-style Viajes card (suppresses the Launch coupon banner)",
  );
  assert.equal(cards[1].variant, "free");
  assert.equal(cards[1].ctaHref, "/publicar/viajes/privado", "private lane card unchanged");
}

/* 5 — intake validation accepts correct values and rejects bad ones. */
{
  const ok = normalizeViajesIntakeInput(validIntake());
  assert.ok(ok.ok, "valid intake must pass validation");
  if (ok.ok) {
    assert.equal(ok.intake.website, "https://viajeselsol.com", "bare domains are normalized to https");
    assert.ok(ok.intake.completedAt.length > 0, "completedAt is stamped server-side");
  }

  const missing = normalizeViajesIntakeInput({ ...validIntake(), businessName: "", email: "not-an-email" });
  assert.ok(!missing.ok);
  if (!missing.ok) {
    assert.ok(missing.errors.includes("business_name_required"));
    assert.ok(missing.errors.includes("email_invalid"));
  }

  const badEnum = normalizeViajesIntakeInput({
    ...validIntake(),
    offerType: "totally-made-up",
    communityBenefit: { ...validIntake().communityBenefit, types: ["fake_benefit", "exclusive_discount"] },
  });
  assert.ok(!badEnum.ok, "unknown offerType is rejected (allowlist)");
  if (!badEnum.ok) assert.ok(badEnum.errors.includes("offer_type_required"));

  const claimNoDescription = normalizeViajesIntakeInput({
    ...validIntake(),
    communityBenefit: { ...validIntake().communityBenefit, description: "" },
  });
  assert.ok(!claimNoDescription.ok, "a claimed benefit without written description is rejected");

  // Benefit-type allowlist is the owner-locked taxonomy; bilingual capabilities are modeled by
  // existing negocios fields, not duplicated as benefit types.
  assert.equal(VIAJES_INTAKE_BENEFIT_TYPES.length, 14);
  assert.ok(!VIAJES_INTAKE_BENEFIT_TYPES.some((t) => /biling|spanish/i.test(t)));
}

/* 6–7 — intake API requires auth; owner_user_id is derived from the bearer, never the body. */
{
  const route = read("app/api/clasificados/viajes/intake/route.ts");
  assert.ok(route.includes("viajesGetUserIdFromBearer"), "intake route must resolve owner from bearer");
  assert.ok(route.includes("auth_required"), "intake route must reject unauthenticated requests");
  assert.ok(!/body\s*\.\s*owner_user_id|b\.owner_user_id|ownerUserId\s*=\s*.*b\[/.test(route), "owner id must never come from the body");
  assert.ok(route.includes("normalizeViajesIntakeInput"), "intake route must validate via the shared normalizer");
  assert.ok(
    !/from ["'].*stripe|checkout\.sessions|getStripe|new Stripe/i.test(route),
    "intake route must never import or invoke Stripe",
  );
}

/* 8–9 — first save creates a draft row; repeat save updates (owner-predicated, zero-row-safe). */
{
  const db = read("app/(site)/clasificados/viajes/lib/viajesStagedListingsDbServer.ts");
  const upsert = db.slice(db.indexOf("export async function upsertViajesIntakeStagedRow"));
  assert.ok(upsert.includes('lifecycle_status: "draft"'), "intake insert must be lifecycle draft");
  assert.ok(upsert.includes("is_public: false"), "intake insert must never be public");
  assert.ok(upsert.includes("fetchViajesIntakeStageDraftRowForOwner"), "repeat saves must find the existing intake-stage row");
  assert.ok(upsert.includes('.eq("owner_user_id", ownerUserId)'), "intake update must carry the owner predicate in the write");
  assert.ok(upsert.includes('updated.length === 0'), "intake update must be zero-row-safe");
  assert.ok(upsert.includes("submitted_at: null"), "intake save must never mark submitted");
}

/* 10 — a draft intake row is not public: stage derivation + RLS/public-fetch invariants. */
{
  assert.equal(resolveViajesStagedApplicationStage({ version: 1, intake: validIntake() }), "intake");
  assert.equal(resolveViajesStagedApplicationStage({ version: 1, intake: validIntake(), negocios: {} }), "full_application");
  assert.equal(resolveViajesStagedApplicationStage({ version: 1, negocios: {} }), "full_application");
  assert.equal(resolveViajesStagedApplicationStage({}), "full_application");
  const db = read("app/(site)/clasificados/viajes/lib/viajesStagedListingsDbServer.ts");
  assert.ok(
    db.includes('.eq("lifecycle_status", "approved")') && db.includes('.eq("is_public", true)'),
    "public fetches remain approved+is_public only",
  );
}

/* 11–12 — prefill mapper covers every reused field; family/group derivations. */
{
  const intake = validIntake();
  const prefill = mapViajesIntakeToNegociosDraft(intake);
  assert.equal(prefill.businessName, "Viajes El Sol");
  assert.equal(prefill.email, "maria@viajeselsol.com");
  assert.equal(prefill.phone, "(555) 123-4567");
  assert.equal(prefill.website, "viajeselsol.com");
  assert.equal(prefill.socials, "https://facebook.com/viajeselsol");
  assert.equal(prefill.offerType, "paquete");
  assert.equal(prefill.destino, "Cancún");
  assert.equal(prefill.ciudadSalida, "San José");
  assert.equal(prefill.precio, "$1,999 por persona", "priceBasis is composed into precio");
  assert.equal(prefill.titulo, undefined, "titulo is the provider's to write in the full application");
  // No community-benefit prose leaks into public application fields.
  assert.equal((prefill as Record<string, unknown>).descripcion, undefined);
  assert.equal((prefill as Record<string, unknown>).incluye, undefined);

  const grupo = mapViajesIntakeToNegociosDraft({ ...intake, offerType: "viaje-grupo" });
  assert.equal(grupo.grupos, true);
  assert.equal(grupo.familias, undefined);
  const familiar = mapViajesIntakeToNegociosDraft({ ...intake, offerType: "viaje-familiar" });
  assert.equal(familiar.familias, true);
}

/* 13 & 15 — the intake snapshot survives full submit: owner-revision merge preserves it. */
{
  const db = read("app/(site)/clasificados/viajes/lib/viajesStagedListingsDbServer.ts");
  const revision = db.slice(
    db.indexOf("export async function updateViajesStagedListingOwnerRevision"),
    db.indexOf("export async function ownerResubmitViajesStagedListing"),
  );
  assert.ok(
    revision.includes("existingJson.intake && !incomingJson.intake"),
    "owner revision must merge the preserved intake block back into the envelope",
  );
  assert.ok(revision.includes("mergedListingJson"), "owner revision must write the merged envelope");
}

/* 14 — returning hydration: an existing negocios draft always wins over intake prefill. */
{
  const shell = read("app/(site)/publicar/viajes/negocios/components/ViajesNegociosApplicationShell.tsx");
  const negociosFirst = shell.indexOf("if (negocios) {");
  const intakeMap = shell.indexOf("mapViajesIntakeToNegociosDraft(intake!)");
  assert.ok(negociosFirst > -1 && intakeMap > -1 && negociosFirst < intakeMap, "negocios branch must run before the intake prefill branch");
  // Mandatory intake for brand-new business submissions; ?stagedId flows (revisions) skip it.
  assert.ok(shell.includes('"/publicar/viajes/negocios/intake"'), "guard must route brand-new users to the intake");
  assert.ok(shell.includes("if (!hydrated || stagedIdFromUrl) return;"), "revision flows (stagedId) must skip the intake guard");
}

/* 16 — dashboard: intake-only rows get Continue, never Resubmit; server enforces too. */
{
  const dash = read("app/(site)/dashboard/viajes/page.tsx");
  assert.ok(dash.includes("isViajesIntakeOnlyRow"), "dashboard must recognize intake-only rows");
  assert.ok(dash.includes("!isViajesIntakeOnlyRow(r)"), "intake-only rows must be excluded from resubmit");
  assert.ok(dash.includes("continueApplication"), "intake-only rows must offer a Continue CTA");
  const ownerRoute = read("app/api/clasificados/viajes/staged-owner/route.ts");
  assert.ok(ownerRoute.includes("intake_only_row"), "server must reject resubmit on an intake-only row");
}

/* 17–18 — benefit truth: owner can never self-approve; only admin moderation approves. */
{
  const db = read("app/(site)/clasificados/viajes/lib/viajesStagedListingsDbServer.ts");
  const upsert = db.slice(db.indexOf("export async function upsertViajesIntakeStagedRow"));
  assert.ok(!upsert.includes('"approved"'), "intake save can never write approved");
  const approve = db.slice(
    db.indexOf("export async function approveViajesCommunityBenefit"),
    db.indexOf("export type ViajesIntakeUpsertResult"),
  );
  assert.ok(approve.includes('.eq("community_benefit_status", "claimed")'), "approval write must be narrowed to claimed rows");
  const adminRoute = read("app/api/admin/viajes/staged-listings/moderate/route.ts");
  assert.ok(adminRoute.includes('"approve_benefit"') && adminRoute.includes("approveViajesCommunityBenefit"));
  assert.ok(adminRoute.includes('req.cookies.get("leonix_admin")'), "benefit approval requires admin auth");
  const intakeRoute = read("app/api/clasificados/viajes/intake/route.ts");
  assert.ok(!intakeRoute.includes("approved"), "owner-facing intake route never handles approved status");

  // Claim logic: samePublicOffer "same" is never a claim.
  assert.equal(viajesIntakeClaimsBenefit(validIntake()), true);
  const same = validIntake();
  same.communityBenefit.samePublicOffer = "same";
  assert.equal(viajesIntakeClaimsBenefit(same), false);
  const noTypes = validIntake();
  noTypes.communityBenefit.types = [];
  assert.equal(viajesIntakeClaimsBenefit(noTypes), false);
}

/* 19 — owner edit after approval fails safe: every intake save recomputes claimed/none. */
{
  const db = read("app/(site)/clasificados/viajes/lib/viajesStagedListingsDbServer.ts");
  const upsert = db.slice(db.indexOf("export async function upsertViajesIntakeStagedRow"));
  assert.ok(
    upsert.includes("await setViajesCommunityBenefitStatus(existing.id, claimStatus)"),
    "every repeat intake save must recompute claim status (downgrading an approved benefit for re-review)",
  );
}

/* 20–21 — public badge renders ONLY on approved (fail closed), and intake PII never reaches
 * public mappers. */
{
  const negociosDraftJson = { titulo: "Cancún 5 noches", destino: "Cancún", ciudadSalida: "San José", precio: "$1,999", duracion: "5 días", fechas: "", dateMode: "flexible", fechaInicio: "", fechaFin: "", fechasNota: "", descripcion: "desc", incluye: "hotel", ctaType: "whatsapp", familias: false, parejas: false, grupos: false, presupuestoTag: "", incluyeHotel: false, incluyeTransporte: false, incluyeComida: false, guiaEspanol: false, idiomaAtencion: "", imagenPrincipal: "", localHeroImageId: null, localImageDataUrl: null, heroSourceMode: "url", galeriaUrls: [], galeriaNota: "", logoSocio: "", logoLocalDataUrl: null, logoSourceMode: "url", videoUrl: "", videoLocalLabel: "", businessName: "Viajes El Sol", phone: "", phoneOffice: "", email: "", website: "", whatsapp: "", socials: "", socialFacebook: "", socialInstagram: "", socialTiktok: "", socialYoutube: "", socialTwitter: "", destinationsServed: "", languages: "", schemaVersion: 1 };
  const json = { version: 1, intake: validIntake(), negocios: negociosDraftJson };

  const approvedRow = stagedRow({ lifecycle_status: "approved", is_public: true, listing_json: json, community_benefit_status: "approved" });
  const claimedRow = stagedRow({ lifecycle_status: "approved", is_public: true, listing_json: json, community_benefit_status: "claimed" });
  const columnAbsentRow = stagedRow({ lifecycle_status: "approved", is_public: true, listing_json: json });

  const approvedResult = mapViajesStagedRowToViajesBusinessResult(approvedRow);
  assert.ok(approvedResult?.communityBenefitApproved, "approved benefit must surface on the public result");
  assert.equal(approvedResult!.communityBenefitApproved!.description, validIntake().communityBenefit.description);
  assert.equal(mapViajesStagedRowToViajesBusinessResult(claimedRow)?.communityBenefitApproved, undefined, "claimed-only must produce NO badge");
  assert.equal(mapViajesStagedRowToViajesBusinessResult(columnAbsentRow)?.communityBenefitApproved, undefined, "absent column (migration not applied) must fail closed");

  // Ranking parity: benefit approval adds no discovery boost.
  const claimedResult = mapViajesStagedRowToViajesBusinessResult(claimedRow);
  assert.deepEqual(approvedResult!.discovery, claimedResult!.discovery, "benefit approval must not change ranking signals");

  // PII isolation: contactName and intake email/phone never appear in the public result.
  const serialized = JSON.stringify(approvedResult);
  assert.ok(!serialized.includes("María López"), "intake contactName must never reach the public mapper output");
  assert.ok(!serialized.includes("maria@viajeselsol.com"), "intake email must never reach the public mapper output");
  assert.ok(!serialized.includes("(555) 123-4567"), "intake phone must never reach the public mapper output");

  // The admin/Concierge lead projection is the sanctioned PII surface — and it is read-only.
  const lead = mapViajesStagedRowToTravelOpportunityLead(approvedRow);
  assert.ok(lead && lead.contactName === "María López" && lead.communityBenefitStatus === "approved");
  assert.equal(mapViajesStagedRowToTravelOpportunityLead(stagedRow({ listing_json: { version: 1 } })), null);
}

/* 22–24 — Package 2 + Package 1 protected truth. */
{
  const free = getRevenuePackageDefinition(VIAJES_BUSINESS_FREE_PACKAGE_KEY);
  assert.ok(free && free.priceCents === 0 && free.billingMode === "free");
  assert.equal(isStripeEligiblePackageKey(VIAJES_BUSINESS_FREE_PACKAGE_KEY), false, "free package stays non-Stripe");
  const historical = getRevenuePackageDefinition("viajes_business_monthly");
  assert.ok(historical && historical.priceCents === 39900 && historical.newSalesRetired === true);
  assert.equal(isStripeEligiblePackageKey("viajes_business_monthly"), false, "historical package stays retired");
  assert.equal(resolveCanonicalListingSourceForPackageKey(VIAJES_BUSINESS_FREE_PACKAGE_KEY), "viajes_staged_listings", "Package 1 canonical listing_source unchanged");
  // Package 3 cleanup: the resolved Viajes pricing decision is gone; the two real ones remain.
  assert.equal(REVENUE_PRICING_UNRESOLVED_OWNER_DECISIONS.length, 2);
  assert.ok(!REVENUE_PRICING_UNRESOLVED_OWNER_DECISIONS.some((d) => /viajes/i.test(d)));
}

/* Migration authored (never applied by this gate). */
{
  const migrationPath = "supabase/migrations/20260825150000_viajes_community_benefit_status.sql";
  assert.ok(existsSync(path.join(REPO_ROOT, migrationPath)), "community-benefit migration must be authored");
  const migration = read(migrationPath);
  assert.ok(migration.includes("community_benefit_status"));
  assert.ok(migration.includes("'none'") && migration.includes("'claimed'") && migration.includes("'approved'"));
  assert.ok(migration.includes("default 'none'"));
  assert.ok(!/create policy|drop policy|alter policy/i.test(migration), "migration must not touch RLS");
}

/* Provisional intake row title derivation. */
{
  assert.equal(viajesIntakeProvisionalTitle(validIntake()), "Viajes El Sol — Cancún");
  const noDest = validIntake();
  noDest.destino = "";
  assert.equal(viajesIntakeProvisionalTitle(noDest), "Viajes El Sol");
}

console.log("gate-pkg3-viajes-intake-selftest: all assertions passed.");
