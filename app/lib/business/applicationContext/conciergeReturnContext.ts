/**
 * P0 Sales Ad Creation Flow — the ONE generic "who is this ad for" carrier across every category
 * application. Same substrate every category draft already uses (browser sessionStorage) — no
 * new architecture, no database table, no server round trip.
 *
 * Written once by HandoffClient right before it hands off into the real category application
 * (same tab, so the write is guaranteed visible to whatever loads next — same reasoning as every
 * category's own draft store: "a new tab would never see it"). Read by ConciergeReturnBanner on
 * a category's draft-preview page so staff can jump straight back to the business they're working
 * on instead of re-searching the Business Concierge inventory.
 *
 * Deliberately silent-degrading: a customer's own personal-classified session (no Concierge
 * handoff ever ran) simply has no key set, so every reader here returns null and every consumer
 * renders nothing — this can never appear for a real public visitor.
 */

const CONCIERGE_RETURN_CONTEXT_KEY = "leonix.concierge.returnContext.v1";

export type ConciergeReturnContext = {
  businessId: string;
  /** Display name captured at handoff time — avoids a second fetch just to show a label. */
  businessName: string;
  /** The PublicarGatewayCategoryKey the staff member was sent to create (e.g. "servicios"). */
  category: string;
  /** ISO timestamp — informational only, never used to expire the record. */
  handedOffAt: string;
};

function hasSessionStorage(): boolean {
  try {
    return typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";
  } catch {
    return false;
  }
}

export function writeConciergeReturnContext(ctx: Omit<ConciergeReturnContext, "handedOffAt">): void {
  if (!hasSessionStorage()) return;
  try {
    const full: ConciergeReturnContext = { ...ctx, handedOffAt: new Date().toISOString() };
    window.sessionStorage.setItem(CONCIERGE_RETURN_CONTEXT_KEY, JSON.stringify(full));
  } catch {
    // Private mode / quota — the category application itself still works without this.
  }
}

export function readConciergeReturnContext(): ConciergeReturnContext | null {
  if (!hasSessionStorage()) return null;
  try {
    const raw = window.sessionStorage.getItem(CONCIERGE_RETURN_CONTEXT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ConciergeReturnContext>;
    if (!parsed.businessId || !parsed.businessName || !parsed.category) return null;
    return {
      businessId: parsed.businessId,
      businessName: parsed.businessName,
      category: parsed.category,
      handedOffAt: parsed.handedOffAt ?? new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export function clearConciergeReturnContext(): void {
  if (!hasSessionStorage()) return;
  try {
    window.sessionStorage.removeItem(CONCIERGE_RETURN_CONTEXT_KEY);
  } catch {
    // ignore
  }
}
