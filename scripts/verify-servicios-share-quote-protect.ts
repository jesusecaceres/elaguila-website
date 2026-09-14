/**
 * SERVICIOS LIVE LAUNCH PERFECTION — Wave 3 (⚠️14 shared Share, ⚠️31 Cotización protect), 2026-09-13.
 *
 * ⚠️14  Owner evidence (#115–#117, #148): "Compartir" opened only the OS share sheet — no Copy Link,
 *       no in-Leonix choices — because every Servicios mount passed `directNativeShare`, bypassing
 *       the shared `share_ad` hub (copy link + native share + WhatsApp/SMS/socials) that the results
 *       card already used. The bypass is removed; the shared engine is untouched.
 * ⚠️31  The service-specific Cotización sheet (`get_quote`, service name in the message) is OWNER
 *       PASS and must stay distinct from generic Share — never merged.
 *
 * Execution-first: the real quote-intent builder runs against a fixture. Source assertions pin the
 * six mounts, the preview's non-persisting engagement, and the two distinct sheet intents.
 *
 * Run: node node_modules/tsx/dist/cli.mjs scripts/verify-servicios-share-quote-protect.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { buildServiciosGetQuoteIntent } from "../app/(site)/servicios/lib/serviciosCtaIntents";
import type { ServiciosProfileResolved } from "../app/(site)/servicios/types/serviciosBusinessProfile";

const failures: string[] = [];
function check(name: string, fn: () => void) {
  try {
    fn();
    console.log(`OK: ${name}`);
  } catch (e) {
    failures.push(`${name}: ${e instanceof Error ? e.message : String(e)}`);
    console.error(`FAIL: ${name}\n  ${e instanceof Error ? e.message : String(e)}`);
  }
}
const raw = (rel: string) => readFileSync(new URL(`../${rel}`, import.meta.url), "utf8");

const SERVICIOS_SHARE_MOUNTS = [
  "app/(site)/servicios/components/ServiciosProfileView.tsx",
  "app/(site)/servicios/components/ServiciosProfessionalProfileShell.tsx",
  "app/(site)/servicios/components/ServiciosBusinessHubEngagementRow.tsx",
  "app/(site)/servicios/components/ServiciosResultCardEngagementStrip.tsx",
  "app/(site)/servicios/components/ServiciosEndOfContentShare.tsx",
  "app/(site)/clasificados/publicar/servicios/preview/ServiciosProfessionalPreviewShell.tsx",
  "app/(site)/clasificados/servicios/ServiciosListingResultCard.tsx",
];

/* ==============================================================================================
 * ⚠️14 — one shared Share experience.
 * ============================================================================================ */
check("⚠️14 every Servicios LeonixShareButton mount opens the shared share_ad hub (0 directNativeShare)", () => {
  for (const rel of SERVICIOS_SHARE_MOUNTS) {
    const src = raw(rel);
    assert.ok(src.includes("<LeonixShareButton"), `${rel}: share button still mounted`);
    assert.ok(!src.includes("directNativeShare"), `${rel}: native bypass removed`);
  }
});
check("⚠️14 shared engine untouched: hub branch, native branch and copy-link row still exist", () => {
  const button = raw("app/components/clasificados/analytics/LeonixShareButton.tsx");
  assert.ok(button.includes('kind: "share_ad"'), "button opens the share_ad intent");
  assert.ok(button.includes("directNativeShare?: boolean;"), "opt-in prop kept for other categories (Autos, BR, Restaurantes)");
  const sheet = raw("app/components/cta/CtaActionSheet.tsx");
  assert.ok(sheet.includes('intent.kind === "share_ad"'));
  assert.ok(sheet.includes('"hub_copy_link"') && sheet.includes('"hub_native_share"'), "copy link + native rows");
  assert.ok(sheet.includes("!hasUrl,"), "copy link is disabled truthfully when there is no public URL (Preview)");
});
check("⚠️14 preview never persists engagement", () => {
  const preview = raw("app/(site)/clasificados/publicar/servicios/preview/ServiciosProfessionalPreviewShell.tsx");
  assert.ok(preview.includes("persistEngagement={false}"));
});

/* ==============================================================================================
 * ⚠️31 — Cotización stays service-specific and distinct from Share.
 * ============================================================================================ */
check("⚠️31 services grid dispatches get_quote with the service name — never share_ad", () => {
  const grid = raw("app/(site)/servicios/components/ServiciosServicesGrid.tsx");
  assert.ok(grid.includes("buildServiciosGetQuoteIntent(profileForQuote, lang, {"));
  assert.ok(grid.includes("quoteMessage: message,"));
  assert.ok(grid.includes("` para ${serviceName}`") && grid.includes("` for ${serviceName}`"), "service name interpolated in both locales");
  assert.ok(grid.includes('"cta_quote_sms_click"'), "quote analytics event preserved");
  assert.ok(!grid.includes("share_ad"), "grid never opens the share hub");
  assert.ok(!grid.includes("LeonixShareButton"), "grid has no share button");
  const sheet = raw("app/components/cta/CtaActionSheet.tsx");
  assert.ok(sheet.includes('intent.kind === "get_quote"'), "distinct get_quote branch in the shared sheet");
});
check("⚠️31 quote intent builder: kind get_quote, service-specific message carried verbatim", () => {
  const profile = {
    contact: {
      quoteMessagePhone: "4085551234",
      phoneDisplay: "(408) 555-1234",
      email: "owner@example.com",
    },
  } as unknown as ServiciosProfileResolved;
  const message = "Hola, vi tu perfil en Leonix y quiero pedir una cotización para Reparación de fugas";
  const intent = buildServiciosGetQuoteIntent(profile, "es", { listingSlug: "plomeria-qa", quoteMessage: message });
  assert.ok(intent, "intent built when a quote channel exists");
  assert.equal(intent!.kind, "get_quote");
  assert.equal(intent!.quoteMessage, message);
  assert.ok(intent!.quoteMessage.includes("Reparación de fugas"));
  assert.equal(intent!.email, "owner@example.com");
});

if (failures.length) {
  console.error(`\nverify-servicios-share-quote-protect: ${failures.length} failure(s)`);
  process.exit(1);
}
console.log("\nverify-servicios-share-quote-protect: PASS");
