/**
 * Rentas Negocio reputation links — semantic port of db688c046 (Rentas Negocio half) plus the
 * review-URL read-back from 679194792.
 *
 * Proves the full lifecycle of `negocioGoogleReviewsUrl` / `negocioYelpReviewsUrl`:
 *   form state (type/default/merge) → form inputs → BR bridge → shared business_meta builder →
 *   published row → public mapper (sanitizeHttpUrl) → live preview VM → shared view render,
 *   plus draft preview VM and dashboard-edit hydration read-back (no wipe on edit).
 *
 * Source pins run on comment-stripped source so a doc comment can never satisfy a code check.
 *
 * Run: node node_modules/tsx/dist/cli.mjs --tsconfig scripts/lib/tsconfig.harness.json scripts/verify-rentas-negocio-reputation-links-01.ts
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  createEmptyRentasNegocioFormState,
  mergePartialRentasNegocioState,
  type RentasNegocioFormState,
} from "../app/(site)/clasificados/publicar/rentas/negocio/schema/rentasNegocioFormState";
import { rentasNegocioToBienesRaicesNegocioState } from "../app/(site)/clasificados/publicar/rentas/negocio/application/mapping/rentasNegocioToBienesRaicesNegocioState";
import { mapRentasNegocioStateToPreviewVm } from "../app/(site)/clasificados/publicar/rentas/negocio/application/mapping/mapRentasNegocioStateToPreviewVm";
import { buildRentasNegocioListingParams } from "../app/(site)/clasificados/lib/leonixPublishRealEstateFromDraftState";
import { mapOwnedRentasListingToNegocioFormState } from "../app/(site)/clasificados/publicar/rentas/shared/rentasDashboardEditHydration";
import { mapListingRowToRentasPublicListing } from "../app/(site)/clasificados/rentas/data/mapListingRowToRentasPublicListing";
import { mapRentasListingToNegocioPreviewVm } from "../app/(site)/clasificados/rentas/listing/mapRentasListingLiveToPreviewVm";

const ROOT = join(__dirname, "..");
let passed = 0;
const failures: string[] = [];

function assert(cond: unknown, label: string): void {
  if (cond) {
    passed += 1;
    return;
  }
  failures.push(label);
}

function read(rel: string): string {
  return readFileSync(join(ROOT, rel), "utf8");
}

function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
}

const C = "app/(site)/clasificados";
const FORM_STATE = `${C}/publicar/rentas/negocio/schema/rentasNegocioFormState.ts`;
const FORM = `${C}/publicar/rentas/negocio/application/RentasNegocioForm.tsx`;
const BRIDGE = `${C}/publicar/rentas/negocio/application/mapping/rentasNegocioToBienesRaicesNegocioState.ts`;
const META_BUILDER = `${C}/lib/leonixNegocioBusinessMetaFromFormState.ts`;
const PUBLIC_MAPPER = `${C}/rentas/data/mapListingRowToRentasPublicListing.ts`;
const PUBLIC_MODEL = `${C}/rentas/model/rentasPublicListing.ts`;
const LIVE_VM = `${C}/rentas/listing/mapRentasListingLiveToPreviewVm.ts`;
const VIEW = `${C}/rentas/preview/shared/RentasVisualMatchPreviewView.tsx`;
const HYDRATION = `${C}/publicar/rentas/shared/rentasDashboardEditHydration.ts`;

const GOOGLE = "https://g.page/r/rentas-del-valle/review";
const YELP = "https://www.yelp.com/biz/rentas-del-valle-santa-rosa";

/* ───────────────────────────── §1 source pins across the chain ───────────────────────────── */
{
  const fs = stripComments(read(FORM_STATE));
  assert(/negocioGoogleReviewsUrl:\s*string;/.test(fs), "form state type declares negocioGoogleReviewsUrl");
  assert(/negocioYelpReviewsUrl:\s*string;/.test(fs), "form state type declares negocioYelpReviewsUrl");
  assert(fs.includes('negocioGoogleReviewsUrl: ""'), "empty default for Google");
  assert(fs.includes('negocioYelpReviewsUrl: ""'), "empty default for Yelp");
  assert(fs.includes('typeof ngg === "string" ? ngg : base.negocioGoogleReviewsUrl'), "mergePartial reads Google");
  assert(fs.includes('typeof nyy === "string" ? nyy : base.negocioYelpReviewsUrl'), "mergePartial reads Yelp");

  const form = stripComments(read(FORM));
  assert(form.includes("value={state.negocioGoogleReviewsUrl}"), "form renders Google input");
  assert(form.includes("value={state.negocioYelpReviewsUrl}"), "form renders Yelp input");
  assert(form.includes("negocioGoogleReviewsUrl: e.target.value"), "Google input writes state");
  assert(form.includes("negocioYelpReviewsUrl: e.target.value"), "Yelp input writes state");
  assert(
    form.includes('"Perfil/reseñas de Google (opcional)", "Google profile/reviews (optional)"') &&
      form.includes('"Perfil/reseñas de Yelp (opcional)", "Yelp profile/reviews (optional)"'),
    "bilingual labels via rentasUiLabel",
  );
  const redesIdx = form.indexOf("value={state.negocioRedes}");
  const googleIdx = form.indexOf("value={state.negocioGoogleReviewsUrl}");
  const bioIdx = form.indexOf("value={state.negocioBio}");
  assert(redesIdx > 0 && googleIdx > redesIdx && googleIdx < bioIdx, "review inputs sit right after the Redes field");

  const bridge = stripComments(read(BRIDGE));
  assert(bridge.includes("googleReviewsUrl: s.negocioGoogleReviewsUrl"), "bridge maps Google");
  assert(bridge.includes("yelpReviewsUrl: s.negocioYelpReviewsUrl"), "bridge maps Yelp");

  const meta = stripComments(read(META_BUILDER));
  assert(meta.includes("meta.negocioGoogleReviewsUrl = googleReviews"), "shared BR builder (unchanged) writes Google");
  assert(meta.includes("meta.negocioYelpReviewsUrl = yelpReviews"), "shared BR builder (unchanged) writes Yelp");

  const pm = stripComments(read(PUBLIC_MAPPER));
  assert(/sanitizeHttpUrl\(typeof o\.negocioGoogleReviewsUrl === "string"/.test(pm), "public mapper sanitizes Google");
  assert(/sanitizeHttpUrl\(typeof o\.negocioYelpReviewsUrl === "string"/.test(pm), "public mapper sanitizes Yelp");
  assert(pm.includes("businessGoogleReviewsUrl,") && pm.includes("businessYelpReviewsUrl,"), "public mapper emits both");

  const model = stripComments(read(PUBLIC_MODEL));
  assert(model.includes("businessGoogleReviewsUrl?: string | null;"), "public model has Google");
  assert(model.includes("businessYelpReviewsUrl?: string | null;"), "public model has Yelp");

  const live = stripComments(read(LIVE_VM));
  assert(live.includes("googleReviewsUrl: listing.businessGoogleReviewsUrl ?? undefined"), "live VM maps Google");
  assert(live.includes("yelpReviewsUrl: listing.businessYelpReviewsUrl ?? undefined"), "live VM maps Yelp");

  const view = stripComments(read(VIEW));
  assert(
    view.includes('import { SharedConnectionHubReviewButton } from "@/app/components/contact/connectionHub/renderers/SharedConnectionHubReviewButton"'),
    "view imports golden SharedConnectionHubReviewButton",
  );
  assert(!view.includes("SharedConnectionHubReviewDrawer"), "view does NOT use the drawer");
  assert(view.includes("isNegocio(vm) && (c.googleReviewsUrl || c.yelpReviewsUrl)"), "render gated on Negocio + URL present");
  assert(view.includes("{c.googleReviewsUrl ? ("), "Google button only when URL present");
  assert(view.includes("{c.yelpReviewsUrl ? ("), "Yelp button only when URL present");
  assert(view.includes('provider: "google"') && view.includes('provider: "yelp"'), "providers wired");
  assert(view.includes('"noopener,noreferrer"'), "outbound open uses noopener");
  assert(!/rating|reviewCount/.test(view.slice(view.indexOf("rentas-negocio-review-links"), view.indexOf("rentas-negocio-review-links") + 1400)), "no rating/count rendered");
  const reviewIdx = view.indexOf("rentas-negocio-review-links");
  const trustIdx = view.indexOf('category="rentas_negocio"');
  assert(reviewIdx > 0 && reviewIdx < trustIdx, "review block is a sibling ahead of Community Trust");

  const hyd = stripComments(read(HYDRATION));
  assert(hyd.includes('negocioGoogleReviewsUrl: metaString(meta, "negocioGoogleReviewsUrl")'), "hydration reads back Google");
  assert(hyd.includes('negocioYelpReviewsUrl: metaString(meta, "negocioYelpReviewsUrl")'), "hydration reads back Yelp");
}

/* ───────────────────────────── §2 pure behavior ───────────────────────────── */

function seededState(google: string, yelp: string): RentasNegocioFormState {
  const s = createEmptyRentasNegocioFormState();
  return {
    ...s,
    titulo: "Departamento cerca del centro",
    descripcion: "Espacio luminoso.",
    rentaMensual: "1850",
    tipoDeRenta: "apartamento",
    categoriaPropiedad: "residencial",
    ciudad: "Santa Rosa",
    direccionEstado: "CA",
    direccionCodigoPostal: "95407",
    media: { ...s.media, photoDataUrls: ["https://cdn.example.com/a.jpg"], primaryImageIndex: 0, videoUrl: "", videoUrls: [] },
    negocioNombre: "Rentas del Valle",
    negocioMarca: "Valle Property Group",
    negocioTelDirecto: "7075551234",
    negocioEmail: "contacto@rentasdelvalle.com",
    negocioGoogleReviewsUrl: google,
    negocioYelpReviewsUrl: yelp,
    confirmListingAccurate: true,
    confirmPhotosRepresentItem: true,
    confirmCommunityRules: true,
  };
}

function rowFromParams(params: Record<string, unknown>): Record<string, unknown> {
  return {
    id: "11111111-2222-3333-4444-555555555555",
    owner_id: "owner-1",
    category: "rentas",
    seller_type: params.sellerType,
    title: params.title,
    description: params.description,
    city: params.city,
    state: params.state,
    zip: params.zip,
    price: params.price,
    business_name: params.businessName,
    business_meta: params.businessMetaJson,
    detail_pairs: params.detailPairs,
    contact_phone: params.contactPhoneDigits,
    contact_email: params.contactEmail,
    images: params.imageSources,
    status: "active",
    is_published: true,
    leonix_ad_id: "LX-RENTAS-0001",
    created_at: "2026-09-10T00:00:00.000Z",
    updated_at: "2026-09-10T00:00:00.000Z",
  };
}

const EXTRA = { descriptionEs: "", descriptionEn: "", sellerDisplayEs: "", sellerDisplayEn: "", gallery: [] as string[] };

{
  // defaults + merge
  const empty = createEmptyRentasNegocioFormState();
  assert(empty.negocioGoogleReviewsUrl === "" && empty.negocioYelpReviewsUrl === "", "empty defaults are blank");
  const merged = mergePartialRentasNegocioState({ negocioGoogleReviewsUrl: GOOGLE, negocioYelpReviewsUrl: YELP });
  assert(merged.negocioGoogleReviewsUrl === GOOGLE && merged.negocioYelpReviewsUrl === YELP, "mergePartial preserves both");
  const legacy = mergePartialRentasNegocioState({ negocioNombre: "X" });
  assert(legacy.negocioGoogleReviewsUrl === "" && legacy.negocioYelpReviewsUrl === "", "legacy drafts get blank defaults");

  // bridge
  const br = rentasNegocioToBienesRaicesNegocioState(seededState(GOOGLE, YELP));
  assert(br.googleReviewsUrl === GOOGLE && br.yelpReviewsUrl === YELP, "bridge carries both into BR state");

  // draft preview
  const draftVm = mapRentasNegocioStateToPreviewVm(seededState(GOOGLE, YELP), "es");
  assert(draftVm.contact.googleReviewsUrl === GOOGLE, "draft preview contact.googleReviewsUrl");
  assert(draftVm.contact.yelpReviewsUrl === YELP, "draft preview contact.yelpReviewsUrl");
  const draftBlank = mapRentasNegocioStateToPreviewVm(seededState("", ""), "es");
  assert(!draftBlank.contact.googleReviewsUrl && !draftBlank.contact.yelpReviewsUrl, "draft preview blank when absent");

  // publish → row → public → live VM → hydration round trip
  const built = buildRentasNegocioListingParams(seededState(GOOGLE, YELP), "es");
  assert(built.ok === true, "seeded state publishes");
  if (built.ok) {
    const params = built.params as unknown as Record<string, unknown>;
    const meta = JSON.parse(String(params.businessMetaJson ?? "{}")) as Record<string, unknown>;
    assert(meta.negocioGoogleReviewsUrl === GOOGLE, "business_meta persists Google");
    assert(meta.negocioYelpReviewsUrl === YELP, "business_meta persists Yelp");

    const row = rowFromParams(params);
    const pub = mapListingRowToRentasPublicListing(row, "es");
    assert(pub !== null, "public mapper accepts the row");
    if (pub) {
      assert(pub.businessGoogleReviewsUrl === GOOGLE, "public listing businessGoogleReviewsUrl");
      assert(pub.businessYelpReviewsUrl === YELP, "public listing businessYelpReviewsUrl");
      const liveVm = mapRentasListingToNegocioPreviewVm(pub, EXTRA, "es");
      assert(liveVm.contact.googleReviewsUrl === GOOGLE, "live VM contact.googleReviewsUrl");
      assert(liveVm.contact.yelpReviewsUrl === YELP, "live VM contact.yelpReviewsUrl");
    }

    const hydrated = mapOwnedRentasListingToNegocioFormState(row);
    assert(hydrated.negocioGoogleReviewsUrl === GOOGLE, "dashboard edit hydrates Google");
    assert(hydrated.negocioYelpReviewsUrl === YELP, "dashboard edit hydrates Yelp");
    const again = buildRentasNegocioListingParams(hydrated, "es");
    if (again.ok) {
      const meta2 = JSON.parse(String((again.params as unknown as Record<string, unknown>).businessMetaJson ?? "{}"));
      assert(meta2.negocioGoogleReviewsUrl === GOOGLE && meta2.negocioYelpReviewsUrl === YELP, "no-op edit republish keeps both links");
    } else {
      assert(false, "hydrated state re-publishes");
    }
  }

  // hostile / absent values never surface publicly
  const hostileRow = rowFromParams({
    sellerType: "business",
    title: "t",
    city: "Santa Rosa",
    businessMetaJson: JSON.stringify({
      negocioGoogleReviewsUrl: "javascript:alert(1)",
      negocioYelpReviewsUrl: "   ",
    }),
    detailPairs: [],
    imageSources: ["https://cdn.example.com/a.jpg"],
  });
  const hostile = mapListingRowToRentasPublicListing(hostileRow, "es");
  if (hostile) {
    assert(!hostile.businessGoogleReviewsUrl, "javascript: URL rejected by sanitizeHttpUrl");
    assert(!hostile.businessYelpReviewsUrl, "blank URL stays absent");
    const vm = mapRentasListingToNegocioPreviewVm(hostile, EXTRA, "es");
    assert(!vm.contact.googleReviewsUrl && !vm.contact.yelpReviewsUrl, "live VM has no review links → nothing renders");
  } else {
    assert(false, "hostile row still maps (so the rejection is actually exercised)");
  }
  const noMeta = mapListingRowToRentasPublicListing(rowFromParams({ sellerType: "business", title: "t", businessMetaJson: null, detailPairs: [], imageSources: [] }), "es");
  if (noMeta) {
    assert(!noMeta.businessGoogleReviewsUrl && !noMeta.businessYelpReviewsUrl, "missing business_meta → no links");
  }
}

/* ───────────────────────────── report ───────────────────────────── */

if (failures.length > 0) {
  console.error(`\nverify-rentas-negocio-reputation-links-01: ${passed} passed, ${failures.length} FAILED\n`);
  for (const f of failures) console.error(`  FAIL  ${f}`);
  process.exit(1);
}
console.log(`verify-rentas-negocio-reputation-links-01: ${passed}/${passed} PASS`);
