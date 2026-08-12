/**
 * Program 6, Gate 6R — Canva Prompt Compiler.
 * Combines Leonix design doctrine + verified snapshot + brief + format + archetype +
 * layout + approved copy + asset instructions + print spec + compliance rules
 * into a structured Canva production prompt.
 */
import type { PrintFormatSpec } from "./printSpecs";
import type { CreativeBrief } from "./types";
import type { CreativeCompositionZone } from "./archetypes/compositionRules";
import type { ArchetypeDefinition } from "./archetypes/types";
import type { BusinessCreativeAsset } from "./assetTypes";
import { CREATIVE_DOCTRINE_RULES } from "./types";
import { getComplianceRule } from "./compliance";
import {
  BLEED_INCHES,
  CRITICAL_SAFE_OFFSET_INCHES,
  MAGAZINE_TRIM_IN,
  MAGAZINE_BLEED_DOCUMENT_IN,
  PRINT_PPI,
  CONFIRM_WITH_PRINTER_ITEMS,
} from "./printSpecs";

export interface CanvaPromptInput {
  formatSpec: PrintFormatSpec;
  archetype: ArchetypeDefinition;
  layoutVariant: string;
  brief: CreativeBrief;
  zones: readonly CreativeCompositionZone[];
  generatedCopy: Record<string, unknown>;
  assets: readonly BusinessCreativeAsset[];
  qrDestination: string | null;
}

export function buildCanvaPrompt(input: CanvaPromptInput): string {
  const { formatSpec, archetype, brief, zones, generatedCopy, assets, qrDestination } = input;
  const complianceRule = getComplianceRule(brief.riskClass);

  const lines: string[] = [];

  lines.push("THIS IS NOT A MOCKUP.");
  lines.push("THIS IS AN ACTUAL PRODUCTION AD / INSERT.");
  lines.push("");

  lines.push("=== LEONIX DESIGN DOCTRINE ===");
  lines.push(...CREATIVE_DOCTRINE_RULES);
  lines.push("");

  lines.push("=== FORMAT SPECIFICATIONS ===");
  lines.push("LEONIX MAGAZINE");
  lines.push(`FINAL TRIM: ${MAGAZINE_TRIM_IN.widthIn}" x ${MAGAZINE_TRIM_IN.heightIn}" in portrait`);
  lines.push(`WORKING FULL BLEED: ${MAGAZINE_BLEED_DOCUMENT_IN.widthIn}" x ${MAGAZINE_BLEED_DOCUMENT_IN.heightIn}" in`);
  lines.push(`${PRINT_PPI} PPI`);
  lines.push(`CRITICAL SAFE INSET: ${CRITICAL_SAFE_OFFSET_INCHES}" in inside trim`);
  lines.push("");
  lines.push(`Format: ${formatSpec.label}`);
  lines.push(`Trim: ${formatSpec.trimWidthIn}" x ${formatSpec.trimHeightIn}"`);
  lines.push(`Bleed: ${formatSpec.bleedWidthIn}" x ${formatSpec.bleedHeightIn}"`);
  lines.push(`Pixels: ${formatSpec.pixelWidth} x ${formatSpec.pixelHeight} @ ${PRINT_PPI} PPI`);
  lines.push(`Bleed inset: ${BLEED_INCHES}" all sides`);
  lines.push(`Critical safe offset: ${CRITICAL_SAFE_OFFSET_INCHES}" from trim`);
  lines.push(`PRINTER-DEPENDENT ITEMS: CONFIRM WITH PRINTER (${CONFIRM_WITH_PRINTER_ITEMS.join(", ")})`);
  lines.push("");

  lines.push("=== ARCHETYPE ===");
  lines.push(`Archetype: ${archetype.key} — ${archetype.label}`);
  lines.push(`Lane: ${archetype.lane}`);
  lines.push(`Layout variant: ${input.layoutVariant}`);
  lines.push(`Visual hierarchy: ${archetype.visualHierarchy}`);
  lines.push(`Image strategy: ${archetype.imageStrategy}`);
  lines.push(`CTA strategy: ${archetype.ctaStrategy}`);
  lines.push(`Copy density budget: ${archetype.copyDensityBudget}`);
  lines.push("");

  lines.push("=== CREATIVE BRIEF ===");
  lines.push(`Business goal: ${brief.businessGoal}`);
  lines.push(`Campaign objective: ${brief.campaignObjective}`);
  lines.push(`Primary message: ${brief.primaryMessage}`);
  lines.push(`Supporting message: ${brief.supportingMessage ?? "N/A"}`);
  lines.push(`Offer: ${brief.offer ?? "N/A"}`);
  lines.push(`CTA: ${brief.cta}`);
  lines.push(`Contact path: ${brief.contactPath}`);
  lines.push(`QR target: ${qrDestination ?? "N/A"}`);
  lines.push(`Language: ${brief.primaryLanguage}`);
  lines.push(`Risk class: ${brief.riskClass}`);
  lines.push("");

  lines.push("=== COMPOSITION ZONES ===");
  for (const z of zones) {
    lines.push(`Zone "${z.key}" (${z.role}): required=${z.required}, priority=${z.priority}, position=(${z.xPct}%, ${z.yPct}%), size=(${z.widthPct}% x ${z.heightPct}%)${z.minTextPt ? `, minText=${z.minTextPt}pt` : ""}${z.maxCharacters ? `, maxChars=${z.maxCharacters}` : ""}`);
  }
  lines.push("");

  lines.push("=== APPROVED COPY ===");
  lines.push(JSON.stringify(generatedCopy, null, 2));
  lines.push("");

  lines.push("=== ASSET INSTRUCTIONS ===");
  for (const a of assets) {
    lines.push(`Asset: ${a.originalFilename} (${a.assetKind}) — Rights: ${a.rightsStatus}, Authenticity: ${a.authenticityClassification}. ${a.authenticityClassification === "AI_ILLUSTRATIVE" ? "MUST NOT be represented as real client staff/location/product." : ""}`);
  }
  lines.push("");

  lines.push("=== COMPLIANCE RULES ===");
  lines.push(`Risk class: ${complianceRule.riskClass}`);
  lines.push(`Requires source verification: ${complianceRule.requiresSourceVerification}`);
  lines.push(`Requires disclaimer: ${complianceRule.requiresDisclaimer}`);
  lines.push(`Requires professional review: ${complianceRule.requiresProfessionalReview}`);
  lines.push(`Prohibited claims: ${complianceRule.prohibitedClaims.join(", ")}`);
  lines.push(`Prohibited claims from brief: ${brief.prohibitedClaims.join(", ")}`);
  lines.push(`Required disclaimers: ${brief.requiredDisclaimers.join(", ")}`);
  lines.push("");

  lines.push("=== PRODUCTION RULES ===");
  lines.push("Use supplied official assets.");
  lines.push("Do not invent business facts.");
  lines.push("Do not invent logos.");
  lines.push("Do not invent phone/address/offer.");
  lines.push("Do not place AI text inside generated imagery.");
  lines.push("Respect the exact format dimensions.");
  lines.push("Preserve editable text.");
  lines.push("No overcrowding.");
  lines.push("No cheap generic template appearance.");
  lines.push("No arbitrary font explosion.");
  lines.push("No arbitrary decorative icons.");
  lines.push("No distorted logos.");
  lines.push("No tiny QR.");
  lines.push("No tiny disclaimer.");
  lines.push("No fake testimonial.");
  lines.push("No fake awards.");
  lines.push("No fake 'best' claims.");

  if (archetype.lane === "LANE_A_TRADITIONAL_UPGRADED") {
    lines.push("");
    lines.push("For Lane A: Retain familiar local-ad directness while upgrading spacing/hierarchy.");
  }
  if (archetype.lane === "LANE_B_PREMIUM_CREATIVE") {
    lines.push("");
    lines.push("For Lane B: Premium art direction without sacrificing clarity.");
  }
  if (archetype.lane === "LANE_C_SPONSORED_EDITORIAL") {
    lines.push("");
    lines.push("For Lane C: Editorial content dominates; sponsor remains clearly disclosed.");
  }

  return lines.join("\n");
}
