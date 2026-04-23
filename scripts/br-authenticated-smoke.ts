/**
 * Authenticated BR smoke: sign in with email/password, insert two `listings` rows (Privado + Negocio lane),
 * verify anon catalog read + in-process filter contract, then delete rows (service role) unless keep-rows mode.
 *
 * Requires in `.env.local` or process env:
 * - NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
 * - SUPABASE_SERVICE_ROLE_KEY (default-run cleanup; still required for failure-path cleanup)
 * - BR_SMOKE_EMAIL, BR_SMOKE_PASSWORD (test user with permission to INSERT into `listings` per RLS)
 *
 * Optional:
 * - BR_SMOKE_KEEP_ROWS=1 — skip successful-run delete; print listing IDs + routes for UI QA. Cleanup later:
 *   `npx tsx scripts/br-smoke-cleanup.ts --ids <id1>,<id2>` or `--title-prefix br-smoke-`
 *
 * Run: npx tsx scripts/br-authenticated-smoke.ts
 */

import { strict as assert } from "node:assert";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

import { filterBrListings } from "../app/(site)/clasificados/bienes-raices/resultados/lib/brResultsFilters";
import { mapBrListingRowToNegocioCard, type BrListingDbRow } from "../app/(site)/clasificados/bienes-raices/resultados/lib/mapBrListingRowToCard";
import { parseBrResultsUrl } from "../app/(site)/clasificados/bienes-raices/resultados/lib/brResultsUrlState";

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

function parseKeepRowsEnv(): boolean {
  const raw = (process.env.BR_SMOKE_KEEP_ROWS ?? "").trim().toLowerCase();
  return raw === "1" || raw === "true" || raw === "yes" || raw === "on";
}

function baseOriginForQaLinks(): string {
  const site = (process.env.NEXT_PUBLIC_SITE_URL ?? "").trim().replace(/\/+$/, "");
  if (site) return site;
  const v = (process.env.VERCEL_URL ?? "").trim();
  if (v) return v.startsWith("http") ? v : `https://${v}`;
  return "http://localhost:3000";
}

function printVisualFinishLineQa(privId: string, negId: string, stamp: string): void {
  const origin = baseOriginForQaLinks();
  const abs = (path: string) => `${origin}${path}`;

  console.log("");
  console.log("BR_AUTH_SMOKE_KEEP_ROWS=1 — rows were NOT deleted. Manual UI / QA checks:");
  console.log("");
  console.log("Listing IDs (Privado):", privId);
  console.log("Listing IDs (Negocio):", negId);
  console.log("Title stamp (for search / filters):", stamp);
  console.log("");
  console.log("Expected routes (paths):");
  console.log(`  /clasificados/anuncio/${privId}`);
  console.log(`  /clasificados/anuncio/${negId}`);
  console.log("  /clasificados/bienes-raices");
  console.log("  /clasificados/bienes-raices/resultados");
  console.log("  /dashboard/mis-anuncios");
  console.log("  /admin/workspace/clasificados");
  console.log("");
  console.log("Suggested full URLs (set NEXT_PUBLIC_SITE_URL for your deploy origin):");
  console.log(`  ${abs(`/clasificados/anuncio/${privId}`)}`);
  console.log(`  ${abs(`/clasificados/anuncio/${negId}`)}`);
  console.log(`  ${abs("/clasificados/bienes-raices")}`);
  console.log(`  ${abs("/clasificados/bienes-raices/resultados")}`);
  console.log(`  ${abs("/dashboard/mis-anuncios")}`);
  console.log(`  ${abs("/admin/workspace/clasificados")}`);
  console.log("");
  console.log("Cleanup when done:");
  console.log(`  npx tsx scripts/br-smoke-cleanup.ts --ids ${privId},${negId}`);
  console.log(`  npx tsx scripts/br-smoke-cleanup.ts --title-prefix ${stamp}`);
  console.log("");
}

function machinePairs(
  branch: "bienes_raices_privado" | "bienes_raices_negocio",
  operation: "sale" | "rent"
): Array<{ label: string; value: string }> {
  return [
    { label: "Leonix:branch", value: branch },
    { label: "Leonix:operation", value: operation },
    { label: "Leonix:categoria_propiedad", value: "residencial" },
    { label: "Leonix:results_property_kind", value: "casa" },
    { label: "Leonix:bedrooms_count", value: "3" },
    { label: "Leonix:bathrooms_count", value: "2" },
    { label: "Leonix:pets_allowed", value: "true" },
    { label: "Leonix:pool", value: "true" },
    { label: "Leonix:furnished", value: "true" },
    { label: "Leonix:postal_code", value: "90210" },
  ];
}

async function main() {
  hydrateEnv();
  const keepRows = parseKeepRowsEnv();
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
  const anon = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();
  const service = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();
  const email = (process.env.BR_SMOKE_EMAIL ?? "").trim();
  const password = (process.env.BR_SMOKE_PASSWORD ?? "").trim();

  if (!email || !password) {
    console.error(
      "BR_AUTH_SMOKE=BLOCKED_BY_AUTH missing BR_SMOKE_EMAIL or BR_SMOKE_PASSWORD (add to .env.local for this smoke)"
    );
    process.exit(2);
  }
  if (!url || !anon) {
    console.error("BR_AUTH_SMOKE=BLOCKED_BY_ENV missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
    process.exit(2);
  }
  if (!service) {
    console.error(
      "BR_AUTH_SMOKE=BLOCKED_BY_ENV missing SUPABASE_SERVICE_ROLE_KEY (required for default-run delete and failure-path cleanup)"
    );
    process.exit(2);
  }

  const userClient = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: signData, error: signErr } = await userClient.auth.signInWithPassword({ email, password });
  if (signErr || !signData.user) {
    console.error("BR_AUTH_SMOKE=BLOCKED_BY_AUTH signIn failed", signErr?.message ?? "no user");
    process.exit(2);
  }

  const stamp = `br-smoke-${Date.now()}`;
  const ownerId = signData.user.id;

  const baseRow = {
    owner_id: ownerId,
    description: `Smoke ${stamp}.`,
    city: "Monterrey",
    category: "bienes-raices",
    price: 450000,
    is_free: false,
    contact_phone: "15555550199",
    contact_email: email,
    status: "active",
    is_published: true,
  };

  const privInsert = {
    ...baseRow,
    title: `${stamp} Privado`,
    seller_type: "personal",
    detail_pairs: machinePairs("bienes_raices_privado", "sale"),
  };
  const negInsert = {
    ...baseRow,
    title: `${stamp} Negocio`,
    seller_type: "business",
    business_name: "Smoke Realty QA",
    detail_pairs: machinePairs("bienes_raices_negocio", "rent"),
  };

  const { data: privRow, error: pErr } = await userClient.from("listings").insert([privInsert]).select("id").single();
  if (pErr || !privRow?.id) {
    console.error("BR_AUTH_SMOKE=FAIL privado insert", pErr?.message);
    process.exit(1);
  }
  const { data: negRow, error: nErr } = await userClient.from("listings").insert([negInsert]).select("id").single();
  if (nErr || !negRow?.id) {
    console.error("BR_AUTH_SMOKE=FAIL negocio insert", nErr?.message);
    await cleanup(service, url, [String(privRow.id)]);
    process.exit(1);
  }

  const privId = String(privRow.id);
  const negId = String(negRow.id);

  const anonBrowse = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: catalog, error: cErr } = await anonBrowse
    .from("listings")
    .select(
      "id, title, description, city, price, is_free, images, detail_pairs, seller_type, business_name, created_at, updated_at, published_at, status, is_published"
    )
    .eq("category", "bienes-raices")
    .eq("is_published", true)
    .eq("status", "active")
    .in("id", [privId, negId]);
  if (cErr) {
    console.error("BR_AUTH_SMOKE=FAIL anon catalog read", cErr.message);
    await cleanup(service, url, [privId, negId]);
    process.exit(1);
  }
  const rows = (catalog ?? []) as BrListingDbRow[];
  assert.equal(rows.length, 2, "anon browse should return both smoke rows");

  const cards = rows.map((r) => mapBrListingRowToNegocioCard(r, "es"));
  const poolState = parseBrResultsUrl(
    new URLSearchParams(
      `lang=es&operationType=venta&propertyType=casa&city=Monterrey&pets=true&pool=true&furnished=true&zip=90210&q=${encodeURIComponent(stamp)}`
    )
  );
  const filtered = filterBrListings(cards, poolState, "residencial");
  assert.ok(filtered.some((c) => c.id === privId), "privado row should match facet filters");
  const negState = parseBrResultsUrl(
    new URLSearchParams(`lang=es&operationType=renta&sellerType=negocio&city=Monterrey&q=${encodeURIComponent(stamp)}`)
  );
  const negFiltered = filterBrListings(cards, negState, "residencial");
  assert.ok(negFiltered.some((c) => c.id === negId), "negocio row should match renta + negocio lane");

  if (keepRows) {
    printVisualFinishLineQa(privId, negId, stamp);
  } else {
    await cleanup(service, url, [privId, negId]);
  }

  console.log("BR_AUTH_SMOKE=OK");
  console.log("BR_AUTH_SMOKE_LISTING_IDS=", JSON.stringify({ privado: privId, negocio: negId }));
  if (keepRows) {
    console.log("BR_AUTH_SMOKE_KEEP_ROWS=1 (rows left in DB for visual QA)");
  }
}

async function cleanup(serviceKey: string, url: string, ids: string[]) {
  const admin: SupabaseClient = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  await admin.from("listings").delete().in("id", ids);
}

main().catch((e) => {
  console.error("BR_AUTH_SMOKE=FAIL", e);
  process.exit(1);
});
