import { NextResponse } from "next/server";
import {
  isAutosClassifiedsDbConfigured,
  listActiveAutosClassifiedsRows,
} from "@/app/lib/clasificados/autos/autosClassifiedsListingService";
import { autosClassifiedsRowToPublicListing } from "@/app/lib/clasificados/autos/mapAutosClassifiedsToPublic";

export const dynamic = "force-dynamic";

/**
 * Active Autos listings for landing, results, and filters (no sample fallback in API).
 */
export async function GET() {
  if (!isAutosClassifiedsDbConfigured()) {
    return NextResponse.json({ ok: true, listings: [], configured: false });
  }
  const rows = await listActiveAutosClassifiedsRows();
  const listings = rows.map(autosClassifiedsRowToPublicListing);
  return NextResponse.json({ ok: true, listings, configured: true });
}
