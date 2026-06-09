import type { SupabaseClient } from "@supabase/supabase-js";
import {
  parseAudienceType,
  parseInquiryType,
  parsePreferredContactMethod,
  type InquiryType,
} from "./inquiryTypes";
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

export type SaveContactInquiryResult =
  | { ok: true; id: string }
  | {
      ok: false;
      error:
        | "invalid_email"
        | "email_required"
        | "name_required"
        | "message_required"
        | "consent_required"
        | "save_failed";
    };

export async function saveNewsletterSubscriber(
  supabase: SupabaseClient,
  input: {
    email: string;
    name?: string;
    city?: string;
    zipCode?: string;
    businessName?: string;
    audienceType?: unknown;
    wantsLaunchUpdates?: boolean;
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
    business_name: trimField(input.businessName, LEAD_LIMITS.business),
    audience_type: parseAudienceType(input.audienceType),
    wants_launch_updates: input.wantsLaunchUpdates !== false,
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

export async function saveContactInquiry(
  supabase: SupabaseClient,
  input: {
    fullName: string;
    email: string;
    phone?: string;
    businessName?: string;
    inquiryType?: unknown;
    preferredContactMethod?: unknown;
    cityArea?: string;
    websiteOrSocial?: string;
    businessCategory?: string;
    message: string;
    sourcePage?: string;
    sourceCta?: string;
    lang?: unknown;
    wantsLaunchUpdates?: boolean;
    consentToContact: boolean;
    consentTimestamp: string;
  }
): Promise<SaveContactInquiryResult> {
  const fullName = trimField(input.fullName, LEAD_LIMITS.name);
  if (!fullName) return { ok: false, error: "name_required" };

  const email = normalizeLeadEmail(input.email);
  if (!email) return { ok: false, error: "email_required" };
  if (!isValidLeadEmail(email)) return { ok: false, error: "invalid_email" };

  const message = trimField(input.message, LEAD_LIMITS.message);
  if (!message) return { ok: false, error: "message_required" };

  if (!input.consentToContact) return { ok: false, error: "consent_required" };

  const lang = parseLeadLang(input.lang);
  const inquiryType: InquiryType = parseInquiryType(input.inquiryType, "general");
  const now = input.consentTimestamp;

  const row = {
    full_name: fullName,
    email,
    phone: trimField(input.phone, LEAD_LIMITS.phone),
    business_name: trimField(input.businessName, LEAD_LIMITS.business),
    inquiry_type: inquiryType,
    preferred_contact_method: parsePreferredContactMethod(input.preferredContactMethod),
    city_area: trimField(input.cityArea, LEAD_LIMITS.cityArea),
    website_or_social: trimField(input.websiteOrSocial, LEAD_LIMITS.websiteOrSocial),
    business_category: trimField(input.businessCategory, LEAD_LIMITS.businessCategory),
    message,
    source_page: trimField(input.sourcePage, LEAD_LIMITS.sourcePage) || "/contacto",
    source_cta: trimField(input.sourceCta, LEAD_LIMITS.sourceCta),
    lang,
    wants_launch_updates: Boolean(input.wantsLaunchUpdates),
    consent_to_contact: true,
    consent_timestamp: now,
    status: "new",
    email_notification_sent: false,
    email_notification_error: "",
    updated_at: now,
  };

  const { data: inserted, error } = await supabase
    .from("leonix_contact_inquiries")
    .insert(row)
    .select("id")
    .single();

  if (error || !inserted?.id) {
    console.error("[contact] insert failed", { code: error?.code });
    return { ok: false, error: "save_failed" };
  }

  return { ok: true, id: inserted.id };
}

export async function markContactInquiryEmailSent(
  supabase: SupabaseClient,
  id: string,
  sent: boolean,
  errorMessage = ""
): Promise<void> {
  await supabase
    .from("leonix_contact_inquiries")
    .update({
      email_notification_sent: sent,
      email_notification_error: sent ? "" : trimField(errorMessage, 500),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
}
