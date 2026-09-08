import { NextResponse } from "next/server";
import { getPublishedExecutiveContactProfile } from "@/app/lib/digitalContact/digitalContactExecutiveHubProfile";
import { insertDigitalContactAnalyticsEvent } from "@/app/lib/digitalContact/digitalContactOpsTablesServer";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/server";

export const runtime = "nodejs";

const ALLOWED_EVENT_TYPES = new Set([
  "page_view",
  "cta_call",
  "cta_text",
  "cta_whatsapp",
  "cta_email",
  "cta_website",
  "cta_directions",
  "copy_email",
  "copy_phone",
  "vcf_download",
  "qr_view",
  "qr_download",
  "showcase_click",
  "closing_cta_click",
  "lead_created",
]);

/**
 * Digital Contact-only analytics beacon. Isolated table — never touches
 * servicios/listing analytics, per platform architecture requirements.
 */
export async function POST(req: Request) {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ ok: false, accepted: false }, { status: 200 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }
  const b = body as Record<string, unknown>;
  const profileSlug = String(b.profileSlug ?? "").trim().toLowerCase();
  const eventType = String(b.eventType ?? "").trim();
  const meta = typeof b.meta === "object" && b.meta !== null ? (b.meta as Record<string, unknown>) : {};

  if (!(await getPublishedExecutiveContactProfile(profileSlug))) {
    return NextResponse.json({ ok: false, error: "profile_not_found" }, { status: 404 });
  }
  if (!ALLOWED_EVENT_TYPES.has(eventType)) {
    return NextResponse.json({ ok: false, error: "invalid_event_type" }, { status: 400 });
  }

  const ok = await insertDigitalContactAnalyticsEvent({ profileSlug, eventType, meta });
  return NextResponse.json({ ok }, { status: 200 });
}
