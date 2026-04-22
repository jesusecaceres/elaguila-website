import { NextResponse } from "next/server";
import { insertServiciosAnalyticsEvent } from "@/app/clasificados/servicios/lib/serviciosOpsTablesServer";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/server";

export const runtime = "nodejs";

const ALLOWED = new Set([
  "cta_primary_click",
  "cta_secondary_click",
  "cta_whatsapp_click",
  "cta_call_click",
  "cta_email_click",
  "cta_website_click",
  "cta_maps_click",
  "profile_view",
  "search_results_view",
  "filter_change",
  "lead_created",
  "review_submit_pending",
  "provider_manage",
]);

/** Events that may omit `listing_slug` (global discovery UX — never impersonate a listing). */
const NULL_SLUG_OK = new Set(["search_results_view", "filter_change"]);

function isValidSlug(s: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(s) && s.length <= 120;
}

function parseListingSlug(raw: unknown): string | null {
  if (raw === null || raw === undefined) return null;
  const s = String(raw).trim();
  return s.length === 0 ? null : s;
}

export async function POST(req: Request) {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ ok: false, error: "supabase_not_configured" }, { status: 503 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }
  const b = body as Record<string, unknown>;
  const listingSlug = parseListingSlug(b.listingSlug);
  const eventType = String(b.eventType ?? "").trim();
  const meta = typeof b.meta === "object" && b.meta !== null ? (b.meta as Record<string, unknown>) : {};

  if (!ALLOWED.has(eventType)) {
    return NextResponse.json({ ok: false, error: "invalid_event" }, { status: 400 });
  }

  if (NULL_SLUG_OK.has(eventType)) {
    if (listingSlug !== null && !isValidSlug(listingSlug)) {
      return NextResponse.json({ ok: false, error: "invalid_slug" }, { status: 400 });
    }
  } else {
    if (!listingSlug || !isValidSlug(listingSlug)) {
      return NextResponse.json({ ok: false, error: "invalid_slug" }, { status: 400 });
    }
  }

  const ok = await insertServiciosAnalyticsEvent({ listingSlug, eventType, meta });
  return NextResponse.json({ ok });
}
