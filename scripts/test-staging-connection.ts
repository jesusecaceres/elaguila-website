import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";

// Load .env.local manually
const envPath = path.resolve(__dirname, "..", ".env.local");
const envContent = fs.readFileSync(envPath, "utf8");
for (const line of envContent.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eqIdx = trimmed.indexOf("=");
  if (eqIdx === -1) continue;
  const key = trimmed.slice(0, eqIdx).trim();
  const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
  if (!process.env[key]) process.env[key] = val;
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  // Check all 5 Program 4 tables
  const tables = [
    "business_consent_records",
    "business_source_links", 
    "business_source_files",
    "business_ai_research_runs",
    "business_ai_briefing_drafts",
  ];
  for (const t of tables) {
    const { error } = await admin.from(t).select("*").limit(0);
    console.log(`Table ${t}:`, error ? `MISSING/ERROR: ${error.message}` : "EXISTS");
  }

  // Check feature flags
  const { data: flags, error: fe } = await admin.from("business_identity_flags").select("*").in("flag_key", ["field_discovery_canvassing", "field_discovery_ai_research"]);
  console.log("\nFeature flags:", fe ? `ERROR: ${fe.message}` : JSON.stringify(flags, null, 2));

  // Fetch OpenAPI spec for all Program 4 table definitions
  const resp = await fetch(url + "/rest/v1/", {
    headers: { apikey: serviceKey, Authorization: "Bearer " + serviceKey },
  });
  const spec = await resp.json() as any;
  const defs = Object.keys(spec.definitions || {}).filter((k: string) =>
    k.includes("business_consent") || k.includes("business_source") || k.includes("business_ai")
  );
  console.log("\nProgram 4 tables in OpenAPI:", defs.join(", "));

  for (const table of defs) {
    const def = spec.definitions[table];
    const props = def?.properties || {};
    const required = def?.required || [];
    console.log(`\n${table}:`);
    for (const [col, info] of Object.entries(props)) {
      const r = required.includes(col) ? " NOT NULL" : "";
      const t = (info as any).type || (info as any).format || "unknown";
      console.log(`  ${col}: ${t}${r}`);
    }
  }
}

main().catch(console.error);
