/**
 * Gate G.1 — global owner status / attention / lifecycle-action contract.
 *
 * Pure types only, additive to Gate B/D (types.ts, dashboardActionTypes.ts). Nothing here is
 * wired into any live dashboard, category adapter, or mutation API yet — that is deferred to a
 * later "adapter gate" per the Gate G.1 request. This module only describes, in types, a
 * normalized owner-facing status/attention/action vocabulary that every category (Business
 * Profile Family and Clasificados Family alike) can eventually be mapped into by its own
 * category adapter.
 *
 * Deliberately independent from dashboardActionTypes.ts's `DashboardAction`/`DashboardActionKind`
 * (Gate D): that contract only ever emits `actionKind: "navigate"` today and is live-wired into
 * three category dashboards — widening it here would risk the exact behavior change Gate G.1
 * forbids. `GlobalActionDescriptor` below is a superset vocabulary for a later gate to adopt.
 *
 * Global core boundary: no Supabase table names, no API routes, no category-specific payloads,
 * no Stripe details, no React state, no browser storage. Every field here is either a stable
 * string key, a primitive, or a plain data descriptor.
 */

import type { CanonicalCategoryKey, InventoryRole } from "./types";

/* ------------------------------------------------------------------------------------------ *
 * Owner-facing status
 * ------------------------------------------------------------------------------------------ */

export type OwnerFacingStatusKey =
  | "draft"
  | "incomplete"
  | "awaiting_payment"
  | "payment_issue"
  | "submitted"
  | "in_review"
  | "changes_requested"
  | "scheduled"
  | "live"
  | "paused"
  | "expiring_soon"
  | "expired"
  | "rejected"
  | "archived"
  | "discontinued"
  | "suspended"
  | "removed";

export type OwnerFacingStatusClassification = "recoverable" | "terminal";

export type OwnerFacingStatusDescriptor = {
  key: OwnerFacingStatusKey;
  labelEs: string;
  labelEn: string;
  descriptionEs?: string;
  descriptionEn?: string;
  /** Whether a listing in this status is visible on public surfaces. */
  publicVisibility: boolean;
  /** Whether the owner may edit listing content while in this status. */
  editable: boolean;
  attentionRequired: boolean;
  attentionSeverity: AttentionSeverity;
  suggestedPrimaryAction: GlobalActionKey | null;
  classification: OwnerFacingStatusClassification;
};

/* ------------------------------------------------------------------------------------------ *
 * Attention
 * ------------------------------------------------------------------------------------------ */

export type AttentionSeverity = "none" | "informational" | "action_required" | "urgent";

export type AttentionReason =
  | "complete_application"
  | "complete_payment"
  | "resolve_payment"
  | "correct_rejected_content"
  | "respond_to_changes_requested"
  | "listing_expiring"
  | "listing_expired"
  | "paid_module_expiring"
  | "entitlement_inactive"
  | "moderation_issue"
  | "listing_suspended"
  | "missing_required_setup";

export type AttentionState = {
  severity: AttentionSeverity;
  /** Deduplicated, order-stable list of every reason contributing to `severity`. Empty when
   * `severity === "none"`. */
  reasons: readonly AttentionReason[];
};

/* ------------------------------------------------------------------------------------------ *
 * Global action vocabulary
 * ------------------------------------------------------------------------------------------ */

export type GlobalNavigationActionKey =
  | "view_public"
  | "preview"
  | "edit"
  | "continue_application"
  | "analytics"
  | "leads"
  | "share"
  | "manage_coupons"
  | "manage_offers"
  | "manage_inventory"
  | "billing"
  | "support";

/** Superset of the Lifecycle Mutation Contract's minimum vocabulary — every key here is a real
 * lifecycle-kind action from the Gate G.1 action vocabulary, not only the six explicitly named
 * as the contract's floor (pause/resume/archive/discontinue/restore/resubmit). */
export type LifecycleMutationKey =
  | "publish"
  | "pause"
  | "resume"
  | "renew"
  | "republish"
  | "extend"
  | "archive"
  | "discontinue"
  | "restore"
  | "resolve_payment"
  | "resubmit";

export type GlobalProductActionKey = "purchase_addon" | "upgrade" | "manage_addon";

export type GlobalActionKey = GlobalNavigationActionKey | LifecycleMutationKey | GlobalProductActionKey;

export type GlobalActionKind = "navigate" | "lifecycle" | "checkout" | "client_action";

export type GlobalActionPlacement = "primary" | "secondary" | "overflow";

export type GlobalActionDescriptor = {
  key: GlobalActionKey;
  labelEs: string;
  labelEn: string;
  kind: GlobalActionKind;
  /** Only ever set for `kind: "navigate"`; never fabricated — the resolver only emits a
   * navigate action when a real href was supplied by the caller. */
  href?: string | null;
  /** Only ever set for `kind: "lifecycle"`. */
  mutationKey?: LifecycleMutationKey | null;
  /** Only ever set for `kind: "checkout"`. */
  packageKey?: string | null;
  enabled: boolean;
  disabledReason?: string | null;
  requiresConfirmation: boolean;
  destructive: boolean;
  placement: GlobalActionPlacement;
};

/* ------------------------------------------------------------------------------------------ *
 * Lifecycle mutation contract
 * ------------------------------------------------------------------------------------------ */

export type LifecycleMutationDescriptor = {
  key: LifecycleMutationKey;
  requiresConfirmation: boolean;
  /** `false` for actions that remove the listing from active management flow without a direct
   * undo path represented in this contract (e.g. `archive`, `discontinue`). */
  reversible: boolean;
  eligible: boolean;
  disabledReasonEs: string | null;
  disabledReasonEn: string | null;
};

/* ------------------------------------------------------------------------------------------ *
 * Eligibility input
 * ------------------------------------------------------------------------------------------ */

export type PaidModuleLifecycleState = "active" | "inactive" | "expiring" | "expired";

export type OwnerLifecycleCapabilityFlags = {
  canPublish?: boolean;
  canPause?: boolean;
  canResume?: boolean;
  canRenew?: boolean;
  canRepublish?: boolean;
  canExtend?: boolean;
  canArchive?: boolean;
  canDiscontinue?: boolean;
  canRestore?: boolean;
  canResolvePayment?: boolean;
  canResubmit?: boolean;
  canPurchaseAddon?: boolean;
  canUpgrade?: boolean;
  canManageAddon?: boolean;
};

/**
 * One normalized input shape, built by a (future) family/category adapter — never by the global
 * core itself. `normalizedStatus` is the adapter's own mapping of its internal DB status into
 * this contract's vocabulary; the resolvers below only refine/derive from it, they never invent
 * a status the adapter didn't already normalize into.
 */
export type OwnerLifecycleEligibilityInput = {
  /** Real DB primary key (uuid) — mirrors `ListingIdentity.sourceId`. Null/empty fails every
   * privileged resolution closed. */
  canonicalListingId: string | null;
  categoryKey: CanonicalCategoryKey | string;
  /** Server-verified ownership, established by the caller — never checked here. */
  ownerVerified: boolean;
  normalizedStatus: OwnerFacingStatusKey;
  /** Category's own raw internal status, carried through for adapter/debugging use only —
   * never read by the pure resolvers. */
  internalStatus?: string | null;
  publicVisibility: boolean;
  editable: boolean;
  paidOrFree: "paid" | "free";
  /** ISO 8601 timestamp, or null/undefined when the listing has no expiration. */
  expirationDate?: string | null;
  paymentIssue: boolean;
  moderationIssue: boolean;
  role?: InventoryRole | null;
  capabilities: OwnerLifecycleCapabilityFlags;
  /** Active paid-module states keyed by the module's own package/add-on key (e.g.
   * `"br_inventory_pack_monthly"`) — never a category-specific payload beyond the key string. */
  paidModuleStates?: Readonly<Record<string, PaidModuleLifecycleState>>;
  /** Real hrefs already resolved by the caller (e.g. via the Gate B category route registry).
   * A navigate-kind action is only ever emitted when its key has a non-empty entry here. */
  navigationHrefs?: Partial<Record<GlobalNavigationActionKey, string | null>>;
  /** Explicit "now" for all time-relative derivations (e.g. expiring-soon windows). Required —
   * the pure resolvers never call `Date.now()`/`new Date()` themselves. */
  now: Date;
};
