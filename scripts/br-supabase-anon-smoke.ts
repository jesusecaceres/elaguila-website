/**
 * BR catalog smoke: anon REST read against `public.listings` (PostgREST, same keys as browser).
 *
 * Run: npx tsx scripts/br-supabase-anon-smoke.ts
 *
 * Loads `.env.local` from repo root when `NEXT_PUBLIC_*` are missing from the process environment
 * (so `npx tsx` matches what `next dev` / `next build` typically see).
 *
 * Exit 0 + SKIPPED when URL/anon still missing after load → **BLOCKED_BY_ENV** (classification only).
 * Exit 1 when keys present but HTTP fails → **BLOCKED_BY_RUNTIME** (RLS, wrong project, network).
 * Exit 0 + OK when 200 and JSON array.
 */

import { strict as assert } from "node:assert";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** Minimal `.env.local` / `.env` parser: `KEY=value`, strips optional quotes; no export keyword. */
function loadEnvFile(name: string): void {
  const p = path.join(repoRoot, name);
  if (!fs.existsSync(p)) return;
  const text = fs.readFileSync(p, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq < 1) continue;
    const key = t.slice(0, eq).trim();
    let val = t.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined || process.env[key] === "") {
      process.env[key] = val;
    }
  }
}

function hydrateSupabaseEnvFromFiles(): void {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return;
  loadEnvFile(".env.local");
  loadEnvFile(".env");
}

function classifySkip(): never {
  // eslint-disable-next-line no-console
  console.log(
    "BR_SUPABASE_ANON_SMOKE=SKIPPED_BLOCKED_BY_ENV missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY (after .env.local/.env load)"
  );
  process.exit(0);
}

async function main() {
  hydrateSupabaseEnvFromFiles();
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim().replace(/\/+$/, "");
  const anon = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();
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
    console.error("BR_SUPABASE_ANON_SMOKE=FAIL_BLOCKED_BY_RUNTIME", res.status, text.slice(0, 500));
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
