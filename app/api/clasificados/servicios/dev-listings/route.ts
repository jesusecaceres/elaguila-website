import { NextResponse } from "next/server";
import {
  isServiciosDevPublishPersistenceEnabled,
  listServiciosDevPublishRows,
} from "@/app/clasificados/servicios/lib/serviciosDevPublishPersistence";

/**
 * Dev-only: returns rows from `.servicios-dev-publishes.json` for QA dashboards.
 * Disabled in production unless `SERVICIOS_DEV_PUBLISH=1`.
 */
export async function GET() {
  if (!isServiciosDevPublishPersistenceEnabled()) {
    return NextResponse.json({ ok: true, listings: [], devMode: false });
  }
  return NextResponse.json({
    ok: true,
    listings: listServiciosDevPublishRows(),
    devMode: true,
  });
}
