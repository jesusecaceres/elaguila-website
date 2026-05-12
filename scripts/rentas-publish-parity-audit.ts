/**
 * Static audit: Rentas public reads / publish writes both use `public.listings` with `category = 'rentas'`.
 * Run: npx tsx scripts/rentas-publish-parity-audit.ts
 *
 * Production Supabase: run the SQL block printed by `printSql()` (or copy from `RENTAS_SUPABASE_AUDIT_SQL` below)
 * and paste results back when debugging empty browse/detail.
 */
import assert from "node:assert/strict";
import { buildListingsInsertRowForLeonixPublish } from "../app/(site)/clasificados/lib/leonixPublishRealEstateListingCore";
import {
  RENTAS_LISTING_PUBLIC_ROW_BASE,
  RENTAS_LISTING_PUBLIC_ROW_RICH,
} from "../app/(site)/clasificados/rentas/lib/rentasListingPublicSelect";

/** Table Rentas browse + detail + publish all use (not `servicios_public_listings` / `restaurantes_public_listings`). */
export const RENTAS_PUBLIC_TABLE = "listings";

export const RENTAS_SUPABASE_AUDIT_SQL = `
-- 1) Schema: public.listings (adjust if your project uses a different schema)
select
  column_name,
  data_type
from information_schema.columns
where table_schema = 'public'
  and table_name = 'listings'
order by ordinal_position;

-- 2) Status on core listings (Rentas uses text column "status" + RLS; not listing_status)
select
  coalesce(nullif(trim(lower(status)), ''), '(empty)') as status_norm,
  count(*) as total
from public.listings
where lower(coalesce(category, '')) = 'rentas'
group by 1
order by total desc;

-- 3) Recent rentas rows (add published_at/updated_at to select after schema (1) shows they exist)
select
  id,
  title,
  category,
  status,
  is_published,
  published_at,
  updated_at,
  images,
  price,
  city
from public.listings
where lower(coalesce(category, '')) = 'rentas'
order by id desc
limit 25;

-- 4) Optional timestamps (uncomment after schema check shows these columns exist)
-- select id, created_at, published_at, republished_at, republish_sort_at
-- from public.listings
-- where lower(coalesce(category, '')) = 'rentas'
-- order by coalesce(republish_sort_at, published_at, created_at) desc nulls last
-- limit 25;

-- 5) Specific listing (replace UUID if needed)
select *
from public.listings
where id = '7705fd56-9b80-4b99-970e-d4c039608b75'::uuid;
`.trim();

function printSql() {
  // eslint-disable-next-line no-console -- audit script output
  console.info("\n--- Copy/paste into Supabase SQL editor ---\n");
  // eslint-disable-next-line no-console -- audit script output
  console.info(RENTAS_SUPABASE_AUDIT_SQL.trim());
  // eslint-disable-next-line no-console -- audit script output
  console.info("\n--- end ---\n");
}

function main() {
  const cols = RENTAS_LISTING_PUBLIC_ROW_RICH.split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  assert.ok(cols.includes("id"), "select includes id");
  assert.ok(cols.includes("detail_pairs"), "select includes detail_pairs");
  assert.ok(cols.includes("images"), "Rentas public select must include images (browse/detail parity vs publish write)");
  assert.ok(cols.includes("updated_at"), "Rentas public select must include updated_at for browse ordering fallback");
  assert.ok(!cols.includes("leonix_ad_id"), "Rentas public select must not require leonix_ad_id (Servicios-lesson)");

  const insert = buildListingsInsertRowForLeonixPublish("00000000-0000-4000-8000-000000000001", {
    title: "Audit",
    description: "Audit body",
    city: "Oakland",
    price: 1000,
    isFree: false,
    category: "rentas",
    sellerType: "personal",
    detailPairs: [{ label: "Leonix:branch", value: "rentas_privado" }],
    contactPhoneDigits: null,
    contactEmail: null,
    imageSources: [],
    lang: "es",
  });
  const keys = Object.keys(insert);
  assert.ok(keys.includes("owner_id"));
  assert.ok(keys.includes("category"));
  assert.equal(insert.category, "rentas");
  assert.ok(keys.includes("published_at"), "Leonix publish insert sets published_at");
  assert.ok(keys.includes("updated_at"), "Leonix publish insert sets updated_at");
  assert.ok(!keys.includes("leonix_ad_id"), "publish insert must not send leonix_ad_id on core listings");

  assert.ok(RENTAS_LISTING_PUBLIC_ROW_RICH.startsWith(RENTAS_LISTING_PUBLIC_ROW_BASE.split(",")[0]!));

  printSql();
  // eslint-disable-next-line no-console -- audit script output
  console.info("rentas-publish-parity-audit: OK");
}

main();
