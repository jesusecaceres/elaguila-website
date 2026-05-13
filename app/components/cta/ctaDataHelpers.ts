import type {
  CtaAdLabelInput,
  CtaContactShareExtras,
  CtaEmailBuildInput,
  CtaLang,
  CtaMessageBuildInput,
  CtaQuoteBuildInput,
  CtaShareBuildInput,
} from "./types";

function trim(s: string | null | undefined): string {
  return String(s ?? "").trim();
}

const BARE_OTRO = /^otro$/i;
const BARE_OTHER = /^other$/i;

export function isBareOtroOrOtherLabel(label: string | null | undefined): boolean {
  const t = trim(label);
  return BARE_OTRO.test(t) || BARE_OTHER.test(t);
}

function slugIsOtro(slug: string | null | undefined): boolean {
  const s = trim(slug).toLowerCase();
  return s === "otro" || s === "other";
}

/**
 * Service / category label for CTAs and messages.
 * Order: custom → service → category → title → business → safe fallback (never bare “Otro”).
 */
export function getAdServiceLabel(input: CtaAdLabelInput, lang: CtaLang = "es"): string {
  const custom = trim(input.customServiceText);
  const svc = trim(input.serviceName);
  const cat = trim(input.categoryName);
  const title = trim(input.adTitle);
  const biz = trim(input.businessName);
  const preferCustomForOtro =
    slugIsOtro(input.categorySlug) || slugIsOtro(input.serviceSlug) || isBareOtroOrOtherLabel(svc) || isBareOtroOrOtherLabel(cat);

  if (preferCustomForOtro && custom) return custom;
  if (custom) return custom;
  if (svc && !isBareOtroOrOtherLabel(svc)) return svc;
  if (cat && !isBareOtroOrOtherLabel(cat)) return cat;
  if (title) return title;
  if (biz) return biz;
  return lang === "en" ? "this service" : "este servicio";
}

/**
 * Primary display title for an ad (hero/share).
 */
export function getAdDisplayTitle(input: CtaAdLabelInput, lang: CtaLang = "es"): string {
  const title = trim(input.adTitle);
  const biz = trim(input.businessName);
  if (title) return title;
  if (biz) return biz;
  const svc = getAdServiceLabel(input, lang);
  if (svc) return svc;
  return lang === "en" ? "this ad" : "este anuncio";
}

/** Prefer explicit public URL from callers — never guess admin vs public here. */
export function getPublicAdUrl(input: { publicUrl?: string | null; fallbackUrl?: string | null }): string {
  const p = trim(input.publicUrl);
  if (p) return p;
  return trim(input.fallbackUrl);
}

const INTERNAL_PATH_SNIPPETS = [
  "/admin",
  "/dashboard",
  "/publicar",
  "/preview",
  "/edit",
  "/builder",
  "/draft",
] as const;

/**
 * Heuristic: URLs that are usually not canonical public listing URLs for share flows
 * (admin, publish wizard, preview, drafts, tokenized previews).
 */
export function isLikelyInternalOrPreviewUrl(url: string | null | undefined): boolean {
  const raw = trim(url);
  if (!raw) return false;
  let haystack = raw.toLowerCase();
  try {
    if (/^https?:\/\//i.test(raw)) {
      const u = new URL(raw);
      haystack = `${u.pathname}${u.search}`.toLowerCase();
    }
  } catch {
    /* keep haystack as raw */
  }
  for (const seg of INTERNAL_PATH_SNIPPETS) {
    if (haystack.includes(seg)) return true;
  }
  const q = haystack.includes("?") ? haystack.slice(haystack.indexOf("?")) : haystack;
  if (q.includes("token=")) return true;
  if (q.includes("preview=")) return true;
  if (q.includes("mode=preview")) return true;
  return false;
}

export function isLikelyPublicAdUrl(url: string | null | undefined): boolean {
  return Boolean(trim(url)) && !isLikelyInternalOrPreviewUrl(url);
}

/**
 * Prefer a safe canonical listing URL for share UIs. Falls back to `fallbackUrl` when `publicUrl`
 * looks like admin/preview. If only “suspicious” URLs exist, returns them as a last resort so
 * preview/dev flows still get a string (callers can still gate on empty).
 */
export function getSafePublicAdUrl(input: { publicUrl?: string | null; fallbackUrl?: string | null }): string {
  const p = trim(input.publicUrl);
  const f = trim(input.fallbackUrl);
  if (p && !isLikelyInternalOrPreviewUrl(p)) return p;
  if (f && !isLikelyInternalOrPreviewUrl(f)) return f;
  if (p && isLikelyInternalOrPreviewUrl(p) && f && !isLikelyInternalOrPreviewUrl(f)) return f;
  if (!p && f && !isLikelyInternalOrPreviewUrl(f)) return f;
  if (f) return f;
  if (p) return p;
  return "";
}

/** Digits only for tel:/sms:/wa.me machine segments (keeps leading country digits). */
export function getCleanPhone(input: string | null | undefined): string {
  return String(input ?? "").replace(/\D/g, "");
}

/** Human-friendly display; US-centric simple grouping when 10–11 digits. */
export function getFormattedPhone(input: string | null | undefined): string {
  const raw = String(input ?? "").trim();
  if (!raw) return "";
  const d = getCleanPhone(raw);
  if (d.length === 10) {
    return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  }
  if (d.length === 11 && d.startsWith("1")) {
    const x = d.slice(1);
    return `+1 (${x.slice(0, 3)}) ${x.slice(3, 6)}-${x.slice(6)}`;
  }
  if (raw.startsWith("+")) return raw;
  return raw || d;
}

export function getEmail(input: string | null | undefined): string {
  return trim(input).toLowerCase();
}

export function normalizeExternalUrl(url: string | null | undefined): string | null {
  const u = trim(url);
  if (!u) return null;
  if (/^https?:\/\//i.test(u)) return u;
  if (/^\/\//.test(u)) return `https:${u}`;
  if (/^[a-z][a-z0-9+.-]*:/i.test(u)) return u;
  return `https://${u}`;
}

export function buildShareText(input: CtaShareBuildInput): string {
  const lang = input.lang ?? "es";
  const title = getAdDisplayTitle(input, lang);
  const url = trim(input.publicUrl);
  if (lang === "en") {
    return url ? `${title}\n${url}` : title;
  }
  return url ? `${title}\n${url}` : title;
}

export function buildMessageText(input: CtaMessageBuildInput): string {
  const lang = input.lang ?? "es";
  const label = getAdServiceLabel(input, lang);
  const detail = trim(input.detail);
  const intro =
    lang === "en"
      ? `Hi — I'm reaching out about ${label} I saw on Leonix.`
      : `Hola — te escribo por ${label} que vi en Leonix.`;
  if (!detail) return intro;
  return `${intro}\n\n${detail}`;
}

export function buildQuoteText(input: CtaQuoteBuildInput): string {
  return buildMessageText(input);
}

export function buildEmailSubject(input: CtaEmailBuildInput): string {
  const lang = input.lang ?? "es";
  const label = getAdServiceLabel(input, lang);
  return lang === "en" ? `Inquiry: ${label} (Leonix)` : `Consulta: ${label} (Leonix)`;
}

export function buildEmailBody(input: CtaEmailBuildInput): string {
  const lang = input.lang ?? "es";
  const title = getAdDisplayTitle(input, lang);
  return lang === "en"
    ? `Hello,\n\nI'm writing about: ${title}.\n\n`
    : `Hola,\n\nTe escribo por: ${title}.\n\n`;
}

export async function copyToClipboard(text: string): Promise<boolean> {
  const t = String(text ?? "");
  if (!t) return false;
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(t);
      return true;
    }
  } catch {
    return false;
  }
  return false;
}

export function buildContactShareText(
  extras: CtaContactShareExtras | null | undefined,
  opts: { lang?: CtaLang; phone?: string | null; formattedPhone?: string | null },
): string {
  const lang = opts.lang ?? "es";
  const lines: string[] = [];
  const labelPhone = lang === "en" ? "Phone" : "Teléfono";
  const labelEmail = lang === "en" ? "Email" : "Correo";
  const labelWeb = lang === "en" ? "Website" : "Sitio web";
  const labelListing = lang === "en" ? "Listing" : "Anuncio";

  const phoneLine = trim(opts.formattedPhone) || trim(opts.phone);
  if (phoneLine) lines.push(`${labelPhone}: ${phoneLine}`);
  const em = trim(extras?.email);
  if (em) lines.push(`${labelEmail}: ${em}`);
  const web = trim(extras?.websiteUrl);
  if (web) lines.push(`${labelWeb}: ${web}`);
  const listing = trim(extras?.publicUrl);
  if (listing) lines.push(`${labelListing}: ${listing}`);
  return lines.join("\n");
}
