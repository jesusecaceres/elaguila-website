import type { LeonixPromoCodeRow } from "./promoCodeData";

export type PromoDeliveryStatusKey =
  | "sent"
  | "failed"
  | "pending"
  | "not_configured"
  | "not_sent"
  | "unknown";

export type PromoDisplayStatus = {
  label: string;
  hint: string;
  className: string;
};

const DELIVERY_BADGE_SENT = "bg-emerald-100 text-emerald-950";
const DELIVERY_BADGE_FAILED = "bg-rose-100 text-rose-950";
const DELIVERY_BADGE_PENDING = "bg-amber-100 text-amber-950";
const DELIVERY_BADGE_NEUTRAL = "bg-[#F4F0E8] text-[#5C5346]";

function readMetadataString(metadata: Record<string, unknown>, key: string): string {
  const raw = metadata[key];
  return typeof raw === "string" ? raw.trim() : "";
}

export function getPromoDeliveryStatusKey(
  row: Pick<LeonixPromoCodeRow, "code_type" | "metadata">,
): PromoDeliveryStatusKey | null {
  if (row.code_type !== "newsletter" && row.code_type !== "sms") return null;
  const statusKey = row.code_type === "newsletter" ? "email_send_status" : "sms_send_status";
  const raw = readMetadataString(row.metadata, statusKey).toLowerCase();
  if (raw === "sent") return "sent";
  if (raw === "failed") return "failed";
  if (raw === "pending") return "pending";
  if (raw === "not_configured") return "not_configured";
  if (raw === "not_sent") return "not_sent";
  return "unknown";
}

export function formatPromoDeliveryStatus(
  row: Pick<LeonixPromoCodeRow, "code_type" | "metadata">,
): PromoDisplayStatus | null {
  const key = getPromoDeliveryStatusKey(row);
  if (!key) return null;

  switch (key) {
    case "sent":
      return {
        label: "Sent",
        hint: "Promo email was sent.",
        className: DELIVERY_BADGE_SENT,
      };
    case "failed":
      return {
        label: "Failed",
        hint: "Email failed; use manual follow-up.",
        className: DELIVERY_BADGE_FAILED,
      };
    case "pending":
      return {
        label: "Pending",
        hint: "Delivery is pending or not finished yet.",
        className: DELIVERY_BADGE_PENDING,
      };
    case "not_configured":
      return {
        label: "Email not configured",
        hint: "Email service was not configured; use manual follow-up.",
        className: DELIVERY_BADGE_PENDING,
      };
    case "not_sent":
      return {
        label: "Not sent yet",
        hint: "Code exists but promo email has not been sent yet.",
        className: DELIVERY_BADGE_PENDING,
      };
    default:
      return {
        label: "Unknown / not sent",
        hint: "Delivery status is unknown. Verify manually before promising the code.",
        className: DELIVERY_BADGE_NEUTRAL,
      };
  }
}

export function formatPromoCodeStatusLabel(status: string): string {
  switch (status) {
    case "active":
      return "Active";
    case "draft":
      return "Draft";
    case "expired":
      return "Expired";
    case "revoked":
      return "Revoked";
    case "redeemed":
      return "Redeemed";
    case "pending":
      return "Pending";
    default:
      return status;
  }
}

export function formatPromoCodeStatusHint(status: string): string {
  switch (status) {
    case "active":
      return "Code can be used if the checkout is eligible.";
    case "draft":
      return "Draft code is not ready for customer use.";
    case "expired":
      return "Code is past its expiration date.";
    case "revoked":
      return "Code was manually disabled.";
    case "redeemed":
      return "Code has already been used.";
    case "pending":
      return "Code is pending activation or review.";
    default:
      return "Review the stored status before promising this code.";
  }
}

export function formatPromoSourceLabel(row: Pick<LeonixPromoCodeRow, "metadata">): string {
  const meta = row.metadata;
  const parts = [
    readMetadataString(meta, "signup_source"),
    readMetadataString(meta, "capture_channel"),
    readMetadataString(meta, "source"),
    readMetadataString(meta, "source_page"),
    readMetadataString(meta, "source_cta") ? `cta:${readMetadataString(meta, "source_cta")}` : "",
  ].filter(Boolean);
  const unique = [...new Set(parts)];
  return unique.length ? unique.join(" · ") : "Not available";
}

export function formatPromoCustomerBlock(
  row: Pick<LeonixPromoCodeRow, "customer_name" | "business_name" | "customer_email">,
): { nameLine: string; emailLine: string | null } {
  const name =
    row.business_name?.trim() ||
    row.customer_name?.trim() ||
    "Not available";
  const email = row.customer_email?.trim() || null;
  return { nameLine: name, emailLine: email };
}

export function formatPromoUsageSummary(hasUsage: boolean, effectiveStatus: string): string {
  if (hasUsage || effectiveStatus === "redeemed") return "Redeemed";
  return "No redemption yet";
}

export function buildPromoFollowUpGuidance(input: {
  row: Pick<LeonixPromoCodeRow, "code_type" | "metadata">;
  effectiveStatus: string;
  hasUsage: boolean;
}): string {
  const delivery = getPromoDeliveryStatusKey(input.row);
  const { effectiveStatus, hasUsage } = input;

  if (effectiveStatus === "redeemed" || hasUsage) {
    return "No resend needed. Code has been used. Verify payment/usage below if the customer asks.";
  }
  if (effectiveStatus === "expired" || effectiveStatus === "revoked") {
    return "Do not promise this code works. Create or manual review may be needed.";
  }
  if (delivery === "failed" || delivery === "not_configured" || delivery === "unknown" || delivery === "not_sent") {
    return "Manual follow-up recommended. Copy the code and contact the customer.";
  }
  if (delivery === "sent" && effectiveStatus === "active") {
    return "Customer should have the code. If they need help, verify the code and eligible checkout.";
  }
  if (effectiveStatus === "active") {
    return "Code is active. Confirm delivery status and eligible checkout before resending manually.";
  }
  return "Review code status and delivery before contacting the customer.";
}

export const PROMO_MANUAL_FOLLOW_UP_REMINDER =
  "Manual outreach only. This page does not send bulk newsletters.";

export function formatPromoUsageMoney(cents: number | null | undefined): string | null {
  if (cents == null || !Number.isFinite(cents)) return null;
  return `$${(cents / 100).toFixed(2)}`;
}

export function formatPromoUsageField(value: string | null | undefined): string {
  const v = String(value ?? "").trim();
  return v || "Not captured";
}

export function formatPromoUsageAddress(input: {
  line1?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
}): string | null {
  const parts = [input.line1, input.city, input.state, input.zip]
    .map((v) => String(v ?? "").trim())
    .filter(Boolean);
  return parts.length ? parts.join(", ") : null;
}

export function buildPromoOperationalNextAction(input: {
  row: Pick<LeonixPromoCodeRow, "code_type" | "metadata">;
  effectiveStatus: string;
  hasUsage: boolean;
  needsAttention: boolean;
}): string {
  const delivery = getPromoDeliveryStatusKey(input.row);
  const { effectiveStatus, hasUsage, needsAttention } = input;

  if (effectiveStatus === "redeemed" || hasUsage) {
    return "Used. No resend needed. Verify payment below if the customer asks.";
  }
  if (effectiveStatus === "expired" || effectiveStatus === "revoked") {
    return "Do not promise this code works.";
  }
  if (delivery === "failed" || delivery === "not_configured") {
    return "Manual follow-up recommended. Copy code and contact the customer.";
  }
  if (needsAttention) {
    return "Review scope and status before advising the customer.";
  }
  if (delivery === "sent" && effectiveStatus === "active") {
    return "Ready. Customer can use this on eligible checkout.";
  }
  if (effectiveStatus === "active") {
    return "Active. Confirm delivery and eligible checkout before promising.";
  }
  if (effectiveStatus === "draft") {
    return "Draft — activate or verify before customer use.";
  }
  return "Review status and delivery before next step.";
}

export function buildPromoFollowUpCopyLine(code: string, customerName?: string | null): string {
  const greeting = customerName?.trim() ? `Hi ${customerName.trim()}` : "Hi";
  return `${greeting} — your Leonix promo code is ${code}. Use it on eligible checkout at leonixmedia.com. If you need help, reply to this email.`;
}
