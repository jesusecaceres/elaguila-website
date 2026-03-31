import { NextResponse } from "next/server";
import { buildTiendaOrderEmailBodies } from "@/app/lib/tienda/formatTiendaOrderEmail";
import { enrichAssetReferencesFromPayload } from "@/app/lib/tienda/enrichAssetReferencesFromPayload";
import {
  persistTiendaOrderToSupabase,
  updateTiendaOrderEmailDelivery,
} from "@/app/lib/tienda/persistTiendaOrderToSupabase";
import { sendTiendaOrderEmailResend } from "@/app/lib/tienda/sendTiendaOrderEmailResend";
import { getAdminSupabase } from "@/app/lib/supabase/server";
import {
  assertRequiredDurableAssets,
  listDurableAssetsForOrder,
} from "@/app/lib/tienda/verifyTiendaOrderBlobAssets";
import { validateTiendaOrderPayload } from "@/app/lib/tienda/validateTiendaOrderPayload";
import type { TiendaOrderSubmissionResult } from "@/app/tienda/types/orderSubmission";

export const runtime = "nodejs";

export async function POST(req: Request): Promise<NextResponse<TiendaOrderSubmissionResult>> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON", code: "BAD_JSON" }, { status: 400 });
  }

  const validated = validateTiendaOrderPayload(body);
  if (!validated.ok) {
    return NextResponse.json(
      { ok: false, error: validated.error, code: validated.code },
      { status: validated.code === "INVALID_PRODUCT" ? 404 : 400 }
    );
  }

  const orderId = validated.payload.orderId;
  const submittedAt = new Date().toISOString();

  const listed = await listDurableAssetsForOrder(orderId, validated.payload.source, validated.payload.productSlug);
  if (!listed.ok) {
    return NextResponse.json(
      { ok: false, error: listed.error, code: listed.code },
      { status: listed.code === "BLOB_NOT_CONFIGURED" ? 503 : 503 }
    );
  }

  const checked = assertRequiredDurableAssets(validated.payload, listed.references);
  if (!checked.ok) {
    return NextResponse.json({ ok: false, error: checked.error, code: checked.code }, { status: 400 });
  }

  const durableAssets = enrichAssetReferencesFromPayload(checked.references, validated.payload);

  let supabase: ReturnType<typeof getAdminSupabase>;
  try {
    supabase = getAdminSupabase();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Order persistence is not configured (Supabase).", code: "DB_NOT_CONFIGURED" },
      { status: 503 }
    );
  }

  const persisted = await persistTiendaOrderToSupabase(supabase, validated.payload, durableAssets);
  if (!persisted.ok) {
    const status = persisted.code === "DUPLICATE_ORDER_REF" ? 409 : 503;
    return NextResponse.json(
      { ok: false, error: persisted.error, code: persisted.code },
      { status }
    );
  }

  const { subject, text, html } = buildTiendaOrderEmailBodies(orderId, submittedAt, validated.payload, durableAssets);

  const sent = await sendTiendaOrderEmailResend({ subject, text, html });

  await updateTiendaOrderEmailDelivery(supabase, orderId, sent.ok ? "sent" : "failed", sent.ok ? null : sent.message);

  if (!sent.ok) {
    return NextResponse.json({
      ok: true,
      orderId,
      submittedAt,
      durableAssets,
      emailDelivered: false,
      emailError: sent.message,
    });
  }

  return NextResponse.json({
    ok: true,
    orderId,
    submittedAt,
    durableAssets,
    emailDelivered: true,
  });
}
