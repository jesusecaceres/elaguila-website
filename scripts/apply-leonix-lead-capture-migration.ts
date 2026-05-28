/**
 * Apply lead capture migration when a direct Postgres URL is available.
 *
 * Set in .env.local (from Supabase Dashboard → Project Settings → Database → Connection string):
 *   SUPABASE_DB_URL=postgresql://postgres.[ref]:[password]@...
 *
 * Run: npx tsx scripts/apply-leonix-lead-capture-migration.ts
 *
 * Preferred for most setups (tracks migration history):
 *   npx supabase login
 *   npx supabase link --project-ref <your-project-ref>
 *   npx supabase db push
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const envPath = path.join(root, ".env.local");
const migrationPath = path.join(root, "supabase/migrations/20260527200000_leonix_lead_capture.sql");

function loadEnvLocal(): void {
  if (!fs.existsSync(envPath)) return;
  const text = fs.readFileSync(envPath, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!m) continue;
    let v = m[2]!.trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (!process.env[m[1]!]) process.env[m[1]!] = v;
  }
}

async function main(): Promise<void> {
  loadEnvLocal();
  const dbUrl = process.env.SUPABASE_DB_URL?.trim() || process.env.DATABASE_URL?.trim();
  if (!dbUrl) {
    console.error("Missing SUPABASE_DB_URL or DATABASE_URL in .env.local.");
    console.error("Use Supabase CLI instead:");
    console.error("  npx supabase login");
    console.error("  npx supabase link --project-ref <ref>");
    console.error("  npx supabase db push");
    process.exit(1);
  }
  if (!fs.existsSync(migrationPath)) {
    console.error("Migration file not found:", migrationPath);
    process.exit(1);
  }
  const sql = fs.readFileSync(migrationPath, "utf8");
  const client = new pg.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    await client.query(sql);
    console.log("Applied:", migrationPath);
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
