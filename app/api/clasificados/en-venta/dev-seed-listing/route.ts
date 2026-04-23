import { NextResponse, type NextRequest } from "next/server";
import { randomUUID } from "node:crypto";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";

export const runtime = "nodejs";

function responseForSupabaseAdminError(error: { message?: string } | null): NextResponse | null {
  const msg = (error?.message ?? "").toLowerCase();
  if (
    msg.includes("invalid api key") ||
    msg.includes("invalid jwt") ||
    msg.includes("jwt expired") ||
    msg.includes("signature verification failed")
  ) {
    return NextResponse.json({ ok: false, error: "supabase_admin_auth_failed" }, { status: 503 });
  }
  return null;
}

/**
 * Dev / CI only: create or delete a real `listings` row for En Venta E2E traceability.
 *
 * POST body:
 * - `{ "action": "create" }` (default) — insert one active published En Venta row.
 * - `{ "action": "delete", "listingId": "<uuid>" }` — remove that row.
 *
 * Security: 404 unless `EN_VENTA_DEV_PUBLISH=1`. Requires `SUPABASE_SERVICE_ROLE_KEY`.
 */
export async function POST(req: NextRequest) {
  if (process.env.EN_VENTA_DEV_PUBLISH !== "1") {
    return NextResponse.json({ ok: false, error: "disabled" }, { status: 404 });
  }
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ ok: false, error: "no_admin_supabase" }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const b = (body && typeof body === "object" ? body : {}) as { action?: string; listingId?: string };
  const action = (b.action ?? "create").toLowerCase();

  const supabase = getAdminSupabase();

  if (action === "delete") {
    const id = String(b.listingId ?? "").trim();
    if (!id) {
      return NextResponse.json({ ok: false, error: "missing_listingId" }, { status: 400 });
    }
    const { error } = await supabase.from("listings").delete().eq("id", id);
    if (error) {
      const authFail = responseForSupabaseAdminError(error);
      if (authFail) return authFail;
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  }

  if (action !== "create") {
    return NextResponse.json({ ok: false, error: "unknown_action" }, { status: 400 });
  }

  const marker = `EV_E2E_${Date.now()}`;
  const id = randomUUID();
  const ownerId = randomUUID();

  const detailPairs = [
    { label: "Leonix:evDept", value: "electronicos" },
    { label: "Leonix:evSub", value: "phones" },
    { label: "Leonix:itemType", value: "phone" },
    { label: "Leonix:pickup", value: "1" },
    { label: "Leonix:ship", value: "0" },
    { label: "Leonix:delivery", value: "0" },
    { label: "Leonix:meetup", value: "0" },
    { label: "Leonix:negotiable", value: "0" },
    { label: "Leonix:plan", value: "free" },
    { label: "Leonix:contactChannel", value: "email" },
    { label: "Condición", value: "good" },
  ];

  const insertPayload: Record<string, unknown> = {
    id,
    owner_id: ownerId,
    title: marker,
    description: "Leonix En Venta dev-seed trace row (safe to delete).",
    city: "San Francisco",
    zip: "94102",
    category: "en-venta",
    price: 199,
    is_free: false,
    contact_phone: null,
    contact_email: `e2e-en-venta-${id.slice(0, 8)}@test.invalid`,
    status: "active",
    is_published: true,
    seller_type: "business",
    business_name: "E2E Seed Shop",
    business_meta: null,
    detail_pairs: detailPairs,
    images: [],
  };

  const tryInsert = async (payload: Record<string, unknown>) => supabase.from("listings").insert([payload]);

  let { error } = await tryInsert(insertPayload);
  /** Older `listings` rows may omit `zip` — match `publishEnVentaFromDraft` retry behavior. */
  if (error) {
    const m = (error.message ?? "").toLowerCase();
    if (m.includes("zip") && insertPayload.zip != null) {
      const noZip = { ...insertPayload };
      delete noZip.zip;
      ({ error } = await tryInsert(noZip));
    }
  }
  if (error) {
    const authFail = responseForSupabaseAdminError(error);
    if (authFail) return authFail;
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, listingId: id, marker });
}
