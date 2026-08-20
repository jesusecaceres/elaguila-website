/**
 * Recursos Intake OS — Gate 3 matching V1. Deterministic exact/safe signals only.
 * pg_trgm/fuzzy matching is explicitly deferred to Gate 5 — this module never guesses.
 * Never auto-merges: the caller always creates a new candidate review row and lets a human
 * decide what to do with the classification below.
 */
import type { ResourceRecord } from "@/app/lib/recursos/types";

export type MatchClassification = "NEW" | "LIKELY_MATCH" | "POSSIBLE_DUPLICATE" | "EXISTING_RESOURCE_UPDATE";

export type MatchResult = {
  classification: MatchClassification;
  matchedResourceId: string | null;
  matchedResourceName: string | null;
  reasons: string[];
};

function normalizeName(s: string | null | undefined): string {
  return (s ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function normalizeDomain(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const h = new URL(url).hostname.toLowerCase();
    return h.startsWith("www.") ? h.slice(4) : h;
  } catch {
    return null;
  }
}

function normalizePhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 7) return null;
  return digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
}

export type MatchCandidateSignals = {
  organizationName: string;
  websiteUrl: string | null;
  phone: string | null;
  crisisPhone: string | null;
  /** Already-linked promoted_resource_id for this exact candidate, if this is a re-run. */
  existingPromotedResourceId?: string | null;
};

/**
 * Classifies a candidate against the current live resource set using, in order: an already-
 * linked promotion, exact normalized domain match, exact normalized phone match, then exact
 * normalized organization-name equality. Anything softer than exact equality is intentionally
 * NOT attempted here (that is Gate 5's job) — an uncertain case always resolves to
 * POSSIBLE_DUPLICATE rather than being silently classified as NEW or auto-linked.
 */
export function matchCandidateToExistingResource(candidate: MatchCandidateSignals, existingResources: ResourceRecord[]): MatchResult {
  if (candidate.existingPromotedResourceId) {
    const linked = existingResources.find((r) => r.id === candidate.existingPromotedResourceId);
    if (linked) {
      return {
        classification: "EXISTING_RESOURCE_UPDATE",
        matchedResourceId: linked.id,
        matchedResourceName: linked.organizationName,
        reasons: ["ALREADY_PROMOTED_LINK"],
      };
    }
  }

  const candidateDomain = normalizeDomain(candidate.websiteUrl);
  const candidatePhone = normalizePhone(candidate.phone) ?? normalizePhone(candidate.crisisPhone);
  const candidateNameKey = normalizeName(candidate.organizationName);

  const domainMatches = candidateDomain
    ? existingResources.filter((r) => normalizeDomain(r.contact.websiteUrl) === candidateDomain)
    : [];
  if (domainMatches.length === 1) {
    return {
      classification: "EXISTING_RESOURCE_UPDATE",
      matchedResourceId: domainMatches[0].id,
      matchedResourceName: domainMatches[0].organizationName,
      reasons: ["EXACT_DOMAIN_MATCH"],
    };
  }
  if (domainMatches.length > 1) {
    return {
      classification: "POSSIBLE_DUPLICATE",
      matchedResourceId: null,
      matchedResourceName: null,
      reasons: ["MULTIPLE_RESOURCES_SHARE_DOMAIN"],
    };
  }

  const phoneMatches = candidatePhone
    ? existingResources.filter((r) => {
        const p1 = normalizePhone(r.contact.phone);
        const p2 = normalizePhone(r.contact.crisisPhone);
        return p1 === candidatePhone || p2 === candidatePhone;
      })
    : [];
  if (phoneMatches.length === 1) {
    return {
      classification: "LIKELY_MATCH",
      matchedResourceId: phoneMatches[0].id,
      matchedResourceName: phoneMatches[0].organizationName,
      reasons: ["EXACT_PHONE_MATCH"],
    };
  }
  if (phoneMatches.length > 1) {
    return { classification: "POSSIBLE_DUPLICATE", matchedResourceId: null, matchedResourceName: null, reasons: ["MULTIPLE_RESOURCES_SHARE_PHONE"] };
  }

  const nameMatches = candidateNameKey
    ? existingResources.filter((r) => normalizeName(r.organizationName) === candidateNameKey)
    : [];
  if (nameMatches.length === 1) {
    return {
      classification: "LIKELY_MATCH",
      matchedResourceId: nameMatches[0].id,
      matchedResourceName: nameMatches[0].organizationName,
      reasons: ["EXACT_NORMALIZED_NAME_MATCH"],
    };
  }
  if (nameMatches.length > 1) {
    return { classification: "POSSIBLE_DUPLICATE", matchedResourceId: null, matchedResourceName: null, reasons: ["MULTIPLE_RESOURCES_SHARE_NAME"] };
  }

  return { classification: "NEW", matchedResourceId: null, matchedResourceName: null, reasons: ["NO_EXACT_SIGNAL_MATCH"] };
}
