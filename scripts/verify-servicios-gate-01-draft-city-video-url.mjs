#!/usr/bin/env node
/**
 * SERVICIOS-GATE-01 — draft persistence, open city, external video URL policy.
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

const app = read("app/(site)/clasificados/publicar/servicios/components/ClasificadosServiciosApplication.tsx");
const storage = read("app/(site)/clasificados/publicar/servicios/lib/clasificadosServiciosStorage.ts");
const handoff = read("app/(site)/clasificados/publicar/servicios/lib/clasificadosServiciosPreviewHandoff.ts");
const copy = read("app/(site)/clasificados/publicar/servicios/lib/clasificadosServiciosApplicationCopy.ts");
const types = read("app/(site)/clasificados/publicar/servicios/lib/clasificadosServiciosApplicationTypes.ts");
const preview = read("app/(site)/clasificados/publicar/servicios/preview/ClasificadosServiciosPreviewClient.tsx");
const pkg = read("package.json");

// Gate 1 — draft persistence
assert(app.includes("bootstrapServiciosApplicationStateSync"), "Application must bootstrap from session draft");
assert(app.includes("saveClasificadosServiciosApplicationResolved"), "Application must autosave resolved draft");
assert(app.includes('addEventListener("pagehide"'), "Application must flush on pagehide");
assert(app.includes('addEventListener("visibilitychange"'), "Application must flush on visibilitychange");
assert(handoff.includes("persistServiciosDraftForPreviewNavigation"), "Preview navigation must persist draft");
assert(app.includes("clearServiciosDraftStorageAndIdb"), "Delete flow must clear draft storage");
assert(!app.includes('addEventListener("beforeunload"'), "No native beforeunload warning in Servicios application");
assert(!app.includes("onbeforeunload"), "No onbeforeunload handler in Servicios application");

// Gate 2 — open city copy
assert(copy.includes("Los ejemplos son sugerencias, no límites."), "Spanish city help line 1");
assert(
  copy.includes("Puedes escribir cualquier ciudad donde atiendes"),
  "Spanish city help NorCal suggestion copy",
);
assert(copy.includes("Examples are suggestions, not limits."), "English city help line 1");
assert(copy.includes("NorCal appears as a suggestion"), "English city NorCal suggestion copy");
assert(!app.includes("norcalOnly") && !app.includes("NORCAL_CITIES"), "No NorCal-only city gate in application UI");

// Gate 3 — video links only, max 4
assert(types.includes("SERVICIOS_MAX_VIDEO_URLS = 4"), "Max video URLs must be 4");
assert(app.includes("SERVICIOS_MAX_VIDEO_URLS"), "Application must use SERVICIOS_MAX_VIDEO_URLS");
assert(!app.includes("addVideoFile"), "Direct video file upload path removed");
assert(!app.includes('accept="video/*"'), "No video file picker in application");
assert(copy.includes("hasta 4 enlaces de video"), "Spanish copy: 4 video links");
assert(copy.includes("up to 4 video links"), "English copy: 4 video links");
assert(!copy.includes("archivo o enlace"), "Old file-or-link copy removed (ES)");
assert(!copy.includes("upload or URL"), "Old upload-or-URL copy removed (EN)");

// Gate 4 — confirmation cards, no native player for external URLs
assert(app.includes("shortenServiciosVideoUrlDisplay"), "Video URL confirmation uses safe truncate helper");
assert(!app.includes("<video"), "No native video element in application video list");
assert(app.includes("videoLinkBadge"), "Link badge copy wired");
assert(app.includes("videoDuplicateUrl"), "Duplicate URL guard wired");

// Gate 5 — preview handoff preserves up to 4 videos
assert(handoff.includes("buildServiciosPreviewGalleryVideos"), "Preview handoff builds up to 4 gallery videos");
assert(preview.includes("buildServiciosPreviewGalleryVideos"), "Preview client uses 4-video handoff builder");
assert(storage.includes("normalizeServiciosApplicationVideos"), "Storage preserves up to 4 videos after legacy normalize");

assert(pkg.includes('"verify:servicios-gate-01"'), "package.json must register verify:servicios-gate-01");

console.log("OK: draft persistence hooks");
console.log("OK: open city copy");
console.log("OK: external video URL policy (max 4, no file upload)");
console.log("OK: video confirmation cards");
console.log("OK: preview video handoff");
console.log("OK: package.json verifier registered");
console.log("verify-servicios-gate-01-draft-city-video-url: PASS");
