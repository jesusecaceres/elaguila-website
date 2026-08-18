import { getOfertaLocalCommercialProductForOfferType } from "./ofertasLocalesCommercial";
import type { OfertaLocalPublishStatus } from "./ofertasLocalesTypes";

export type OfertaLocalOperationalTone = "neutral" | "info" | "warning" | "success" | "danger";

export type OfertaLocalOwnerOperationalStatusKey =
  | "draft"
  | "source_required"
  | "scan_waiting"
  | "scan_in_progress"
  | "scan_needs_attention"
  | "review_required"
  | "ready_for_preview"
  | "payment_required"
  | "payment_processing"
  | "ready_to_submit"
  | "submitted_for_review"
  | "changes_requested"
  | "resubmitted"
  | "approved_activation_pending"
  | "published"
  | "expiring_soon"
  | "expired"
  | "renewal_available"
  | "renewal_awaiting_approval"
  | "renewal_scheduled"
  | "archived"
  | "recovery_required";

export type OfertaLocalAdminOperationalStatusKey =
  | "incomplete_draft"
  | "commercially_ineligible"
  | "source_missing"
  | "scan_unresolved"
  | "review_unresolved"
  | "ready_for_review"
  | "submitted"
  | "resubmitted"
  | "changes_requested"
  | "approval_blocked"
  | "approval_ready"
  | "activation_incomplete"
  | "active"
  | "expiring"
  | "expired"
  | "renewal_review"
  | "renewal_scheduled"
  | "operational_recovery"
  | "archived";

export type OfertaLocalOperationalStatus = {
  ownerKey: OfertaLocalOwnerOperationalStatusKey;
  adminKey: OfertaLocalAdminOperationalStatusKey;
  labelEs: string;
  labelEn: string;
  adminLabelEs: string;
  adminLabelEn: string;
  tone: OfertaLocalOperationalTone;
  explanationEs: string;
  explanationEn: string;
  ownerNextActionEs: string;
  ownerNextActionEn: string;
  adminNextActionEs: string;
  adminNextActionEn: string;
  blockingReasons: string[];
  publicLinkAllowed: boolean;
  editAllowed: boolean;
  sourceReplacementAllowed: boolean;
  scanRetryAllowed: boolean;
  submissionAllowed: boolean;
  adminApprovalAllowed: boolean;
  renewalAllowed: boolean;
  archiveAllowed: boolean;
};

export type OfertaLocalOperationalStatusInput = {
  status: OfertaLocalPublishStatus;
  offerType: string | null;
  leonixAdId?: string | null;
  commercialProductKey?: string | null;
  commercialAmountCents?: number | null;
  commercialAiIncluded?: boolean | null;
  paymentStatus?: string | null;
  entitlementStatus?: string | null;
  paymentRecordId?: string | null;
  packageEntitlementId?: string | null;
  commercialEligibilitySource?: string | null;
  commercialDiscrepancyWarning?: string | null;
  activeSourceAssetId?: string | null;
  publicSourceAssetId?: string | null;
  assetLifecycleStatus?: string | null;
  assetReplacementRequiredReview?: boolean | null;
  assetCount?: number | null;
  aiScanStatus?: string | null;
  aiLastScanJobId?: string | null;
  lastScanError?: string | null;
  wantsAiSearchableSpecials?: boolean | null;
  rejectionNote?: string | null;
  publicTermStatus?: "not_started" | "active" | "expired" | "incomplete" | null;
  publicTermDaysRemaining?: number | null;
  renewalState?: string | null;
};

const LEONIX_ID_RE = /^LNX-[A-Z0-9]{8}$/;
const SUBMITTED_STATUSES = new Set<OfertaLocalPublishStatus>(["submitted", "pending_review"]);
const EDITABLE_STATUSES = new Set<OfertaLocalPublishStatus>(["draft", "submitted", "pending_review", "rejected"]);

function hasText(value: string | null | undefined): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

function isPaymentProcessing(status: string | null | undefined): boolean {
  return ["checkout_pending", "pending", "payment_pending", "processing"].includes(String(status ?? "").toLowerCase());
}

function deriveProductBlocker(input: OfertaLocalOperationalStatusInput): string | null {
  const expected = getOfertaLocalCommercialProductForOfferType(input.offerType);
  if (!expected) return "unsupported_product_lane";
  if (input.commercialProductKey && input.commercialProductKey !== expected.packageKey) return "product_key_mismatch";
  if (input.commercialAmountCents != null && input.commercialAmountCents !== expected.amountCents) return "product_price_mismatch";
  if (input.commercialAiIncluded === false) return "ai_entitlement_not_marked_included";
  if (input.commercialDiscrepancyWarning) return "commercial_discrepancy";
  return null;
}

function labels(params: {
  ownerKey: OfertaLocalOwnerOperationalStatusKey;
  adminKey: OfertaLocalAdminOperationalStatusKey;
}): Pick<
  OfertaLocalOperationalStatus,
  "labelEs" | "labelEn" | "adminLabelEs" | "adminLabelEn" | "explanationEs" | "explanationEn" | "ownerNextActionEs" | "ownerNextActionEn" | "adminNextActionEs" | "adminNextActionEn"
> {
  const owner: Record<OfertaLocalOwnerOperationalStatusKey, [string, string, string, string]> = {
    draft: ["Borrador", "Draft", "Completa la solicitud antes de enviarla.", "Finish the application before submitting."],
    source_required: ["Fuente requerida", "Source required", "Sube el volante o cupón antes de continuar.", "Upload the flyer or coupon before continuing."],
    scan_waiting: ["Escaneo en espera", "Scan waiting", "La fuente existe y el escaneo todavía no empieza.", "The source exists and the scan has not started yet."],
    scan_in_progress: ["Escaneo en progreso", "Scan in progress", "La IA está procesando la fuente.", "AI is processing the source."],
    scan_needs_attention: ["Escaneo requiere atención", "Scan needs attention", "El escaneo tiene fallas o páginas pendientes.", "The scan has failures or pending pages."],
    review_required: ["Revisión requerida", "Review required", "Revisa los productos o cupones sugeridos.", "Review the suggested products or coupons."],
    ready_for_preview: ["Vista previa lista", "Ready for Preview", "Puedes revisar cómo se verá antes de enviar.", "You can review how it will look before submitting."],
    payment_required: ["Pago requerido", "Payment required", "El paquete comercial debe estar autorizado antes de enviar.", "The commercial package must be authorized before submitting."],
    payment_processing: ["Pago en proceso", "Payment processing", "Espera la confirmación de pago o entitlement.", "Wait for payment or entitlement confirmation."],
    ready_to_submit: ["Lista para enviar", "Ready to submit", "La solicitud está lista para revisión de Leonix.", "The listing is ready for Leonix review."],
    submitted_for_review: ["En revisión", "Submitted for review", "Leonix debe revisar antes de publicar.", "Leonix must review before publication."],
    changes_requested: ["Cambios solicitados", "Changes requested", "Corrige la solicitud y reenvía el mismo anuncio.", "Correct and resubmit the same listing."],
    resubmitted: ["Reenviada", "Resubmitted", "La corrección fue reenviada para revisión.", "The correction was resubmitted for review."],
    approved_activation_pending: ["Aprobada, activación pendiente", "Approved, activation pending", "Aprobada pero el término público no está activo.", "Approved but the public term is not active."],
    published: ["Publicada", "Published", "La oferta está dentro de su término público.", "The listing is inside its public term."],
    expiring_soon: ["Por expirar", "Expiring soon", "La oferta está por terminar.", "The listing is nearing expiration."],
    expired: ["Expirada", "Expired", "La oferta ya no debe aparecer públicamente.", "The listing should no longer appear publicly."],
    renewal_available: ["Renovación disponible", "Renewal available", "Puedes renovar manteniendo el mismo ID Leonix.", "You can renew while keeping the same Leonix ID."],
    renewal_awaiting_approval: ["Renovación en revisión", "Renewal awaiting approval", "La renovación espera aprobación.", "The renewal is awaiting approval."],
    renewal_scheduled: ["Renovación programada", "Renewal scheduled", "La renovación está aprobada para activación futura.", "The renewal is approved for future activation."],
    archived: ["Archivada", "Archived", "Esta oferta está archivada.", "This listing is archived."],
    recovery_required: ["Recuperación requerida", "Recovery required", "Leonix debe revisar una operación atascada.", "Leonix must inspect a stuck operation."],
  };
  const admin: Record<OfertaLocalAdminOperationalStatusKey, [string, string, string, string]> = {
    incomplete_draft: ["Borrador incompleto", "Incomplete draft", "Esperar o guiar al dueño.", "Wait or guide the owner."],
    commercially_ineligible: ["Comercialmente bloqueada", "Commercially ineligible", "Verificar pago, entitlement o cortesía.", "Verify payment, entitlement, or courtesy."],
    source_missing: ["Falta fuente", "Source missing", "Pedir fuente al dueño.", "Request source from owner."],
    scan_unresolved: ["Escaneo sin resolver", "Scan unresolved", "Inspeccionar job, páginas fallidas y retry.", "Inspect job, failed pages, and retry."],
    review_unresolved: ["Revisión sin resolver", "Review unresolved", "Completar revisión de ítems.", "Complete item review."],
    ready_for_review: ["Lista para revisión", "Ready for review", "Inspeccionar y moderar.", "Inspect and moderate."],
    submitted: ["Enviada", "Submitted", "Inspeccionar aprobación o cambios.", "Inspect approval or changes."],
    resubmitted: ["Reenviada", "Resubmitted", "Revisar correcciones.", "Review corrections."],
    changes_requested: ["Cambios solicitados", "Changes requested", "Esperar corrección del dueño.", "Wait for owner correction."],
    approval_blocked: ["Aprobación bloqueada", "Approval blocked", "Resolver blockers antes de aprobar.", "Resolve blockers before approval."],
    approval_ready: ["Aprobación lista", "Approval ready", "Puede aprobarse si la inspección final coincide.", "Can be approved if final inspection matches."],
    activation_incomplete: ["Activación incompleta", "Activation incomplete", "Corregir activación pública.", "Correct public activation."],
    active: ["Activa", "Active", "Monitorear término y métricas.", "Monitor term and metrics."],
    expiring: ["Por expirar", "Expiring", "Verificar renovación.", "Verify renewal."],
    expired: ["Expirada", "Expired", "Mantener historial o renovación.", "Keep history or renewal path."],
    renewal_review: ["Renovación en revisión", "Renewal review", "Revisar renovación.", "Review renewal."],
    renewal_scheduled: ["Renovación programada", "Renewal scheduled", "Verificar activación programada.", "Verify scheduled activation."],
    operational_recovery: ["Recuperación operativa", "Operational recovery", "Resolver operación atascada.", "Resolve stuck operation."],
    archived: ["Archivada", "Archived", "Sin acción pública.", "No public action."],
  };
  const [labelEs, labelEn, explanationEs, explanationEn] = owner[params.ownerKey];
  const [adminLabelEs, adminLabelEn, adminNextActionEs, adminNextActionEn] = admin[params.adminKey];
  return {
    labelEs,
    labelEn,
    adminLabelEs,
    adminLabelEn,
    explanationEs,
    explanationEn,
    ownerNextActionEs: explanationEs,
    ownerNextActionEn: explanationEn,
    adminNextActionEs,
    adminNextActionEn,
  };
}

function toneFor(ownerKey: OfertaLocalOwnerOperationalStatusKey): OfertaLocalOperationalTone {
  const success = new Set<OfertaLocalOwnerOperationalStatusKey>(["published", "ready_to_submit", "ready_for_preview", "renewal_available"]);
  const danger = new Set<OfertaLocalOwnerOperationalStatusKey>(["scan_needs_attention", "changes_requested", "expired", "recovery_required"]);
  const warning = new Set<OfertaLocalOwnerOperationalStatusKey>([
    "payment_required",
    "payment_processing",
    "review_required",
    "source_required",
    "scan_waiting",
    "scan_in_progress",
    "expiring_soon",
  ]);
  const info = new Set<OfertaLocalOwnerOperationalStatusKey>([
    "submitted_for_review",
    "resubmitted",
    "approved_activation_pending",
    "renewal_awaiting_approval",
    "renewal_scheduled",
  ]);
  if (success.has(ownerKey)) return "success";
  if (danger.has(ownerKey)) return "danger";
  if (warning.has(ownerKey)) return "warning";
  if (info.has(ownerKey)) return "info";
  return "neutral";
}

export function deriveOfertaLocalOperationalStatus(
  input: OfertaLocalOperationalStatusInput
): OfertaLocalOperationalStatus {
  const blockers: string[] = [];
  const productBlocker = deriveProductBlocker(input);
  if (productBlocker) blockers.push(productBlocker);
  if (!LEONIX_ID_RE.test(String(input.leonixAdId ?? ""))) blockers.push("leonix_ad_id_required");

  const sourceReady = hasText(input.publicSourceAssetId) || hasText(input.activeSourceAssetId) || Number(input.assetCount ?? 0) > 0;
  const replacementPending = input.assetReplacementRequiredReview === true || input.assetLifecycleStatus === "replacement_pending";
  if (!sourceReady) blockers.push("source_required");
  if (replacementPending) blockers.push("source_replacement_pending");

  const scanStatus = String(input.aiScanStatus ?? "").toLowerCase();
  const scanActive = ["queued", "preparing", "processing", "active", "running"].includes(scanStatus);
  const scanNeedsAttention = ["failed", "error"].includes(scanStatus) || hasText(input.lastScanError);
  if (scanActive) blockers.push("scan_in_progress");
  if (scanNeedsAttention) blockers.push("scan_needs_attention");

  const reviewRequired =
    input.wantsAiSearchableSpecials === true &&
    ["needs_review", "review_required"].includes(scanStatus);
  if (reviewRequired) blockers.push("review_required");

  const courtesyActive = input.commercialEligibilitySource === "partner_courtesy";
  const paidEntitlement =
    input.paymentStatus === "paid" &&
    input.entitlementStatus === "active" &&
    hasText(input.paymentRecordId) &&
    hasText(input.packageEntitlementId);
  const commercialReady = courtesyActive || paidEntitlement || input.entitlementStatus === "active";
  if (!commercialReady && !isPaymentProcessing(input.paymentStatus)) blockers.push("commercial_entitlement_required");
  if (isPaymentProcessing(input.paymentStatus) && input.entitlementStatus !== "active") blockers.push("payment_processing");

  const publicActive = input.status === "approved" && input.publicTermStatus === "active";
  const publicExpired = input.status === "expired" || input.publicTermStatus === "expired";
  const approvalReady =
    SUBMITTED_STATUSES.has(input.status) &&
    sourceReady &&
    !replacementPending &&
    !scanActive &&
    !scanNeedsAttention &&
    !reviewRequired &&
    commercialReady &&
    LEONIX_ID_RE.test(String(input.leonixAdId ?? "")) &&
    !productBlocker;

  let ownerKey: OfertaLocalOwnerOperationalStatusKey = "draft";
  if (input.status === "archived") ownerKey = "archived";
  else if (publicExpired) ownerKey = "expired";
  else if (publicActive && (input.publicTermDaysRemaining ?? 99) <= 14) ownerKey = "expiring_soon";
  else if (publicActive) ownerKey = "published";
  else if (input.status === "approved") ownerKey = "approved_activation_pending";
  else if (input.status === "rejected") ownerKey = "changes_requested";
  else if (scanNeedsAttention) ownerKey = "scan_needs_attention";
  else if (!sourceReady) ownerKey = "source_required";
  else if (scanActive) ownerKey = "scan_in_progress";
  else if (sourceReady && !scanStatus && input.wantsAiSearchableSpecials) ownerKey = "scan_waiting";
  else if (reviewRequired) ownerKey = "review_required";
  else if (isPaymentProcessing(input.paymentStatus)) ownerKey = "payment_processing";
  else if (!commercialReady) ownerKey = "payment_required";
  else if (SUBMITTED_STATUSES.has(input.status) && input.rejectionNote) ownerKey = "resubmitted";
  else if (SUBMITTED_STATUSES.has(input.status)) ownerKey = "submitted_for_review";
  else if (approvalReady || input.status === "draft") ownerKey = "ready_to_submit";

  if (input.renewalState === "pending_review" || input.renewalState === "correction_required") ownerKey = "renewal_awaiting_approval";
  if (input.renewalState === "approved_scheduled") ownerKey = "renewal_scheduled";

  let adminKey: OfertaLocalAdminOperationalStatusKey = "incomplete_draft";
  if (input.status === "archived") adminKey = "archived";
  else if (publicExpired) adminKey = "expired";
  else if (publicActive && (input.publicTermDaysRemaining ?? 99) <= 14) adminKey = "expiring";
  else if (publicActive) adminKey = "active";
  else if (input.status === "approved") adminKey = "activation_incomplete";
  else if (input.status === "rejected") adminKey = "changes_requested";
  else if (!sourceReady) adminKey = "source_missing";
  else if (scanActive || scanNeedsAttention) adminKey = scanNeedsAttention ? "operational_recovery" : "scan_unresolved";
  else if (reviewRequired) adminKey = "review_unresolved";
  else if (!commercialReady || productBlocker) adminKey = "commercially_ineligible";
  else if (approvalReady) adminKey = "approval_ready";
  else if (SUBMITTED_STATUSES.has(input.status) && input.rejectionNote) adminKey = "resubmitted";
  else if (SUBMITTED_STATUSES.has(input.status)) adminKey = "submitted";
  else if (blockers.length > 0) adminKey = "approval_blocked";
  else adminKey = "ready_for_review";

  if (input.renewalState === "pending_review" || input.renewalState === "correction_required") adminKey = "renewal_review";
  if (input.renewalState === "approved_scheduled") adminKey = "renewal_scheduled";

  const label = labels({ ownerKey, adminKey });
  return {
    ownerKey,
    adminKey,
    ...label,
    tone: toneFor(ownerKey),
    blockingReasons: [...new Set(blockers)],
    publicLinkAllowed: publicActive,
    editAllowed: EDITABLE_STATUSES.has(input.status),
    sourceReplacementAllowed: input.status !== "archived" && !scanActive && !replacementPending,
    scanRetryAllowed: sourceReady && scanNeedsAttention && !scanActive,
    submissionAllowed: ownerKey === "ready_to_submit",
    adminApprovalAllowed: approvalReady,
    renewalAllowed: ownerKey === "expiring_soon" || ownerKey === "expired",
    archiveAllowed: input.status !== "archived",
  };
}
