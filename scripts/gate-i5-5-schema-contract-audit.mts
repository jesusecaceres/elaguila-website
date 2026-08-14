/**
 * Gate I.5.5 — read-only schema contract audit. Service role, SELECT only, no writes.
 * Verifies column existence for `listings.views` and `profiles.disabled` / `profiles.is_disabled`
 * against the live database (migrations can drift from production). Counts/booleans only, no PII.
 *
 * Env loading matches `scripts/empleos-supabase-read-smoke.mts` (proven safe pattern in repo).
 *
 * Run: npx tsx scripts/gate-i5-5-schema-contract-audit.mts
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { createClient } from "@supabase/supabase-js";

/** Mirrors the corrected `EN_VENTA_LISTING_PUBLIC_ROW_BASE` (enVentaListingPublicSelect.ts) — kept
 * as a literal here rather than importing app code into this standalone Node script. */
const EN_VENTA_LISTING_PUBLIC_ROW_BASE_FIXED =
  "id, owner_id, title, description, city, zip, category, price, is_free, detail_pairs, listing_json, seller_type, business_name, status, is_published, created_at, images, rentas_tier, published_at, republished_at, republish_sort_at, admin_promoted, leonix_ad_id, mux_playback_id";

function loadEnvFiles() {
  for (const name of [".env", ".env.local"]) {
    const p = resolve(process.cwd(), name);
    if (!existsSync(p)) continue;
    const text = readFileSync(p, "utf8");
    for (const line of text.split(/\r?\n/)) {
      const m = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
      if (!m) continue;
      const k = m[1];
      let v = m[2].trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      if (v !== "") process.env[k] = v;
    }
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function checkColumn(sb: any, table: string, column: string): Promise<{ exists: boolean; message?: string }> {
  const { error } = await sb.from(table).select(`id,${column}`).limit(1);
  if (!error) return { exists: true };
  const msg = String(error.message ?? "");
  if (/column .* does not exist/i.test(msg) || /could not find/i.test(msg)) {
    return { exists: false, message: msg };
  }
  // Any other error (e.g. RLS) is inconclusive, not a confirmed "column missing" — report as such.
  return { exists: false, message: `INCONCLUSIVE: ${msg}` };
}

async function main() {
  loadEnvFiles();
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim().replace(/\/$/, "");
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();
  if (!url || !key) {
    console.error("BLOCKED_BY_ENV missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    process.exit(2);
  }
  const sb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

  console.log("GATE_I5_5_SCHEMA_CONTRACT_AUDIT");

  const listingsViews = await checkColumn(sb, "listings", "views");
  console.log(`listings.views exists=${listingsViews.exists}${listingsViews.message ? ` (${listingsViews.message})` : ""}`);

  const profilesDisabled = await checkColumn(sb, "profiles", "disabled");
  console.log(`profiles.disabled exists=${profilesDisabled.exists}${profilesDisabled.message ? ` (${profilesDisabled.message})` : ""}`);

  const profilesIsDisabled = await checkColumn(sb, "profiles", "is_disabled");
  console.log(`profiles.is_disabled exists=${profilesIsDisabled.exists}${profilesIsDisabled.message ? ` (${profilesIsDisabled.message})` : ""}`);

  // Per-column check of every field in the corrected En Venta select. Any hit here besides
  // `views` (already checked above) is a DIFFERENT finding: these three (listing_json,
  // republish_sort_at, admin_promoted) are defined by recent, active migrations
  // (20260518112000_gate12d_listing_structured_payload.sql,
  // 20260509120000_classifieds_republish_capability.sql,
  // 20260628180000_admin_live_schema_drift_fix_01.sql) not yet applied to this production
  // project — "migrations pending," not "obsolete" like `views`. `listingsQueryWithSelectShrink`
  // already handles their absence safely and will pick them up automatically once migrated;
  // Gate I.5.5 deliberately does NOT remove them (see report Table A/C).
  for (const col of EN_VENTA_LISTING_PUBLIC_ROW_BASE_FIXED.split(",").map((s) => s.trim())) {
    const r = await checkColumn(sb, "listings", col);
    console.log(`listings.${col} exists=${r.exists}${r.message ? ` (${r.message})` : ""}`);
  }

  // Old shape (with `views`) — reproduces the confirmed 400.
  const { error: enVentaErrOld } = await sb
    .from("listings")
    .select("id,title,city,price,images,views")
    .eq("category", "en-venta")
    .limit(1);
  console.log(`en_venta_select_with_views_ok=${!enVentaErrOld}${enVentaErrOld ? ` (${enVentaErrOld.message})` : ""}`);

  // Corrected shape as a RAW query (no shrink loop) — still expected to fail on the three
  // pending-migration columns above; this only proves `views` is no longer one of the failures.
  // The real runtime path (`queryEnVentaBrowseListings`) goes through `listingsQueryWithSelectShrink`,
  // which already absorbs those three safely — that resilience is intentionally kept, not removed.
  const { error: enVentaErrFixed } = await sb
    .from("listings")
    .select(EN_VENTA_LISTING_PUBLIC_ROW_BASE_FIXED)
    .eq("category", "en-venta")
    .eq("status", "active")
    .limit(1);
  const stillFailsOnPendingMigrationColumnOnly =
    !!enVentaErrFixed && /listing_json|republish_sort_at|admin_promoted/.test(String(enVentaErrFixed.message ?? ""));
  console.log(
    `en_venta_corrected_select_raw_ok=${!enVentaErrFixed}${enVentaErrFixed ? ` (${enVentaErrFixed.message})` : ""} ` +
      `— fails only on a pending-migration column (expected, shrink loop handles it)=${stillFailsOnPendingMigrationColumnOnly}`,
  );
}

main().catch((e) => {
  console.error("BLOCKED_BY_RUNTIME", String((e as Error)?.message ?? e));
  process.exit(3);
});
