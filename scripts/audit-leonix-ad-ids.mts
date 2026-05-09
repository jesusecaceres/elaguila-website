/**
 * Guard: published classified rows must have well-formed, unique `leonix_ad_id` values.
 *
 * Env (from `.env` / `.env.local`):
 * - `NEXT_PUBLIC_SUPABASE_URL`
 * - `SUPABASE_SERVICE_ROLE_KEY` (service role — read-only usage here)
 *
 * Exit 0 — all checks pass, or skipped when Supabase is not configured locally.
 * Exit 1 — missing IDs, duplicates, or unexpected ID prefix for category/table.
 *
 * Run: `npm run audit:leonix-ad-ids`
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/** Mirrors `listingsLeonixPrefixForCategory` / SQL `leonix_listings_prefix` (keep in sync with migrations). */
function listingsLeonixPrefixForCategory(categorySlug: string): string {
  const s = (categorySlug ?? "").trim().toLowerCase();
  switch (s) {
    case "en-venta":
      return "SALE";
    case "rentas":
      return "RENT";
    case "clases":
      return "CLASS";
    case "comunidad":
      return "COM";
    case "travel":
    case "viajes":
      return "TRAV";
    case "autos":
      return "AUTO";
    case "empleos":
      return "JOB";
    default:
      return "LIST";
  }
}

const LX_FORMATTED_RE = /^[A-Z]{2,5}-\d{4}-\d{6}$/;

function isWellFormedLeonixAdId(value: string | null | undefined): boolean {
  const v = (value ?? "").trim();
  return LX_FORMATTED_RE.test(v);
}

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

function recordDupes(seen: Map<string, string>, dupes: Set<string>, id: string, leonix: string) {
  const prev = seen.get(leonix);
  if (prev && prev !== id) dupes.add(leonix);
  seen.set(leonix, id);
}

async function pagedSelect<T extends Record<string, unknown>>(
  sb: SupabaseClient,
  table: string,
  cols: string,
): Promise<{ rows: T[]; err: string | null }> {
  const pageSize = 1000;
  const rows: T[] = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await sb.from(table).select(cols).range(from, from + pageSize - 1);
    if (error) return { rows: [], err: error.message };
    const chunk = (data ?? []) as unknown as T[];
    rows.push(...chunk);
    if (chunk.length < pageSize) break;
  }
  return { rows, err: null };
}

async function main() {
  loadEnvFiles();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) {
    console.log(
      "LEONIX_AD_IDS_AUDIT_SKIP — NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set; skipped (configure for CI/staging).",
    );
    process.exit(0);
  }

  const sb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const failures: string[] = [];

  type RowLx = { id: string; leonix_ad_id?: string | null };

  const dedicated: {
    table: "restaurantes_public_listings" | "servicios_public_listings" | "empleos_public_listings" | "autos_classifieds_listings";
    prefix: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- PostgREST chain typing differs after `.select()`.
    applyPublished: (q: any) => any;
  }[] = [
    {
      table: "restaurantes_public_listings",
      prefix: "REST",
      applyPublished: (q) => q.eq("status", "published"),
    },
    {
      table: "servicios_public_listings",
      prefix: "SERV",
      applyPublished: (q) => q.eq("listing_status", "published"),
    },
    {
      table: "empleos_public_listings",
      prefix: "JOB",
      applyPublished: (q) => q.eq("lifecycle_status", "published"),
    },
    {
      table: "autos_classifieds_listings",
      prefix: "AUTO",
      applyPublished: (q) => q.eq("status", "active"),
    },
  ];

  for (const d of dedicated) {
    const { rows, err } = await pagedSelect<RowLx>(sb, d.table, "id, leonix_ad_id");
    if (err) {
      failures.push(`${d.table}: fetch failed: ${err}`);
      continue;
    }
    const seen = new Map<string, string>();
    const dupes = new Set<string>();
    for (const r of rows) {
      const v = String(r.leonix_ad_id ?? "").trim();
      if (!v) continue;
      recordDupes(seen, dupes, r.id, v);
    }
    if (dupes.size) failures.push(`${d.table}: duplicate leonix_ad_id: ${[...dupes].slice(0, 8).join(", ")}`);

    const q0 = d.applyPublished(sb.from(d.table).select("id", { count: "exact", head: true })).is("leonix_ad_id", null);
    const q1 = d.applyPublished(sb.from(d.table).select("id", { count: "exact", head: true })).eq("leonix_ad_id", "");
    const [m0, m1] = await Promise.all([q0, q1]);
    const missingPub = (m0.count ?? 0) + (m1.count ?? 0);
    if (m0.error || m1.error) {
      failures.push(`${d.table}: published/live Leonix count failed: ${m0.error?.message ?? m1.error?.message}`);
    } else if (missingPub > 0) {
      failures.push(`${d.table}: ${missingPub} published/live row(s) missing leonix_ad_id`);
    }

    for (const r of rows) {
      const v = String(r.leonix_ad_id ?? "").trim();
      if (!v) continue;
      if (!isWellFormedLeonixAdId(v)) failures.push(`${d.table}: malformed ${v}`);
      else if (!v.startsWith(`${d.prefix}-`)) failures.push(`${d.table}: id ${v} does not start with ${d.prefix}-`);
    }
  }

  const { rows: listRows, err: listErr } = await pagedSelect<{ id: string; leonix_ad_id?: string | null; category?: string | null }>(
    sb,
    "listings",
    "id, leonix_ad_id, category",
  );
  if (listErr) failures.push(`listings: fetch failed: ${listErr}`);
  else {
    const seen = new Map<string, string>();
    const dupes = new Set<string>();
    for (const r of listRows) {
      const v = String(r.leonix_ad_id ?? "").trim();
      if (!v) continue;
      recordDupes(seen, dupes, r.id, v);
    }
    if (dupes.size) failures.push(`listings: duplicate leonix_ad_id: ${[...dupes].slice(0, 5).join(", ")}`);
    const missing = listRows.filter((r) => !String(r.leonix_ad_id ?? "").trim()).length;
    if (missing) failures.push(`listings: ${missing} row(s) missing leonix_ad_id`);
    for (const r of listRows) {
      const v = String(r.leonix_ad_id ?? "").trim();
      if (!v) continue;
      const cat = String(r.category ?? "").trim();
      const expectedPrefix = listingsLeonixPrefixForCategory(cat);
      const m = v.match(/^([A-Z]+)-/);
      const pfx = m?.[1];
      if (!isWellFormedLeonixAdId(v)) failures.push(`listings: malformed ${v} (category=${cat})`);
      else if (pfx && pfx !== expectedPrefix) {
        failures.push(`listings: prefix ${pfx} !== expected ${expectedPrefix} for category=${cat} (${v})`);
      }
    }
  }

  const { data: viaRows, error: viaErr } = await sb
    .from("viajes_staged_listings")
    .select("id, leonix_ad_id, lifecycle_status, is_public")
    .eq("lifecycle_status", "approved")
    .eq("is_public", true);
  if (viaErr) {
    if (String(viaErr.message).toLowerCase().includes("column") && String(viaErr.message).includes("leonix")) {
      failures.push("viajes_staged_listings.leonix_ad_id missing — apply latest Supabase migrations.");
    } else {
      failures.push(`viajes_staged_listings: ${viaErr.message}`);
    }
  } else {
    const rows = (viaRows ?? []) as { id: string; leonix_ad_id?: string | null }[];
    const seen = new Map<string, string>();
    const dupes = new Set<string>();
    for (const r of rows) {
      const v = String(r.leonix_ad_id ?? "").trim();
      if (!v) continue;
      recordDupes(seen, dupes, r.id, v);
    }
    if (dupes.size) failures.push(`viajes_staged_listings: duplicate leonix_ad_id: ${[...dupes].join(", ")}`);
    const missing = rows.filter((r) => !String(r.leonix_ad_id ?? "").trim()).length;
    if (missing) failures.push(`viajes_staged_listings: ${missing} approved+public row(s) missing leonix_ad_id`);
    for (const r of rows) {
      const v = String(r.leonix_ad_id ?? "").trim();
      if (!v) continue;
      if (!v.startsWith("TRAV-") || !isWellFormedLeonixAdId(v)) failures.push(`viajes_staged_listings: expected TRAV-* format, got ${v}`);
    }
  }

  const corePath = resolve(process.cwd(), "app/admin/_lib/listingsAdminSelect.ts");
  if (existsSync(corePath)) {
    const src = readFileSync(corePath, "utf8");
    if (!src.includes("leonix_ad_id")) {
      failures.push("listingsAdminSelect.ts does not reference leonix_ad_id in LISTINGS_ADMIN_CORE");
    }
  }

  if (failures.length) {
    console.error("LEONIX_AD_IDS_AUDIT_FAIL");
    for (const f of failures) console.error(" -", f);
    process.exit(1);
  }

  console.log("LEONIX_AD_IDS_AUDIT_OK — no missing published IDs, no duplicates, prefixes consistent.");
  process.exit(0);
}

void main();
