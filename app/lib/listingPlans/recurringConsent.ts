/**
 * Package C Build 1 (C3) — affirmative recurring-billing consent (Agreement v1.2 §17).
 *
 * No automatic renewal without separately given affirmative consent. The consent record is
 * written server-side BEFORE the Stripe subscription-mode session is created; the checkout
 * route hard-refuses recurring packages without the client's affirmative acknowledgment.
 * One-time and free products never require (and never create) recurring consent.
 *
 * The disclosure text is versioned; the stored row keeps the version + a sha256 of the exact
 * rendered text so historical consent evidence can never silently drift.
 */

import "server-only";
import { createHash } from "node:crypto";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import type { RevenuePackageDefinition } from "./revenuePricingMatrix";
import {
  buildRecurringConsentText,
  RECURRING_CONSENT_AGREEMENT_VERSION,
  RECURRING_CONSENT_TEXT_VERSION,
} from "./recurringConsentCopy";

export {
  buildRecurringConsentText,
  RECURRING_CONSENT_AGREEMENT_VERSION,
  RECURRING_CONSENT_TEXT_VERSION,
} from "./recurringConsentCopy";

export function hashConsentText(text: string): string {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

export function packageRequiresRecurringConsent(packageDef: Pick<RevenuePackageDefinition, "billingMode">): boolean {
  return packageDef.billingMode === "monthly_subscription";
}

export {
  parseRecurringConsentAcknowledgment,
  type RecurringConsentAcknowledgment,
} from "./recurringConsentCopy";
import { type RecurringConsentAcknowledgment } from "./recurringConsentCopy";

export type CreateConsentResult =
  | { ok: true; consentId: string }
  | { ok: false; code: "consent_required" | "consent_version_stale" | "consent_write_failed"; message: string };

/**
 * Validate + persist the consent evidence. Called by the checkout route BEFORE session
 * creation for every subscription-mode package. The stored amount is SERVER truth.
 */
export async function createRecurringConsentRecord(input: {
  acknowledgment: RecurringConsentAcknowledgment | null;
  ownerUserId: string;
  customerEmail?: string | null;
  category: string;
  listingSource?: string | null;
  listingId?: string | null;
  packageKey: string;
  amountCents: number;
  addOnAmountCents?: number;
  sourceSurface?: "checkout_web" | "dashboard_upgrade" | "admin_assisted";
}): Promise<CreateConsentResult> {
  if (!input.acknowledgment) {
    return {
      ok: false,
      code: "consent_required",
      message: "Recurring billing requires affirmative consent (Agreement v1.2 clause 17).",
    };
  }
  if (input.acknowledgment.consentTextVersion !== RECURRING_CONSENT_TEXT_VERSION) {
    return {
      ok: false,
      code: "consent_version_stale",
      message: "Consent text version is stale — reload the checkout page and consent again.",
    };
  }
  if (!isSupabaseAdminConfigured()) {
    return { ok: false, code: "consent_write_failed", message: "Supabase admin not configured." };
  }

  const renderedText = buildRecurringConsentText({
    amountCents: input.amountCents,
    addOnAmountCents: input.addOnAmountCents,
    lang: input.acknowledgment.lang,
  });

  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("leonix_billing_consents")
    .insert({
      owner_user_id: input.ownerUserId,
      customer_email: input.customerEmail ?? null,
      category: input.category,
      listing_source: input.listingSource ?? null,
      listing_id: input.listingId ?? null,
      package_key: input.packageKey,
      amount_cents: input.amountCents + (input.addOnAmountCents ?? 0),
      billing_interval: "monthly",
      consent_text_version: RECURRING_CONSENT_TEXT_VERSION,
      consent_text_sha256: hashConsentText(renderedText),
      agreement_version: RECURRING_CONSENT_AGREEMENT_VERSION,
      source_surface: input.sourceSurface ?? "checkout_web",
      metadata: { lang: input.acknowledgment.lang },
    })
    .select("id")
    .single();

  if (error || !data?.id) {
    return { ok: false, code: "consent_write_failed", message: error?.message ?? "Consent insert failed." };
  }
  return { ok: true, consentId: data.id as string };
}

/** Webhook-side: attach Stripe identities to the consent snapshot (never mutates the text). */
export async function attachStripeIdentitiesToConsent(consentId: string, ids: {
  stripeCheckoutSessionId?: string | null;
  stripeSubscriptionId?: string | null;
  stripeCustomerId?: string | null;
  paymentRecordId?: string | null;
}): Promise<void> {
  if (!isSupabaseAdminConfigured()) return;
  const id = String(consentId ?? "").trim();
  if (!id) return;
  const supabase = getAdminSupabase();
  await supabase
    .from("leonix_billing_consents")
    .update({
      ...(ids.stripeCheckoutSessionId ? { stripe_checkout_session_id: ids.stripeCheckoutSessionId } : {}),
      ...(ids.stripeSubscriptionId ? { stripe_subscription_id: ids.stripeSubscriptionId } : {}),
      ...(ids.stripeCustomerId ? { stripe_customer_id: ids.stripeCustomerId } : {}),
      ...(ids.paymentRecordId ? { payment_record_id: ids.paymentRecordId } : {}),
    })
    .eq("id", id);
}
