"use client";

import { createContext, useContext } from "react";

/**
 * LEONIX P0 FINAL ASSISTED PUBLISHING BRIDGE — the ONE place a category's own Preview component
 * learns "this render is server-verified assisted" without threading a prop through every
 * category's page/layout tree. Provided exactly once, at the shared choke point
 * (PublishAuthGate.tsx), from the SAME server-verified value ConciergeReturnBanner already renders
 * from — never computed or trusted client-side, never derived from a query string.
 *
 * A category's Preview component that has nothing assisted-specific to show (most of them, this
 * round) simply never calls the hook — `null` outside the gate, or when a normal customer session
 * is authenticated, is the correct default and requires no per-category opt-out.
 */
export type AssistedPublishingUi = { businessId: string; category: string } | null;

const AssistedPublishingUiContext = createContext<AssistedPublishingUi>(null);

export function AssistedPublishingUiProvider({
  value,
  children,
}: {
  value: AssistedPublishingUi;
  children: React.ReactNode;
}) {
  return <AssistedPublishingUiContext.Provider value={value}>{children}</AssistedPublishingUiContext.Provider>;
}

export function useAssistedPublishingUi(): AssistedPublishingUi {
  return useContext(AssistedPublishingUiContext);
}
