/**
 * Gate 4 — Busco / Se Busca final QA remediation self-test.
 *
 * Covers the 51-point owner-QA contract via a mix of direct-import behavioral tests and source
 * inspection. No network, no React, no Supabase. Run from repo root:
 *   npx tsx scripts/gate-4-busco-se-busca-qa-selftest.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { join } from "node:path";

import { BUSCO_TYPE_OPTIONS, BUSCO_URGENCY_OPTIONS, BUSCO_BUDGET_MODE_OPTIONS } from "../app/(site)/publicar/busco/shared/buscoTaxonomy";
import { emptyBuscoQuickDraft, normalizeBuscoQuickDraft } from "../app/(site)/publicar/busco/shared/buscoQuickDraft";
import { gateBuscoQuickPreview } from "../app/(site)/publicar/busco/shared/buscoRequiredForPreview";
import { resolveBuscoBudgetDisplay } from "../app/(site)/publicar/busco/shared/buscoBudgetDisplay";
import { buscoViewModelFromDraft, buscoViewModelFromPublished } from "../app/(site)/publicar/busco/shared/buscoQuickAdViewModel";
import type { BuscoPublishedListingLike } from "../app/(site)/clasificados/busco/BuscoQuickPublishedAd";

const ROOT = join(__dirname, "..");
function read(relPath: string): string {
  return readFileSync(join(ROOT, relPath), "utf8");
}

// ---------------------------------------------------------------------------
// 1. Compact Busco checkpoint enabled
// ---------------------------------------------------------------------------
{
  const client = read("app/(site)/clasificados/publicar/_components/QuickLaneCheckpointClient.tsx");
  assert.ok(/compact\s*=\s*\n?\s*category === "comunidad"[\s\S]*category === "busco"/.test(client), "busco must be in the compact checkpoint category list");
  console.log("OK: 1 compact Busco checkpoint enabled");
}

// ---------------------------------------------------------------------------
// 2-3. Busco Trabajo exists; no dating/personals type
// ---------------------------------------------------------------------------
{
  const values = BUSCO_TYPE_OPTIONS.map((o) => o.value);
  assert.ok(values.includes("trabajo"), "Busco Trabajo / trabajo extra must exist as a request type");
  const forbidden = ["citas", "pareja", "parejas", "dating", "personals", "romance"];
  for (const f of forbidden) {
    assert.ok(!values.includes(f as never), `no dating/personals type (${f}) may exist`);
  }
  const shellCopy = read("app/(site)/clasificados/busco/shared/buscoShellCopy.ts");
  assert.ok(shellCopy.includes("notDatingNote") || shellCopy.toLowerCase().includes("no es una sección de citas") || shellCopy.toLowerCase().includes("not for dating"), "shell copy must state this is not a dating section");
  console.log("OK: 2-3 Busco Trabajo exists; no dating/personals type");
}

// ---------------------------------------------------------------------------
// 4-5. Request-type conditional fields exist; Busco Trabajo lightweight fields
// ---------------------------------------------------------------------------
{
  const form = read("app/(site)/publicar/busco/quick/BuscoQuickFormClient.tsx");
  for (const flag of ["isArticulo", "isTrabajo", "isServicio", "isTransporte", "isVoluntarios", "isAyudaRecursoGrupo"]) {
    assert.ok(form.includes(flag), `form must branch on ${flag} for conditional fields`);
  }
  const draft = emptyBuscoQuickDraft();
  for (const key of ["workType", "workSkills", "workAvailability"] as const) {
    assert.ok(key in draft, `Busco Trabajo field ${key} must exist on the draft`);
  }
  console.log("OK: 4-5 request-type conditional fields exist; Busco Trabajo has lightweight work fields");
}

// ---------------------------------------------------------------------------
// 6-11. Structured budget model: 5 modes, $ formatting, Gratis/Intercambio/Convenir/No aplica
// ---------------------------------------------------------------------------
{
  assert.equal(BUSCO_BUDGET_MODE_OPTIONS.length, 5, "budget model must have exactly 5 modes");
  const modeValues = BUSCO_BUDGET_MODE_OPTIONS.map((o) => o.value);
  for (const m of ["tiene", "gratis", "intercambio", "convenir", "no_aplica"]) {
    assert.ok(modeValues.includes(m as never), `budget mode ${m} must exist`);
  }
  assert.equal(resolveBuscoBudgetDisplay({ budgetMode: "tiene", budgetAmount: "50" }, "es"), "$50", "amount must format with $, no typed $ required");
  assert.equal(resolveBuscoBudgetDisplay({ budgetMode: "gratis" }, "es"), "Gratis / busco ayuda gratuita");
  assert.equal(resolveBuscoBudgetDisplay({ budgetMode: "intercambio" }, "es"), "Intercambio");
  assert.equal(resolveBuscoBudgetDisplay({ budgetMode: "convenir" }, "es"), "A convenir / negociable");
  assert.equal(resolveBuscoBudgetDisplay({ budgetMode: "no_aplica" }, "es"), null, "no_aplica with no legacy text must hide budget entirely");
  console.log("OK: 6-11 structured budget model (5 modes), $ formatting, Gratis/Intercambio/Convenir/No aplica");
}

// ---------------------------------------------------------------------------
// 12. Budget is not a Leonix payment — Busco stays free, no Stripe/Revenue OS touch
// ---------------------------------------------------------------------------
{
  const publish = read("app/(site)/publicar/busco/shared/publishBuscoQuickToListings.ts");
  assert.ok(/price:\s*0/.test(publish), "insert payload must keep price: 0");
  assert.ok(/is_free:\s*true/.test(publish), "insert payload must keep is_free: true");
  assert.ok(!/stripe|revenuePricingMatrix|checkout/i.test(publish), "publish path must not touch Stripe/Revenue OS/checkout");
  console.log("OK: 12 budget is the requester's own spending power, not a Leonix payment — Busco stays free");
}

// ---------------------------------------------------------------------------
// 13. Urgency — all 4 approved states
// ---------------------------------------------------------------------------
{
  assert.equal(BUSCO_URGENCY_OPTIONS.length, 4, "urgency must have exactly 4 states");
  const values = BUSCO_URGENCY_OPTIONS.map((o) => o.value);
  for (const v of ["normal", "esta_semana", "lo_antes_posible", "urgente_hoy"]) {
    assert.ok(values.includes(v as never), `urgency state ${v} must exist`);
  }
  console.log("OK: 13 urgency has all 4 approved options");
}

// ---------------------------------------------------------------------------
// 14-15. No exact home-address requirement; global city/state/country/zip preserved
// ---------------------------------------------------------------------------
{
  const draft = emptyBuscoQuickDraft();
  assert.ok(!("addressLine1" in draft) && !("address" in draft), "no exact street-address field may exist");
  for (const key of ["city", "state", "country", "zip"] as const) {
    assert.ok(key in draft, `global location field ${key} must exist`);
  }
  const copy = read("app/(site)/publicar/busco/shared/buscoFormCopy.ts");
  assert.ok(copy.includes("dirección privada") || copy.toLowerCase().includes("private home address"), "must warn against posting a private home address");
  console.log("OK: 14-15 no exact home-address requirement; global city/state/country/zip preserved");
}

// ---------------------------------------------------------------------------
// 16, 42. Real Google Maps embed (iframe), reused by both preview and published detail
// ---------------------------------------------------------------------------
{
  const canvas = read("app/(site)/publicar/busco/components/BuscoQuickAdCanvas.tsx");
  assert.ok(canvas.includes("output=embed") && canvas.includes("<iframe"), "canvas must render a real Google Maps iframe embed, not just a link");
  const publishedAd = read("app/(site)/clasificados/busco/BuscoQuickPublishedAd.tsx");
  assert.ok(publishedAd.includes("BuscoQuickAdCanvas"), "published detail must reuse the same canvas (and therefore the same live map) as preview");
  console.log("OK: 16, 42 real Google Maps embed exists, shared by preview and published detail");
}

// ---------------------------------------------------------------------------
// 17. preferredContact selector removed
// ---------------------------------------------------------------------------
{
  const types = read("app/(site)/publicar/busco/shared/buscoQuickTypes.ts");
  const form = read("app/(site)/publicar/busco/quick/BuscoQuickFormClient.tsx");
  assert.ok(!/preferredContact/i.test(types), "BuscoQuickDraft must no longer carry a preferredContact field");
  assert.ok(!/preferredContact/i.test(form), "form must not render a preferred-contact selector");
  console.log("OK: 17 preferredContact selector removed — visitor sees whichever channel is populated");
}

// ---------------------------------------------------------------------------
// 18-21. Separate Call / SMS / WhatsApp / Email fields
// ---------------------------------------------------------------------------
{
  const draft = emptyBuscoQuickDraft();
  for (const key of ["phone", "smsPhone", "whatsapp", "email"] as const) {
    assert.ok(key in draft, `contact field ${key} must exist`);
  }
  console.log("OK: 18-21 separate Call/SMS/WhatsApp/Email fields exist");
}

// ---------------------------------------------------------------------------
// 22-23. Native mailto + canonical tel/sms/WhatsApp behavior, no obsolete sheet/modal
// ---------------------------------------------------------------------------
{
  const canvas = read("app/(site)/publicar/busco/components/BuscoQuickAdCanvas.tsx");
  assert.ok(canvas.includes('from "@/app/lib/digitalContact/humanConnection/nativeChannelHrefs"'), "canvas must import the canonical native href builders");
  for (const fn of ["buildTelHref", "buildSmsHref", "buildWhatsAppUrl", "buildMailtoHref"]) {
    assert.ok(canvas.includes(fn), `canvas must use ${fn}`);
  }
  assert.ok(!canvas.includes("EmailContactOptionsSheet"), "must not use the obsolete Leonix email chooser/modal");
  assert.ok(!/from ".*\/ContactActions"/.test(canvas), "must not route contact through the sheet-based ContactActions component");
  assert.ok(!/CtaActionSheet/.test(canvas), "must not use the generic intent/sheet picker for contact actions");
  console.log("OK: 22-23 native mailto + canonical tel/sms/WhatsApp behavior, no obsolete sheet/modal");
}

// ---------------------------------------------------------------------------
// 24. At least one contact required before Preview
// ---------------------------------------------------------------------------
{
  const base = normalizeBuscoQuickDraft({
    ...emptyBuscoQuickDraft(),
    buscoType: "articulo",
    title: "Taladro",
    description: "Busco un taladro inalámbrico prestado o en venta.",
    city: "San Jose",
    publishConfirmations: { infoTruthful: true, mediaAccurate: true, rulesAccepted: true },
  });
  const noContact = gateBuscoQuickPreview(base, "es");
  assert.equal(noContact.ok, false, "no contact method at all must block Preview");
  const withPhone = gateBuscoQuickPreview({ ...base, phone: "(408) 555-1212" }, "es");
  assert.equal(withPhone.ok, true, "one valid contact method (phone) must be sufficient");
  console.log("OK: 24 at least one direct contact method is required before Preview");
}

// ---------------------------------------------------------------------------
// 25-30. Facebook/Instagram/TikTok/YouTube + one custom link; blank socials hidden
// ---------------------------------------------------------------------------
{
  const draft = emptyBuscoQuickDraft();
  for (const key of ["facebook", "instagram", "tiktok", "youtube", "otherContactLabel", "otherContactUrl"] as const) {
    assert.ok(key in draft, `social field ${key} must exist`);
  }
  const vm = buscoViewModelFromDraft(draft, "es");
  assert.equal(vm.facebookHref, null);
  assert.equal(vm.instagramHref, null);
  assert.equal(vm.tiktokHref, null);
  assert.equal(vm.youtubeHref, null);
  assert.equal(vm.otherLinkHref, null);
  const canvas = read("app/(site)/publicar/busco/components/BuscoQuickAdCanvas.tsx");
  assert.ok(canvas.includes("FaYoutube"), "canvas must render a real YouTube icon");
  console.log("OK: 25-30 Facebook/Instagram/TikTok/YouTube + one custom link supported; blank socials hidden");
}

// ---------------------------------------------------------------------------
// 31-32. Only one reference image; moved earlier in the form
// ---------------------------------------------------------------------------
{
  const draft = emptyBuscoQuickDraft();
  assert.ok("imageDataUrl" in draft && "imageFileName" in draft, "single-image fields must exist");
  assert.ok(!("images" in draft) && !("imageGallery" in draft), "no multi-image gallery field may exist for Busco");
  const form = read("app/(site)/publicar/busco/quick/BuscoQuickFormClient.tsx");
  const mediaIdx = form.indexOf("sections.media");
  const locationIdx = form.indexOf("sections.location");
  const budgetIdx = form.indexOf("sections.budgetUrgency");
  assert.ok(mediaIdx > -1 && locationIdx > -1 && budgetIdx > -1, "media/location/budget sections must all render");
  assert.ok(mediaIdx < locationIdx && mediaIdx < budgetIdx, "the image section must render before location/budget (moved earlier per Section N)");
  console.log("OK: 31-32 only one reference image supported; image section moved earlier in the form");
}

// ---------------------------------------------------------------------------
// 33. Native Share wired (no custom provider picker)
// ---------------------------------------------------------------------------
{
  const canvas = read("app/(site)/publicar/busco/components/BuscoQuickAdCanvas.tsx");
  assert.ok(canvas.includes("tryWebShare") && canvas.includes("copyToClipboard"), "canvas must wire native share + clipboard fallback");
  console.log("OK: 33 native Share wired (navigator.share + clipboard fallback), no custom provider picker");
}

// ---------------------------------------------------------------------------
// 34-35. Three confirmations required; Preview blocked until confirmed
// ---------------------------------------------------------------------------
{
  const validNoConfirm = normalizeBuscoQuickDraft({
    ...emptyBuscoQuickDraft(),
    buscoType: "articulo",
    title: "Taladro",
    description: "Busco un taladro inalámbrico.",
    city: "San Jose",
    phone: "(408) 555-1212",
  });
  const blocked = gateBuscoQuickPreview(validNoConfirm, "es");
  assert.equal(blocked.ok, false, "Preview must stay blocked until all 3 confirmations are checked");
  const confirmed = gateBuscoQuickPreview(
    { ...validNoConfirm, publishConfirmations: { infoTruthful: true, mediaAccurate: true, rulesAccepted: true } },
    "es",
  );
  assert.equal(confirmed.ok, true, "Preview must be reachable once required fields + contact + all 3 confirmations pass");
  const form = read("app/(site)/publicar/busco/quick/BuscoQuickFormClient.tsx");
  assert.ok(form.includes('variant="busco"'), "form must render the busco confirmation section variant");
  console.log("OK: 34-35 three confirmations required; Preview blocked until required fields + contact + confirmations pass");
}

// ---------------------------------------------------------------------------
// 36. Second final verification exists before actual publish
// ---------------------------------------------------------------------------
{
  const bar = read("app/(site)/publicar/busco/quick/BuscoQuickPreviewPublishBar.tsx");
  assert.ok(bar.includes("EmpleosPublishConfirmModal"), "publish bar must use the shared second-verification modal");
  assert.ok(bar.includes("setConfirmOpen(true)"), "the visible Publish button must open the modal, not publish directly");
  assert.ok(bar.includes("onConfirm={() => void handleConfirmedPublish()}"), "the modal's own confirm action must be what actually publishes");
  console.log("OK: 36 second final verification (modal) required immediately before the actual publish call");
}

// ---------------------------------------------------------------------------
// 37. Raw form's only final CTA is Preview
// ---------------------------------------------------------------------------
{
  const form = read("app/(site)/publicar/busco/quick/BuscoQuickFormClient.tsx");
  const submitMatches = form.match(/type="submit"/g) ?? [];
  assert.equal(submitMatches.length, 1, "the raw form must have exactly one submit action");
  assert.ok(!/>\s*Guardar/i.test(form) && !/>\s*Publicar (solicitud|anuncio)/i.test(form), "raw form must not offer Guardar/Publicar buttons of its own");
  console.log("OK: 37 raw form's only final action is Vista previa — no Guardar/Publicar buttons");
}

// ---------------------------------------------------------------------------
// 38-40. Preview Publish/Edit compact; real result-card preview; real card component reused
// ---------------------------------------------------------------------------
{
  const previewClient = read("app/(site)/publicar/busco/quick/BuscoQuickPreviewClient.tsx");
  assert.ok(previewClient.includes('data-testid="busco-preview-result-card"'), "preview must render a real result-card-preview section");
  assert.ok(previewClient.includes("BuscoRequestCard"), "preview must render the REAL BuscoRequestCard component");
  assert.ok(previewClient.includes("buildBuscoRequestCardModelFromDraft"), "preview must build the result card from the actual draft, not fake markup");
  const bar = read("app/(site)/publicar/busco/quick/BuscoQuickPreviewPublishBar.tsx");
  assert.ok(!/w-screen|inset-x-0 bottom-0/.test(bar), "preview publish bar must stay compact, not a giant edge-to-edge bar");
  console.log("OK: 38-40 preview Publish/Edit actions compact; real result-card preview renders the real BuscoRequestCard");
}

// ---------------------------------------------------------------------------
// 41. Budget not rendered redundantly beyond the two intended placements
// ---------------------------------------------------------------------------
{
  const canvas = read("app/(site)/publicar/busco/components/BuscoQuickAdCanvas.tsx");
  const budgetDisplayMentions = (canvas.match(/vm\.budgetDisplay/g) ?? []).length;
  assert.ok(budgetDisplayMentions <= 2, `canvas must reference vm.budgetDisplay at most twice (guard + render), found ${budgetDisplayMentions}`);
  assert.ok(!canvas.includes("chips = [vm.typeLabel, vm.budgetDisplay"), "budget must not also be duplicated into the header chip row");
  console.log("OK: 41 budget renders in at most its two intended placements (canvas card + result card), not repeated");
}

// ---------------------------------------------------------------------------
// 43-44. Legacy free-text budget hydrates; old listings without new fields hydrate safely
// ---------------------------------------------------------------------------
{
  const legacyListing: BuscoPublishedListingLike = {
    id: "11111111-1111-1111-1111-111111111111",
    title: { es: "Busco silla de bebé", en: "Looking for a baby car seat" },
    city: "Stockton",
    blurb: { es: "Busco una silla de bebé usada.", en: "Looking for a used baby car seat." },
    images: null,
    contact_phone: "2095551234",
    contact_email: null,
    detailPairs: [
      { label: "Leonix:buscoLane", value: "quick" },
      { label: "Leonix:buscoType", value: "articulo" },
      { label: "Leonix:buscoBudget", value: "$50-100" },
    ],
  };
  const vm = buscoViewModelFromPublished(legacyListing, "es");
  assert.ok(vm.budgetDisplay, "legacy free-text budget must still resolve to a display string");
  assert.equal(vm.title, "Busco silla de bebé");
  assert.equal(vm.phoneDigits, "2095551234");

  const bareMinimum: BuscoPublishedListingLike = {
    id: "22222222-2222-2222-2222-222222222222",
    title: { es: "Busco ayuda", en: "Looking for help" },
    city: "Modesto",
    blurb: { es: "Necesito ayuda con mudanza.", en: "Need help moving." },
    images: null,
    contact_phone: null,
    contact_email: null,
    detailPairs: [{ label: "Leonix:buscoLane", value: "quick" }, { label: "Leonix:buscoType", value: "ayuda" }],
  };
  assert.doesNotThrow(() => buscoViewModelFromPublished(bareMinimum, "es"), "a legacy row missing every Gate 4 field must still hydrate without throwing");
  console.log("OK: 43-44 legacy free-text budget hydrates; old listings without new fields hydrate safely");
}

// ---------------------------------------------------------------------------
// 45-46. No Likes/fake analytics added
// ---------------------------------------------------------------------------
{
  const canvas = read("app/(site)/publicar/busco/components/BuscoQuickAdCanvas.tsx");
  const form = read("app/(site)/publicar/busco/quick/BuscoQuickFormClient.tsx");
  assert.ok(
    !/likeCount|onLike|like-button|data-testid="[^"]*like[^"]*"|useLikes|savesCount|onSave\b/i.test(canvas + form),
    "no Likes/Saves affordance may be added",
  );
  assert.ok(!/Math\.random\(\).*(view|like)/i.test(canvas), "no fabricated view/like counts may be added");
  console.log("OK: 45-46 no Likes or fake analytics added");
}

// ---------------------------------------------------------------------------
// 47-48. No DB migration; no Revenue OS touch
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

  const migrationTouched = allTouched.some((f) => /supabase\/migrations\//.test(f));
  assert.equal(migrationTouched, false, "no DB migration file may be touched");

  const revenueOsTouched = allTouched.some((f) => /revenuePricingMatrix|stripe|checkout\//i.test(f));
  assert.equal(revenueOsTouched, false, "no Revenue OS / Stripe / checkout file may be touched");

  // Gate 4 legitimately owns Busco now — Comunidad/Clases/Mascotas remain out of scope, plus the
  // narrow shared-primitive exceptions this gate is documented to touch.
  const forbiddenPrefixes = [
    "app/(site)/publicar/comunidad/",
    "app/(site)/clasificados/comunidad/",
    "app/(site)/publicar/clases/",
    "app/(site)/clasificados/clases/",
    "app/(site)/publicar/mascotas-y-perdidos/",
    "app/(site)/clasificados/mascotas-y-perdidos/",
  ];
  const allowedSharedFiles = new Set([
    "app/(site)/clasificados/publicar/_components/QuickLaneCheckpointClient.tsx",
    "app/(site)/clasificados/publicar/_lib/categoryPublishCheckpoints.ts",
    "app/(site)/publicar/community/shared/components/CommunityPublishConfirmationSection.tsx",
  ]);
  const violations = allTouched.filter(
    (f) => forbiddenPrefixes.some((p) => f.startsWith(p)) && !allowedSharedFiles.has(f),
  );
  assert.equal(violations.length, 0, `expected no Comunidad/Clases/Mascotas-owned files touched, found: ${violations.join(", ")}`);
  console.log("OK: 47-48 no DB migration added; no Revenue OS touched; no Comunidad/Clases/Mascotas-owned files touched");
}

// ---------------------------------------------------------------------------
// 49-51. Prior gate verifiers still pass
// ---------------------------------------------------------------------------
{
  for (const script of [
    "scripts/gate-1-comunidad-eventos-qa-selftest.ts",
    "scripts/gate-2a-clases-qa-selftest.ts",
    "scripts/gate-2b-clases-revenue-os-selftest.ts",
    "scripts/gate-2c-community-contact-uri-selftest.ts",
    "scripts/gate-2d-community-owner-qa-debt-selftest.ts",
    "scripts/gate-3-mascotas-perdidos-qa-selftest.ts",
  ]) {
    execSync(`npx tsx ${script}`, { cwd: ROOT, stdio: "pipe" });
  }
  console.log("OK: 49-51 Comunidad, all Clases, and Mascotas y Perdidos (Gate 3) verifiers still pass");
}

console.log("gate-4-busco-se-busca-qa-selftest: PASS");
