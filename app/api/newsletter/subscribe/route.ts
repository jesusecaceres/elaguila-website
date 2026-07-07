import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { buildLaunchSignupEmail } from "@/app/lib/email/contactInquiryEmail";
import { buildNewsletterPromoCodeEmail } from "@/app/lib/email/newsletterPromoCodeEmail";
import { resolveLeonixNotificationEmail } from "@/app/lib/email/leonixNotificationRecipient";
import { resolveLeonixResendConfig } from "@/app/lib/email/leonixResendConfig";
import { sendLeonixResendEmail } from "@/app/lib/email/sendLeonixResendEmail";
import { saveNewsletterSubscriber } from "@/app/lib/leonix/leadCaptureServer";
import {
  buildPromoCodeRulePreview,
  generateLeonixPromoCode,
} from "@/app/lib/listingPlans/promoCodeLifecycle";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";

export const runtime = "nodejs";

const MAX_BODY_BYTES = 8_192;

const NEWSLETTER_PROMO_PERCENT_OFF = 25;
const NEWSLETTER_PROMO_TTL_DAYS = 60;
const NEWSLETTER_PROMO_CODE_PREFIX = "LX-NEWS";

function isTruthyConsent(value: unknown): boolean {
  return value === true || value === "true" || value === 1 || value === "1";
}

function resolvePublicSiteUrl(): string {
  const explicit = process.env.LEONIX_SITE_URL?.trim() || process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) return `https://${vercel.replace(/\/$/, "")}`;
  return "https://leonixmedia.com";
}

function asMetadataObject(raw: unknown): Record<string, unknown> {
  return raw && typeof raw === "object" && !Array.isArray(raw) ? { ...(raw as Record<string, unknown>) } : {};
}

type NewsletterPromoOutcome =
  | {
      status: "created" | "reused";
      promoCodeId: string;
      code: string;
      percentOff: number;
      expiresAt: string | null;
      metadata: Record<string, unknown>;
    }
  | { status: "failed"; reason: string }
  | { status: "skipped"; reason: string };

function resolveCaptureChannel(source: string): string {
  const s = source.trim().toLowerCase();
  if (s === "account_signup") return "account_signup";
  if (s === "dashboard") return "dashboard";
  if (s === "profile_onboarding") return "profile_onboarding";
  if (s.startsWith("coming-soon")) return "coming_soon_signup";
  return "newsletter_signup";
}

/**
 * Create or reuse exactly one active newsletter promo code per subscriber email.
 * Promo codes discount a future checkout only — they never grant paid placement.
 */
async function ensureNewsletterPromoCode(
  supabase: SupabaseClient,
  input: {
    email: string;
    name?: string | null;
    businessName?: string | null;
    phone?: string | null;
    subscriberId: string | null;
    source: string;
    sourceCta: string;
    lang: "en" | "es";
  },
): Promise<NewsletterPromoOutcome> {
  const email = input.email.trim().toLowerCase();
  if (!email) return { status: "skipped", reason: "no_email" };

  try {
    const { data: existing, error: lookupError } = await supabase
      .from("leonix_promo_codes")
      .select("id, code, percent_off, ends_at, metadata")
      .eq("code_type", "newsletter")
      .eq("customer_email", email)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (lookupError) {
      console.error("[newsletter] promo lookup failed", { code: lookupError.code });
      return { status: "failed", reason: "promo_lookup_failed" };
    }

    if (existing?.id) {
      const pct =
        typeof existing.percent_off === "number" && existing.percent_off > 0
          ? existing.percent_off
          : NEWSLETTER_PROMO_PERCENT_OFF;
      return {
        status: "reused",
        promoCodeId: String(existing.id),
        code: String(existing.code),
        percentOff: pct,
        expiresAt: existing.ends_at != null ? String(existing.ends_at) : null,
        metadata: asMetadataObject(existing.metadata),
      };
    }
  } catch (e) {
    console.error("[newsletter] promo lookup threw", { message: e instanceof Error ? e.message : "unknown" });
    return { status: "failed", reason: "promo_lookup_failed" };
  }

  const now = new Date();
  const startsAt = now.toISOString();
  const endsAt = new Date(now.getTime() + NEWSLETTER_PROMO_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const preview = buildPromoCodeRulePreview({ codeType: "newsletter", status: "active" });

  const metadata: Record<string, unknown> = {
    source: "newsletter_signup",
    created_via: "public_newsletter_signup",
    promo_family: "website_launch_25",
    capture_channel: resolveCaptureChannel(input.source),
    eligible_channel: "stripe_website_checkout",
    website_checkout_only: true,
    print_combo_excluded: true,
    redemption_note: "first eligible website checkout only",
    source_page: "public_newsletter",
    source_cta: input.sourceCta || null,
    signup_source: input.source || null,
    language: input.lang,
    subscriber_id: input.subscriberId,
    subscriber_identity_required: true,
    intended_delivery_channel: "email",
    email_send_status: "pending",
    customer_email_normalized: email,
    placement_doctrine: "promo_code_does_not_grant_paid_placement",
    promo_rule: {
      promo_code_type: preview.codeType,
      status: preview.status,
      non_stackable: preview.nonStackable,
      one_time_use: preview.oneTimeUse,
      requires_owner_approval: preview.requiresOwnerApproval,
      requires_subscriber_identity: preview.requiresSubscriberIdentity,
      requires_sales_rep_attribution: preview.requiresSalesRepAttribution,
      can_create_package_entitlement: preview.canCreatePackageEntitlement,
      can_discount_payment: preview.canDiscountPayment,
    },
  };

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const code = generateLeonixPromoCode(NEWSLETTER_PROMO_CODE_PREFIX);
    const { data: inserted, error: insertError } = await supabase
      .from("leonix_promo_codes")
      .insert({
        code,
        code_type: "newsletter",
        status: "active",
        promo_type: "percent_off",
        percent_off: NEWSLETTER_PROMO_PERCENT_OFF,
        amount_off_cents: null,
        is_active: true,
        non_stackable: true,
        one_time_use: true,
        starts_at: startsAt,
        ends_at: endsAt,
        category: null,
        category_scope: null,
        package_scope: null,
        package_tier: null,
        contract_term: null,
        customer_name: input.name?.trim() || null,
        business_name: input.businessName?.trim() || null,
        customer_email: email,
        customer_phone: input.phone?.trim() || null,
        requires_owner_approval: false,
        metadata,
        updated_at: startsAt,
      })
      .select("id")
      .maybeSingle();

    if (!insertError && inserted?.id) {
      return {
        status: "created",
        promoCodeId: String(inserted.id),
        code,
        percentOff: NEWSLETTER_PROMO_PERCENT_OFF,
        expiresAt: endsAt,
        metadata,
      };
    }

    if (insertError && /duplicate|unique/i.test(insertError.message)) {
      continue; // regenerate and retry
    }

    console.error("[newsletter] promo insert failed", { code: insertError?.code });
    return { status: "failed", reason: "promo_insert_failed" };
  }

  console.error("[newsletter] promo insert failed after retries (duplicate code)");
  return { status: "failed", reason: "promo_code_collision" };
}

async function updateNewsletterPromoEmailStatus(
  supabase: SupabaseClient,
  promoCodeId: string,
  baseMetadata: Record<string, unknown>,
  patch: Record<string, unknown>,
): Promise<void> {
  try {
    const { data: fresh } = await supabase
      .from("leonix_promo_codes")
      .select("metadata")
      .eq("id", promoCodeId)
      .maybeSingle();
    const current = fresh ? asMetadataObject(fresh.metadata) : baseMetadata;
    const merged = { ...current, ...patch };
    await supabase
      .from("leonix_promo_codes")
      .update({ metadata: merged, updated_at: new Date().toISOString() })
      .eq("id", promoCodeId);
  } catch (e) {
    console.warn("[newsletter] promo metadata update failed", {
      message: e instanceof Error ? e.message : "unknown",
    });
  }
}

export async function POST(req: Request) {
  const dbConfigured = isSupabaseAdminConfigured();
  const emailConfigured = resolveLeonixResendConfig().ok;

  if (!dbConfigured && !emailConfigured) {
    return NextResponse.json(
      {
        ok: false,
        code: "NOT_CONFIGURED",
        error: "Launch signup is not configured. Set Supabase and/or RESEND_API_KEY.",
      },
      { status: 503 }
    );
  }

  const contentLength = Number(req.headers.get("content-length") ?? 0);
  if (contentLength > MAX_BODY_BYTES) {
    return NextResponse.json({ ok: false, code: "PAYLOAD_TOO_LARGE", error: "payload_too_large" }, { status: 413 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, code: "BAD_JSON", error: "invalid_json" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ ok: false, code: "BAD_BODY", error: "invalid_body" }, { status: 400 });
  }

  const o = body as Record<string, unknown>;
  const lang = o.lang === "en" ? "en" : "es";
  const consent =
    isTruthyConsent(o.consentToContact) ||
    isTruthyConsent(o.consentToReceiveUpdates) ||
    isTruthyConsent(o.consent);

  if (!consent) {
    return NextResponse.json(
      {
        ok: false,
        code: "VALIDATION",
        error:
          lang === "en"
            ? "Consent to receive launch updates is required."
            : "Se requiere consentimiento para recibir actualizaciones del lanzamiento.",
      },
      { status: 400 }
    );
  }

  const consentTimestamp = new Date().toISOString();
  const email = String(o.email ?? "");
  const name = o.name != null ? String(o.name) : o.fullName != null ? String(o.fullName) : undefined;
  const businessName = o.businessName != null ? String(o.businessName) : o.business != null ? String(o.business) : undefined;
  const city = o.city != null ? String(o.city) : o.cityArea != null ? String(o.cityArea) : undefined;
  const source = o.source;
  const sourceCta = String(o.sourceCta ?? o.source_cta ?? "").trim();
  const audienceType = o.audienceType ?? o.audience_type;
  const wantsLaunchUpdates = o.wantsLaunchUpdates !== false && o.wants_launch_updates !== false;

  let saved = false;
  let savedId: string | null = null;
  let updated = false;
  let adminSupabase: SupabaseClient | null = null;

  if (dbConfigured) {
    try {
      adminSupabase = getAdminSupabase();
    } catch {
      return NextResponse.json(
        { ok: false, code: "DB_NOT_CONFIGURED", error: "supabase_not_configured" },
        { status: 503 }
      );
    }
    const supabase = adminSupabase;

    const result = await saveNewsletterSubscriber(supabase, {
      email,
      name,
      city,
      zipCode: o.zipCode != null ? String(o.zipCode) : o.zip_code != null ? String(o.zip_code) : undefined,
      audienceType,
      preferredLanguage: o.preferredLanguage ?? o.preferred_language,
      interests: [
        sourceCta ? `cta:${sourceCta}` : "",
        o.interests != null ? String(o.interests) : "",
      ]
        .filter(Boolean)
        .join("; "),
      source,
      lang,
      consentTimestamp,
    });

    if (!result.ok) {
      const status = result.error === "invalid_email" || result.error === "email_required" ? 400 : 500;
      if (!emailConfigured || status === 400) {
        return NextResponse.json({ ok: false, code: "VALIDATION", error: result.error }, { status });
      }
    } else {
      saved = true;
      savedId = result.id;
      updated = result.updated;
    }
  }

  const zipCode =
    o.zipCode != null ? String(o.zipCode) : o.zip_code != null ? String(o.zip_code) : "";
  const preferredLanguage = String(o.preferredLanguage ?? o.preferred_language ?? "").trim();
  const interestsValue = [
    sourceCta ? `cta:${sourceCta}` : "",
    o.interests != null ? String(o.interests) : "",
  ]
    .filter(Boolean)
    .join("; ");

  let emailSent = false;

  if (saved && !updated && emailConfigured && email.trim()) {
    const notificationTo = resolveLeonixNotificationEmail();
    const mail = buildLaunchSignupEmail({
      email: email.trim(),
      name: String(name ?? "").trim(),
      businessName: String(businessName ?? "").trim(),
      city: String(city ?? "").trim(),
      zipCode,
      preferredLanguage,
      interests: interestsValue,
      source: String(source ?? "newsletter_page"),
      sourceCta,
      status: "subscribed",
      lang,
      wantsLaunchUpdates,
      submittedAt: consentTimestamp,
      subscriberId: savedId,
      updated,
    });

    const sent = await sendLeonixResendEmail({
      to: notificationTo,
      subject: mail.subject,
      text: mail.text,
      html: mail.html,
      replyTo: email.trim(),
    });

    emailSent = sent.ok;
    if (sent.ok) {
      console.info("[newsletter] email notification accepted by provider", {
        subscriberId: savedId,
        to: notificationTo,
        source: String(source ?? "newsletter_page"),
        sourceCta: sourceCta || "(none)",
        updated,
      });
    } else {
      console.warn("[newsletter] subscriber saved without team email notification", {
        code: sent.code,
        subscriberId: savedId,
        to: notificationTo,
        sourceCta: sourceCta || "(none)",
        hint:
          sent.code === "NOT_CONFIGURED"
            ? "Set RESEND_API_KEY and LEONIX_EMAIL_FROM in Vercel Production"
            : "Verify Resend domain/sender for LEONIX_EMAIL_FROM or LEONIX_RESEND_FROM",
      });
    }
  } else if (saved && !updated && !emailConfigured) {
    const config = resolveLeonixResendConfig();
    const notificationTo = resolveLeonixNotificationEmail();
    console.warn("[newsletter] email not configured — subscriber saved without team notification", {
      subscriberId: savedId,
      to: notificationTo,
      missing: config.ok ? [] : config.missing,
      hint: "Set RESEND_API_KEY and LEONIX_EMAIL_FROM in Vercel Production, then redeploy",
    });
  }

  if (!saved && !emailSent) {
    return NextResponse.json(
      { ok: false, code: "SUBMIT_FAILED", error: "submit_failed" },
      { status: 503 }
    );
  }

  // Newsletter promo code: create/reuse one active code per subscriber email,
  // then email it to the subscriber. Never grants paid placement by itself.
  let promoCodeCreated = false;
  let promoCodeReused = false;
  let promoCodeEmailSent = false;
  let promoCodeEmailStatus:
    | "sent"
    | "failed"
    | "not_configured"
    | "not_created"
    | "skipped"
    | "pending" = "not_created";

  if (saved && savedId && adminSupabase && email.trim()) {
    const outcome = await ensureNewsletterPromoCode(adminSupabase, {
      email: email.trim(),
      name,
      businessName,
      phone: o.phone != null ? String(o.phone) : null,
      subscriberId: savedId,
      source: String(source ?? "newsletter_page"),
      sourceCta,
      lang,
    });

    if (outcome.status === "created" || outcome.status === "reused") {
      promoCodeCreated = outcome.status === "created";
      promoCodeReused = outcome.status === "reused";

      if (emailConfigured) {
        const promoMail = buildNewsletterPromoCodeEmail({
          email: email.trim(),
          name: String(name ?? "").trim(),
          lang,
          code: outcome.code,
          percentOff: outcome.percentOff,
          expiresAt: outcome.expiresAt,
          source: String(source ?? "newsletter_page"),
          sourceCta,
          subscriberId: savedId,
          promoCodeId: outcome.promoCodeId,
          siteUrl: resolvePublicSiteUrl(),
        });

        const sent = await sendLeonixResendEmail({
          to: email.trim(),
          subject: promoMail.subject,
          text: promoMail.text,
          html: promoMail.html,
        });

        const nowIso = new Date().toISOString();
        if (sent.ok) {
          promoCodeEmailSent = true;
          promoCodeEmailStatus = "sent";
          await updateNewsletterPromoEmailStatus(adminSupabase, outcome.promoCodeId, outcome.metadata, {
            email_send_status: "sent",
            email_sent_at: nowIso,
            email_provider_status: "accepted",
          });
        } else {
          promoCodeEmailStatus = "failed";
          await updateNewsletterPromoEmailStatus(adminSupabase, outcome.promoCodeId, outcome.metadata, {
            email_send_status: "failed",
            email_failed_at: nowIso,
            email_failure_code: sent.code,
          });
          console.warn("[newsletter] promo code created but subscriber email failed", {
            code: sent.code,
            subscriberId: savedId,
          });
        }
      } else {
        promoCodeEmailStatus = "not_configured";
        await updateNewsletterPromoEmailStatus(adminSupabase, outcome.promoCodeId, outcome.metadata, {
          email_send_status: "not_configured",
        });
      }
    } else {
      promoCodeEmailStatus = outcome.status === "failed" ? "failed" : "skipped";
    }
  }

  const promoWarning =
    saved && !promoCodeEmailSent && (promoCodeCreated || promoCodeReused)
      ? promoCodeEmailStatus === "not_configured"
        ? "promo_email_not_configured"
        : "promo_email_not_sent"
      : undefined;

  return NextResponse.json({
    ok: true,
    id: savedId,
    updated,
    saved,
    // Internal team notification (not the subscriber-facing promo email).
    emailSent,
    promoCodeCreated,
    promoCodeReused,
    promoCodeEmailSent,
    promoCodeEmailStatus,
    ...(promoWarning ? { warning: promoWarning } : {}),
    consentTimestamp,
  });
}
