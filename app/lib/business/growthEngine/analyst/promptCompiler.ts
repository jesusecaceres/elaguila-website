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
    QUESTIONS_ENGINE_GUIDANCE,
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

  return { systemInstruction, prompt };
}
