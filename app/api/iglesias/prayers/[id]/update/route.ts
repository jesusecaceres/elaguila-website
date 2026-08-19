import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { parsePrayerOwnerCookie, PRAYER_OWNER_COOKIE } from "@/app/lib/iglesias/prayerSession";
import { updateOwnedPrayer } from "@/app/lib/iglesias/prayerService";
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
  const kind = body && typeof body === "object" ? String((body as { kind?: string }).kind ?? "") : "";
  const note = body && typeof body === "object" ? String((body as { body?: string }).body ?? "") : "";

  const store = await cookies();
  const owner = ensurePrayerOwnerToken(parsePrayerOwnerCookie(store.get(PRAYER_OWNER_COOKIE)?.value));
  const ipHash = hashedIpFromRequest(req);
  const limited = checkIglesiasPrayerRateLimit({
    action: "update",
    key: rateLimitKey(owner.sessionHash, ipHash),
  });
  if (!limited.allowed) return NextResponse.json({ ok: false, error: "rate" }, { status: 429 });

  const userId = await optionalUserIdFromRequest(req);
  const result = await updateOwnedPrayer({
    prayerId: id,
    kind,
    body: note,
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
