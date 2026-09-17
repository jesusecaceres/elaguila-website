/**
 * LEO-22D — Canonical owner-facing cockpit health.
 * One semantic per capability. No fake green. No secrets.
 */

export const LEO_COCKPIT_HEALTH_STATES = [
  "HEALTHY",
  "DEGRADED",
  "NOT_CONFIGURED",
  "UNAVAILABLE",
  "AUTH_REQUIRED",
  "PERMISSION_REQUIRED",
  "UNPROVEN",
] as const;

export type LeoCockpitHealthState = (typeof LEO_COCKPIT_HEALTH_STATES)[number];
export type LeoCockpitImpairedHealthState = Exclude<LeoCockpitHealthState, "HEALTHY">;

export type LeoCockpitHealthTruth = {
  health: LeoCockpitHealthState;
  label: string;
  explanation: string;
  sourceId: string;
  nextStep: string | null;
};

export type LeoCockpitLoadResult<T> =
  | { ok: true; health: "HEALTHY"; data: T; truth: LeoCockpitHealthTruth }
  | { ok: false; health: LeoCockpitImpairedHealthState; data: null; truth: LeoCockpitHealthTruth };

export function presentLeoCockpitHealth(truth: LeoCockpitHealthTruth): string {
  return `${truth.label}: ${truth.explanation}`;
}

export function classifyLeoKnownLoadError(
  error: string | null | undefined,
): LeoCockpitImpairedHealthState {
  const e = (error ?? "").toLowerCase();
  if (e.includes("missing_owner_actor_id") || e.includes("missing_auth_user_id")) return "AUTH_REQUIRED";
  if (e.includes("not_configured") || e.includes("google_not_configured")) return "NOT_CONFIGURED";
  if (e.includes("forbidden") || e.includes("permission")) return "PERMISSION_REQUIRED";
  if (e.includes("unavailable") || e.includes("network") || e.includes("timeout")) return "UNAVAILABLE";
  return "UNAVAILABLE";
}

export function ownerMessageForAuthIdentity(): string {
  return "Owner admin session is active, but the durable auth user id cookie is missing. Alerts, acknowledgements, and governed-action lists that persist per owner need that identity. Sign out and sign back in as owner, or complete admin identity linking. LEO will not invent a user id.";
}

export function presentLeoCockpitLoadError(error: string | null | undefined): {
  health: LeoCockpitImpairedHealthState;
  explanation: string;
  nextStep: string | null;
} {
  const health = classifyLeoKnownLoadError(error);
  if (health === "AUTH_REQUIRED") {
    return {
      health,
      explanation: ownerMessageForAuthIdentity(),
      nextStep: "Sign out and sign back in as owner so the auth user id cookie is set.",
    };
  }
  if (health === "NOT_CONFIGURED") {
    return {
      health,
      explanation: "This capability is not configured in this environment.",
      nextStep: "Configure the required server credentials, then reload.",
    };
  }
  if (health === "PERMISSION_REQUIRED") {
    return {
      health,
      explanation: "This capability is permission-limited for the current owner session.",
      nextStep: "Use an owner-admin session with the required permission.",
    };
  }
  return {
    health,
    explanation: "Temporarily unavailable after known checks failed.",
    nextStep: "Retry shortly. LEO will not invent data to fill this gap.",
  };
}
