"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { requireAdminCookie, getAdminSupabase } from "@/app/lib/supabase/server";
import { appendAdminAuditLog } from "@/app/admin/_lib/adminAuditLogServer";

async function assertAdmin(): Promise<void> {
  const c = await cookies();
  if (!requireAdminCookie(c)) throw new Error("Unauthorized");
}

function str(f: FormData, k: string): string {
  const v = f.get(k);
  return typeof v === "string" ? v.trim() : "";
}

/** Minimal internal ticket log — not a customer-facing helpdesk. */
export async function createSupportTicketRecordAction(formData: FormData) {
  await assertAdmin();
  const subject = str(formData, "subject");
  const body = str(formData, "body");
  if (!subject || !body) {
    redirect("/admin/support?ticket_error=1");
  }

  const supabase = getAdminSupabase();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("support_tickets")
    .insert({ subject, body, status: "open", updated_at: now })
    .select("id")
    .single();

  if (error || !data) {
    redirect("/admin/support?ticket_error=1");
  }

  const ticketId = (data as { id: string }).id;

  await appendAdminAuditLog({
    action: "support_ticket_created",
    targetType: "support_tickets",
    targetId: ticketId,
    meta: { subject: subject.slice(0, 120) },
  });

  revalidatePath("/admin/support");
  redirect("/admin/support?ticket_saved=1");
}
