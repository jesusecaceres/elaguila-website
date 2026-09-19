/**
 * ADMIN LISTING COMMERCIAL TRUTH (closeout 2 — normalized operating shell).
 *
 * One shared, READ-ONLY answer to "what is the commercial state of this listing?" for any Admin
 * category queue. It batch-reads exactly three canonical sources and nothing else:
 *
 *   leonix_payment_records          -> payment status, package key, checkout / subscription linkage
 *   listing_package_entitlements    -> entitlement status / end date
 *   leonix_subscription_records     -> subscription lifecycle (active / grace / suspended / canceled …)
 *
 * and folds them through the existing `derivePaymentCircuit` (CHECKOUT ≠ PAID ≠ ENTITLEMENT ≠ LISTING LIVE).
 *
 * Doctrine (never bend these):
 *  - Admin NEVER fabricates or writes payment truth. This module has no write path.
 *  - Listing status is NOT payment truth and payment truth is NOT listing status. A listing with no
 *    payment record is reported as "no payment record", never as "unpaid" or "paid".
 *  - An unreadable source degrades to UNKNOWN for the affected rows (never to zero / "none" / "ok"),
 *    and the circuit is withheld rather than guessed when any input table could not be read.
 *  - ≤100 ids per query.
 *
 * No `server-only` import so the pure derivation can be exercised by the tsx verifier; the loader
 * only ever runs from server components (service-role client).
 */
import type { SupabaseClient } from "@supabase/supabase-js";

import { getAdminSupabase } from "@/app/lib/supabase/server";
import { derivePaymentCircuit, type PaymentCircuit } from "./paymentCircuit";
import { classifyPublication, publicationSourceForCategory, type PublicationTruth } from "./publicationSemantics";

export type AdminCommercialTruthState = "known" | "no_payment_record" | "unknown";

export type AdminListingCommercialTruth = {
  listingId: string;
  /**
   * known             — at least one payment record is linked to this listing.
   * no_payment_record — the sources were readable and no payment record references this listing
   *                     (entitlement / subscription may still exist: comp, print, manual grants).
   * unknown           — the payment source could not be read; nothing is claimed.
   */
  state: AdminCommercialTruthState;
  paymentRecordId: string | null;
  paymentStatus: string | null;
  paymentSource: string | null;
  packageKey: string | null;
  packageTier: string | null;
  billingMode: string | null;
  amountPaidCents: number | null;
  paidAt: string | null;
  entitlementId: string | null;
  entitlementStatus: string | null;
  entitlementEndsAt: string | null;
  subscriptionStatus: string | null;
  /** null when there is no payment record OR any input table was unreadable (never guessed). */
  circuit: PaymentCircuit | null;
  /** Canonical tables that could not be read for this batch. Empty when everything was readable. */
  unreadable: string[];
  note: string | null;
};

export type AdminListingCommercialTruthMap = Record<string, AdminListingCommercialTruth>;

export type CommercialPaymentRow = {
  id: string;
  listing_id: string | null;
  package_key: string | null;
  package_tier: string | null;
  package_entitlement_id: string | null;
  payment_status: string;
  source: string | null;
  billing_mode: string | null;
  stripe_checkout_session_id: string | null;
  stripe_subscription_id: string | null;
  amount_paid_cents: number | null;
  amount_total_cents: number | null;
  paid_at: string | null;
  created_at: string | null;
};

export type CommercialEntitlementRow = {
  id: string;
  listing_id: string | null;
  status: string;
  package_tier: string | null;
  ends_at: string | null;
  revoked_at: string | null;
  created_at: string | null;
};

export type CommercialSubscriptionRow = {
  listing_id: string | null;
  status: string;
  cancel_at_period_end: boolean;
  stripe_subscription_id: string | null;
  updated_at: string | null;
};

export type CommercialWebhookRow = { status: string; resultCode: string | null; receivedAt: string | null };

export const COMMERCIAL_TRUTH_TABLES = {
  payments: "leonix_payment_records",
  entitlements: "listing_package_entitlements",
  subscriptions: "leonix_subscription_records",
} as const;

/** Per-query id cap (PostgREST URL length + the same cap the Payment Tracker uses). */
export const COMMERCIAL_TRUTH_IDS_PER_QUERY = 100;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CLEARED = new Set(["paid", "succeeded"]);
const TERMINAL_MONEY = new Set(["paid", "succeeded", "refunded", "disputed"]);

function ts(v: string | null | undefined): number {
  const t = v ? new Date(v).getTime() : NaN;
  return Number.isFinite(t) ? t : 0;
}

/**
 * Which payment record is THE commercial state of a listing when there are several?
 * Newest record whose status is money-final (paid / succeeded / refunded / disputed) wins, so a later
 * abandoned retry (pending / canceled) never hides an earlier paid record, and a later refund is not
 * hidden by an earlier paid one. With no money-final record, the newest record is used.
 */
export function pickRepresentativePayment(rows: readonly CommercialPaymentRow[]): CommercialPaymentRow | null {
  if (rows.length === 0) return null;
  const sorted = [...rows].sort((a, b) => ts(b.created_at) - ts(a.created_at));
  return sorted.find((r) => TERMINAL_MONEY.has(String(r.payment_status).trim().toLowerCase())) ?? sorted[0];
}

function subscriptionDisplayStatus(s: CommercialSubscriptionRow): string {
  return s.status === "active" && s.cancel_at_period_end ? "cancel_at_period_end" : s.status;
}

export type DeriveCommercialTruthInput = {
  listingId: string;
  payments: readonly CommercialPaymentRow[];
  entitlements: readonly CommercialEntitlementRow[];
  subscriptions: readonly CommercialSubscriptionRow[];
  unreadable: { payments: boolean; entitlements: boolean; subscriptions: boolean };
  /** The listing's own canonical publication truth (from its category table), or null when not known. */
  publication: PublicationTruth | null;
  webhook?: CommercialWebhookRow | null;
};

/** Pure: fold already-fetched rows for ONE listing into its commercial truth. */
export function deriveAdminListingCommercialTruth(input: DeriveCommercialTruthInput): AdminListingCommercialTruth {
  const unreadableTables: string[] = [];
  if (input.unreadable.payments) unreadableTables.push(COMMERCIAL_TRUTH_TABLES.payments);
  if (input.unreadable.entitlements) unreadableTables.push(COMMERCIAL_TRUTH_TABLES.entitlements);
  if (input.unreadable.subscriptions) unreadableTables.push(COMMERCIAL_TRUTH_TABLES.subscriptions);

  const base: AdminListingCommercialTruth = {
    listingId: input.listingId,
    state: "unknown",
    paymentRecordId: null,
    paymentStatus: null,
    paymentSource: null,
    packageKey: null,
    packageTier: null,
    billingMode: null,
    amountPaidCents: null,
    paidAt: null,
    entitlementId: null,
    entitlementStatus: null,
    entitlementEndsAt: null,
    subscriptionStatus: null,
    circuit: null,
    unreadable: unreadableTables,
    note: null,
  };

  const payment = input.unreadable.payments ? null : pickRepresentativePayment(input.payments);

  // Entitlement: the one the payment record points at wins; otherwise the newest listing-level one.
  let entitlement: CommercialEntitlementRow | null = null;
  let linkedEntitlementMissing = false;
  if (!input.unreadable.entitlements) {
    if (payment?.package_entitlement_id) {
      entitlement = input.entitlements.find((e) => e.id === payment.package_entitlement_id) ?? null;
      linkedEntitlementMissing = entitlement == null;
    }
    if (!entitlement && !payment?.package_entitlement_id) {
      const byListing = [...input.entitlements].sort((a, b) => ts(b.created_at) - ts(a.created_at));
      entitlement = byListing.find((e) => e.status === "active") ?? byListing[0] ?? null;
    }
  }

  // Subscription: the one matching the payment's stripe_subscription_id wins; otherwise newest.
  let subscription: CommercialSubscriptionRow | null = null;
  if (!input.unreadable.subscriptions) {
    const subs = [...input.subscriptions].sort((a, b) => ts(b.updated_at) - ts(a.updated_at));
    subscription =
      (payment?.stripe_subscription_id
        ? subs.find((s) => s.stripe_subscription_id === payment.stripe_subscription_id)
        : undefined) ??
      subs[0] ??
      null;
  }

  const withRelated = {
    ...base,
    entitlementId: entitlement?.id ?? null,
    entitlementStatus: entitlement ? entitlement.status : linkedEntitlementMissing ? "missing" : null,
    entitlementEndsAt: entitlement?.ends_at ?? null,
    subscriptionStatus: subscription ? subscriptionDisplayStatus(subscription) : null,
  };

  if (input.unreadable.payments) {
    return {
      ...withRelated,
      state: "unknown",
      note: "Payment records could not be read — no payment status is claimed for this listing.",
    };
  }

  if (!payment) {
    return {
      ...withRelated,
      state: "no_payment_record",
      note: unreadableTables.length ? `Also unreadable: ${unreadableTables.join(", ")}.` : null,
    };
  }

  const allReadable = !input.unreadable.entitlements && !input.unreadable.subscriptions;
  const paymentStatus = String(payment.payment_status ?? "").trim() || "unknown";
  const circuit: PaymentCircuit | null = allReadable
    ? derivePaymentCircuit({
        paymentStatus,
        source: payment.source ?? "unknown",
        hasCheckoutSession: Boolean(payment.stripe_checkout_session_id),
        hasListingId: true,
        billingMode: payment.billing_mode,
        packageEntitlementId: payment.package_entitlement_id,
        entitlementStatus: payment.package_entitlement_id
          ? entitlement
            ? entitlement.status
            : "missing"
          : null,
        subscriptionStatus: subscription ? subscriptionDisplayStatus(subscription) : null,
        listing: input.publication,
        webhook: input.webhook ?? null,
      })
    : null;

  return {
    ...withRelated,
    state: "known",
    paymentRecordId: payment.id,
    paymentStatus,
    paymentSource: payment.source,
    packageKey: payment.package_key,
    packageTier: payment.package_tier,
    billingMode: payment.billing_mode,
    amountPaidCents: payment.amount_paid_cents ?? payment.amount_total_cents ?? null,
    paidAt: payment.paid_at,
    circuit,
    note: allReadable ? null : `Circuit withheld — could not read: ${unreadableTables.join(", ")}.`,
  };
}

function chunk<T>(items: readonly T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

function num(v: unknown): number | null {
  return v != null && Number.isFinite(Number(v)) ? Number(v) : null;
}
function str(v: unknown): string | null {
  return v != null && String(v).trim() !== "" ? String(v) : null;
}

export type LoadAdminListingCommercialTruthInput = {
  /** Category slug (`rentas`, `autos`, …). Used only to classify the listing's own publication truth. */
  category: string;
  listingIds: readonly string[];
  /** Optional: the listing rows already fetched for the page, so the circuit can say if each is live. */
  listingRowsById?: Record<string, Record<string, unknown> | null | undefined>;
  supabase?: SupabaseClient;
  now?: Date;
};

/**
 * Batch-read commercial truth for the listings of ONE category. Never throws: every failure becomes
 * `state: "unknown"` (payment source) or a withheld circuit (entitlement / subscription source).
 */
export async function loadAdminListingCommercialTruth(
  input: LoadAdminListingCommercialTruthInput,
): Promise<AdminListingCommercialTruthMap> {
  const ids = [...new Set(input.listingIds.map((i) => String(i ?? "").trim()).filter(Boolean))];
  const out: AdminListingCommercialTruthMap = {};
  if (ids.length === 0) return out;

  const validIds = ids.filter((i) => UUID_RE.test(i));
  for (const id of ids) {
    if (!UUID_RE.test(id)) {
      out[id] = deriveAdminListingCommercialTruth({
        listingId: id,
        payments: [],
        entitlements: [],
        subscriptions: [],
        unreadable: { payments: true, entitlements: true, subscriptions: true },
        publication: null,
      });
    }
  }
  if (validIds.length === 0) return out;

  let supabase: SupabaseClient;
  try {
    supabase = input.supabase ?? getAdminSupabase();
  } catch {
    for (const id of validIds) {
      out[id] = deriveAdminListingCommercialTruth({
        listingId: id,
        payments: [],
        entitlements: [],
        subscriptions: [],
        unreadable: { payments: true, entitlements: true, subscriptions: true },
        publication: null,
      });
    }
    return out;
  }

  const paymentsByListing = new Map<string, CommercialPaymentRow[]>();
  const entitlementsByListing = new Map<string, CommercialEntitlementRow[]>();
  const subscriptionsByListing = new Map<string, CommercialSubscriptionRow[]>();
  const webhookByPaymentId = new Map<string, CommercialWebhookRow>();
  const unreadable = { payments: false, entitlements: false, subscriptions: false };

  for (const idChunk of chunk(validIds, COMMERCIAL_TRUTH_IDS_PER_QUERY)) {
    const [pay, ent, sub] = await Promise.all([
      supabase
        .from(COMMERCIAL_TRUTH_TABLES.payments)
        .select(
          "id, listing_id, package_key, package_tier, package_entitlement_id, payment_status, source, billing_mode, stripe_checkout_session_id, stripe_subscription_id, amount_paid_cents, amount_total_cents, paid_at, created_at",
        )
        .in("listing_id", idChunk)
        .order("created_at", { ascending: false })
        .then((r) => r, () => ({ data: null, error: { message: "query threw" } })),
      supabase
        .from(COMMERCIAL_TRUTH_TABLES.entitlements)
        .select("id, listing_id, status, package_tier, ends_at, revoked_at, created_at")
        .in("listing_id", idChunk)
        .then((r) => r, () => ({ data: null, error: { message: "query threw" } })),
      supabase
        .from(COMMERCIAL_TRUTH_TABLES.subscriptions)
        .select("listing_id, status, cancel_at_period_end, stripe_subscription_id, updated_at")
        .in("listing_id", idChunk)
        .then((r) => r, () => ({ data: null, error: { message: "query threw" } })),
    ]);

    if (pay.error) unreadable.payments = true;
    else {
      for (const raw of (pay.data ?? []) as unknown as Record<string, unknown>[]) {
        const lid = str(raw.listing_id);
        if (!lid) continue;
        const row: CommercialPaymentRow = {
          id: String(raw.id),
          listing_id: lid,
          package_key: str(raw.package_key),
          package_tier: str(raw.package_tier),
          package_entitlement_id: str(raw.package_entitlement_id),
          payment_status: String(raw.payment_status ?? ""),
          source: str(raw.source),
          billing_mode: str(raw.billing_mode),
          stripe_checkout_session_id: str(raw.stripe_checkout_session_id),
          stripe_subscription_id: str(raw.stripe_subscription_id),
          amount_paid_cents: num(raw.amount_paid_cents),
          amount_total_cents: num(raw.amount_total_cents),
          paid_at: str(raw.paid_at),
          created_at: str(raw.created_at),
        };
        const list = paymentsByListing.get(lid) ?? [];
        list.push(row);
        paymentsByListing.set(lid, list);
      }
    }

    if (ent.error) unreadable.entitlements = true;
    else {
      for (const raw of (ent.data ?? []) as unknown as Record<string, unknown>[]) {
        const lid = str(raw.listing_id);
        if (!lid) continue;
        const row: CommercialEntitlementRow = {
          id: String(raw.id),
          listing_id: lid,
          status: String(raw.status ?? ""),
          package_tier: str(raw.package_tier),
          ends_at: str(raw.ends_at),
          revoked_at: str(raw.revoked_at),
          created_at: str(raw.created_at),
        };
        const list = entitlementsByListing.get(lid) ?? [];
        list.push(row);
        entitlementsByListing.set(lid, list);
      }
    }

    if (sub.error) unreadable.subscriptions = true;
    else {
      for (const raw of (sub.data ?? []) as unknown as Record<string, unknown>[]) {
        const lid = str(raw.listing_id);
        if (!lid) continue;
        const row: CommercialSubscriptionRow = {
          listing_id: lid,
          status: String(raw.status ?? ""),
          cancel_at_period_end: Boolean(raw.cancel_at_period_end),
          stripe_subscription_id: str(raw.stripe_subscription_id),
          updated_at: str(raw.updated_at),
        };
        const list = subscriptionsByListing.get(lid) ?? [];
        list.push(row);
        subscriptionsByListing.set(lid, list);
      }
    }
  }

  // A payment record's linked entitlement may not carry the listing id — read those by id (≤100 per query).
  if (!unreadable.entitlements) {
    const knownEntIds = new Set([...entitlementsByListing.values()].flat().map((e) => e.id));
    const linkedMissing = [
      ...new Set(
        [...paymentsByListing.values()]
          .flat()
          .map((p) => p.package_entitlement_id)
          .filter((x): x is string => Boolean(x) && !knownEntIds.has(x as string)),
      ),
    ];
    for (const idChunk of chunk(linkedMissing, COMMERCIAL_TRUTH_IDS_PER_QUERY)) {
      try {
        const { data, error } = await supabase
          .from(COMMERCIAL_TRUTH_TABLES.entitlements)
          .select("id, listing_id, status, package_tier, ends_at, revoked_at, created_at")
          .in("id", idChunk);
        if (error) {
          unreadable.entitlements = true;
          break;
        }
        for (const raw of (data ?? []) as unknown as Record<string, unknown>[]) {
          const row: CommercialEntitlementRow = {
            id: String(raw.id),
            listing_id: str(raw.listing_id),
            status: String(raw.status ?? ""),
            package_tier: str(raw.package_tier),
            ends_at: str(raw.ends_at),
            revoked_at: str(raw.revoked_at),
            created_at: str(raw.created_at),
          };
          // Keyed by the payment's own listing so the derivation can find it by id.
          for (const [lid, pays] of paymentsByListing) {
            if (pays.some((p) => p.package_entitlement_id === row.id)) {
              const list = entitlementsByListing.get(lid) ?? [];
              if (!list.some((e) => e.id === row.id)) list.push(row);
              entitlementsByListing.set(lid, list);
            }
          }
        }
      } catch {
        unreadable.entitlements = true;
        break;
      }
    }
  }

  // Webhook ledger: only used to make the circuit's "fulfilment failed" diagnosis accurate. A failed
  // read simply means no webhook diagnosis is offered — it never changes payment/entitlement truth.
  if (!unreadable.payments) {
    const paymentIds = [...paymentsByListing.values()].flat().map((p) => p.id);
    for (const idChunk of chunk(paymentIds, COMMERCIAL_TRUTH_IDS_PER_QUERY)) {
      try {
        const { data } = await supabase
          .from("leonix_stripe_webhook_events")
          .select("payment_record_id, status, result_code, received_at")
          .in("payment_record_id", idChunk)
          .order("received_at", { ascending: false });
        for (const e of (data ?? []) as { payment_record_id: string; status: string; result_code: string | null; received_at: string | null }[]) {
          if (!webhookByPaymentId.has(e.payment_record_id)) {
            webhookByPaymentId.set(e.payment_record_id, { status: e.status, resultCode: e.result_code, receivedAt: e.received_at });
          }
        }
      } catch {
        /* ledger unreadable → no webhook diagnosis offered */
      }
    }
  }

  const source = publicationSourceForCategory(input.category);
  for (const id of validIds) {
    const payments = paymentsByListing.get(id) ?? [];
    const representative = pickRepresentativePayment(payments);
    let publication: PublicationTruth | null = null;
    const listingRow = input.listingRowsById?.[id];
    if (source && listingRow) {
      publication = classifyPublication(source, listingRow, {
        now: input.now,
        paymentCleared: representative ? CLEARED.has(String(representative.payment_status).trim().toLowerCase()) : undefined,
      });
    }
    out[id] = deriveAdminListingCommercialTruth({
      listingId: id,
      payments,
      entitlements: entitlementsByListing.get(id) ?? [],
      subscriptions: subscriptionsByListing.get(id) ?? [],
      unreadable,
      publication,
      webhook: representative ? webhookByPaymentId.get(representative.id) ?? null : null,
    });
  }
  return out;
}
