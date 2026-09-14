/**
 * SERVICIOS LIVE LAUNCH PERFECTION — Wave 3 (⚠️14 shared Share, ⚠️31 Cotización protect), 2026-09-13.
 *
 * ⚠️14 → ⚠️32  ⚠️14 (2026-09-13) routed every Servicios "Compartir" through the shared `share_ad`
 *       hub. The owner rejected the heavy multi-action drawer for a simple share; PM product decision
 *       (⚠️32, 2026-09-14) = Business Hub standard: native/device share directly when supported, a
 *       LIGHTWEIGHT copy-link fallback (now with visible confirmation) when not. Every Servicios
 *       general-share mount passes `directNativeShare`; the shared engine and its hub stay intact for
 *       the categories that use them.
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
check("⚠️32 every Servicios general-share mount is native-first (directNativeShare on all 7)", () => {
  for (const rel of SERVICIOS_SHARE_MOUNTS) {
    const src = raw(rel);
    assert.ok(src.includes("<LeonixShareButton"), `${rel}: share button still mounted`);
    assert.ok(src.includes("directNativeShare"), `${rel}: native-first share`);
  }
});
check("⚠️32 shared button: navigator.share first, clipboard copy-link fallback with visible confirmation; hub intact", () => {
  const button = raw("app/components/clasificados/analytics/LeonixShareButton.tsx");
  const native = button.indexOf("await navigator.share(shareData)");
  const copy = button.indexOf("await navigator.clipboard.writeText(urlToShare || body || safeTitle)");
  assert.ok(native > 0 && copy > native, "native share is tried before the clipboard fallback");
  assert.ok(button.includes("setCopyFeedback(true)"), "fallback confirms visibly");
  assert.ok(button.includes('linkCopied: "Enlace copiado"') && button.includes('linkCopied: "Link copied"'), "bilingual confirmation");
  assert.ok(button.includes('role="status"'), "confirmation is announced");
  assert.ok(button.includes("if (directNativeShare) {") && button.includes("void triggerNativeShare();"), "direct path wired");
  assert.ok(button.includes('kind: "share_ad"'), "hub branch kept for the categories that use it");
  const sheet = raw("app/components/cta/CtaActionSheet.tsx");
  assert.ok(sheet.includes('intent.kind === "share_ad"'), "shared hub untouched");
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
