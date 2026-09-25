/**
 * LEONIX STAFF GATEWAY — Gate 4 translation matrix.
 * Run: npx tsx --tsconfig scripts/lib/tsconfig.harness.json scripts/verify-staff-eight-category-translation-01.ts
 *
 * One TranslateAdControl, one requestAdTranslation, one /api/translate-ad. No auto-call on render.
 * Public detail + private prospect preview mount the shared control. Contacts stay masked.
 * No live provider / Stripe / DB writes.
 */
import { strict as assert } from "node:assert";
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const read = (rel: string) => readFileSync(join(ROOT, rel), "utf8");

const failures: string[] = [];
const passed: string[] = [];
let checks = 0;
function check(name: string, fn: () => void) {
  checks += 1;
  try {
    fn();
    passed.push(name);
  } catch (e) {
    failures.push(`${name}: ${e instanceof Error ? e.message : String(e)}`);
  }
}

const PUBLIC_DETAIL: Record<string, string> = {
  rentas: "app/(site)/clasificados/rentas/listing/[id]/RentasListingDetailClient.tsx",
  empleos: "app/(site)/clasificados/empleos/components/EmpleosJobTranslationLayer.tsx",
  "autos-privado": "app/(site)/clasificados/autos/vehiculo/[id]/AutosListingTranslationLayer.tsx",
  servicios: "app/(site)/servicios/components/ServiciosPublicTranslationLayer.tsx",
  restaurantes: "app/(site)/clasificados/restaurantes/shell/RestauranteAdStoryPreview.tsx",
  "comida-local": "app/(site)/clasificados/comida-local/lib/useComidaLocalPublicTranslation.tsx",
  autos: "app/(site)/clasificados/autos/vehiculo/[id]/AutosListingTranslationLayer.tsx",
  "bienes-raices": "app/(site)/clasificados/bienes-raices/listing/BienesRaicesNegocioLiveDetailShell.tsx",
};

function main() {
  check("A1: only one TranslateAdControl implementation exists", () => {
    const hits = execSync('grep -rl "export function TranslateAdControl" app --include=*.tsx --include=*.ts', {
      cwd: ROOT,
      encoding: "utf8",
    })
      .trim()
      .split("\n")
      .filter(Boolean);
    assert.deepEqual(hits, ["app/components/translation/TranslateAdControl.tsx"]);
  });

  check("A2: the only translate-ad HTTP route is /api/translate-ad", () => {
    const src = read("app/api/translate-ad/route.ts");
    assert.ok(src.includes("translateAdWithConfiguredProvider"));
    const hits = execSync('find app/api -name route.ts -print', { cwd: ROOT, encoding: "utf8" })
      .trim()
      .split("\n")
      .filter((h) => /translate/.test(h));
    assert.deepEqual(hits, ["app/api/translate-ad/route.ts"]);
  });

  check("A3: requestAdTranslation is the only client wrapper and posts only to /api/translate-ad", () => {
    const src = read("app/lib/translation/requestAdTranslation.ts");
    assert.ok(src.includes('fetch("/api/translate-ad"'));
    assert.equal(/fetch\(["']\/api\/(?!translate-ad)/.test(src), false);
  });

  check("A4: TranslateAdControl never auto-calls the provider on mount", () => {
    const src = read("app/components/translation/TranslateAdControl.tsx");
    assert.ok(src.includes("onClick={onPrimaryClick}"));
    assert.equal(/useEffect\(\(\) => \{[\s\S]{0,200}requestTranslation\(/.test(src), false);
    assert.ok(src.includes("getCachedAdTranslation(cacheKey)"));
  });

  check("A5: provider payload refuses unmasked contact/map strings and never accepts phone/email/VIN keys", () => {
    const route = read("app/api/translate-ad/route.ts");
    assert.ok(route.includes("containsUnmaskedSensitiveContent"));
    assert.ok(route.includes("UNMASKED_EMAIL_RE"));
    assert.ok(route.includes("UNMASKED_PHONE_RE"));
    assert.equal(/"phone"|"email"|"vin"|"address"|"price"/.test(route.slice(route.indexOf("ALLOWED_FIELD_KEYS"), route.indexOf("ALLOWED_FIELD_KEYS") + 500)), false);
    const helpers = read("app/lib/translation/helpers.ts");
    assert.ok(helpers.includes("maskContactSensitiveText"));
  });

  for (const [family, file] of Object.entries(PUBLIC_DETAIL)) {
    check(`B1[${family}]: public detail mounts TranslateAdControl and requestAdTranslation`, () => {
      const src = read(file);
      assert.ok(src.includes("TranslateAdControl"), file);
      assert.ok(src.includes("requestAdTranslation") || src.includes("requestServiciosAdTranslation") || src.includes("requestComidaLocalAdTranslation"), file);
      assert.equal(src.includes("/api/translate"), false, `${file} must not call a second translation API`);
    });
  }

  check("B2: private prospect preview mounts the same TranslateAdControl near the title", () => {
    // Generic-shell families. The four business families use each REAL public component's own Translate Ad
    // (same TranslateAdControl + engine) — no ProspectPreviewTranslateAd — see verify-prospect-preview-real-components-01.ts.
    const page = read("app/(site)/vista-previa/[category]/page.tsx");
    const client = read("app/(site)/vista-previa/[category]/ProspectPreviewTranslateAd.tsx");
    assert.ok(page.includes("ProspectPreviewTranslateAd"));
    assert.ok(client.includes("TranslateAdControl"));
    assert.ok(client.includes("requestAdTranslation"));
    assert.ok(client.includes('fetch("/api/translate-ad"') === false);
    assert.ok(client.includes("data-prospect-preview-translate-ad"));
    assert.equal(client.includes("useEffect"), false);
  });

  check("B3: prospect preview does not send the legal/display business name as title", () => {
    const client = read("app/(site)/vista-previa/[category]/ProspectPreviewTranslateAd.tsx");
    assert.ok(client.includes("authoredTitle !== businessName"));
  });

  check("B4: Servicios result-card translation reuses the shared control, not a second engine", () => {
    const card = read("app/(site)/servicios/components/useServiciosResultCardTranslation.tsx");
    assert.ok(card.includes("TranslateAdControl"));
    assert.ok(card.includes("requestAdTranslation") || card.includes("requestServiciosAdTranslation"));
  });

  check("C1: translation failure leaves original copy; control reports error instead of mutating source", () => {
    const src = read("app/components/translation/TranslateAdControl.tsx");
    assert.ok(src.includes("setError(labels.error)"));
    assert.ok(src.includes('viewMode === "translated"'));
    assert.equal(/onTranslated\(\s*\{[\s\S]{0,80}error/.test(src), false);
  });

  console.log(`\n${passed.length}/${checks} passed`);
  for (const p of passed) console.log(`  OK   ${p}`);
  if (failures.length) {
    console.error(`\n${failures.length} FAILED`);
    for (const f of failures) console.error(`  FAIL ${f}`);
    process.exit(1);
  }
  console.log("\nverify-staff-eight-category-translation-01: ALL CHECKS EXECUTED AND PASSED");
}

main();
