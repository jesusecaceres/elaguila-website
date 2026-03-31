import type { TiendaOrderSubmissionPayload } from "@/app/tienda/types/orderSubmission";

/** Short inbox label for how the order was produced (business cards + print upload). */
export function tiendaOrderFlowLabel(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "—";
  const p = payload as Partial<TiendaOrderSubmissionPayload>;
  if (p.v !== 2) return "—";
  if (p.source === "business-cards") {
    const m = p.businessCardExtra?.creationMode;
    if (m === "upload-existing") return "BC · uploaded";
    if (m === "design-online") return "BC · designed";
    return "Business cards";
  }
  if (p.source === "print-upload") return "Print upload";
  if (typeof p.source === "string") return p.source;
  return "—";
}
