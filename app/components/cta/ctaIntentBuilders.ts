/**
 * Gate CTA-1: canonical intent builders for `CtaActionSheet`.
 * Categories should prefer these helpers (or patterns documented in `docs/cta-global-contract.md`)
 * so sheet-first behavior and URL safety stay consistent.
 */

import { getCleanPhone } from "./ctaDataHelpers";
import type { CtaContactShareExtras, CtaLang, CtaSheetIntent } from "./types";

function trim(s: string | null | undefined): string {
  return String(s ?? "").trim();
}

const listingFallback = (lang: CtaLang | undefined) => (lang === "en" ? "Leonix listing" : "Anuncio Leonix");

export type BuildShareAdIntentInput = {
  publicUrl: string;
  shareTitle: string;
  shareText?: string | null;
  lang?: CtaLang;
};

/** Share hub intent — sheet applies `getSafePublicAdUrl` at render time. */
export function buildShareAdIntent(input: BuildShareAdIntentInput): Extract<CtaSheetIntent, { kind: "share_ad" }> | null {
  const publicUrl = trim(input.publicUrl);
  const shareTitleRaw = trim(input.shareTitle);
  const shareText = trim(input.shareText ?? "");
  if (!publicUrl && !shareTitleRaw && !shareText) return null;
  return {
    kind: "share_ad",
    publicUrl: publicUrl || "",
    shareTitle: shareTitleRaw || listingFallback(input.lang),
    shareText: input.shareText ?? null,
  };
}

export type BuildCallIntentInput = {
  phone: string;
  contactShareExtras?: CtaContactShareExtras | null;
};

export function buildCallIntent(input: BuildCallIntentInput): Extract<CtaSheetIntent, { kind: "call" }> | null {
  const phone = trim(input.phone);
  if (!phone) return null;
  return { kind: "call", phone, contactShareExtras: input.contactShareExtras ?? null };
}

export type BuildSendMessageIntentInput = {
  message: string;
  phone?: string | null;
  whatsappDigits?: string | null;
  contactShareExtras?: CtaContactShareExtras | null;
};

export function buildSendMessageIntent(
  input: BuildSendMessageIntentInput,
): Extract<CtaSheetIntent, { kind: "send_message" }> | null {
  const message = trim(input.message);
  const phone = trim(input.phone);
  const wa = trim(input.whatsappDigits);
  const digits = wa ? wa.replace(/\D/g, "") : getCleanPhone(phone);
  const hasPhone = digits.length >= 8;
  if (!message && !hasPhone) return null;
  return {
    kind: "send_message",
    message,
    phone: phone || null,
    whatsappDigits: wa ? wa.replace(/\D/g, "") : null,
    contactShareExtras: input.contactShareExtras ?? null,
  };
}

/** WhatsApp-first prefilled message uses `send_message` + `whatsappDigits` (digits only, country included). */
export function buildWhatsAppMessageIntent(
  input: BuildSendMessageIntentInput,
): Extract<CtaSheetIntent, { kind: "send_message" }> | null {
  const wa = trim(input.whatsappDigits).replace(/\D/g, "");
  if (wa.length < 8) return null;
  return buildSendMessageIntent({ ...input, whatsappDigits: wa });
}

/** SMS-first uses the same intent with a reachable `phone`. */
export function buildSmsMessageIntent(input: BuildSendMessageIntentInput): Extract<CtaSheetIntent, { kind: "send_message" }> | null {
  const phone = trim(input.phone).replace(/\D/g, "");
  if (phone.length < 8) return null;
  return buildSendMessageIntent(input);
}

export type BuildGetQuoteIntentInput = {
  quoteMessage: string;
  phone?: string | null;
  whatsappDigits?: string | null;
  email?: string | null;
  contactShareExtras?: CtaContactShareExtras | null;
};

export function buildGetQuoteIntent(input: BuildGetQuoteIntentInput): Extract<CtaSheetIntent, { kind: "get_quote" }> | null {
  const quoteMessage = trim(input.quoteMessage);
  if (!quoteMessage) return null;
  return {
    kind: "get_quote",
    quoteMessage,
    phone: trim(input.phone) || null,
    whatsappDigits: trim(input.whatsappDigits) || null,
    email: trim(input.email) || null,
    contactShareExtras: input.contactShareExtras ?? null,
  };
}

export type BuildSendEmailIntentInput = {
  email?: string | null;
  subject: string;
  body: string;
  contactShareExtras?: CtaContactShareExtras | null;
  gmailComposeHref?: string | null;
};

export function buildSendEmailIntent(input: BuildSendEmailIntentInput): Extract<CtaSheetIntent, { kind: "send_email" }> | null {
  const subject = trim(input.subject);
  const body = trim(input.body);
  const email = trim(input.email);
  if (!email && !subject && !body) return null;
  return {
    kind: "send_email",
    email: email || null,
    subject: subject || "Leonix",
    body: body || "",
    contactShareExtras: input.contactShareExtras ?? null,
    gmailComposeHref: trim(input.gmailComposeHref) || null,
  };
}

export type BuildWebsiteIntentInput = {
  url: string;
  headline?: string | null;
  kind?: Extract<
    CtaSheetIntent,
    { kind: "website" | "booking" | "menu" | "order" | "social_link" | "other" }
  >["kind"];
};

export function buildWebsiteIntent(input: BuildWebsiteIntentInput): Extract<
  CtaSheetIntent,
  { kind: "website" | "booking" | "menu" | "order" | "social_link" | "other" }
> | null {
  const url = trim(input.url);
  if (!url) return null;
  const kind = input.kind ?? "website";
  return { kind, url, headline: trim(input.headline) || null };
}

export const buildSocialLinkIntent = (input: Omit<BuildWebsiteIntentInput, "kind">) =>
  buildWebsiteIntent({ ...input, kind: "social_link" });

export type BuildDirectionsIntentInput = {
  addressOrUrl: string;
  isMapsUrl?: boolean;
  contactShareExtras?: CtaContactShareExtras | null;
};

export function buildDirectionsIntent(input: BuildDirectionsIntentInput): Extract<CtaSheetIntent, { kind: "directions" }> | null {
  const addressOrUrl = trim(input.addressOrUrl);
  if (!addressOrUrl) return null;
  return {
    kind: "directions",
    addressOrUrl,
    isMapsUrl: Boolean(input.isMapsUrl),
    contactShareExtras: input.contactShareExtras ?? null,
  };
}

export type BuildShareSocialIntentInput = {
  platform: "whatsapp" | "facebook" | "twitter";
  publicUrl: string;
  shareTitle?: string | null;
  shareText?: string | null;
};

export function buildShareSocialIntent(input: BuildShareSocialIntentInput): Extract<CtaSheetIntent, { kind: "share_social" }> | null {
  const publicUrl = trim(input.publicUrl);
  if (!publicUrl) return null;
  return {
    kind: "share_social",
    platform: input.platform,
    publicUrl,
    shareTitle: trim(input.shareTitle) || null,
    shareText: input.shareText ?? null,
  };
}
