/**
 * Servicios Golden lifecycle closeout — Gate 7 (Email + Share global contract, 2026-09-18).
 *
 * Owner decision (this gate, via explicit clarification): KEEP the 2026-09-17 "Servicios Final
 * Contact Truth + Email No-Mailto Closeout" doctrine. For Servicios:
 *   - showOpenEmailApp stays false (the "Open email app"/"Open in Gmail" mailto launchers are
 *     intentionally ABSENT — treat their absence as intentional, never a missing feature);
 *   - Correo opens the rich contact action sheet, not a bare mailto link;
 *   - the sheet provides email address, subject, message, Copy email, Copy full message, Share
 *     contact info, and Share with other apps (shared Web Share API, with copy fallback).
 * mailto is therefore not part of the primary Servicios experience at all.
 *
 * Share (Compartir) uses the shared LeonixShareButton -> tryWebShare (navigator.share, clipboard
 * fallback with visible confirmation) — no Servicios-local duplicate share engine is live
 * (ServiciosHeroActions.tsx still contains one, but has zero importers and is already listed in
 * scripts/verify-servicios-gate2-discovery.ts's DEAD_MODULES; guarded below so a live import
 * would fail loudly).
 *
 * Run: node node_modules/tsx/dist/cli.mjs scripts/verify-servicios-golden-gate7-email-share-contract.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";

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
const ROOT = new URL("../", import.meta.url);
function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/[^\n]*/g, "$1");
}
const raw = (rel: string) => stripComments(readFileSync(new URL(rel, ROOT), "utf8").replace(/\r\n/g, "\n"));

const SHEET = "app/components/cta/CtaActionSheet.tsx";
const CTA_INTENTS = "app/(site)/servicios/lib/serviciosCtaIntents.ts";
const CONTACT_CARD = "app/(site)/servicios/components/ServiciosBusinessHubContactCard.tsx";
const CTA_LAUNCHERS = "app/components/cta/ctaLaunchers.ts";
const SHARE_BUTTON = "app/components/clasificados/analytics/LeonixShareButton.tsx";

check("Servicios email intents opt OUT of the mailto launcher at every call site (intentional, per 2026-09-17 doctrine)", () => {
  const intents = raw(CTA_INTENTS);
  const count = (intents.match(/showOpenEmailApp:\s*false/g) ?? []).length;
  assert.ok(count >= 2, `expected >=2 opt-outs in serviciosCtaIntents.ts, found ${count}`);
  const card = raw(CONTACT_CARD);
  assert.ok(/showOpenEmailApp:\s*false/.test(card), "the contact card's own email intent must opt out too");
});

check("Correo opens the rich CtaActionSheet via a send_email intent, never a bare mailto anchor", () => {
  const card = raw(CONTACT_CARD);
  assert.ok(card.includes("CtaActionSheet"));
  assert.ok(/buildSendEmailIntent|buildServiciosSendEmailIntentFromMailto/.test(card));
  assert.ok(!/href=\{`?mailto:/.test(card), "the contact card must not render a bare mailto: anchor as its email action");
});

check("the send_email sheet provides: email address, subject, message, Copy email, Copy full message, Share contact info, Share with other apps", () => {
  const src = raw(SHEET);
  const idx = src.indexOf('intent.kind === "send_email"');
  assert.ok(idx > 0);
  const end = src.indexOf('intent.kind === "send_message"', idx);
  const block = src.slice(idx, end);
  for (const marker of ["t.email", "t.subject", "t.body", '"copy_email"', '"copy_full_email"', '"share_contact_email"', '"email_native_share"']) {
    assert.ok(block.includes(marker), `send_email sheet must include ${marker}`);
  }
});

check("'Share with other apps' uses the shared tryWebShare and falls back to copying with visible confirmation", () => {
  const src = raw(SHEET);
  const idx = src.indexOf('"email_native_share"');
  assert.ok(idx > 0);
  const block = src.slice(idx, idx + 1000);
  assert.ok(block.includes("tryWebShare("));
  assert.ok(block.includes("copyToClipboard(draftShareText)"), "must fall back to copy when native share is unavailable");
  assert.ok(block.includes("flash("), "the fallback must show visible confirmation");
});

check("the mailto launcher is gated on showOpenEmailApp, so opting out removes BOTH 'Open in Gmail' and 'Open email app' (modal stays fully usable without a mail handler)", () => {
  const src = raw(SHEET);
  assert.ok(src.includes("const showOpenEmailApp = intent.showOpenEmailApp ?? true;"));
  assert.ok(src.includes("showOpenEmailApp && gmailHref"));
  const idx = src.indexOf("? btnRow(\n              t.openEmailApp,");
  assert.ok(idx > 0 || /showOpenEmailApp\s*\?\s*btnRow\(\s*t\.openEmailApp/.test(src));
});

check("REGRESSION GUARD: every OTHER category keeps mailto (default true) — the opt-out is Servicios/Autos-scoped, not global", () => {
  const src = raw(SHEET);
  assert.ok(src.includes("intent.showOpenEmailApp ?? true"));
  const builders = raw("app/components/cta/ctaIntentBuilders.ts");
  assert.ok(builders.includes("showOpenEmailApp: input.showOpenEmailApp ?? true,"));
});

check("Compartir/Share uses the shared native Web Share (navigator.share) with clipboard fallback", () => {
  const launchers = raw(CTA_LAUNCHERS);
  assert.ok(launchers.includes("typeof navigator.share"));
  assert.ok(launchers.includes("navigator.share(data)"));
  const btn = raw(SHARE_BUTTON);
  assert.ok(btn.includes("tryWebShare"));
  assert.ok(btn.includes("copyToClipboard"));
});

check("no LIVE Servicios module imports the dead local share engine (ServiciosHeroActions) — no category-local duplicate share engine in the rendering path", () => {
  const hits = execSync('git grep -l "ServiciosHeroActions" -- "*.ts" "*.tsx" || true', {
    cwd: new URL(".", ROOT).pathname.replace(/^\/([A-Za-z]):/, "$1:"),
    encoding: "utf8",
  })
    .split("\n")
    .filter(Boolean)
    .filter((f) => !f.endsWith("ServiciosHeroActions.tsx") && !f.startsWith("scripts/"));
  assert.equal(hits.length, 0, `unexpected live importer(s): ${hits.join(", ")}`);
});

check("result card, public profile hero, and contact sheet all route Share through the SAME shared LeonixShareButton/launcher", () => {
  const card = raw("app/(site)/servicios/components/ServiciosResultCardEngagementStrip.tsx");
  assert.ok(card.includes("LeonixShareButton"));
  const shell = raw("app/(site)/servicios/components/ServiciosProfessionalProfileShell.tsx");
  assert.ok(shell.includes("LeonixShareButton") || shell.includes("ServiciosEndOfContentShare"));
});

if (failures.length) {
  console.error(`\nverify-servicios-golden-gate7-email-share-contract: ${failures.length} failure(s):\n- ${failures.join("\n- ")}`);
  process.exit(1);
}
console.log("\nverify-servicios-golden-gate7-email-share-contract: PASS");
