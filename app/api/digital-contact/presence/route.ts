import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { requireAdminCookie, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import { getDigitalContactProfile, listActiveDigitalContactProfiles } from "@/app/lib/digitalContact/digitalContactRegistry";
import {
  clearExecutivePresence,
  getExecutivePresenceRecord,
  setExecutivePresence,
} from "@/app/lib/digitalContact/humanConnection/presenceServer";
import type { ExecutivePresenceStatus } from "@/app/lib/digitalContact/humanConnection/humanConnectionTypes";
import { HUMAN_CONNECTION_PRESENCE_PRESETS } from "@/app/lib/digitalContact/humanConnection/constants";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Staff-only presence read/write. Never expose on /visitanos. */
export async function GET() {
  const jar = await cookies();
  if (!requireAdminCookie(jar)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const profiles = listActiveDigitalContactProfiles();
  const rows = await Promise.all(
    profiles.map(async (p) => {
      const record = await getExecutivePresenceRecord(p.slug);
      return {
        slug: p.slug,
        fullName: p.fullName,
        record,
      };
    }),
  );

  return NextResponse.json({
    ok: true,
    supabaseConfigured: isSupabaseAdminConfigured(),
    presets: HUMAN_CONNECTION_PRESENCE_PRESETS,
    rows,
  });
}

export async function POST(req: Request) {
  const jar = await cookies();
  if (!requireAdminCookie(jar)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  const profileSlug = String(b.profileSlug ?? "")
    .trim()
    .toLowerCase();
  const action = String(b.action ?? "")
    .trim()
    .toLowerCase();

  if (!getDigitalContactProfile(profileSlug)) {
    return NextResponse.json({ ok: false, error: "profile_not_found" }, { status: 404 });
  }

  if (action === "clear") {
    const cleared = await clearExecutivePresence(profileSlug);
    if (!cleared.ok) {
      return NextResponse.json({ ok: false, error: cleared.error }, { status: 503 });
    }
    return NextResponse.json({ ok: true, cleared: true });
  }

  const status = String(b.status ?? "") as ExecutivePresenceStatus;
  const durationMinutes = Number(b.durationMinutes);

  if (status !== "available" && status !== "busy" && status !== "away") {
    return NextResponse.json({ ok: false, error: "invalid_status" }, { status: 400 });
  }

  const result = await setExecutivePresence({
    profileSlug,
    status,
    durationMinutes,
    updatedBy: "leonix_admin",
  });

  if (!result.ok) {
    const statusCode = result.error === "supabase_not_configured" ? 503 : 400;
    return NextResponse.json({ ok: false, error: result.error }, { status: statusCode });
  }

  return NextResponse.json({ ok: true, record: result.record });
}
