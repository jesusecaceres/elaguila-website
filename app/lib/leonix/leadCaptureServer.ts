import type { SupabaseClient } from "@supabase/supabase-js";
import {
  isValidLeadEmail,
  LEAD_LIMITS,
  normalizeLeadEmail,
  parseLeadLang,
  parsePreferredLanguage,
  sanitizeLeadSource,
  trimField,
  type LeadLang,
} from "./leadCaptureValidation";

export type SaveNewsletterResult =
  | { ok: true; id: string; updated: boolean }
  | { ok: false; error: "invalid_email" | "email_required" | "save_failed" };

export type SaveMediaKitLeadResult =
  | { ok: true; id: string }
  | { ok: false; error: "invalid_email" | "email_required" | "name_required" | "save_failed" };

export async function saveNewsletterSubscriber(
  supabase: SupabaseClient,
  input: {
    email: string;
    name?: string;
    city?: string;
    zipCode?: string;
    preferredLanguage?: unknown;
    interests?: string;
    source?: unknown;
    lang?: unknown;
    consentTimestamp: string;
  }
): Promise<SaveNewsletterResult> {
  const email = normalizeLeadEmail(input.email);
  if (!email) return { ok: false, error: "email_required" };
  if (!isValidLeadEmail(email)) return { ok: false, error: "invalid_email" };

  const lang = parseLeadLang(input.lang);
  const now = input.consentTimestamp;
  const row = {
    email,
    name: trimField(input.name, LEAD_LIMITS.name),
    city: trimField(input.city, LEAD_LIMITS.city),
    zip_code: trimField(input.zipCode, LEAD_LIMITS.zipCode),
    preferred_language: parsePreferredLanguage(input.preferredLanguage),
    interests: trimField(input.interests, LEAD_LIMITS.interests),
    source: sanitizeLeadSource(input.source, "newsletter_page"),
    lang,
    status: "subscribed",
    consent_timestamp: now,
    updated_at: now,
  };

  const { data: existing, error: selectError } = await supabase
    .from("leonix_newsletter_subscribers")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (selectError) {
    console.error("[newsletter] lookup failed", { code: selectError.code });
    return { ok: false, error: "save_failed" };
  }

  if (existing?.id) {
    const { error: updateError } = await supabase
      .from("leonix_newsletter_subscribers")
      .update(row)
      .eq("id", existing.id);

    if (updateError) {
      console.error("[newsletter] update failed", { code: updateError.code });
      return { ok: false, error: "save_failed" };
    }
    return { ok: true, id: existing.id, updated: true };
  }

  const { data: inserted, error: insertError } = await supabase
    .from("leonix_newsletter_subscribers")
    .insert({ ...row, created_at: now })
    .select("id")
    .single();

  if (insertError || !inserted?.id) {
    console.error("[newsletter] insert failed", { code: insertError?.code });
    return { ok: false, error: "save_failed" };
  }

  return { ok: true, id: inserted.id, updated: false };
}

export async function saveMediaKitLead(
  supabase: SupabaseClient,
  input: {
    name: string;
    email: string;
    phone?: string;
    business?: string;
    message?: string;
    lang?: unknown;
    source?: unknown;
  }
): Promise<SaveMediaKitLeadResult> {
  const name = trimField(input.name, LEAD_LIMITS.name);
  if (!name) return { ok: false, error: "name_required" };

  const email = normalizeLeadEmail(input.email);
  if (!email) return { ok: false, error: "email_required" };
  if (!isValidLeadEmail(email)) return { ok: false, error: "invalid_email" };

  const lang: LeadLang = parseLeadLang(input.lang);
  const now = new Date().toISOString();

  const row = {
    name,
    email,
    phone: trimField(input.phone, LEAD_LIMITS.phone),
    business: trimField(input.business, LEAD_LIMITS.business),
    message: trimField(input.message, LEAD_LIMITS.message),
    lang,
    source: sanitizeLeadSource(input.source, "media_kit_page"),
    status: "new",
    updated_at: now,
  };

  const { data: inserted, error } = await supabase
    .from("leonix_media_kit_leads")
    .insert(row)
    .select("id")
    .single();

  if (error || !inserted?.id) {
    console.error("[media-kit] insert failed", { code: error?.code });
    return { ok: false, error: "save_failed" };
  }

  return { ok: true, id: inserted.id };
}
