"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { requireAdminCookie, getAdminSupabase } from "@/app/lib/supabase/server";
import { auditAdminWrite } from "@/app/admin/_lib/auditAdminWrite";

async function assertAdmin(): Promise<void> {
  const c = await cookies();
  if (!requireAdminCookie(c)) throw new Error("Unauthorized");
}

function str(f: FormData, k: string): string {
  const v = f.get(k);
  return typeof v === "string" ? v.trim() : "";
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function uuidOrNull(raw: string): string | null {
  const t = raw.trim();
  if (!t) return null;
  return UUID_RE.test(t) ? t : null;
}

/** Minimal internal ticket log — not a customer-facing helpdesk. */
export async function createSupportTicketRecordAction(formData: FormData) {
  await assertAdmin();
  const subject = str(formData, "subject");
  const body = str(formData, "body");
  if (!subject || !body) {
    redirect("/admin/support?ticket_error=1");
  }

  const user_id = uuidOrNull(str(formData, "user_id"));
  const order_id = uuidOrNull(str(formData, "order_id"));
  const listing_id = uuidOrNull(str(formData, "listing_id"));

  const supabase = getAdminSupabase();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("support_tickets")
    .insert({ subject, body, status: "open", updated_at: now, user_id, order_id, listing_id })
    .select("id")
    .single();

  if (error || !data) {
    redirect("/admin/support?ticket_error=1");
  }

  const ticketId = (data as { id: string }).id;

  auditAdminWrite("support_ticket_created", "support_tickets", ticketId, {
    subject: subject.slice(0, 120),
    user_id,
    order_id,
    listing_id,
  });

  revalidatePath("/admin/support");
  redirect("/admin/support?ticket_saved=1");
}
