/**
 * Owner Command Center ← Business Concierge bridge (Gate 2 reconciliation).
 *
 * Client-safe fetch layer for the two owner-safe Concierge endpoints this workspace now
 * consumes. Deliberately holds no domain logic and no "server-only" import — it is a thin
 * fetch + type-narrowing wrapper matching this dashboard's existing convention (see
 * dashboardPackageEntitlementBadges.ts). All real shaping happens server-side in
 * app/api/dashboard/business/home/route.ts and app/api/dashboard/business/diy-concierge/
 * my-businesses/route.ts (ported verbatim from the Concierge owner-safe bridge, Concierge SHA
 * dbfa1fc3ba886e60dfe58087fd9e8653b9484920) — this file never fabricates a field they didn't
 * return.
 */

export type OwnerBusinessSummary = { businessId: string; displayName: string };

export async function fetchMyBusinesses(accessToken: string | null | undefined): Promise<OwnerBusinessSummary[]> {
  if (!accessToken?.trim()) return [];
  try {
    const res = await fetch("/api/dashboard/business/diy-concierge/my-businesses", {
      headers: { Authorization: `Bearer ${accessToken.trim()}` },
    });
    if (!res.ok) return [];
    const json = (await res.json()) as { ok?: boolean; businesses?: OwnerBusinessSummary[] };
    if (!json.ok || !Array.isArray(json.businesses)) return [];
    return json.businesses;
  } catch {
    return [];
  }
}

export type BusinessHealthDimension = {
  dimensionKey: string;
  status: string;
  explanationEs: string;
  explanationEn: string;
  limitationsEs: string;
  limitationsEn: string;
  calculatedAt: string;
};

export type AdvisorSignal = {
  id: string;
  signalType: string;
  severity: "blocked" | "priority" | "opportunity" | "information" | string;
  status: string;
  titleEs: string;
  titleEn: string;
  explanationEs: string;
  explanationEn: string;
  detectedAt: string;
};

export type OwnerSafeProposal = {
  id: string;
  status: string;
  isCurrent: boolean;
  ownerGoalEs: string | null;
  ownerGoalEn: string | null;
  verifiedNeedEs: string;
  verifiedNeedEn: string;
  recommendedIntervention: string;
};

export type OwnerSafeOutcome = {
  id: string;
  metricKey: string;
  metricLabelEs: string;
  metricLabelEn: string;
  baselineValue: string | null;
  baselineUnit: string | null;
  measuredValue: string | null;
  measuredUnit: string | null;
  result: string;
  confidence: string;
};

export type BusinessHomeResponse = {
  ok: boolean;
  error?: string;
  businessId?: string;
  business?: { id: string; displayName: string; businessStage: string };
  entitlement?: { state: string; packageTier: string | null; conciergeGuidance: false };
  whatMattersNow?: { available: boolean; recommendation: Record<string, unknown> | null };
  businessHealth?: {
    available: boolean;
    assessedAt: string | null;
    strengths: BusinessHealthDimension[];
    needsAttention: BusinessHealthDimension[];
  };
  actionPlan?: {
    available: boolean;
    progress: { total: number; completed: number; inProgressOrAvailable: number } | null;
  };
  whatLeonixUnderstands?: {
    available: boolean;
    confirmedFactCount: number;
    needsConfirmationCount: number;
    openQuestionsCount: number;
  };
  learning?: null;
  needsAttention?: { available: boolean; signals: AdvisorSignal[] };
  workWithLeonix?: {
    pendingApprovalsCount: number;
    pendingServiceRequestsCount: number;
    proposalsAwaitingDecision: OwnerSafeProposal[] | null;
  };
  progress?: { available: boolean; outcomes: OwnerSafeOutcome[] };
  assistant?: { available: boolean; hasActiveThread: boolean };
};

/** Fails closed (returns null) on any non-ok response — never fabricates a Business Home payload. */
export async function fetchBusinessHome(
  businessId: string,
  accessToken: string | null | undefined
): Promise<BusinessHomeResponse | null> {
  if (!businessId || !accessToken?.trim()) return null;
  try {
    const res = await fetch(`/api/dashboard/business/home?businessId=${encodeURIComponent(businessId)}`, {
      headers: { Authorization: `Bearer ${accessToken.trim()}` },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as BusinessHomeResponse;
    if (!json.ok) return null;
    return json;
  } catch {
    return null;
  }
}
