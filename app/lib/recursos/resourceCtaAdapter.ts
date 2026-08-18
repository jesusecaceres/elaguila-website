/**
 * Recursos → shared Leonix CTA adapter (Gate 5 foundation).
 *
 * Maps a `PublicResourceRecord`'s contact fields into the existing shared
 * `CtaSheetIntent` builders. Does NOT duplicate `CtaActionSheet` or the
 * launcher/copy logic — it only decides which intent (if any) a resource's
 * data supports. Every builder returns `null` when the backing field is
 * empty so callers can hide the action entirely (no fake buttons).
 */

import {
  buildCallIntent,
  buildDirectionsIntent,
  buildSendEmailIntent,
  buildSendMessageIntent,
  buildShareAdIntent,
  buildWebsiteIntent,
} from "@/app/components/cta/ctaIntentBuilders";
import type { CtaContactShareExtras, CtaLang, CtaSheetIntent } from "@/app/components/cta/types";
import type { PublicResourceRecord } from "./types";

function trim(s: string | null | undefined): string {
  return String(s ?? "").trim();
}

function resourceShareExtras(resource: PublicResourceRecord, publicUrl?: string | null): CtaContactShareExtras {
  return {
    email: trim(resource.contact.email) || null,
    websiteUrl: trim(resource.contact.websiteUrl) || null,
    publicUrl: trim(publicUrl) || null,
  };
}

/** CALL — only when a public/crisis phone is present. Prefers the general public phone. */
export function buildResourceCallIntent(resource: PublicResourceRecord): Extract<CtaSheetIntent, { kind: "call" }> | null {
  const phone = trim(resource.contact.phone) || trim(resource.contact.crisisPhone);
  if (!phone) return null;
  return buildCallIntent({ phone, contactShareExtras: resourceShareExtras(resource) });
}

/** TEXT — only when SMS is populated. Does not fall back to a bare phone number. */
export function buildResourceTextIntent(
  resource: PublicResourceRecord,
): Extract<CtaSheetIntent, { kind: "send_message" }> | null {
  const sms = trim(resource.contact.sms);
  if (!sms) return null;
  return buildSendMessageIntent({
    message: "",
    phone: sms,
    contactShareExtras: resourceShareExtras(resource),
  });
}

/** WHATSAPP — only when a WhatsApp number is populated. */
export function buildResourceWhatsAppIntent(
  resource: PublicResourceRecord,
): Extract<CtaSheetIntent, { kind: "send_message" }> | null {
  const wa = trim(resource.contact.whatsapp).replace(/\D/g, "");
  if (wa.length < 8) return null;
  return buildSendMessageIntent({
    message: "",
    whatsappDigits: wa,
    contactShareExtras: resourceShareExtras(resource),
  });
}

/** WEBSITE — only when `websiteUrl` is populated. */
export function buildResourceWebsiteIntent(
  resource: PublicResourceRecord,
): ReturnType<typeof buildWebsiteIntent> {
  const url = trim(resource.contact.websiteUrl);
  if (!url) return null;
  return buildWebsiteIntent({ url, kind: "website" });
}

/**
 * APPLY — reuses the shared website intent pattern per the CTA contract.
 * Only shown when `applicationUrl` is populated; never invents a native
 * application workflow.
 */
export function buildResourceApplyIntent(
  resource: PublicResourceRecord,
): ReturnType<typeof buildWebsiteIntent> {
  const url = trim(resource.contact.applicationUrl);
  if (!url) return null;
  return buildWebsiteIntent({ url, kind: "website" });
}

/** MAP — only when a public location or maps href is populated (safety-withheld addresses hide this). */
export function buildResourceDirectionsIntent(
  resource: PublicResourceRecord,
): Extract<CtaSheetIntent, { kind: "directions" }> | null {
  if (resource.contact.address?.addressWithheldForSafety) return null;
  const mapsHref = trim(resource.contact.mapsSearchHref);
  if (mapsHref) {
    return buildDirectionsIntent({
      addressOrUrl: mapsHref,
      isMapsUrl: /^https?:\/\//i.test(mapsHref),
      contactShareExtras: resourceShareExtras(resource),
    });
  }
  const addr = resource.contact.address;
  const composed = addr
    ? [addr.line1, addr.line2, addr.city, addr.state, addr.zip].filter(Boolean).join(", ")
    : "";
  if (!composed) return null;
  return buildDirectionsIntent({ addressOrUrl: composed, isMapsUrl: false, contactShareExtras: resourceShareExtras(resource) });
}

/** EMAIL — only when a contact email is populated. */
export function buildResourceEmailIntent(
  resource: PublicResourceRecord,
  lang: CtaLang,
): Extract<CtaSheetIntent, { kind: "send_email" }> | null {
  const email = trim(resource.contact.email);
  if (!email) return null;
  const subject = lang === "en" ? `Inquiry: ${resource.organizationName}` : `Consulta: ${resource.organizationName}`;
  return buildSendEmailIntent({ email, subject, body: "", contactShareExtras: resourceShareExtras(resource, null) });
}

/** SHARE — only when a canonical public resource URL is provided by the caller (e.g. future detail page). */
export function buildResourceShareIntent(
  resource: PublicResourceRecord,
  publicUrl: string | null | undefined,
): Extract<CtaSheetIntent, { kind: "share_ad" }> | null {
  const url = trim(publicUrl);
  if (!url) return null;
  return buildShareAdIntent({ publicUrl: url, shareTitle: resource.organizationName });
}

export type ResourceAvailableActions = {
  call: boolean;
  text: boolean;
  whatsapp: boolean;
  website: boolean;
  apply: boolean;
  directions: boolean;
  email: boolean;
};

/** Data-driven visibility map — a UI layer should hide any action that is `false`. */
export function getResourceAvailableActions(resource: PublicResourceRecord): ResourceAvailableActions {
  return {
    call: Boolean(buildResourceCallIntent(resource)),
    text: Boolean(buildResourceTextIntent(resource)),
    whatsapp: Boolean(buildResourceWhatsAppIntent(resource)),
    website: Boolean(buildResourceWebsiteIntent(resource)),
    apply: Boolean(buildResourceApplyIntent(resource)),
    directions: Boolean(buildResourceDirectionsIntent(resource)),
    email: Boolean(buildResourceEmailIntent(resource, "es")),
  };
}
