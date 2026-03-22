/**
 * BR Negocio: display formatting for price, integers, and address lines in the publish flow.
 */

import { resolveBrNegocioAddressDisplayLine } from "@/app/clasificados/bienes-raices/negocio/mapping/brNegocioReadResolvers";

/** Digits only for BR negocio sqft / lot stored values. */
export function brNegocioDigitsOnly(raw: string): string {
  return raw.replace(/[^\d]/g, "");
}

/** Comma-grouped display while typing (US grouping); underlying value uses `brNegocioDigitsOnly`. */
export function formatBrNegocioIntegerInputDisplay(raw: string): string {
  const d = brNegocioDigitsOnly(raw);
  if (!d) return "";
  return Number(d).toLocaleString("en-US");
}

/** BR negocio listing price: comma display; validation uses digits stripped from state. */
export function formatBrNegocioPriceInputDisplay(raw: string): string {
  const d = raw.replace(/[^0-9]/g, "");
  if (!d) return "";
  return Number(d).toLocaleString("en-US");
}

/** Preview / detail row: structured address or legacy single line. */
export function formatBrNegocioAddressLine(details: Record<string, string>, cityDisplay: string): string {
  return resolveBrNegocioAddressDisplayLine(details, cityDisplay);
}

export function formatBrNegocioDetailNumberDisplay(raw: string): string {
  const d = raw.replace(/[^\d]/g, "");
  if (!d) return raw.trim();
  return Number(d).toLocaleString("en-US");
}
