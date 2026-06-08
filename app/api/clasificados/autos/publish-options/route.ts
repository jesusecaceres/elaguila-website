import { NextResponse } from "next/server";
import { isAutosInternalPublishPaymentBypassEnabled } from "@/app/lib/clasificados/autos/autosInternalPublishConfig";
import { isAutosAllowTestPublishBypassEnabled } from "@/app/lib/clasificados/autos/autosTestPublishBypass";
import { getAutosPublishUserFromRequest } from "@/app/lib/clasificados/autos/autosListingBearerAuth";
import { isAutosNegociosQaPublishAllowlisted } from "@/app/lib/clasificados/autos/autosNegociosQaPublishAllowlist";

export const dynamic = "force-dynamic";

/** Public read of publish-mode flags (no secrets). Client confirm step uses this for copy + CTA. */
export async function GET(request: Request) {
  const user = await getAutosPublishUserFromRequest(request);
  const negociosQaAllowlistBypass = user
    ? isAutosNegociosQaPublishAllowlisted(user.id, user.email)
    : false;
  const internalBypass = isAutosInternalPublishPaymentBypassEnabled();
  const testPublishBypass = isAutosAllowTestPublishBypassEnabled();
  return NextResponse.json({
    internalBypass,
    testPublishBypass,
    negociosQaAllowlistBypass,
    qaBypass: internalBypass || testPublishBypass || negociosQaAllowlistBypass,
  });
}
