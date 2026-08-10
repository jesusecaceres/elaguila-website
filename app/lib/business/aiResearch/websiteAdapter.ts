/**
 * Program 4, Gate 4B — Website V1 research adapter. Server-only. Bounded, truthful extraction
 * only — never a full SEO/accessibility/performance/PageSpeed/ranking claim. No JavaScript
 * execution, no deep crawl, no login bypass, no robots bypass, no crawler loop.
 *
 * app/lib/website-audit/ was inspected directly (not just its directory listing): it contains
 * only category-landing/results-page audit markdown documents — zero .ts/.js files exist there.
 * No fetch/parse/timeout/SSRF utility exists anywhere in this repo to reuse; this adapter is a
 * new, narrowly-scoped implementation.
 */
import "server-only";

import type { WebsiteResearchEvidence, WebsiteResearchResult } from "./types";

const FETCH_TIMEOUT_MS = 8_000;
const MAX_REDIRECTS = 3;
const MAX_RESPONSE_BYTES = 2 * 1024 * 1024;
const USER_AGENT = "LeonixBusinessConciergeResearchBot/1.0 (+https://elaguila.com)";

const BLOCKED_HOSTNAME_PATTERNS: RegExp[] = [
  /^localhost$/i,
  /^127\./,
  /^0\.0\.0\.0$/,
  /^::1$/,
  /^10\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^169\.254\./, // link-local + cloud metadata hosts (e.g. 169.254.169.254)
  /^fc00:/i,
  /^fe80:/i,
  /^metadata\.google\.internal$/i,
];

export type WebsiteUrlSafetyResult = { ok: true; url: URL } | { ok: false; reason: string };

/** Pure, synchronous SSRF/scheme guard — does not resolve DNS (V1 scope: string/host-pattern checks only). */
export function checkWebsiteUrlSafety(rawUrl: string): WebsiteUrlSafetyResult {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return { ok: false, reason: "invalid_url" };
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return { ok: false, reason: "unsafe_url" };
  }
  if (url.username || url.password) {
    return { ok: false, reason: "unsafe_url" };
  }
  const hostname = url.hostname.toLowerCase();
  if (BLOCKED_HOSTNAME_PATTERNS.some((p) => p.test(hostname))) {
    return { ok: false, reason: "unsafe_url" };
  }
  return { ok: true, url };
}

function extractTag(html: string, tag: string): string | null {
  const match = new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`, "i").exec(html);
  return match ? match[1].trim() || null : null;
}

function extractMeta(html: string, name: string): string | null {
  const match = new RegExp(`<meta[^>]+name=["']${name}["'][^>]+content=["']([^"']*)["']`, "i").exec(html);
  return match ? match[1].trim() || null : null;
}

function extractHtmlLang(html: string): string | null {
  const match = /<html[^>]+lang=["']([a-zA-Z-]+)["']/i.exec(html);
  return match ? match[1].trim() || null : null;
}

function hasViewportMeta(html: string): boolean {
  return /<meta[^>]+name=["']viewport["']/i.test(html);
}

function extractPhonePatterns(html: string): string[] {
  const matches = html.match(/(\+?\d[\d\s().-]{7,}\d)/g) ?? [];
  return Array.from(new Set(matches.map((m) => m.trim()))).slice(0, 5);
}

function extractEmailPatterns(html: string): string[] {
  const matches = html.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) ?? [];
  return Array.from(new Set(matches.map((m) => m.toLowerCase()))).slice(0, 5);
}

function extractNavigationLabels(html: string): string[] {
  const navMatch = /<nav[^>]*>([\s\S]*?)<\/nav>/i.exec(html);
  const scope = navMatch ? navMatch[1] : html;
  const labels = Array.from(scope.matchAll(/<a[^>]*>([^<]{1,40})<\/a>/gi)).map((m) => m[1].trim());
  return Array.from(new Set(labels.filter(Boolean))).slice(0, 10);
}

function extractCtaCandidates(html: string): string[] {
  const buttonLabels = Array.from(html.matchAll(/<(?:button|a)[^>]*class="[^"]*(?:cta|btn)[^"]*"[^>]*>([^<]{1,40})<\/(?:button|a)>/gi)).map((m) => m[1].trim());
  return Array.from(new Set(buttonLabels.filter(Boolean))).slice(0, 5);
}

function extractStructuredDataTypes(html: string): string[] {
  const blocks = Array.from(html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi));
  const types: string[] = [];
  for (const b of blocks) {
    try {
      const parsed = JSON.parse(b[1]);
      const t = Array.isArray(parsed) ? parsed.map((p) => p?.["@type"]) : [parsed?.["@type"]];
      for (const v of t) if (typeof v === "string") types.push(v);
    } catch {
      // malformed JSON-LD block — skip, never throw the whole scan for one bad block.
    }
  }
  return Array.from(new Set(types)).slice(0, 10);
}

async function fetchWithBoundedRedirects(url: URL): Promise<{ ok: true; finalUrl: string; status: number; body: string } | { ok: false; reason: string; status: number | null }> {
  let currentUrl = url;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const safety = checkWebsiteUrlSafety(currentUrl.toString());
    if (!safety.ok) return { ok: false, reason: safety.reason, status: null };

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    let res: Response;
    try {
      res = await fetch(currentUrl.toString(), {
        redirect: "manual",
        signal: controller.signal,
        headers: { "User-Agent": USER_AGENT, Accept: "text/html" },
      });
    } catch {
      clearTimeout(timer);
      return { ok: false, reason: "unreachable", status: null };
    } finally {
      clearTimeout(timer);
    }

    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get("location");
      if (!location) return { ok: false, reason: "unreachable", status: res.status };
      try {
        currentUrl = new URL(location, currentUrl);
      } catch {
        return { ok: false, reason: "unreachable", status: res.status };
      }
      continue;
    }

    if (!res.ok) return { ok: false, reason: "unreachable", status: res.status };

    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html")) return { ok: false, reason: "unsupported", status: res.status };

    const reader = res.body?.getReader();
    if (!reader) {
      const text = await res.text();
      return { ok: true, finalUrl: currentUrl.toString(), status: res.status, body: text.slice(0, MAX_RESPONSE_BYTES) };
    }
    let received = 0;
    const chunks: Uint8Array[] = [];
    while (received < MAX_RESPONSE_BYTES) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        chunks.push(value);
        received += value.byteLength;
      }
    }
    try {
      await reader.cancel();
    } catch {
      // best-effort cancel only
    }
    const body = Buffer.concat(chunks.map((c) => Buffer.from(c))).toString("utf8").slice(0, MAX_RESPONSE_BYTES);
    return { ok: true, finalUrl: currentUrl.toString(), status: res.status, body };
  }
  return { ok: false, reason: "unreachable", status: null };
}

/**
 * Truthful, bounded website V1 scan. Never claims SEO/accessibility/performance/PageSpeed/
 * ranking/indexing certification — only reachability + declared page metadata + regex-extracted
 * contact/navigation/structured-data signals, every one marked requiresConfirmation=true.
 */
export async function runWebsiteResearchV1(sourceUrl: string): Promise<WebsiteResearchResult> {
  const observedAt = new Date().toISOString();
  const safety = checkWebsiteUrlSafety(sourceUrl);
  if (!safety.ok) {
    return emptyResult(sourceUrl, observedAt, "blocked", [`Blocked: ${safety.reason}`]);
  }

  const fetched = await fetchWithBoundedRedirects(safety.url);
  if (!fetched.ok) {
    const status: "unreachable" | "unsupported" = fetched.reason === "unsupported" ? "unsupported" : "unreachable";
    return emptyResult(sourceUrl, observedAt, status, [`Fetch failed: ${fetched.reason}`], fetched.status);
  }

  const { body, finalUrl, status } = fetched;
  const title = extractTag(body, "title");
  const metaDescription = extractMeta(body, "description");
  const declaredLanguage = extractHtmlLang(body);
  const viewportPresent = hasViewportMeta(body);
  const phones = extractPhonePatterns(body);
  const emails = extractEmailPatterns(body);
  const navigationLabels = extractNavigationLabels(body);
  const ctaCandidates = extractCtaCandidates(body);
  const structuredDataTypes = extractStructuredDataTypes(body);

  const evidence: WebsiteResearchEvidence[] = [];
  if (title) evidence.push({ category: "page_title", claim: title, excerpt: title, confidence: "medium", requiresConfirmation: true });
  if (metaDescription) evidence.push({ category: "meta_description", claim: metaDescription, excerpt: metaDescription, confidence: "medium", requiresConfirmation: true });
  if (phones.length) evidence.push({ category: "phone_pattern", claim: `Possible phone number(s) found: ${phones.join(", ")}`, excerpt: phones.join(", "), confidence: "low", requiresConfirmation: true });
  if (emails.length) evidence.push({ category: "email_pattern", claim: `Possible email(s) found: ${emails.join(", ")}`, excerpt: emails.join(", "), confidence: "low", requiresConfirmation: true });
  if (structuredDataTypes.length) evidence.push({ category: "structured_data", claim: `JSON-LD types present: ${structuredDataTypes.join(", ")}`, excerpt: null, confidence: "medium", requiresConfirmation: true });

  return {
    sourceUrl,
    finalUrl,
    status: "completed",
    observedAt,
    httpStatus: status,
    https: finalUrl.startsWith("https://"),
    title,
    metaDescription,
    declaredLanguage,
    viewportPresent,
    contacts: { phones, emails, addresses: [] },
    navigationLabels,
    ctaCandidates,
    structuredDataTypes,
    evidence,
    limitations: [
      "Truthful V1 scan only: reachability and declared metadata, never a full SEO, accessibility, performance, PageSpeed, ranking, or indexing certification.",
      "No JavaScript-rendered content is evaluated — single static HTML fetch only.",
      "Contact/address signals are pattern-matched only and always require human confirmation.",
    ],
  };
}

function emptyResult(
  sourceUrl: string,
  observedAt: string,
  status: WebsiteResearchResult["status"],
  limitations: string[],
  httpStatus: number | null = null,
): WebsiteResearchResult {
  return {
    sourceUrl,
    finalUrl: null,
    status,
    observedAt,
    httpStatus,
    https: null,
    title: null,
    metaDescription: null,
    declaredLanguage: null,
    viewportPresent: null,
    contacts: { phones: [], emails: [], addresses: [] },
    navigationLabels: [],
    ctaCandidates: [],
    structuredDataTypes: [],
    evidence: [],
    limitations,
  };
}
