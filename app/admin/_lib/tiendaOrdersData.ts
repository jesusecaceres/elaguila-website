/**
 * Admin Tienda orders inbox — server-only reads via service role.
 */
import { getAdminSupabase } from "@/app/lib/supabase/server";
import type { TiendaOrderOpsStatus } from "@/app/lib/tienda/tiendaOrderOperations";
import { isTiendaOrderOpsStatus } from "@/app/lib/tienda/tiendaOrderOperations";

export type TiendaOrderRow = {
  id: string;
  order_ref: string;
  created_at: string;
  updated_at: string;
  source_type: string;
  product_slug: string;
  product_title: string;
  category_slug: string;
  customer_user_id: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  business_name: string;
  fulfillment_preference: string;
  notes: string;
  /** Staff-only; column added in migration 20260331210000 */
  admin_internal_notes?: string;
  approval_snapshot: unknown;
  warnings_snapshot: unknown;
  specs_snapshot: unknown;
  sidedness_summary: unknown;
  status: TiendaOrderOpsStatus;
  unread_admin: boolean;
  email_delivery_status: string;
  email_last_error: string | null;
  order_payload: unknown;
  approval_complete: boolean;
};

/** List row including derived asset count */
export type TiendaOrderListRow = TiendaOrderRow & { asset_count: number };

export type TiendaOrderAssetRow = {
  id: string;
  order_id: string;
  asset_role: string;
  original_filename: string;
  mime_type: string;
  size_bytes: number;
  width_px: number | null;
  height_px: number | null;
  storage_key: string;
  asset_url: string;
  created_at: string;
  meta: unknown;
};

export type AdminTiendaDashboardCounts = {
  /** status = new */
  newOrders: number;
  /** in review / being checked */
  inReview: number;
  /** ready_to_fulfill */
  readyToFulfill: number;
  /** all orders (total rows) */
  totalOrders: number;
  /** unread_admin = true */
  unreadCount: number;
  /** query failed or table missing */
  dataUnavailable: boolean;
  dataUnavailableNote: string | null;
};

function mapOrderError(e: unknown): string | null {
  if (!e || typeof e !== "object") return null;
  const msg = "message" in e && typeof (e as { message: unknown }).message === "string" ? (e as { message: string }).message : "";
  if (msg.includes("does not exist") || msg.includes("schema cache")) {
    return "Tienda orders table not found — run Supabase migrations.";
  }
  return msg || null;
}

export async function getTiendaInboxUnreadCount(): Promise<number> {
  try {
    const supabase = getAdminSupabase();
    const { count, error } = await supabase
      .from("tienda_orders")
      .select("id", { count: "exact", head: true })
      .eq("unread_admin", true);
    if (error) return 0;
    return typeof count === "number" ? count : 0;
  } catch {
    return 0;
  }
}

export async function getAdminTiendaDashboardCounts(): Promise<AdminTiendaDashboardCounts> {
  const fallback = (note: string | null): AdminTiendaDashboardCounts => ({
    newOrders: 0,
    inReview: 0,
    readyToFulfill: 0,
    totalOrders: 0,
    unreadCount: 0,
    dataUnavailable: true,
    dataUnavailableNote: note,
  });

  try {
    const supabase = getAdminSupabase();

    const countStatus = async (status: string) => {
      const { count, error } = await supabase.from("tienda_orders").select("id", { count: "exact", head: true }).eq("status", status);
      if (error) throw error;
      return typeof count === "number" ? count : 0;
    };

    const { count: totalCount, error: eTotal } = await supabase
      .from("tienda_orders")
      .select("id", { count: "exact", head: true });
    if (eTotal) throw eTotal;

    const { count: unreadCount, error: eUn } = await supabase
      .from("tienda_orders")
      .select("id", { count: "exact", head: true })
      .eq("unread_admin", true);
    if (eUn) throw eUn;

    const [newOrders, reviewing, ready] = await Promise.all([
      countStatus("new"),
      countStatus("reviewing"),
      countStatus("ready_to_fulfill"),
    ]);

    return {
      newOrders,
      inReview: reviewing,
      readyToFulfill: ready,
      totalOrders: typeof totalCount === "number" ? totalCount : 0,
      unreadCount: typeof unreadCount === "number" ? unreadCount : 0,
      dataUnavailable: false,
      dataUnavailableNote: null,
    };
  } catch (e) {
    return fallback(mapOrderError(e));
  }
}

export type TiendaOrderListParams = {
  search?: string;
  status?: TiendaOrderOpsStatus | "";
  unreadOnly?: boolean;
  limit?: number;
  offset?: number;
};

export async function listTiendaOrdersForAdmin(params: TiendaOrderListParams): Promise<{
  rows: TiendaOrderListRow[];
  total: number;
  error: string | null;
}> {
  const limit = Math.min(Math.max(params.limit ?? 40, 1), 100);
  const offset = Math.max(params.offset ?? 0, 0);
  const search = (params.search ?? "").trim();
  const statusFilter = params.status && isTiendaOrderOpsStatus(params.status) ? params.status : null;
  const unreadOnly = params.unreadOnly === true;

  try {
    const supabase = getAdminSupabase();

    let q = supabase.from("tienda_orders").select(
      `
        id,
        order_ref,
        created_at,
        updated_at,
        source_type,
        product_slug,
        product_title,
        category_slug,
        customer_user_id,
        customer_name,
        customer_email,
        customer_phone,
        business_name,
        fulfillment_preference,
        notes,
        approval_snapshot,
        warnings_snapshot,
        specs_snapshot,
        sidedness_summary,
        status,
        unread_admin,
        email_delivery_status,
        email_last_error,
        order_payload,
        approval_complete
      `,
      { count: "exact" }
    );

    if (statusFilter) q = q.eq("status", statusFilter);
    if (unreadOnly) q = q.eq("unread_admin", true);

    if (search) {
      const term = `%${search}%`;
      const ors = [
        `order_ref.ilike.${term}`,
        `customer_name.ilike.${term}`,
        `customer_email.ilike.${term}`,
        `product_slug.ilike.${term}`,
        `product_title.ilike.${term}`,
      ];
      if (UUID_LIKE.test(search)) {
        ors.push(`id.eq.${search}`);
        ors.push(`customer_user_id.eq.${search}`);
      }
      q = q.or(ors.join(","));
    }

    q = q.order("created_at", { ascending: false }).range(offset, offset + limit - 1);

    const { data, error, count } = await q;
    if (error) throw error;

    const baseRows =
      (data as TiendaOrderRow[] | null)?.map((r) => ({
        ...r,
        status: isTiendaOrderOpsStatus(String(r.status)) ? r.status : "new",
      })) ?? [];

    const assetMap = new Map<string, number>();
    const ids = baseRows.map((r) => r.id);
    if (ids.length > 0) {
      const { data: assetRows, error: ae } = await supabase.from("tienda_order_assets").select("order_id").in("order_id", ids);
      if (ae) throw ae;
      for (const a of assetRows ?? []) {
        const oid = String((a as { order_id: string }).order_id);
        assetMap.set(oid, (assetMap.get(oid) ?? 0) + 1);
      }
    }

    const rows: TiendaOrderListRow[] = baseRows.map((r) => ({
      ...r,
      asset_count: assetMap.get(r.id) ?? 0,
    }));

    return { rows, total: typeof count === "number" ? count : rows.length, error: null };
  } catch (e) {
    return { rows: [], total: 0, error: mapOrderError(e) ?? "Failed to load Tienda orders." };
  }
}

const UUID_LIKE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function getTiendaOrderDetailForAdmin(orderUuid: string): Promise<{
  order: TiendaOrderRow | null;
  assets: TiendaOrderAssetRow[];
  error: string | null;
}> {
  try {
    const supabase = getAdminSupabase();
    const { data: order, error: e1 } = await supabase.from("tienda_orders").select("*").eq("id", orderUuid).maybeSingle();
    if (e1) throw e1;
    if (!order) return { order: null, assets: [], error: null };

    const { data: assets, error: e2 } = await supabase
      .from("tienda_order_assets")
      .select("*")
      .eq("order_id", orderUuid)
      .order("created_at", { ascending: true });
    if (e2) throw e2;

    const o = order as TiendaOrderRow;
    if (!isTiendaOrderOpsStatus(String(o.status))) o.status = "new";

    return {
      order: o,
      assets: (assets as TiendaOrderAssetRow[]) ?? [],
      error: null,
    };
  } catch (e) {
    return { order: null, assets: [], error: mapOrderError(e) ?? "Failed to load order." };
  }
}

export async function getRecentTiendaOrdersPreview(limit: number): Promise<TiendaOrderRow[]> {
  try {
    const supabase = getAdminSupabase();
    const { data, error } = await supabase
      .from("tienda_orders")
      .select(
        "id, order_ref, created_at, updated_at, source_type, product_slug, product_title, category_slug, customer_user_id, customer_name, customer_email, customer_phone, business_name, fulfillment_preference, notes, status, unread_admin, email_delivery_status, email_last_error, approval_complete, order_payload"
      )
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data as TiendaOrderRow[]) ?? [];
  } catch {
    return [];
  }
}

export async function markTiendaOrderAsRead(orderUuid: string): Promise<void> {
  try {
    const supabase = getAdminSupabase();
    await supabase
      .from("tienda_orders")
      .update({ unread_admin: false, updated_at: new Date().toISOString() })
      .eq("id", orderUuid)
      .eq("unread_admin", true);
  } catch {
    /* ignore */
  }
}
