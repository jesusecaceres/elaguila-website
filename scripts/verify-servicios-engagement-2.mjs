#!/usr/bin/env node
/**
 * SVC-ENGAGEMENT-2 — Servicios preview + results card Like/Share visual parity.
 * Visibility (`showEngagementControls`) is separate from persistence (`persistListingEngagement`).
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

const hubRow = read("app/(site)/servicios/components/ServiciosBusinessHubEngagementRow.tsx");
const contactCard = read("app/(site)/servicios/components/ServiciosBusinessHubContactCard.tsx");
const profileView = read("app/(site)/servicios/components/ServiciosProfileView.tsx");
const proShell = read("app/(site)/servicios/components/ServiciosProfessionalProfileShell.tsx");
const proPreview = read("app/(site)/clasificados/publicar/servicios/preview/ServiciosProfessionalPreviewShell.tsx");
const clasPreview = read("app/(site)/clasificados/publicar/servicios/preview/ClasificadosServiciosPreviewClient.tsx");
const legacyPreview = read("app/(site)/servicios/perfil/preview/ServiciosPreviewClient.tsx");
const horizontalCard = read("app/(site)/clasificados/servicios/components/ServiciosHorizontalResultCard.tsx");
const proCard = read("app/(site)/clasificados/servicios/ServiciosProfessionalResultCard.tsx");
const resultStrip = read("app/(site)/servicios/components/ServiciosResultCardEngagementStrip.tsx");
const slugPage = read("app/(site)/clasificados/servicios/[slug]/page.tsx");
const pkg = read("package.json");

assert(hubRow.includes("showEngagementControls"), "hub row: visibility prop");
assert(hubRow.includes("persistListingEngagement"), "hub row: persistence prop");
assert(hubRow.includes("showEngagementControls && Boolean(lxListingId)"), "hub row: visibility gate independent of persistence");
assert(!hubRow.includes("persistEngagement && Boolean(lxListingId)"), "hub row: visibility not tied to persistence");

assert(contactCard.includes("showEngagementControls"), "contact card: forwards visibility prop");
assert(profileView.includes("showEngagementControls"), "profile view: exposes visibility prop");
assert(proShell.includes("showEngagementControls"), "professional shell: exposes visibility prop");
assert(proShell.includes("showEngagementControls ?"), "professional shell: hero engagement uses visibility gate");

assert(proPreview.includes("showEngagementControls"), "professional preview: hub visibility enabled");
assert(proPreview.includes("persistListingEngagement={false}"), "professional preview: persistence disabled");
assert(proPreview.includes("persistEngagement={false}"), "professional preview: hero controls non-persistent");

assert(clasPreview.includes("showEngagementControls"), "clas preview: trades full preview visibility");
assert(clasPreview.includes("persistListingEngagement={false}"), "clas preview: trades full preview non-persistent");
assert(!clasPreview.includes("persistListingEngagement={true}"), "clas preview: never enables persistence");

assert(legacyPreview.includes("showEngagementControls"), "legacy preview: visibility enabled");
assert(legacyPreview.includes("persistListingEngagement={false}"), "legacy preview: persistence disabled");

assert(resultStrip.includes("ServiciosLikeEngagementCluster"), "result strip: like cluster");
assert(resultStrip.includes("LeonixShareButton"), "result strip: share button");
assert(resultStrip.includes("showEngagementControls"), "result strip: visibility prop");
assert(resultStrip.includes("persistListingEngagement"), "result strip: persistence prop");

assert(horizontalCard.includes("ServiciosResultCardEngagementStrip"), "horizontal card: engagement strip");
assert(horizontalCard.includes("showEngagementControls"), "horizontal card: visibility wired");
assert(horizontalCard.includes("persistListingEngagement"), "horizontal card: persistence wired");

assert(proCard.includes("ServiciosResultCardEngagementStrip"), "professional card: engagement strip");
assert(proCard.includes("showEngagementControls"), "professional card: visibility wired");
assert(proCard.includes("persistListingEngagement"), "professional card: persistence wired");

assert(slugPage.includes("showEngagementControls: true"), "slug page: published visibility enabled");
assert(slugPage.includes("persistListingEngagement"), "slug page: published persistence flag retained");

assert(pkg.includes('"verify:servicios-engagement-2"'), "package.json: verifier registered");

console.log("OK: preview Like/Share visible without persistence");
console.log("OK: published results cards expose Like/Share with persistence when live");
console.log("verify-servicios-engagement-2: PASS");
