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
{
  const href = buildMailtoHref("organizer@example.com", "Hola");
  assert.ok(href && href.startsWith("mailto:organizer@example.com"), `expected a valid mailto: href, got ${href}`);
  const canvas = read("app/(site)/publicar/community/shared/preview/CommunityContactCanvas.tsx");
  assert.ok(canvas.includes("EmailContactOptionsSheet"), "email must still route through the current approved EmailContactOptionsSheet, not a restored custom modal");
  assert.ok(canvas.includes("buildMailtoHref(email, mailSub)"), "mailtoHref passed to the sheet must come from the canonical builder");
  console.log("OK: email keeps the current approved EmailContactOptionsSheet, fed by the canonical mailto builder");
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
// 16, 20. Scope discipline — only the shared contact engine touched, no forbidden categories
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

  const allowedExact = new Set([
    "app/(site)/publicar/community/shared/lib/communityContactCtas.ts",
    "app/(site)/publicar/community/shared/preview/CommunityContactCanvas.tsx",
    "scripts/gate-2c-community-contact-uri-selftest.ts",
  ]);
  const unexpected = allTouched.filter((f) => !allowedExact.has(f));
  assert.equal(unexpected.length, 0, `expected only the shared contact engine + verifier touched, found extra: ${unexpected.join(", ")}`);

  const forbiddenPrefixes = [
    "app/(site)/publicar/mascotas-y-perdidos/",
    "app/(site)/clasificados/mascotas-y-perdidos/",
    "app/(site)/publicar/busco/",
    "app/(site)/clasificados/busco/",
    "app/(site)/publicar/comunidad/",
    "app/(site)/clasificados/comunidad/",
    "app/(site)/publicar/clases/",
    "app/(site)/clasificados/clases/",
  ];
  const violations = allTouched.filter((f) => forbiddenPrefixes.some((p) => f.startsWith(p)));
  assert.equal(violations.length, 0, `expected no category-owned composition files touched, found: ${violations.join(", ")}`);

  console.log("OK: only the shared contact engine changed — no category-owned visual/composition files, no Mascotas/Busco files touched");
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
