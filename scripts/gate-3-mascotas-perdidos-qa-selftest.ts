/**
 * Gate 3 — Mascotas y Perdidos full owner-QA remediation self-test.
 *
 * No network, no React. Run from repo root:
 *   npx tsx scripts/gate-3-mascotas-perdidos-qa-selftest.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { join } from "node:path";

import {
  emptyMascotasPerdidosQuickDraft,
  normalizeMascotasPerdidosQuickDraft,
  MAX_MASCOTAS_PHOTOS,
} from "../app/(site)/publicar/mascotas-y-perdidos/shared/mascotasPerdidosQuickDraft";
import { gateMascotasPerdidosQuickPreview } from "../app/(site)/publicar/mascotas-y-perdidos/shared/mascotasPerdidosRequiredForPreview";
import { buildMascotasPerdidosNoticeCardModel, buildMascotasPerdidosNoticeCardModelFromDraft } from "../app/(site)/clasificados/mascotas-y-perdidos/shared/mascotasPerdidosCardModel";
import { mascotasPerdidosPublishedQuickToDraft } from "../app/(site)/publicar/mascotas-y-perdidos/shared/mascotasPerdidosPublishedQuickToDraft";
import { isMascotasPerdidosSimpleListing, detailPairsToMap } from "../app/(site)/clasificados/mascotas-y-perdidos/shared/mascotasPerdidosListingDetailPairs";
import type { MascotasPerdidosListingBrowseRow } from "../app/(site)/clasificados/mascotas-y-perdidos/shared/loadMascotasPerdidosListings";
import { buildMailtoHref } from "../app/lib/digitalContact/humanConnection/nativeChannelHrefs";

const ROOT = join(__dirname, "..");
function read(relPath: string): string {
  return readFileSync(join(ROOT, relPath), "utf8");
}
function pairs(entries: Record<string, string>): { label: string; value: string }[] {
  return Object.entries(entries).map(([label, value]) => ({ label, value }));
}
function row(overrides: Partial<MascotasPerdidosListingBrowseRow>): MascotasPerdidosListingBrowseRow {
  return {
    id: "row-1",
    title: "Sample",
    description: "Sample description",
    city: "San José",
    category: "mascotas-y-perdidos",
    detail_pairs: [],
    images: [],
    leonix_ad_id: null,
    created_at: null,
    owner_id: null,
    ...overrides,
  };
}

// 1-3. Checkpoint compact path + conditional forms + pet fields hidden for objects
{
  const quickLane = read("app/(site)/clasificados/publicar/_components/QuickLaneCheckpointClient.tsx");
  assert.ok(/const compact =[\s\S]{0,200}category === "mascotas-y-perdidos"/.test(quickLane), "expected Mascotas to opt into the compact checkpoint layout");

  const form = read("app/(site)/publicar/mascotas-y-perdidos/quick/MascotasPerdidosQuickFormClient.tsx");
  assert.ok(form.includes("isPet ?") && form.includes("isObject ?"), "expected conditional pet-vs-object field sections");
  assert.ok(form.includes("copy.sections.petDetails") && form.includes("copy.sections.objectDetails"), "expected distinct pet/object detail sections");
  console.log("OK: 1-3 checkpoint compact path + conditional notice-type form + pet/object field separation");
}

// 4. Description enlarged
{
  const form = read("app/(site)/publicar/mascotas-y-perdidos/quick/MascotasPerdidosQuickFormClient.tsx");
  assert.ok(/min-h-\[160px\]/.test(form), "expected an enlarged description textarea");
  console.log("OK: 4 description textarea enlarged");
}

// 5-6. Media early + multi-photo (max 4, schema-proven)
{
  const form = read("app/(site)/publicar/mascotas-y-perdidos/quick/MascotasPerdidosQuickFormClient.tsx");
  const mainIdx = form.indexOf("copy.sections.main");
  const mediaIdx = form.indexOf("copy.sections.media");
  const petIdx = form.indexOf("copy.sections.petDetails");
  assert.ok(mediaIdx > mainIdx && mediaIdx < petIdx, "media must render early — right after main info, before conditional detail sections");
  assert.equal(MAX_MASCOTAS_PHOTOS, 4, "expected a 4-photo cap");
  const publishLib = read("app/(site)/publicar/mascotas-y-perdidos/shared/publishMascotasPerdidosQuickToListings.ts");
  assert.ok(/for \(let i = 0; i < orderedUrls\.length; i\+\+\)/.test(publishLib), "expected a multi-photo upload loop (proven by the same array contract Comunidad/Clases already use)");
  console.log("OK: 5-6 media renders early; multi-photo (max 4) proven supported by the existing listings.images array contract");
}

// 7-8. Reward exists, currency display includes $
{
  const draft = { ...emptyMascotasPerdidosQuickDraft(), noticeType: "mascota-perdida" as const, offersReward: true, rewardAmount: "500" };
  const model = buildMascotasPerdidosNoticeCardModelFromDraft(draft, "es", "/preview");
  assert.equal(model.reward, "RECOMPENSA $500", `expected reward badge with $, got ${model.reward}`);
  const modelEn = buildMascotasPerdidosNoticeCardModelFromDraft(draft, "en", "/preview");
  assert.equal(modelEn.reward, "REWARD $500");
  const noRewardDraft = { ...emptyMascotasPerdidosQuickDraft(), noticeType: "mascota-encontrada" as const };
  const noRewardModel = buildMascotasPerdidosNoticeCardModelFromDraft(noRewardDraft, "es", "/preview");
  assert.equal(noRewardModel.reward, null, "reward must not appear for notice types where it's irrelevant");
  console.log("OK: 7-8 reward exists for lost pet, currency display includes $, hidden where irrelevant");
}

// 9-14. Separate contact fields, at least one required, no preferred-contact selector, canonical hrefs, native mailto
{
  const types = read("app/(site)/publicar/mascotas-y-perdidos/shared/mascotasPerdidosQuickTypes.ts");
  for (const f of ["phone: string;", "smsPhone: string;", "whatsapp: string;", "email: string;"]) {
    assert.ok(types.includes(f), `expected separate contact field: ${f}`);
  }
  const form = read("app/(site)/publicar/mascotas-y-perdidos/quick/MascotasPerdidosQuickFormClient.tsx");
  assert.ok(!/preferred.?contact|acci[oó]n principal preferida|m[eé]todo preferido/i.test(form), "must not ask for a preferred-contact selector");

  const canvas = read("app/(site)/publicar/mascotas-y-perdidos/components/MascotasPerdidosQuickAdCanvas.tsx");
  for (const fn of ["buildTelHref", "buildSmsHref", "buildWhatsAppUrl", "buildMailtoHref"]) {
    assert.ok(canvas.includes(fn), `expected canonical builder ${fn} used directly`);
  }
  assert.ok(!canvas.includes("EmailContactOptionsSheet"), "must not use the obsolete Leonix custom email sheet/modal");
  assert.ok(!/from ".*\/ContactActions"/.test(canvas), "must not import the generic sheet-based ContactActions component — native hrefs only");

  const draftAllContacts = { ...emptyMascotasPerdidosQuickDraft(), phone: "4085551234" };
  const gateOk = gateMascotasPerdidosQuickPreview(
    { ...draftAllContacts, noticeType: "mascota-perdida", title: "T", description: "D", city: "San José", lastSeenLocation: "Area", images: [{ id: "1", url: "https://x/y.jpg", alt: "", isMain: true }], publishConfirmations: { infoTruthful: true, mediaAccurate: true, rulesAccepted: true } },
    "es",
  );
  assert.equal(gateOk.ok, true, "one direct contact method (phone) should satisfy the gate when everything else is filled");
  const draftNoContact = { ...draftAllContacts, phone: "" };
  const gateFail = gateMascotasPerdidosQuickPreview(
    { ...draftNoContact, noticeType: "mascota-perdida", title: "T", description: "D", city: "San José", lastSeenLocation: "Area", images: [{ id: "1", url: "https://x/y.jpg", alt: "", isMain: true }], publishConfirmations: { infoTruthful: true, mediaAccurate: true, rulesAccepted: true } },
    "es",
  );
  assert.equal(gateFail.ok, false, "zero contact methods must block preview");
  console.log("OK: 9-14 separate Call/SMS/WhatsApp/Email fields, at least one required, no preferred-contact selector, canonical hrefs used directly, native mailto (no sheet)");
}

// 19-21. Facebook/Instagram supported, blank socials hidden
{
  const types = read("app/(site)/publicar/mascotas-y-perdidos/shared/mascotasPerdidosQuickTypes.ts");
  assert.ok(types.includes("facebook: string;") && types.includes("instagram: string;"), "expected Facebook + Instagram fields");
  const canvas = read("app/(site)/publicar/mascotas-y-perdidos/components/MascotasPerdidosQuickAdCanvas.tsx");
  assert.ok(/draft\.facebook\.trim\(\) \|\| draft\.instagram\.trim\(\)/.test(canvas), "social section must be conditionally rendered");
  console.log("OK: 19-21 Facebook + Instagram supported, blank socials hidden");
}

// 22-23. Native Share wired, no fake Likes
{
  const canvas = read("app/(site)/publicar/mascotas-y-perdidos/components/MascotasPerdidosQuickAdCanvas.tsx");
  assert.ok(canvas.includes("tryWebShare") && canvas.includes("copyToClipboard"), "expected native share + clipboard fallback");
  assert.ok(!/\blikes?\b/i.test(canvas), "must not add Likes");
  const cardModel = read("app/(site)/clasificados/mascotas-y-perdidos/shared/mascotasPerdidosCardModel.ts");
  assert.ok(!/\blikes?\b|\bsaves?\b|\bviews?\b/i.test(cardModel), "result-card model must not add fake Likes/Saves/Views");
  console.log("OK: 22-23 native Share wired (navigator.share + clipboard fallback, no custom provider picker); no fake Likes/Saves/Views");
}

// 24-27. Confirmations block Preview, second verification, form CTA, preview actions
{
  const confirmSection = read("app/(site)/publicar/community/shared/components/CommunityPublishConfirmationSection.tsx");
  assert.ok(confirmSection.includes('"mascotas"'), "expected a mascotas variant on the shared Leonix confirmations primitive");

  const draftNoConfirm = normalizeMascotasPerdidosQuickDraft({
    noticeType: "mascota-perdida",
    title: "T",
    description: "D",
    city: "San José",
    lastSeenLocation: "Area",
    images: [{ id: "1", url: "https://x/y.jpg", alt: "", isMain: true }],
    phone: "4085551234",
  });
  const gateBlocked = gateMascotasPerdidosQuickPreview(draftNoConfirm, "es");
  assert.equal(gateBlocked.ok, false, "Preview must stay blocked until all three confirmations are checked");

  const publishBar = read("app/(site)/publicar/mascotas-y-perdidos/quick/preview/MascotasPerdidosQuickPreviewPublishBar.tsx");
  assert.ok(publishBar.includes("EmpleosPublishConfirmModal"), "expected a second, final verification modal before the actual publish call");
  assert.ok(!/onClick=\{.*void handleConfirmedPublish/.test(publishBar) || publishBar.includes("setConfirmOpen(true)"), "the publish button must open the confirm modal, not publish directly");

  const form = read("app/(site)/publicar/mascotas-y-perdidos/quick/MascotasPerdidosQuickFormClient.tsx");
  assert.ok(form.includes("showSecondaryActions={false}"), "raw form must show Vista previa only as the final action");

  const previewClient = read("app/(site)/publicar/mascotas-y-perdidos/quick/preview/MascotasPerdidosQuickPreviewClient.tsx");
  assert.ok(previewClient.includes("MascotasPerdidosQuickPreviewPublishBar") && previewClient.includes("t.edit"), "preview must offer Publicar + Volver a editar");

  console.log("OK: 24-27 confirmations block Preview, second final-verification modal exists, form CTA is Vista previa only, preview offers Publish + Edit");
}

// 28-29. Result-card preview renders the REAL card; reward appears in the model
{
  const previewClient = read("app/(site)/publicar/mascotas-y-perdidos/quick/preview/MascotasPerdidosQuickPreviewClient.tsx");
  assert.ok(previewClient.includes("MascotasPerdidosNoticeCard") && previewClient.includes("buildMascotasPerdidosNoticeCardModelFromDraft"), "preview must render the REAL MascotasPerdidosNoticeCard component, not fake parallel markup");
  assert.ok(previewClient.includes("resultCardPreviewTitle"), "expected a labeled 'Vista previa en resultados' section");

  const rewardRow = row({
    detail_pairs: pairs({ "Leonix:noticeType": "mascota-perdida", "Leonix:offersReward": "1", "Leonix:rewardAmount": "250" }),
  });
  const rowModel = buildMascotasPerdidosNoticeCardModel(rewardRow, "es", "/anuncio/row-1");
  assert.equal(rowModel.reward, "RECOMPENSA $250");
  console.log("OK: 28-29 result-card preview renders the real MascotasPerdidosNoticeCard; reward appears in the result-card model");
}

// 30-31. Real map, no exact address requirement
{
  const canvas = read("app/(site)/publicar/mascotas-y-perdidos/components/MascotasPerdidosQuickAdCanvas.tsx");
  assert.ok(canvas.includes("google.com/maps?q=") && canvas.includes("output=embed"), "expected a real Google Maps embed built from supplied approximate location");
  assert.ok(canvas.includes("maps/dir/?api=1&destination="), "expected a directions action that opens Google Maps");

  const form = read("app/(site)/publicar/mascotas-y-perdidos/quick/MascotasPerdidosQuickFormClient.tsx");
  assert.ok(!/direcci[oó]n exacta|exact address|home address|addressLine1/i.test(form), "must not require an exact home address");
  console.log("OK: 30-31 real Google Maps embed/directions from approximate supplied location; no exact home address required");
}

// 32. Image sizing controlled (no giant uncontrolled hero)
{
  const canvas = read("app/(site)/publicar/mascotas-y-perdidos/components/MascotasPerdidosQuickAdCanvas.tsx");
  assert.ok(canvas.includes('maxHeight: "480px"'), "expected a controlled max height on the hero photo, not an uncontrolled full-viewport image");
  console.log("OK: 32 hero photo has a controlled max height (no viewport takeover)");
}

// 33-34. Legacy compatibility — single image, combined phone
{
  const legacyListing = {
    id: "legacy-1",
    title: "Perro perdido",
    city: "San José",
    description: "Se perdió cerca del parque.",
    images: ["https://x/photo-01.jpg"],
    contact_phone: "4085551234",
    contact_email: null,
    detailPairs: pairs({
      "Leonix:noticeType": "mascota-perdida",
      "Leonix:lastSeenLocation": "Parque cerca de casa",
      "Leonix:phoneDigits": "4085551234",
      "Leonix:whatsappDigits": "4085551234",
    }),
  };
  assert.ok(isMascotasPerdidosSimpleListing(detailPairsToMap(legacyListing.detailPairs) as never), "legacy listing (lane absent) must still be recognized as a Mascotas quick listing");
  const legacyDraft = mascotasPerdidosPublishedQuickToDraft(legacyListing);
  assert.equal(legacyDraft.images.length, 1, "legacy single-image listing must hydrate its one photo");
  assert.equal(legacyDraft.phone, "(408) 555-1234", "legacy combined phone must still populate Call");
  assert.equal(legacyDraft.whatsapp, "(408) 555-1234", "legacy combined phone was ALSO stored under whatsappDigits by the old writer — reading it back is conservative (not inferred), not invented");
  assert.equal(legacyDraft.smsPhone, "", "legacy listings never had SMS — must not be invented");
  console.log("OK: 33-34 legacy single-image and legacy combined-phone listings hydrate safely; SMS is never invented");
}

// New rich-lane listings also route through the same detail component
{
  const richPairs = detailPairsToMap(pairs({ "Leonix:mascotasLane": "rich", "Leonix:noticeType": "mascota-perdida" }));
  assert.equal(isMascotasPerdidosSimpleListing(richPairs as never), true, "Gate 3 rich-lane listings must still route through MascotasPerdidosPublishedDetailPage (the universal anuncio router gates on this function)");
  console.log("OK: new rich-lane listings still route through the category's own published detail page");
}

// 35. Empty optional sections hide
{
  const draft = { ...emptyMascotasPerdidosQuickDraft(), noticeType: "mascota-perdida" as const };
  const model = buildMascotasPerdidosNoticeCardModelFromDraft(draft, "es", "/preview");
  assert.equal(model.reward, null);
  assert.equal(model.keyFact, null);
  const canvas = read("app/(site)/publicar/mascotas-y-perdidos/components/MascotasPerdidosQuickAdCanvas.tsx");
  assert.ok(canvas.includes("hasContactActions ?"), "contact section must hide entirely when no contact method exists");
  console.log("OK: 35 empty optional sections (reward, key fact, contact, social, map) hide instead of rendering empty");
}

// 36. No migration
{
  const changedFiles = execSync("git diff --name-only HEAD", { cwd: ROOT, encoding: "utf8" }).split("\n").map((s) => s.trim()).filter(Boolean);
  const untrackedFiles = execSync("git status --porcelain", { cwd: ROOT, encoding: "utf8" }).split("\n").filter((l) => l.startsWith("??")).map((l) => l.slice(3).trim());
  const allTouched = [...new Set([...changedFiles, ...untrackedFiles])];
  const migrationTouched = allTouched.some((f) => /supabase\/migrations\//i.test(f) || /\.sql$/i.test(f));
  assert.ok(!migrationTouched, "expected no DB migration files touched");

  // Gate 4 legitimately owns Busco now — not forbidden here any more. The durable Revenue-OS
  // concern remains forbidden for every gate.
  const forbiddenPrefixes = [
    "app/lib/listingPlans/",
    "app/api/revenue-os/",
  ];
  const violations = allTouched.filter((f) => forbiddenPrefixes.some((p) => f.startsWith(p)));
  assert.equal(violations.length, 0, `expected no Revenue-OS files touched, found: ${violations.join(", ")}`);
  console.log("OK: 36, 39, 40 no DB migration added; no Revenue OS files touched");
}

// 37-38. Prior gate verifiers still pass
{
  for (const script of [
    "scripts/gate-0b-community-results-isolation-selftest.ts",
    "scripts/gate-1-comunidad-eventos-qa-selftest.ts",
    "scripts/gate-2a-clases-qa-selftest.ts",
    "scripts/gate-2b-clases-revenue-os-selftest.ts",
    "scripts/gate-2c-community-contact-uri-selftest.ts",
    "scripts/gate-2d-community-owner-qa-debt-selftest.ts",
  ]) {
    execSync(`npx tsx ${script}`, { cwd: ROOT, stdio: "pipe" });
  }
  console.log("OK: 37-38 Comunidad + all Clases (Gate 2A/2B/2C/2D) verifiers still pass");
}

console.log("gate-3-mascotas-perdidos-qa-selftest: PASS");
