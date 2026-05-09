/**
 * One-off diagnostics: fetch a `listings` row by id (service role) and print media-related fields
 * plus the mapped `RentasPublicListing` gallery/cover/video.
 *
 * Requires: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 * Run: npx tsx scripts/rentas-inspect-listing-media.ts [listing-uuid]
 *
 * Default id is the Rentas SATY listing referenced in smoke docs (override when stale).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { mapListingRowToRentasPublicListing } from "../app/(site)/clasificados/rentas/data/mapListingRowToRentasPublicListing";
import { parseLeonixImageUrlsFromDescription } from "../app/(site)/clasificados/lib/leonixListingGalleryMarker";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const envPath = path.join(root, ".env.local");

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

const DEFAULT_ID = "7705fd56-9b80-4b99-970e-d4c039608b75";

async function main(): Promise<void> {
  loadEnvLocal();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const id = (process.argv[2] ?? DEFAULT_ID).trim();
  if (!url || !serviceKey) {
    console.log(
      "[rentas-inspect-media] SKIP: set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (e.g. .env.local) to inspect a row.",
    );
    process.exit(0);
  }
  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
  const { data, error } = await admin
    .from("listings")
    .select("id, category, title, images, description, detail_pairs, created_at")
    .eq("id", id)
    .maybeSingle();
  if (error) {
    console.error("[rentas-inspect-media] query error:", error.message);
    process.exit(1);
  }
  if (!data) {
    console.log("[rentas-inspect-media] no row for id:", id);
    process.exit(0);
  }
  const row = data as Record<string, unknown>;
  const desc = typeof row.description === "string" ? row.description : "";
  const markerUrls = parseLeonixImageUrlsFromDescription(desc);
  const mapped = mapListingRowToRentasPublicListing(row, "es");
  console.log(
    JSON.stringify(
      {
        id: row.id,
        category: row.category,
        created_at: row.created_at,
        rawImages: row.images,
        descriptionLen: desc.length,
        leonixMarkerUrlCount: markerUrls.length,
        leonixMarkerUrlsPreview: markerUrls.slice(0, 4),
        mappedCover: mapped?.imageUrl ?? null,
        mappedGalleryCount: mapped?.galleryUrls?.length ?? 0,
        mappedGalleryPreview: (mapped?.galleryUrls ?? []).slice(0, 6),
        mappedVideoUrl: mapped?.videoUrl ?? null,
      },
      null,
      2,
    ),
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
