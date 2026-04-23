/**
 * BR catalog smoke: anon REST read against `public.listings` (same keys as browser client).
 * Proves project URL + anon key can read published BR rows when RLS allows catalog select.
 *
 * Run: npx tsx scripts/br-supabase-anon-smoke.ts
 *
 * Exit 0 + SKIPPED when env missing (Gate 2: BLOCKED_BY_ENV — not a code failure).
 * Exit 1 when env present but HTTP/JSON indicates failure (Gate 2: BLOCKED_BY_RUNTIME or policy).
 */

import { strict as assert } from "node:assert";

const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim().replace(/\/+$/, "");
const anon = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();

function classifySkip(): never {
  // eslint-disable-next-line no-console
  console.log("BR_SUPABASE_ANON_SMOKE=SKIPPED_BLOCKED_BY_ENV missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  process.exit(0);
}

async function main() {
  if (!url || !anon) classifySkip();

  const qs = new URLSearchParams({
    category: "eq.bienes-raices",
    is_published: "eq.true",
    status: "eq.active",
    select: "id,title,is_published,status,category",
    limit: "5",
  });
  const endpoint = `${url}/rest/v1/listings?${qs.toString()}`;
  const res = await fetch(endpoint, {
    headers: {
      apikey: anon,
      Authorization: `Bearer ${anon}`,
      Accept: "application/json",
    },
  });
  const text = await res.text();
  if (!res.ok) {
    // eslint-disable-next-line no-console
    console.error("BR_SUPABASE_ANON_SMOKE=FAIL", res.status, text.slice(0, 500));
    process.exit(1);
  }
  const rows = JSON.parse(text) as unknown[];
  assert.ok(Array.isArray(rows), "expected JSON array from PostgREST");
  // eslint-disable-next-line no-console
  console.log("BR_SUPABASE_ANON_SMOKE=OK rows=", rows.length);
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error("BR_SUPABASE_ANON_SMOKE=FAIL", e);
  process.exit(1);
});
