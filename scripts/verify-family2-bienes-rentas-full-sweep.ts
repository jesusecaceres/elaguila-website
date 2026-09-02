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

  console.log(`\nverify-family2-bienes-rentas-full-sweep: ${checks - failures}/${checks} checks passed`);
  if (failures > 0) process.exitCode = 1;
}

main();
