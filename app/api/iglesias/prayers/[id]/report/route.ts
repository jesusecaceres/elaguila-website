import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { parsePrayerOwnerCookie, PRAYER_OWNER_COOKIE } from "@/app/lib/iglesias/prayerSession";
import { reportPrayer } from "@/app/lib/iglesias/prayerService";
import { checkIglesiasPrayerRateLimit } from "@/app/lib/iglesias/prayerRateLimit";
import {
  ensurePrayerOwnerToken,
  hashedIpFromRequest,
  optionalUserIdFromRequest,
  prayerOwnerCookieOptions,
  rateLimitKey,
} from "@/app/lib/iglesias/prayerRequestContext";

export const runtime = "nodejs";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
  }
  const reason = body && typeof body === "object" ? String((body as { reason?: string }).reason ?? "") : "";
  const details = body && typeof body === "object" ? String((body as { details?: string }).details ?? "") : "";

  const store = await cookies();
  const owner = ensurePrayerOwnerToken(parsePrayerOwnerCookie(store.get(PRAYER_OWNER_COOKIE)?.value));
  const ipHash = hashedIpFromRequest(req);
  const limited = checkIglesiasPrayerRateLimit({
    action: "report",
    key: rateLimitKey(owner.sessionHash, ipHash),
  });
  if (!limited.allowed) return NextResponse.json({ ok: false, error: "rate" }, { status: 429 });

  const userId = await optionalUserIdFromRequest(req);
  const result = await reportPrayer({
    prayerId: id,
    reason,
    details,
    sessionHash: owner.sessionHash,
    userId,
  });
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: result.status ?? 500 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(PRAYER_OWNER_COOKIE, owner.token, prayerOwnerCookieOptions);
  return res;
}
