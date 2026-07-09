#!/usr/bin/env node
/**
 * SVC-CTA-1A — Copy-first, Outlook-safe Correo modal order in CtaActionSheet.
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
const gmailIdx = indexOfAction("gmail_open");
const openEmailIdx = indexOfAction("open_email");

assert(copyEmailIdx >= 0, "copy_email action present");
assert(copyFullIdx >= 0, "copy_full_email action present");
assert(shareContactIdx >= 0, "share_contact_email action present");
assert(nativeShareIdx >= 0, "email_native_share action present");
assert(openEmailIdx >= 0, "open_email action present");

assert(copyEmailIdx < nativeShareIdx, "copy_email appears before email_native_share");
assert(openEmailIdx > nativeShareIdx, "open_email appears after email_native_share");
assert(copyEmailIdx < copyFullIdx, "copy_email is first copy action");
assert(copyFullIdx < shareContactIdx, "copy_full_email before share_contact_email");
assert(shareContactIdx < nativeShareIdx, "share_contact_email before email_native_share");

if (gmailIdx >= 0) {
  assert(gmailIdx > nativeShareIdx, "gmail_open after email_native_share");
  assert(gmailIdx < openEmailIdx, "gmail_open before open_email");
}

assert(sheet.includes("emailCopyFirstHint"), "emailCopyFirstHint key exists");
assert(sheet.includes("openEmailAppHint"), "openEmailAppHint key exists");
assert(
  sheet.includes("Copia el correo o el mensaje y pégalo en la app que prefieras."),
  "Spanish emailCopyFirstHint",
);
assert(
  sheet.includes("Copy the email or message and paste it into the app you prefer."),
  "English emailCopyFirstHint",
);
assert(
  sheet.includes("Puede abrir Outlook u otra app de correo predeterminada."),
  "Spanish openEmailAppHint",
);
assert(
  sheet.includes("This may open Outlook or another default email app."),
  "English openEmailAppHint",
);

assert(emailBranch.includes("EMAIL_PRIMARY"), "copy_email uses EMAIL_PRIMARY");
assert(emailBranch.includes('"copy_email"'), "copy_email action id preserved");
const openEmailBlock = emailBranch.slice(openEmailIdx);
assert(openEmailBlock.includes("openMailto(em, sub, bod)"), "open_email still uses openMailto");

const lockedPaths = [
  "app/(site)/servicios/components/ServiciosPagosBeneficiosSection.tsx",
  "app/(site)/servicios/components/ServiciosBusinessHubContactCard.tsx",
  "app/(site)/clasificados/restaurantes/components/RestaurantePublishChipMarker.tsx",
  "app/(site)/clasificados/ofertas-locales/OfertasLocalesPublicSearchClient.tsx",
];
for (const rel of lockedPaths) {
  const content = read(rel);
  assert(!content.includes("emailCopyFirstHint"), `${rel}: untouched (no email modal copy)`);
}

assert(pkg.includes('"verify:servicios-cta-email-modal"'), "package.json: verifier registered");

console.log("OK: copy-first email modal order");
console.log("OK: Outlook-safe helper copy present");
console.log("OK: locked scope files untouched");
console.log("verify-servicios-cta-email-modal: PASS");
