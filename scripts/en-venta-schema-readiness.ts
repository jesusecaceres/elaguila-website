/**
 * En Venta Gate 0 — schema readiness (repo migrations + optional live DB probe).
 *
 * - Always verifies required migration files exist on disk.
 * - If NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY are set (valid service_role JWT),
 *   probes `public.messages` and `public.listings` via PostgREST (same stack as inquiry route).
 *
 * Exit 0 — migrations on disk; DB probe skipped or succeeded.
 * Exit 1 — BLOCKED_BY_ENV (migration files missing from repo).
 * Exit 2 — BLOCKED_BY_ENV (bad/missing URL or service key when DB probe requested).
 * Exit 3 — BLOCKED_BY_RUNTIME / external: linked Supabase project missing applied migrations.
 *
 * Run: npx tsx scripts/en-venta-schema-readiness.ts
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { createClient } from "@supabase/supabase-js";

const REQUIRED_MIGRATIONS = [
  "supabase/migrations/20250312000001_listing_reports.sql",
  "supabase/migrations/20250313000001_messages.sql",
  "supabase/migrations/20260410140000_messages_read_at.sql",
] as const;

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

function assertRepoMigrations(): void {
  for (const rel of REQUIRED_MIGRATIONS) {
    const p = resolve(process.cwd(), rel);
    if (!existsSync(p)) {
      console.error(`BLOCKED_BY_ENV (repo) missing migration file: ${rel}`);
      process.exit(1);
    }
    const body = readFileSync(p, "utf8");
    if (rel.includes("messages.sql") && !/CREATE TABLE IF NOT EXISTS messages/i.test(body)) {
      console.error(`BLOCKED_BY_ENV (repo) migration ${rel} does not define messages table`);
      process.exit(1);
    }
  }
  console.log("en-venta-schema-readiness: repo migrations present", REQUIRED_MIGRATIONS.join(", "));
}

async function probeLiveDb(): Promise<void> {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim().replace(/\/$/, "");
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();
  const anon = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();

  if (!url || !key) {
    console.warn(
      "en-venta-schema-readiness: EN_VENTA_SCHEMA_DB_PROBE_SKIP=(set NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY to verify linked DB has public.messages)",
    );
    return;
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
      `BLOCKED_BY_ENV SUPABASE_SERVICE_ROLE_KEY is an anon JWT. Use service_role from Supabase Dashboard → Settings → API. host=${urlHost}`,
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
      `BLOCKED_BY_ENV project ref mismatch: URL ref "${urlRef}" ≠ service_role JWT ref "${serviceRef}".`,
    );
    process.exit(2);
  }

  if (anon && urlRef) {
    const anonRef = jwtPayloadRef(anon);
    if (anonRef && anonRef !== urlRef) {
      console.error(
        `BLOCKED_BY_ENV anon key project ref "${anonRef}" ≠ URL ref "${urlRef}". Align keys with the same project.`,
      );
      process.exit(2);
    }
  }

  const sb = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { error: msgErr } = await sb.from("messages").select("id").limit(1);
  if (msgErr) {
    const hint = /could not find the table|does not exist|schema cache/i.test(String(msgErr.message))
      ? " Apply supabase/migrations/20250313000001_messages.sql (and 20260410140000_messages_read_at.sql) to this project."
      : "";
    console.error("BLOCKED_BY_RUNTIME", msgErr.message, `host=${urlHost}${hint}`);
    process.exit(3);
  }

  const { error: readAtErr } = await sb.from("messages").select("read_at").limit(1);
  if (readAtErr && /column|schema cache/i.test(String(readAtErr.message))) {
    console.error(
      "BLOCKED_BY_RUNTIME",
      readAtErr.message,
      `host=${urlHost} messages.read_at missing — apply supabase/migrations/20260410140000_messages_read_at.sql`,
    );
    process.exit(3);
  }

  const { error: listErr } = await sb.from("listings").select("id,category,status").eq("category", "en-venta").limit(1);
  if (listErr) {
    const hint = /could not find the table|does not exist|schema cache/i.test(String(listErr.message))
      ? " Ensure public.listings exists (base migrations)."
      : "";
    console.error("BLOCKED_BY_RUNTIME", listErr.message, `host=${urlHost}${hint}`);
    process.exit(3);
  }

  console.log("EN_VENTA_SCHEMA_DB_OK", `host=${urlHost} urlRef=${urlRef ?? "?"}`);
}

async function main() {
  loadEnvFiles();
  assertRepoMigrations();
  await probeLiveDb();
  console.log("en-venta-schema-readiness: ok");
}

main().catch((e) => {
  console.error("BLOCKED_BY_RUNTIME", String((e as Error)?.message ?? e));
  process.exit(3);
});
