import type { ChurchApplicationInput } from "./churchApplicationParse";
import type { ChurchDuplicateCandidate, ChurchIntakeResult } from "./churchIntakeTypes";

const SPAM_RE =
  /\b(buy now|crypto pump|viagra|casino bonus|work from home \$\d|click here to win|gana dinero fácil|compra ahora)\b/i;
const JUNK_NAME_RE = /https?:\/\/|www\.|\b(seo|backlink|casino|xxx)\b/i;
const SUSPICIOUS_HOST_RE = /(\.tk|\.gq|\.ml|\.cf|\.ga)$/i;

export function normalizeChurchKeyPart(value: string | undefined | null): string {
  return (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function churchIdentityKey(row: {
  name: string;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  zip?: string | null;
}): string {
  return [
    normalizeChurchKeyPart(row.name),
    normalizeChurchKeyPart(row.city),
    normalizeChurchKeyPart(row.state),
    normalizeChurchKeyPart(row.country),
    normalizeChurchKeyPart(row.zip),
  ].join("|");
}

export function findExactChurchDuplicate(
  input: ChurchApplicationInput,
  existing: ChurchDuplicateCandidate[],
): ChurchDuplicateCandidate | null {
  const key = churchIdentityKey({
    name: input.name,
    city: input.city,
    state: input.state,
    country: input.country,
    zip: input.zip,
  });
  if (!normalizeChurchKeyPart(input.name)) return null;
  for (const row of existing) {
    if (churchIdentityKey(row) === key) return row;
  }
  return null;
}

function urlHost(url: string | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
}

export function runChurchIntakeDeterministic(
  input: ChurchApplicationInput,
  existing: ChurchDuplicateCandidate[],
): ChurchIntakeResult {
  const reasons: string[] = [];
  const riskSignals: string[] = [];
  const attentionFields: string[] = [];
  const blob = [input.name, input.mission, input.denomination, input.churchType, input.applicantEmail].join("\n");

  if (SPAM_RE.test(blob) || JUNK_NAME_RE.test(input.name)) {
    return {
      decision: "BLOCK",
      confidence: 0.95,
      reasons: ["SPAM_OR_MALFORMED"],
      riskSignals: ["SPAM_PATTERN"],
      identityConfidence: 0.1,
      safetyConfidence: 0.95,
      attentionFields: ["name"],
      source: "deterministic",
    };
  }

  if ((input.mission || "").length > 3800 && /(.)\1{20,}/.test(input.mission || "")) {
    return {
      decision: "BLOCK",
      confidence: 0.9,
      reasons: ["JUNK_PAYLOAD"],
      riskSignals: ["REPEATED_JUNK"],
      identityConfidence: 0.2,
      safetyConfidence: 0.9,
      attentionFields: ["mission"],
      source: "deterministic",
    };
  }

  for (const [field, url] of [
    ["website", input.website],
    ["livestreamUrl", input.livestreamUrl],
    ["facebook", input.facebook],
    ["instagram", input.instagram],
    ["youtube", input.youtube],
    ["logoUrl", input.logoUrl],
    ["heroUrl", input.heroUrl],
  ] as const) {
    const host = urlHost(url);
    if (url && !host) {
      return {
        decision: "BLOCK",
        confidence: 0.92,
        reasons: ["UNSAFE_URL"],
        riskSignals: ["MALFORMED_URL"],
        identityConfidence: 0.4,
        safetyConfidence: 0.92,
        attentionFields: [field],
        source: "deterministic",
      };
    }
    if (host && SUSPICIOUS_HOST_RE.test(host)) {
      riskSignals.push("SUSPICIOUS_URL_TLD");
      attentionFields.push(field);
    }
  }

  const dup = findExactChurchDuplicate(input, existing);
  if (dup) {
    return {
      decision: "HUMAN_REVIEW",
      confidence: 0.9,
      reasons: ["DUPLICATE_IDENTITY"],
      riskSignals: ["EXACT_NAME_LOCATION_MATCH"],
      identityConfidence: 0.4,
      safetyConfidence: 0.8,
      attentionFields: ["name", "city"],
      source: "deterministic",
    };
  }

  if (!input.city && !input.state) {
    reasons.push("THIN_LOCATION");
    attentionFields.push("city");
  }

  if (riskSignals.length) {
    reasons.push("URL_NEEDS_REVIEW");
    return {
      decision: "HUMAN_REVIEW",
      confidence: 0.55,
      reasons,
      riskSignals,
      identityConfidence: 0.55,
      safetyConfidence: 0.6,
      attentionFields,
      source: "deterministic",
    };
  }

  if (reasons.includes("THIN_LOCATION")) {
    return {
      decision: "HUMAN_REVIEW",
      confidence: 0.5,
      reasons,
      riskSignals,
      identityConfidence: 0.45,
      safetyConfidence: 0.8,
      attentionFields,
      source: "deterministic",
    };
  }

  return {
    decision: "AUTO_PUBLISH",
    confidence: 0.7,
    reasons: ["DETERMINISTIC_CLEAR"],
    riskSignals: [],
    identityConfidence: 0.7,
    safetyConfidence: 0.8,
    attentionFields: [],
    source: "deterministic",
  };
}

export function missingWebsiteIsNotBlock(input: ChurchApplicationInput): boolean {
  return !input.website;
}

export function missingLogoIsNotBlock(input: ChurchApplicationInput): boolean {
  return !input.logoUrl;
}
