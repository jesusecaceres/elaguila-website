/**
 * Admin read-only lead inbox — server-only via service role.
 */
import "server-only";

import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";

export const LEAD_CAPTURE_MIGRATION_NOTE =
  "Lead capture tables are not available. Apply the Supabase migration first.";

export const LEAD_LIST_DEFAULT_LIMIT = 100;
/** Inbox UI loads more rows for daily ops (still capped for performance). */
export const LEAD_INBOX_DISPLAY_LIMIT = 500;
export const LEAD_EXPORT_MAX_ROWS = 10_000;

export type NewsletterSubscriberRow = {
  id: string;
  email: string;
  name: string;
  city: string;
  zip_code: string;
  preferred_language: string;
  interests: string;
  source: string;
  lang: string;
  status: string;
  consent_timestamp: string;
  created_at: string;
  updated_at: string;
};

import { LEONIX_LEAD_STATUSES, type LeonixLeadStatus } from "./leonixLeadStatuses";

export { LEONIX_LEAD_STATUSES, type LeonixLeadStatus };

export type LeonixLeadRow = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  business_name: string;
  inquiry_type: string;
  preferred_contact_method: string;
  city_area: string;
  website_or_social: string;
  business_category: string;
  message: string;
  source_page: string;
  source_cta: string;
  lang: string;
  wants_launch_updates: boolean;
  consent_to_contact: boolean;
  status: string;
  internal_notes: string;
  last_contacted_at: string | null;
  follow_up_at: string | null;
  archived_at: string | null;
  archived_by: string | null;
  deleted_at: string | null;
  deleted_by: string | null;
  created_at: string;
  updated_at: string;
};

export type MediaKitLeadRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  business: string;
  message: string;
  lang: string;
  source: string;
  status: string;
  created_at: string;
  updated_at: string;
};

export type AdminLeadListResult<T> = {
  rows: T[];
  total: number;
  dataUnavailable: boolean;
  dataUnavailableNote: string | null;
  error: string | null;
};

function mapTableError(e: unknown): { unavailable: boolean; message: string | null } {
  if (!e || typeof e !== "object") return { unavailable: false, message: null };
  const msg =
    "message" in e && typeof (e as { message: unknown }).message === "string"
      ? (e as { message: string }).message
      : "";
  const code = "code" in e && typeof (e as { code: unknown }).code === "string" ? (e as { code: string }).code : "";
  if (code === "PGRST205" || msg.includes("does not exist") || msg.includes("schema cache")) {
    return { unavailable: true, message: LEAD_CAPTURE_MIGRATION_NOTE };
  }
  return { unavailable: false, message: msg || "Could not load leads." };
}

function supabaseUnavailable<T>(): AdminLeadListResult<T> {
  return {
    rows: [],
    total: 0,
    dataUnavailable: true,
    dataUnavailableNote: "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    error: null,
  };
}

const LEONIX_LEAD_SELECT =
  "id,full_name,email,phone,business_name,inquiry_type,preferred_contact_method,city_area,website_or_social,business_category,message,source_page,source_cta,lang,wants_launch_updates,consent_to_contact,status,internal_notes,last_contacted_at,follow_up_at,archived_at,archived_by,deleted_at,deleted_by,created_at,updated_at";

export type LeadInboxBucket = "active" | "archived" | "all_non_deleted";

export async function listLeonixLeadsForAdmin(
  limit = LEAD_LIST_DEFAULT_LIMIT,
  bucket: LeadInboxBucket = "all_non_deleted",
): Promise<AdminLeadListResult<LeonixLeadRow>> {
  if (!isSupabaseAdminConfigured()) return supabaseUnavailable();

  try {
    const supabase = getAdminSupabase();
    let query = supabase.from("leonix_leads").select(LEONIX_LEAD_SELECT, { count: "exact" });

    query = query.is("deleted_at", null);
    if (bucket === "active") {
      query = query.is("archived_at", null);
    } else if (bucket === "archived") {
      query = query.not("archived_at", "is", null);
    }

    const { data, error, count } = await query.order("created_at", { ascending: false }).limit(limit);

    if (error) {
      const mapped = mapTableError(error);
      return {
        rows: [],
        total: 0,
        dataUnavailable: mapped.unavailable,
        dataUnavailableNote: mapped.unavailable ? mapped.message : null,
        error: mapped.message,
      };
    }

    return {
      rows: (data ?? []) as LeonixLeadRow[],
      total: typeof count === "number" ? count : (data ?? []).length,
      dataUnavailable: false,
      dataUnavailableNote: null,
      error: null,
    };
  } catch (e) {
    const mapped = mapTableError(e);
    return {
      rows: [],
      total: 0,
      dataUnavailable: mapped.unavailable,
      dataUnavailableNote: mapped.unavailable ? mapped.message : null,
      error: mapped.message,
    };
  }
}

export async function fetchAllLeonixLeadsForExport(): Promise<AdminLeadListResult<LeonixLeadRow>> {
  if (!isSupabaseAdminConfigured()) return supabaseUnavailable();

  try {
    const supabase = getAdminSupabase();
    const { data, error } = await supabase
      .from("leonix_leads")
      .select(LEONIX_LEAD_SELECT)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(LEAD_EXPORT_MAX_ROWS);

    if (error) {
      const mapped = mapTableError(error);
      return {
        rows: [],
        total: 0,
        dataUnavailable: mapped.unavailable,
        dataUnavailableNote: mapped.unavailable ? mapped.message : null,
        error: mapped.message,
      };
    }

    return {
      rows: (data ?? []) as LeonixLeadRow[],
      total: (data ?? []).length,
      dataUnavailable: false,
      dataUnavailableNote: null,
      error: null,
    };
  } catch (e) {
    const mapped = mapTableError(e);
    return {
      rows: [],
      total: 0,
      dataUnavailable: mapped.unavailable,
      dataUnavailableNote: mapped.unavailable ? mapped.message : null,
      error: mapped.message,
    };
  }
}

export type UpdateLeonixLeadResult =
  | { ok: true; row: LeonixLeadRow }
  | { ok: false; error: "not_found" | "invalid_status" | "save_failed" | "already_deleted" };

export type LeadLifecycleAction = "archive" | "restore" | "delete" | "mark_contacted";

export type LeadLifecycleResult =
  | { ok: true; row: LeonixLeadRow }
  | { ok: false; error: "not_found" | "already_deleted" | "save_failed" };

export async function applyLeonixLeadLifecycleAdmin(
  id: string,
  action: LeadLifecycleAction,
  actor = "leonix_admin",
): Promise<LeadLifecycleResult> {
  if (!isSupabaseAdminConfigured()) {
    return { ok: false, error: "save_failed" };
  }

  const now = new Date().toISOString();
  const supabase = getAdminSupabase();

  const { data: existing, error: readErr } = await supabase
    .from("leonix_leads")
    .select(LEONIX_LEAD_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (readErr || !existing) {
    return { ok: false, error: "not_found" };
  }

  const row = existing as LeonixLeadRow;
  if (row.deleted_at) {
    return { ok: false, error: "already_deleted" };
  }

  let updates: Record<string, string | null> = { updated_at: now };

  switch (action) {
    case "archive":
      updates = {
        ...updates,
        status: "archived",
        archived_at: now,
        archived_by: actor,
      };
      break;
    case "restore":
      updates = {
        ...updates,
        status: row.status === "archived" ? "needs_reply" : row.status,
        archived_at: null,
        archived_by: null,
      };
      break;
    case "delete":
      updates = {
        ...updates,
        deleted_at: now,
        deleted_by: actor,
      };
      break;
    case "mark_contacted":
      updates = {
        ...updates,
        last_contacted_at: now,
        status:
          row.status === "new" || row.status === "needs_reply" ? "contacted" : row.status,
      };
      break;
    default:
      return { ok: false, error: "save_failed" };
  }

  const { data, error } = await supabase
    .from("leonix_leads")
    .update(updates)
    .eq("id", id)
    .select(LEONIX_LEAD_SELECT)
    .maybeSingle();

  if (error || !data) {
    console.error("[admin/leads] lifecycle failed", { code: error?.code, action });
    return { ok: false, error: "save_failed" };
  }

  return { ok: true, row: data as LeonixLeadRow };
}

export async function updateLeonixLeadAdmin(
  id: string,
  patch: {
    status?: string;
    internal_notes?: string;
    follow_up_at?: string | null;
  }
): Promise<UpdateLeonixLeadResult> {
  if (!isSupabaseAdminConfigured()) {
    return { ok: false, error: "save_failed" };
  }

  const updates: Record<string, string | null> = {
    updated_at: new Date().toISOString(),
  };

  if (patch.status != null) {
    const status = patch.status.trim();
    if (!(LEONIX_LEAD_STATUSES as readonly string[]).includes(status)) {
      return { ok: false, error: "invalid_status" };
    }
    updates.status = status;
  }

  if (patch.internal_notes != null) {
    updates.internal_notes = patch.internal_notes.trim().slice(0, 4000);
  }

  if (patch.follow_up_at !== undefined) {
    if (patch.follow_up_at === null || patch.follow_up_at.trim() === "") {
      updates.follow_up_at = null;
    } else {
      const d = new Date(patch.follow_up_at);
      if (!Number.isFinite(d.getTime())) {
        return { ok: false, error: "invalid_status" };
      }
      updates.follow_up_at = d.toISOString();
    }
  }

  try {
    const supabase = getAdminSupabase();

    const { data: existing, error: readErr } = await supabase
      .from("leonix_leads")
      .select("deleted_at")
      .eq("id", id)
      .maybeSingle();

    if (readErr || !existing) {
      return { ok: false, error: "not_found" };
    }
    if ((existing as { deleted_at: string | null }).deleted_at) {
      return { ok: false, error: "already_deleted" };
    }

    const { data, error } = await supabase
      .from("leonix_leads")
      .update(updates)
      .eq("id", id)
      .select(LEONIX_LEAD_SELECT)
      .maybeSingle();

    if (error) {
      console.error("[admin/leads] update failed", { code: error.code });
      return { ok: false, error: "save_failed" };
    }
    if (!data) return { ok: false, error: "not_found" };
    return { ok: true, row: data as LeonixLeadRow };
  } catch {
    return { ok: false, error: "save_failed" };
  }
}

export async function listNewsletterSubscribersForAdmin(
  limit = LEAD_LIST_DEFAULT_LIMIT
): Promise<AdminLeadListResult<NewsletterSubscriberRow>> {
  if (!isSupabaseAdminConfigured()) return supabaseUnavailable();

  try {
    const supabase = getAdminSupabase();
    const { data, error, count } = await supabase
      .from("leonix_newsletter_subscribers")
      .select(
        "id,email,name,city,zip_code,preferred_language,interests,source,lang,status,consent_timestamp,created_at,updated_at",
        { count: "exact" }
      )
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      const mapped = mapTableError(error);
      return {
        rows: [],
        total: 0,
        dataUnavailable: mapped.unavailable,
        dataUnavailableNote: mapped.unavailable ? mapped.message : null,
        error: mapped.message,
      };
    }

    return {
      rows: (data ?? []) as NewsletterSubscriberRow[],
      total: typeof count === "number" ? count : (data ?? []).length,
      dataUnavailable: false,
      dataUnavailableNote: null,
      error: null,
    };
  } catch (e) {
    const mapped = mapTableError(e);
    return {
      rows: [],
      total: 0,
      dataUnavailable: mapped.unavailable,
      dataUnavailableNote: mapped.unavailable ? mapped.message : null,
      error: mapped.message,
    };
  }
}

export async function listMediaKitLeadsForAdmin(
  limit = LEAD_LIST_DEFAULT_LIMIT
): Promise<AdminLeadListResult<MediaKitLeadRow>> {
  if (!isSupabaseAdminConfigured()) return supabaseUnavailable();

  try {
    const supabase = getAdminSupabase();
    const { data, error, count } = await supabase
      .from("leonix_media_kit_leads")
      .select("id,name,email,phone,business,message,lang,source,status,created_at,updated_at", {
        count: "exact",
      })
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      const mapped = mapTableError(error);
      return {
        rows: [],
        total: 0,
        dataUnavailable: mapped.unavailable,
        dataUnavailableNote: mapped.unavailable ? mapped.message : null,
        error: mapped.message,
      };
    }

    return {
      rows: (data ?? []) as MediaKitLeadRow[],
      total: typeof count === "number" ? count : (data ?? []).length,
      dataUnavailable: false,
      dataUnavailableNote: null,
      error: null,
    };
  } catch (e) {
    const mapped = mapTableError(e);
    return {
      rows: [],
      total: 0,
      dataUnavailable: mapped.unavailable,
      dataUnavailableNote: mapped.unavailable ? mapped.message : null,
      error: mapped.message,
    };
  }
}

export async function fetchAllNewsletterSubscribersForExport(): Promise<
  AdminLeadListResult<NewsletterSubscriberRow>
> {
  if (!isSupabaseAdminConfigured()) return supabaseUnavailable();

  try {
    const supabase = getAdminSupabase();
    const { data, error } = await supabase
      .from("leonix_newsletter_subscribers")
      .select(
        "id,email,name,city,zip_code,preferred_language,interests,source,lang,status,consent_timestamp,created_at,updated_at"
      )
      .order("created_at", { ascending: false })
      .limit(LEAD_EXPORT_MAX_ROWS);

    if (error) {
      const mapped = mapTableError(error);
      return {
        rows: [],
        total: 0,
        dataUnavailable: mapped.unavailable,
        dataUnavailableNote: mapped.unavailable ? mapped.message : null,
        error: mapped.message,
      };
    }

    return {
      rows: (data ?? []) as NewsletterSubscriberRow[],
      total: (data ?? []).length,
      dataUnavailable: false,
      dataUnavailableNote: null,
      error: null,
    };
  } catch (e) {
    const mapped = mapTableError(e);
    return {
      rows: [],
      total: 0,
      dataUnavailable: mapped.unavailable,
      dataUnavailableNote: mapped.unavailable ? mapped.message : null,
      error: mapped.message,
    };
  }
}

export async function fetchAllMediaKitLeadsForExport(): Promise<AdminLeadListResult<MediaKitLeadRow>> {
  if (!isSupabaseAdminConfigured()) return supabaseUnavailable();

  try {
    const supabase = getAdminSupabase();
    const { data, error } = await supabase
      .from("leonix_media_kit_leads")
      .select("id,name,email,phone,business,message,lang,source,status,created_at,updated_at")
      .order("created_at", { ascending: false })
      .limit(LEAD_EXPORT_MAX_ROWS);

    if (error) {
      const mapped = mapTableError(error);
      return {
        rows: [],
        total: 0,
        dataUnavailable: mapped.unavailable,
        dataUnavailableNote: mapped.unavailable ? mapped.message : null,
        error: mapped.message,
      };
    }

    return {
      rows: (data ?? []) as MediaKitLeadRow[],
      total: (data ?? []).length,
      dataUnavailable: false,
      dataUnavailableNote: null,
      error: null,
    };
  } catch (e) {
    const mapped = mapTableError(e);
    return {
      rows: [],
      total: 0,
      dataUnavailable: mapped.unavailable,
      dataUnavailableNote: mapped.unavailable ? mapped.message : null,
      error: mapped.message,
    };
  }
}
