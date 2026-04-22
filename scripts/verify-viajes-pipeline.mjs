/**
 * Viajes go-live verification (target DB, no browser):
 * - Loads `.env.local` into process.env when present
 * - Proves REST reachability with service role (clear HTTP errors on 401/missing table)
 * - Counts rows and asserts zero `owner_user_id IS NULL` (after owner-not-null migration)
 *
 * Run: node scripts/verify-viajes-pipeline.mjs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const envPath = path.join(root, ".env.local");

function loadEnvLocal() {
  if (!fs.existsSync(envPath)) return;
  const text = fs.readFileSync(envPath, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!m) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (!process.env[m[1]]) process.env[m[1]] = v;
  }
}

function ok(msg) {
  console.log("[viajes-verify] OK:", msg);
}

/** GET with Prefer: count=exact — returns Content-Range: 0-0/N */
async function restCountExact(baseUrl, hdr, filter = "") {
  const q = filter ? `&${filter}` : "";
  const url = `${baseUrl}/rest/v1/viajes_staged_listings?select=id${q}`;
  const res = await fetch(url, { headers: { ...hdr, Prefer: "count=exact" } });
  const body = await res.text();
  if (!res.ok) {
    let hint = body;
    try {
      const j = JSON.parse(body);
      hint = [j.message, j.hint, j.code].filter(Boolean).join(" | ") || body;
    } catch {
      /* raw */
    }
    return { ok: false, status: res.status, hint };
  }
  const cr = res.headers.get("content-range");
  const m = cr?.match(/\/(\d+)$/);
  const total = m ? parseInt(m[1], 10) : null;
  return { ok: true, status: res.status, total, contentRange: cr };
}

async function main() {
  loadEnvLocal();

  const baseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/$/, "");
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

  if (!baseUrl) throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set.");
  ok(`NEXT_PUBLIC_SUPABASE_URL host: ${new URL(baseUrl).host}`);

  if (!service) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set — cannot verify DB.");
  ok("SUPABASE_SERVICE_ROLE_KEY is set (value not printed)");

  if (!anon) throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY is not set.");
  ok("NEXT_PUBLIC_SUPABASE_ANON_KEY is set (value not printed)");

  const hdr = {
    apikey: service,
    Authorization: `Bearer ${service}`,
    Accept: "application/json",
  };

  const ping = await restCountExact(baseUrl, hdr);
  if (!ping.ok) {
    if (ping.status === 401) {
      throw new Error(
        `REST 401 on viajes_staged_listings: ${ping.hint} — SUPABASE_SERVICE_ROLE_KEY does not match NEXT_PUBLIC_SUPABASE_URL (wrong key or wrong project). Fix .env.local / Vercel env for the launch Supabase project, then rerun.`,
      );
    }
    if (ping.status === 404 || /relation|does not exist|schema cache/i.test(String(ping.hint))) {
      throw new Error(
        `Table missing or not exposed (HTTP ${ping.status}): ${ping.hint} — apply supabase/migrations/20260410180000_viajes_staged_listings.sql to this database.`,
      );
    }
    throw new Error(`viajes_staged_listings unreachable (HTTP ${ping.status}): ${ping.hint}`);
  }

  ok(`viajes_staged_listings reachable (total rows ≈ ${ping.total ?? "?"}, Content-Range: ${ping.contentRange ?? "?"})`);

  const nulls = await restCountExact(baseUrl, hdr, "owner_user_id=is.null");
  if (!nulls.ok) {
    throw new Error(`null-owner count query failed: HTTP ${nulls.status} ${nulls.hint}`);
  }
  if (nulls.total != null && nulls.total > 0) {
    throw new Error(
      `Found ${nulls.total} row(s) with owner_user_id IS NULL — apply supabase/migrations/20260410200000_viajes_staged_owner_not_null.sql on this database.`,
    );
  }
  ok("owner_user_id IS NULL count is 0");

  console.log("[viajes-verify] All automated checks passed.");
}

main().catch((err) => {
  const msg = err instanceof Error ? err.message : String(err);
  console.error("[viajes-verify] FAIL:", msg);
  process.exitCode = 1;
});
