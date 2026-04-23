/**
 * Empleos Gate 2 — read-only Supabase check (service role).
 * Proves `empleos_public_listings` is reachable with current env keys.
 *
 * Exit 0 + EMPLEOS_DB_READ_OK — query succeeded (table may be empty).
 * Exit 2 — BLOCKED_BY_ENV (missing URL/key, wrong key *type* e.g. anon in service slot, URL/JWT project ref mismatch).
 * Exit 3 — BLOCKED_BY_EXTERNAL_SERVICE / BLOCKED_BY_RUNTIME (Supabase rejects a well-formed service_role JWT).
 *
 * Env loading matches `scripts/verify-viajes-pipeline.mjs` (proven in repo): `.env.local` then `.env`, line regex, CRLF-safe.
 *
 * Run: npx tsx scripts/empleos-supabase-read-smoke.mts
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { createClient } from "@supabase/supabase-js";

function loadEnvFiles() {
  /** `.env` then `.env.local` so local overrides (and overwrites empty shell placeholders). */
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

/** `https://<ref>.supabase.co` → project ref */
function supabaseProjectRefFromUrl(baseUrl: string): string | null {
  try {
    const h = new URL(baseUrl.trim()).hostname;
    const m = /^([^.]+)\.supabase\.co$/i.exec(h);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

function jwtPayloadPart(jwt: string): Record<string, unknown> | null {
  try {
    const parts = String(jwt).split(".");
    if (parts.length < 2) return null;
    const pad = parts[1].length % 4 === 0 ? "" : "=".repeat(4 - (parts[1].length % 4));
    const json = Buffer.from(parts[1].replace(/-/g, "+").replace(/_/g, "/") + pad, "base64").toString("utf8");
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function jwtPayloadRef(jwt: string): string | null {
  const p = jwtPayloadPart(jwt);
  return typeof p?.ref === "string" ? p.ref : null;
}

function jwtPayloadRole(jwt: string): string | null {
  const p = jwtPayloadPart(jwt);
  return typeof p?.role === "string" ? p.role : null;
}

async function main() {
  loadEnvFiles();

  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim().replace(/\/$/, "");
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();
  const anon = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();

  if (!url || !key) {
    console.error("BLOCKED_BY_ENV missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    process.exit(2);
  }

  const urlHost = (() => {
    try {
      return new URL(url).host;
    } catch {
      return "(invalid-url)";
    }
  })();

  const urlRef = supabaseProjectRefFromUrl(url);
  const keyParts = key.split(".").length;
  const serviceRole = jwtPayloadRole(key);
  const serviceRef = jwtPayloadRef(key);

  if (keyParts !== 3) {
    console.error(
      `BLOCKED_BY_ENV SUPABASE_SERVICE_ROLE_KEY must be a 3-segment JWT (got ${keyParts} segments). host=${urlHost}`,
    );
    process.exit(2);
  }

  if (serviceRole === "anon") {
    console.error(
      `BLOCKED_BY_ENV SUPABASE_SERVICE_ROLE_KEY is an anon JWT (role=anon). Use the service_role secret from Supabase Dashboard → Settings → API. host=${urlHost} urlRef=${urlRef ?? "?"}`,
    );
    process.exit(2);
  }

  if (serviceRole !== "service_role") {
    console.error(
      `BLOCKED_BY_ENV SUPABASE_SERVICE_ROLE_KEY JWT role is "${serviceRole ?? "?"}" (expected service_role). host=${urlHost}`,
    );
    process.exit(2);
  }

  if (urlRef && serviceRef && urlRef !== serviceRef) {
    console.error(
      `BLOCKED_BY_ENV project ref mismatch: NEXT_PUBLIC_SUPABASE_URL ref "${urlRef}" ≠ service_role JWT ref "${serviceRef}". host=${urlHost}`,
    );
    process.exit(2);
  }

  if (anon && urlRef) {
    const anonRef = jwtPayloadRef(anon);
    if (anonRef && anonRef !== urlRef) {
      console.error(
        `BLOCKED_BY_ENV anon key project ref "${anonRef}" ≠ URL ref "${urlRef}". Align NEXT_PUBLIC_SUPABASE_ANON_KEY with the same project as the URL.`,
      );
      process.exit(2);
    }
  }

  const sb = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  // Minimal schema verification for launch: required tables + metrics columns.
  const { error } = await sb.from("empleos_public_listings").select("id,apply_count,view_count").limit(1);
  if (error) {
    const hint =
      /could not find the table|does not exist|schema cache/i.test(String(error.message))
        ? " Apply repo migrations starting at supabase/migrations/20260410210000_empleos_public_listings.sql to this Supabase project."
        : "";
    console.error(
      "BLOCKED_BY_EXTERNAL_SERVICE",
      error.message,
      `host=${urlHost} urlRef=${urlRef ?? "?"} jwtRef=${serviceRef ?? "?"}${hint}`,
    );
    process.exit(3);
  }

  const { error: appsErr } = await sb.from("empleos_job_applications").select("id,listing_id").limit(1);
  if (appsErr) {
    console.error(
      "BLOCKED_BY_EXTERNAL_SERVICE",
      appsErr.message,
      `host=${urlHost} urlRef=${urlRef ?? "?"} jwtRef=${serviceRef ?? "?"}`,
    );
    process.exit(3);
  }
  console.log("EMPLEOS_DB_READ_OK", `host=${urlHost} urlRef=${urlRef ?? "?"}`);
}

main().catch((e) => {
  console.error("BLOCKED_BY_RUNTIME", String((e as Error)?.message ?? e));
  process.exit(3);
});
