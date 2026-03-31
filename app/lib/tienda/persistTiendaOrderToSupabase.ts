import type { SupabaseClient } from "@supabase/supabase-js";
import type { TiendaOrderSubmissionPayload } from "@/app/tienda/types/orderSubmission";
import type { TiendaOrderAssetReference } from "@/app/tienda/types/tiendaStoredAssets";
import { approvalCompleteFromPayload } from "@/app/lib/tienda/tiendaOrderOperations";

export type PersistTiendaOrderResult =
  | { ok: true; orderUuid: string }
  | { ok: false; error: string; code: "DB_INSERT_FAILED" | "DB_ASSETS_FAILED" | "DUPLICATE_ORDER_REF" };

/**
 * Inserts tienda_orders + tienda_order_assets. Caller updates email_delivery_status after Resend.
 */
export async function persistTiendaOrderToSupabase(
  supabase: SupabaseClient,
  payload: TiendaOrderSubmissionPayload,
  durableAssets: TiendaOrderAssetReference[]
): Promise<PersistTiendaOrderResult> {
  const title = `${payload.productTitleEn} / ${payload.productTitleEs}`.slice(0, 500);

  const orderRow = {
    order_ref: payload.orderId,
    source_type: payload.source,
    product_slug: payload.productSlug,
    product_title: title,
    category_slug: payload.categorySlug ?? "",
    customer_user_id: null as string | null,
    customer_name: payload.customer.fullName,
    customer_email: payload.customer.email,
    customer_phone: payload.customer.phone,
    business_name: payload.customer.businessName ?? "",
    fulfillment_preference: payload.fulfillment,
    notes: payload.customer.notes ?? "",
    approval_snapshot: {
      status: payload.approvalStatus,
      details: payload.approvalDetails,
      businessCardApproval: payload.businessCardExtra?.approval ?? null,
    },
    warnings_snapshot: payload.warnings,
    specs_snapshot: payload.specLines,
    sidedness_summary: payload.sidednessSummary,
    status: "new" as const,
    unread_admin: true,
    email_delivery_status: "pending" as const,
    email_last_error: null as string | null,
    order_payload: JSON.parse(JSON.stringify(payload)) as Record<string, unknown>,
    approval_complete: approvalCompleteFromPayload(payload),
  };

  const { data: inserted, error } = await supabase.from("tienda_orders").insert(orderRow).select("id").single();

  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "This order reference was already submitted.", code: "DUPLICATE_ORDER_REF" };
    }
    return { ok: false, error: error.message, code: "DB_INSERT_FAILED" };
  }

  const orderUuid = inserted.id as string;

  const assetRows = durableAssets.map((a) => ({
    order_id: orderUuid,
    asset_role: a.role,
    original_filename: a.originalFilename,
    mime_type: a.mimeType,
    size_bytes: a.sizeBytes,
    width_px: a.widthPx,
    height_px: a.heightPx,
    storage_key: a.storagePath,
    asset_url: a.publicUrl,
    meta: { createdAtIso: a.createdAtIso, sourceProductSlug: a.productSlug },
  }));

  const { error: e2 } = await supabase.from("tienda_order_assets").insert(assetRows);
  if (e2) {
    await supabase.from("tienda_orders").delete().eq("id", orderUuid);
    return { ok: false, error: e2.message, code: "DB_ASSETS_FAILED" };
  }

  return { ok: true, orderUuid };
}

export async function updateTiendaOrderEmailDelivery(
  supabase: SupabaseClient,
  orderRef: string,
  emailDeliveryStatus: "sent" | "failed",
  emailLastError: string | null
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase
    .from("tienda_orders")
    .update({
      email_delivery_status: emailDeliveryStatus,
      email_last_error: emailLastError,
      updated_at: new Date().toISOString(),
    })
    .eq("order_ref", orderRef);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
