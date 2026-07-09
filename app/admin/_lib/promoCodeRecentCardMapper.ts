import {
  computePromoAttentionFlags,
  computeUsageEntryMismatchFlags,
  effectivePromoCodeStatus,
  formatPromoCategoryScope,
  formatPromoCustomerLine,
  formatPromoPackageScope,
  formatPromoSalesRepLine,
  promoAttentionFlagLabel,
  promoCodeUsageMode,
  type LeonixPromoCodeRow,
  type PromoCodeAttentionFlag,
  type PromoCodeUsageEntry,
} from "./promoCodeData";
import {
  buildPromoFollowUpGuidance,
  buildPromoOperationalNextAction,
  formatPromoCodeStatusHint,
  formatPromoCodeStatusLabel,
  formatPromoCustomerBlock,
  formatPromoDeliveryStatus,
  formatPromoSourceLabel,
  formatPromoUsageAddress,
  formatPromoUsageField,
  formatPromoUsageMoney,
  formatPromoUsageSummary,
  getPromoDeliveryStatusKey,
} from "./promoCodeDisplayHelpers";
import { PROMO_CODE_TYPES } from "./promoCodeConstants";

export type PromoRecentUsageView = {
  redemptionId: string;
  usedBusinessName: string | null;
  usedEmail: string | null;
  businessPhone: string | null;
  businessEmail: string | null;
  businessAddress: string | null;
  category: string | null;
  packageKey: string | null;
  addOnKeys: string[];
  listingId: string | null;
  leonixAdId: string | null;
  ownerUserId: string | null;
  paymentRecordId: string | null;
  stripeCheckoutSessionId: string | null;
  stripePaymentIntentId: string | null;
  paymentStatus: string | null;
  webhookRedeemed: boolean;
  redeemedAt: string | null;
  subtotalCents: string | null;
  amountDiscountCents: string | null;
  amountTotalCents: string | null;
  currency: string | null;
  paymentTrackerHref: string | null;
  publicAdUrl: string | null;
  mismatchLabels: string[];
};

export type PromoRecentCardView = {
  id: string;
  code: string;
  codeType: string;
  purposeLabel: string;
  storedStatus: string;
  effectiveStatus: string;
  statusLabel: string;
  statusHint: string;
  usageModeLabel: string;
  deliveryLabel: string | null;
  deliveryHint: string | null;
  deliveryClassName: string | null;
  usageSummary: string;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  assignedLine: string | null;
  salesRep: string | null;
  sourceLabel: string;
  categoryLabel: string;
  packageScopeLabel: string;
  packageTier: string | null;
  discountSummary: string;
  missingDiscount: boolean;
  oneTimeUse: boolean;
  nonStackable: boolean;
  createdAt: string;
  expiresAt: string;
  redemptionCount: number;
  maxRedemptions: number | null;
  followUp: string;
  nextAction: string;
  attentionLabels: string[];
  ruleBadges: string[];
  categoryKey: string;
  deliveryKey: string | null;
  hasUsage: boolean;
  needsAttention: boolean;
  packageEntitlementId: string | null;
  canRevoke: boolean;
  usage: PromoRecentUsageView[];
  notesPreview: string | null;
};

function formatRowDiscountSummary(row: LeonixPromoCodeRow): string {
  const pct =
    row.percent_off != null && row.percent_off > 0
      ? row.percent_off
      : typeof row.metadata.discount_percent === "number" && row.metadata.discount_percent > 0
        ? row.metadata.discount_percent
        : null;
  const cents =
    row.amount_off_cents != null && row.amount_off_cents > 0
      ? row.amount_off_cents
      : typeof row.metadata.discount_amount_cents === "number" && row.metadata.discount_amount_cents > 0
        ? row.metadata.discount_amount_cents
        : null;
  if (pct != null) return `${pct}% off`;
  if (cents != null) return `$${(cents / 100).toFixed(2)} off`;
  if (row.code_type === "discount") return "Missing discount value";
  if (row.code_type === "newsletter" || row.code_type === "sms") return "No discount (tracking only)";
  return "—";
}

function resolveCategoryKey(row: LeonixPromoCodeRow): string {
  const cat = row.category?.trim().toLowerCase();
  if (cat) return cat;
  const scope = row.category_scope?.[0]?.trim().toLowerCase();
  return scope ?? "";
}

function truncateId(id: string | null | undefined, len = 8): string {
  if (!id) return "—";
  return id.length > len ? `${id.slice(0, len)}…` : id;
}

export function buildPromoRecentCardViews(
  rows: LeonixPromoCodeRow[],
  usageLedger: Map<string, PromoCodeUsageEntry[]>,
  ruleBadgesByRow: Map<string, string[]>,
): PromoRecentCardView[] {
  return rows.map((row) => {
    const effective = effectivePromoCodeStatus(row);
    const usage = usageLedger.get(row.id) ?? [];
    const attentionFlags = computePromoAttentionFlags(row, usage);
    const delivery = formatPromoDeliveryStatus(row);
    const customerBlock = formatPromoCustomerBlock(row);
    const discountSummary = formatRowDiscountSummary(row);
    const followUp = buildPromoFollowUpGuidance({
      row,
      effectiveStatus: effective,
      hasUsage: usage.length > 0,
    });
    const notes =
      row.metadata.notes != null && String(row.metadata.notes).trim()
        ? String(row.metadata.notes).trim().slice(0, 240)
        : null;

    return {
      id: row.id,
      code: row.code,
      codeType: row.code_type,
      purposeLabel: PROMO_CODE_TYPES.find((t) => t.value === row.code_type)?.label ?? row.code_type,
      storedStatus: row.status,
      effectiveStatus: effective,
      statusLabel: formatPromoCodeStatusLabel(effective),
      statusHint: formatPromoCodeStatusHint(effective),
      usageModeLabel: promoCodeUsageMode(row) === "assigned_private" ? "Assigned/private" : "Public launch",
      deliveryLabel: delivery?.label ?? null,
      deliveryHint: delivery?.hint ?? null,
      deliveryClassName: delivery?.className ?? null,
      usageSummary: formatPromoUsageSummary(usage.length > 0, effective),
      customerName: customerBlock.nameLine,
      customerEmail: customerBlock.emailLine,
      customerPhone: row.customer_phone?.trim() || null,
      assignedLine: formatPromoCustomerLine(row),
      salesRep: formatPromoSalesRepLine(row),
      sourceLabel: formatPromoSourceLabel(row),
      categoryLabel: formatPromoCategoryScope(row),
      packageScopeLabel: formatPromoPackageScope(row),
      packageTier: row.package_tier,
      discountSummary,
      missingDiscount: row.code_type === "discount" && discountSummary === "Missing discount value",
      oneTimeUse: row.one_time_use,
      nonStackable: row.non_stackable,
      createdAt: row.created_at,
      expiresAt: row.ends_at ?? "",
      redemptionCount: row.redemption_count,
      maxRedemptions: row.max_redemptions,
      followUp,
      nextAction: buildPromoOperationalNextAction({
        row,
        effectiveStatus: effective,
        hasUsage: usage.length > 0,
        needsAttention: attentionFlags.length > 0,
      }),
      attentionLabels: attentionFlags.map((f) => promoAttentionFlagLabel(f)),
      ruleBadges: ruleBadgesByRow.get(row.id) ?? [],
      categoryKey: resolveCategoryKey(row),
      deliveryKey: getPromoDeliveryStatusKey(row),
      hasUsage: usage.length > 0,
      needsAttention: attentionFlags.length > 0,
      packageEntitlementId: row.package_entitlement_id,
      canRevoke: effective !== "revoked" && effective !== "redeemed",
      notesPreview: notes,
      usage: usage.map((entry) => {
        const mismatch = computeUsageEntryMismatchFlags(row, entry);
        return {
          redemptionId: entry.redemptionId,
          usedBusinessName: entry.usedBusinessName,
          usedEmail: entry.usedEmail,
          businessPhone: entry.businessPhone,
          businessEmail: entry.businessEmail,
          businessAddress: formatPromoUsageAddress({
            line1: entry.businessAddressLine1,
            city: entry.businessCity,
            state: entry.businessState,
            zip: entry.businessZip,
          }),
          category: entry.category,
          packageKey: entry.packageKey,
          addOnKeys: entry.addOnKeys,
          listingId: entry.listingId ? truncateId(entry.listingId, 12) : null,
          leonixAdId: entry.leonixAdId ? truncateId(entry.leonixAdId, 12) : null,
          ownerUserId: entry.ownerUserId ? truncateId(entry.ownerUserId, 12) : null,
          paymentRecordId: entry.paymentRecordId ? truncateId(entry.paymentRecordId, 12) : null,
          stripeCheckoutSessionId: entry.stripeCheckoutSessionId
            ? truncateId(entry.stripeCheckoutSessionId, 16)
            : null,
          stripePaymentIntentId: entry.stripePaymentIntentId
            ? truncateId(entry.stripePaymentIntentId, 16)
            : null,
          paymentStatus: entry.paymentStatus,
          webhookRedeemed: entry.webhookRedeemed,
          redeemedAt: entry.redeemedAt,
          subtotalCents: formatPromoUsageMoney(entry.subtotalCents),
          amountDiscountCents: formatPromoUsageMoney(
            entry.amountDiscountCents ?? (entry.discountCents > 0 ? entry.discountCents : null),
          ),
          amountTotalCents: formatPromoUsageMoney(entry.amountTotalCents),
          currency: entry.currency,
          paymentTrackerHref: entry.paymentTrackerHref,
          publicAdUrl: entry.publicAdUrl,
          mismatchLabels: mismatch.map((f) => promoAttentionFlagLabel(f)),
        };
      }),
    };
  });
}
