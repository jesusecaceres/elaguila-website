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
};

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
  };
}

/** Heuristic-only confidential-shelter signal — never used to auto-hide, only to flag for human review. */
const CONFIDENTIAL_HINT_RE = /confidential(ity)?\s+(address|location)|address\s+(is\s+)?confidential|location\s+(is\s+)?not\s+disclosed|undisclosed\s+location/i;
export function looksConfidential(text: string): boolean {
  return CONFIDENTIAL_HINT_RE.test(text);
}
