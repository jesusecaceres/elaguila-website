/**
 * Optional live Supabase pipeline proof for Rentas (service role insert → anon read path → cleanup).
 * Loads `.env.local` when present (same line parser as other scripts).
 *
 * Requires: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
 * Skips with exit 0 and a clear message when any are missing (CI-friendly).
 *
 * Run: npx tsx scripts/rentas-e2e-pipeline-smoke.ts
 */
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import {
  LEONIX_DP_BATHROOMS_COUNT,
  LEONIX_DP_BEDROOMS_COUNT,
  LEONIX_DP_BRANCH,
  LEONIX_DP_CATEGORIA_PROPIEDAD,
  LEONIX_DP_HIGHLIGHT_SLUGS,
  LEONIX_DP_OPERATION,
  LEONIX_DP_POOL,
  LEONIX_DP_POSTAL_CODE,
  LEONIX_DP_PROPERTY_SUBTYPE,
  LEONIX_DP_RESULTS_PROPERTY_KIND,
} from "../app/(site)/clasificados/lib/leonixRealEstateListingContract";
import {
  RENTAS_DP_DEPOSIT_USD,
  RENTAS_DP_LEASE_TERM,
  RENTAS_DP_LISTING_STATUS,
} from "../app/(site)/clasificados/rentas/lib/rentasMachineDetailPairs";
import { fetchRentasPublicListingsForBrowse } from "../app/(site)/clasificados/rentas/lib/fetchRentasPublicListingsForBrowse";
import { fetchRentasListingForPublicDetail } from "../app/(site)/clasificados/rentas/lib/fetchRentasListingForPublicDetail";
import { parseRentasBrowseParams } from "../app/(site)/clasificados/rentas/shared/rentasBrowseContract";
import { filterRentasPublicListings } from "../app/(site)/clasificados/rentas/shared/rentasBrowseFilters";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const envPath = path.join(root, ".env.local");

function loadEnvLocal(): void {
  if (!fs.existsSync(envPath)) return;
  const text = fs.readFileSync(envPath, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!m) continue;
    let v = m[2]!.trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (!process.env[m[1]!]) process.env[m[1]!] = v;
  }
}

function baseRentasPairs(branch: "rentas_privado" | "rentas_negocio"): Array<{ label: string; value: string }> {
  return [
    { label: LEONIX_DP_BRANCH, value: branch },
    { label: LEONIX_DP_OPERATION, value: "rent" },
    { label: LEONIX_DP_CATEGORIA_PROPIEDAD, value: "residencial" },
    { label: LEONIX_DP_BEDROOMS_COUNT, value: "2" },
    { label: LEONIX_DP_BATHROOMS_COUNT, value: "2" },
    { label: RENTAS_DP_LISTING_STATUS, value: "disponible" },
    { label: RENTAS_DP_LEASE_TERM, value: "12-meses" },
    { label: RENTAS_DP_DEPOSIT_USD, value: "500" },
  ];
}

async function main(): Promise<void> {
  loadEnvLocal();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !anonKey || !serviceKey) {
    console.log(
      "[rentas-e2e] SKIP: set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY (e.g. in .env.local) to run live DB proof.",
    );
    process.exit(0);
  }

  const idPriv = crypto.randomUUID();
  const idNeg = crypto.randomUUID();
  const ownerId = crypto.randomUUID();
  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

  const cityPriv = `MonterreyE2E-${idPriv.slice(0, 8)}`;
  const cityNeg = `GuadalajaraE2ENeg-${idNeg.slice(0, 8)}`;

  const pairsPriv = [
    ...baseRentasPairs("rentas_privado"),
    { label: LEONIX_DP_POSTAL_CODE, value: "64000" },
    { label: LEONIX_DP_RESULTS_PROPERTY_KIND, value: "casa" },
    { label: LEONIX_DP_PROPERTY_SUBTYPE, value: "casa" },
    { label: LEONIX_DP_HIGHLIGHT_SLUGS, value: "patio" },
    { label: LEONIX_DP_POOL, value: "true" },
  ];

  const pairsNeg = [
    ...baseRentasPairs("rentas_negocio"),
    { label: LEONIX_DP_POSTAL_CODE, value: "44100" },
    { label: LEONIX_DP_RESULTS_PROPERTY_KIND, value: "departamento" },
    { label: LEONIX_DP_PROPERTY_SUBTYPE, value: "apartamento" },
    { label: LEONIX_DP_HIGHLIGHT_SLUGS, value: "balcon" },
    { label: LEONIX_DP_POOL, value: "false" },
  ];

  const boostIso = new Date(Date.now() + 86400000).toISOString();

  const insertPriv = {
    id: idPriv,
    owner_id: ownerId,
    title: "E2E Rentas privado",
    description: "Leonix rentas pipeline smoke (privado).",
    city: cityPriv,
    zip: "64000",
    category: "rentas",
    price: 12500,
    is_free: false,
    contact_phone: "+15555550199",
    contact_email: `e2e-rentas-priv-${idPriv.slice(0, 8)}@test.invalid`,
    status: "active",
    is_published: true,
    seller_type: "personal",
    business_name: null,
    business_meta: null,
    detail_pairs: pairsPriv,
    images: [],
    boost_expires: boostIso,
  };

  const insertNeg = {
    id: idNeg,
    owner_id: ownerId,
    title: "E2E Rentas negocio",
    description: "Leonix rentas pipeline smoke (negocio).",
    city: cityNeg,
    zip: "44100",
    category: "rentas",
    price: 18900,
    is_free: false,
    contact_phone: "+15555550299",
    contact_email: `e2e-rentas-neg-${idNeg.slice(0, 8)}@test.invalid`,
    status: "active",
    is_published: true,
    seller_type: "business",
    business_name: "Inmobiliaria E2E",
    business_meta: JSON.stringify({ negocioDescripcion: "Correduría de prueba e2e." }),
    detail_pairs: pairsNeg,
    images: [],
    boost_expires: null,
  };

  const { error: insErr } = await admin.from("listings").insert([insertPriv, insertNeg]);
  if (insErr) {
    console.error("[rentas-e2e] insert failed:", insErr.message);
    process.exit(1);
  }

  try {
    const browse = await fetchRentasPublicListingsForBrowse("es");
    const ids = new Set(browse.map((l) => l.id));
    assert.ok(ids.has(idPriv), "anon browse should include privado row");
    assert.ok(ids.has(idNeg), "anon browse should include negocio row");

    const privListing = browse.find((l) => l.id === idPriv);
    assert.ok(privListing?.promoted === true, "boost_expires future should set promoted");

    const pCity = parseRentasBrowseParams(new URLSearchParams(`city=${encodeURIComponent(cityPriv)}`));
    const byCity = filterRentasPublicListings(browse, pCity);
    assert.ok(byCity.some((l) => l.id === idPriv), "city filter should find privado listing");

    const pHl = parseRentasBrowseParams(new URLSearchParams("highlights=patio"));
    const byHl = filterRentasPublicListings(browse, pHl);
    assert.ok(byHl.some((l) => l.id === idPriv), "highlight filter should find privado listing");

    const pKind = parseRentasBrowseParams(new URLSearchParams("kind=departamento"));
    const byKind = filterRentasPublicListings(browse, pKind);
    assert.ok(byKind.some((l) => l.id === idNeg), "kind=departamento should find negocio listing");

    const detail = await fetchRentasListingForPublicDetail(idPriv, "es");
    assert.ok(detail, "public detail should load for active published privado row");
    assert.equal(detail!.city, cityPriv);
    assert.equal(detail!.beds, "2");

    const { error: hideErr } = await admin.from("listings").update({ is_published: false }).eq("id", idPriv);
    assert.ok(!hideErr, String(hideErr?.message));
    const hiddenDetail = await fetchRentasListingForPublicDetail(idPriv, "es");
    assert.equal(hiddenDetail, null, "unpublished row must not load on public detail");

    const { error: showErr } = await admin.from("listings").update({ is_published: true }).eq("id", idPriv);
    assert.ok(!showErr, String(showErr?.message));

    const pairsRentado = pairsPriv.map((p) =>
      p.label === RENTAS_DP_LISTING_STATUS ? { ...p, value: "rentado" } : p,
    );
    const { error: rentErr } = await admin.from("listings").update({ detail_pairs: pairsRentado }).eq("id", idPriv);
    assert.ok(!rentErr, String(rentErr?.message));
    const browseAfter = await fetchRentasPublicListingsForBrowse("es");
    assert.ok(!browseAfter.some((l) => l.id === idPriv), "rentado machine status should drop listing from public browse");

    console.log("[rentas-e2e] PASS", { idPriv, idNeg, cityPriv, cityNeg });
  } finally {
    await admin.from("listings").delete().in("id", [idPriv, idNeg]);
  }
}

main().catch((e) => {
  console.error("[rentas-e2e] FAIL", e);
  process.exit(1);
});
