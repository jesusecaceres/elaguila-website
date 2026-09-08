/**
 * Package A, Gate 9/13 — provider-agnostic generation compiler.
 *
 * canvaPromptCompiler.ts remains Canva-specific (post-approval production handoff formatting) and
 * is left untouched. This module is the new, separate compiler that turns:
 *
 *   VERIFIED INPUT SNAPSHOT + CREATIVE BRIEF + RELEVANT LEONIX DOCTRINE + FORMAT/SPEC REQUIREMENTS
 *   + REQUEST-SPECIFIC INSTRUCTION
 *
 * into one provider-neutral CreativeProviderInput (providerTypes.ts) that either Gemini or OpenAI
 * can execute identically. It never sends unrelated doctrine sections merely because they exist —
 * the caller must pass an already-compiled CompiledDoctrine (see doctrine/compiler.ts), which is
 * itself filtered to the job's asset type / risk class / lane / family.
 */
import type { PrintFormatSpec } from "./printSpecs";
import type { CreativeBrief, SnapshotCategory } from "./types";
import type { CreativeProviderInput } from "./providerTypes";
import type { CompiledDoctrine } from "./doctrine/types";

export interface GenerationCompilerInput {
  readonly snapshotCategories: readonly SnapshotCategory[];
  readonly brief: CreativeBrief;
  readonly doctrine: CompiledDoctrine;
  readonly formatSpec: PrintFormatSpec | null;
  readonly requestInstruction: string;
}

const GENERATION_RESPONSE_SCHEMA: Record<string, unknown> = {
  type: "object",
  properties: {
    headlines: { type: "array", items: { type: "string" } },
    bodyCopy: { type: "array", items: { type: "string" } },
    cta: { type: "string" },
    disclaimer: { type: ["string", "null"] },
    notes: { type: "string" },
  },
  required: ["headlines", "bodyCopy", "cta"],
};

function renderSnapshotSection(categories: readonly SnapshotCategory[]): string {
  const lines: string[] = ["=== VERIFIED INPUT SNAPSHOT (truth outranks any creative suggestion) ==="];
  for (const c of categories) {
    lines.push(`Category "${c.category}" — truthStatus=${c.truthStatus}`);
    lines.push(JSON.stringify(c.data));
  }
  return lines.join("\n");
}

function renderBriefSection(brief: CreativeBrief): string {
  return [
    "=== CREATIVE BRIEF ===",
    `Business goal: ${brief.businessGoal}`,
    `Campaign objective: ${brief.campaignObjective}`,
    `Reader need: ${brief.readerNeed}`,
    `Target audience: ${brief.targetAudience}`,
    `Primary message: ${brief.primaryMessage}`,
    `Supporting message: ${brief.supportingMessage ?? "N/A"}`,
    `Offer: ${brief.offer ?? "N/A"}`,
    `CTA: ${brief.cta}`,
    `Contact path: ${brief.contactPath}`,
    `Key services: ${brief.keyServices.join(", ") || "N/A"}`,
    `Trust evidence: ${brief.trustEvidence.join(", ") || "N/A"}`,
    `Required disclaimers: ${brief.requiredDisclaimers.join(", ") || "None"}`,
    `Prohibited claims: ${brief.prohibitedClaims.join(", ") || "None"}`,
    `Risk class: ${brief.riskClass}`,
    `Primary language: ${brief.primaryLanguage}${brief.secondaryLanguage ? ` / secondary: ${brief.secondaryLanguage}` : ""}`,
  ].join("\n");
}

function renderFormatSection(formatSpec: PrintFormatSpec | null): string {
  if (!formatSpec) return "=== FORMAT ===\nNo print format selected (non-print creative request).";
  return [
    "=== FORMAT SPECIFICATION (source of truth: printSpecs.ts — never restate these numbers elsewhere) ===",
    `${formatSpec.label}: ${formatSpec.trimWidthIn}" x ${formatSpec.trimHeightIn}" trim, ${formatSpec.pixelWidth}x${formatSpec.pixelHeight}px.`,
  ].join("\n");
}

/**
 * Builds the final provider-neutral system instruction + prompt. Deterministic given the same
 * inputs — no randomness, no hidden state — so the same job/brief/doctrine version always
 * compiles to the same instruction (aside from the request-specific instruction text a staff
 * member supplies).
 */
export function compileGenerationInput(input: GenerationCompilerInput): CreativeProviderInput {
  const systemInstruction = [
    "You are the Leonix Creative Studio generation engine. You write copy/brief content for a",
    "real local business. You NEVER invent facts not present in the verified input snapshot.",
    "Return ONLY a JSON object matching the requested schema — no prose outside the JSON.",
    "",
    input.doctrine.instructionText,
  ].join("\n");

  const prompt = [
    renderSnapshotSection(input.snapshotCategories),
    "",
    renderBriefSection(input.brief),
    "",
    renderFormatSection(input.formatSpec),
    "",
    "=== REQUEST ===",
    input.requestInstruction,
  ].join("\n");

  return { systemInstruction, prompt, responseSchema: GENERATION_RESPONSE_SCHEMA };
}
