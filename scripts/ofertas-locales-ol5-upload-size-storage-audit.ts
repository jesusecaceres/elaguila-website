/**
 * Gate OL-5 — Ofertas Locales upload size + storage readiness audit.
 * Run: npm run ofertas-locales:ol5-upload-size-storage-audit
 */
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");

const PLAN = "app/lib/ofertas-locales/OFERTAS_LOCALES_OL5_UPLOAD_SIZE_STORAGE_PLAN.md";
const AUDIT = "app/lib/ofertas-locales/OFERTAS_LOCALES_OL5_UPLOAD_SIZE_STORAGE_AUDIT.md";
const CONSTANTS = "app/lib/ofertas-locales/ofertasLocalesConstants.ts";
const VALIDATION = "app/lib/ofertas-locales/ofertasLocalesClientUploadValidation.ts";
const UPLOAD_CLIENT = "app/lib/ofertas-locales/ofertasLocalesAssetUpload.ts";
const UPLOAD_ROUTE = "app/api/ofertas-locales/assets/upload/route.ts";
const CLIENT_UPLOAD_ROUTE = "app/api/ofertas-locales/assets/client-upload/route.ts";
const UPLOAD_INTENT = "app/api/ofertas-locales/assets/upload-intent/route.ts";
const ASSET_SECTION = "app/(site)/publicar/ofertas-locales/OfertasLocalesDraftAssetSection.tsx";
const APP_CLIENT = "app/(site)/publicar/ofertas-locales/OfertasLocalesApplicationClient.tsx";
const COPY = "app/(site)/publicar/ofertas-locales/ofertasLocalesApplicationCopy.ts";
const PERSIST = "app/lib/ofertas-locales/ofertasLocalesDraftPersistence.ts";
const PREVIEW_COPY = "app/(site)/publicar/ofertas-locales/preview/ofertasLocalesPreviewCopy.ts";
const DOC_AI = "app/lib/ofertas-locales/ofertasLocalesDocumentAiClient.ts";
const PACKAGE = "package.json";

const FORBIDDEN = [
  /^app\/admin\//,
  /^app\/\(site\)\/dashboard\//,
  /stripe/i,
  /^supabase\/migrations\//,
  /^database\/migrations\//,
  /^app\/\(site\)\/clasificados\/ofertas-locales\//,
];

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel.replace(/\//g, path.sep)), "utf8");
}

function exists(rel: string): boolean {
  return fs.existsSync(path.join(ROOT, rel.replace(/\//g, path.sep)));
}

function changedFiles(): string[] {
  let tracked: string[] = [];
  let untracked: string[] = [];
  try {
    tracked = execSync("git diff --name-only", { cwd: ROOT, encoding: "utf8" })
      .split(/\r?\n/)
      .filter(Boolean);
  } catch {
    tracked = [];
  }
  try {
    untracked = execSync("git ls-files --others --exclude-standard", { cwd: ROOT, encoding: "utf8" })
      .split(/\r?\n/)
      .filter(Boolean);
  } catch {
    untracked = [];
  }
  return [...new Set([...tracked, ...untracked])].map((x) => x.replace(/\\/g, "/"));
}

function run() {
  assert.ok(exists(PLAN), "OL-5 plan must exist");
  assert.ok(exists(AUDIT), "OL-5 audit must exist");

  const constants = read(CONSTANTS);
  const validation = read(VALIDATION);
  const uploadClient = read(UPLOAD_CLIENT);
  const uploadRoute = read(UPLOAD_ROUTE);
  const clientUploadRoute = read(CLIENT_UPLOAD_ROUTE);
  const uploadIntent = read(UPLOAD_INTENT);
  const assetSection = read(ASSET_SECTION);
  const appClient = read(APP_CLIENT);
  const copy = read(COPY);
  const persist = read(PERSIST);
  const previewCopy = read(PREVIEW_COPY);
  const docAi = read(DOC_AI);
  const pkg = read(PACKAGE);
  const plan = read(PLAN);

  assert.doesNotMatch(constants, /CLIENT_UPLOAD_MAX_FLYER_MB\s*=\s*15/, "15 MB flyer constant removed");
  assert.match(constants, /flyer_pdf:\s*75/, "flyer PDF 75 MB");
  assert.match(constants, /flyer_image:\s*20/, "flyer image 20 MB");
  assert.match(constants, /coupon_pdf:\s*30/, "coupon PDF 30 MB");
  assert.match(constants, /coupon_image:\s*15/, "coupon image 15 MB");

  assert.match(validation, /getOfertaLocalClientUploadMaxBytes/, "type-specific max bytes");
  assert.match(validation, /ofertaLocalClientUploadSizeError/, "type-specific errors");
  assert.match(validation, /PDF de volante demasiado grande\. Máximo: \$\{mb\} MB/, "Spanish flyer PDF error");
  assert.match(validation, /Flyer PDF is too large/, "English flyer PDF error");
  assert.doesNotMatch(validation, /máx\. 15\.0 MB para volante/, "no legacy 15 MB flyer message");

  assert.match(constants, /application\/pdf[\s\S]*image\/jpeg[\s\S]*image\/png[\s\S]*image\/webp/, "MIME allowlist");
  assert.doesNotMatch(constants, /image\/svg/, "SVG not accepted");

  assert.match(uploadRoute, /validateOfertaLocalClientAssetFile/, "server validates upload");
  assert.match(uploadRoute, /@vercel\/blob/, "Vercel Blob destination");
  assert.match(clientUploadRoute, /handleUpload/, "client-direct upload handler");
  assert.match(clientUploadRoute, /maximumSizeInBytes/, "token size limit");
  assert.match(uploadIntent, /validateOfertaLocalClientAssetUploadMeta/, "intent validates size/MIME");

  assert.match(uploadClient, /@vercel\/blob\/client/, "client blob upload for large files");
  assert.match(uploadClient, /upload-intent/, "upload intent preflight");
  assert.doesNotMatch(uploadClient, /readAsDataURL/, "no base64 read");
  assert.doesNotMatch(persist, /readAsDataURL/, "no base64 in persistence");

  assert.match(copy, /75 MB/, "Step 5 limits copy");
  assert.match(copy, /PDF de volante hasta 75 MB|flyer PDF up to 75 MB/, "flyer PDF limit in copy");
  assert.match(appClient, /step5UploadLimitsHint/, "Step 5 helper in wizard");

  assert.match(persist, /sessionStorage/, "OL-2 persistence");
  assert.match(previewCopy, /Volver a editar/, "preview back CTA");

  assert.match(plan, /Vercel Blob/, "storage destination documented");
  assert.match(plan, /not Supabase Storage|not Supabase/, "Supabase blocker documented");

  assert.match(docAi, /OFERTA_LOCAL_DOCUMENT_AI_MAX_BYTES = 15/, "AI scan limit unchanged");

  assert.doesNotMatch(uploadClient, /localStorage\.setItem/, "no localStorage file persistence");
  assert.doesNotMatch(assetSection, /localStorage\.setItem/, "no localStorage in asset section");
  assert.match(assetSection, /uploadOfertaLocalDraftAsset/, "upload flow intact");

  assert.match(pkg, /ofertas-locales:ol5-upload-size-storage-audit/, "package script");

  for (const file of changedFiles()) {
    if (FORBIDDEN.some((re) => re.test(file))) {
      assert.fail(`Forbidden file changed: ${file}`);
    }
  }

  console.log("Gate OL-5 — Ofertas Locales upload size + storage readiness audit passed.");
}

run();
