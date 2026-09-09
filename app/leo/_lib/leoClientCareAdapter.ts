/**
 * LEO-5 Client Care source adapter — bounded, read-only, minimized fields.
 *
 * Uses existing Admin Supabase server infrastructure. No writes. No client Supabase.
 */
import "server-only";

import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import {
  LEO_CLIENT_CARE_POLICY,
  type LeoClientCareLeadRecord,
  type LeoClientCareSupportRecord,
} from "@/app/leo/_lib/leoClientCareWatcher";
import type { LeoTruthAvailability } from "@/app/leo/_lib/leoTypes";

const LEAD_CARE_SELECT =
  "id,status,created_at,updated_at,last_contacted_at,follow_up_at,archived_at,deleted_at,inquiry_type,business_category";

const SUPPORT_CARE_SELECT = "id,status,created_at,updated_at,subject";

export type LeoClientCareSourceBundle = {
  leads: LeoClientCareLeadRecord[];
  supportTickets: LeoClientCareSupportRecord[];
  leadsAvailability: LeoTruthAvailability;
  supportAvailability: LeoTruthAvailability;
  limitations: string[];
};

function mapUnavailable(e: unknown): boolean {
  if (!e || typeof e !== "object") return false;
  const msg =
    "message" in e && typeof (e as { message: unknown }).message === "string"
      ? (e as { message: string }).message
      : "";
  const code = "code" in e && typeof (e as { code: unknown }).code === "string" ? (e as { code: string }).code : "";
  return code === "PGRST205" || /does not exist|schema cache/i.test(msg);
}

function safeLeadLabel(inquiryType: unknown, businessCategory: unknown): string | null {
  const a = typeof inquiryType === "string" ? inquiryType.trim() : "";
  const b = typeof businessCategory === "string" ? businessCategory.trim() : "";
  if (a) return a.slice(0, 80);
  if (b) return b.slice(0, 80);
  return null;
}

function truncateSubject(subject: unknown): string | null {
  if (typeof subject !== "string") return null;
  const t = subject.trim();
  if (!t) return null;
  return t.length > 80 ? `${t.slice(0, 77)}...` : t;
}

/**
 * Fetch bounded active launch leads + open support tickets for care evaluation.
 * Does not select email, phone, message body, or notes.
 */
export async function fetchLeoClientCareSourceRecords(): Promise<LeoClientCareSourceBundle> {
  const limitations: string[] = [];

  if (!isSupabaseAdminConfigured()) {
    return {
      leads: [],
      supportTickets: [],
      leadsAvailability: "UNAVAILABLE",
      supportAvailability: "UNAVAILABLE",
      limitations: [
        "Supabase admin client not configured — Client Care sources UNAVAILABLE.",
        ...limitations,
      ],
    };
  }

  const supabase = getAdminSupabase();
  let leads: LeoClientCareLeadRecord[] = [];
  let supportTickets: LeoClientCareSupportRecord[] = [];
  let leadsAvailability: LeoTruthAvailability = "LIVE";
  let supportAvailability: LeoTruthAvailability = "LIVE";

  try {
    const { data, error } = await supabase
      .from("leonix_leads")
      .select(LEAD_CARE_SELECT)
      .is("deleted_at", null)
      .is("archived_at", null)
      .not("status", "in", "(won,lost,archived)")
      .order("updated_at", { ascending: false })
      .limit(LEO_CLIENT_CARE_POLICY.maxLeadRows);

    if (error) {
      if (mapUnavailable(error)) {
        leadsAvailability = "UNAVAILABLE";
        limitations.push("leonix_leads table unavailable for Client Care adapter.");
      } else {
        leadsAvailability = "PARTIAL";
        limitations.push(`leonix_leads read error: ${error.message}`);
      }
    } else {
      leads = (data ?? []).map((row) => {
        const r = row as Record<string, unknown>;
        return {
          id: String(r.id),
          status: String(r.status ?? ""),
          created_at: String(r.created_at ?? ""),
          updated_at: r.updated_at == null ? null : String(r.updated_at),
          last_contacted_at: r.last_contacted_at == null ? null : String(r.last_contacted_at),
          follow_up_at: r.follow_up_at == null ? null : String(r.follow_up_at),
          archived_at: r.archived_at == null ? null : String(r.archived_at),
          deleted_at: r.deleted_at == null ? null : String(r.deleted_at),
          safeLabel: safeLeadLabel(r.inquiry_type, r.business_category),
        };
      });
      if (leads.length >= LEO_CLIENT_CARE_POLICY.maxLeadRows) {
        limitations.push(
          `Lead read hit maxLeadRows=${LEO_CLIENT_CARE_POLICY.maxLeadRows} — coverage may be incomplete.`,
        );
      }
    }
  } catch (e) {
    leadsAvailability = mapUnavailable(e) ? "UNAVAILABLE" : "PARTIAL";
    limitations.push("leonix_leads adapter exception — treated as degraded.");
  }

  try {
    const { data, error } = await supabase
      .from("support_tickets")
      .select(SUPPORT_CARE_SELECT)
      .in("status", ["open", "in_progress"])
      .order("created_at", { ascending: false })
      .limit(LEO_CLIENT_CARE_POLICY.maxSupportRows);

    if (error) {
      if (mapUnavailable(error)) {
        supportAvailability = "UNAVAILABLE";
        limitations.push("support_tickets table unavailable for Client Care adapter.");
      } else {
        supportAvailability = "PARTIAL";
        limitations.push(`support_tickets read error: ${error.message}`);
      }
    } else {
      supportTickets = (data ?? []).map((row) => {
        const r = row as Record<string, unknown>;
        return {
          id: String(r.id),
          status: String(r.status ?? ""),
          created_at: String(r.created_at ?? ""),
          updated_at: r.updated_at == null ? null : String(r.updated_at),
          subjectLabel: truncateSubject(r.subject),
        };
      });
      if (supportTickets.length >= LEO_CLIENT_CARE_POLICY.maxSupportRows) {
        limitations.push(
          `Support read hit maxSupportRows=${LEO_CLIENT_CARE_POLICY.maxSupportRows} — coverage may be incomplete.`,
        );
      }
    }
  } catch {
    supportAvailability = "PARTIAL";
    limitations.push("support_tickets adapter exception — treated as degraded.");
  }

  return {
    leads,
    supportTickets,
    leadsAvailability,
    supportAvailability,
    limitations,
  };
}
