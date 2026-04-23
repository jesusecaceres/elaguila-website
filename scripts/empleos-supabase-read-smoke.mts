/**
 * Empleos Gate 2 — read-only Supabase check (service role).
 * Proves `empleos_public_listings` is reachable with current env keys.
 *
 * Exit 0 + EMPLEOS_DB_READ_OK — query succeeded (table may be empty).
 * Exit 2 — BLOCKED_BY_ENV (missing URL or service role key).
 * Exit 3 — BLOCKED_BY_EXTERNAL_SERVICE / BLOCKED_BY_RUNTIME (client/query failure).
 *
 * Loads `.env.local` then `.env` from repo root (same keys developers use for `next dev`).
 *
 * Run: npx tsx scripts/empleos-supabase-read-smoke.mts
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { createClient } from "@supabase/supabase-js";

function loadEnvLocalFirst() {
  for (const name of [".env.local", ".env"]) {
    const p = resolve(process.cwd(), name);
    if (!existsSync(p)) continue;
    const txt = readFileSync(p, "utf8");
    for (const line of txt.split("\n")) {
      const s = line.trim();
      if (!s || s.startsWith("#")) continue;
      const eq = s.indexOf("=");
      if (eq <= 0) continue;
      const k = s.slice(0, eq).trim();
      let v = s.slice(eq + 1).trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      if (process.env[k] === undefined) process.env[k] = v;
    }
  }
}

async function main() {
  loadEnvLocalFirst();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("BLOCKED_BY_ENV missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    process.exit(2);
  }
  const sb = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error } = await sb.from("empleos_public_listings").select("id").limit(1);
  if (error) {
    console.error("BLOCKED_BY_EXTERNAL_SERVICE", error.message);
    process.exit(3);
  }
  console.log("EMPLEOS_DB_READ_OK");
}

main().catch((e) => {
  console.error("BLOCKED_BY_RUNTIME", String((e as Error)?.message ?? e));
  process.exit(3);
});
