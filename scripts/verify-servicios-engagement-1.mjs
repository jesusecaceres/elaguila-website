#!/usr/bin/env node
/**
 * SVC-ENGAGEMENT-1 — Servicios public Like/Share wiring + preview protection.
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

const slugPage = read("app/(site)/clasificados/servicios/[slug]/page.tsx");
const proShell = read("app/(site)/servicios/components/ServiciosProfessionalProfileShell.tsx");
const profileView = read("app/(site)/servicios/components/ServiciosProfileView.tsx");
const hubRow = read("app/(site)/servicios/components/ServiciosBusinessHubEngagementRow.tsx");
const likeCluster = read("app/(site)/servicios/components/ServiciosLikeEngagementCluster.tsx");
const likeBtn = read("app/components/clasificados/analytics/LeonixLikeButton.tsx");
const shareBtn = read("app/components/clasificados/analytics/LeonixShareButton.tsx");
const previewClient = read("app/(site)/servicios/perfil/preview/ServiciosPreviewClient.tsx");
const clasPreview = read("app/(site)/clasificados/publicar/servicios/preview/ClasificadosServiciosPreviewClient.tsx");
const pkg = read("package.json");

const shellProps = [
  "engagementListingId",
  "engagementOwnerUserId",
  "persistListingEngagement",
  "listingShareUrl",
  "publicLikeCount",
];

for (const prop of shellProps) {
  assert(proShell.includes(prop), `professional shell exposes ${prop}`);
  assert(profileView.includes(prop), `profile view exposes ${prop}`);
}

assert(slugPage.includes("serviciosEngagementListingKey"), "slug page: engagement key resolver");
assert(slugPage.includes("buildServiciosClasificadosListingShareUrl"), "slug page: canonical share URL");
assert(slugPage.includes("persistListingEngagement"), "slug page: persistence flag");
assert(slugPage.includes("isPublishedLive"), "slug page: live-only persistence guard");
assert(slugPage.includes("listingShareUrl"), "slug page: share URL required for persistence");

assert(hubRow.includes("ServiciosLikeEngagementCluster"), "hub row: like cluster");
assert(hubRow.includes("LeonixShareButton"), "hub row: share button");
assert(hubRow.includes("directNativeShare"), "hub row: direct native share");
assert(hubRow.includes("persistEngagement={persistEngagement}"), "hub row: like uses route persistence flag");
assert(hubRow.includes("showEngagementActions"), "hub row: published-only engagement gate");
assert(!hubRow.includes("showShare ?"), "hub row: no preview-only share branch");

assert(proShell.includes("directNativeShare"), "professional shell: hero native share");
assert(proShell.includes("persistEngagement={persistListingEngagement}"), "professional shell: route persistence on hero");

assert(shareBtn.includes("navigator.share"), "share button: native share path");
assert(shareBtn.includes("navigator.clipboard.writeText"), "share button: clipboard fallback");
assert(shareBtn.includes("labels.share"), "share button: Compartir/Share label preserved");

assert(likeBtn.includes("user_liked_listings"), "like button: durable liked table");
assert(likeBtn.includes(".upsert("), "like button: upsert on like");
assert(likeBtn.includes(".delete()"), "like button: delete on unlike");
assert(likeBtn.includes("FaHeart"), "like button: red filled heart");
assert(likeBtn.includes("setIsLiked(prev)"), "like button: rollback on failure");

assert(!previewClient.includes("persistListingEngagement"), "legacy preview: no persistence props");
assert(!clasPreview.includes("persistListingEngagement"), "clas preview: no persistence props");

const locked = [
  "app/(site)/servicios/components/ServiciosPagosBeneficiosSection.tsx",
  "app/components/cta/CtaActionSheet.tsx",
  "app/(site)/clasificados/restaurantes/components/RestaurantePublishChipMarker.tsx",
];
for (const rel of locked) {
  const content = read(rel);
  assert(!content.includes("showEngagementActions"), `${rel}: untouched`);
}

assert(pkg.includes('"verify:servicios-engagement-1"'), "package.json: verifier registered");

console.log("OK: published Servicios like/share wiring");
console.log("OK: preview engagement protected");
console.log("verify-servicios-engagement-1: PASS");
