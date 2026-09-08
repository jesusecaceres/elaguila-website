import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { requireAdminCookie } from "@/app/lib/supabase/server";
import { getWebPushPublicKey, isWebPushConfigured } from "@/app/lib/digitalContact/humanConnection/webPushConfig";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Authenticated staff only — returns public VAPID key for enrollment. */
export async function GET() {
  const jar = await cookies();
  if (!requireAdminCookie(jar)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const publicKey = getWebPushPublicKey();
  return NextResponse.json({
    ok: true,
    configured: isWebPushConfigured(),
    publicKey,
  });
}
