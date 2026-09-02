/**
 * Globalization Build D-F2 — Bienes Raices + Rentas adoption sweep.
 *
 * Covers: the WhatsApp bug fix in agenteResidencialPreviewFormat.ts (was unconditionally
 * prepending "1" to any number), the new Like button on the generic anuncio page, and the
 * evidence backing every Family-2 reclassification made this gate (Report/Rich Correo/Share/
 * Phone normalization inherited via the generic ContactActions.tsx -> CtaActionSheet pipeline;
 * Google/Yelp reputation correctly N/A for ordinary private FSBO/rental; Security/RLS correctly
 * RLS_ENFORCED for BRN/RTN via public.listings' existing policies).
 *
 * Run: npx tsx scripts/verify-family2-bienes-rentas-full-sweep.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const REPO_ROOT = join(__dirname, "..");
const read = (rel: string) => readFileSync(join(REPO_ROOT, rel), "utf8");
let failures = 0;
let checks = 0;
function check(label: string, fn: () => void): void {
  checks += 1;
  try {
    fn();
    console.log(`  ok  - ${label}`);
  } catch (err) {
    failures += 1;
    console.error(`  FAIL - ${label}`);
    console.error(`         ${err instanceof Error ? err.message : String(err)}`);
  }
}

function main(): void {
  console.log("verify-family2-bienes-rentas-full-sweep: starting");

  // ── Real fix #1: agente-individual WhatsApp bug (BRP + BRN) ────────────────────────────────
  const agenteSrc = read(
    "app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/lib/agenteResidencialPreviewFormat.ts",
  );
  check("agenteResidencialPreviewFormat's buildWhatsappHref no longer unconditionally prepends '1'", () => {
    assert.doesNotMatch(agenteSrc, /https:\/\/wa\.me\/1\$\{d\}/);
    assert.match(agenteSrc, /buildInternationalWhatsAppWaMeHrefWithText/);
  });

  // ── Real fix #2: Like button added to the generic anuncio page (BRP) ───────────────────────
  const anuncioSrc = read("app/(site)/clasificados/anuncio/[id]/page.tsx");
  check("Generic anuncio page now renders LeonixLikeButton (was completely absent before)", () => {
    assert.match(anuncioSrc, /import \{ LeonixLikeButton \} from "@\/app\/components\/clasificados\/analytics\/LeonixLikeButton"/);
    assert.match(anuncioSrc, /<LeonixLikeButton/);
  });
  check("Like wiring reuses the existing trackListingLikeToggle recorder (no new analytics engine)", () => {
    assert.match(anuncioSrc, /trackListingLikeToggle,/);
    assert.match(anuncioSrc, /recordLikeEvent=\{\(isLike\) =>\s*\n\s*trackListingLikeToggle\(/);
  });
  check("Generic anuncio page still has the canonical Report component from Build D-S (Report cell inherited)", () => {
    assert.match(anuncioSrc, /<LeonixInlineListingReport listingId=\{listing\.id\}/);
  });
  check("Generic anuncio page builds both call and send_email CTA intents (Phone normalization + Rich Correo inherited via CtaActionSheet)", () => {
    const contactActionsSrc = read("app/(site)/clasificados/components/ContactActions.tsx");
    assert.match(contactActionsSrc, /kind: "call"/);
    assert.match(contactActionsSrc, /kind: "send_email"/);
    assert.match(contactActionsSrc, /CtaActionSheet/);
  });

  // ── Evidence backing reclassifications ──────────────────────────────────────────────────
  const rlsMigrationSrc = read("supabase/migrations/20260421130001_listings_enable_rls_full_policies.sql");
  check("public.listings has real owner-scoped INSERT/UPDATE/DELETE policies (backs BRN/RTN RLS_ENFORCED)", () => {
    assert.match(rlsMigrationSrc, /create policy "listings_authenticated_insert_own"/);
    assert.match(rlsMigrationSrc, /create policy "listings_authenticated_update_own"/);
    assert.match(rlsMigrationSrc, /create policy "listings_authenticated_delete_own"/);
    assert.match(rlsMigrationSrc, /with check \(owner_id = auth\.uid\(\)\)/);
  });

  const rentasNegocioWa = read(
    "app/(site)/clasificados/publicar/rentas/negocio/application/mapping/mapRentasNegocioStateToPreviewVm.ts",
  );
  check("Rentas Negocio WhatsApp fix (from Build D-S) still intact", () => {
    assert.match(rentasNegocioWa, /const withCountryCode = d\.length === 10 \? `1\$\{d\}` : d;/);
  });
  const rentasPrivadoWa = read(
    "app/(site)/clasificados/publicar/rentas/privado/application/mapping/mapRentasPrivadoStateToPreviewVm.ts",
  );
  check("Rentas Privado WhatsApp fix (from Build D-S) still intact", () => {
    assert.match(rentasPrivadoWa, /const withCountryCode = d\.length === 10 \? `1\$\{d\}` : d;/);
  });
  const brNegocioWa = read(
    "app/(site)/clasificados/publicar/bienes-raices/negocio/application/mapping/mapBienesRaicesNegocioStateToPreviewVm.ts",
  );
  check("Bienes Negocio (empresa lane) WhatsApp fix (from Build D-S) still intact", () => {
    assert.match(brNegocioWa, /const withCountryCode = d\.length === 10 \? `1\$\{d\}` : d;/);
  });

  // ── Regression: locked architecture untouched ───────────────────────────────────────────
  check("REGRESSION: Autos/Bienes parent-child capacity guard untouched", () => {
    const capacitySrc = read("app/lib/listingPlans/commercialWriteGuard.ts");
    assert.match(capacitySrc, /export async function assertCommercialCapacityForWrite/);
    assert.match(capacitySrc, /verifyBrChildBelongsToParent/);
  });
  check("REGRESSION: Bienes Negocio $399/mo pricing unchanged", () => {
    const pricingSrc = read("app/lib/listingPlans/revenuePricingMatrix.ts");
    assert.match(pricingSrc, /packageKey: "br_agent_monthly",[\s\S]{0,150}priceCents: 39900,/);
  });
  check("REGRESSION: Bienes FSBO $49.99/45d pricing unchanged", () => {
    const pricingSrc = read("app/lib/listingPlans/revenuePricingMatrix.ts");
    assert.match(pricingSrc, /packageKey: "br_fsbo_45d",[\s\S]{0,150}priceCents: 4999,/);
  });
  check("REGRESSION: Rentas $24.99/30d pricing unchanged", () => {
    const pricingSrc = read("app/lib/listingPlans/revenuePricingMatrix.ts");
    assert.match(pricingSrc, /packageKey: "rentas_30d",[\s\S]{0,150}priceCents: 2499,/);
  });
  check("REGRESSION: the active-paid-edit-checkout-ownership guard for Bienes FSBO (Build C) is untouched", () => {
    const guardSrc = read("app/lib/listingLifecycle/activePaidEditCheckoutOwnership.ts");
    assert.match(guardSrc, /validateBrFsboActiveEditCheckoutOwnership/);
  });

  // ── Build D-F2B: Lifecycle domain (BRP) ─────────────────────────────────────────────────
  check("BR_FSBO_LIFECYCLE_CONFIG is exported (was private, only usable by the checkout guard)", () => {
    const guardSrc = read("app/lib/listingLifecycle/activePaidEditCheckoutOwnership.ts");
    assert.match(guardSrc, /export const BR_FSBO_LIFECYCLE_CONFIG: ListingLifecycleConfig/);
    assert.match(guardSrc, /renewalPackageKey: null/);
  });
  check("mis-anuncios dashboard now resolves a BR FSBO lifecycle branch mirroring the Rentas branch", () => {
    const pageSrc = read("app/(site)/dashboard/mis-anuncios/page.tsx");
    assert.match(pageSrc, /import \{ BR_FSBO_LIFECYCLE_CONFIG \} from "@\/app\/lib\/listingLifecycle\/activePaidEditCheckoutOwnership"/);
    assert.match(pageSrc, /const brFsboLifecycle =\s*\n\s*catKey === "bienes-raices" && !isBrNegocioListing\(x\)/);
    assert.match(pageSrc, /lifecycle=\{rentasLifecycle \?\? brFsboLifecycle\}/);
  });
  check("ListingRenewalAction safely no-ops when isRenewalEligible is false (confirms no renew button appears for BRP)", () => {
    const actionSrc = read("app/(site)/dashboard/components/ListingRenewalAction.tsx");
    assert.match(actionSrc, /if \(!lifecycle\.isRenewalEligible \|\| !onRenew\) return null;/);
  });

  // ── Build D-F2B: Unsaved-change guard (BRP) ─────────────────────────────────────────────
  check("BienesRaicesPrivadoForm now uses the shared useBusinessApplicationLeaveGuard hook", () => {
    const formSrc = read("app/(site)/clasificados/publicar/bienes-raices/privado/application/BienesRaicesPrivadoForm.tsx");
    assert.match(formSrc, /import \{ useBusinessApplicationLeaveGuard \} from "@\/app\/lib\/businessApplications\/useBusinessApplicationLeaveGuard"/);
    assert.match(formSrc, /useBusinessApplicationLeaveGuard\(\{ isDirty, persist: flushSave \}\)/);
  });

  // ── Build D-F2B: Additional websites/socials (BRP/RTP/RTN via shared contract) ──────────
  check("LeonixContactChannelsV1 contract now carries additionalWebsites end to end (build/parse/merge)", () => {
    const src = read("app/(site)/clasificados/lib/leonixContactChannelsV1.ts");
    assert.match(src, /additionalWebsites: AdditionalWebsiteEntry\[\];/);
    assert.match(src, /additionalWebsites\?: AdditionalWebsiteEntry\[\];/);
    assert.match(src, /const additionalWebsites = sanitizeAdditionalWebsiteEntries\(slice\.additionalWebsites\);/);
    assert.match(src, /Array\.isArray\(rec\.additionalWebsites\)/);
    assert.match(src, /export function leonixContactChannelsFormSliceFromPayload/);
  });
  check("Gate12cContactChannelsFields (shared by BRP/RTP/RTN) renders the repeatable additional-websites UI", () => {
    const src = read("app/(site)/clasificados/publicar/shared/Gate12cContactChannelsFields.tsx");
    assert.match(src, /value\.additionalWebsites\.map/);
    assert.match(src, /ch\.additionalWebsitesAdd/);
  });
  check("All 4 locale dictionaries (es/en/pt/tl) define the new additionalWebsites channel copy keys, plus the type", () => {
    const src = read("app/lib/i18n/rentasLaunchUiExtras.ts");
    const matches = src.match(/additionalWebsitesLabel:/g) ?? [];
    // 1 type declaration + 4 locale implementations (es/en/pt/tl) = 5
    assert.equal(matches.length, 5);
  });
  check("Rentas dashboard edit-hydration now restores contactChannels (was previously omitted entirely)", () => {
    const src = read("app/(site)/clasificados/publicar/rentas/shared/rentasDashboardEditHydration.ts");
    assert.match(src, /leonixContactChannelsFormSliceFromPayload\(/);
    assert.match(src, /parseLeonixContactChannelsV1FromDetailPairs\(row\.detail_pairs\)/);
  });
  check("BR Negocio's own businessExtraUrls lifecycle (independent adoption) is real and untouched", () => {
    const src = read("app/(site)/clasificados/publicar/bienes-raices/negocio/application/bienesAdditionalBusinessLinks.ts");
    assert.match(src, /export function durableBusinessExtraLinks/);
    assert.match(src, /export function parsePublishedBusinessExtraLinks/);
  });

  console.log(`\nverify-family2-bienes-rentas-full-sweep: ${checks - failures}/${checks} checks passed`);
  if (failures > 0) process.exitCode = 1;
}

main();
