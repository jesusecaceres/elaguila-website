import type { ChurchApplicationInput } from "./churchApplicationParse";
import {
  clampConfidence,
  isChurchIntakeDecision,
  type ChurchIntakeResult,
} from "./churchIntakeTypes";

const SYSTEM_PROMPT = `You are a church application SAFETY AND PLAUSIBILITY SCREENER for a bilingual community directory.
You are NOT a pastor, theologian, religious authority, political reviewer, or truth oracle.
Do NOT judge theology, denomination, worship style, politics, or whether one Christian tradition is better than another.
Do NOT require a website, logo, social links, or a large congregation.
Do NOT invent verification. Listed is not verified.

Return ONLY JSON:
{
  "decision": "AUTO_PUBLISH" | "HUMAN_REVIEW" | "BLOCK",
  "confidence": number,
  "reasons": string[],
  "riskSignals": string[],
  "identityConfidence": number,
  "safetyConfidence": number
}

AUTO_PUBLISH: likely a real congregation/community of faith with coherent name/location/contact and no safety issues.
HUMAN_REVIEW: genuine uncertainty, possible duplicate, identity contradiction, or low-confidence evidence.
BLOCK: only clear spam, scam/fraud, malicious links, prohibited/unsafe content, or obviously irrelevant abuse.

Never BLOCK because the church is small, bilingual, uncommon denomination, missing website, missing logo, imperfect formatting, or absent social links.`;

export function parseChurchIntakeAiJson(raw: string): ChurchIntakeResult | null {
  const trimmed = raw.trim().replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start < 0 || end <= start) return null;
    try {
      parsed = JSON.parse(trimmed.slice(start, end + 1));
    } catch {
      return null;
    }
  }
  if (!parsed || typeof parsed !== "object") return null;
  const o = parsed as Record<string, unknown>;
  const decision = String(o.decision ?? "");
  if (!isChurchIntakeDecision(decision)) return null;
  const reasons = Array.isArray(o.reasons)
    ? o.reasons.filter((x): x is string => typeof x === "string").slice(0, 8)
    : [];
  const riskSignals = Array.isArray(o.riskSignals)
    ? o.riskSignals.filter((x): x is string => typeof x === "string").slice(0, 8)
    : [];
  return {
    decision,
    confidence: clampConfidence(Number(o.confidence)),
    reasons: reasons.length ? reasons : [decision],
    riskSignals,
    identityConfidence: clampConfidence(Number(o.identityConfidence)),
    safetyConfidence: clampConfidence(Number(o.safetyConfidence)),
    attentionFields: [],
    source: "ai_gateway",
  };
}

function screeningPayload(input: ChurchApplicationInput): string {
  return JSON.stringify({
    name: input.name,
    denomination: input.denomination || null,
    churchType: input.churchType || null,
    mission: (input.mission || "").slice(0, 1200),
    city: input.city || null,
    state: input.state || null,
    country: input.country || null,
    zip: input.zip || null,
    languages: input.languages,
    hasPhone: Boolean(input.phone),
    hasPublicEmail: Boolean(input.email),
    hasWebsite: Boolean(input.website),
    hasLogo: Boolean(input.logoUrl),
    hasApplicantEmail: Boolean(input.applicantEmail),
    ministryCount: input.ministries?.length ?? 0,
    serviceCount: input.services?.length ?? 0,
  });
}

export async function screenChurchApplicationWithAi(
  input: ChurchApplicationInput,
): Promise<ChurchIntakeResult | null> {
  const key = process.env.AI_GATEWAY_API_KEY?.trim();
  if (!key) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch("https://ai-gateway.vercel.sh/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: process.env.IGLESIAS_CHURCH_INTAKE_MODEL?.trim() || "openai/gpt-4o-mini",
        temperature: 0,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: screeningPayload(input) },
        ],
      }),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const content = json.choices?.[0]?.message?.content;
    if (!content) return null;
    return parseChurchIntakeAiJson(content);
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export { SYSTEM_PROMPT as CHURCH_INTAKE_AI_SYSTEM_PROMPT };
