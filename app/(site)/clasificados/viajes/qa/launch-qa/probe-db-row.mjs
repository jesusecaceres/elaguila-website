import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";

function loadEnv() {
  for (const f of [".env.local", ".env"]) {
    if (!existsSync(f)) continue;
    for (const line of readFileSync(f, "utf8").split(/\r?\n/)) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (!m) continue;
      if (!process.env[m[1]]) {
        let v = m[2].trim();
        if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
          v = v.slice(1, -1);
        }
        process.env[m[1]] = v;
      }
    }
  }
}

loadEnv();
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("missing supabase env");
  process.exit(1);
}
const sb = createClient(url, key, { auth: { persistSession: false } });
const id = "7070d94c-1e52-4a0d-8f8d-20e19f29953a";
const { data, error } = await sb
  .from("viajes_staged_listings")
  .select("id,slug,lifecycle_status,is_public,title,published_at,updated_at")
  .eq("id", id)
  .maybeSingle();
console.log(JSON.stringify({ error, data }, null, 2));
const { count } = await sb
  .from("viajes_staged_listings")
  .select("id", { count: "exact", head: true })
  .eq("lifecycle_status", "approved")
  .eq("is_public", true);
console.log("approved_public_count", count);
