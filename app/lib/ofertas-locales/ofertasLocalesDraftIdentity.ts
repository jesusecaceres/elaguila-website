/**
 * Ofertas-local application session identity.
 * Distinguishes NEW APPLICATION vs CONTINUE vs same-tab REFRESH.
 * Browser-only. Does not delete database products or listings.
 */

export type OfertaLocalDraftLoadDecision = "new" | "continue" | "active";

export type OfertaLocalDraftLoadSignals = {
  intent?: string | null;
  fresh?: string | null;
  step?: string | null;
  listingId?: string | null;
  review?: string | null;
  navigation?: "reload" | "navigate" | "unknown" | null;
};

export function createOfertaLocalApplicationSessionId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `ol-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function sanitizeOfertaLocalApplicationSessionId(raw: unknown): string {
  const value = String(raw ?? "").trim();
  return value.slice(0, 80);
}

export function resolveOfertaLocalDraftLoadDecision(input: {
  signals: OfertaLocalDraftLoadSignals;
  activeSessionId: string | null;
  storedSessionId: string | null;
}): OfertaLocalDraftLoadDecision {
  const intent = String(input.signals.intent ?? "").trim().toLowerCase();
  const fresh = String(input.signals.fresh ?? "").trim().toLowerCase();
  const step = String(input.signals.step ?? "").trim();
  const listingId = String(input.signals.listingId ?? "").trim();
  const review = String(input.signals.review ?? "").trim();

  if (intent === "new" || fresh === "1" || fresh === "true") {
    return "new";
  }

  if (
    intent === "continue" ||
    intent === "edit" ||
    Boolean(step) ||
    Boolean(listingId) ||
    review === "1" ||
    review === "true"
  ) {
    return "continue";
  }

  const active = String(input.activeSessionId ?? "").trim();
  const stored = String(input.storedSessionId ?? "").trim();
  const navigation = input.signals.navigation ?? "unknown";
  if (active && stored && active === stored && navigation !== "navigate") {
    return "active";
  }

  return "new";
}

export function readOfertaLocalNavigationKind(): "reload" | "navigate" | "unknown" {
  if (typeof performance === "undefined") return "unknown";
  try {
    const entry = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    if (entry?.type === "reload") return "reload";
    if (entry?.type === "navigate" || entry?.type === "back_forward") return "navigate";
  } catch {
    // ignore
  }
  return "unknown";
}

export function ofertaLocalDraftResetDoesNotTouchDatabase(): true {
  return true;
}
