/**
 * TEMPORARY DIAGNOSTIC — Gate SERVICIOS-RUNTIME-CONFIG-PROBE-DEPLOY-1.
 *
 * Reports SANITIZED runtime-configuration readiness for Servicios certification so the exact
 * missing environment items can be identified on the protected Preview without the owner
 * hand-copying secrets out of the Vercel dashboard.
 *
 * HARD GUARANTEES
 *   - Returns booleans, a Stripe mode classification, the PUBLIC Supabase project ref, the
 *     Vercel environment name and the Vercel git SHA. Nothing else. See readinessReport.ts.
 *   - Makes ZERO external calls: no database, no Stripe, no Google, no Twilio, no fetch. This
 *     file imports nothing but `next/server` and the pure local classifier.
 *   - Hard-disabled on production: VERCEL_ENV === "production" returns 404 and no report is
 *     ever constructed.
 *   - Never cached: force-dynamic + no-store, so a stale readiness answer cannot be served.
 *
 * REMOVAL: delete this directory (route + classifier + verifier) immediately after Servicios
 * runtime certification. It is diagnostic scaffolding, NOT product architecture, and must not
 * be reused or propagated to other categories.
 */

import { NextResponse } from "next/server";
import { buildServiciosRuntimeReadinessReport } from "./readinessReport";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

export async function GET() {
  // Production kill-switch. Evaluated before anything else touches process.env, so no report
  // exists to leak even accidentally.
  if (process.env.VERCEL_ENV === "production") {
    return new NextResponse(null, { status: 404 });
  }

  const report = buildServiciosRuntimeReadinessReport(
    process.env as Record<string, string | undefined>,
  );

  return NextResponse.json(report, {
    status: 200,
    headers: {
      "cache-control": "no-store, max-age=0",
      "x-robots-tag": "noindex, nofollow",
    },
  });
}
