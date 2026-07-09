import type { ServiciosLang, ServiciosProfileResolved } from "../types/serviciosBusinessProfile";
import {
  getServiciosPaymentMethodLabel,
  isServiciosPaymentMethodId,
  SERVICIOS_PAYMENT_METHOD_ORDER,
} from "./serviciosPaymentMethodCatalog";
import { hasBusinessHighlightsResolved, hasPaymentMethodsResolved } from "./serviciosProfilePresence";

export type ServiciosPagosGroup = {
  id: string;
  title: string;
  icon: string;
  items: string[];
};

const FINANCING_IDS = new Set(["financing_available", "payment_plans", "deposit_required", "invoice_available"]);

export function buildServiciosPagosGroups(
  profile: ServiciosProfileResolved,
  displayProfile: ServiciosProfileResolved,
  lang: ServiciosLang,
): ServiciosPagosGroup[] {
  const groups: ServiciosPagosGroup[] = [];

  const paymentLabels: string[] = [];
  const financingLabels: string[] = [];

  for (const id of SERVICIOS_PAYMENT_METHOD_ORDER) {
    if (!profile.paymentMethodIds.includes(id) || !isServiciosPaymentMethodId(id)) continue;
    const label = getServiciosPaymentMethodLabel(id, lang);
    if (FINANCING_IDS.has(id)) financingLabels.push(label);
    else paymentLabels.push(label);
  }

  for (const raw of profile.customPaymentMethods) {
    const label = raw.trim();
    if (!label) continue;
    paymentLabels.push(label);
  }

  if (paymentLabels.length > 0) {
    groups.push({
      id: "payments",
      title: lang === "en" ? "Payments" : "Pagos",
      icon: "💳",
      items: paymentLabels,
    });
  }

  if (financingLabels.length > 0) {
    groups.push({
      id: "financing",
      title: lang === "en" ? "Financing" : "Financiamiento",
      icon: "📋",
      items: financingLabels,
    });
  }

  if (hasBusinessHighlightsResolved(displayProfile)) {
    groups.push({
      id: "highlights",
      title: lang === "en" ? "Business highlights" : "Beneficios del negocio",
      icon: "⭐",
      items: displayProfile.highlights.map((h) => h.label.trim()).filter(Boolean),
    });
  }

  return groups;
}

export function hasServiciosPagosBeneficiosSection(
  profile: ServiciosProfileResolved,
  displayProfile: ServiciosProfileResolved,
): boolean {
  return hasPaymentMethodsResolved(profile) || hasBusinessHighlightsResolved(displayProfile);
}
