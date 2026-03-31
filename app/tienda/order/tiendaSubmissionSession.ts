import type { TiendaOrderSource } from "../types/orderHandoff";

const SUBMITTED_PREFIX = "leonix-tienda-submitted";

export type TiendaSubmittedMarker = {
  orderId: string;
  submittedAt: string;
};

function submittedKey(source: TiendaOrderSource, slug: string): string {
  return `${SUBMITTED_PREFIX}-${source}-${slug}`;
}

export function readTiendaSubmittedMarker(source: TiendaOrderSource, slug: string): TiendaSubmittedMarker | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(submittedKey(source, slug));
    if (!raw) return null;
    const o = JSON.parse(raw) as TiendaSubmittedMarker;
    if (!o?.orderId || typeof o.orderId !== "string") return null;
    return { orderId: o.orderId, submittedAt: typeof o.submittedAt === "string" ? o.submittedAt : "" };
  } catch {
    return null;
  }
}

export function writeTiendaSubmittedMarker(source: TiendaOrderSource, slug: string, orderId: string): void {
  if (typeof window === "undefined") return;
  const payload: TiendaSubmittedMarker = {
    orderId,
    submittedAt: new Date().toISOString(),
  };
  sessionStorage.setItem(submittedKey(source, slug), JSON.stringify(payload));
}
