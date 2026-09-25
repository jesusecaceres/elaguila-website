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
 * WHAT `unverified` MEANS — AND WHY IT NEVER MEANS QUICK
 * ----------------------------------------------------
 * `unverified` is "this category HAS a Quick product, but no server record names a base package
 * for this publish and nothing declared Quick".
 *
 * OWNER RULE (2026-09-24): UNVERIFIED MUST NOT MEAN QUICK. Quick restrictions (image cap, no video,
 * role requirement, no socials / extra URLs / reviews / Yelp) apply ONLY when the server holds
 * AFFIRMATIVE evidence that the listing is Quick/Simple. A customer's FIRST save or publish always
 * precedes their payment, so the entitlement and the settled ledger are silent by construction; a
 * legitimate FULL customer looks exactly like that. Enforcing the Quick contract on absence of
 * evidence therefore rejected (or stripped) valid Full first publishes — 4+ photos, external video,
 * social links, images without a declared role — merely because payment had not happened yet.
 *
 * The evidence that PROVES Quick, in the order the resolver reads it:
 *   1. a verified staff assisted-publishing context (signed cookie `packageKey`, set from the Quick
 *      Sales product the staff member chose — the URL is never this authority),
 *   2. a live entitlement row for the listing,
 *   3. the settled checkout ledger,
 *   4. the Quick-only server publish operation (`serverCustodyQuick`, never settable from a body),
 *   5. a declaration of the category's SIMPLE key, read under the one-direction rule: it can only ever
 *      ADD the Quick contract to its own sender, never relax anything. A declared FULL key is never
 *      trusted (`unverified`, not `full`).
 * Every Quick session sends (5) on its own saves, and every proven-Quick listing is held to the full
 * contract on EVERY later save, publish and edit. What the rule deliberately does not do is guess: a
 * request with no evidence is not treated as Quick.
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
 *                     for this publish and nothing declared Quick. It NEVER means Quick: it may be a
 *                     Full customer's first, pre-payment save, so no Quick restriction applies to it.
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
 * AFFIRMATIVE EVIDENCE ONLY. The contract applies to exactly one answer: a product the server can
 * name as `quick` (assisted context, live entitlement, settled ledger, the Quick-only server
 * operation, or a declared SIMPLE key). It is skipped for:
 *   - `no_quick_product` — the category has no Simple/Full split (Autos Privado, Bienes FSBO, every
 *     private classified);
 *   - a PROVEN `full`;
 *   - `unverified` — no evidence either way. A first save/publish precedes payment, so a legitimate
 *     Full customer looks exactly like this; treating absence of evidence as Quick rejected valid Full
 *     media, video and links. Once the listing is proven Quick, every later seam enforces in full.
 */
export function quickContractAppliesTo(decision: QuickBusinessProductDecision): boolean {
  if (decision.source === "no_quick_product") return false;
  // AFFIRMATIVE EVIDENCE ONLY. `unverified` (no record, no declaration) and a proven `full` are both
  // outside the Quick contract; only a product the server can name as Quick is held to it.
  return decision.product === "quick";
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
