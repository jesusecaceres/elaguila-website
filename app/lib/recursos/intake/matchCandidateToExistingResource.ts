/**
 * Recursos Intake OS — Gate 5 matching V2. Deterministic exact/normalized signals only.
 *
 * Gate 5A pg_trgm decision (documented, not silently skipped): pg_trgm is NOT enabled.
 * Coach confirmed it was disabled on both Certification and Production before this gate. The
 * existing exact/normalized signal hierarchy already correctly classified every case exercised
 * in Gate 3/4 QA (including re-matching an already-live resource by domain), and the "multiple
 * exact matches -> POSSIBLE_DUPLICATE" fallback already gives a safe, human-reviewable answer
 * for ambiguous cases. A statistical fuzzy signal would let a plausible-but-wrong candidate
 * silently outrank an honest "NEW", which cuts against the "never guess-merge" doctrine unless
 * carefully threshold-tuned — that tuning work is deferred, not something to ship inside this
 * gate. If a future gate proves exact/normalized signals are missing real duplicates in
 * practice, enabling pg_trgm on Certification only (never Production) remains a live option.
 *
 * Never auto-merges: the caller always creates a new candidate review row and lets a human
 * decide what to do with the classification below. Every result explains WHY it matched — never
 * an opaque score.
 */
import type { ResourceRecord } from "@/app/lib/recursos/types";

export type MatchClassification = "NEW" | "LIKELY_MATCH" | "POSSIBLE_DUPLICATE" | "EXISTING_RESOURCE_UPDATE";

export type MatchResult = {
  classification: MatchClassification;
  matchedResourceId: string | null;
  matchedResourceName: string | null;
  /** Every signal that agreed on the matched resource — e.g. ["EXACT_DOMAIN_MATCH", "EXACT_PHONE_MATCH"], never just an opaque score. */
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

function normalizeAddress(line1: string | null | undefined, zip: string | null | undefined): string | null {
  const l = (line1 ?? "").trim().toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const z = (zip ?? "").trim();
  if (!l || !z) return null;
  return `${l}|${z}`;
}

export type MatchCandidateSignals = {
  organizationName: string;
  programName?: string | null;
  websiteUrl: string | null;
  phone: string | null;
  crisisPhone: string | null;
  addressLine1?: string | null;
  addressZip?: string | null;
  /** Already-linked promoted_resource_id for this exact candidate, if this is a re-run. */
  existingPromotedResourceId?: string | null;
};

type SignalTier = { reason: string; matches: ResourceRecord[] };

/**
 * Classifies a candidate against the current live resource set. Tier order (strongest first):
 * linked promotion -> exact domain -> exact org+program -> exact phone/crisis phone ->
 * exact normalized org name -> exact address. The first tier with exactly one match wins and
 * classification is set from that tier's strength; any OTHER tier that also independently
 * agrees on the SAME resource is folded into `reasons` for full explainability. A tier with
 * more than one match always resolves to POSSIBLE_DUPLICATE — ambiguity is never silently
 * resolved by picking the "best" guess.
 */
export function matchCandidateToExistingResource(candidate: MatchCandidateSignals, existingResources: ResourceRecord[]): MatchResult {
  if (candidate.existingPromotedResourceId) {
    const linked = existingResources.find((r) => r.id === candidate.existingPromotedResourceId);
    if (linked) {
      return { classification: "EXISTING_RESOURCE_UPDATE", matchedResourceId: linked.id, matchedResourceName: linked.organizationName, reasons: ["ALREADY_PROMOTED_LINK"] };
    }
  }

  const candidateDomain = normalizeDomain(candidate.websiteUrl);
  const candidatePhone = normalizePhone(candidate.phone) ?? normalizePhone(candidate.crisisPhone);
  const candidateNameKey = normalizeName(candidate.organizationName);
  const candidateOrgProgramKey = candidate.programName ? `${candidateNameKey}|${normalizeName(candidate.programName)}` : null;
  const candidateAddressKey = normalizeAddress(candidate.addressLine1, candidate.addressZip);

  const tiers: { classification: MatchClassification; tier: SignalTier }[] = [
    {
      classification: "EXISTING_RESOURCE_UPDATE",
      tier: { reason: "EXACT_DOMAIN_MATCH", matches: candidateDomain ? existingResources.filter((r) => normalizeDomain(r.contact.websiteUrl) === candidateDomain) : [] },
    },
    {
      classification: "EXISTING_RESOURCE_UPDATE",
      tier: {
        reason: "EXACT_ORGANIZATION_AND_PROGRAM_MATCH",
        matches: candidateOrgProgramKey
          ? existingResources.filter((r) => r.programName && `${normalizeName(r.organizationName)}|${normalizeName(r.programName)}` === candidateOrgProgramKey)
          : [],
      },
    },
    {
      classification: "LIKELY_MATCH",
      tier: {
        reason: "EXACT_PHONE_MATCH",
        matches: candidatePhone ? existingResources.filter((r) => normalizePhone(r.contact.phone) === candidatePhone || normalizePhone(r.contact.crisisPhone) === candidatePhone) : [],
      },
    },
    {
      classification: "LIKELY_MATCH",
      tier: { reason: "EXACT_NORMALIZED_NAME_MATCH", matches: candidateNameKey ? existingResources.filter((r) => normalizeName(r.organizationName) === candidateNameKey) : [] },
    },
    {
      classification: "LIKELY_MATCH",
      tier: {
        reason: "EXACT_ADDRESS_MATCH",
        matches: candidateAddressKey ? existingResources.filter((r) => normalizeAddress(r.contact.address?.line1, r.contact.address?.zip) === candidateAddressKey) : [],
      },
    },
  ];

  for (const { classification, tier } of tiers) {
    if (tier.matches.length === 0) continue;
    if (tier.matches.length > 1) {
      return { classification: "POSSIBLE_DUPLICATE", matchedResourceId: null, matchedResourceName: null, reasons: [`MULTIPLE_RESOURCES_SHARE_${tier.reason.replace("EXACT_", "").replace("_MATCH", "")}`] };
    }

    const matched = tier.matches[0];
    const reasons = [tier.reason];
    for (const other of tiers) {
      if (other.tier.reason === tier.reason) continue;
      if (other.tier.matches.length === 1 && other.tier.matches[0].id === matched.id) reasons.push(other.tier.reason);
    }
    return { classification, matchedResourceId: matched.id, matchedResourceName: matched.organizationName, reasons };
  }

  return { classification: "NEW", matchedResourceId: null, matchedResourceName: null, reasons: ["NO_EXACT_SIGNAL_MATCH"] };
}
