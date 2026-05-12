import { NextResponse } from "next/server";
import { getServiciosPublicListingBySlugFromDb } from "@/app/clasificados/servicios/lib/serviciosPublicListingsServer";
import { SERVICIOS_LISTING_STATUS_PUBLISHED } from "@/app/clasificados/servicios/lib/serviciosListingLifecycle";
import {
  insertServiciosPublicLead,
  insertServiciosAnalyticsEvent,
  type ServiciosLeadPreferredContactMethod,
} from "@/app/clasificados/servicios/lib/serviciosOpsTablesServer";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/server";

export const runtime = "nodejs";

function isEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
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
  const listingSlug = String(b.listingSlug ?? "").trim();
  const senderName = String(b.senderName ?? "").trim();
  const senderEmail = String(b.senderEmail ?? "").trim();
  const message = String(b.message ?? "").trim();
  const requestKind = b.requestKind === "general" ? "general" : "quote";
  const honeypot = String(b.website ?? "").trim();
  const senderPhoneRaw = String(b.senderPhone ?? "").trim();
  const senderPhone = senderPhoneRaw.length > 0 ? senderPhoneRaw.slice(0, 48) : "";
  const prefRaw = String(b.preferredContactMethod ?? "email").trim().toLowerCase();
  const preferredContactMethod: ServiciosLeadPreferredContactMethod =
    prefRaw === "phone" ? "phone" : prefRaw === "whatsapp" ? "whatsapp" : "email";

  if (honeypot.length > 0) {
    return NextResponse.json({ ok: true, accepted: false }, { status: 200 });
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(listingSlug) || listingSlug.length > 120) {
    return NextResponse.json({ ok: false, error: "invalid_slug" }, { status: 400 });
  }
  if (senderName.length < 2 || senderName.length > 200) {
    return NextResponse.json({ ok: false, error: "invalid_name" }, { status: 400 });
  }
  if (!isEmail(senderEmail)) {
    return NextResponse.json({ ok: false, error: "invalid_email" }, { status: 400 });
  }
  if (message.length < 8 || message.length > 4000) {
    return NextResponse.json({ ok: false, error: "invalid_message" }, { status: 400 });
  }
  if (senderPhone.length > 0 && senderPhone.replace(/[\s().+-]/g, "").length < 7) {
    return NextResponse.json({ ok: false, error: "invalid_phone" }, { status: 400 });
  }

  const row = await getServiciosPublicListingBySlugFromDb(listingSlug, { visibility: "published_only" });
  if (!row || row.listing_status !== SERVICIOS_LISTING_STATUS_PUBLISHED) {
    return NextResponse.json({ ok: false, error: "listing_not_found" }, { status: 404 });
  }

  const ins = await insertServiciosPublicLead({
    listingSlug,
    providerUserId: row.owner_user_id ?? null,
    senderName,
    senderEmail,
    message,
    requestKind,
    honeypot: null,
    senderPhone: senderPhone || null,
    preferredContactMethod,
  });

  if (!ins.ok) {
    return NextResponse.json({ ok: false, error: ins.error }, { status: 500 });
  }

  await insertServiciosAnalyticsEvent({
    listingSlug,
    eventType: "lead_created",
    meta: {
      requestKind,
      leadId: ins.id,
      preferredContactMethod,
      hasSenderPhone: Boolean(senderPhone),
    },
  });

  return NextResponse.json({ ok: true, id: ins.id });
}
