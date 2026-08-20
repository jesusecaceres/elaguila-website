import type { PrayerSafetyResult } from "./prayerTypes";
import { emptySafetyResult, mergeSafetyResults } from "./prayerSafetyRouting";

const PHONE_RE = /(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{3}\)?[\s.-]?){2}\d{4}/;
const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const ADDRESS_RE = /\b\d{1,5}\s+\w+\s+(street|st|avenue|ave|road|rd|blvd|drive|dr|lane|ln|calle|avenida|apto|apt)\b/i;

const IMMINENT_SELF_HARM = [
  /i am going to kill myself/i,
  /voy a suicidarme/i,
  /voy a matarme/i,
  /i have a plan to (end my life|kill myself|suicide)/i,
  /tonight i (will|am going to) (kill myself|end my life)/i,
];

const IMMINENT_VIOLENCE = [
  /i will (hunt down|kill|shoot|stab)\b.{0,40}\b(them|him|her|you)\b/i,
  /voy a (matar|asesinar|disparar)\b/i,
];

const HATE_VIOLENCE = [
  /\b(kill all|exterminate|gas the)\b/i,
];

const SPAM = [
  /\b(buy now|crypto pump|click here to win|work from home \$\d)\b/i,
  /\b(compra ahora|gana dinero fácil)\b/i,
];

/**
 * Conservative local classifier used at the adapter boundary (tests + production pre-scan).
 * Does NOT judge theology, grief, doubt, addiction, or messy emotion.
 */
export function classifyPrayerSafetyDeterministic(body: string): PrayerSafetyResult {
  const text = body.trim();
  const result: PrayerSafetyResult = {
    decision: "CLEARLY_SAFE",
    reason_codes: [],
    risk_level: "low",
    contains_private_info: false,
    contains_third_party_pii: false,
    contains_spam: false,
    contains_threat: false,
    contains_hate: false,
    contains_self_harm_signal: false,
    contains_imminent_violence_signal: false,
    source: "heuristic",
  };

  if (IMMINENT_SELF_HARM.some((re) => re.test(text))) {
    result.decision = "HIGH_RISK";
    result.risk_level = "critical";
    result.contains_self_harm_signal = true;
    result.reason_codes.push("SELF_HARM_IMMINENT");
    return result;
  }

  if (IMMINENT_VIOLENCE.some((re) => re.test(text))) {
    result.decision = "HIGH_RISK";
    result.risk_level = "critical";
    result.contains_imminent_violence_signal = true;
    result.contains_threat = true;
    result.reason_codes.push("IMMINENT_VIOLENCE");
    return result;
  }

  if (HATE_VIOLENCE.some((re) => re.test(text))) {
    result.decision = "CLEARLY_DISALLOWED";
    result.risk_level = "high";
    result.contains_hate = true;
    result.contains_threat = true;
    result.reason_codes.push("HATE_VIOLENCE");
    return result;
  }

  if (SPAM.some((re) => re.test(text))) {
    result.decision = "CLEARLY_DISALLOWED";
    result.contains_spam = true;
    result.reason_codes.push("SPAM");
    result.risk_level = "medium";
    return result;
  }

  const phone = PHONE_RE.test(text);
  const email = EMAIL_RE.test(text);
  const address = ADDRESS_RE.test(text);
  if (phone || email || address) {
    result.decision = "UNCERTAIN";
    result.contains_private_info = true;
    result.contains_third_party_pii = true;
    result.reason_codes.push("POSSIBLE_PII");
    result.risk_level = "medium";
  }

  return result;
}

function parseGatewayJson(raw: string): PrayerSafetyResult | null {
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
  const decisionRaw = String(o.decision ?? "");
  const decision =
    decisionRaw === "CLEARLY_SAFE" ||
    decisionRaw === "UNCERTAIN" ||
    decisionRaw === "CLEARLY_DISALLOWED" ||
    decisionRaw === "HIGH_RISK"
      ? decisionRaw
      : null;
  if (!decision) return null;
  const codes = Array.isArray(o.reason_codes)
    ? o.reason_codes.filter((x): x is string => typeof x === "string").slice(0, 12)
    : [];
  const riskRaw = String(o.risk_level ?? "");
  const risk_level =
    riskRaw === "low" || riskRaw === "medium" || riskRaw === "high" || riskRaw === "critical" ? riskRaw : null;
  const flag = (k: string) => o[k] === true;
  return {
    decision,
    reason_codes: codes,
    risk_level,
    contains_private_info: flag("contains_private_info"),
    contains_third_party_pii: flag("contains_third_party_pii"),
    contains_spam: flag("contains_spam"),
    contains_threat: flag("contains_threat"),
    contains_hate: flag("contains_hate"),
    contains_self_harm_signal: flag("contains_self_harm_signal"),
    contains_imminent_violence_signal: flag("contains_imminent_violence_signal"),
    source: "ai_gateway",
  };
}

const SYSTEM_PROMPT = `You are a SAFETY CLASSIFIER for a public Prayer Wall.
You are NOT a pastor, theologian, political judge, or counselor.
Return ONLY JSON with keys:
decision, reason_codes, risk_level, contains_private_info, contains_third_party_pii,
contains_spam, contains_threat, contains_hate, contains_self_harm_signal, contains_imminent_violence_signal

decision must be one of:
CLEARLY_SAFE, UNCERTAIN, CLEARLY_DISALLOWED, HIGH_RISK

CLEARLY_DISALLOWED examples: targeted hate, wishing violence, credible threat, doxxing,
explicit sexual exploitation, targeted harassment, spam/ads disguised as prayer,
malicious trolling, instructions facilitating violence.

HIGH_RISK: immediate self-harm/suicide intent, imminent violence, abuse in progress,
immediate medical emergency.

Do NOT overflag: grief, anger, questioning God, loss of faith, doubt, addiction, recovery,
marriage problems, family conflict, fear, anxiety, depression without immediate self-harm intent,
political concern without threat/hate, unusual theology, poor grammar, emotional writing.

If the text includes another person's phone, address, or similar private identifiers, set
contains_private_info and contains_third_party_pii true and use UNCERTAIN unless also disallowed.`;

async function classifyWithAiGateway(body: string): Promise<PrayerSafetyResult | null> {
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
        model: process.env.IGLESIAS_PRAYER_SAFETY_MODEL?.trim() || "openai/gpt-4o-mini",
        temperature: 0,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: body.slice(0, 2000) },
        ],
      }),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const content = json.choices?.[0]?.message?.content;
    if (!content) return null;
    return parseGatewayJson(content);
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function classifyPrayerSafety(body: string): Promise<PrayerSafetyResult> {
  const heuristic = classifyPrayerSafetyDeterministic(body);
  if (heuristic.decision === "HIGH_RISK" || heuristic.decision === "CLEARLY_DISALLOWED") {
    return heuristic;
  }

  const ai = await classifyWithAiGateway(body);
  if (!ai) {
    if (heuristic.decision === "CLEARLY_SAFE") return { ...emptySafetyResult("ai_failure"), source: "ai_failure" };
    return { ...heuristic, reason_codes: [...heuristic.reason_codes, "AI_FAILURE"], source: "ai_failure" };
  }

  return mergeSafetyResults(heuristic, ai);
}
