/**
 * Servicios False-Gates-Only Final Completion Pass — Gate 12 verifier (2026-09-17).
 * Updated for the Final Contact Truth + Email No-Mailto Closeout pass (same day): the sheet these
 * cards open no longer offers "Open email app" at all — see
 * scripts/verify-servicios-no-mailto-and-email-sheet-final.ts for that removal's own proof.
 *
 * Proves the results-card email-only fallback (trade card) and the professional card's newly-added
 * email fallback now open the SAME rich CtaActionSheet `send_email` intent the full profile's
 * "Correo" CTA already uses — built from the same `buildServiciosSendEmailIntentFromMailto` helper —
 * instead of jumping straight to a bare mailto:.
 *
 * Run: node node_modules/tsx/dist/cli.mjs scripts/verify-servicios-gate12-results-card-email-sheet.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";

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
const raw = (rel: string) => readFileSync(new URL(`../${rel}`, import.meta.url), "utf8").replace(/\r\n/g, "\n");

const TRADE_CARD = "app/(site)/clasificados/servicios/components/ServiciosHorizontalResultCard.tsx";
const PRO_CARD = "app/(site)/clasificados/servicios/ServiciosProfessionalResultCard.tsx";
const HUB_CARD = "app/(site)/servicios/components/ServiciosBusinessHubContactCard.tsx";

check("trade card: email fallback opens the rich CtaActionSheet via buildServiciosSendEmailIntentFromMailto, not a bare mailto", () => {
  const src = raw(TRADE_CARD);
  assert.ok(src.includes('import {\n  buildServiciosSendEmailIntentFromMailto,'));
  assert.ok(src.includes("const [emailSheetIntent, setEmailSheetIntent] = useState<CtaSheetIntent | null>(null);"));
  // Declared as its own callback (openEmailContact), separate from openContactKey, because it needs
  // `displayLang` which is only available after useServiciosResultCardTranslation runs — see the
  // in-file comment on openEmailContact for why.
  const fnStart = src.indexOf("const openEmailContact = useCallback(");
  const fnEnd = src.indexOf("[ctaAnalyticsListingKey, ctaTrackMeta, listingSlug, displayLang, listingShareUrl]", fnStart);
  assert.ok(fnStart > 0 && fnEnd > fnStart, "openEmailContact callback located");
  const fnBody = src.slice(fnStart, fnEnd);
  assert.ok(fnBody.includes("buildServiciosSendEmailIntentFromMailto(href, displayLang, slugKey, listingShareUrl || undefined)"));
  assert.ok(fnBody.includes("setEmailSheetIntent(intent)"));
  assert.ok(src.includes('onClick={() => openEmailContact(profile.contact.emailMailtoHref!)}'), "email button invokes the sheet-opening callback, not the bare mailto opener");
  assert.ok(src.includes("<CtaActionSheet"));
  assert.ok(src.includes("intent={emailSheetIntent}"));
});

check("professional card: previously had NO email CTA at all; now gets the same rich sheet as the trade card", () => {
  const src = raw(PRO_CARD);
  // Servicios Final Contact Truth (2026-09-17, Gate 4/9): email fallback now also excludes the
  // Message/SMS channel — it's the true "nothing else resolved" state, not just "no call, no WhatsApp".
  // Servicios Final Phone Destination Closeout (2026-09-17): email fallback now also excludes the
  // independent office-call destination, not just the (now non-fallback-merged) principal tel.
  assert.ok(src.includes("const showEmailFallback = Boolean(!tel && !showOfficeCall && !smsHref && !waHrefNormalized && profile.contact.emailMailtoHref);"));
  assert.ok(src.includes("const onEmailClick = useCallback"));
  assert.ok(src.includes("buildServiciosSendEmailIntentFromMailto(mailtoHref, displayLang, row.slug, listingShareUrl || undefined)"));
  assert.ok(src.includes("setEmailSheetIntent(intent)"));
  // Wired in both density branches (compact + non-compact), not just one.
  const emailButtonHits = [...src.matchAll(/showEmailFallback \? \(/g)].length;
  assert.equal(emailButtonHits, 2, "email fallback button must render in both compact and non-compact CTA rows");
  assert.ok(src.includes("<CtaActionSheet"));
  assert.ok(src.includes("intent={emailSheetIntent}"));
});

check("both cards' email CTA opens the sheet with an intent derived from the profile's real resolved emailMailtoHref (LITERAL_PRESERVE), never a hardcoded address", () => {
  for (const rel of [TRADE_CARD, PRO_CARD]) {
    const src = raw(rel);
    assert.ok(/emailMailtoHref/.test(src), `${rel}: sheet intent must trace back to profile.contact.emailMailtoHref`);
  }
});

check("both results cards follow the SAME pattern the full profile's Correo CTA already established (buildServiciosSendEmailIntentFromMailto + CtaActionSheet)", () => {
  const hub = raw(HUB_CARD);
  assert.ok(hub.includes("buildServiciosSendEmailIntentFromMailto("), "reference pattern still present in the full-profile hub card");
  assert.ok(hub.includes("<CtaActionSheet"));
});

check("neither results card calls the bare-mailto direct opener for its email CTA anymore (only as buildServiciosSendEmailIntentFromMailto's own null-intent fallback)", () => {
  const tradeSrc = raw(TRADE_CARD);
  const fnStart = tradeSrc.indexOf("const openEmailContact = useCallback(");
  const fnEnd = tradeSrc.indexOf("[ctaAnalyticsListingKey, ctaTrackMeta, listingSlug, displayLang, listingShareUrl]", fnStart);
  const fnBody = tradeSrc.slice(fnStart, fnEnd);
  // serviciosOpenMailtoHref(href) is retained ONLY as a defensive fallback for the (practically
  // unreachable, since `href` already came from a real emailMailtoHref) case where the helper
  // returns null — it must not be the primary path any more.
  assert.ok(fnBody.indexOf("setEmailSheetIntent(intent)") < fnBody.indexOf("serviciosOpenMailtoHref(href)"));

  const proSrc = raw(PRO_CARD);
  assert.ok(!proSrc.includes("serviciosOpenMailtoHref"), "professional card's new email handler never needs the bare-mailto opener at all");
});

if (failures.length) {
  console.error(`\nverify-servicios-gate12-results-card-email-sheet: ${failures.length} failure(s):\n- ${failures.join("\n- ")}`);
  process.exit(1);
}
console.log("\nverify-servicios-gate12-results-card-email-sheet: PASS");
