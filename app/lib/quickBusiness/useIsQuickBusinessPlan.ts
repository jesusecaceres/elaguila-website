"use client";

/**
 * Is THIS application session a Quick business session? One answer for the four split families.
 *
 * Quick and Full share one canonical application, so the application needs to know which entitlement
 * it is filling in order to lock the Full-only fields (extra websites, socials, Google/Yelp, extra links,
 * video, coupons, inventory) and apply the category-aware photo cap. Two signals, in this order:
 *
 *  1. A live STAFF assisted custody context for this category: its `plan` comes from the signed cookie's
 *     server-resolved package key, so it is authoritative and always wins (a staff member selling Full
 *     is never downgraded by a stray `?plan=quick`, and one selling Quick never becomes Full because a
 *     link lost its parameter).
 *  2. Otherwise the `?plan=` marker of a customer's Quick handoff (`withQuickPlanParam`). The marker can only
 *     ever RESTRICT: a forged `plan=quick` buys the lesser product, and access is always derived
 *     server-side from the package actually purchased.
 *
 * `ready` is false until the staff-context read settles, so a caller can avoid flashing Full-only fields.
 * Never used as price or entitlement authority.
 */
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { businessPlanFromSearchParams } from "@/app/lib/listingPlans/businessQuickPlanSignal";
import { readAssistedCustodyContext } from "@/app/lib/sales/assistedSaveForClientClient";
import type { QuickSalesCategory } from "@/app/lib/sales/quickSalesCategories";

export function useIsQuickBusinessPlan(category: QuickSalesCategory): { isQuick: boolean; ready: boolean } {
  const params = useSearchParams();
  const urlQuick = businessPlanFromSearchParams(params) === "quick";
  const [staffPlan, setStaffPlan] = useState<"quick" | "full" | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const ctx = await readAssistedCustodyContext();
      if (cancelled) return;
      setStaffPlan(ctx && ctx.category === category ? (ctx.plan ?? null) : null);
    })();
    return () => {
      cancelled = true;
    };
  }, [category]);

  if (staffPlan === "quick") return { isQuick: true, ready: true };
  if (staffPlan === "full") return { isQuick: false, ready: true };
  return { isQuick: urlQuick, ready: staffPlan !== undefined };
}
