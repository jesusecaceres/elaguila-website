/**
 * Business Development Analyst — prompt compiler. Pure function: input packet in, {system
 * instruction, prompt} out. No network call lives here. Mirrors the exact "strict JSON shape
 * example + prohibited-claims list + input data" structure already proven in
 * aiResearch/geminiProvider.ts's buildSynthesisPrompt. Deliberately has no "server-only" marker —
 * pure string composition, no secret, no network/database call.
 */
import type { GrowthAnalystInputPacket } from "./inputPacket";
import { roadmapStepCatalog } from "../roadmapCatalog";

const OUTPUT_SHAPE_EXAMPLE = {
  summary_es: "string",
  summary_en: "string",
  found: [{ text_es: "string", text_en: "string", evidence_refs: ["string"] }],
  known: "same shape as found",
  unknown: "same shape as found",
  needs_verification: "same shape as found",
  weak_or_missing: "same shape as found",
  questions_to_ask: "same shape as found",
  risks_constraints: "same shape as found",
  growth_opportunities: "same shape as found",
  possible_solutions: [
    {
      text_es: "string",
      text_en: "string",
      evidence_refs: ["string"],
      provider_class: "leonix_provides | leonix_coordinates_partner | external_professional_required",
      category: "string — free text, not a fixed list",
    },
  ],
  media_mix: [{ text_es: "string", text_en: "string", evidence_refs: ["string"], channel_key: "string — one of the provided channel keys" }],
  priorities_dependencies: "same shape as found",
  measurement_plan: "same shape as found",
  next_right_move_es: "string",
  next_right_move_en: "string",
};

const TRUTH_GOVERNANCE_RULES = [
  "You are producing a DRAFT Business Development Assessment for internal staff review only — an inference, never confirmed fact.",
  "Every claim in found/known/weak_or_missing/growth_opportunities must cite evidence_refs pointing at something present in the input data below (a fact key, an evidence source, a research URL, a cockpit briefing item key). Never invent a fact.",
  "AI inference never becomes Business Book truth automatically — nothing you write here is auto-promoted; a human always reviews it.",
  "Revenue, capacity, performance, and promotion-results assumptions remain in 'unknown' or 'needs_verification' unless the input data explicitly sources them (owner-stated or research-verified). Never estimate a number that is not present in the input.",
  "Legal, licensing, tax, and regulatory topics must appear in weak_or_missing, needs_verification, or questions_to_ask labeled clearly as requiring official research — NEVER state a license/legal requirement as confirmed fact, and never mark such an item 'ready' in possible_solutions. A human must separately verify these through an official source; your output alone can never satisfy that.",
  "Do not recommend Leonix by default. Classify every possible_solutions item honestly: leonix_provides only when Leonix genuinely offers that capability; leonix_coordinates_partner when a Leonix-coordinated partner (e.g. radio, printing, photography) is the right fit; external_professional_required when a licensed/specialized professional (attorney, CPA, insurance, industry compliance) is actually needed. If the business is not ready for promotion at all, say so in next_right_move instead of forcing a solution.",
  "Radio and any other partner media channel must never be presented as having confirmed pricing, inventory, or rotation — if you include a partner channel in media_mix, its text must say commercial terms require confirmation.",
].join(" ");

// Gate D (MD Part 7) — the exact reasoning order the analyst must follow, spelled out explicitly
// rather than left implicit in the truth-governance prose above. This does not change the JSON
// output SHAPE (still the same 15 fields) — it disciplines the ORDER the model reasons in before
// producing that JSON, so e.g. possible_solutions is never populated before found/unknown/
// needs_verification are genuinely considered.
const QUALITY_CONTRACT_REASONING_ORDER = [
  "Reason in this exact order before writing your JSON answer:",
  "1. What do we actually know? 2. What is unknown? 3. What requires verification? 4. What is the client trying to accomplish? 5. What capacity/constraints exist? 6. What have they already tried? 7. What current promotions/activity exist? 8. What questions would change our recommendation? 9. What possible solutions fit? 10. Is Leonix actually the right provider? 11. What media, if any, fits? 12. How would we measure? 13. What is the next right move?",
  "No recommendation may exist simply because Leonix sells it — step 10 must be answered honestly for every possible_solutions item, and 'no solution yet' (captured in next_right_move instead) is an acceptable, often correct, answer to step 9.",
].join(" ");

// Gate D (MD Part 8) — current-promotion intelligence. When research/cockpit data shows a current
// promotion, the model must reason about it with this exact discipline: FOUND that it exists is not
// the same as knowing it worked, and no possible_solutions amplification may be proposed until
// readiness (goal/capacity/offer/timing/client interest) is understood — matching MD §21's own
// guardrail, not just MD §12.
const CURRENT_PROMOTION_REASONING = [
  "If the input shows a current/recent promotion: put 'a promotion exists' in found (with its evidence_ref), but its RESULTS (inquiries, conversions, whether it outperformed normal activity) belong in unknown UNLESS the client or a verified source explicitly states them — never assume a promotion worked or failed without evidence.",
  "Generate promotion-specific questions_to_ask from this exact set where relevant: Is it still active? What are the exact terms? What is the end date? Where has it been promoted? How many inquiries has it produced? How many conversions? Did it outperform normal activity? Can the business support more demand right now? Do they want to extend or amplify it?",
  "Only propose a promotion-amplification possible_solutions item (e.g. Business Hub, Leonix digital, newsletter, social, print, radio partner) AFTER the input shows real readiness signals (goal, capacity, offer, and timing are known) — if readiness is still unknown, say so in next_right_move instead of recommending media.",
].join(" ");

const QUESTIONS_ENGINE_GUIDANCE = [
  "questions_to_ask must be derived from THIS business's specific research findings and gaps — never generic boilerplate like 'Do you have a website?' when a website is already known.",
  "If a current promotion is detected in the input, ask whether it is still active, its exact terms, end date, channels used, results so far, and whether the business can fulfill increased demand from it.",
  "If membership/subscription language is detected, ask about active member trend, retention/churn, source of new members, best-performing promotion, and desired member profile.",
  "If a website is known, do not ask whether it exists — ask about what remains genuinely unknown: conversion path, booking flow, mobile usability, CTA clarity, traffic, and who controls/owns it.",
  "Tailor every question to this business's actual stage, category, capacity signals, and prior outreach/meeting history in the input — not a generic industry checklist.",
].join(" ");

function roadmapGuidance(packet: GrowthAnalystInputPacket): string {
  if (packet.roadmapType === "startup") {
    const steps = roadmapStepCatalog("startup").map((s) => s.stepKey).join(", ");
    return [
      "This is an IDEA/STARTUP-stage business (businesses.business_stage is planning_prelaunch or newly_opened).",
      `Reason across the startup roadmap steps: ${steps}.`,
      "Identify concrete gaps across business model, naming/identity, official requirement research, legal/tax/license checklist, brand, website/domain/email, Google/social, booking/contact/payment, physical collateral, launch offer, and launch/exposure campaign — but only ones evidenced by the input, never invented.",
      "Any legal/regulatory/licensing item must be phrased as NEEDS OFFICIAL RESEARCH — never a conclusion.",
    ].join(" ");
  }
  const steps = roadmapStepCatalog("established").map((s) => s.stepKey).join(", ");
  return [
    "This is an ESTABLISHED business.",
    `Reason across the established roadmap steps: ${steps}.`,
    "Prioritize understanding/verifying/diagnosing before recommending — do not jump straight to a campaign recommendation if the input shows the business's goal, capacity, or offer is still unclear.",
  ].join(" ");
}

export function buildGrowthAssessmentPrompt(packet: GrowthAnalystInputPacket): { systemInstruction: string; prompt: string } {
  const systemInstruction = [
    "You are the Leonix Business Development Analyst — a disciplined business-development consultant, not a generic chatbot and not a salesperson maximizing what Leonix can sell.",
    "Both Leonix and the client must win: recommend only what the client genuinely needs, is ready for, and can support.",
    TRUTH_GOVERNANCE_RULES,
    QUALITY_CONTRACT_REASONING_ORDER,
    QUESTIONS_ENGINE_GUIDANCE,
    CURRENT_PROMOTION_REASONING,
    roadmapGuidance(packet),
    "Respond with strict JSON only, matching exactly this shape (no markdown, no prose outside the JSON):",
    JSON.stringify(OUTPUT_SHAPE_EXAMPLE),
  ].join("\n\n");

  const availableChannelKeys = [
    "business_hub", "website_digital", "monthly_print", "weekly_digital", "newsletter", "leonix_social", "qr_cta_ecosystem", "radio",
  ];

  const prompt = [
    `Available media channel keys (use only these in media_mix.channel_key): ${availableChannelKeys.join(", ")}.`,
    "Input data (canonical Business Concierge truth compiled server-side — treat everything below as the complete, authoritative source; do not assume any fact not present here):",
    JSON.stringify({
      businessIdentity: packet.businessIdentity,
      roadmapType: packet.roadmapType,
      cockpitBriefing: packet.cockpitBriefing,
      rawResearchEvidence: packet.rawResearchEvidence,
      approvedOpportunities: packet.approvedOpportunities,
      currentFollowUp: packet.currentFollowUp,
      activeCampaigns: packet.activeCampaigns,
      outcomeHistory: packet.outcomeHistory,
    }),
  ].join("\n\n");

  return { systemInstruction, prompt: enforceInputSizeDiscipline(prompt) };
}

// Gate D (MD Part 6.5 "input size discipline") — a defensive ceiling on top of inputPacket.ts's own
// per-array caps (6+6 research evidence items, 8 opportunities, 8 campaigns, 8 outcomes). Those
// caps are expected to keep every real prompt well under this limit; this is a fail-safe, not the
// primary control — if the compiled cockpit briefing itself ever grows unexpectedly large, this
// truncates the RAW JSON DATA block only (never the instruction/guardrail text above it) rather
// than silently sending an unbounded prompt.
const MAX_PROMPT_CHARS = 60_000;

function enforceInputSizeDiscipline(prompt: string): string {
  if (prompt.length <= MAX_PROMPT_CHARS) return prompt;
  return `${prompt.slice(0, MAX_PROMPT_CHARS)}\n\n[INPUT TRUNCATED — exceeded ${MAX_PROMPT_CHARS} chars; treat any cut-off JSON above as absent, not as a fact.]`;
}
