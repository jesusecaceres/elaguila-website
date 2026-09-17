/**
 * LEO-15 Business Concierge read bridge — pure deterministic composition.
 * No DB, no network, no AI. Catalog truth is separated from persisted customer activity.
 */
import { boundSpokenSummary } from "@/app/leo/_lib/leoResultCards";
import type {
  LeoBusinessConciergeAvailability,
  LeoBusinessConciergeBusinessRef,
  LeoBusinessConciergeCapability,
  LeoBusinessConciergeContext,
  LeoBusinessConciergeLeadSnapshot,
  LeoBusinessConciergeSupportSnapshot,
  LeoConversationEntityRef,
  LeoMorningBriefTopPriority,
} from "@/app/leo/_lib/leoTypes";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Static capability catalog — mirrors Business Tools marketing cards; not execution history. */
export const LEO_BUSINESS_CONCIERGE_CAPABILITY_CATALOG: readonly LeoBusinessConciergeCapability[] = [
  {
    key: "whatsapp_business",
    label: "WhatsApp for business",
    summary: "Centralize fast replies and lead follow-up.",
    status: "COMING_SOON",
    catalogOnly: true,
  },
  {
    key: "profile_completeness",
    label: "Profile that sells",
    summary: "Complete details, photos, and social proof to build trust.",
    status: "AVAILABLE_NOW",
    catalogOnly: true,
  },
  {
    key: "social_presence",
    label: "Social & presence",
    summary: "Connect Instagram, Facebook, and your site with consistent branding.",
    status: "COMING_SOON",
    catalogOnly: true,
  },
  {
    key: "local_seo",
    label: "Visibility & local SEO",
    summary: "Titles, city, and categories that help buyers find you.",
    status: "AVAILABLE_NOW",
    catalogOnly: true,
  },
  {
    key: "leonix_concierge",
    label: "Leonix Business Concierge",
    summary: "Human guidance to prioritize listings and campaigns — product surface is still coming soon.",
    status: "COMING_SOON",
    catalogOnly: true,
  },
] as const;

export const LEO_BUSINESS_CONCIERGE_NOT_IMPLEMENTED_NOTE =
  "Business Concierge persistence is not connected yet — no proven Concierge outputs or history.";

export type LeoBusinessConciergeBuildInput = {
  nowMs: number;
  businessRef: LeoBusinessConciergeBusinessRef;
  lead?: LeoBusinessConciergeLeadSnapshot | null;
  support?: LeoBusinessConciergeSupportSnapshot | null;
  sourceAvailability?: LeoBusinessConciergeAvailability;
  sourceLimitations?: string[];
};

export function isValidLeoBusinessConciergeId(id: string): boolean {
  return UUID_RE.test(id.trim());
}

export function parseLeoBusinessConciergeRef(
  ref: LeoConversationEntityRef | null | undefined,
): LeoBusinessConciergeBusinessRef | null {
  if (!ref?.id?.trim()) return null;
  const id = ref.id.trim();
  if (!isValidLeoBusinessConciergeId(id)) return null;
  const kind = ref.kind?.toLowerCase();
  if (kind === "lead" || kind === "client") return { system: "leonix", kind: "lead", id };
  if (kind === "support_ticket" || kind === "support") {
    return { system: "leonix", kind: "support_ticket", id };
  }
  if (ref.system?.toLowerCase() === "lead" && kind === "lead") {
    return { system: "leonix", kind: "lead", id };
  }
  return null;
}

export function resolveLeoBusinessConciergeRef(input: {
  entityRef?: LeoConversationEntityRef | null;
  focusEntityRef?: LeoConversationEntityRef | null;
  selectedEntityRef?: LeoConversationEntityRef | null;
  explicitRef?: LeoBusinessConciergeBusinessRef | null;
}):
  | { status: "RESOLVED"; ref: LeoBusinessConciergeBusinessRef }
  | { status: "AMBIGUOUS"; clarification: string }
  | { status: "NONE" } {
  if (input.explicitRef) {
    return { status: "RESOLVED", ref: input.explicitRef };
  }
  const candidates = [
    input.selectedEntityRef,
    input.focusEntityRef,
    input.entityRef,
  ]
    .map(parseLeoBusinessConciergeRef)
    .filter((r): r is LeoBusinessConciergeBusinessRef => r != null);

  const unique = new Map<string, LeoBusinessConciergeBusinessRef>();
  for (const c of candidates) unique.set(`${c.kind}:${c.id}`, c);

  if (unique.size === 1) {
    return { status: "RESOLVED", ref: [...unique.values()][0]! };
  }
  if (unique.size > 1) {
    return {
      status: "AMBIGUOUS",
      clarification:
        "Multiple businesses could match. Select a specific client or lead card first, then ask about Concierge context.",
    };
  }
  return { status: "NONE" };
}

function scrubConciergeSpoken(text: string): string {
  return text
    .replace(/https?:\/\/\S+/gi, "")
    .replace(/\b[a-f0-9]{8}-[a-f0-9-]{27,}\b/gi, "")
    .replace(/\b(AVAILABLE_NOW|COMING_SOON|NOT_IMPLEMENTED|leonix_leads):\S+/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function deriveOpenNeeds(input: LeoBusinessConciergeBuildInput): string[] {
  const needs: string[] = [];
  if (input.businessRef.kind === "lead" && input.lead) {
    const l = input.lead;
    if (!l.businessName?.trim()) needs.push("Business name is missing from the lead record.");
    if (!l.businessCategory?.trim()) needs.push("Business category is not recorded.");
    if (!l.websiteOrSocial?.trim()) needs.push("No website or social link on file.");
    if (!l.cityArea?.trim()) needs.push("City/area is not recorded.");
  }
  if (input.businessRef.kind === "support_ticket") {
    needs.push("Support ticket context only — no full business profile bridge for tickets yet.");
  }
  if (needs.length === 0 && input.businessRef.kind === "lead" && input.lead) {
    needs.push("Core lead profile fields are present — Concierge could help with follow-up and growth planning.");
  }
  return needs.slice(0, 5);
}

function deriveKnownGoals(input: LeoBusinessConciergeBuildInput): string[] {
  const goals: string[] = [];
  if (input.lead?.inquiryType?.trim()) {
    goals.push(`Inquiry type: ${input.lead.inquiryType.trim()}`);
  }
  if (input.lead?.status?.trim()) {
    goals.push(`Pipeline status: ${input.lead.status.trim()}`);
  }
  return goals.slice(0, 4);
}

function deriveFocusAreas(input: LeoBusinessConciergeBuildInput): string[] {
  const areas: string[] = [];
  if (input.lead?.businessCategory?.trim()) {
    areas.push(input.lead.businessCategory.trim());
  }
  if (input.lead?.inquiryType?.trim() && input.lead.inquiryType !== input.lead.businessCategory) {
    areas.push(input.lead.inquiryType.trim());
  }
  return areas.slice(0, 4);
}

function composeProfileSummary(input: LeoBusinessConciergeBuildInput): string | null {
  if (input.businessRef.kind === "lead" && input.lead) {
    const parts: string[] = [];
    if (input.lead.businessName?.trim()) parts.push(input.lead.businessName.trim());
    if (input.lead.businessCategory?.trim()) parts.push(input.lead.businessCategory.trim());
    if (input.lead.cityArea?.trim()) parts.push(input.lead.cityArea.trim());
    if (parts.length === 0) return "Lead record exists but business profile fields are sparse.";
    return parts.join(" · ");
  }
  if (input.businessRef.kind === "support_ticket" && input.support) {
    return input.support.subjectLabel
      ? `Open support: ${input.support.subjectLabel}`
      : "Open support ticket — limited business profile context.";
  }
  return null;
}

function composeHeadlineSummary(ctx: Omit<LeoBusinessConciergeContext, "spokenSummary">): string {
  const name = ctx.businessName ?? "This business";
  if (ctx.availability === "NOT_IMPLEMENTED") {
    return `${name}: Business Concierge is not implemented yet. Catalog capabilities exist; no proven Concierge outputs.`;
  }
  if (ctx.availability === "UNAVAILABLE") {
    return `${name}: business context is unavailable from current Leonix sources.`;
  }
  if (ctx.availability === "EMPTY") {
    return `${name}: no meaningful business context is on file yet.`;
  }
  const gaps = ctx.openNeeds.length;
  const cap = ctx.availableCapabilities.filter((c) => c.status === "COMING_SOON").length;
  return `${name}: ${ctx.profileSummary ?? "profile partially known"}. ${gaps} setup gap${gaps === 1 ? "" : "s"} noted. Concierge product is coming soon (${cap} catalog capabilities). No proven Concierge outputs yet.`;
}

function composeSpokenSummary(ctx: Omit<LeoBusinessConciergeContext, "spokenSummary">): string {
  const name = scrubConciergeSpoken(ctx.businessName ?? "This business");
  if (ctx.availability === "NOT_IMPLEMENTED") {
    return boundSpokenSummary(
      scrubConciergeSpoken(
        `${name}. Business Concierge is still being built. I can describe catalog capabilities, but there are no proven Concierge outputs yet.`,
      ),
    );
  }
  if (ctx.availability === "UNAVAILABLE") {
    return boundSpokenSummary(
      scrubConciergeSpoken(`${name}. Business context is unavailable from current Leonix data.`),
    );
  }
  const gaps =
    ctx.openNeeds.length > 0
      ? ` Gaps include: ${ctx.openNeeds.slice(0, 2).join(" ")}`
      : "";
  const opp =
    ctx.availableCapabilities.find((c) => c.status === "AVAILABLE_NOW")?.label ??
    "profile and visibility support";
  return boundSpokenSummary(
    scrubConciergeSpoken(
      `${name}. ${ctx.profileSummary ?? "Profile is partially known"}.${gaps} Strongest current opportunities from the catalog include ${opp}. No proven Concierge execution history yet.`,
    ),
  );
}

export function buildLeoBusinessConciergeContext(
  input: LeoBusinessConciergeBuildInput,
): LeoBusinessConciergeContext {
  const limitations = [
    "Business Concierge read bridge is READ-ONLY — LEO does not run or write Concierge.",
    "Capability catalog is marketing/product truth — not proof of customer execution.",
    LEO_BUSINESS_CONCIERGE_NOT_IMPLEMENTED_NOTE,
    ...(input.sourceLimitations ?? []),
  ];
  const unknowns: string[] = [];
  const evidenceRefs: string[] = [`business_concierge:${input.businessRef.kind}:${input.businessRef.id}`];

  let availability: LeoBusinessConciergeAvailability = input.sourceAvailability ?? "UNAVAILABLE";
  let businessName: string | null = null;
  let businessCategory: string | null = null;

  if (input.businessRef.kind === "lead") {
    evidenceRefs.push(`business_profile:lead:${input.businessRef.id}`);
    if (input.lead) {
      businessName = input.lead.businessName?.trim() || null;
      businessCategory = input.lead.businessCategory?.trim() || null;
      if (availability === "UNAVAILABLE") availability = "AVAILABLE";
      if (!businessName && !businessCategory) availability = "EMPTY";
    } else if (availability === "UNAVAILABLE") {
      unknowns.push("lead_record_unavailable");
    }
  } else {
    evidenceRefs.push(`client_care:support_ticket:${input.businessRef.id}`);
    if (input.support) {
      businessName = input.support.subjectLabel;
      if (availability === "UNAVAILABLE") availability = "PARTIAL";
    }
  }

  const availableCapabilities = [...LEO_BUSINESS_CONCIERGE_CAPABILITY_CATALOG];
  const recentOutputs: LeoBusinessConciergeContext["recentOutputs"] = [];
  const openNeeds = deriveOpenNeeds(input);
  const focusAreas = deriveFocusAreas(input);
  const knownGoals = deriveKnownGoals(input);
  const profileSummary = composeProfileSummary(input);

  if (recentOutputs.length === 0) {
    limitations.push("No persisted Concierge outputs — recentOutputs intentionally empty.");
  }

  const overallAvailability: LeoBusinessConciergeAvailability =
    input.sourceAvailability === "UNAVAILABLE"
      ? "UNAVAILABLE"
      : input.sourceAvailability === "EMPTY"
        ? "EMPTY"
        : input.lead || input.support
          ? "PARTIAL"
          : "NOT_IMPLEMENTED";

  const partial: Omit<LeoBusinessConciergeContext, "spokenSummary"> = {
    generatedAt: new Date(input.nowMs).toISOString(),
    availability: overallAvailability,
    businessRef: input.businessRef,
    businessName,
    businessCategory,
    ownerRef: null,
    profileSummary,
    focusAreas,
    availableCapabilities,
    knownGoals,
    recentOutputs,
    openNeeds,
    limitations: [...new Set(limitations)],
    unknowns,
    evidenceRefs,
  };

  return {
    ...partial,
    spokenSummary: composeSpokenSummary(partial),
  };
}

export function composeLeoBusinessConciergeExecutiveSummary(ctx: LeoBusinessConciergeContext): string {
  return composeHeadlineSummary(ctx);
}

/** Bounded Morning Brief enrichment — only when client-care priority already exists. */
export function enrichMorningBriefPriorityWithConcierge(
  priority: LeoMorningBriefTopPriority,
  ctx: LeoBusinessConciergeContext | null | undefined,
): LeoMorningBriefTopPriority {
  if (!ctx || priority.source !== "Client Care") return priority;
  if (ctx.availability === "UNAVAILABLE" || ctx.availability === "NOT_IMPLEMENTED") return priority;
  const enrich =
    ctx.openNeeds[0] ??
    (ctx.availableCapabilities.find((c) => c.status === "AVAILABLE_NOW")?.summary ?? null);
  if (!enrich) return priority;
  if (priority.why.includes(enrich.slice(0, 20))) return priority;
  return {
    ...priority,
    why: `${priority.why} Concierge context: ${enrich}`.slice(0, 320),
  };
}

export function businessRefFromClientCareEntity(
  entityType: string | undefined,
  entityId: string | undefined,
): LeoBusinessConciergeBusinessRef | null {
  if (!entityId?.trim() || !isValidLeoBusinessConciergeId(entityId)) return null;
  if (entityType === "lead") return { system: "leonix", kind: "lead", id: entityId.trim() };
  if (entityType === "support_ticket") {
    return { system: "leonix", kind: "support_ticket", id: entityId.trim() };
  }
  return null;
}
