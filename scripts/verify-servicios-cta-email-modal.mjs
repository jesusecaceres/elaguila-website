#!/usr/bin/env node
/**
 * SVC-CTA-1A — Copy-first, no-mailto Correo modal for the APPROVED Servicios/Autos doctrine.
 *
 * Owner final decision (2026-09-17): the approved Servicios/Autos contact sheet no longer
 * exposes "Abrir app de correo"/"Open email app" — mailto's actual app-opening behavior
 * depends on an OS-registered handler Leonix cannot guarantee, so Copy/Share are the
 * reliable path. This is a per-intent `showOpenEmailApp` flag on `send_email`, NOT a deletion
 * of the shared `openMailto` infrastructure — every other category (Restaurantes, Rentas,
 * Bienes Raíces, Empleos, En Venta, Viajes, Comida Local, Recursos) that doesn't opt out keeps
 * its existing mailto-launcher behavior unchanged.
 */
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const sheet = read("app/components/cta/CtaActionSheet.tsx");
const types = read("app/components/cta/types.ts");
const builders = read("app/components/cta/ctaIntentBuilders.ts");
const servicios = read("app/(site)/servicios/components/ServiciosBusinessHubContactCard.tsx");
const pkg = read("package.json");

assert(sheet.includes('intent.kind === "send_email"'), "send_email branch exists");

const emailBranchStart = sheet.indexOf('} else if (intent.kind === "send_email")');
assert(emailBranchStart >= 0, "send_email branch anchor found");
const emailBranchEnd = sheet.indexOf('} else if (intent.kind === "send_message")', emailBranchStart);
assert(emailBranchEnd > emailBranchStart, "send_email branch boundary found");
const emailBranch = sheet.slice(emailBranchStart, emailBranchEnd);

function indexOfAction(id) {
  return emailBranch.indexOf(`"${id}"`);
}

const copyEmailIdx = indexOfAction("copy_email");
const copyFullIdx = indexOfAction("copy_full_email");
const shareContactIdx = indexOfAction("share_contact_email");
const nativeShareIdx = indexOfAction("email_native_share");
const openEmailIdx = indexOfAction("open_email");

assert(copyEmailIdx >= 0, "copy_email action present");
assert(copyFullIdx >= 0, "copy_full_email action present");
assert(shareContactIdx >= 0, "share_contact_email action present");
assert(nativeShareIdx >= 0, "email_native_share action present");

assert(copyEmailIdx < nativeShareIdx, "copy_email appears before email_native_share");
assert(copyEmailIdx < copyFullIdx, "copy_email is first copy action");
assert(copyFullIdx < shareContactIdx, "copy_full_email before share_contact_email");
assert(shareContactIdx < nativeShareIdx, "share_contact_email before email_native_share");

// --- Legacy infrastructure preserved (Gate 03: NOT a global deletion) -------------------------
assert(openEmailIdx >= 0, "open_email action id must still exist in the SHARED component — other categories still use it");
assert(sheet.includes("openMailto(em, sub, bod)"), "openMailto call must still exist for categories that keep the launcher");
assert(sheet.includes("t.openEmailApp") && sheet.includes("t.openEmailAppHint"), "the launcher's copy keys must still exist for legacy categories");
const launchers = read("app/components/cta/ctaLaunchers.ts");
assert(launchers.includes("export function openMailto"), "openMailto helper itself must still be exported — global mailto infra is not deleted");

// --- New: the launcher is now a per-intent, defaulted-true opt-out flag -----------------------
assert(types.includes("showOpenEmailApp?: boolean;"), "send_email intent must declare the showOpenEmailApp opt-out flag");
assert(builders.includes("showOpenEmailApp: input.showOpenEmailApp ?? true"), "builder must default showOpenEmailApp to true (legacy categories unaffected unless they opt out)");
assert(
  sheet.includes("const showOpenEmailApp = intent.showOpenEmailApp ?? true;"),
  "CtaActionSheet must read the flag with the same true default",
);
assert(
  /showOpenEmailApp\s*\?\s*btnRow\(\s*\n\s*t\.openEmailApp/.test(sheet) || sheet.includes("showOpenEmailApp\n          ? btnRow("),
  "the open_email button must be gated behind showOpenEmailApp",
);
assert(sheet.includes("{showOpenEmailApp && canCompose ? ("), "the openEmailAppHint paragraph must be gated behind showOpenEmailApp too");
assert(sheet.includes("{showOpenEmailApp && gmailHref ? ("), "the Gmail launcher must also be gated behind showOpenEmailApp — it's still an external mail-app launcher");

// --- Approved Servicios contact card opts out -------------------------------------------------
const openEmailFnStart = servicios.indexOf("const openEmail = () => {");
assert(openEmailFnStart >= 0, "Servicios openEmail handler found");
const openEmailFnBlock = servicios.slice(openEmailFnStart, servicios.indexOf("};", openEmailFnStart));
assert(openEmailFnBlock.includes("buildSendEmailIntent("), "Servicios must build its email intent via the shared builder");
assert(openEmailFnBlock.includes("showOpenEmailApp: false"), "Servicios' approved contact card must explicitly opt out of the mailto launcher");

// A second, real Servicios path reaches the same send_email-kind sheet: the primary CTA's
// quote destination can itself be a mailto address (buildServiciosSendEmailIntentFromMailto),
// used by both ServiciosBusinessHubContactCard and ServiciosActionPanel. It must opt out too —
// "removed the string from one component" is not proof it's gone from every real path.
const ctaIntents = read("app/(site)/servicios/lib/serviciosCtaIntents.ts");
const mailtoFnStart = ctaIntents.indexOf("export function buildServiciosSendEmailIntentFromMailto");
assert(mailtoFnStart >= 0, "buildServiciosSendEmailIntentFromMailto must exist");
const mailtoFnBlock = ctaIntents.slice(mailtoFnStart, ctaIntents.indexOf("\n}\n", mailtoFnStart));
assert(mailtoFnBlock.includes("showOpenEmailApp: false"), "the mailto-quote-destination email intent must also opt out of the mailto launcher");
assert(
  read("app/(site)/servicios/components/ServiciosActionPanel.tsx").includes("buildServiciosSendEmailIntentFromMailto"),
  "ServiciosActionPanel must route through the same (now-opted-out) builder — confirms this second path is real, not hypothetical",
);

// --- Approved Autos call sites opt out too (cross-checked here since they share this doctrine) -
const autosEmailFiles = [
  "app/(site)/clasificados/autos/negocios/components/DealerBusinessStack.tsx",
  "app/(site)/clasificados/autos/negocios/components/DealerFinanceContact.tsx",
  "app/(site)/clasificados/autos/negocios/preview/dealershipPreview/PreviewDealerBusinessStack.tsx",
  "app/(site)/clasificados/autos/shared/lib/autosCtaSheet.ts",
];
for (const rel of autosEmailFiles) {
  const src = read(rel);
  assert(src.includes("showOpenEmailApp: false"), `${rel}: approved Autos email intent must opt out of the mailto launcher`);
}

// --- Unrelated categories keep their default (mailto launcher) behavior, untouched -------------
const untouchedCategoryFiles = [
  "app/(site)/clasificados/bienes-raices/shared/brContactCtaSheet.tsx",
  "app/(site)/clasificados/restaurantes/shell/RestaurantContactHub.tsx",
  "app/(site)/clasificados/rentas/listing/components/RentasNegocioDesktopBusinessRail.tsx",
];
for (const rel of untouchedCategoryFiles) {
  const src = read(rel);
  assert(!src.includes("showOpenEmailApp: false"), `${rel}: unrelated category must NOT opt out — it keeps the mailto launcher unchanged`);
}

// --- Locked scope: files this change must not touch --------------------------------------------
const lockedPaths = [
  "app/(site)/servicios/components/ServiciosPagosBeneficiosSection.tsx",
  "app/(site)/clasificados/restaurantes/components/RestaurantePublishChipMarker.tsx",
  "app/(site)/clasificados/ofertas-locales/OfertasLocalesPublicSearchClient.tsx",
];
for (const rel of lockedPaths) {
  const content = read(rel);
  assert(!content.includes("emailCopyFirstHint"), `${rel}: untouched (no email modal copy)`);
}

assert(pkg.includes('"verify:servicios-cta-email-modal"'), "package.json: verifier registered");

console.log("OK: copy-first email modal order preserved");
console.log("OK: mailto launcher infrastructure preserved for legacy categories");
console.log("OK: approved Servicios + Autos contact sheets opt out of the mailto launcher");
console.log("OK: unrelated categories keep default (mailto-shown) behavior");
console.log("OK: locked scope files untouched");
console.log("verify-servicios-cta-email-modal: PASS");
