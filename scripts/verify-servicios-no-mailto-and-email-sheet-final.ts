/**
 * Servicios Final Contact Truth + Email No-Mailto Closeout (2026-09-17) — Gates 9, 10, 11.
 *
 * Owner final product decision: Servicios no longer exposes "Open email app"/"Abrir app de correo"
 * anywhere, and no visible Servicios email CTA may fall back to a bare mailto:. This is implemented
 * via an additive `showOpenEmailApp?: boolean` field (defaulting to `true`) on the shared
 * `CtaActionSheet`'s `send_email` and `get_quote` intent variants (app/components/cta/types.ts).
 *
 * NOTE ON PROVENANCE: `send_email.showOpenEmailApp` and its CtaActionSheet/serviciosCtaIntents/
 * ServiciosBusinessHubContactCard wiring, plus an Autos opt-out, were implemented independently by
 * a parallel session (commit 61e26a19, already on origin/main) addressing the same owner decision.
 * This pass reconciled with that work rather than duplicating it, and extended the SAME flag to the
 * one gap it left open — the `get_quote` sheet's own "Enviar por correo"/"Send via email" action
 * (reached from Servicios' services/gallery/highlights "Cotizar" CTAs) — plus the results-card and
 * hero contact-truth work (Gates 1-8) that commit did not touch at all.
 *
 * Run: node node_modules/tsx/dist/cli.mjs scripts/verify-servicios-no-mailto-and-email-sheet-final.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

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

const TYPES = "app/components/cta/types.ts";
const SHEET = "app/components/cta/CtaActionSheet.tsx";
const SVC_INTENTS = "app/(site)/servicios/lib/serviciosCtaIntents.ts";
const HUB_CARD = "app/(site)/servicios/components/ServiciosBusinessHubContactCard.tsx";
const SHARE_BTN = "app/components/clasificados/analytics/LeonixShareButton.tsx";

/* ── GATE 9: the flag exists on BOTH intent kinds and is additive/optional (defaults true = unchanged for other categories). ── */
check("showOpenEmailApp is an OPTIONAL field (default true) on both send_email and get_quote intent variants", () => {
  const types = raw(TYPES);
  const getQuoteIdx = types.indexOf('kind: "get_quote";');
  const getQuoteBlock = types.slice(getQuoteIdx, getQuoteIdx + 900);
  assert.ok(/showOpenEmailApp\?:\s*boolean/.test(getQuoteBlock), "get_quote variant missing showOpenEmailApp?: boolean");
  const sendEmailIdx = types.indexOf('kind: "send_email";');
  const sendEmailBlock = types.slice(sendEmailIdx, sendEmailIdx + 1200);
  assert.ok(/showOpenEmailApp\?:\s*boolean/.test(sendEmailBlock), "send_email variant missing showOpenEmailApp?: boolean");
});

/* ── GATE 9/10: CtaActionSheet actually hides the button + hint when the flag is false. ── */
check("send_email branch: 'Abrir app de correo'/'Open email app' button AND its hint AND the Gmail link are all gated on showOpenEmailApp", () => {
  const sheet = raw(SHEET);
  const branchStart = sheet.indexOf('intent.kind === "send_email"');
  const branchEnd = sheet.indexOf('intent.kind === "send_message"', branchStart);
  const branch = sheet.slice(branchStart, branchEnd);
  assert.ok(branch.includes("const showOpenEmailApp = intent.showOpenEmailApp ?? true;"), "showOpenEmailApp must default to true when unset (every non-opted-out category unaffected)");
  assert.ok(branch.includes("showOpenEmailApp && gmailHref ? ("), "Gmail link also gated (though Servicios never sets gmailComposeHref, this is the shared branch)");
  assert.ok(branch.includes("showOpenEmailApp && canCompose ? ("), "openEmailAppHint must be gated on showOpenEmailApp");
  assert.ok(
    branch.includes("showOpenEmailApp\n          ? btnRow(\n              t.openEmailApp,"),
    "open_email button's btnRow(...) call must be directly wrapped in a `showOpenEmailApp ? ... : null` ternary, not just internally disabled",
  );
  assert.ok(branch.includes('"open_email"'), "open_email action id still present in source for the unsuppressed (other-category) case");
});
check("get_quote branch: 'Enviar por correo'/'Send via email' button is fully hidden (not just disabled) when showOpenEmailApp is false", () => {
  const sheet = raw(SHEET);
  const branchStart = sheet.indexOf('intent.kind === "get_quote"');
  const branchEnd = sheet.indexOf('} else if (intent.kind === "website"', branchStart);
  const branch = sheet.slice(branchStart, branchEnd);
  assert.ok(branch.includes("intent.showOpenEmailApp ?? true"), "quote_email button must be conditionally rendered on (intent.showOpenEmailApp ?? true)");
  assert.ok(branch.includes('"quote_email"'));
});

/* ── GATE 9: every Servicios-owned email/quote intent builder sets the flag false. ── */
check("buildServiciosSendEmailIntentFromMailto (used by EVERY visible Servicios email CTA) sets showOpenEmailApp: false", () => {
  const src = raw(SVC_INTENTS);
  const fnStart = src.indexOf("export function buildServiciosSendEmailIntentFromMailto");
  const fnEnd = src.indexOf("\n}\n", fnStart);
  const body = src.slice(fnStart, fnEnd);
  assert.ok(body.includes("showOpenEmailApp: false"));
});
check("buildServiciosGetQuoteIntent (the shared quote sheet used by services/gallery/highlights) sets showOpenEmailApp: false", () => {
  const src = raw(SVC_INTENTS);
  const fnStart = src.indexOf("export function buildServiciosGetQuoteIntent");
  const fnEnd = src.indexOf("\n}\n", fnStart);
  const body = src.slice(fnStart, fnEnd);
  assert.ok(body.includes("showOpenEmailApp: false"));
});
check("Hub card's own email intent (the grid 'Correo' chip) is built with showOpenEmailApp: false", () => {
  const hub = raw(HUB_CARD);
  const idx = hub.indexOf("buildSendEmailIntent({");
  assert.ok(idx > 0, "grid email builder call not found");
  const block = hub.slice(idx, idx + 400);
  assert.ok(block.includes("showOpenEmailApp: false"), "Hub card's email intent must opt out at construction time");
});

/* ── Cross-category safety: no non-Servicios/non-Autos category sets showOpenEmailApp: false. ── */
function findFilesContaining(dir: string, needle: string, hits: string[]): void {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }
  for (const entry of entries) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      findFilesContaining(full, needle, hits);
    } else if (/\.(ts|tsx)$/.test(entry)) {
      const content = readFileSync(full, "utf8");
      if (content.includes(needle)) hits.push(full);
    }
  }
}
check("no non-Servicios, non-Autos category file opts out of showOpenEmailApp (owner doctrine is scoped to the two approved sheets)", () => {
  const root = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]):/, "$1:");
  const suspects = [
    "app/(site)/clasificados/restaurantes",
    "app/(site)/clasificados/bienes-raices",
    "app/(site)/clasificados/en-venta",
    "app/(site)/clasificados/comida-local",
    "app/(site)/clasificados/empleos",
    "app/(site)/clasificados/rentas",
    "app/(site)/clasificados/viajes",
  ];
  const hits: string[] = [];
  for (const dir of suspects) findFilesContaining(join(root, dir), "showOpenEmailApp", hits);
  assert.deepEqual(hits, [], `unexpected showOpenEmailApp usage found outside Servicios/Autos: ${hits.join(", ")}`);
});

/* ── GATE 11: the sheet's remaining email-native-share action uses the ONE shared tryWebShare helper. ── */
check("send_email branch's 'Compartir con otras apps'/'Share with other apps' action still uses the shared tryWebShare, with a copy fallback", () => {
  const sheet = raw(SHEET);
  const branchStart = sheet.indexOf('intent.kind === "send_email"');
  const branchEnd = sheet.indexOf('intent.kind === "send_message"', branchStart);
  const branch = sheet.slice(branchStart, branchEnd);
  assert.ok(branch.includes('"email_native_share"'));
  assert.ok(branch.includes("await tryWebShare({"));
  assert.ok(branch.includes("await copyToClipboard(draftShareText)"), "fallback copies the draft when native share is unavailable");
});
check("results-card native Share (LeonixShareButton) also uses the shared tryWebShare, not a duplicate implementation (Gate 14 of the prior pass, re-confirmed unaffected)", () => {
  const btn = raw(SHARE_BTN);
  assert.ok(btn.includes("await tryWebShare("));
  assert.ok(btn.includes("await copyToClipboard("));
});

/* ── GATE 10: exactly the specified 5 actions remain reachable for a Servicios send_email intent. ── */
check("send_email branch action inventory for a Servicios (showOpenEmailApp: false) intent: copy_email, copy_full_email, share_contact_email, email_native_share, and the header Cerrar/Close — no open_email, no gmail (Servicios never sets gmailComposeHref)", () => {
  const sheet = raw(SHEET);
  const branchStart = sheet.indexOf('intent.kind === "send_email"');
  const branchEnd = sheet.indexOf('intent.kind === "send_message"', branchStart);
  const branch = sheet.slice(branchStart, branchEnd);
  for (const actionId of ['"copy_email"', '"copy_full_email"', '"share_contact_email"', '"email_native_share"']) {
    assert.ok(branch.includes(actionId), `expected action id ${actionId} present`);
  }
  const svcIntents = raw(SVC_INTENTS);
  assert.ok(svcIntents.includes("gmailComposeHref: null"), "Servicios never populates gmailComposeHref, so the optional Gmail button never renders for Servicios");
});

if (failures.length) {
  console.error(`\nverify-servicios-no-mailto-and-email-sheet-final: ${failures.length} failure(s):\n- ${failures.join("\n- ")}`);
  process.exit(1);
}
console.log("\nverify-servicios-no-mailto-and-email-sheet-final: PASS (Gates 9, 10, 11)");
