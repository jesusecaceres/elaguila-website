/**
 * Which base package an EXISTING business listing should be sold right now — the rule, with no
 * database in it.
 *
 * Split from `businessBasePlanOffer.ts` for the same reason `categoryCommercialPlanPolicy.ts` is
 * split from `categoryCommercialPlan.ts`: the fetch side reaches the Supabase admin client and is
 * therefore `server-only`, while the decision itself must stay directly callable — by the focused
 * verifiers, and by anything that already knows the facts. There is exactly one place that can
 * say "sell FULL to this listing", and this is it.
 *
 * `businessQuickPlanSignal` answers the same question for a brand-new application, from the
 * handoff URL. That signal is useless the moment a real row exists, and relying on it there
 * produces two real defects:
 *
 *   1. A Quick customer who abandons checkout returns from the dashboard through a URL that
 *      carries no marker, and the preview offers the FULL package — a $99 customer billed the
 *      Full price for the listing they already started.
 *   2. A paid SIMPLE customer has no way to buy FULL at all: the preview suppresses its checkout
 *      for any listing that is not awaiting a first purchase, which is every published listing.
 *
 * Both are the same question, and it is answerable from state the server already owns — the
 * entitlement table and the payment ledger. Nothing here reads a URL, a flag or a price.
 */

import {
  BUSINESS_CATEGORY_PACKAGE_PAIR,
  isBusinessBasePackageKey,
  upgradeTargetPackageKey,
  type BusinessAccessLevel,
} from "./businessAccessLevel";

/**
 * - `new`      — no live base grant and no purchase in flight. The caller keeps its own default
 *                (a fresh application's Quick/Full marker).
 * - `resume`   — an unresolved checkout exists. Re-offer the SAME package it was started for.
 * - `upgrade`  — the listing holds SIMPLE. Offer the category's existing FULL package.
 * - `settled`  — the listing already holds FULL. Nothing further to sell.
 */
export type BusinessBasePlanMode = "new" | "resume" | "upgrade" | "settled";

export type BusinessBasePlanOffer = {
  category: string;
  mode: BusinessBasePlanMode;
  /** The base package to offer now. `null` means "offer nothing extra". */
  sellPackageKey: string | null;
  /** The base package the listing already holds, when it holds one. Never fabricated. */
  heldPackageKey: string | null;
  accessLevel: BusinessAccessLevel;
};

/** The canonical listing table per business category — the row that owns identity and ownership. */
const BUSINESS_CATEGORY_LISTING_SOURCE: Readonly<
  Record<string, { readonly table: string; readonly ownerColumn: string }>
> = {
  servicios: { table: "servicios_public_listings", ownerColumn: "owner_user_id" },
  restaurantes: { table: "restaurantes_public_listings", ownerColumn: "owner_user_id" },
  autos: { table: "autos_classifieds_listings", ownerColumn: "owner_user_id" },
  "bienes-raices": { table: "listings", ownerColumn: "owner_id" },
};

export function businessCategoryListingSource(
  category: string | null | undefined,
): { readonly table: string; readonly ownerColumn: string } | null {
  return BUSINESS_CATEGORY_LISTING_SOURCE[String(category ?? "").trim().toLowerCase()] ?? null;
}

const NOTHING_TO_SELL = (category: string, mode: BusinessBasePlanMode): BusinessBasePlanOffer => ({
  category,
  mode,
  sellPackageKey: null,
  heldPackageKey: null,
  accessLevel: "none",
});

export function decideBusinessBasePlanOffer(input: {
  category: string;
  accessLevel: BusinessAccessLevel;
  heldPackageKey: string | null;
  /** Package key of an unresolved checkout attempt for this listing, when one exists. */
  resumePackageKey: string | null;
}): BusinessBasePlanOffer {
  const category = String(input.category ?? "").trim().toLowerCase();
  if (!BUSINESS_CATEGORY_PACKAGE_PAIR[category]) return NOTHING_TO_SELL(category, "new");

  const held = String(input.heldPackageKey ?? "").trim().toLowerCase() || null;

  if (input.accessLevel === "full") {
    return { category, mode: "settled", sellPackageKey: null, heldPackageKey: held, accessLevel: "full" };
  }

  if (input.accessLevel === "simple") {
    // The one upgrade target, read from the single category/package pairing. Never a new product.
    return {
      category,
      mode: "upgrade",
      sellPackageKey: upgradeTargetPackageKey(category),
      heldPackageKey: held,
      accessLevel: "simple",
    };
  }

  const resume = String(input.resumePackageKey ?? "").trim().toLowerCase();
  if (isBusinessBasePackageKey(category, resume)) {
    return { category, mode: "resume", sellPackageKey: resume, heldPackageKey: null, accessLevel: "none" };
  }

  return NOTHING_TO_SELL(category, "new");
}

export { NOTHING_TO_SELL as businessBasePlanNothingToSell };
