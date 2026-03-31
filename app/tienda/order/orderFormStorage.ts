import type { TiendaCustomerDetails, TiendaFulfillmentPreference, TiendaOrderSource } from "../types/orderHandoff";
import { emptyTiendaCustomerDetails } from "../types/orderHandoff";

const FORM_KEY_PREFIX = "leonix-tienda-order-form";

export type PersistedTiendaOrderForm = {
  v: 1;
  updatedAt: string;
  customer: TiendaCustomerDetails;
  fulfillment: TiendaFulfillmentPreference | "";
};

function formStorageKey(source: TiendaOrderSource, slug: string): string {
  return `${FORM_KEY_PREFIX}-${source}-${slug}`;
}

export function readPersistedOrderForm(
  source: TiendaOrderSource,
  slug: string
): Pick<PersistedTiendaOrderForm, "customer" | "fulfillment"> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(formStorageKey(source, slug));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedTiendaOrderForm;
    if (parsed?.v !== 1 || !parsed.customer) return null;
    return {
      customer: { ...emptyTiendaCustomerDetails(), ...parsed.customer },
      fulfillment: parsed.fulfillment ?? "",
    };
  } catch {
    return null;
  }
}

export function writePersistedOrderForm(
  source: TiendaOrderSource,
  slug: string,
  customer: TiendaCustomerDetails,
  fulfillment: TiendaFulfillmentPreference | ""
): void {
  if (typeof window === "undefined") return;
  const payload: PersistedTiendaOrderForm = {
    v: 1,
    updatedAt: new Date().toISOString(),
    customer,
    fulfillment,
  };
  sessionStorage.setItem(formStorageKey(source, slug), JSON.stringify(payload));
}

/** Prefill business name from builder text fields when empty. */
export function mergeBusinessNamePrefill(
  customer: TiendaCustomerDetails,
  companyHint: string | null | undefined
): TiendaCustomerDetails {
  if (!companyHint?.trim() || customer.businessName.trim()) return customer;
  return { ...customer, businessName: companyHint.trim() };
}

export function configurePathForSource(source: TiendaOrderSource, slug: string): string {
  if (source === "business-cards") {
    return `/tienda/configure/business-cards/${slug}`;
  }
  return `/tienda/configure/print-upload/${slug}`;
}

export function productPathForSlug(slug: string): string {
  return `/tienda/p/${slug}`;
}
