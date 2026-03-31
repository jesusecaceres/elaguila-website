"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { requireAdminCookie, getAdminSupabase } from "@/app/lib/supabase/server";
import type { TiendaOrderOpsStatus } from "@/app/lib/tienda/tiendaOrderOperations";
import { isTiendaOrderOpsStatus } from "@/app/lib/tienda/tiendaOrderOperations";

async function assertAdmin(): Promise<void> {
  const c = await cookies();
  if (!requireAdminCookie(c)) throw new Error("Unauthorized");
}

export async function updateTiendaOrderStatusAction(orderUuid: string, status: string): Promise<void> {
  await assertAdmin();
  if (!isTiendaOrderOpsStatus(status)) throw new Error("Invalid status");

  const supabase = getAdminSupabase();
  const { error } = await supabase
    .from("tienda_orders")
    .update({ status: status as TiendaOrderOpsStatus, updated_at: new Date().toISOString() })
    .eq("id", orderUuid);
  if (error) throw new Error(error.message);

  revalidatePath("/admin");
  revalidatePath("/admin/tienda/orders");
  revalidatePath(`/admin/tienda/orders/${orderUuid}`);
  // TODO: write admin_audit_log (actor, action: tienda_order.status, target_id, meta) when audit table ships
}

export async function updateTiendaOrderAdminNotesAction(orderUuid: string, formData: FormData): Promise<void> {
  await assertAdmin();
  const raw = formData.get("admin_internal_notes");
  const notes = typeof raw === "string" ? raw.slice(0, 8000) : "";

  const supabase = getAdminSupabase();
  const { error } = await supabase
    .from("tienda_orders")
    .update({ admin_internal_notes: notes, updated_at: new Date().toISOString() })
    .eq("id", orderUuid);
  if (error) throw new Error(error.message);

  revalidatePath("/admin");
  revalidatePath("/admin/tienda/orders");
  revalidatePath(`/admin/tienda/orders/${orderUuid}`);
}

export async function setTiendaOrderUnreadAction(orderUuid: string, unread: boolean): Promise<void> {
  await assertAdmin();
  const supabase = getAdminSupabase();
  const { error } = await supabase
    .from("tienda_orders")
    .update({ unread_admin: unread, updated_at: new Date().toISOString() })
    .eq("id", orderUuid);
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
  revalidatePath("/admin/tienda/orders");
  revalidatePath(`/admin/tienda/orders/${orderUuid}`);
}
