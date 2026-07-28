/**
 * Gate G.1 — pure global owner status / attention / lifecycle-action resolution logic.
 *
 * No I/O, no Supabase, no fetch, no React, no browser storage, no current-time lookup (callers
 * must pass `now` on the eligibility input). Every function here is deterministic: same input,
 * same output, always.
 *
 * SCOPE BOUNDARY (deliberate, mirrors dashboardActionResolver.ts's own boundary comment): this
 * resolver does not replace or re-implement Gate D's `resolveDashboardActions`. It only resolves
 * the *new* territory Gate D explicitly left out — lifecycle mutations and checkout/product
 * actions — plus normalized status/attention. Navigate-kind actions are supported here too, but
 * strictly pass-through: this resolver never fabricates a route, it only echoes back an href the
 * caller already resolved (see `OwnerLifecycleEligibilityInput.navigationHrefs`). No category
 * mutation, checkout call, or database write is triggered by anything in this file — every
 * lifecycle/checkout action produced here is a plain descriptor, never an executable handler.
 */

import type {
  AttentionReason,
  AttentionSeverity,
  AttentionState,
  GlobalActionDescriptor,
  GlobalActionKind,
  GlobalActionPlacement,
  GlobalNavigationActionKey,
  LifecycleMutationDescriptor,
  LifecycleMutationKey,
  OwnerFacingStatusDescriptor,
  OwnerFacingStatusKey,
  OwnerLifecycleCapabilityFlags,
  OwnerLifecycleEligibilityInput,
} from "./ownerLifecycleTypes";

/* ------------------------------------------------------------------------------------------ *
 * Owner-facing status table
 * ------------------------------------------------------------------------------------------ */

const OWNER_FACING_STATUS_DESCRIPTORS: Readonly<Record<OwnerFacingStatusKey, OwnerFacingStatusDescriptor>> = {
  draft: {
    key: "draft",
    labelEs: "Borrador",
    labelEn: "Draft",
    publicVisibility: false,
    editable: true,
    attentionRequired: true,
    attentionSeverity: "action_required",
    suggestedPrimaryAction: "continue_application",
    classification: "recoverable",
  },
  incomplete: {
    key: "incomplete",
    labelEs: "Incompleto",
    labelEn: "Incomplete",
    publicVisibility: false,
    editable: true,
    attentionRequired: true,
    attentionSeverity: "action_required",
    suggestedPrimaryAction: "continue_application",
    classification: "recoverable",
  },
  awaiting_payment: {
    key: "awaiting_payment",
    labelEs: "Pendiente de pago",
    labelEn: "Awaiting payment",
    publicVisibility: false,
    editable: true,
    attentionRequired: true,
    attentionSeverity: "action_required",
    suggestedPrimaryAction: "resolve_payment",
    classification: "recoverable",
  },
  payment_issue: {
    key: "payment_issue",
    labelEs: "Problema de pago",
    labelEn: "Payment issue",
    publicVisibility: false,
    editable: true,
    attentionRequired: true,
    attentionSeverity: "urgent",
    suggestedPrimaryAction: "resolve_payment",
    classification: "recoverable",
  },
  submitted: {
    key: "submitted",
    labelEs: "Enviado",
    labelEn: "Submitted",
    publicVisibility: false,
    editable: false,
    attentionRequired: false,
    attentionSeverity: "none",
    suggestedPrimaryAction: null,
    classification: "recoverable",
  },
  in_review: {
    key: "in_review",
    labelEs: "En revisión",
    labelEn: "In review",
    publicVisibility: false,
    editable: false,
    attentionRequired: false,
    attentionSeverity: "informational",
    suggestedPrimaryAction: null,
    classification: "recoverable",
  },
  changes_requested: {
    key: "changes_requested",
    labelEs: "Cambios solicitados",
    labelEn: "Changes requested",
    publicVisibility: false,
    editable: true,
    attentionRequired: true,
    attentionSeverity: "action_required",
    suggestedPrimaryAction: "resubmit",
    classification: "recoverable",
  },
  scheduled: {
    key: "scheduled",
    labelEs: "Programado",
    labelEn: "Scheduled",
    publicVisibility: false,
    editable: true,
    attentionRequired: false,
    attentionSeverity: "none",
    suggestedPrimaryAction: null,
    classification: "recoverable",
  },
  live: {
    key: "live",
    labelEs: "Publicado",
    labelEn: "Live",
    publicVisibility: true,
    editable: true,
    attentionRequired: false,
    attentionSeverity: "none",
    suggestedPrimaryAction: null,
    classification: "recoverable",
  },
  paused: {
    key: "paused",
    labelEs: "Pausado",
    labelEn: "Paused",
    publicVisibility: false,
    editable: true,
    attentionRequired: false,
    attentionSeverity: "informational",
    suggestedPrimaryAction: "resume",
    classification: "recoverable",
  },
  expiring_soon: {
    key: "expiring_soon",
    labelEs: "Por vencer",
    labelEn: "Expiring soon",
    publicVisibility: true,
    editable: true,
    attentionRequired: true,
    attentionSeverity: "informational",
    suggestedPrimaryAction: "renew",
    classification: "recoverable",
  },
  expired: {
    key: "expired",
    labelEs: "Vencido",
    labelEn: "Expired",
    publicVisibility: false,
    editable: true,
    attentionRequired: true,
    attentionSeverity: "urgent",
    suggestedPrimaryAction: "renew",
    classification: "recoverable",
  },
  rejected: {
    key: "rejected",
    labelEs: "Rechazado",
    labelEn: "Rejected",
    publicVisibility: false,
    editable: true,
    attentionRequired: true,
    attentionSeverity: "action_required",
    suggestedPrimaryAction: "resubmit",
    classification: "recoverable",
  },
  archived: {
    key: "archived",
    labelEs: "Archivado",
    labelEn: "Archived",
    publicVisibility: false,
    editable: false,
    attentionRequired: false,
    attentionSeverity: "none",
    suggestedPrimaryAction: "restore",
    classification: "recoverable",
  },
  discontinued: {
    key: "discontinued",
    labelEs: "Descontinuado",
    labelEn: "Discontinued",
    publicVisibility: false,
    editable: false,
    attentionRequired: false,
    attentionSeverity: "none",
    suggestedPrimaryAction: null,
    classification: "terminal",
  },
  suspended: {
    key: "suspended",
    labelEs: "Suspendido",
    labelEn: "Suspended",
    publicVisibility: false,
    editable: false,
    attentionRequired: true,
    attentionSeverity: "urgent",
    suggestedPrimaryAction: "support",
    classification: "recoverable",
  },
  removed: {
    key: "removed",
    labelEs: "Eliminado",
    labelEn: "Removed",
    publicVisibility: false,
    editable: false,
    attentionRequired: false,
    attentionSeverity: "none",
    suggestedPrimaryAction: null,
    classification: "terminal",
  },
};

/**
 * Resolves the full status descriptor for an already-normalized adapter status key. Falls back
 * to `"draft"` (the least-privileged, non-destructive default) for any unrecognized key rather
 * than throwing — a global core function must never crash a dashboard render on a bad input.
 */
export function resolveOwnerFacingStatus(input: OwnerLifecycleEligibilityInput): OwnerFacingStatusDescriptor {
  return OWNER_FACING_STATUS_DESCRIPTORS[input.normalizedStatus] ?? OWNER_FACING_STATUS_DESCRIPTORS.draft;
}

/* ------------------------------------------------------------------------------------------ *
 * Attention resolution
 * ------------------------------------------------------------------------------------------ */

const EXPIRING_SOON_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

function isWithinExpiringWindow(expirationDate: string | null | undefined, now: Date): boolean {
  if (!expirationDate) return false;
  const ms = Date.parse(expirationDate);
  if (!Number.isFinite(ms)) return false;
  const diffMs = ms - now.getTime();
  return diffMs > 0 && diffMs <= EXPIRING_SOON_WINDOW_MS;
}

const URGENT_REASONS: ReadonlySet<AttentionReason> = new Set(["listing_suspended", "listing_expired", "resolve_payment"]);
const ACTION_REQUIRED_REASONS: ReadonlySet<AttentionReason> = new Set([
  "complete_application",
  "complete_payment",
  "correct_rejected_content",
  "respond_to_changes_requested",
  "entitlement_inactive",
  "moderation_issue",
  "missing_required_setup",
]);
const INFORMATIONAL_REASONS: ReadonlySet<AttentionReason> = new Set(["listing_expiring", "paid_module_expiring"]);

function severityFromReasons(reasons: readonly AttentionReason[]): AttentionSeverity {
  if (reasons.length === 0) return "none";
  if (reasons.some((r) => URGENT_REASONS.has(r))) return "urgent";
  if (reasons.some((r) => ACTION_REQUIRED_REASONS.has(r))) return "action_required";
  if (reasons.some((r) => INFORMATIONAL_REASONS.has(r))) return "informational";
  return "informational";
}

/**
 * Resolves the current attention state from the full eligibility input. Deliberately dynamic
 * (unlike the static per-status table above) — payment/moderation/expiration/entitlement signals
 * can raise attention independently of what `normalizedStatus` alone would suggest.
 */
export function resolveAttentionState(input: OwnerLifecycleEligibilityInput): AttentionState {
  const reasons: AttentionReason[] = [];

  if (input.normalizedStatus === "draft" || input.normalizedStatus === "incomplete") {
    reasons.push("complete_application");
  }
  if (input.normalizedStatus === "awaiting_payment") {
    reasons.push("complete_payment");
  }
  if (input.paymentIssue) {
    reasons.push("resolve_payment");
  }
  if (input.normalizedStatus === "rejected") {
    reasons.push("correct_rejected_content");
  }
  if (input.normalizedStatus === "changes_requested") {
    reasons.push("respond_to_changes_requested");
  }
  if (input.normalizedStatus === "expiring_soon" || isWithinExpiringWindow(input.expirationDate, input.now)) {
    reasons.push("listing_expiring");
  }
  if (input.normalizedStatus === "expired") {
    reasons.push("listing_expired");
  }
  if (input.moderationIssue) {
    reasons.push("moderation_issue");
  }
  if (input.normalizedStatus === "suspended") {
    reasons.push("listing_suspended");
  }
  if (input.paidModuleStates) {
    const states = Object.values(input.paidModuleStates);
    if (states.includes("expiring")) reasons.push("paid_module_expiring");
    if (states.includes("expired") || states.includes("inactive")) reasons.push("entitlement_inactive");
  }
  if (!input.canonicalListingId || !input.ownerVerified) {
    reasons.push("missing_required_setup");
  }

  const uniqueReasons = [...new Set(reasons)];
  return { severity: severityFromReasons(uniqueReasons), reasons: uniqueReasons };
}

/* ------------------------------------------------------------------------------------------ *
 * Global action resolution
 * ------------------------------------------------------------------------------------------ */

const NAVIGATION_ACTION_KEYS: readonly GlobalNavigationActionKey[] = [
  "view_public",
  "preview",
  "edit",
  "continue_application",
  "analytics",
  "leads",
  "share",
  "manage_coupons",
  "manage_offers",
  "manage_inventory",
  "billing",
  "support",
];

const CONTINUE_APPLICATION_STATUSES: ReadonlySet<OwnerFacingStatusKey> = new Set([
  "draft",
  "incomplete",
  "awaiting_payment",
  "payment_issue",
]);

const LIFECYCLE_ACTION_KEYS: readonly LifecycleMutationKey[] = [
  "publish",
  "pause",
  "resume",
  "renew",
  "republish",
  "extend",
  "archive",
  "discontinue",
  "restore",
  "resolve_payment",
  "resubmit",
];

/** Which normalized statuses make each lifecycle action attemptable at all. A category's own
 * capability flag (see `OwnerLifecycleCapabilityFlags`) further narrows this — the two must both
 * agree before an action is ever produced; neither alone is sufficient. */
const STATUS_ALLOWS_LIFECYCLE_ACTION: Readonly<Record<LifecycleMutationKey, ReadonlySet<OwnerFacingStatusKey>>> = {
  publish: new Set(["draft", "incomplete", "changes_requested"]),
  pause: new Set(["live", "expiring_soon"]),
  resume: new Set(["paused"]),
  renew: new Set(["expiring_soon", "expired"]),
  republish: new Set(["archived", "expired", "removed"]),
  extend: new Set(["live", "expiring_soon"]),
  archive: new Set(["live", "paused", "expiring_soon", "expired", "suspended", "rejected"]),
  discontinue: new Set(["live", "paused", "expiring_soon"]),
  restore: new Set(["archived"]),
  resolve_payment: new Set(["awaiting_payment", "payment_issue"]),
  resubmit: new Set(["rejected", "changes_requested"]),
};

const DESTRUCTIVE_LIFECYCLE_ACTIONS: ReadonlySet<LifecycleMutationKey> = new Set(["archive", "discontinue"]);
const CONFIRMATION_REQUIRED_LIFECYCLE_ACTIONS: ReadonlySet<LifecycleMutationKey> = new Set([
  "archive",
  "discontinue",
  "restore",
  "resubmit",
]);

function capabilityFlagFor(key: LifecycleMutationKey): keyof OwnerLifecycleCapabilityFlags {
  switch (key) {
    case "publish":
      return "canPublish";
    case "pause":
      return "canPause";
    case "resume":
      return "canResume";
    case "renew":
      return "canRenew";
    case "republish":
      return "canRepublish";
    case "extend":
      return "canExtend";
    case "archive":
      return "canArchive";
    case "discontinue":
      return "canDiscontinue";
    case "restore":
      return "canRestore";
    case "resolve_payment":
      return "canResolvePayment";
    case "resubmit":
      return "canResubmit";
  }
}

const ACTION_LABELS: Readonly<Record<GlobalActionDescriptor["key"], { es: string; en: string }>> = {
  view_public: { es: "Ver público", en: "View public" },
  preview: { es: "Vista previa", en: "Preview" },
  edit: { es: "Editar anuncio", en: "Edit listing" },
  continue_application: { es: "Continuar solicitud", en: "Continue application" },
  analytics: { es: "Analíticas", en: "Analytics" },
  leads: { es: "Contactos", en: "Leads" },
  share: { es: "Compartir", en: "Share" },
  manage_coupons: { es: "Editar cupones", en: "Manage coupons" },
  manage_offers: { es: "Editar ofertas", en: "Manage offers" },
  manage_inventory: { es: "Administrar inventario", en: "Manage inventory" },
  billing: { es: "Facturación", en: "Billing" },
  support: { es: "Soporte", en: "Support" },
  publish: { es: "Publicar", en: "Publish" },
  pause: { es: "Pausar", en: "Pause" },
  resume: { es: "Reanudar", en: "Resume" },
  renew: { es: "Renovar", en: "Renew" },
  republish: { es: "Volver a publicar", en: "Republish" },
  extend: { es: "Extender", en: "Extend" },
  archive: { es: "Archivar", en: "Archive" },
  discontinue: { es: "Descontinuar", en: "Discontinue" },
  restore: { es: "Restaurar", en: "Restore" },
  resolve_payment: { es: "Resolver pago", en: "Resolve payment" },
  resubmit: { es: "Reenviar", en: "Resubmit" },
  purchase_addon: { es: "Comprar complemento", en: "Purchase add-on" },
  upgrade: { es: "Mejorar plan", en: "Upgrade" },
  manage_addon: { es: "Administrar complemento", en: "Manage add-on" },
};

function navPlacement(key: GlobalNavigationActionKey): GlobalActionPlacement {
  if (key === "edit" || key === "continue_application") return "primary";
  if (key === "view_public" || key === "preview" || key === "analytics" || key === "leads") return "secondary";
  return "overflow";
}

function lifecyclePlacement(key: LifecycleMutationKey): GlobalActionPlacement {
  if (key === "resolve_payment" || key === "resubmit" || key === "renew" || key === "publish") return "primary";
  if (key === "pause" || key === "resume" || key === "archive" || key === "restore" || key === "extend" || key === "republish") {
    return "secondary";
  }
  return "overflow";
}

function buildDescriptor(
  key: GlobalActionDescriptor["key"],
  kind: GlobalActionKind,
  extra: {
    href?: string | null;
    mutationKey?: LifecycleMutationKey | null;
    packageKey?: string | null;
    placement: GlobalActionPlacement;
  },
): GlobalActionDescriptor {
  const labels = ACTION_LABELS[key];
  const destructive = extra.mutationKey ? DESTRUCTIVE_LIFECYCLE_ACTIONS.has(extra.mutationKey) : false;
  const requiresConfirmation = extra.mutationKey
    ? CONFIRMATION_REQUIRED_LIFECYCLE_ACTIONS.has(extra.mutationKey)
    : false;
  return {
    key,
    labelEs: labels.es,
    labelEn: labels.en,
    kind,
    href: extra.href ?? null,
    mutationKey: extra.mutationKey ?? null,
    packageKey: extra.packageKey ?? null,
    enabled: true,
    disabledReason: null,
    requiresConfirmation,
    destructive,
    placement: extra.placement,
  };
}

/**
 * Resolves every currently-eligible global action for one listing. Returns an empty array
 * (never a partial/fake action) when ownership isn't verified or the canonical listing id is
 * missing — the resolver's only hard rejection, mirroring `resolveDashboardActions`'s own
 * `ownerVerified`/`isCanonicalUuid` gate. Every other omission is per-action: an action is
 * simply never pushed when its status/capability preconditions aren't both met, or (for
 * navigate-kind actions) when the caller supplied no real href for it.
 */
export function resolveEligibleGlobalActions(input: OwnerLifecycleEligibilityInput): GlobalActionDescriptor[] {
  if (!input.ownerVerified || !input.canonicalListingId) return [];

  const status = resolveOwnerFacingStatus(input);
  const actions: GlobalActionDescriptor[] = [];

  for (const key of NAVIGATION_ACTION_KEYS) {
    const href = input.navigationHrefs?.[key]?.trim();
    if (!href) continue;
    if (key === "edit" && !status.editable) continue;
    if (key === "view_public" && !status.publicVisibility) continue;
    if (key === "continue_application" && !CONTINUE_APPLICATION_STATUSES.has(input.normalizedStatus)) continue;
    actions.push(buildDescriptor(key, "navigate", { href, placement: navPlacement(key) }));
  }

  for (const key of LIFECYCLE_ACTION_KEYS) {
    if (!input.capabilities[capabilityFlagFor(key)]) continue;
    if (!STATUS_ALLOWS_LIFECYCLE_ACTION[key].has(input.normalizedStatus)) continue;
    actions.push(buildDescriptor(key, "lifecycle", { mutationKey: key, placement: lifecyclePlacement(key) }));
  }

  if (input.capabilities.canPurchaseAddon) {
    actions.push(buildDescriptor("purchase_addon", "checkout", { placement: "overflow" }));
  }
  if (input.capabilities.canUpgrade) {
    actions.push(buildDescriptor("upgrade", "checkout", { placement: "overflow" }));
  }
  if (input.capabilities.canManageAddon) {
    actions.push(buildDescriptor("manage_addon", "client_action", { placement: "secondary" }));
  }

  return actions;
}

/* ------------------------------------------------------------------------------------------ *
 * Lifecycle mutation contract
 * ------------------------------------------------------------------------------------------ */

function disabledReason(lang: "es" | "en", capabilityGranted: boolean, statusAllows: boolean): string | null {
  if (capabilityGranted && statusAllows) return null;
  if (!capabilityGranted) {
    return lang === "es"
      ? "Esta acción no está disponible para esta categoría."
      : "This action is not available for this category.";
  }
  return lang === "es"
    ? "Esta acción no está disponible en el estado actual."
    : "This action is not available in the current status.";
}

/**
 * Enumerates every lifecycle mutation key (not just the eligible ones — unlike
 * `resolveEligibleGlobalActions`, this is meant for a later adapter to introspect *why* a
 * mutation is currently blocked, not to render a ready-to-click action list) with its
 * confirmation/reversibility/eligibility. Fails closed (every mutation `eligible: false`) when
 * ownership isn't verified or the canonical listing id is missing.
 */
export function resolveLifecycleMutationDescriptors(
  input: OwnerLifecycleEligibilityInput,
): LifecycleMutationDescriptor[] {
  const ownerOk = input.ownerVerified && Boolean(input.canonicalListingId);
  return LIFECYCLE_ACTION_KEYS.map((key) => {
    const capabilityGranted = ownerOk && Boolean(input.capabilities[capabilityFlagFor(key)]);
    const statusAllows = ownerOk && STATUS_ALLOWS_LIFECYCLE_ACTION[key].has(input.normalizedStatus);
    const eligible = capabilityGranted && statusAllows;
    return {
      key,
      requiresConfirmation: CONFIRMATION_REQUIRED_LIFECYCLE_ACTIONS.has(key),
      reversible: !DESTRUCTIVE_LIFECYCLE_ACTIONS.has(key),
      eligible,
      disabledReasonEs: eligible ? null : disabledReason("es", capabilityGranted, statusAllows),
      disabledReasonEn: eligible ? null : disabledReason("en", capabilityGranted, statusAllows),
    };
  });
}
