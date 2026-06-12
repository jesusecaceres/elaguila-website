/**
 * Gate OL-6 — Ofertas Locales Step 5 upload structure + coupon honesty audit.
 * Run: npm run ofertas-locales:ol6-step5-upload-structure-coupon-honesty-audit
 */
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");

const PLAN = "app/lib/ofertas-locales/OFERTAS_LOCALES_OL6_STEP5_UPLOAD_STRUCTURE_COUPON_HONESTY_PLAN.md";
const AUDIT = "app/lib/ofertas-locales/OFERTAS_LOCALES_OL6_STEP5_UPLOAD_STRUCTURE_COUPON_HONESTY_AUDIT.md";
const LAYOUT = "app/lib/ofertas-locales/ofertasLocalesStep5AssetLayout.ts";
const SECTION = "app/(site)/publicar/ofertas-locales/OfertasLocalesDraftAssetSection.tsx";
const APP = "app/(site)/publicar/ofertas-locales/OfertasLocalesApplicationClient.tsx";
const COPY = "app/(site)/publicar/ofertas-locales/ofertasLocalesApplicationCopy.ts";
const CONSTANTS = "app/lib/ofertas-locales/ofertasLocalesConstants.ts";
const PERSIST = "app/lib/ofertas-locales/ofertasLocalesDraftPersistence.ts";
const PUBLISH = "app/lib/ofertas-locales/ofertasLocalesPublishMapper.ts";
const DOC_AI = "app/lib/ofertas-locales/ofertasLocalesDocumentAiClient.ts";
const PACKAGE = "package.json";

const FORBIDDEN = [
  /^app\/admin\//,
  /^app\/\(site\)\/dashboard\//,
  /stripe/i,
  /^supabase\/migrations\//,
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
  assert.ok(exists(PLAN), "OL-6 plan must exist");
  assert.ok(exists(AUDIT), "OL-6 audit must exist");

  const layout = read(LAYOUT);
  const section = read(SECTION);
  const app = read(APP);
  const copy = read(COPY);
  const constants = read(CONSTANTS);
  const persist = read(PERSIST);
  const publish = read(PUBLISH);
  const docAi = read(DOC_AI);
  const pkg = read(PACKAGE);

  assert.match(layout, /primaryMainFlyer/, "primary flyer mode");
  assert.match(layout, /splitOfertaLocalPrimaryFlyerAssets/, "legacy multi-flyer split");

  assert.match(copy, /Archivo principal del volante|Main flyer file/, "main flyer section label");
  assert.match(copy, /volante principal completo|full main flyer/i, "upload full flyer helper");
  assert.match(copy, /varias páginas|multiple pages/i, "multi-page helper");

  assert.match(app, /sectionMode="primaryMainFlyer"/, "shopping primary flyer mode wired");
  assert.match(section, /primaryMainFlyer/, "section supports primary flyer mode");
  assert.match(section, /canAddAssetInSectionMode/, "conditional add buttons");
  assert.match(section, /showPageSection/, "page section toggle");

  assert.doesNotMatch(section, /primaryMainFlyer[\s\S]{0,800}pageSectionLabel/, "page section hidden on primary");
  assert.match(copy, /Página o sección|Page or section/, "page section label retained");
  assert.match(copy, /cupón como imagen o PDF individual|each coupon as an individual image or PDF/i, "individual coupons preferred");

  assert.match(copy, /no prometemos recorte automático|automatic clipping is not promised/i, "no clipping promise");
  assert.doesNotMatch(copy, /recorte automático garantizado|automatically cut every coupon/i, "no perfect clipping");

  assert.match(copy, /sugerencias para revisión|suggest.*for review/i, "AI suggestions for review");
  assert.match(copy, /antes de publicarse|before publishing/i, "review before publish");
  assert.match(copy, /no se escanean|are not scanned/i, "external URLs not scanned");
  assert.doesNotMatch(copy, /aiScanUploadFormats[\s\S]{0,200}webp/i, "AI copy does not promise WebP scan");

  assert.match(copy, /Subir archivo.*para guardarlo|Upload file.*to save it/i, "pending upload copy");
  assert.match(copy, /subido y guardado|uploaded and saved/i, "uploaded success copy");

  assert.match(app, /step5BlocksContinue|step5UploadBeforeContinueWarning/, "blocks continue on pending");
  assert.match(app, /disabled=\{step5BlocksContinue\}/, "Siguiente disabled when pending");

  assert.doesNotMatch(persist, /readAsDataURL/, "no base64 persistence");
  assert.doesNotMatch(section, /localStorage\.setItem/, "no localStorage files");
  assert.match(persist, /flyerAssets|couponAssets/, "asset metadata persists");

  assert.match(publish, /flyerAssets|couponAssets/, "publish mapper includes assets");
  assert.match(constants, /flyer_pdf:\s*75/, "OL-5 flyer PDF limit preserved");
  assert.match(docAi, /OFERTA_LOCAL_DOCUMENT_AI_MAX_BYTES = 15/, "AI scan algorithm unchanged");

  assert.match(pkg, /ofertas-locales:ol6-step5-upload-structure-coupon-honesty-audit/, "package script");

  for (const file of changedFiles()) {
    if (FORBIDDEN.some((re) => re.test(file))) {
      assert.fail(`Forbidden file changed: ${file}`);
    }
  }

  console.log("Gate OL-6 — Ofertas Locales Step 5 upload structure + coupon honesty audit passed.");
}

run();
