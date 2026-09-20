/**
 * SIMPLE -> FULL upgrade, started from an owner surface. One implementation for all four
 * business categories.
 *
 * Shaped deliberately like the dashboard add-on checkouts that already exist
 * (`startAutosDealerInventoryPackCheckout`, `startBienesInventoryPackCheckout`): a package is
 * bought for a listing that ALREADY exists, through the same `/api/revenue-os/checkout`, with no
 * content save, no status change and no republish. That is what makes the upgrade identity-
 * preserving by construction — the listing row, its slug, its media, its owner and its public
 * URL are never touched, because nothing in this path writes to them. Only the entitlement the
 * webhook grants afterwards is different.
 *
 * The caller never chooses the package. `upgradeTargetPackageKey` reads the single category ->
 * Simple/Full pairing, so the upgrade can only ever land on the Full package that category
 * already sells. Eligibility is likewise not the caller's to assert: the server resolves it
 * (`/api/revenue-os/business-base-plan`), and the checkout route independently refuses a
 * duplicate purchase through the pre-existing active-entitlement guard.
 */

import {
  redirectToRevenueCategoryCheckout,
  revenueCategoryCheckoutErrorMessage,
  startRevenueCategoryCheckout,
} from "@/app/lib/listingPlans/revenueCategoryCheckoutClient";
import { confirmRecurringConsentInteractively } from "@/app/lib/listingPlans/recurringConsentInteractive";
import { getRevenuePackageDefinition } from "@/app/lib/listingPlans/revenuePricingMatrix";
import { upgradeTargetPackageKey } from "@/app/lib/listingPlans/businessAccessLevel";
import { businessAccessCopy } from "@/app/lib/listingPlans/businessAccessCopy";
import { buildDashboardMisAnunciosReturnPath } from "@/app/lib/listingPlans/revenueOsReturnPath";

type Lang = "es" | "en";

export type BusinessUpgradeCheckoutResult = { ok: true; checkoutUrl: string } | { ok: false; userMessage: string };

/** The owner-facing button label. Centralized copy; no price, no package key. */
export function businessUpgradeCtaLabel(lang: Lang): string {
  return businessAccessCopy("upgradeCta", lang);
}

export function businessUpgradeBusyLabel(lang: Lang): string {
  return lang === "es" ? "Iniciando pago…" : "Starting checkout…";
}

/** The one-line promise shown next to the CTA: what the upgrade does NOT change. */
export function businessUpgradeHint(lang: Lang): string {
  return businessAccessCopy("upgradeReassurance", lang);
}

export async function startBusinessSimpleToFullUpgradeCheckout(input: {
  category: string;
  listingId: string;
  leonixAdId?: string | null;
  lang: Lang;
  customerEmail?: string | null;
  returnPath?: string | null;
}): Promise<BusinessUpgradeCheckoutResult> {
  const category = String(input.category ?? "").trim().toLowerCase();
  const listingId = String(input.listingId ?? "").trim();
  const packageKey = upgradeTargetPackageKey(category);

  if (!packageKey || !listingId) {
    return {
      ok: false,
      userMessage:
        input.lang === "es"
          ? "Este anuncio no tiene una mejora disponible."
          : "This listing has no upgrade available.",
    };
  }

  // Subscription package: affirmative recurring consent before checkout (Agreement v1.2 §17),
  // exactly as every other subscription entry point collects it. Cancel aborts.
  const recurringConsent = confirmRecurringConsentInteractively({
    lang: input.lang,
    amountCents: getRevenuePackageDefinition(packageKey)?.priceCents ?? 0,
  });
  if (!recurringConsent) {
    return {
      ok: false,
      userMessage:
        input.lang === "es"
          ? "Para continuar, autoriza el cobro recurrente mensual."
          : "To continue, authorize the recurring monthly charge.",
    };
  }

  const checkout = await startRevenueCategoryCheckout({
    category,
    packageKey,
    listingId,
    leonixAdId: input.leonixAdId?.trim() || null,
    returnPath: input.returnPath?.trim() || buildDashboardMisAnunciosReturnPath(input.lang, category),
    locale: input.lang,
    customerEmail: input.customerEmail,
    recurringConsent,
  });

  if (!checkout.ok || !checkout.checkoutUrl.trim()) {
    return {
      ok: false,
      userMessage: checkout.ok ? revenueCategoryCheckoutErrorMessage(input.lang) : checkout.userMessage,
    };
  }
  return { ok: true, checkoutUrl: checkout.checkoutUrl.trim() };
}

export async function redirectBusinessSimpleToFullUpgradeCheckout(
  input: Parameters<typeof startBusinessSimpleToFullUpgradeCheckout>[0],
): Promise<BusinessUpgradeCheckoutResult> {
  const result = await startBusinessSimpleToFullUpgradeCheckout(input);
  if (result.ok) redirectToRevenueCategoryCheckout(result.checkoutUrl);
  return result;
}
