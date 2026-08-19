import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { parsePrayerOwnerCookie, PRAYER_OWNER_COOKIE } from "@/app/lib/iglesias/prayerSession";
import { listPublicPrayers } from "@/app/lib/iglesias/prayerQueries";
import { parsePrayerSubmission } from "@/app/lib/iglesias/prayerValidation";
import { submitPrayerRequest } from "@/app/lib/iglesias/prayerService";
import { checkIglesiasPrayerRateLimit } from "@/app/lib/iglesias/prayerRateLimit";
import {
  ensurePrayerOwnerToken,
  hashedIpFromRequest,
  optionalUserIdFromRequest,
  prayerOwnerCookieOptions,
  rateLimitKey,
} from "@/app/lib/iglesias/prayerRequestContext";
import { publicPrayerHasForbiddenKeys } from "@/app/lib/iglesias/prayerPublicMapper";

export const runtime = "nodejs";

async function viewerContext(req: Request) {
  const store = await cookies();
  const existing = parsePrayerOwnerCookie(store.get(PRAYER_OWNER_COOKIE)?.value);
  const owner = ensurePrayerOwnerToken(existing);
  const userId = await optionalUserIdFromRequest(req);
  const ipHash = hashedIpFromRequest(req);
  return { owner, userId, ipHash };
}

export async function GET(req: Request) {
  const { owner, userId } = await viewerContext(req);
  const prayers = await listPublicPrayers({ sessionHash: owner.sessionHash, userId });
  const leaked = publicPrayerHasForbiddenKeys(prayers);
  if (leaked.length) {
    return NextResponse.json({ ok: false, error: "privacy" }, { status: 500 });
  }
  const res = NextResponse.json({ ok: true, prayers });
  if (owner.isNew) res.cookies.set(PRAYER_OWNER_COOKIE, owner.token, prayerOwnerCookieOptions);
  return res;
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
  }

  const parsed = parsePrayerSubmission(body);
  if (!parsed.ok) {
    return NextResponse.json({ ok: false, error: parsed.error }, { status: 400 });
  }

  const { owner, userId, ipHash } = await viewerContext(req);
  const limited = checkIglesiasPrayerRateLimit({
    action: "submit",
    key: rateLimitKey(owner.sessionHash, ipHash),
  });
  if (!limited.allowed) {
    return NextResponse.json({ ok: false, error: "rate" }, { status: 429 });
  }

  const result = await submitPrayerRequest({
    input: parsed.data,
    sessionHash: owner.sessionHash,
    userId,
    ipHash,
  });

  if (!result.ok) {
    const status = result.error === "duplicate" ? 409 : 500;
    return NextResponse.json({ ok: false, error: result.error }, { status });
  }

  const res = NextResponse.json({
    ok: true,
    id: result.id,
    outcome: result.outcome,
    deliveredTeams: result.deliveredTeams,
    routingReason: result.routingReason,
  });
  res.cookies.set(PRAYER_OWNER_COOKIE, owner.token, prayerOwnerCookieOptions);
  return res;
}
