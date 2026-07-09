#!/usr/bin/env node
/**
 * SERVICIOS-P0B — coupons/offers persistence, preview, publish payload, public output.
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

function read(rel) {
  return readFileSync(path.join(ROOT, rel), "utf8");
}

function fail(msg) {
  console.error(`verify-servicios-p0b-coupons-offers-persistence-preview-public-output: FAIL — ${msg}`);
  process.exit(1);
}

function ok(msg) {
  console.log(`OK: ${msg}`);
}

function gitDiffNameOnly() {
  try {
    return execFileSync("git", ["diff", "--name-only"], {
      cwd: ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
  } catch {
    return "";
  }
}

const typesRel = "app/(site)/clasificados/publicar/servicios/lib/clasificadosServiciosApplicationTypes.ts";
const normalizeRel = "app/(site)/clasificados/publicar/servicios/lib/clasificadosServiciosApplicationNormalize.ts";
const defaultRel = "app/(site)/clasificados/publicar/servicios/lib/defaultClasificadosServiciosState.ts";
const draftMediaRel = "app/(site)/clasificados/publicar/servicios/lib/clasificadosServiciosDraftMedia.ts";
const storageRel = "app/(site)/clasificados/publicar/servicios/lib/clasificadosServiciosStorage.ts";
const previewHandoffRel = "app/(site)/clasificados/publicar/servicios/lib/clasificadosServiciosPreviewHandoff.ts";
const mapperRel = "app/(site)/clasificados/publicar/servicios/lib/mapClasificadosServiciosApplicationToServiciosDraft.ts";
const publishPrepareRel = "app/(site)/clasificados/publicar/servicios/lib/serviciosDraftPublishPrepare.ts";
const publishPayloadRel = "app/(site)/clasificados/publicar/servicios/lib/buildServiciosPublishPayload.ts";
const publishRouteRel = "app/api/clasificados/servicios/publish/route.ts";
const draftUploadRel = "app/api/clasificados/servicios/draft-media-upload/route.ts";
const applicationRel = "app/(site)/clasificados/publicar/servicios/components/ClasificadosServiciosApplication.tsx";
const previewClientRel = "app/(site)/clasificados/publicar/servicios/preview/ClasificadosServiciosPreviewClient.tsx";
const previewShellRel = "app/(site)/clasificados/publicar/servicios/preview/ServiciosProfessionalPreviewShell.tsx";
const publicPageRel = "app/(site)/clasificados/servicios/[slug]/page.tsx";
const liveShellRel = "app/(site)/servicios/components/ServiciosProfessionalProfileShell.tsx";
const profileViewRel = "app/(site)/servicios/components/ServiciosProfileView.tsx";
const couponsCardRel = "app/(site)/servicios/components/ServiciosCouponsCard.tsx";
const presenceRel = "app/(site)/servicios/lib/serviciosProfilePresence.ts";
const docRel = "docs/servicios-p0b-coupons-offers-persistence-preview-public-output.md";
const pkg = read("package.json");

for (const rel of [
  typesRel,
  normalizeRel,
  defaultRel,
  draftMediaRel,
  storageRel,
  previewHandoffRel,
  mapperRel,
  publishPrepareRel,
  publishRouteRel,
  docRel,
]) {
  if (!existsSync(path.join(ROOT, rel))) fail(`Missing required file: ${rel}`);
}

const types = read(typesRel);
const normalize = read(normalizeRel);
const defaults = read(defaultRel);
const draftMedia = read(draftMediaRel);
const storage = read(storageRel);
const previewHandoff = read(previewHandoffRel);
const mapper = read(mapperRel);
const publishPrepare = read(publishPrepareRel);
const publishPayload = read(publishPayloadRel);
const publishRoute = read(publishRouteRel);
const draftUpload = read(draftUploadRel);
const application = read(applicationRel);
const previewClient = read(previewClientRel);
const previewShell = read(previewShellRel);
const publicPage = read(publicPageRel);
const liveShell = read(liveShellRel);
const profileView = read(profileViewRel);
const couponsCard = read(couponsCardRel);
const presence = read(presenceRel);
const doc = read(docRel);

for (const field of ["couponsAddOn", "couponsMonthlyPrice", "coupons", "couponFlyer", "couponMoreOffers"]) {
  if (!types.includes(field)) fail(`Types missing field: ${field}`);
  if (!defaults.includes(field)) fail(`Default state missing field: ${field}`);
}
ok("state/types include coupon add-on fields");

if (!normalize.includes("couponsAddOn")) fail("Normalize must handle couponsAddOn");
if (!normalize.includes("imageUrl")) fail("Normalize must preserve coupon imageUrl");
if (!normalize.includes("couponFlyer")) fail("Normalize must preserve couponFlyer");
if (!normalize.includes("couponMoreOffers")) fail("Normalize must preserve couponMoreOffers");
ok("normalize preserves coupon fields");

if (!draftMedia.includes("COUPON_IMG")) fail("Draft media must support COUPON_IMG refs");
if (!draftMedia.includes("COUPON_FLYER")) fail("Draft media must support COUPON_FLYER refs");
if (!draftMedia.includes("serviciosRefCouponImage")) fail("Coupon image ref helper required");
if (!draftMedia.includes("serviciosRefCouponFlyer")) fail("Coupon flyer ref helper required");
if (!draftMedia.includes('idbServiciosPutDataUrl(namespace, "couponImg"')) {
  fail("Offload must write coupon images to IDB");
}
if (!draftMedia.includes('idbServiciosPutDataUrl(namespace, "couponFlyer"')) {
  fail("Offload must write coupon flyer to IDB");
}
if (!draftMedia.includes('idbServiciosGetDataUrl(namespace, "couponImg"')) {
  fail("Rehydrate must read coupon images from IDB");
}
if (!draftMedia.includes('idbServiciosGetDataUrl(namespace, "couponFlyer"')) {
  fail("Rehydrate must read coupon flyer from IDB");
}
if (!draftMedia.includes("coupons")) fail("stripUnresolved must handle coupons");
if (!draftMedia.includes("couponFlyer")) fail("stripUnresolved must handle couponFlyer");
ok("IDB coupon image/flyer offload + rehydrate + strip");

if (!storage.includes("offloadServiciosHeavyMediaToIdb")) fail("Storage must offload heavy media");
if (!storage.includes("inlineServiciosHeavyMediaFromIdb")) fail("Storage must inline heavy media");
if (!storage.includes("state.coupons")) fail("Storage IDB ref scan must include coupons");
if (!previewHandoff.includes("rehydrateServiciosApplicationMedia")) fail("Preview handoff must rehydrate media");
if (!previewHandoff.includes("persistServiciosDraftForPreviewNavigation")) fail("Preview navigation persist required");
ok("storage/preview handoff uses IDB pipeline");

if (!application.includes("state.coupons")) fail("Application must autosave coupons");
if (!application.includes("state.couponFlyer")) fail("Application must autosave couponFlyer");
if (!application.includes("state.couponsAddOn")) fail("Application must autosave couponsAddOn");
if (!application.includes("state.couponMoreOffers")) fail("Application must autosave couponMoreOffers");
ok("application media-sensitive autosave for coupons");

if (!mapper.includes("draft.coupons = draftCoupons")) fail("Mapper must map coupons to draft");
if (!mapper.includes("applyClasificadosCouponsToServiciosWireProfile")) fail("Wire apply helper required");
if (!mapper.includes("mergeClasificadosCouponsOntoServiciosProfile")) fail("Profile merge helper required");
if (!mapper.includes("couponFlyer")) fail("Mapper must map couponFlyer");
if (!mapper.includes("couponMoreOffers")) fail("Mapper must map couponMoreOffers");
ok("mapper/preview coupon helpers");

if (!previewClient.includes("mergeClasificadosCouponsOntoServiciosProfile")) fail("Preview client must merge coupons");
if (!previewClient.includes("applyClasificadosCouponsToServiciosWireProfile")) fail("Preview client must apply wire coupons");
if (!previewShell.includes("ServiciosCouponsCard")) fail("Preview shell must render ServiciosCouponsCard");
if (!previewShell.includes("couponFlyer")) fail("Preview shell must pass couponFlyer");
ok("preview output uses merge/apply + ServiciosCouponsCard");

if (!publishPrepare.includes('slot: "couponImage"')) fail("Publish prepare must upload coupon images");
if (!publishPrepare.includes('slot: "couponFlyer"')) fail("Publish prepare must upload coupon flyer");
if (!draftUpload.includes("couponImage")) fail("Draft upload route must accept couponImage slot");
if (!draftUpload.includes("couponFlyer")) fail("Draft upload route must accept couponFlyer slot");
if (!publishPayload.includes("cleanRemoteMediaField(row.imageUrl)")) fail("Publish payload must clean coupon imageUrl");
if (!publishRoute.includes("detectServiciosHeavyTransport")) fail("Heavy transport guard required");
if (!publishRoute.includes("applyClasificadosCouponsToServiciosWireProfile")) fail("Publish route must apply coupons to wire");
if (!publishRoute.includes("profile_json")) fail("Publish route must persist profile_json");
ok("publish payload resolves coupon media + heavy guard preserved");

if (!publicPage.includes("ServiciosProfessionalProfileShell")) fail("Public page must use professional shell");
if (!publicPage.includes("ServiciosProfileView")) fail("Public page must use general shell path");
if (!liveShell.includes("ServiciosCouponsCard")) fail("Professional shell must render coupons");
if (!profileView.includes("ServiciosCouponsCard")) fail("General shell must render coupons");
if (!couponsCard.includes("coupon.imageUrl")) fail("Coupon card must render images");
if (!presence.includes("hasPaidCouponsSectionResolved")) fail("Presence helper required");
ok("public output renders coupons in both shells");

for (const section of [
  "Gate title",
  "Manual QA",
  "What was protected",
  "Both pipeline",
  "READY TO COMMIT",
]) {
  if (!doc.includes(section)) fail(`Doc missing section: ${section}`);
}
ok("documentation present");

const disallowed = [
  "app/api/revenue-os/checkout",
  "app/api/stripe",
  "supabase/migrations",
  "app/(site)/clasificados/publicar/restaurantes",
];
const changed = gitDiffNameOnly()
  .split("\n")
  .map((f) => f.trim())
  .filter(Boolean);
for (const file of changed) {
  const norm = file.replace(/\\/g, "/");
  for (const bad of disallowed) {
    if (norm.includes(bad)) fail(`Disallowed file changed: ${norm}`);
  }
}
ok("no disallowed runtime files changed");

if (!pkg.includes("verify:servicios-p0b-coupons-offers-persistence-preview-public-output")) {
  fail("package.json must include P0B verifier script");
}

console.log("verify-servicios-p0b-coupons-offers-persistence-preview-public-output: PASS");
