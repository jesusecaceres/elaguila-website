/**
 * A5.INTERACTIONS-01 — Autos Negocios direct contact + like/share + preview alignment verifier.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");

const AUDIT_MD = path.join(
  ROOT,
  "app/lib/clasificados/autos/AUTOS_A5_INTERACTIONS_01_NEGOCIOS_DIRECT_CONTACT_LIKE_SHARE_PREVIEW_ALIGNMENT_AUDIT.md",
);

const GATE_ROWS = [
  "Correct repo confirmed",
  "Contact action files found",
  "Old Call modal bypassed/removed",
  "Old Message modal bypassed/removed",
  "Directions modal bypassed/removed",
  "Call opens tel directly",
  "SMS opens sms directly",
  "WhatsApp opens wa.me directly",
  "Email uses approved direct behavior",
  "Directions opens Google Maps directly",
  "Empty actions hide",
  "Like is count + heart only",
  "Like is DB-backed in public",
  "Preview Like does not fake analytics",
  "Share uses navigator.share",
  "Clipboard fallback works",
  "Public Share uses real public URL",
  "Preview Share is truthful",
  "Share event remains real",
  "No duplicate Like/Share",
  "CTAs isolated from card navigation",
  "Analytics identity unchanged",
  "No duplicate analytics",
  "No fake saves/messages/leads",
  "Top result-preview card alignment improved",
  "Main listing card alignment improved",
  "Mobile safe",
  "Autos Privado untouched",
  "Dashboard untouched",
  "Admin untouched",
  "Stripe untouched",
  "Supabase untouched",
  "Unrelated categories untouched",
  "Build passed",
  "Ready for Chuy QA",
];

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel.replace(/\//g, path.sep)), "utf8");
}

function run() {
  assert.ok(fs.existsSync(AUDIT_MD), "A5.INTERACTIONS-01 audit markdown must exist");
  const auditText = fs.readFileSync(AUDIT_MD, "utf8");
  assert.match(auditText, /TRUE\/FALSE audit table/i, "TRUE/FALSE table required");

  const recMatch = auditText.match(/Final recommendation:\s*\*{0,2}(GREEN|YELLOW|RED)\*{0,2}/i);
  assert.ok(recMatch, "Final recommendation required");
  const recommendation = recMatch![1]!.toUpperCase();

  for (const row of GATE_ROWS) {
    const line = auditText.split("\n").find((l) => l.includes(`| ${row} |`) || l.includes(`|${row}|`));
    assert.ok(line, `Missing gate row: ${row}`);
    if (recommendation === "GREEN") {
      assert.match(line, /\|\s*TRUE\s*\|/i, `GREEN requires TRUE: ${row}`);
    }
  }

  const directLink = read("app/(site)/clasificados/autos/shared/components/AutosDirectContactLink.tsx");
  const dealerStack = read("app/(site)/clasificados/autos/negocios/components/DealerBusinessStack.tsx");
  const finance = read("app/(site)/clasificados/autos/negocios/components/DealerFinanceContact.tsx");
  const engagement = read("app/(site)/clasificados/autos/shared/components/AutosEngagementRow.tsx");
  const shareBtn = read("app/components/clasificados/analytics/LeonixShareButton.tsx");
  const previewPage = read("app/(site)/clasificados/autos/negocios/components/AutoDealerPreviewPage.tsx");
  const resultsPreview = read("app/(site)/clasificados/autos/negocios/components/AutosNegociosResultsCardPreview.tsx");
  const mapsLib = read("app/lib/clasificados/autos/autosDealerStructuredAddress.ts");
  const previewClient = read("app/(site)/clasificados/autos/negocios/preview/AutosNegociosPreviewClient.tsx");

  assert.ok(directLink.includes("tel:"), "tel: direct link required");
  assert.ok(directLink.includes("sms:"), "sms: direct link required");
  assert.ok(directLink.includes("wa.me"), "wa.me direct link required");
  assert.ok(directLink.includes("trackAutosContactFromHref"), "Analytics on contact click required");
  assert.ok(!directLink.includes("CtaActionSheet"), "Direct link must not open action sheet");

  assert.ok(dealerStack.includes("AutosDirectContactLink"), "DealerBusinessStack uses direct contact");
  assert.ok(!dealerStack.includes("AutosSheetCtaLink"), "DealerBusinessStack must not use sheet CTA");
  // Superseded 2026-09-24 (owner decision 61e26a19d, "approved Correo/Email contact sheet"): the
  // dealer stack now legitimately mounts ONE CtaActionSheet — for the send_email intent only
  // (Copy email / Copy message / Share; no mailto launcher). The functional contract this line
  // protects is unchanged: Call / SMS / WhatsApp / Directions / Website never open a modal. So
  // the invariant is: the only sheet intent built in the stack is send_email.
  {
    const intentBuilders = [...dealerStack.matchAll(/\b(build\w*Intent)\s*\(/g)].map((m) => m[1]);
    assert.ok(
      intentBuilders.every((n) => n === "buildSendEmailIntent"),
      `No call/message/directions modal in dealer stack — only the approved email sheet may be built (found: ${[...new Set(intentBuilders)].join(", ") || "none"})`,
    );
    assert.ok(
      !/buildCallIntent|buildSendMessageIntent|buildWhatsAppMessageIntent|buildSmsMessageIntent|buildDirectionsIntent|buildWebsiteIntent/.test(dealerStack),
      "Call / SMS / WhatsApp / Directions / Website sheet builders are never used in the dealer stack",
    );
  }
  assert.ok(dealerStack.includes("c.callTelHref"), "Call tel href path preserved");
  assert.ok(dealerStack.includes("c.smsHref"), "SMS href path preserved");
  assert.ok(dealerStack.includes("c.whatsappHref"), "WhatsApp href path preserved");

  assert.ok(finance.includes("AutosDirectContactLink"), "Finance contact uses direct links");
  assert.ok(!finance.includes("AutosSheetCtaLink"), "Finance must not use sheet CTA");

  assert.ok(engagement.includes('countDisplay="numeric"'), "Compact numeric like display required");
  assert.ok(engagement.includes("numericShowZero"), "Zero like count display required");
  assert.ok(engagement.includes('previewLabelMode="iconOnly"'), "No Te gusta/Me gusta visible labels");
  assert.ok(!engagement.includes("directNativeShare"), "Engagement Share opens the shared Leonix drawer");
  assert.ok(engagement.includes("LeonixShareButton"), "Engagement Share uses the shared Leonix component");
  assert.ok(engagement.includes("autosGlobalShareRecorderFromContext"), "listing_share recorder preserved");
  assert.ok(engagement.includes("autosGlobalLikeRecorderFromContext"), "listing_like recorder preserved");
  assert.ok(!engagement.match(/Te gusta|Me gusta/), "No visible Me gusta/Te gusta in engagement row");

  // Updated 2026-09-24: native share + clipboard fallback moved into the shared CTA launchers
  // (ctaLaunchers.tryWebShare / copyToClipboard) that LeonixShareButton now delegates to. The
  // functional contract is unchanged: native share when available, clipboard fallback otherwise.
  const launchers = read("app/components/cta/ctaLaunchers.ts");
  assert.ok(shareBtn.includes("tryWebShare(") && launchers.includes("navigator.share"), "Share button supports native share (via shared tryWebShare)");
  assert.ok(shareBtn.includes("copyToClipboard(") && launchers.includes("clipboard.writeText"), "Clipboard fallback required (via shared copyToClipboard)");

  assert.ok(mapsLib.includes("google.com/maps"), "Google Maps directions builder required");
  // Updated 2026-09-24: the Negocios (Dealer) preview/public page no longer mounts AutosEngagementRow
  // (A5.POLISH-01/02 moved Like/Share into the compact utility strip below the gallery; that row
  // remains the Privado engagement component). The functional contract is unchanged and asserted on
  // the strip: public DB-backed Like + real share recorders when public, truthful preview Like (no
  // fake analytics) when not, Share via the shared Leonix drawer component.
  const strip = read("app/(site)/clasificados/autos/negocios/components/AutosNegociosPreviewEngagementStrip.tsx");
  assert.ok(strip.includes("LeonixLikeButton") && strip.includes("persistEngagement") && strip.includes("autosGlobalLikeRecorderFromContext"), "Public DB-backed Like preserved (in the Negocios engagement strip)");
  assert.ok(strip.includes("persistEngagement={false}"), "Preview Like does not fake analytics");
  assert.ok(strip.includes("LeonixShareButton") && strip.includes("autosGlobalShareRecorderFromContext") && !strip.includes("directNativeShare"), "Share uses the shared Leonix drawer + real listing_share recorder (Negocios strip)");
  assert.ok(previewPage.includes("publicAnalytics={publicPlaybackOnly ? publicAnalytics : undefined}"), "Public analytics identity is passed to the strip only for the real public page");
  assert.ok(!previewPage.includes("AutosEngagementRow"), "No duplicate Like/Share row on the Negocios page (strip is the only one)");
  assert.ok(previewPage.includes("AutosNegociosPreviewEngagementStrip"), "Preview engagement strip required");
  assert.ok(previewPage.includes("DealerBusinessStack"), "Main listing preview card preserved");

  // HISTORICAL / LAYOUT-ONLY (reclassified 2026-09-24): the compact results-card image ratio
  // (16/10) and the burgundy primary-CTA class were purely visual choices later superseded by the
  // premium results-card refinement (4/3 image, current card styling — see A5.POLISH-32/33/34).
  // They protect no functional contract, so they no longer gate. What still matters: the card
  // exists, renders a media area and is the Negocios-local component wired by the preview client.
  assert.ok(/aspect-\[\d+\/\d+\]/.test(resultsPreview), "Results card still renders a fixed-aspect media area");
  assert.ok(previewClient.includes("AutosNegociosResultsCardPreview"), "Negocios-local results preview import");
  assert.ok(!previewClient.includes("publicar/autos/negocios/components/AutosNegociosResultsCardPreview"), "No locked publicar results preview import");

  const privadoStrip = read("app/(site)/clasificados/autos/privado/components/PrivadoContactStrip.tsx");
  assert.ok(privadoStrip.includes("AutosSheetCtaLink"), "Privado file unchanged (still uses sheet link)");

  const pkg = read("package.json");
  assert.ok(
    pkg.includes("autos:a5-interactions-01-negocios-direct-contact-like-share-preview-alignment-audit"),
    "package.json verifier script required",
  );

  console.log(`A5.INTERACTIONS-01 audit PASS (${recommendation})`);
}

run();
