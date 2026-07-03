import {
  BR_INVENTORY_PACK_MAX_CHILDREN,
  BR_INVENTORY_PACK_PRICE_CENTS,
} from "@/app/lib/listingPlans/publishCheckoutCheckpoint";

export const BR_AGENT_SHOWCASE_PRICE_CENTS = 39900;

export function brInventoryPackIsActive(accepted: boolean, childCount: number): boolean {
  return accepted || childCount > 0;
}

export function brApplicationMonthlyTotalCents(childCount: number, packAccepted: boolean): number {
  if (childCount >= 1) {
    return BR_AGENT_SHOWCASE_PRICE_CENTS + BR_INVENTORY_PACK_PRICE_CENTS;
  }
  if (packAccepted) {
    return BR_AGENT_SHOWCASE_PRICE_CENTS + BR_INVENTORY_PACK_PRICE_CENTS;
  }
  return BR_AGENT_SHOWCASE_PRICE_CENTS;
}

export function brApplicationPricingSummaryTotalCents(childCount: number): number {
  return childCount >= 1
    ? BR_AGENT_SHOWCASE_PRICE_CENTS + BR_INVENTORY_PACK_PRICE_CENTS
    : BR_AGENT_SHOWCASE_PRICE_CENTS;
}

export function formatBrMonthlyPrice(cents: number, lang: "en" | "es"): string {
  const dollars = Math.round(cents / 100);
  return lang === "es" ? `$${dollars}/mes` : `$${dollars}/month`;
}

export { BR_INVENTORY_PACK_MAX_CHILDREN, BR_INVENTORY_PACK_PRICE_CENTS };
