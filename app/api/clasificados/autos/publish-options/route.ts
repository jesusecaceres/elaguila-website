import { NextResponse } from "next/server";
import { isAutosInternalPublishPaymentBypassEnabled } from "@/app/lib/clasificados/autos/autosInternalPublishConfig";
import { isAutosAllowTestPublishBypassEnabled } from "@/app/lib/clasificados/autos/autosTestPublishBypass";

export const dynamic = "force-dynamic";

/** Public read of publish-mode flags (no secrets). Client confirm step uses this for copy + CTA. */
export async function GET() {
  return NextResponse.json({
    internalBypass: isAutosInternalPublishPaymentBypassEnabled(),
    testPublishBypass: isAutosAllowTestPublishBypassEnabled(),
  });
}
