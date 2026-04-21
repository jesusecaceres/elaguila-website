/**
 * Viajes go-live verification (no browser):
 * - Loads `.env.local` into process.env when present
 * - Confirms Supabase URL + service role + anon are set
 * - Queries `viajes_staged_listings` count via service role (proves table reachable)
 *
 * Run: node scripts/verify-viajes-pipeline.mjs
 */

import { createClient } from "@supabase/supabase-js";
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

loadEnvLocal();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function fail(msg) {
  console.error("[viajes-verify] FAIL:", msg);
  process.exit(1);
}

function ok(msg) {
  console.log("[viajes-verify] OK:", msg);
}

if (!url) fail("NEXT_PUBLIC_SUPABASE_URL is not set (add to .env.local for local verify).");
ok("NEXT_PUBLIC_SUPABASE_URL is set");

if (!service) fail("SUPABASE_SERVICE_ROLE_KEY is not set — cannot verify DB.");
ok("SUPABASE_SERVICE_ROLE_KEY is set");

if (!anon) fail("NEXT_PUBLIC_SUPABASE_ANON_KEY is not set — owner Bearer submit will not work.");
ok("NEXT_PUBLIC_SUPABASE_ANON_KEY is set");

const admin = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });
const { count, error } = await admin.from("viajes_staged_listings").select("id", { count: "exact", head: true });
if (error) {
  const detail = [error.message, error.code, error.details].filter(Boolean).join(" | ");
  fail(
    `viajes_staged_listings query failed: ${detail || "(no message)"} — apply migration supabase/migrations/20260410180000_viajes_staged_listings.sql`
  );
}
ok(`viajes_staged_listings reachable (count=${count ?? "?"})`);

console.log("[viajes-verify] All automated checks passed.");
