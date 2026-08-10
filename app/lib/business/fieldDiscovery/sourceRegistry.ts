/**
 * Program 4, Gate 4B — deterministic Discovery Source Registry. One entry per SourceType,
 * describing bilingual labels, connection mode, and truthful V1 research support. Only
 * `website` has a live V1 research adapter (see websiteAdapter.ts in app/lib/business/aiResearch);
 * every other source is manual-link/manual-evidence only for V1 (LOCKED V1 PROVIDER DECISIONS) —
 * this registry is the single place that truth is declared, so no UI/API path can independently
 * (and incorrectly) claim a source is "connected."
 */
import type { SourceType } from "./types";

export type SourceConnectionMode = "public_fetch" | "manual_link" | "manual_file";
export type SourceResearchSupport = "live_v1" | "manual_only";

export type DiscoverySourceDefinition = {
  sourceKey: SourceType;
  labelEs: string;
  labelEn: string;
  connectionMode: SourceConnectionMode;
  researchSupport: SourceResearchSupport;
  consentRequired: boolean;
  evidenceCategories: readonly string[];
  freshnessExpectationDays: number;
};

export const DISCOVERY_SOURCE_REGISTRY: readonly DiscoverySourceDefinition[] = [
  {
    sourceKey: "website",
    labelEs: "Sitio web",
    labelEn: "Website",
    connectionMode: "public_fetch",
    researchSupport: "live_v1",
    consentRequired: true,
    evidenceCategories: ["public_web_page"],
    freshnessExpectationDays: 90,
  },
  {
    sourceKey: "google_business",
    labelEs: "Perfil de Google Business",
    labelEn: "Google Business Profile",
    connectionMode: "manual_link",
    researchSupport: "manual_only",
    consentRequired: true,
    evidenceCategories: ["social_profile"],
    freshnessExpectationDays: 90,
  },
  {
    sourceKey: "facebook",
    labelEs: "Facebook",
    labelEn: "Facebook",
    connectionMode: "manual_link",
    researchSupport: "manual_only",
    consentRequired: true,
    evidenceCategories: ["social_profile"],
    freshnessExpectationDays: 90,
  },
  {
    sourceKey: "instagram",
    labelEs: "Instagram",
    labelEn: "Instagram",
    connectionMode: "manual_link",
    researchSupport: "manual_only",
    consentRequired: true,
    evidenceCategories: ["social_profile"],
    freshnessExpectationDays: 90,
  },
  {
    sourceKey: "tiktok",
    labelEs: "TikTok",
    labelEn: "TikTok",
    connectionMode: "manual_link",
    researchSupport: "manual_only",
    consentRequired: true,
    evidenceCategories: ["social_profile"],
    freshnessExpectationDays: 90,
  },
  {
    sourceKey: "youtube",
    labelEs: "YouTube",
    labelEn: "YouTube",
    connectionMode: "manual_link",
    researchSupport: "manual_only",
    consentRequired: true,
    evidenceCategories: ["social_profile"],
    freshnessExpectationDays: 90,
  },
  {
    sourceKey: "linkedin",
    labelEs: "LinkedIn",
    labelEn: "LinkedIn",
    connectionMode: "manual_link",
    researchSupport: "manual_only",
    consentRequired: true,
    evidenceCategories: ["social_profile"],
    freshnessExpectationDays: 90,
  },
  {
    sourceKey: "yelp",
    labelEs: "Yelp",
    labelEn: "Yelp",
    connectionMode: "manual_link",
    researchSupport: "manual_only",
    consentRequired: true,
    evidenceCategories: ["social_profile"],
    freshnessExpectationDays: 90,
  },
  {
    sourceKey: "whatsapp",
    labelEs: "WhatsApp",
    labelEn: "WhatsApp",
    connectionMode: "manual_link",
    researchSupport: "manual_only",
    consentRequired: false,
    evidenceCategories: ["social_profile"],
    freshnessExpectationDays: 90,
  },
  {
    sourceKey: "other",
    labelEs: "Otro",
    labelEn: "Other",
    connectionMode: "manual_link",
    researchSupport: "manual_only",
    consentRequired: true,
    evidenceCategories: ["public_web_page"],
    freshnessExpectationDays: 90,
  },
];

export function findSourceDefinition(sourceKey: SourceType): DiscoverySourceDefinition {
  const found = DISCOVERY_SOURCE_REGISTRY.find((s) => s.sourceKey === sourceKey);
  if (!found) throw new Error(`Unknown source key: ${sourceKey}`);
  return found;
}

export function isLiveV1Source(sourceKey: SourceType): boolean {
  return findSourceDefinition(sourceKey).researchSupport === "live_v1";
}
