// Package F Build F2 — final verifier. Static, file-content assertions (no DB/network calls),
// matching the established scripts/verify-*.mjs pattern. Covers every gate's landed fix.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}
function exists(rel) {
  return fs.existsSync(path.join(root, rel));
}

const checks = [];
function assert(name, condition, detail) {
  checks.push({ name, ok: Boolean(condition), detail });
}

// ---------------------------------------------------------------------------------------
// Gate 1 — Analytics RLS privacy fix
// ---------------------------------------------------------------------------------------
assert(
  "Gate 1: listing_analytics owner-scoped RLS migration exists",
  exists("supabase/migrations/20260812090000_listing_analytics_owner_scoped_select_rls.sql"),
  "Expected the narrow owner-scoped SELECT RLS migration file.",
);
{
  const mig = exists("supabase/migrations/20260812090000_listing_analytics_owner_scoped_select_rls.sql")
    ? read("supabase/migrations/20260812090000_listing_analytics_owner_scoped_select_rls.sql")
    : "";
  assert(
    "Gate 1: migration drops the open USING(true) policy",
    /DROP POLICY[\s\S]*Allow select listing_analytics/i.test(mig),
    "Expected a DROP POLICY for the old open-read policy.",
  );
  assert(
    "Gate 1: migration scopes SELECT to owner_user_id = auth.uid()",
    /owner_user_id\s*=\s*auth\.uid\(\)::text/.test(mig),
    "Expected the new policy to scope by owner_user_id.",
  );
}
assert(
  "Gate 1: Autos analytics-summary route exists (server-only aggregate)",
  exists("app/api/clasificados/autos/listing/[id]/analytics-summary/route.ts"),
  "Expected the new safe aggregate endpoint.",
);
{
  const strip = read("app/(site)/clasificados/autos/listing/components/AutosAnuncioAnalyticsStrip.tsx");
  assert(
    "Gate 1: AutosAnuncioAnalyticsStrip no longer queries listing_analytics directly",
    !/from\(["']listing_analytics["']\)/.test(strip),
    "Expected the direct-read component to route through the new API instead.",
  );
}

// ---------------------------------------------------------------------------------------
// Gate 2 — Promo per-customer abuse control
// ---------------------------------------------------------------------------------------
{
  const promo = read("app/lib/listingPlans/revenuePromoRedemptions.ts");
  assert(
    "Gate 2: countCustomerPromoRedemptions helper exists",
    /async function countCustomerPromoRedemptions/.test(promo),
    "Expected a real customer-redemption counter.",
  );
  assert(
    "Gate 2: counter filters on status = redeemed",
    /status["']?\s*,?\s*["']redeemed["']|\.eq\(["']status["'],\s*["']redeemed["']\)/.test(promo),
    "Expected the counter to only count terminal redeemed rows.",
  );
  assert(
    "Gate 2: resolvePromoForCheckout wires the real count into validation",
    /const customerRedemptionCount = await countCustomerPromoRedemptions/.test(promo) &&
      /validatePromoEligibility\(\{[\s\S]{0,600}customerRedemptionCount/.test(promo),
    "Expected the computed count to reach validatePromoEligibility.",
  );
}

// ---------------------------------------------------------------------------------------
// Gate 3 — Preview/nonpublic indexing safety
// ---------------------------------------------------------------------------------------
const gate3PreviewFiles = [
  "app/(site)/clasificados/en-venta/preview/page.tsx",
  "app/(site)/clasificados/autos/privado/preview/page.tsx",
  "app/(site)/clasificados/autos/negocios/preview/page.tsx",
  "app/(site)/clasificados/restaurantes/preview/page.tsx",
];
for (const f of gate3PreviewFiles) {
  const src = read(f);
  assert(
    `Gate 3: ${f} imports PREVIEW_NOINDEX_METADATA`,
    /PREVIEW_NOINDEX_METADATA/.test(src),
    "Expected the shared noindex constant to be spread into metadata.",
  );
}
{
  const layout = read("app/(site)/clasificados/servicios/[slug]/layout.tsx");
  assert(
    "Gate 3: Servicios pending/rejected/suspended states spread PREVIEW_NOINDEX_METADATA",
    (layout.match(/\.\.\.PREVIEW_NOINDEX_METADATA/g) || []).length >= 2,
    "Expected both the pending_review and rejected/suspended branches to set noindex.",
  );
}

// ---------------------------------------------------------------------------------------
// Gate 4 — Results/resultados duplicate route redirects
// ---------------------------------------------------------------------------------------
{
  const cfg = read("next.config.ts");
  const requiredPairs = [
    ["/clasificados/autos/resultados", "/clasificados/autos/results"],
    ["/clasificados/restaurantes/resultados", "/clasificados/restaurantes/results"],
    ["/clasificados/servicios/resultados", "/clasificados/servicios/results"],
    ["/clasificados/empleos/results", "/clasificados/empleos/resultados"],
    ["/clasificados/busco/results", "/clasificados/busco/resultados"],
    ["/clasificados/clases/results", "/clasificados/clases/resultados"],
    ["/clasificados/mascotas-y-perdidos/results", "/clasificados/mascotas-y-perdidos/resultados"],
    ["/clasificados/comunidad/results", "/clasificados/comunidad/resultados"],
  ];
  for (const [source, destination] of requiredPairs) {
    assert(
      `Gate 4: redirect ${source} -> ${destination}`,
      new RegExp(`source:\\s*["']${source}["'][\\s\\S]{0,80}destination:\\s*["']${destination}["']`).test(cfg),
      "Expected a matching redirects() entry in next.config.ts.",
    );
  }
}

// ---------------------------------------------------------------------------------------
// Gate 5 — Tienda upload MIME/size validation
// ---------------------------------------------------------------------------------------
{
  const up = read("app/api/tienda/assets/upload/route.ts");
  assert(
    "Gate 5: Tienda upload route enforces a MIME allowlist",
    /acceptedMime/.test(up) && /UNSUPPORTED_TYPE/.test(up),
    "Expected role-based MIME enforcement.",
  );
  assert(
    "Gate 5: Tienda upload route enforces a real size cap",
    /FILE_TOO_LARGE/.test(up) && /maxBytes/.test(up),
    "Expected role-based size enforcement.",
  );
}

// ---------------------------------------------------------------------------------------
// Gate 7 — Canonical URL + metadata fixes
// ---------------------------------------------------------------------------------------
const gate7CanonicalFiles = [
  ["app/(site)/clasificados/autos/page.tsx", "/clasificados/autos"],
  ["app/(site)/clasificados/autos/results/page.tsx", "/clasificados/autos/results"],
  ["app/(site)/clasificados/restaurantes/[slug]/page.tsx", "restaurantes/"],
  ["app/(site)/clasificados/rentas/listing/[id]/page.tsx", "rentas/listing/"],
  ["app/(site)/clasificados/en-venta/page.tsx", "buildEnVentaHubMetadata"],
  ["app/(site)/clasificados/en-venta/results/page.tsx", "/clasificados/en-venta/results"],
];
for (const [f, needle] of gate7CanonicalFiles) {
  assert(`Gate 7: ${f} references ${needle}`, read(f).includes(needle), `Expected ${f} to contain "${needle}".`);
}
assert(
  "Gate 7: Autos vehicle detail sets alternates + openGraph",
  /alternates:\s*{\s*canonical/.test(read("app/(site)/clasificados/autos/vehiculo/[id]/page.tsx")) &&
    /openGraph:/.test(read("app/(site)/clasificados/autos/vehiculo/[id]/page.tsx")),
  "Expected canonical + OG on the vehicle detail generateMetadata.",
);
assert(
  "Gate 7: Comida Local detail lang-branches metadata + sets openGraph",
  /normalizeLang\(sp\.lang\)/.test(read("app/(site)/clasificados/comida-local/[slug]/page.tsx")) &&
    /openGraph:/.test(read("app/(site)/clasificados/comida-local/[slug]/page.tsx")),
  "Expected lang branching + OG on the Comida Local detail generateMetadata.",
);

// ---------------------------------------------------------------------------------------
// Gate 8 — Upload validation standardization
// ---------------------------------------------------------------------------------------
const gate8UploadRoutes = [
  "app/api/clasificados/rentas/draft-media-upload/route.ts",
  "app/api/clasificados/restaurantes/draft-media-upload/route.ts",
  "app/api/clasificados/servicios/draft-media-upload/route.ts",
];
for (const f of gate8UploadRoutes) {
  assert(
    `Gate 8: ${f} enforces an image MIME allowlist`,
    /image\/jpeg/.test(read(f)) && /image\/png/.test(read(f)) && /image\/webp/.test(read(f)),
    "Expected a JPEG/PNG/WebP allowlist.",
  );
}

// ---------------------------------------------------------------------------------------
// Gate 9 — Accessibility launch fixes
// ---------------------------------------------------------------------------------------
assert(
  "Gate 9: prefers-reduced-motion rule exists in globals.css",
  /prefers-reduced-motion:\s*reduce/.test(read("app/globals.css")),
  "Expected a global reduced-motion media query.",
);
assert(
  "Gate 9: dashboard nav items enforce a 44px minimum touch target",
  /min-h-\[44px\][\s\S]{0,60}items-center gap-2 rounded-2xl px-3 py-2\.5/.test(
    read("app/(site)/dashboard/components/LeonixDashboardShell.tsx"),
  ),
  "Expected min-h-[44px] on the navItem factory.",
);
assert(
  "Gate 9: PublishCheckoutCheckpoint promo field has htmlFor/id pairing",
  /htmlFor="publish-checkout-promo-code"/.test(read("app/(site)/clasificados/components/PublishCheckoutCheckpoint.tsx")) &&
    /id="publish-checkout-promo-code"/.test(read("app/(site)/clasificados/components/PublishCheckoutCheckpoint.tsx")),
  "Expected matching htmlFor/id.",
);
for (const [f, id] of [
  ["app/(site)/clasificados/publicar/en-venta/free/application/sections/BasicInfoSection.tsx", "en-venta-free-title"],
  ["app/(site)/clasificados/publicar/en-venta/free/application/sections/SellerContactSection.tsx", "en-venta-free-phone"],
  ["app/(site)/clasificados/publicar/en-venta/free/application/sections/LocationSection.tsx", "en-venta-free-zip"],
]) {
  const src = read(f);
  assert(
    `Gate 9: ${f} pairs htmlFor/id (${id})`,
    src.includes(`htmlFor="${id}"`) && src.includes(`id="${id}"`),
    "Expected matching htmlFor/id.",
  );
}
for (const f of [
  "app/(site)/publicar/autos/negocios/components/AutosNegociosAddInventoryDrawer.tsx",
  "app/(site)/clasificados/publicar/bienes-raices/negocio/application/sections/shared/BrNegocioChildInventoryFullApplication.tsx",
]) {
  const src = read(f);
  assert(
    `Gate 9: ${f} implements focus trap + focus restore`,
    /previouslyFocusedRef/.test(src) && /e\.key === "Tab"/.test(src),
    "Expected a focus-trap Tab handler and a previously-focused-element ref.",
  );
}

// ---------------------------------------------------------------------------------------
// Gate 10 — "Otro" public display truth
// ---------------------------------------------------------------------------------------
assert(
  "Gate 10: Empleos job card substitutes categoryCustomLabel",
  /categoryCustomLabel/.test(read("app/(site)/clasificados/empleos/components/EmpleosJobResultCard.tsx")),
  "Expected the card to prefer categoryCustomLabel over the raw slug.",
);
assert(
  "Gate 10: Empleos workModalityCustom write-path bug fixed",
  /workModalityCustom:\s*d\.workModalityCustom\.trim\(\)/.test(
    read("app/(site)/publicar/empleos/shared/publish/buildEmpleosPublishEnvelope.ts"),
  ),
  "Expected workModalityCustom to be sourced from d.workModalityCustom, not d.workModality.",
);
assert(
  "Gate 10: Rentas leaseTermCustom threaded through the public model",
  /leaseTermCustom/.test(read("app/(site)/clasificados/rentas/model/rentasPublicListing.ts")) &&
    /leaseTermCustom:\s*rx\.leaseTermCustom/.test(read("app/(site)/clasificados/rentas/data/mapListingRowToRentasPublicListing.ts")),
  "Expected leaseTermCustom on the model and mapped from the detail-pair reader.",
);
assert(
  "Gate 10: Rentas lease-term formatters branch on the otro sentinel",
  /c === "otro"/.test(read("app/(site)/clasificados/rentas/listing/mapRentasListingLiveToPreviewVm.ts")) &&
    /c === "otro"/.test(read("app/(site)/clasificados/rentas/shared/rentasRentalTypeApply.ts")),
  "Expected both formatters to substitute custom text for the otro sentinel.",
);

// ---------------------------------------------------------------------------------------
// Gate 11 — Ofertas Package 11 shared dependency handoff
// ---------------------------------------------------------------------------------------
assert(
  "Gate 11: RevenueAuditAction includes the Ofertas fulfillment action",
  /ofertas_locales_entitlement_fulfilled_after_payment/.test(read("app/lib/listingPlans/revenueAuditLog.ts")),
  "Expected the new union member.",
);
assert(
  "Gate 11: DashboardAnalyticsTotals carries the 8 Ofertas fields",
  ["flyer_page_views", "product_impressions", "product_opens", "product_searches",
    "product_search_result_clicks", "shopping_list_adds", "flyer_viewer_opens", "offer_hub_opens"]
    .every((k) => read("app/lib/analytics/server/dashboardAnalyticsMetrics.ts").includes(k)),
  "Expected all 8 fields on both the type and the zero constant.",
);
for (const f of ["app/api/dashboard/analytics/summary/route.ts", "app/api/dashboard/owner-engagement/route.ts"]) {
  assert(
    `Gate 11: ${f} fallback uses the shared zero constant`,
    /ZERO_DASHBOARD_ANALYTICS_TOTALS/.test(read(f)),
    "Expected the hand-written partial literal to be replaced.",
  );
}

// ---------------------------------------------------------------------------------------
// Gate 12 — Route authority reconciliation
// ---------------------------------------------------------------------------------------
{
  const routes = read("app/(site)/clasificados/components/categoryStandard/categoryStandardRoutes.ts");
  assert(
    "Gate 12: categoryPublishPath servicios matches the registry",
    /servicios:\s*"\/publicar\/servicios"/.test(routes),
    "Expected servicios corrected to /publicar/servicios.",
  );
  assert(
    "Gate 12: categoryPublishPath empleos matches the registry",
    /empleos:\s*"\/publicar\/empleos"/.test(routes),
    "Expected empleos corrected to /publicar/empleos.",
  );
}

// ---------------------------------------------------------------------------------------
// Gate 15 — Structured data minimum (Autos/Restaurantes/Servicios)
// ---------------------------------------------------------------------------------------
assert("Gate 15: Autos vehicle JSON-LD builder exists", exists("app/(site)/clasificados/autos/seo/autosVehicleJsonLd.ts"), "Missing file.");
assert("Gate 15: Restaurante JSON-LD builder exists", exists("app/(site)/clasificados/restaurantes/seo/restauranteJsonLd.ts"), "Missing file.");
assert("Gate 15: Servicios JSON-LD builder exists", exists("app/(site)/servicios/seo/serviciosJsonLd.ts"), "Missing file.");
assert(
  "Gate 15: Autos vehicle detail renders the JSON-LD script",
  /autosVehicleJsonLd/.test(read("app/(site)/clasificados/autos/vehiculo/[id]/page.tsx")),
  "Expected the builder to be wired into the page.",
);
assert(
  "Gate 15: Restaurantes detail renders the JSON-LD script",
  /restauranteJsonLd/.test(read("app/(site)/clasificados/restaurantes/[slug]/page.tsx")),
  "Expected the builder to be wired into the page.",
);
assert(
  "Gate 15: Servicios detail renders the JSON-LD script",
  /serviciosJsonLd/.test(read("app/(site)/clasificados/servicios/[slug]/page.tsx")),
  "Expected the builder to be wired into the page.",
);

// ---------------------------------------------------------------------------------------
// Gate 16 — Sitemap launch completeness
// ---------------------------------------------------------------------------------------
{
  const sm = read("app/sitemap.ts");
  const hubs = [
    "/clasificados/en-venta", "/clasificados/rentas", "/clasificados/empleos", "/clasificados/autos",
    "/clasificados/bienes-raices", "/clasificados/servicios", "/clasificados/restaurantes",
    "/clasificados/comida-local", "/clasificados/viajes", "/clasificados/comunidad", "/clasificados/clases",
    "/clasificados/busco", "/clasificados/mascotas-y-perdidos", "/clasificados/ofertas-locales",
  ];
  for (const h of hubs) {
    assert(`Gate 16: sitemap includes ${h}`, sm.includes(h), `Expected ${h} in the hub list.`);
  }
}

// ---------------------------------------------------------------------------------------
// Gate 17 — ES/EN metadata parity
// ---------------------------------------------------------------------------------------
assert(
  "Gate 17: Restaurantes detail metadata lang-branches",
  /lang === "en" \? "Restaurants" : "Restaurantes"/.test(read("app/(site)/clasificados/restaurantes/[slug]/page.tsx")),
  "Expected the category label to branch on lang.",
);
assert(
  "Gate 17: Servicios layout resolves lang from the persisted cookie",
  /LEONIX_LANG_COOKIE/.test(read("app/(site)/clasificados/servicios/[slug]/layout.tsx")),
  "Expected the layout to read the public lang cookie instead of hardcoding es.",
);

// ---------------------------------------------------------------------------------------
// Gate 18 — Viajes handoff doc
// ---------------------------------------------------------------------------------------
assert(
  "Gate 18: Viajes handoff doc exists",
  exists("docs/globalization/package-f/VIAJES_GLOBALIZATION_DEPENDENCY_HANDOFF.md"),
  "Expected the documentation-only handoff file.",
);

// ---------------------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------------------
const failed = checks.filter((c) => !c.ok);
for (const c of checks) {
  console.log(c.ok ? `✓ ${c.name}` : `✗ ${c.name}: ${c.detail}`);
}
console.log(`\n${checks.length - failed.length}/${checks.length} checks passed.`);
if (failed.length > 0) process.exit(1);
