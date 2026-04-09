"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminSupabase } from "@/app/lib/supabase/server";
import { auditAdminWrite } from "@/app/admin/_lib/auditAdminWrite";
import { requireLeonixAdminPermission } from "@/app/admin/_lib/leonixAdminGate";

/** Internal support log — gated with `can_manage_reports` when roster enforcement is on (ops proxy). */
async function assertSupportTicketAdmin(): Promise<void> {
  await requireLeonixAdminPermission("can_manage_reports");
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
  await assertSupportTicketAdmin();
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
  /** Omit unset FK keys so inserts succeed when entity-link columns are not migrated yet. */
  const row: Record<string, unknown> = {
    subject,
    body,
    status: "open",
    updated_at: now,
  };
  if (user_id) row.user_id = user_id;
  if (order_id) row.order_id = order_id;
  if (listing_id) row.listing_id = listing_id;

  const { data, error } = await supabase.from("support_tickets").insert(row).select("id").single();

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
  redirect("/admin/support?ticket_created=1");
}

const TICKET_STATUS = new Set(["open", "in_progress", "closed"]);
const ESCALATION_TAGS = new Set(["Billing", "Technical", "Fraud", "Content"]);

function schemaColumnMissing(err: { message?: string } | null): boolean {
  const m = (err?.message ?? "").toLowerCase();
  return /column|does not exist|schema cache/i.test(m);
}

/** Status always persisted; notes + escalation require migration `20260408210000_support_tickets_staff_followup.sql`. */
export async function updateSupportTicketFollowupAction(formData: FormData) {
  await assertSupportTicketAdmin();
  const id = uuidOrNull(str(formData, "ticket_id"));
  if (!id) redirect("/admin/support?ticket_error=1");

  const status = str(formData, "status");
  if (!TICKET_STATUS.has(status)) redirect("/admin/support?ticket_error=1");

  const staff_internal_notes = str(formData, "staff_internal_notes") || null;
  const escRaw = str(formData, "escalation_tag");
  const escalation_tag =
    escRaw === "" ? null : ESCALATION_TAGS.has(escRaw) ? escRaw : null;
  if (escRaw !== "" && escalation_tag === null) {
    redirect("/admin/support?ticket_error=1");
  }

  const supabase = getAdminSupabase();
  const now = new Date().toISOString();

  const full = { status, updated_at: now, staff_internal_notes, escalation_tag };
  let { error } = await supabase.from("support_tickets").update(full).eq("id", id);

  if (error && schemaColumnMissing(error)) {
    const { error: e2 } = await supabase
      .from("support_tickets")
      .update({ status, updated_at: now })
      .eq("id", id);
    error = e2;
    if (!error) {
      auditAdminWrite("support_ticket_updated", "support_tickets", id, {
        status,
        staff_followup_columns: "unavailable",
      });
      revalidatePath("/admin/support");
      redirect("/admin/support?ticket_saved=1&followup_columns=0");
    }
  }

  if (error) redirect("/admin/support?ticket_error=1");

  auditAdminWrite("support_ticket_updated", "support_tickets", id, {
    status,
    escalation_tag,
    notes_len: staff_internal_notes?.length ?? 0,
  });

  revalidatePath("/admin/support");
  redirect("/admin/support?ticket_saved=1");
}
