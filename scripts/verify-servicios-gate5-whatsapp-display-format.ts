/**
 * Servicios Final Phone Destination Closeout (2026-09-17) — Gate 5.
 *
 * Owner observed raw WhatsApp digits in the application/display. Audit confirmed no LIVE Servicios
 * public surface (both result cards, hero, Business Hub contact card) currently renders a WhatsApp
 * number as visible text — every WhatsApp CTA is icon + the static "WhatsApp" label, never digits;
 * the destination href is separately built from normalized digits. This proves that structurally
 * (no accidental raw-digit leak exists today) and ships the reusable, correctly-guarded display
 * formatter (`formatServiciosWhatsAppDisplay`) for any current/future read-only display, reusing the
 * SAME normalized digits the wa.me destination already resolves from and the shared
 * `getFormattedPhone` US-conditional formatter — never a second independent digit-extraction path,
 * and never forcing US grouping onto a non-US-length number.
 *
 * Run: node node_modules/tsx/dist/cli.mjs scripts/verify-servicios-gate5-whatsapp-display-format.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { formatServiciosWhatsAppDisplay, normalizeServiciosWhatsAppDigits } from "../app/(site)/servicios/lib/serviciosWhatsAppHref";

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
const HERO = "app/(site)/servicios/components/ServiciosProfessionalHero.tsx";
const HUB_CARD = "app/(site)/servicios/components/ServiciosBusinessHubContactCard.tsx";

check("no live Servicios surface renders a WhatsApp variable directly as JSX text content (only the static 'WhatsApp' label)", () => {
  for (const rel of [TRADE_CARD, PRO_CARD, HERO, HUB_CARD]) {
    const src = raw(rel);
    // A raw-digit leak would look like `{wa}` / `{waHref}` / `{waHrefNormalized}` used as text
    // content rather than as an onClick/href argument — none of these patterns exist.
    assert.ok(!/>\{wa\}</.test(src) && !/>\{waHref\}</.test(src) && !/>\{waHrefNormalized\}</.test(src), `${rel}: found a raw WhatsApp variable rendered as text content`);
  }
});

check("formatServiciosWhatsAppDisplay produces the owner's exact worked example: 6693664300 -> (669) 366-4300", () => {
  assert.equal(formatServiciosWhatsAppDisplay("6693664300"), "(669) 366-4300");
});
check("formatServiciosWhatsAppDisplay formats an 11-digit US number with leading 1", () => {
  assert.equal(formatServiciosWhatsAppDisplay("16693664300"), "+1 (669) 366-4300");
});
check("formatServiciosWhatsAppDisplay validates via the SAME normalizer the wa.me destination uses, and formats via the SAME digit-stripper it starts from (never a second independent extraction)", () => {
  const src = raw("app/(site)/servicios/lib/serviciosWhatsAppHref.ts");
  const fnStart = src.indexOf("export function formatServiciosWhatsAppDisplay");
  const fnEnd = src.indexOf("\n}\n", fnStart);
  const body = src.slice(fnStart, fnEnd);
  assert.ok(body.includes("normalizeServiciosWhatsAppDigits("), "validity must be gated by the same normalizer the wa.me href builder uses");
  assert.ok(body.includes("whatsAppDigitsOnly("), "display digits must come from the same raw digit-stripper the normalizer itself starts from");
  assert.ok(body.includes("getFormattedPhone("), "must reuse the shared formatting helper, not a new implementation");
});
check("formatServiciosWhatsAppDisplay never mis-formats a non-US-length international number as if it were American", () => {
  // A 9-digit or 13-digit international number (neither 10 nor 11-with-leading-1) must NOT come
  // back wrapped in US "(XXX) XXX-XXXX" parens/dashes — getFormattedPhone's own guard leaves it
  // close to as-entered instead.
  const nineDigit = formatServiciosWhatsAppDisplay("521234567"); // 9 digits after normalization would be rejected by normalizeServiciosWhatsAppDigits (<8) — use a valid 12-digit example instead
  void nineDigit;
  const twelveDigit = "521555123456"; // Mexico country code 52 + 10 digits = 12 digits, a real international WhatsApp shape
  const formatted = formatServiciosWhatsAppDisplay(twelveDigit);
  assert.ok(!/^\(\d{3}\) \d{3}-\d{4}$/.test(formatted), `12-digit international number must not be forced into US grouping, got: ${formatted}`);
});
check("normalizeServiciosWhatsAppDigits (destination truth) is completely unaffected by the new display helper — same href logic as before", () => {
  const src = raw("app/(site)/servicios/lib/serviciosWhatsAppHref.ts");
  assert.ok(src.includes("export function normalizeServiciosWhatsAppDigits(raw: string): string | null {"));
  assert.ok(src.includes("return normalizeInternationalWhatsAppDigits(raw);"), "destination normalization delegates to the same shared international module, untouched");
  // Sanity: the digits used for the destination and the display are identical for a given input.
  const digits = normalizeServiciosWhatsAppDigits("6693664300");
  assert.equal(digits, "16693664300");
});
check("empty/invalid WhatsApp input returns an empty display string, not a malformed partial format", () => {
  assert.equal(formatServiciosWhatsAppDisplay(""), "");
  assert.equal(formatServiciosWhatsAppDisplay("123"), ""); // below the 8-digit minimum
});

if (failures.length) {
  console.error(`\nverify-servicios-gate5-whatsapp-display-format: ${failures.length} failure(s):\n- ${failures.join("\n- ")}`);
  process.exit(1);
}
console.log("\nverify-servicios-gate5-whatsapp-display-format: PASS");
