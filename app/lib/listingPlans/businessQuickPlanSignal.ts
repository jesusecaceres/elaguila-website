/**
 * Which base package a business checkout is buying: Quick (SIMPLE, $99) or Full ($399).
 *
 * Quick and Full share one canonical draft, preview, publisher, listing row and public page. The
 * ONLY thing that differs is which base package the customer pays for, so the Quick intake has to
 * tell the shared preview "this customer came to buy Quick". That intent rides on the handoff URL
 * the intake already navigates to, which is the one channel that survives the adapter → preview
 * boundary without inventing a second draft store or a second preview.
 *
 * Reading a plan from the URL is NOT client price authority. The parameter selects between two
 * server-defined package keys and nothing else: the amount, the entitlement and the access level
 * all come from `revenuePricingMatrix` on the server, and the key is re-validated at checkout. A
 * caller who forges `plan=quick` buys the cheaper, LESSER product and is stamped SIMPLE — the
 * escalation direction (paying $99 and receiving Full) is not reachable, because access is
 * derived from the package actually purchased.
 *
 * Anything absent, unrecognised or malformed means Full, so the standard application keeps its
 * existing behaviour byte for byte and only a deliberate Quick handoff changes anything.
 */

import { businessPackageKeyForLevel } from "./businessAccessLevel";

export const BUSINESS_PLAN_PARAM = "plan";
export const BUSINESS_PLAN_QUICK = "quick";

export type BusinessPlanChoice = "quick" | "full";

/** Append the Quick marker to an intake handoff href, preserving any query it already carries. */
export function withQuickPlanParam(href: string): string {
  const [path, hash = ""] = href.split("#", 2);
  const [base, query = ""] = path.split("?", 2);
  const params = new URLSearchParams(query);
  params.set(BUSINESS_PLAN_PARAM, BUSINESS_PLAN_QUICK);
  return `${base}?${params.toString()}${hash ? `#${hash}` : ""}`;
}

/** The plan a raw `plan` parameter asks for. Only the exact Quick token selects Quick. */
export function businessPlanFromParam(raw: string | null | undefined): BusinessPlanChoice {
  return String(raw ?? "").trim().toLowerCase() === BUSINESS_PLAN_QUICK ? "quick" : "full";
}

/** The plan a preview should check out, read from its own search params. */
export function businessPlanFromSearchParams(
  params: { get(name: string): string | null } | null | undefined,
): BusinessPlanChoice {
  return businessPlanFromParam(params?.get(BUSINESS_PLAN_PARAM) ?? null);
}

/**
 * The package key a category sells for the chosen plan. Returns null for a category with no
 * Simple/Full split, so a caller can keep its own key rather than be handed a wrong one.
 */
export function businessPackageKeyForPlan(
  category: string | null | undefined,
  plan: BusinessPlanChoice,
): string | null {
  return businessPackageKeyForLevel(category, plan === "quick" ? "simple" : "full");
}

/**
 * Pick the checkout a business preview should run.
 *
 * The URL marker is only ever consulted for a listing that does not exist yet. Once there is a
 * real row, the server's answer (`businessBasePlanOffer`) wins outright, because the URL cannot
 * know that this customer already paid for Quick and is resuming, or already holds SIMPLE and is
 * upgrading. Returning the caller's own constants keeps the category's return path, add-on rules
 * and line-item copy exactly as they were — only the package key can differ.
 */
export function selectBusinessBaseCheckout<
  Q extends { packageKey: string },
  F extends { packageKey: string },
>(input: {
  quick: Q;
  full: F;
  /** The plan the handoff URL asked for. Used only when the server has no answer. */
  urlPlan: BusinessPlanChoice;
  /** The server's answer for an existing listing, or null when there is no row / not yet known. */
  serverSellPackageKey: string | null | undefined;
}): Q | F {
  const server = String(input.serverSellPackageKey ?? "").trim().toLowerCase();
  if (server === input.quick.packageKey) return input.quick;
  if (server === input.full.packageKey) return input.full;
  return input.urlPlan === "quick" ? input.quick : input.full;
}
