import { NextRequest, NextResponse } from "next/server";

import { insertEmpleosJobApplication } from "@/app/clasificados/empleos/lib/empleosPublicListingsDbServer";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import { getBearerUserId } from "../../_lib/bearerUser";

export const runtime = "nodejs";

export async function POST(req: NextRequest): Promise<NextResponse> {
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
  const listingId = String(b.listingId ?? "").trim();
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(listingId)) {
    return NextResponse.json({ ok: false, error: "invalid_listing_id" }, { status: 400 });
  }
  const applicantName = String(b.applicantName ?? "").trim();
  const applicantEmail = String(b.applicantEmail ?? "").trim();
  const message = String(b.message ?? "").trim();
  const applicantPhone = b.applicantPhone != null ? String(b.applicantPhone).trim() || null : null;
  const answersJson = (b.answersJson && typeof b.answersJson === "object" ? b.answersJson : {}) as Record<string, unknown>;

  if (!listingId || !applicantName || !applicantEmail) {
    return NextResponse.json({ ok: false, error: "missing_fields" }, { status: 400 });
  }

  const applicantUserId = await getBearerUserId(req);

  const res = await insertEmpleosJobApplication({
    listingId,
    applicantUserId,
    applicantName,
    applicantEmail,
    applicantPhone,
    message: message || "(no message)",
    answersJson,
  });
  if (!res.ok) {
    const status = res.error === "listing_not_accepting_applications" ? 409 : 500;
    return NextResponse.json({ ok: false, error: res.error }, { status });
  }
  return NextResponse.json({ ok: true, id: res.id });
}
