/**
 * ADMIN-OS-01 GATE 2 — safe, explicit lookup for the 3 highest-value currently-disconnected
 * record types (lead, payment, support ticket) a staff member can link to a business via
 * `business_external_links`. Every lookup is a real `.eq("id", recordId)` read against the
 * record's own canonical table — never a guess, never a business_name match. Used both to
 * verify a record is real before creating a link, and to render an already-linked record's
 * concise operational truth on Business 360 (Gate 3).
 *
 * "analytics_session" and "contract" are deliberately NOT supported here — no canonical
 * per-record table/id exists for either today (listing_analytics rows have no stable
 * externally-referenceable id concept in the admin UI; no contracts table exists at all,
 * confirmed absent in a prior pass). Omitted rather than guessed.
 */
import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { ADMIN_LAUNCH_LEADS_INBOX_HREF } from "@/app/admin/_lib/adminNavOps";

export const SUPPORTED_EXTERNAL_RECORD_TYPES = ["lead", "payment", "support_ticket"] as const;
export type SupportedExternalRecordType = (typeof SUPPORTED_EXTERNAL_RECORD_TYPES)[number];

export function isSupportedExternalRecordType(v: string): v is SupportedExternalRecordType {
  return (SUPPORTED_EXTERNAL_RECORD_TYPES as readonly string[]).includes(v);
}

export type ExternalRecordSummary = {
  recordType: SupportedExternalRecordType;
  recordId: string;
  /** Short human label, e.g. a lead's name + inquiry type, or a payment's category + amount. */
  title: string;
  status: string | null;
  /** Formatted money amount when applicable (payments only), else null. */
  amountLabel: string | null;
  /** Customer/support context — email, phone, or ticket subject. */
  contextLabel: string | null;
  /** Best available canonical Admin destination — precise (?q=id) where the target page supports search, else the general queue (never fabricated precision). */
  adminHref: string;
};

function formatCents(cents: number | null | undefined): string | null {
  if (typeof cents !== "number" || !Number.isFinite(cents)) return null;
  return `$${(cents / 100).toFixed(2)}`;
}

/** Real, explicit by-id lookup. Returns null when the record genuinely does not exist — never fabricated. */
export async function lookupExternalRecordById(
  adminClient: SupabaseClient,
  recordType: SupportedExternalRecordType,
  recordId: string,
): Promise<ExternalRecordSummary | null> {
  const id = recordId.trim();
  if (!id) return null;

  if (recordType === "lead") {
    const { data, error } = await adminClient
      .from("leonix_leads")
      .select("id, full_name, email, inquiry_type, status")
      .eq("id", id)
      .maybeSingle();
    if (error || !data) return null;
    const row = data as { id: string; full_name: string | null; email: string | null; inquiry_type: string | null; status: string | null };
    return {
      recordType,
      recordId: row.id,
      title: `${row.full_name?.trim() || "(no name)"} — ${row.inquiry_type || "general"} inquiry`,
      status: row.status,
      amountLabel: null,
      contextLabel: row.email,
      adminHref: ADMIN_LAUNCH_LEADS_INBOX_HREF,
    };
  }

  if (recordType === "payment") {
    const { data, error } = await adminClient
      .from("leonix_payment_records")
      .select("id, category, amount_total_cents, payment_status, customer_email")
      .eq("id", id)
      .maybeSingle();
    if (error || !data) return null;
    const row = data as { id: string; category: string | null; amount_total_cents: number | null; payment_status: string | null; customer_email: string | null };
    return {
      recordType,
      recordId: row.id,
      title: `${row.category || "payment"} record`,
      status: row.payment_status,
      amountLabel: formatCents(row.amount_total_cents),
      contextLabel: row.customer_email,
      adminHref: `/admin/workspace/payment-tracker?q=${encodeURIComponent(row.id)}`,
    };
  }

  const { data, error } = await adminClient.from("support_tickets").select("id, subject, status").eq("id", id).maybeSingle();
  if (error || !data) return null;
  const row = data as { id: string; subject: string | null; status: string | null };
  return {
    recordType: "support_ticket",
    recordId: row.id,
    title: row.subject?.trim() || "(no subject)",
    status: row.status,
    amountLabel: null,
    contextLabel: null,
    adminHref: "/admin/support",
  };
}
