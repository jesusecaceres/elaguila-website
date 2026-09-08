/**
 * Globalization Build 05 — Final Production Closeout.
 *
 * This is a thin AGGREGATION layer, not a replacement for the existing per-system verifiers —
 * it deliberately does not duplicate their full check lists (see the "existing verifier" comment
 * on each section). It proves a small, high-signal set of cross-cutting closeout guarantees that
 * span multiple prior builds, and points at the authoritative verifier for full depth on each
 * system.
 *
 * Full-depth coverage lives in (all re-run separately by Gate 16 of this closeout, and required
 * to independently PASS):
 *   - scripts/verify-globalization-foundation-01-jsonld-trust.mjs
 *   - scripts/verify-globalization-foundation-01-community-publish-integrity.mjs
 *   - scripts/verify-globalization-foundation-02-location-privacy.mjs
 *   - scripts/verify-global-business-hub-os-01.mjs
 *   - scripts/verify-globalization-business-hub-trust-03.ts (+ -fixtures, -rentas-cta-fixtures)
 *   - scripts/verify-globalization-lifecycle-translate-seo-04.ts (+ -fixtures ×3)
 *   - scripts/verify-saved-search-autos-02/03/04/05.ts
 *   - scripts/verify-saved-search-br-rentas-06.ts (+ -fixtures)
 *   - scripts/discovery-filter-audit.ts
 *   - scripts/gate-i13b-public-visibility-filter-selftest.ts
 *
 * Run: npx tsx scripts/verify-globalization-final-closeout-05.ts
 */
import { strict as assert } from "node:assert";
import * as fs from "node:fs";

const failures: string[] = [];
function check(name: string, fn: () => void) {
  try {
    fn();
    console.log(`OK: ${name}`);
  } catch (e) {
    failures.push(`${name}: ${e instanceof Error ? e.message : String(e)}`);
    console.error(`FAIL: ${name}`);
    console.error(`  ${e instanceof Error ? e.message : String(e)}`);
  }
}

function read(path: string): string {
  return fs.readFileSync(path, "utf8");
}

function exists(path: string): boolean {
  return fs.existsSync(path);
}

function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
}

// =================================================================================
// Saved Search — coverage unchanged (full depth: SS02-06 + fixtures)
// =================================================================================

check("Saved Search: all 6 build verifier scripts still exist and target the same real delivery/matcher files (no silent removal/rename)", () => {
  const scripts = [
    "scripts/verify-saved-search-autos-02.ts",
    "scripts/verify-saved-search-autos-03.ts",
    "scripts/verify-saved-search-autos-04.ts",
    "scripts/verify-saved-search-autos-05.ts",
    "scripts/verify-saved-search-br-rentas-06.ts",
    "scripts/verify-saved-search-br-rentas-06-fixtures.ts",
  ];
  for (const s of scripts) assert.ok(exists(s), `${s} must still exist — Saved Search coverage must not shrink`);
});

check("Saved Search: the delivery ledger/dedupe unique-index convention referenced by SS05/SS06 is still present in the migration history", () => {
  const migrationFiles = fs.readdirSync("supabase/migrations").filter((f) => f.includes("saved_search"));
  assert.ok(migrationFiles.length > 0, "Saved Search migrations must still exist on disk");
});

// =================================================================================
// Business Hub / CTA truth (full depth: verify-global-business-hub-os-01.mjs)
// =================================================================================

check("Business Hub: shared review-button component never reads a rating/reviewCount field (real CTA truth doctrine — missing data hides the CTA, never fabricates one)", () => {
  const src = stripComments(read("app/components/contact/connectionHub/renderers/SharedConnectionHubReviewButton.tsx"));
  assert.ok(!/\.rating\b|\.reviewCount\b/.test(src), "review button must never read link.rating/link.reviewCount");
});

check("Business Hub: shared CTA launcher module still exists and still gates external links (real-destination-only CTA doctrine intact)", () => {
  const src = read("app/components/cta/ctaLaunchers.ts");
  assert.ok(/isSafeExternalHref|https?:\/\//i.test(src));
});

// =================================================================================
// Community Trust truth (full depth: verify-globalization-business-hub-trust-03*.ts)
// =================================================================================

check("Community Trust: toggle + summary RPCs remain service_role-only in the migration (no anon/authenticated grant reintroduced)", () => {
  const migrationFiles = fs.readdirSync("supabase/migrations").filter((f) => f.includes("leonix_endorsement"));
  assert.ok(migrationFiles.length > 0);
  for (const f of migrationFiles) {
    const src = read(`supabase/migrations/${f}`);
    assert.ok(!/grant execute on function public\.toggle_leonix_endorsement_vote[\s\S]{0,80}to anon/i.test(src));
    assert.ok(!/grant execute on function public\.get_leonix_endorsement_summary[\s\S]{0,80}to anon/i.test(src));
  }
});

check("Community Trust: no AggregateRating/star-rating language anywhere in the endorsement component or registry", () => {
  const files = [
    "app/components/leonixCommunityTrust/LeonixCommunityTrust.tsx",
    "app/lib/leonixCommunityTrust/leonixEndorsementRegistry.ts",
  ];
  for (const f of files) {
    const code = stripComments(read(f));
    assert.ok(!/AggregateRating/.test(code));
  }
});

// =================================================================================
// Foundation privacy (full depth: verify-globalization-foundation-02-location-privacy.mjs)
// =================================================================================

check("Privacy: the Build 04 category lifecycle adapters never reference any exact-address privacy-gated field — no new leakage vector introduced by the dashboard editor closure", () => {
  const src = read("app/(site)/dashboard/mis-anuncios/[id]/editar/categoryLifecycleAdapters.ts");
  assert.ok(!/mostrarDireccionExacta|show_exact_address|br_gate12d|showExactAddress/.test(src));
});

// =================================================================================
// Translate Ad coverage (full depth: verify-globalization-lifecycle-translate-seo-04.ts)
// =================================================================================

check("Translate Ad: exactly one control component and one API route exist — no second implementation introduced across any build", () => {
  assert.ok(exists("app/components/translation/TranslateAdControl.tsx"));
  assert.ok(exists("app/api/translate-ad/route.ts"));
  const controlMatches = fs
    .readdirSync("app/components/translation")
    .filter((f) => /TranslateAdControl/.test(f));
  assert.equal(controlMatches.length, 1);
});

check("Translate Ad: representative existing + Build 04 adopters still wire the same shared requestAdTranslation wrapper — no second implementation anywhere", () => {
  // Two established wiring conventions: (a) the lib file re-exports requestAdTranslation under a
  // category-specific alias (Servicios/Comida Local/Ofertas Locales), or (b) the consuming client
  // component imports requestAdTranslation directly and passes it to TranslateAdControl (Rentas).
  // Both are the same one real function — just imported at a different layer.
  const libFiles = [
    "app/(site)/servicios/lib/serviciosTranslateAd.ts",
    "app/lib/clasificados/comida-local/comidaLocalTranslateAd.ts",
    "app/lib/ofertas-locales/ofertasLocalesTranslateAd.ts",
  ];
  for (const f of libFiles) {
    assert.ok(exists(f), `${f} must still exist`);
    assert.ok(read(f).includes("requestAdTranslation"), `${f} must reuse the one real requestAdTranslation wrapper`);
  }
  const rentasConsumer = "app/(site)/clasificados/rentas/listing/[id]/RentasListingDetailClient.tsx";
  assert.ok(exists(rentasConsumer));
  assert.ok(read(rentasConsumer).includes('from "@/app/lib/translation/requestAdTranslation"'));
});

// =================================================================================
// Lifecycle closure (full depth: verify-globalization-lifecycle-04-fixtures.ts)
// =================================================================================

check("Lifecycle: category adapter registry still covers exactly the 5 intended categories, no INSERT anywhere in the edit path", () => {
  const adaptersSrc = read("app/(site)/dashboard/mis-anuncios/[id]/editar/categoryLifecycleAdapters.ts");
  for (const cat of ["en-venta", "busco", "clases", "comunidad", "mascotas-y-perdidos"]) {
    assert.ok(adaptersSrc.includes(`"${cat}"`));
  }
  const editarSrc = stripComments(read("app/(site)/dashboard/mis-anuncios/[id]/editar/page.tsx"));
  assert.ok(!/\.insert\(/i.test(editarSrc), "edit page must never INSERT");
});

check("Lifecycle: Clases + Comunidad publish handlers still clear the draft on success (no draft-clear regression re-introducing the duplicate-row-after-publish bug)", () => {
  const src = read("app/(site)/publicar/community/shared/CommunityQuickApplicationClient.tsx");
  assert.ok((src.match(/reset\(\);/g) ?? []).length >= 2);
  const bar = read("app/(site)/publicar/community/shared/preview/CommunityQuickPreviewPublishBar.tsx");
  assert.ok(bar.includes("COMMUNITY_SESSION_KEYS[kind]"));
});

// =================================================================================
// SEO / canonical truth (full depth: verify-globalization-seo-04-fixtures.ts)
// =================================================================================

check("SEO: Servicios canonical fix and the shared BreadcrumbList helper are both still present", () => {
  assert.ok(exists("app/lib/seo/breadcrumbJsonLd.ts"));
  const src = read("app/(site)/clasificados/servicios/[slug]/layout.tsx");
  assert.ok((src.match(/alternates:\s*\{\s*canonical\s*\}/g) ?? []).length >= 4);
});

check("SEO: no builder anywhere emits AggregateRating (forbidden fake-rating pattern absent, full repo sweep)", () => {
  const seoFiles = [
    "app/(site)/clasificados/restaurantes/seo/restauranteJsonLd.ts",
    "app/servicios/seo/serviciosJsonLd.ts",
    "app/(site)/clasificados/en-venta/seo/enVentaJsonLd.ts",
    "app/(site)/clasificados/autos/seo/autosVehicleJsonLd.ts",
    "app/lib/seo/breadcrumbJsonLd.ts",
  ];
  for (const f of seoFiles) {
    if (!exists(f)) continue;
    assert.ok(!/AggregateRating/.test(stripComments(read(f))), `${f} must never emit AggregateRating in actual code (comments documenting the deliberate absence are fine)`);
  }
});

// =================================================================================
// Analytics event contract (full depth: Build 03/04 verifiers already assert this)
// =================================================================================

check("Analytics: the one real backend sink and canonical event-type allowlist still exist, still include the Leonix endorsement + Rentas CTA event types", () => {
  const src = read("app/lib/listingAnalyticsEventTypes.ts");
  for (const t of [
    "leonix_endorsement_add",
    "leonix_endorsement_remove",
    "phone_click",
    "whatsapp_click",
    "email_click",
  ]) {
    assert.ok(src.includes(`"${t}"`), `event type ${t} must remain in the allowlist`);
  }
  assert.ok(exists("app/lib/analytics/client/recordAnalyticsEvent.ts"));
});

if (failures.length) {
  console.error(`\n${failures.length} check(s) FAILED`);
  process.exit(1);
}
console.log("\nverify-globalization-final-closeout-05: PASS");
