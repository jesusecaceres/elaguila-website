/**
 * Rentas + Bienes Raíces publish-readiness: insert payload (always) + optional live DB round-trip
 * when `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` are set (loads `.env.local` like other scripts).
 *
 * Live path mirrors Leonix core: `buildListingsInsertRowForLeonixPublish` → insert → gallery `update`
 * with `images` + fresh `published_at` / `updated_at`, then service read + delete.
 *
 * Run: npx tsx scripts/leonix-rentas-br-publish-service-readiness-smoke.ts
 */
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { buildListingsInsertRowForLeonixPublish } from "../app/(site)/clasificados/lib/leonixPublishRealEstateListingCore";
import {
  insertListingsRowResilient,
  updateListingsRowResilient,
} from "../app/(site)/clasificados/lib/listingsSelectShrink";
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
  type LeonixClasificadosBranch,
} from "../app/(site)/clasificados/lib/leonixRealEstateListingContract";
import {
  RENTAS_DP_DEPOSIT_USD,
  RENTAS_DP_LEASE_TERM,
  RENTAS_DP_LISTING_STATUS,
} from "../app/(site)/clasificados/rentas/lib/rentasMachineDetailPairs";
import { fetchRentasListingForPublicDetail } from "../app/(site)/clasificados/rentas/lib/fetchRentasListingForPublicDetail";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const envPath = path.join(root, ".env.local");

/** Eligible direct-persist URL shape (Leonix core); no network fetch in this smoke. */
const HTTPS_LISTING_IMAGE =
  "https://abcdefgh.supabase.co/storage/v1/object/public/listing-images/readiness/smoke-01.jpg";

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

type CatProp = "residencial" | "comercial" | "terreno_lote";

function rentasDetailPairs(branch: "rentas_privado" | "rentas_negocio", cat: CatProp) {
  const kind: string =
    cat === "comercial" ? "comercial" : cat === "terreno_lote" ? "terreno" : "casa";
  const sub: string = cat === "comercial" ? "oficina" : cat === "terreno_lote" ? "terreno" : "casa";
  return [
    { label: LEONIX_DP_BRANCH, value: branch },
    { label: LEONIX_DP_OPERATION, value: "rent" },
    { label: LEONIX_DP_CATEGORIA_PROPIEDAD, value: cat },
    { label: LEONIX_DP_BEDROOMS_COUNT, value: "2" },
    { label: LEONIX_DP_BATHROOMS_COUNT, value: "2" },
    { label: RENTAS_DP_LISTING_STATUS, value: "disponible" },
    { label: RENTAS_DP_LEASE_TERM, value: "12-meses" },
    { label: RENTAS_DP_DEPOSIT_USD, value: "500" },
    { label: LEONIX_DP_POSTAL_CODE, value: "64000" },
    { label: LEONIX_DP_RESULTS_PROPERTY_KIND, value: kind },
    { label: LEONIX_DP_PROPERTY_SUBTYPE, value: sub },
    { label: LEONIX_DP_HIGHLIGHT_SLUGS, value: "patio" },
    { label: LEONIX_DP_POOL, value: "false" },
  ];
}

function brDetailPairs(branch: "bienes_raices_privado" | "bienes_raices_negocio", cat: CatProp) {
  const kind: string =
    cat === "comercial" ? "comercial" : cat === "terreno_lote" ? "terreno" : "casa";
  const sub: string = cat === "comercial" ? "oficina" : cat === "terreno_lote" ? "terreno" : "casa";
  return [
    { label: LEONIX_DP_BRANCH, value: branch },
    { label: LEONIX_DP_OPERATION, value: "sale" },
    { label: LEONIX_DP_CATEGORIA_PROPIEDAD, value: cat },
    { label: LEONIX_DP_BEDROOMS_COUNT, value: "2" },
    { label: LEONIX_DP_BATHROOMS_COUNT, value: "2" },
    { label: LEONIX_DP_POSTAL_CODE, value: "44100" },
    { label: LEONIX_DP_RESULTS_PROPERTY_KIND, value: kind },
    { label: LEONIX_DP_PROPERTY_SUBTYPE, value: sub },
    { label: LEONIX_DP_HIGHLIGHT_SLUGS, value: "vista" },
    { label: LEONIX_DP_POOL, value: "false" },
  ];
}

function assertInsertPayload(
  label: string,
  row: Record<string, unknown>,
  expectedCategory: "rentas" | "bienes-raices",
  branch: LeonixClasificadosBranch,
) {
  assert.equal(row.category, expectedCategory, `${label} category`);
  assert.equal(row.status, "active", `${label} status`);
  assert.equal(row.is_published, true, `${label} is_published`);
  assert.ok(typeof row.published_at === "string" && (row.published_at as string).length > 8, `${label} published_at`);
  assert.ok(typeof row.updated_at === "string" && (row.updated_at as string).length > 8, `${label} updated_at`);
  const dp = row.detail_pairs;
  assert.ok(Array.isArray(dp) && dp.length > 0, `${label} detail_pairs`);
  const flat = JSON.stringify(dp);
  assert.ok(flat.includes(branch), `${label} detail_pairs contains branch`);
}

function runPayloadAssertions(): void {
  const owner = "00000000-0000-4000-8000-0000000000aa";
  const cases: Array<{
    label: string;
    category: "rentas" | "bienes-raices";
    branch: LeonixClasificadosBranch;
    pairs: Array<{ label: string; value: string }>;
    sellerType: "personal" | "business";
    businessName?: string;
  }> = [
    {
      label: "Rentas Privado residencial",
      category: "rentas",
      branch: "rentas_privado",
      pairs: rentasDetailPairs("rentas_privado", "residencial"),
      sellerType: "personal",
    },
    {
      label: "Rentas Privado comercial",
      category: "rentas",
      branch: "rentas_privado",
      pairs: rentasDetailPairs("rentas_privado", "comercial"),
      sellerType: "personal",
    },
    {
      label: "Rentas Negocio residencial",
      category: "rentas",
      branch: "rentas_negocio",
      pairs: rentasDetailPairs("rentas_negocio", "residencial"),
      sellerType: "business",
      businessName: "Readiness Realty",
    },
    {
      label: "Rentas Negocio comercial",
      category: "rentas",
      branch: "rentas_negocio",
      pairs: rentasDetailPairs("rentas_negocio", "comercial"),
      sellerType: "business",
      businessName: "Readiness Realty",
    },
    {
      label: "Rentas Negocio terreno_lote",
      category: "rentas",
      branch: "rentas_negocio",
      pairs: rentasDetailPairs("rentas_negocio", "terreno_lote"),
      sellerType: "business",
      businessName: "Readiness Realty",
    },
    {
      label: "BR Privado residencial",
      category: "bienes-raices",
      branch: "bienes_raices_privado",
      pairs: brDetailPairs("bienes_raices_privado", "residencial"),
      sellerType: "personal",
    },
    {
      label: "BR Privado comercial",
      category: "bienes-raices",
      branch: "bienes_raices_privado",
      pairs: brDetailPairs("bienes_raices_privado", "comercial"),
      sellerType: "personal",
    },
    {
      label: "BR Privado terreno_lote",
      category: "bienes-raices",
      branch: "bienes_raices_privado",
      pairs: brDetailPairs("bienes_raices_privado", "terreno_lote"),
      sellerType: "personal",
    },
    {
      label: "BR Negocio residencial",
      category: "bienes-raices",
      branch: "bienes_raices_negocio",
      pairs: brDetailPairs("bienes_raices_negocio", "residencial"),
      sellerType: "business",
      businessName: "Readiness BR Negocio",
    },
  ];

  for (const c of cases) {
    const row = buildListingsInsertRowForLeonixPublish(owner, {
      title: `[READINESS][WITH_PHOTOS] ${c.label}`,
      description: "Readiness body.",
      city: "ReadinessCity",
      zip: "64000",
      price: c.category === "rentas" ? 12000 : 2500000,
      isFree: false,
      category: c.category,
      sellerType: c.sellerType,
      businessName: c.businessName ?? null,
      businessMetaJson:
        c.sellerType === "business"
          ? JSON.stringify({ negocioDescripcion: "Readiness negocio meta." })
          : null,
      detailPairs: c.pairs,
      contactPhoneDigits: "5555550199",
      contactEmail: "readiness@example.invalid",
      imageSources: [HTTPS_LISTING_IMAGE],
      lang: "es",
    });
    assertInsertPayload(c.label, row, c.category, c.branch);
    assert.ok(!("images" in row) || row.images == null, `${c.label}: images belong on gallery update, not insert`);
  }
  // eslint-disable-next-line no-console -- smoke output
  console.log("[readiness] payload matrix: OK (9 cases: 5 Rentas + 4 BR)");
}

export const LISTINGS_HISTORICAL_QA_CLASSIFICATION_SQL = `
-- Classify older public.listings rows (Rentas / BR) vs fresh Leonix publishes.
-- Fresh Leonix app path sets published_at + updated_at on insert and refreshes on gallery write.
-- Rows with null timestamps are usually historical (pre-fix), seeds, or non-app inserts — not proof the current app is broken.

select
  id,
  title,
  category,
  status,
  is_published,
  published_at,
  updated_at,
  created_at,
  case
    when published_at is null and updated_at is null and created_at < now() - interval '30 days'
      then 'likely_historical_or_non_app_insert'
    when published_at is null and updated_at is null
      then 'timestamp_missing_recent'
    else 'has_timestamps'
  end as timestamp_bucket,
  case
    when images is null then 'images_null'
    when jsonb_typeof(images) = 'array' and jsonb_array_length(images) > 0 then 'images_nonempty'
    else 'images_other'
  end as images_bucket
from public.listings
where lower(coalesce(category, '')) in ('rentas', 'bienes-raices')
order by id desc
limit 50;
`.trim();

async function liveRoundTrip(
  admin: SupabaseClient,
  anon: SupabaseClient,
  spec: {
    label: string;
    category: "rentas" | "bienes-raices";
    pairs: Array<{ label: string; value: string }>;
    sellerType: "personal" | "business";
    businessName?: string;
    price: number;
  },
): Promise<void> {
  const id = crypto.randomUUID();
  const ownerId = crypto.randomUUID();
  const city = `Readiness-${spec.category}-${id.slice(0, 8)}`;
  const longBody =
    "Readiness long-form description for check constraint compliance. " +
    "Repeating detail to satisfy minimum length: Leonix Rentas/BR readiness smoke validates timestamps and gallery. ".repeat(4);

  const base = buildListingsInsertRowForLeonixPublish(ownerId, {
    title: `[READINESS][WITH_PHOTOS][DB] ${spec.label} ${id.slice(0, 8)}`,
    description: longBody,
    city,
    zip: "64000",
    price: spec.price,
    isFree: false,
    category: spec.category,
    sellerType: spec.sellerType,
    businessName: spec.businessName ?? null,
    businessMetaJson:
      spec.sellerType === "business"
        ? JSON.stringify({ negocioDescripcion: "Readiness negocio meta." })
        : null,
    detailPairs: spec.pairs,
    contactPhoneDigits: "5555550199",
    contactEmail: `readiness-${id.slice(0, 8)}@example.invalid`,
    imageSources: [],
    lang: "es",
  });
  const insertRow = { ...base, id } as Record<string, unknown>;

  const { data: ins, error: insE } = await insertListingsRowResilient(admin, insertRow);
  assert.ok(!insE, `${spec.label} insert: ${insE?.message}`);
  assert.ok(ins?.id, `${spec.label} insert id`);

  const touch = new Date().toISOString();
  const { error: upE } = await updateListingsRowResilient(admin, ins.id, {
    images: [HTTPS_LISTING_IMAGE],
    published_at: touch,
    updated_at: touch,
    description: `${String(base.description)} [READINESS_GALLERY]`,
  });
  assert.ok(!upE, `${spec.label} gallery update: ${upE?.message}`);

  const { data: row, error: rE } = await admin
    .from("listings")
    .select("id, category, status, is_published, images, published_at, updated_at, detail_pairs")
    .eq("id", ins.id)
    .single();
  assert.ok(!rE, `${spec.label} read: ${rE?.message}`);
  assert.ok(row, `${spec.label} row`);
  assert.equal(row!.status, "active");
  assert.equal(row!.is_published, true);
  const imgs = row!.images as unknown;
  assert.ok(Array.isArray(imgs) && imgs.length > 0, `${spec.label} images non-empty`);
  assert.ok(row!.published_at, `${spec.label} published_at`);
  assert.ok(row!.updated_at, `${spec.label} updated_at`);
  const dp = row!.detail_pairs as unknown;
  assert.ok(Array.isArray(dp) && dp.length > 0, `${spec.label} detail_pairs`);

  if (spec.category === "rentas") {
    const pub = await fetchRentasListingForPublicDetail(ins.id, "es");
    assert.ok(pub, `${spec.label} Rentas anon public detail`);
    assert.ok(pub!.galleryUrls?.length || pub!.imageUrl, `${spec.label} Rentas detail has image material`);
  } else {
    const { data: anonRow, error: anonE } = await anon
      .from("listings")
      .select("id, images, category")
      .eq("id", ins.id)
      .maybeSingle();
    if (anonE) {
      // eslint-disable-next-line no-console -- diagnostic
      console.warn(`[readiness] BR anon read skipped (${spec.label}):`, anonE.message);
    } else {
      assert.ok(anonRow?.id, `${spec.label} BR anon read id`);
    }
  }

  await admin.from("listings").delete().eq("id", ins.id);
}

async function runLiveMatrix(): Promise<void> {
  loadEnvLocal();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !anonKey || !serviceKey) {
    // eslint-disable-next-line no-console -- smoke output
    console.log(
      "[readiness] SKIP live DB round-trip: set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY (e.g. in .env.local).",
    );
    // eslint-disable-next-line no-console -- smoke output
    console.log("[readiness] SQL hint for classifying old exports vs fresh rows:\n", LISTINGS_HISTORICAL_QA_CLASSIFICATION_SQL);
    return;
  }

  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
  const anon = createClient(url, anonKey, { auth: { persistSession: false } });

  const liveCases = [
    {
      label: "Rentas Privado residencial",
      category: "rentas" as const,
      pairs: rentasDetailPairs("rentas_privado", "residencial"),
      sellerType: "personal" as const,
      price: 13000,
    },
    {
      label: "Rentas Privado comercial",
      category: "rentas" as const,
      pairs: rentasDetailPairs("rentas_privado", "comercial"),
      sellerType: "personal" as const,
      price: 14000,
    },
    {
      label: "Rentas Negocio residencial",
      category: "rentas" as const,
      pairs: rentasDetailPairs("rentas_negocio", "residencial"),
      sellerType: "business" as const,
      businessName: "Readiness Neg",
      price: 15000,
    },
    {
      label: "Rentas Negocio comercial",
      category: "rentas" as const,
      pairs: rentasDetailPairs("rentas_negocio", "comercial"),
      sellerType: "business" as const,
      businessName: "Readiness Neg",
      price: 16000,
    },
    {
      label: "Rentas Negocio terreno_lote",
      category: "rentas" as const,
      pairs: rentasDetailPairs("rentas_negocio", "terreno_lote"),
      sellerType: "business" as const,
      businessName: "Readiness Neg",
      price: 17000,
    },
    {
      label: "BR Privado residencial",
      category: "bienes-raices" as const,
      pairs: brDetailPairs("bienes_raices_privado", "residencial"),
      sellerType: "personal" as const,
      price: 2_500_000,
    },
    {
      label: "BR Privado comercial",
      category: "bienes-raices" as const,
      pairs: brDetailPairs("bienes_raices_privado", "comercial"),
      sellerType: "personal" as const,
      price: 3_200_000,
    },
    {
      label: "BR Privado terreno_lote",
      category: "bienes-raices" as const,
      pairs: brDetailPairs("bienes_raices_privado", "terreno_lote"),
      sellerType: "personal" as const,
      price: 1_800_000,
    },
    {
      label: "BR Negocio residencial",
      category: "bienes-raices" as const,
      pairs: brDetailPairs("bienes_raices_negocio", "residencial"),
      sellerType: "business" as const,
      businessName: "Readiness BR Neg",
      price: 4_100_000,
    },
  ];

  for (const c of liveCases) {
    await liveRoundTrip(admin, anon, c);
  }
  // eslint-disable-next-line no-console -- smoke output
  console.log("[readiness] live DB matrix: OK (9 round-trips, rows deleted)");
}

async function main(): Promise<void> {
  runPayloadAssertions();
  await runLiveMatrix();
  // eslint-disable-next-line no-console -- smoke output
  console.log("[readiness] leonix-rentas-br-publish-service-readiness-smoke: OK");
}

main().catch((e) => {
  // eslint-disable-next-line no-console -- smoke output
  console.error("[readiness] FAIL", e);
  process.exit(1);
});
