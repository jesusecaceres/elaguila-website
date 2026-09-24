import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";

import { MASCOTAS_PERDIDOS_NOTICE_OPTIONS } from "../app/(site)/publicar/mascotas-y-perdidos/shared/mascotasPerdidosTaxonomy";

const formPath = "app/(site)/publicar/mascotas-y-perdidos/quick/MascotasPerdidosQuickFormClient.tsx";
const previewPath = "app/(site)/publicar/mascotas-y-perdidos/quick/preview/MascotasPerdidosQuickPreviewClient.tsx";
const publishPath = "app/(site)/publicar/mascotas-y-perdidos/quick/preview/MascotasPerdidosQuickPreviewPublishBar.tsx";
const gatePath = "app/(site)/publicar/mascotas-y-perdidos/shared/mascotasPerdidosRequiredForPreview.ts";

const form = readFileSync(formPath, "utf8");
const preview = readFileSync(previewPath, "utf8");
const publish = readFileSync(publishPath, "utf8");
const gate = readFileSync(gatePath, "utf8");

let n = 0;
function check(label: string, fn: () => void) {
  fn();
  n += 1;
  console.log(`OK: ${label}`);
}

check("exact five launch notice branches exist", () => {
  assert.deepEqual(
    MASCOTAS_PERDIDOS_NOTICE_OPTIONS.map((x) => x.value),
    ["mascota-perdida", "mascota-encontrada", "adopcion-mascota", "objeto-perdido", "objeto-encontrado"],
  );
});

check("pet and object sections are conditionally separated", () => {
  assert.match(form, /const isPet = isPetNoticeType\(state\.noticeType\)/);
  assert.match(form, /const isObject = state\.noticeType === "objeto-perdido" \|\| state\.noticeType === "objeto-encontrado"/);
  assert.match(form, /\{isPet \? \(/);
  assert.match(form, /\{isObject \? \(/);
});

check("lost pet branch has last-seen and safety fields", () => {
  assert.match(form, /const isLost = state\.noticeType === "mascota-perdida"/);
  assert.match(form, /value=\{state\.lastSeenDate\}/);
  assert.match(form, /value=\{state\.safetyNote\}/);
});

check("found pet branch has found/current-status/claim fields", () => {
  assert.match(form, /const isFound = state\.noticeType === "mascota-encontrada"/);
  assert.match(form, /value=\{state\.foundDate\}/);
  assert.match(form, /value=\{state\.currentStatus\}/);
  assert.match(form, /value=\{state\.claimInstructions\}/);
});

check("adoption branch has temperament and care state", () => {
  assert.match(form, /const isAdoption = state\.noticeType === "adopcion-mascota"/);
  assert.match(form, /value=\{state\.temperament\}/);
  assert.match(form, /triOptions\("vaccinated"\)/);
  assert.match(form, /triOptions\("spayedNeutered"\)/);
  assert.match(form, /value=\{state\.adoptionDetails\}/);
});

check("lost-item reward is allowed but found-item reward is not", () => {
  assert.match(form, /const rewardEligible = isLost \|\| state\.noticeType === "objeto-perdido"/);
  assert.match(gate, /d\.noticeType === "mascota-perdida" \|\| d\.noticeType === "objeto-perdido"/);
});

check("contact methods remain separate and Preview-gated", () => {
  assert.match(gate, /digitsOnly\(d\.phone\)/);
  assert.match(gate, /digitsOnly\(d\.smsPhone\)/);
  assert.match(gate, /digitsOnly\(d\.whatsapp\)/);
  assert.match(gate, /isProbablySafeEmail\(d\.email\)/);
});

check("WhatsApp reuses the golden international-safe formatter", () => {
  assert.match(form, /formatWhatsAppInputDisplay\(e\.target\.value\)/);
  assert.match(gate, /isValidWhatsAppNumber\(d\.whatsapp\)/);
});

check("Preview uses the same public result-card component", () => {
  assert.match(preview, /MascotasPerdidosNoticeCard/);
  assert.match(preview, /buildMascotasPerdidosNoticeCardModelFromDraft/);
});

check("Preview publish re-gates and writes one canonical listing", () => {
  assert.match(publish, /gateMascotasPerdidosQuickPreview/);
  assert.match(publish, /publishMascotasPerdidosQuickToListings/);
  assert.match(publish, /\/clasificados\/anuncio\/\$\{r\.listingId\}/);
});

check("double confirmation remains before publish", () => {
  assert.match(publish, /EmpleosPublishConfirmModal/);
  assert.match(publish, /onConfirm=\{\(\) => void handleConfirmedPublish\(\)\}/);
});

console.log(`verify-mascotas-application-branches-01: ${n}/${n} PASS`);
