/**
 * Client Discovery & Project Blueprint Engine, Gate 7 — deterministic client-safe projection of an
 * approved (or in-review) blueprint packet (MD <client_safe_projection>). Pure functions only.
 *
 * Mirrors the precedent already set by growthEngine/projection.ts's buildClientSafeGrowthProjection
 * and projectDiscovery/projection.ts's buildClientSafeProjectDiscoveryProjection: an explicit
 * INCLUSION list, never "show everything except X". Truth-class tags, source references, internal
 * Leonix responsibilities/rationale, the frozen QA matrix/build gates, and architecture internals
 * are deliberately never surfaced here — this is NOT the full Markdown, and NEVER exposes raw
 * truthClass values (a client should never see the literal string "staff_observation" or
 * "ai_extracted").
 */
import type { WebsiteProjectBlueprintPacket } from "./blueprintEngine";
import type { PrintCollateralBlueprintPacket, SpecializedProjectBlueprintPacket } from "./specializedBlueprintEngine";
import type { DiscoveryTruthClass } from "./types";

export interface ClientSafeBlueprintRow {
  labelEs: string;
  labelEn: string;
  valueEs: string;
}

export interface ClientSafeBlueprintTextItem {
  textEs: string;
  textEn: string;
}

export interface ClientSafeBlueprintProjection {
  projectName: string;
  businessDisplayName: string;
  objective: readonly ClientSafeBlueprintRow[];
  audience: readonly ClientSafeBlueprintRow[];
  inScopeSummary: string;
  outOfScopeSummary: string;
  deliverables: readonly ClientSafeBlueprintRow[];
  approvedDirection: readonly ClientSafeBlueprintRow[];
  primaryCta: ClientSafeBlueprintRow | null;
  pagesOrOutputs: readonly ClientSafeBlueprintRow[];
  externalServices: readonly string[];
  clientResponsibilities: readonly ClientSafeBlueprintTextItem[];
  dependencies: readonly { title: string; status: string }[];
  launchRequirements: readonly ClientSafeBlueprintTextItem[];
  unresolvedClientQuestions: readonly ClientSafeBlueprintRow[];
}

interface CommonRow {
  fieldKey: string;
  labelEs: string;
  labelEn: string;
  displayValue: string;
  truthClass: DiscoveryTruthClass;
}

function toClientSafeRow(row: CommonRow): ClientSafeBlueprintRow {
  return { labelEs: row.labelEs, labelEn: row.labelEn, valueEs: row.displayValue };
}

function rows(list: readonly CommonRow[]): ClientSafeBlueprintRow[] {
  return list.map(toClientSafeRow);
}

/**
 * Truthfully excludes an unreviewed AI claim from the client-safe view — mirrors
 * isAuthoritativeForBlueprint/isAuthoritativeForSpecializedBlueprint's own rule, applied a second
 * time here defensively (the packet's own rows are already filtered at generation time, but this
 * projection never assumes that and re-checks before ever showing something to a client).
 */
function clientVisible(row: CommonRow): boolean {
  return row.truthClass !== "ai_extracted" && row.truthClass !== "unknown";
}

function visibleRows(list: readonly CommonRow[]): ClientSafeBlueprintRow[] {
  return list.filter(clientVisible).map(toClientSafeRow);
}

type AnyPacket = WebsiteProjectBlueprintPacket | SpecializedProjectBlueprintPacket;

function isWebsitePacket(packet: AnyPacket): packet is WebsiteProjectBlueprintPacket {
  // WebsiteProjectBlueprintPacket.projectType is frozen to the literal "website" (blueprintEngine.ts)
  // regardless of whether the source intent was website / website_improvement / landing_page — all
  // three route through the same Website engine (MD <website_handoff_preservation>).
  return packet.projectType === "website";
}

function isPrintCollateralPacket(packet: SpecializedProjectBlueprintPacket): packet is PrintCollateralBlueprintPacket {
  return packet.projectType === "business_cards" || packet.projectType === "flyer" || packet.projectType === "banner_signage" || packet.projectType === "referral_materials";
}

export function buildClientSafeBlueprintProjection(packet: AnyPacket): ClientSafeBlueprintProjection {
  const common = {
    projectName: packet.workingTitle,
    businessDisplayName: packet.businessDisplayName,
    objective: visibleRows(packet.objective),
    audience: visibleRows(packet.audience),
    inScopeSummary: packet.inScopeSummary,
    outOfScopeSummary: packet.outOfScopeSummary,
    clientResponsibilities: packet.clientResponsibilities.map((r) => ({ textEs: r.es, textEn: r.en })),
    dependencies: packet.dependencies.map((d) => ({ title: d.title, status: d.status })),
    launchRequirements: packet.launchChecklist.map((i) => ({ textEs: i.textEs, textEn: i.textEn })),
    unresolvedClientQuestions: visibleRows(packet.unresolvedClientActions),
  };

  if (isWebsitePacket(packet)) {
    return {
      ...common,
      deliverables: visibleRows(packet.siteStructure),
      approvedDirection: visibleRows(packet.clientVision),
      primaryCta: packet.primaryCta && clientVisible(packet.primaryCta) ? toClientSafeRow(packet.primaryCta) : null,
      pagesOrOutputs: visibleRows(packet.siteStructure),
      externalServices: packet.architecture.ownership.map((o) => o.platformKey),
    };
  }

  if (packet.projectType === "logo_brand_identity") {
    return {
      ...common,
      deliverables: visibleRows(packet.deliverables),
      approvedDirection: visibleRows(packet.visualDirection),
      primaryCta: null,
      pagesOrOutputs: visibleRows(packet.deliverables),
      externalServices: [],
    };
  }

  if (isPrintCollateralPacket(packet)) {
    return {
      ...common,
      deliverables: visibleRows(packet.specification),
      approvedDirection: visibleRows(packet.brandDependency),
      primaryCta: rows(packet.layoutContent).find((r) => r.labelEn.toLowerCase().includes("call to action")) ?? null,
      pagesOrOutputs: visibleRows(packet.layoutContent),
      externalServices: [],
    };
  }

  // Media campaign families (campaign_creative | sponsored_editorial | media_exposure_campaign).
  return {
    ...common,
    deliverables: visibleRows(packet.creative),
    approvedDirection: visibleRows(packet.offerMessage),
    primaryCta: rows(packet.cta)[0] ?? null,
    pagesOrOutputs: visibleRows(packet.channels),
    externalServices: [],
  };
}
