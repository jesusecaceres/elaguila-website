import "server-only";

import fs from "fs";
import path from "path";
import type { ServiciosBusinessProfile } from "@/app/servicios/types/serviciosBusinessProfile";
import { SERVICIOS_LISTING_STATUS_PUBLISHED } from "./serviciosListingLifecycle";
import type { ServiciosPublicListingRow } from "./serviciosPublicListingsServer";

const FILE_NAME = ".servicios-dev-publishes.json";

type DevFileShape = {
  version: 1;
  updatedAt: string;
  rows: ServiciosPublicListingRow[];
};

function devFilePath(): string {
  return path.join(process.cwd(), FILE_NAME);
}

/**
 * Dev/test-only persistence: writes published Servicios rows to a gitignored JSON file on disk
 * so `next dev` discovery (landing, results, slug SSR) can see listings without Supabase.
 *
 * - ON when `NODE_ENV === "development"` unless `SERVICIOS_DEV_PUBLISH === "0"`.
 * - ON when `SERVICIOS_DEV_PUBLISH === "1"` (e.g. staging smoke tests).
 * - OFF in production unless explicitly forced with `SERVICIOS_DEV_PUBLISH === "1"` (not recommended).
 */
export function isServiciosDevPublishPersistenceEnabled(): boolean {
  if (process.env.SERVICIOS_DEV_PUBLISH === "0") return false;
  if (process.env.SERVICIOS_DEV_PUBLISH === "1") return true;
  return process.env.NODE_ENV === "development";
}

function readFileSafe(): DevFileShape {
  const p = devFilePath();
  try {
    if (!fs.existsSync(p)) return { version: 1, updatedAt: new Date().toISOString(), rows: [] };
    const raw = fs.readFileSync(p, "utf8");
    const j = JSON.parse(raw) as DevFileShape;
    if (!j || j.version !== 1 || !Array.isArray(j.rows)) return { version: 1, updatedAt: new Date().toISOString(), rows: [] };
    return j;
  } catch {
    return { version: 1, updatedAt: new Date().toISOString(), rows: [] };
  }
}

function writeFileSafe(data: DevFileShape): void {
  const p = devFilePath();
  fs.writeFileSync(p, JSON.stringify(data, null, 2), "utf8");
}

/** Upsert a published row into the dev workspace file (no-op if dev persistence disabled). */
export function upsertServiciosDevPublishRow(row: ServiciosPublicListingRow): boolean {
  if (!isServiciosDevPublishPersistenceEnabled()) return false;
  const data = readFileSafe();
  const next = data.rows.filter((r) => r.slug !== row.slug);
  next.unshift(row);
  writeFileSafe({
    version: 1,
    updatedAt: new Date().toISOString(),
    rows: next.slice(0, 200),
  });
  return true;
}

export function listServiciosDevPublishRows(): ServiciosPublicListingRow[] {
  if (!isServiciosDevPublishPersistenceEnabled()) return [];
  return readFileSafe().rows;
}

export function getServiciosDevPublishRowBySlug(slug: string): ServiciosPublicListingRow | null {
  return listServiciosDevPublishRows().find((r) => r.slug === slug) ?? null;
}

/** Build a canonical public row for dev file + API responses. */
export function buildServiciosPublicRowForPersistence(args: {
  slug: string;
  businessName: string;
  city: string;
  profileJson: ServiciosBusinessProfile;
  internalGroup: string | null;
  publishedAt?: string;
}): ServiciosPublicListingRow {
  const now = args.publishedAt ?? new Date().toISOString();
  return {
    slug: args.slug,
    business_name: args.businessName,
    city: args.city,
    published_at: now,
    profile_json: args.profileJson,
    leonix_verified: false,
    internal_group: args.internalGroup,
    listing_status: SERVICIOS_LISTING_STATUS_PUBLISHED,
  };
}
