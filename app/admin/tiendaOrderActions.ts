"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { requireAdminCookie, getAdminSupabase } from "@/app/lib/supabase/server";
import { auditAdminWrite } from "@/app/admin/_lib/auditAdminWrite";
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
  auditAdminWrite("tienda_order_status_updated", "tienda_orders", orderUuid, { status });
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
  auditAdminWrite("tienda_order_admin_notes_updated", "tienda_orders", orderUuid, {
    notesLength: notes.length,
  });
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
  auditAdminWrite("tienda_order_unread_toggled", "tienda_orders", orderUuid, { unread });
}
