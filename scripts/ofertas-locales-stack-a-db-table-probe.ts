/**
 * Stack A — read-only probe for Ofertas Locales AI scan tables (service role).
 * Run: npx tsx scripts/ofertas-locales-stack-a-db-table-probe.ts
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function loadEnvFile(name: string): void {
  const p = path.join(ROOT, name);
  if (!fs.existsSync(p)) return;
  for (const line of fs.readFileSync(p, "utf8").split(/\r?\n/)) {
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
    if (!process.env[key]) process.env[key] = val;
  }
}

function classifyStatus(httpStatus: number, body: string): string {
  if (httpStatus === 200) return "EXISTS";
  const lower = body.toLowerCase();
  if (
    httpStatus === 404 ||
    lower.includes("does not exist") ||
    lower.includes("could not find the table") ||
    lower.includes("pgrst205")
  ) {
    return "MISSING";
  }
  return `ERROR_HTTP_${httpStatus}`;
}

async function probeTable(baseUrl: string, key: string, table: string): Promise<{ status: string; detail: string }> {
  const endpoint = `${baseUrl}/rest/v1/${table}?select=id&limit=1`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(endpoint, {
      signal: controller.signal,
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        Accept: "application/json",
      },
    });
    const text = await res.text();
    return { status: classifyStatus(res.status, text), detail: text.slice(0, 240) };
  } catch (err) {
    return {
      status: "ERROR",
      detail: err instanceof Error ? err.message : String(err),
    };
  } finally {
    clearTimeout(timer);
  }
}

async function main() {
  loadEnvFile(".env.local");
  loadEnvFile(".env");

  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim().replace(/\/+$/, "");
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();

  if (!url || !key) {
    console.log("DB_PROBE=SKIPPED missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    process.exit(0);
  }

  const tables = ["ofertas_locales", "oferta_local_scan_jobs", "oferta_local_items"] as const;
  const out: Record<string, { status: string; detail: string }> = {};

  for (const table of tables) {
    out[table] = await probeTable(url, key, table);
  }

  console.log(JSON.stringify(out, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
