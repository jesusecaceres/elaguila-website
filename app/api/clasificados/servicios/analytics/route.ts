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
  "publish_success",
  "search_results_view",
  "lead_created",
  "review_submit_pending",
  "provider_manage",
  "admin_moderation",
]);

function isValidSlug(s: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(s) && s.length <= 120;
}

export async function POST(req: Request) {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ ok: false }, { status: 503 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }
  const b = body as Record<string, unknown>;
  const listingSlug = String(b.listingSlug ?? "").trim();
  const eventType = String(b.eventType ?? "").trim();
  const meta = typeof b.meta === "object" && b.meta !== null ? (b.meta as Record<string, unknown>) : {};

  if (!isValidSlug(listingSlug) || !ALLOWED.has(eventType)) {
    return NextResponse.json({ ok: false, error: "invalid_input" }, { status: 400 });
  }

  const ok = await insertServiciosAnalyticsEvent({ listingSlug, eventType, meta });
  return NextResponse.json({ ok });
}
