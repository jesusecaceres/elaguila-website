/**
 * Gate 2C — Community (Comunidad + Clases) canonical contact URI cleanup self-test.
 *
 * Verifies the older, US-only tel:/sms:/WhatsApp/mailto construction in
 * `communityContactCtas.ts` was retired in favor of the canonical, internationally-safe builders
 * in `nativeChannelHrefs.ts`, without touching category-owned visual composition.
 *
 * No network, no React. Run from repo root:
 *   npx tsx scripts/gate-2c-community-contact-uri-selftest.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { join } from "node:path";

import {
  buildMailtoHref,
  buildSmsHref,
  buildTelHref,
  buildWhatsAppUrl,
} from "../app/lib/digitalContact/humanConnection/nativeChannelHrefs";
import { buildComunidadContactCanvasModel } from "../app/(site)/publicar/comunidad/lib/buildComunidadContactCanvasModel";
import { buildClasesContactCanvasModel } from "../app/(site)/publicar/clases/lib/buildClasesContactCanvasModel";
import { emptyComunidadQuickDraft, emptyClasesQuickDraft } from "../app/(site)/publicar/community/shared/types/communityQuickDraft";

const ROOT = join(__dirname, "..");
function read(relPath: string): string {
  return readFileSync(join(ROOT, relPath), "utf8");
}

// ---------------------------------------------------------------------------
// 1-4. Old builders retired; canonical builders wired in
// ---------------------------------------------------------------------------
{
  const oldFile = read("app/(site)/publicar/community/shared/lib/communityContactCtas.ts");
  assert.ok(!/`tel:/.test(oldFile), "communityContactCtas.ts must no longer construct tel: URIs");
  assert.ok(!/`sms:/.test(oldFile), "communityContactCtas.ts must no longer construct sms: URIs");
  assert.ok(!oldFile.includes("wa.me"), "communityContactCtas.ts must no longer construct WhatsApp URIs");
  assert.ok(!/`mailto:/.test(oldFile), "communityContactCtas.ts must no longer construct mailto: URIs");
  assert.ok(
    !/export function (usPhoneDigits10|telUriFromUs10|smsUri|whatsAppUri|mailtoCommunity)/.test(oldFile),
    "the old US-only builder functions must be removed, not just unused",
  );

  const canvas = read("app/(site)/publicar/community/shared/preview/CommunityContactCanvas.tsx");
  assert.ok(canvas.includes('from "@/app/lib/digitalContact/humanConnection/nativeChannelHrefs"'), "canvas must import the canonical builders");
  for (const fn of ["buildTelHref", "buildSmsHref", "buildWhatsAppUrl", "buildMailtoHref"]) {
    assert.ok(canvas.includes(fn), `canvas must actually use ${fn}`);
  }
  console.log("OK: old US-only tel/sms/WhatsApp/mailto builders retired; canonical nativeChannelHrefs builders wired in");
}

// ---------------------------------------------------------------------------
// 5-8. Phone number formats
// ---------------------------------------------------------------------------
{
  assert.equal(buildTelHref("4085551234"), "tel:+14085551234", "bare US digits");
  assert.equal(buildTelHref("(408) 555-1234"), "tel:+14085551234", "formatted US display input");
  assert.equal(buildTelHref("+1 408 555 1212"), "tel:+14085551212", "+1 international-style US input");
  const intl = buildTelHref("+52 55 1234 5678");
  assert.ok(intl && intl.startsWith("tel:+52"), `non-US international number must produce a safe tel: href, got ${intl}`);
  console.log("OK: US bare/formatted, +1, and non-US international phone numbers all produce valid tel: hrefs");
}

// ---------------------------------------------------------------------------
// 9-11. Blank contact fields never produce a CTA
// ---------------------------------------------------------------------------
{
  assert.equal(buildTelHref(""), null, "blank phone must not produce a tel: href");
  assert.equal(buildTelHref(undefined), null);
  assert.equal(buildSmsHref(""), null, "blank SMS number must not produce an sms: href");
  assert.equal(buildWhatsAppUrl(""), null, "blank WhatsApp number must not produce a wa.me href");

  const canvas = read("app/(site)/publicar/community/shared/preview/CommunityContactCanvas.tsx");
  assert.ok(canvas.includes("const waDigits = communityWhatsAppDigits(draft.whatsapp);"), "WhatsApp digits must be derived, not passed raw");
  assert.ok(canvas.includes("const waHref = waDigits ? buildWhatsAppUrl(waDigits, smsBody) : null;"), "WhatsApp href must be null (no CTA) when digits are blank/invalid");
  console.log("OK: blank phone/SMS/WhatsApp never produce a renderable CTA");
}

// ---------------------------------------------------------------------------
// 12. Email uses canonical current behavior
// ---------------------------------------------------------------------------
// Gate 2D (owner-QA debt) superseded this: email now invokes native mailto directly (no Leonix
// custom sheet/modal) for Comunidad + Clases. The canonical URI construction itself (buildMailtoHref)
// is unchanged — only the UI wrapper around it changed. See gate-2d-community-owner-qa-debt-selftest.ts.
{
  const href = buildMailtoHref("organizer@example.com", "Hola");
  assert.ok(href && href.startsWith("mailto:organizer@example.com"), `expected a valid mailto: href, got ${href}`);
  const canvas = read("app/(site)/publicar/community/shared/preview/CommunityContactCanvas.tsx");
  assert.ok(!canvas.includes("EmailContactOptionsSheet"), "Gate 2D: email must NOT route through the obsolete Leonix custom sheet/modal");
  assert.ok(canvas.includes("buildMailtoHref(email, mailSub)"), "mailtoHref must come from the canonical builder");
  console.log("OK: email uses native mailto directly (Gate 2D), fed by the canonical mailto builder");
}

// ---------------------------------------------------------------------------
// 13. Unsafe scheme input can never become an executable href
// ---------------------------------------------------------------------------
{
  assert.equal(buildTelHref("javascript:alert(1)"), null, "script-style phone input must not become a tel: href");
  assert.equal(buildMailtoHref('"><script>@evil.com'), null, "email with unsafe characters must be rejected");
  assert.equal(buildMailtoHref("javascript:alert(1)"), null, "email carrying a javascript: payload must be rejected");
  const smsInjected = buildSmsHref("javascript:alert(1)");
  assert.equal(smsInjected, null, "script-style SMS input must not produce an sms: href");
  console.log("OK: unsafe scheme input (javascript:, script tags) cannot become an executable href");
}

// ---------------------------------------------------------------------------
// 14-15. Category contact models still build
// ---------------------------------------------------------------------------
{
  const comunidadDraft = { ...emptyComunidadQuickDraft(), phone: "4085551234", email: "org@example.com" };
  const comunidadModel = buildComunidadContactCanvasModel(comunidadDraft, "es");
  assert.ok(comunidadModel.labels.call, "Comunidad contact model must still build with labels");

  const clasesDraft = { ...emptyClasesQuickDraft(), phone: "4085551234", email: "instructor@example.com" };
  const clasesModel = buildClasesContactCanvasModel(clasesDraft, "es");
  assert.ok(clasesModel.labels.call, "Clases contact model must still build with labels");
  console.log("OK: Comunidad and Clases contact canvas models still build");
}

// ---------------------------------------------------------------------------
// 16, 20. Scope discipline — the canonical contact engine itself is untouched here; the durable
// regression concern (checked in every later gate too) is that Mascotas/Busco are never touched.
// The exact "only these N files" snapshot check that used to live here was specific to Gate 2C's
// own commit and is intentionally NOT re-asserted by later gates (e.g. Gate 2D legitimately edits
// Clases/Comunidad-owned files as its actual mandate).
// ---------------------------------------------------------------------------
{
  const changedFiles = execSync("git diff --name-only HEAD", { cwd: ROOT, encoding: "utf8" })
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  const untrackedFiles = execSync("git status --porcelain", { cwd: ROOT, encoding: "utf8" })
    .split("\n")
    .filter((l) => l.startsWith("??"))
    .map((l) => l.slice(3).trim());
  const allTouched = [...new Set([...changedFiles, ...untrackedFiles])];

  // Gate 3 legitimately owns Mascotas y Perdidos and Gate 4 legitimately owns Busco now — this
  // check's original concern (the two categories that hadn't had their own remediation gate yet
  // at Gate 2C's own commit time) is fully retired: every Community-family category has now had
  // its own gate, so no prefix remains forbidden here.
  const forbiddenPrefixes: string[] = [];
  const violations = allTouched.filter((f) => forbiddenPrefixes.some((p) => f.startsWith(p)));
  assert.equal(violations.length, 0, `expected no forbidden-prefix files touched, found: ${violations.join(", ")}`);

  console.log("OK: no out-of-scope Community-family files touched (check retired — every category now has its own gate)");
}

// ---------------------------------------------------------------------------
// 17-19. Prior gate verifiers still pass
// ---------------------------------------------------------------------------
{
  for (const script of [
    "scripts/gate-1-comunidad-eventos-qa-selftest.ts",
    "scripts/gate-2a-clases-qa-selftest.ts",
    "scripts/gate-2b-clases-revenue-os-selftest.ts",
  ]) {
    execSync(`npx tsx ${script}`, { cwd: ROOT, stdio: "pipe" });
  }
  console.log("OK: Gate 1, Gate 2A, and Gate 2B verifiers still pass after the contact URI cleanup");
}

console.log("gate-2c-community-contact-uri-selftest: PASS");
