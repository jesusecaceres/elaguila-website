import type { CtaContactShareExtras, CtaSheetIntent } from "@/app/components/cta/types";
import { getSafePublicAdUrl } from "@/app/components/cta/ctaDataHelpers";
import type { ServiciosLang, ServiciosProfileResolved } from "../types/serviciosBusinessProfile";
import { serviciosUniversalQuoteMessage, buildQuoteSmsHref } from "./serviciosContactActions";
import { extractServiciosWhatsAppDigits } from "./serviciosWhatsAppHref";

/** Match analytics payload shape used by `ServiciosTrackedLink`. */
export function trackServiciosListingCta(
  listingSlug: string | undefined,
  eventType: string,
  meta?: Record<string, unknown>,
): void {
  const slug = (listingSlug ?? "").trim();
  if (!slug || !eventType) return;
  void fetch("/api/clasificados/servicios/analytics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ listingSlug: slug, eventType, meta: meta ?? {} }),
  }).catch(() => {});
}

export function extractWaMeDigitsFromHref(href: string): string {
  return extractServiciosWhatsAppDigits(href);
}

export function serviciosBuildListingPublicUrl(
  listingSlug: string | undefined,
  listingShareUrl?: string | null,
): string {
  const abs = (listingShareUrl ?? "").trim();
  if (abs) return getSafePublicAdUrl({ publicUrl: abs });
  const slug = (listingSlug ?? "").trim();
  if (!slug) return "";
  if (typeof window !== "undefined" && window.location?.origin) {
    return getSafePublicAdUrl({
      publicUrl: `${window.location.origin}/clasificados/servicios/${encodeURIComponent(slug)}`,
    });
  }
  return "";
}

export function serviciosContactShareExtras(
  profile: ServiciosProfileResolved,
  listingSlug?: string,
  listingShareUrl?: string | null,
): CtaContactShareExtras {
  const pub = serviciosBuildListingPublicUrl(listingSlug, listingShareUrl);
  return {
    email: profile.contact.email?.trim() || undefined,
    websiteUrl: profile.contact.websiteHref?.trim() || undefined,
    publicUrl: pub || undefined,
  };
}

/** `get_quote` sheet: universal quote + SMS / WhatsApp / email when each channel exists. */
export function buildServiciosGetQuoteIntent(
  profile: ServiciosProfileResolved,
  lang: ServiciosLang,
  opts: {
    listingSlug?: string;
    listingShareUrl?: string | null;
    /** Gallery / service-card specific preface (still ends with actionable quote ask). */
    quoteMessage?: string;
  } = {},
): Extract<CtaSheetIntent, { kind: "get_quote" }> | null {
  const qm = (opts.quoteMessage?.trim() || serviciosUniversalQuoteMessage(lang)).trim();
  const quotePhone = profile.contact.quoteMessagePhone?.trim();
  const smsOk = Boolean(buildQuoteSmsHref(quotePhone, lang));
  const waHref = profile.contact.socialLinks?.whatsapp?.trim();
  const waDigits = waHref ? extractWaMeDigitsFromHref(waHref) : "";
  const waOk = waDigits.replace(/\D/g, "").length >= 8;
  const email = profile.contact.email?.trim() ?? "";
  const hasEmail = Boolean(email);

  if (!smsOk && !waOk && !hasEmail) return null;

  const phoneForSms = smsOk ? quotePhone! : profile.contact.phoneDisplay?.trim() || "";

  return {
    kind: "get_quote",
    quoteMessage: qm,
    phone: phoneForSms,
    whatsappDigits: waOk ? waDigits : undefined,
    email: hasEmail ? email : undefined,
    contactShareExtras: serviciosContactShareExtras(profile, opts.listingSlug, opts.listingShareUrl),
  };
}

export function buildServiciosSendEmailIntentFromMailto(
  mailtoHref: string,
  lang: ServiciosLang,
  listingSlug?: string,
  listingShareUrl?: string | null,
): Extract<CtaSheetIntent, { kind: "send_email" }> | null {
  const raw = mailtoHref.trim();
  if (!raw.toLowerCase().startsWith("mailto:")) return null;
  const rest = raw.slice(7);
  const [addrPart, query = ""] = rest.split("?");
  let email = "";
  try {
    email = decodeURIComponent(addrPart.split("#")[0] ?? "").trim();
  } catch {
    email = addrPart.split("#")[0]?.trim() ?? "";
  }
  const params = new URLSearchParams(query);
  const subject = params.get("subject") ? decodeURIComponent(params.get("subject")!.replace(/\+/g, "%20")) : "";
  const body = params.get("body") ? decodeURIComponent(params.get("body")!.replace(/\+/g, "%20")) : "";
  return {
    kind: "send_email",
    email,
    subject: subject || (lang === "en" ? "Leonix Media" : "Leonix Media"),
    body: body || serviciosUniversalQuoteMessage(lang),
    contactShareExtras: {
      publicUrl: serviciosBuildListingPublicUrl(listingSlug, listingShareUrl) || undefined,
    },
    gmailComposeHref: null,
  };
}
