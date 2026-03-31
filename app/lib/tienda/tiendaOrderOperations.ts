import type { TiendaOrderSubmissionPayload } from "@/app/tienda/types/orderSubmission";

/** Admin / fulfillment workflow — stored in tienda_orders.status */
export const TIENDA_ORDER_OPS_STATUSES = [
  "new",
  "reviewing",
  "ready_to_fulfill",
  "ordered",
  "completed",
  "needs_customer_followup",
  "failed_submission",
] as const;

export type TiendaOrderOpsStatus = (typeof TIENDA_ORDER_OPS_STATUSES)[number];

export function isTiendaOrderOpsStatus(s: string): s is TiendaOrderOpsStatus {
  return (TIENDA_ORDER_OPS_STATUSES as readonly string[]).includes(s);
}

export function approvalCompleteFromPayload(p: TiendaOrderSubmissionPayload): boolean {
  if (p.source === "business-cards" && p.businessCardExtra) {
    const a = p.businessCardExtra.approval;
    return a.spellingReviewed && a.layoutReviewed && a.printAsApproved && a.noRedesignExpectation;
  }
  return (
    p.approvalStatus.en === "Configurator approval complete" ||
    p.approvalStatus.es === "Aprobación del configurador completa"
  );
}

export function tiendaOrderStatusLabel(status: TiendaOrderOpsStatus): string {
  switch (status) {
    case "new":
      return "New";
    case "reviewing":
      return "Reviewing";
    case "ready_to_fulfill":
      return "Ready to fulfill";
    case "ordered":
      return "Ordered (vendor)";
    case "completed":
      return "Completed";
    case "needs_customer_followup":
      return "Needs customer follow-up";
    case "failed_submission":
      return "Failed submission";
    default: {
      const _x: never = status;
      return String(_x);
    }
  }
}
