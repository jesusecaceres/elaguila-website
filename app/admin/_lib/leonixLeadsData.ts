/**
 * Admin read-only lead inbox — server-only via service role.
 */
import "server-only";

import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";

export const LEAD_CAPTURE_MIGRATION_NOTE =
  "Lead capture tables are not available. Apply the Supabase migration first.";

export const LEAD_LIST_DEFAULT_LIMIT = 100;
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
