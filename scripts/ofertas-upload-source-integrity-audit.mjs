import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (p) => readFileSync(join(root, p), "utf8");

const upload = read("app/api/ofertas-locales/assets/upload/route.ts");
const clientUpload = read("app/api/ofertas-locales/assets/client-upload/route.ts");
const scan = read("app/lib/ofertas-locales/ofertasLocalesScanApiHandler.ts");
const lifecycle = read("app/lib/ofertas-locales/ofertasLocalesAssetLifecycle.ts");
const storage = read("app/lib/ofertas-locales/ofertasLocalesStoragePaths.ts");

assert.match(upload, /ofertasLocalesOwnerIdFromBearer/);
assert.match(clientUpload, /payload\.ownerUserId !== ownerUserId/);
assert.match(clientUpload, /isPathAuthorized/);
assert.match(clientUpload, /allowedContentTypes/);
assert.match(upload, /validateOfertaLocalClientAssetFile/);
assert.match(upload, /OFERTAS_LOCALES_SERVER_UPLOAD_MAX_BYTES/);
assert.match(storage, /sanitizeOfertaLocalStorageSegment/);
assert.match(scan, /resolveOrCreateScanSourceVersion/);
assert.match(scan, /createOfertaLocalSourceVersion/);
assert.match(scan, /source_asset_version_id: sourceAssetVersionId/);
assert.doesNotMatch(scan, /insert\([^)]*ofertas_locales[^)]*\)/s, "scan must not create duplicate parent rows");
assert.match(lifecycle, /getNextOfertaLocalSourceVersionNumber/);

console.log("PASS ofertas-upload-source-integrity-audit");
