/**
 * SAN JOSE LAUNCH — Wave 1B public-output truth (2026-09-24).
 *
 * Pins: one canonical customer-visible origin (never a deployment host / wrong domain), the shared
 * Leonix Share drawer on the BR live details, the Empleos quick CTA card and every Servicios mount,
 * Servicios listing-specific social cards, and explicit (never assumed) SMS channels.
 *
 * Run: node node_modules/tsx/dist/cli.mjs --tsconfig scripts/lib/tsconfig.harness.json scripts/verify-launch-public-output-01.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { resolveLeonixSiteOrigin } from "../app/lib/siteOrigin";
import { serviciosSocialCards, serviciosSocialImage } from "../app/(site)/clasificados/servicios/lib/serviciosSocialMetadata";

const failures: string[] = [];
function check(name: string, fn: () => void) {
  try {
    fn();
    console.log(`OK: ${name}`);
  } catch (e) {
    failures.push(`${name}: ${e instanceof Error ? e.message : String(e)}`);
    console.error(`FAIL: ${name}\n  ${e instanceof Error ? e.message : String(e)}`);
  }
}
const raw = (rel: string) => readFileSync(rel, "utf8").replace(/\r\n/g, "\n");

const ENV_KEYS = ["NEXT_PUBLIC_SITE_URL", "VERCEL_URL", "VERCEL_ENV", "NODE_ENV"] as const;
function withEnv<T>(env: Partial<Record<(typeof ENV_KEYS)[number], string | undefined>>, fn: () => T): T {
  const env0 = process.env as Record<string, string | undefined>;
  const saved: Record<string, string | undefined> = {};
  for (const k of ENV_KEYS) {
    saved[k] = env0[k];
    delete env0[k];
  }
  for (const [k, v] of Object.entries(env)) if (v !== undefined) env0[k] = v;
  try {
    return fn();
  } finally {
    for (const k of ENV_KEYS) {
      if (saved[k] === undefined) delete env0[k];
      else env0[k] = saved[k];
    }
  }
}

check("origin: production never derives a public URL from VERCEL_URL", () => {
  const o = withEnv({ NODE_ENV: "production", VERCEL_ENV: "production", VERCEL_URL: "elaguila-abc123.vercel.app" }, resolveLeonixSiteOrigin);
  assert.equal(o, "https://leonixmedia.com");
});
check("origin: an explicit *.vercel.app NEXT_PUBLIC_SITE_URL is rejected", () => {
  const o = withEnv({ NODE_ENV: "production", VERCEL_ENV: "production", NEXT_PUBLIC_SITE_URL: "https://elaguila-abc.vercel.app" }, resolveLeonixSiteOrigin);
  assert.equal(o, "https://leonixmedia.com");
});
check("origin: an explicit custom domain wins (trailing slash trimmed)", () => {
  const o = withEnv({ NODE_ENV: "production", NEXT_PUBLIC_SITE_URL: "https://leonixmedia.com/" }, resolveLeonixSiteOrigin);
  assert.equal(o, "https://leonixmedia.com");
});
check("origin: no env in production resolves to the canonical Leonix origin (never leonix.com)", () => {
  const o = withEnv({ NODE_ENV: "production" }, resolveLeonixSiteOrigin);
  assert.equal(o, "https://leonixmedia.com");
});
check("origin: Vercel PREVIEW deployments keep their own host for owner QA", () => {
  const o = withEnv({ NODE_ENV: "production", VERCEL_ENV: "preview", VERCEL_URL: "elaguila-git-x.vercel.app" }, resolveLeonixSiteOrigin);
  assert.equal(o, "https://elaguila-git-x.vercel.app");
});
check("origin: local development keeps localhost", () => {
  const o = withEnv({ NODE_ENV: "development" }, resolveLeonixSiteOrigin);
  assert.equal(o, "http://localhost:3000");
});

check("origin: every launch-visible origin helper delegates to the shared resolver", () => {
  for (const rel of [
    "app/(site)/clasificados/empleos/lib/empleosSiteUrl.ts",
    "app/lib/clasificados/autos/autosSiteOrigin.ts",
    "app/lib/clasificados/bienes-raices/stripeBrConfig.ts",
    "app/lib/listingPlans/revenueCheckout.ts",
    "app/lib/supabase/adminSession.ts",
    "app/api/clasificados/servicios/inquiry/route.ts",
  ]) {
    assert.ok(raw(rel).includes("@/app/lib/siteOrigin"), `${rel}: uses the shared resolver`);
  }
  assert.ok(!raw("app/(site)/clasificados/empleos/lib/empleosSiteUrl.ts").includes('leonix.com"'), "Empleos: no wrong-domain fallback");
  for (const rel of ["app/(site)/clasificados/empleos/lib/empleosSiteUrl.ts", "app/lib/clasificados/autos/autosSiteOrigin.ts"]) {
    assert.ok(!raw(rel).includes("VERCEL_URL"), `${rel}: no VERCEL_URL public fallback`);
  }
});

check("share: BR Negocio/Privado live details open the shared Leonix Share drawer with a canonical URL", () => {
  for (const rel of [
    "app/(site)/clasificados/bienes-raices/listing/BienesRaicesNegocioLiveDetailShell.tsx",
    "app/(site)/clasificados/bienes-raices/listing/BienesRaicesPrivadoLiveDetailShell.tsx",
  ]) {
    const src = raw(rel);
    assert.ok(src.includes("<LeonixShareButton"), `${rel}: shared drawer`);
    assert.ok(src.includes("LEONIX_SITE_ORIGIN"), `${rel}: canonical origin`);
    assert.ok(!src.includes("copyToClipboard(window.location.href)"), `${rel}: no raw clipboard share`);
  }
});
check("share: Empleos quick CTA card uses the shared drawer (no raw navigator.share)", () => {
  const src = raw("app/(site)/clasificados/empleos/components/quickJob/QuickJobCTACard.tsx");
  assert.ok(src.includes("<LeonixShareButton") && src.includes("LEONIX_SITE_ORIGIN"));
  assert.ok(!src.includes("navigator.share") && !src.includes("window.location.href"));
});
check("share: every Servicios general-share mount uses the shared drawer", () => {
  for (const rel of [
    // Quick/Full shared presentation (2026-09-24): the Preview renders the shared professional shell (listed below)
    // through a thin adapter, so it has no share mount of its own.
    "app/(site)/clasificados/servicios/ServiciosListingResultCard.tsx",
    "app/(site)/servicios/components/ServiciosBusinessHubEngagementRow.tsx",
    "app/(site)/servicios/components/ServiciosEndOfContentShare.tsx",
    "app/(site)/servicios/components/ServiciosProfessionalProfileShell.tsx",
    "app/(site)/servicios/components/ServiciosProfileView.tsx",
    "app/(site)/servicios/components/ServiciosResultCardEngagementStrip.tsx",
  ]) {
    const src = raw(rel);
    assert.ok(src.includes("<LeonixShareButton"), `${rel}: share mounted`);
    assert.ok(!src.includes("directNativeShare"), `${rel}: drawer, not direct native share`);
  }
});

check("metadata: Servicios social image = cover, then gallery, then logo; only https/root-relative", () => {
  assert.equal(
    serviciosSocialImage({ hero: { coverImageUrl: "https://cdn.example/c.jpg" }, gallery: [{ url: "https://cdn.example/g.jpg" }] })?.url,
    "https://cdn.example/c.jpg",
  );
  assert.equal(
    serviciosSocialImage({ hero: {}, gallery: [{ url: "javascript:1" }, { url: "https://cdn.example/g.jpg", alt: "g" }] })?.url,
    "https://cdn.example/g.jpg",
  );
  assert.equal(serviciosSocialImage({ hero: { logoUrl: "/logo.png" } })?.url, "/logo.png");
  assert.equal(serviciosSocialImage({ hero: { coverImageUrl: "http://insecure/x.jpg" } }), undefined);
});
check("metadata: Servicios cards are listing-specific OG + Twitter with a large image card when media exists", () => {
  const c = serviciosSocialCards({
    title: "Acme · Servicios",
    canonicalPath: "/clasificados/servicios/acme",
    image: { url: "https://cdn.example/c.jpg", alt: "Acme" },
  });
  assert.equal((c.twitter as { card?: string }).card, "summary_large_image");
  assert.ok(JSON.stringify(c.openGraph).includes("https://cdn.example/c.jpg"));
  const t = serviciosSocialCards({ title: "Acme · Servicios", canonicalPath: "/clasificados/servicios/acme" });
  assert.equal((t.twitter as { card?: string }).card, "summary");
});
check("metadata: Servicios layout + legacy perfil route build social cards from the listing", () => {
  assert.ok(raw("app/(site)/clasificados/servicios/[slug]/layout.tsx").includes("serviciosSocialCards("));
  assert.ok(raw("app/(site)/servicios/perfil/[slug]/page.tsx").includes("serviciosSocialCards("));
});

check("sms: Autos Privado SMS is the dedicated dealerSmsPhone, not the call phone", () => {
  const strip = raw("app/(site)/clasificados/autos/privado/components/PrivadoContactStrip.tsx");
  assert.ok(strip.includes("resolveDealerSmsPhone(data)"));
  assert.ok(!strip.includes("`sms:${phoneForTel}`"), "no sms: built from the call phone");
  assert.ok(raw("app/(site)/publicar/autos/privado/components/AutosPrivadoApplication.tsx").includes("dealerSmsPhone"), "form captures the SMS number");
});
check("sms: Comida Local SMS is the dedicated smsPhone, not the call phone", () => {
  const vm = raw("app/lib/clasificados/comida-local/mapComidaLocalDraftToPreviewVm.ts");
  assert.ok(vm.includes("buildComidaLocalSmsHref(draft.smsPhone"));
  assert.ok(!vm.includes("buildComidaLocalSmsHref(draft.phone)"));
  assert.ok(raw("app/lib/clasificados/comida-local/comidaLocalTypes.ts").includes("smsPhone: string;"));
  assert.ok(raw("app/lib/clasificados/comida-local/comidaLocalDraftPersistence.ts").includes("smsPhone: safeString(parsed.smsPhone"));
});
check("locale: Comida Local results page passes the active locale to its cards", () => {
  assert.ok(raw("app/(site)/clasificados/comida-local/page.tsx").includes("<ComidaLocalListingCard card={card} lang={lang} />"));
});

if (failures.length) {
  console.error(`\n${failures.length} check(s) failed`);
  process.exit(1);
}
console.log("\nverify-launch-public-output-01: all checks passed");
