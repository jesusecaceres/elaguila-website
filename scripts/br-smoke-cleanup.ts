/**
 * Delete BR smoke `listings` rows created for QA (service role).
 *
 * Provide exactly one of:
 *   --ids <uuid>[,<uuid>...]
 *   --title-prefix <string>  (matches `listings.title` ILIKE `<prefix>%` AND category `bienes-raices`)
 *
 * Requires: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 * Run: npx tsx scripts/br-smoke-cleanup.ts --ids <id>
 */

import { createClient } from "@supabase/supabase-js";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

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

function hydrateEnv(): void {
  loadEnvFile(".env.local");
  loadEnvFile(".env");
}

function isUuid(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s.trim());
}

function parseArgs(argv: string[]): { mode: "ids"; ids: string[] } | { mode: "prefix"; prefix: string } | null {
  const idsFlag = argv.indexOf("--ids");
  const prefixFlag = argv.indexOf("--title-prefix");
  if (idsFlag >= 0 && prefixFlag >= 0) {
    console.error("BR_SMOKE_CLEANUP=FAIL pass only one of --ids or --title-prefix");
    return null;
  }
  if (idsFlag >= 0) {
    const raw = (argv[idsFlag + 1] ?? "").trim();
    if (!raw) {
      console.error("BR_SMOKE_CLEANUP=FAIL --ids requires a comma-separated UUID list");
      return null;
    }
    const ids = raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const bad = ids.filter((id) => !isUuid(id));
    if (bad.length) {
      console.error("BR_SMOKE_CLEANUP=FAIL invalid UUID(s):", bad.join(", "));
      return null;
    }
    if (!ids.length) {
      console.error("BR_SMOKE_CLEANUP=FAIL --ids is empty");
      return null;
    }
    return { mode: "ids", ids };
  }
  if (prefixFlag >= 0) {
    const prefix = (argv[prefixFlag + 1] ?? "").trim();
    if (!prefix) {
      console.error("BR_SMOKE_CLEANUP=FAIL --title-prefix requires a non-empty string");
      return null;
    }
    return { mode: "prefix", prefix };
  }
  console.error("BR_SMOKE_CLEANUP=FAIL pass --ids <uuid>[,...] or --title-prefix <string>");
  return null;
}

async function main() {
  hydrateEnv();
  const parsed = parseArgs(process.argv.slice(2));
  if (!parsed) process.exit(2);

  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
  const service = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();
  if (!url || !service) {
    console.error("BR_SMOKE_CLEANUP=BLOCKED_BY_ENV missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    process.exit(2);
  }

  const admin = createClient(url, service, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  if (parsed.mode === "ids") {
    const { error, count } = await admin.from("listings").delete({ count: "exact" }).in("id", parsed.ids);
    if (error) {
      console.error("BR_SMOKE_CLEANUP=FAIL", error.message);
      process.exit(1);
    }
    console.log("BR_SMOKE_CLEANUP=OK mode=ids deleted_rows=", count ?? "?");
    return;
  }

  const { data: rows, error: selErr } = await admin
    .from("listings")
    .select("id")
    .eq("category", "bienes-raices")
    .ilike("title", `${parsed.prefix}%`);
  if (selErr) {
    console.error("BR_SMOKE_CLEANUP=FAIL select", selErr.message);
    process.exit(1);
  }
  const ids = (rows ?? []).map((r) => String((r as { id: string }).id)).filter(Boolean);
  if (!ids.length) {
    console.log("BR_SMOKE_CLEANUP=OK mode=title-prefix deleted_rows=0 (no matches)");
    return;
  }
  const { error: delErr, count } = await admin.from("listings").delete({ count: "exact" }).in("id", ids);
  if (delErr) {
    console.error("BR_SMOKE_CLEANUP=FAIL delete", delErr.message);
    process.exit(1);
  }
  console.log("BR_SMOKE_CLEANUP=OK mode=title-prefix matched=", ids.length, "deleted_rows=", count ?? "?");
}

main().catch((e) => {
  console.error("BR_SMOKE_CLEANUP=FAIL", e);
  process.exit(1);
});
