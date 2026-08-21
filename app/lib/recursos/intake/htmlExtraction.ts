/**
 * Recursos Intake OS — Gate 3 deterministic HTML extraction. Pure string processing, no
 * network, no AI. Every value produced here is a PROPOSAL for human review — nothing here
 * marks anything verified.
 */

const MAX_TEXT_CHARS = 6000;

export type DeterministicSignals = {
  title: string | null;
  canonicalUrl: string | null;
  hostname: string;
  emails: string[];
  phoneCandidates: string[];
  addressLikeLines: string[];
  headingCandidates: string[];
  jsonLdOrganizationName: string | null;
  sanitizedText: string;
  /** Spanish Bridge (Gate ES-5A) — advisory only, never factual verification. */
  detectedLanguage: DetectedLanguage;
};

export type DetectedLanguage = "en" | "es" | "bilingual" | "unknown";

/** Strips script/style/svg/form/nav/noscript content entirely (tags + inner content). */
function stripDangerousAndNoisyTags(html: string): string {
  return html
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<(script|style|svg|form|noscript|iframe|template)\b[\s\S]*?<\/\1>/gi, " ")
    .replace(/<nav\b[\s\S]*?<\/nav>/gi, " ")
    .replace(/<header\b[\s\S]*?<\/header>/gi, " ")
    .replace(/<footer\b[\s\S]*?<\/footer>/gi, " ");
}

function decodeBasicEntities(s: string): string {
  return s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

/** Converts sanitized HTML to plain, whitespace-collapsed text — never rendered as HTML in admin UI. */
export function htmlToSafeText(html: string): string {
  const stripped = stripDangerousAndNoisyTags(html);
  const noTags = stripped.replace(/<\/(p|div|li|br|h[1-6]|tr)>/gi, "\n").replace(/<[^>]+>/g, " ");
  const decoded = decodeBasicEntities(noTags);
  return decoded.replace(/[ \t]+/g, " ").replace(/\n{2,}/g, "\n").trim();
}

function extractTitle(html: string): string | null {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return m ? decodeBasicEntities(m[1]).trim().slice(0, 200) || null : null;
}

function extractCanonical(html: string): string | null {
  const m = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i);
  return m ? m[1].trim() : null;
}

function extractEmails(text: string): string[] {
  const matches = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) ?? [];
  return [...new Set(matches)].filter((e) => !/\.(png|jpg|jpeg|gif|svg|webp)$/i.test(e)).slice(0, 5);
}

function extractPhoneCandidates(text: string): string[] {
  const matches = text.match(/(\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}/g) ?? [];
  return [...new Set(matches.map((m) => m.trim()))].slice(0, 5);
}

const ADDRESS_LINE_RE = /\b\d{1,6}\s+[A-Za-z0-9.'\s]{3,40}\b(street|st|avenue|ave|road|rd|boulevard|blvd|drive|dr|lane|ln|way|suite|ste)\b[^\n]{0,60}/gi;
function extractAddressLikeLines(text: string): string[] {
  const matches = text.match(ADDRESS_LINE_RE) ?? [];
  return [...new Set(matches.map((m) => m.trim()))].slice(0, 3);
}

function extractHeadingCandidates(html: string): string[] {
  const stripped = stripDangerousAndNoisyTags(html);
  const matches = [...stripped.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)].map((m) => decodeBasicEntities(m[1].replace(/<[^>]+>/g, " ")).trim());
  return matches.filter(Boolean).slice(0, 3);
}

function extractJsonLdOrganizationName(html: string): string | null {
  const blocks = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  for (const b of blocks) {
    try {
      const parsed = JSON.parse(b[1].trim());
      const items = Array.isArray(parsed) ? parsed : [parsed];
      for (const item of items) {
        const type = item?.["@type"];
        const isOrgLike = typeof type === "string" && /organization|localbusiness|ngo|governmentorganization/i.test(type);
        if (isOrgLike && typeof item?.name === "string") return item.name.trim().slice(0, 200);
      }
    } catch {
      // malformed JSON-LD — ignore, this is a best-effort signal only
    }
  }
  return null;
}

function extractHtmlLangAttribute(html: string): string | null {
  const m = html.match(/<html[^>]+\blang=["']([a-zA-Z-]+)["']/i);
  return m ? m[1].toLowerCase() : null;
}

/**
 * Spanish Bridge (Gate ES-5A) — common-function-word frequency signal. Deliberately uses a set
 * of many short, high-frequency words rather than any single word, so one coincidental match
 * (e.g. "la" as part of a proper noun) can't flip the result. Text-only, reusable for both
 * post-tag-stripped HTML and raw PDF page text.
 */
const SPANISH_STOPWORDS = new Set([
  "de", "la", "el", "en", "y", "que", "los", "las", "para", "con", "por", "una", "un", "es",
  "del", "al", "su", "se", "como", "más", "si", "sin", "sobre", "también", "cómo", "dónde",
  "gratis", "gratuito", "ayuda", "servicios", "horario", "teléfono", "dirección", "elegibilidad",
]);
const ENGLISH_STOPWORDS = new Set([
  "the", "and", "for", "with", "that", "this", "are", "was", "from", "have", "your", "you",
  "our", "not", "all", "can", "will", "about", "more", "how", "where", "free", "help", "services",
  "hours", "phone", "address", "eligibility",
]);

function wordFrequencyRatios(text: string): { esRatio: number; enRatio: number; total: number } {
  const words = (text.toLowerCase().match(/\b[a-záéíóúñü]+\b/gi) ?? []) as string[];
  const total = words.length;
  if (total === 0) return { esRatio: 0, enRatio: 0, total: 0 };
  const esHits = words.filter((w) => SPANISH_STOPWORDS.has(w)).length;
  const enHits = words.filter((w) => ENGLISH_STOPWORDS.has(w)).length;
  return { esRatio: esHits / total, enRatio: enHits / total, total };
}

/**
 * Text-only variant (no <html lang>) — usable for raw PDF page text where no lang attribute
 * exists. Advisory signal only, never factual verification (see htmlToSafeText's module doc).
 */
export function detectSourceLanguageFromText(text: string): DetectedLanguage {
  const { esRatio, enRatio, total } = wordFrequencyRatios(text);
  if (total < 20) return "unknown"; // too little text for a reliable density signal
  const esLeans = esRatio > 0.015;
  const enLeans = enRatio > 0.015;
  if (esLeans && enLeans && Math.min(esRatio, enRatio) / Math.max(esRatio, enRatio) > 0.35) return "bilingual";
  if (esLeans && esRatio > enRatio * 1.5) return "es";
  if (enLeans && enRatio > esRatio * 1.5) return "en";
  return "unknown";
}

/**
 * HTML variant — combines the <html lang="..."> attribute (when present) with the text-density
 * signal, since either alone can mislead (a CMS can hardcode lang="en" on a Spanish page; a
 * Spanish org name/address can appear on an otherwise-English page). Neither signal is trusted
 * alone — this always requires the density signal to at least not contradict the attribute.
 */
export function detectSourceLanguage(html: string, text: string): DetectedLanguage {
  const langAttr = extractHtmlLangAttribute(html);
  const densitySignal = detectSourceLanguageFromText(text);

  const attrSaysEs = langAttr?.startsWith("es") ?? false;
  const attrSaysEn = langAttr?.startsWith("en") ?? false;

  if (densitySignal === "bilingual") return "bilingual";
  if (attrSaysEs && densitySignal !== "en") return "es";
  if (attrSaysEn && densitySignal !== "es") return "en";
  if (!langAttr) return densitySignal;
  return densitySignal; // attribute contradicted the content — trust the actual text over a possibly-stale attribute
}

export function extractDeterministicSignals(html: string, finalUrl: string): DeterministicSignals {
  const text = htmlToSafeText(html);
  let hostname = "";
  try {
    hostname = new URL(finalUrl).hostname;
  } catch {
    hostname = "";
  }

  return {
    title: extractTitle(html),
    canonicalUrl: extractCanonical(html),
    hostname,
    emails: extractEmails(text),
    phoneCandidates: extractPhoneCandidates(text),
    addressLikeLines: extractAddressLikeLines(text),
    headingCandidates: extractHeadingCandidates(html),
    jsonLdOrganizationName: extractJsonLdOrganizationName(html),
    sanitizedText: text.slice(0, MAX_TEXT_CHARS),
    detectedLanguage: detectSourceLanguage(html, text),
  };
}

/** Heuristic-only confidential-shelter signal — never used to auto-hide, only to flag for human review. */
const CONFIDENTIAL_HINT_RE = /confidential(ity)?\s+(address|location)|address\s+(is\s+)?confidential|location\s+(is\s+)?not\s+disclosed|undisclosed\s+location/i;
export function looksConfidential(text: string): boolean {
  return CONFIDENTIAL_HINT_RE.test(text);
}
