/**
 * Read-only check: `public.listing_analytics` exists and PostgREST exposes required columns.
 *
 * Uses the same anon key as the browser app (no service role required for SELECT if RLS allows).
 *
 * Env: `.env` / `.env.local` — `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
 *
 * Exit 0 — LISTING_ANALYTICS_OK (table readable; column projection succeeds).
 * Exit 1 — LISTING_ANALYTICS_FAIL (missing table, schema cache, RLS block, or missing column).
 *
 * Run (against the project in your env files, e.g. production after `vercel env pull`):
 *   npx tsx scripts/verify-listing-analytics-table.mts
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { createClient } from "@supabase/supabase-js";

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

const SELECT_COLS =
  "id, listing_id, event_type, user_id, created_at, event_source, owner_user_id, anonymous_session_id, category, metadata";

async function main() {
  loadEnvFiles();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anon) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in .env / .env.local");
    process.exit(1);
  }

  const sb = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } });
  const { error, data } = await sb.from("listing_analytics").select(SELECT_COLS).limit(1);

  if (error) {
    console.error("LISTING_ANALYTICS_FAIL:", error.message ?? error);
    if (String(error.message).toLowerCase().includes("schema cache")) {
      console.error("Hint: apply pending migrations on this Supabase project, then reload schema (SQL: NOTIFY pgrst, 'reload schema'; ) or restart the API from the dashboard.");
    }
    process.exit(1);
  }

  console.log("LISTING_ANALYTICS_OK — table readable; columns:", SELECT_COLS.replace(/\s+/g, " "));
  console.log("Rows sampled:", Array.isArray(data) ? data.length : 0, "(limit 1)");
  process.exit(0);
}

void main();
