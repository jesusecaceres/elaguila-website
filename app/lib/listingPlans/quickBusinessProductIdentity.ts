/**
 * Gate QB-BOUNDARY-01 — WHICH PRODUCT IS BEING PUBLISHED: Quick (SIMPLE) or Full.
 *
 * THE BLOCKER THIS CLOSES
 * -----------------------
 * The 2026-09-21 Quick refreeze made the semantic media contract real, but wired it to signals
 * that do not name a product:
 *
 *   - `app/api/clasificados/autos/listings/route.ts` enforced it for `body.lane === "negocios"`.
 *     That lane is the dealer lane, which BOTH the $99 Quick dealer package and the $399 Full
 *     dealer package publish through. A Full dealer was therefore subjected to the Quick contract.
 *   - the browser Bienes publish enforced it for `sellerType === "business"`, which is likewise
 *     shared by Quick agent and Full agent publishing.
 *
 * Neither `lane` nor `sellerType` is a product, and both arrive from the browser. This module is
 * the one place that answers "is this a VERIFIED QUICK BUSINESS publish?", and it answers from
 * facts the SERVER owns.
 *
 * THE CANONICAL FACT
 * ------------------
 * Quick and Full are two BASE PACKAGES of one product, and `BUSINESS_CATEGORY_PACKAGE_PAIR`
 * (businessAccessLevel.ts) is the single place that pairs them per category:
 *
 *      autos         →  simple: autos_dealer_quick_monthly   full: autos_dealer_monthly
 *      bienes-raices →  simple: br_agent_quick_monthly       full: br_agent_monthly
 *
 * So the canonical product fact is THE BASE PACKAGE KEY BOUND TO THIS PUBLISH, and the question
 * becomes: which server-owned record names it? In precedence order:
 *
 *   1. ASSISTED CONTEXT      — a staff actor's HMAC-signed, roster-rechecked assisted-publishing
 *                              cookie. Server-minted and server-verified; nothing in the request
 *                              body can produce it.
 *   2. LIVE ENTITLEMENT      — `listing_package_entitlements` rows, written only by Stripe
 *                              fulfilment. `businessAccessGrantForRow` turns a row into
 *                              `simple` / `full`. Full wins when a customer holds both, exactly as
 *                              `decideBusinessAccess` already rules.
 *   3. CHECKOUT LEDGER       — `leonix_payment_records.package_key`, written only by the server's
 *                              own checkout route from a server-validated package key.
 *   4. SERVER CUSTODY ROUTE  — resolution happening INSIDE the Quick-only server publish
 *                              operation, which can create nothing but Quick and binds the Quick
 *                              package key into the row it writes. Identity is the route, not the
 *                              body.
 *   5. DECLARED DOWNGRADE    — and only then, what the caller said, and ONLY when what it said is
 *                              the category's SIMPLE key. See below.
 *
 * WHY A DECLARATION IS ACCEPTABLE IN EXACTLY ONE DIRECTION
 * -------------------------------------------------------
 * A customer's FIRST publish precedes their payment: the row is inserted `pending`, then checkout
 * runs. At that instant no entitlement and no ledger row exists yet, so legs 2 and 3 are silent.
 * Rather than guess, this module accepts a declaration under one asymmetric rule already written
 * down in `businessQuickPlanSignal.ts`: declaring Quick buys the cheaper, LESSER product.
 *
 *   - A declaration is READ ONLY when it names the category's SIMPLE key. It can then only ever
 *     ADD the stricter Quick contract to the caller. It grants no access, no capacity, no price
 *     and no capability — those are all derived from the package actually purchased.
 *   - A declaration naming the FULL key, or anything else, is DISCARDED. There is no input by
 *     which a caller can declare its way OUT of the Quick contract.
 *   - Any server-owned fact (legs 1–4) OVERRIDES the declaration outright, in both directions.
 *
 * WHAT `unverified` MEANS, AND WHY IT STILL ENFORCES
 * --------------------------------------------------
 * `unverified` is "this category HAS a Quick product, but no server record names a base package
 * for this publish and nothing declared Quick".
 *
 * The first revision of this module made `unverified` skip the contract. An adversarial review
 * falsified that: a customer's FIRST publish always precedes their payment, so legs 1–4 are
 * silent by construction and the ONLY remaining signal is a declaration the browser can simply
 * omit. Skipping on `unverified` therefore did not protect Full dealers — it made the whole
 * contract OPT-IN FROM THE BROWSER. Omitting one field published a Quick Autos listing with a
 * dealership logo and no vehicle photo, which is exactly what this gate exists to refuse, and it
 * was strictly weaker than the behaviour that shipped before the gate existed.
 *
 * So the rule is inverted to FAIL SAFE, which is also what the owner's contract says in as many
 * words: a missing declaration must fail safely, never pass. The contract is skipped ONLY on a
 * PROVEN `full`, from a server-owned record. That keeps the real blocker closed — a $399 dealer
 * whose entitlement, ledger or assisted context names the Full package is untouched — while an
 * absent or unreadable signal lands on the stricter side rather than the permissive one.
 *
 * What this costs a genuine Full customer is nothing: the publish-seam contract is skipped on a
 * proven Full product. Quick is the same application with a real entitlement difference — at most
 * 3 images and no video — enforced only when `enforceQuickContract` is true.
 *
 * A category with no Simple/Full split at all — Autos Privado, Bienes FSBO, every private
 * classified — answers `source: "no_quick_product"` and is never touched by any of this.
 *
 * Pure and IO-free. The server reads that feed it live in
 * `app/lib/listingPlans/quickBusinessProductIdentityServer.ts`.
 */

import {
  BUSINESS_CATEGORY_PACKAGE_PAIR,
  businessAccessGrantForRow,
  type BusinessAccessLevel,
} from "@/app/lib/listingPlans/businessAccessLevel";

/**
 * The product a publish belongs to.
 *  - `"quick"`      — a verified SIMPLE ($99) business publish. The Quick contract applies.
 *  - `"full"`       — a verified FULL ($399) business publish. The Quick contract NEVER applies.
 *  - `"unverified"` — the category HAS a Quick product, but no server record names a base package
 *                     for this publish and nothing declared Quick. FAILS SAFE: the contract still
 *                     applies, because the only other signal available at a first publish is one
 *                     the browser can omit.
 */
export type QuickBusinessProduct = "quick" | "full" | "unverified";

/** Which record produced the answer. Recorded so a refusal can name its own basis. */
export type QuickBusinessProductSource =
  | "assisted_context"
  | "live_entitlement"
  | "checkout_ledger"
  | "server_custody_route"
  | "declared_simple_package"
  /** The category has no Simple/Full split at all, so no Quick product can exist for it. */
  | "no_quick_product"
  | "none";

/** One live `listing_package_entitlements` row, reduced to the two columns that name a product. */
export type ProductEntitlementRowFacts = {
  packageKey?: string | null;
  packageTier?: string | null;
};

/**
 * Everything the resolver may look at. Every field except `declaredPackageKey` is server-owned;
 * `declaredPackageKey` is explicitly the caller's word and is read under the one-direction rule.
 */
export type QuickBusinessProductFacts = {
  /** Business category as the package pair names it: `"autos"`, `"bienes-raices"`, … */
  category: string;
  /** Package key named by a verified staff assisted-publishing context. */
  assistedPackageKey?: string | null;
  /** LIVE entitlement rows for this listing. Callers must filter to live rows before passing. */
  liveEntitlementRows?: readonly ProductEntitlementRowFacts[] | null;
  /** Base package key on the most recent server-minted checkout record for this owner. */
  checkoutLedgerPackageKey?: string | null;
  /** True only inside the Quick-only server publish operation. Never settable from a body. */
  serverCustodyQuick?: boolean;
  /** What the caller said. Read only when it is the category's SIMPLE key. */
  declaredPackageKey?: string | null;
};

export type QuickBusinessProductDecision = {
  product: QuickBusinessProduct;
  source: QuickBusinessProductSource;
  /** The base package key the decision rests on, when one was named. Never fabricated. */
  packageKey: string | null;
};

function normalizeKey(value: unknown): string {
  return String(value ?? "").trim().toLowerCase();
}

function packagePair(category: string): { simple: string; full: string } | null {
  const pair = BUSINESS_CATEGORY_PACKAGE_PAIR[normalizeKey(category)];
  return pair ? { simple: pair.simple, full: pair.full } : null;
}

/** The SIMPLE (Quick) base package key for a category, or null when the category has no split. */
export function quickBasePackageKeyForCategory(category: string): string | null {
  return packagePair(category)?.simple ?? null;
}

/** The FULL base package key for a category, or null when the category has no split. */
export function fullBasePackageKeyForCategory(category: string): string | null {
  return packagePair(category)?.full ?? null;
}

/** Which product a base package key names, or null when the key is not one of the category's two. */
export function productForBasePackageKey(
  category: string,
  packageKey: string | null | undefined,
): "quick" | "full" | null {
  const pair = packagePair(category);
  if (!pair) return null;
  const key = normalizeKey(packageKey);
  if (!key) return null;
  if (key === normalizeKey(pair.simple)) return "quick";
  if (key === normalizeKey(pair.full)) return "full";
  return null;
}

/**
 * The product named by this listing's LIVE entitlement rows, via the SAME grant rule the access
 * resolver uses. `full` outranks `simple`, so a customer mid-upgrade (holding both for the moment
 * between the Full webhook and the Quick cancellation) is Full and keeps Full behavior.
 */
function productFromEntitlementRows(
  rows: readonly ProductEntitlementRowFacts[] | null | undefined,
): { product: "quick" | "full"; packageKey: string | null } | null {
  let best: BusinessAccessLevel = "none";
  let bestKey: string | null = null;
  for (const row of rows ?? []) {
    const grant = businessAccessGrantForRow({ packageKey: row.packageKey, packageTier: row.packageTier });
    if (!grant) continue;
    if (grant.level === "full") return { product: "full", packageKey: grant.packageKey };
    if (grant.level === "simple" && best === "none") {
      best = "simple";
      bestKey = grant.packageKey;
    }
  }
  return best === "simple" ? { product: "quick", packageKey: bestKey } : null;
}

/**
 * THE ONE RESOLVER. Never throws, never reads IO, and never returns `quick` from a browser
 * declaration that a server-owned record contradicts.
 */
export function resolveQuickBusinessProduct(
  facts: QuickBusinessProductFacts,
): QuickBusinessProductDecision {
  const pair = packagePair(facts.category);
  // A category with no Simple/Full split (Autos Privado, Bienes FSBO, every classified) has no
  // Quick product at all, so nothing here can ever put it under the Quick contract.
  if (!pair) return { product: "unverified", source: "no_quick_product", packageKey: null };

  const assisted = productForBasePackageKey(facts.category, facts.assistedPackageKey);
  if (assisted) {
    return { product: assisted, source: "assisted_context", packageKey: normalizeKey(facts.assistedPackageKey) };
  }

  const entitled = productFromEntitlementRows(facts.liveEntitlementRows);
  if (entitled) {
    return { product: entitled.product, source: "live_entitlement", packageKey: entitled.packageKey };
  }

  const ledger = productForBasePackageKey(facts.category, facts.checkoutLedgerPackageKey);
  if (ledger) {
    return { product: ledger, source: "checkout_ledger", packageKey: normalizeKey(facts.checkoutLedgerPackageKey) };
  }

  if (facts.serverCustodyQuick === true) {
    return { product: "quick", source: "server_custody_route", packageKey: pair.simple };
  }

  // The one-direction rule. Only the SIMPLE key is readable, and only to ADD the Quick contract.
  if (normalizeKey(facts.declaredPackageKey) === normalizeKey(pair.simple)) {
    return { product: "quick", source: "declared_simple_package", packageKey: pair.simple };
  }

  return { product: "unverified", source: "none", packageKey: null };
}

/**
 * Whether the Quick Business semantic media contract applies to this publish.
 *
 * FAIL SAFE. The contract is skipped on exactly two answers:
 *   - `no_quick_product` — the category has no Simple/Full split, so there is no Quick product to
 *     enforce and never was. Autos Privado, Bienes FSBO and every private classified land here.
 *   - a PROVEN `full`, named by a server-owned record (assisted context, live entitlement or the
 *     server-minted checkout ledger). This is the blocker the module was written to close.
 *
 * Everything else — including `unverified` — enforces. A first publish precedes payment, so an
 * undetermined product is the NORMAL case for the very requests this contract exists to govern;
 * treating it as permission to skip made the contract opt-in from the browser.
 */
export function quickContractAppliesTo(decision: QuickBusinessProductDecision): boolean {
  if (decision.source === "no_quick_product") return false;
  return decision.product !== "full";
}

/**
 * Convenience for a publish seam: resolve, then say whether to run the Quick contract.
 */
export function shouldEnforceQuickBusinessContract(
  facts: QuickBusinessProductFacts,
): { enforce: boolean; decision: QuickBusinessProductDecision } {
  const decision = resolveQuickBusinessProduct(facts);
  return { enforce: quickContractAppliesTo(decision), decision };
}
