/**
 * Comida Local admin — pure view helpers (closeout 2): listing truth, the canonical row-action set and the
 * status filter vocabulary. No React, no I/O.
 */
import { classifyPublication, type PublicationTruth } from "@/app/admin/_lib/publicationSemantics";
import {
  COMIDA_LOCAL_PAYMENT_SUSPENSION_REASON,
  COMIDA_LOCAL_STATUS_FILTER_OPTIONS,
  decideComidaLocalAdminAction,
  type ComidaLocalAdminAction,
  type ComidaLocalAdminActionRow,
} from "@/app/lib/clasificados/comida-local/comidaLocalAdminModeration";

import type { ClassifiedAdminLifecycleAction } from "../_components/ClassifiedAdminRowActions";

export { COMIDA_LOCAL_STATUS_FILTER_OPTIONS };

function lower(v: unknown): string {
  return typeof v === "string" ? v.trim().toLowerCase() : "";
}

/**
 * Listing truth for a Comida Local row: `classifyPublication("comida_local_public_listings", row)` plus three
 * honest corrections the shared classifier cannot make for this table:
 *  - it never receives `suspended_reason`, so a payment suspension read as "Suspended by staff — no reason";
 *  - it labels a `published` row with a non-`paid` payment_status "not public", but the public reader shows
 *    EVERY `status = published` row (so Live in Admin must agree with the site);
 *  - a published row without a Stripe payment (`waived` / legacy `not_required_for_l5b`) is live, not broken.
 */
export function comidaListingTruth(row: Record<string, unknown>): PublicationTruth {
  const t = classifyPublication("comida_local_public_listings", row);
  const status = lower(row.status);
  const pay = lower(row.payment_status);
  const reason = lower(row.suspended_reason);

  if (status === "published") {
    if (pay === "paid") return { ...t, semantic: "PUBLIC", reason: "Live: published and paid." };
    if (pay === "waived" || pay === "not_required_for_l5b") {
      return { ...t, semantic: "PUBLIC", reason: `Live: published (payment_status ${pay} — no Stripe payment on record).` };
    }
    return {
      ...t,
      semantic: "PUBLIC",
      reason: `Live on the public site (status published) but payment_status is "${pay || "blank"}" — payment anomaly, review it.`,
    };
  }
  if (status === "suspended") {
    return reason === COMIDA_LOCAL_PAYMENT_SUSPENSION_REASON
      ? { ...t, semantic: "PAUSED", reason: "Suspended because of a payment problem (grace expired or chargeback) — restored automatically when the payment is cured." }
      : {
          ...t,
          semantic: "NOT_PUBLIC_MODERATION",
          reason: reason ? `Suspended by staff (${reason}).` : "Suspended by staff — no reason is stored on the listing.",
        };
  }
  return t;
}

/** True when a published row is live but has no cleared payment (an anomaly worth surfacing). */
export function comidaPublishedPaymentAnomaly(row: Record<string, unknown>): string | null {
  if (lower(row.status) !== "published") return null;
  const pay = lower(row.payment_status);
  return pay === "paid" || pay === "waived" || pay === "not_required_for_l5b" ? null : pay || "blank";
}

const ACTION_COPY: Record<
  ComidaLocalAdminAction,
  { label: string; tone: ClassifiedAdminLifecycleAction["tone"]; confirm: string }
> = {
  suspend: {
    label: "Suspend",
    tone: "warning",
    confirm: "Suspend this listing? It stops showing publicly until restored (recorded as a staff moderation suspension).",
  },
  unsuspend: {
    label: "Restore",
    tone: "active",
    confirm: "Restore this listing to public visibility? It only goes live again because it already has a verified payment.",
  },
  archive: {
    label: "Archive (pause)",
    tone: "neutral",
    confirm: "Archive this listing? It is hidden from the public site (status paused) and can be republished later.",
  },
  republish: {
    label: "Republish",
    tone: "active",
    confirm: "Republish this paused listing? It only goes live again because it already has a verified payment.",
  },
};

/**
 * The canonical row actions for a Comida Local listing. Each button is built from the SAME
 * `decideComidaLocalAdminAction` the API route enforces; an action the policy refuses is shown disabled WITH the
 * reason (never hidden and never silently allowed). There is no "publish" button: draft / payment-pending rows go
 * live only through a verified payment.
 */
export function comidaRowLifecycleActions(row: ComidaLocalAdminActionRow): ClassifiedAdminLifecycleAction[] {
  const status = lower(row.status);
  const show: ComidaLocalAdminAction[] =
    status === "published"
      ? ["suspend", "archive"]
      : status === "paused"
        ? ["republish", "suspend"]
        : status === "suspended"
          ? ["unsuspend"]
          : // draft / pending_payment / unknown: the only meaningful staff move is refused with its reason.
            ["republish"];
  return show.map((action) => {
    const d = decideComidaLocalAdminAction(action, row);
    const copy = ACTION_COPY[action];
    return {
      action,
      label: copy.label,
      tone: copy.tone,
      confirm: copy.confirm,
      disabled: !d.ok,
      reason: d.ok ? null : d.message,
    };
  });
}
