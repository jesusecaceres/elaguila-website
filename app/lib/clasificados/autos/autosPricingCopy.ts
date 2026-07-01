import type { AutosNegociosLang } from "@/app/clasificados/autos/negocios/lib/autosNegociosLang";

export type AutosListingPlanLane = "privado" | "negocios";

/** Display-only constants — not payment logic. */
export const AUTOS_PRIVADO_PRICE_USD = 24.99;
export const AUTOS_PRIVADO_DURATION_DAYS = 30;
export const AUTOS_NEGOCIOS_PRICE_USD = 399;

export type AutosPlanDisplayCopy = {
  label: string;
  priceDisplay: string;
  description: string;
  footnote: string;
};

const PRIVADO: Record<AutosNegociosLang, AutosPlanDisplayCopy> = {
  es: {
    label: "Autos Privado",
    priceDisplay: "$24.99 / 30 días",
    description: "Publica un vehículo como vendedor privado.",
    footnote: "El pago se confirma en el último paso cuando Stripe esté activo.",
  },
  en: {
    label: "Private Seller Autos",
    priceDisplay: "$24.99 / 30 days",
    description: "Post one vehicle as a private seller.",
    footnote: "Payment is confirmed at the final step when Stripe is active.",
  },
};

const NEGOCIOS: Record<AutosNegociosLang, AutosPlanDisplayCopy> = {
  es: {
    label: "Dealer de Autos",
    priceDisplay: "$399 / mes",
    description: "Paquete para dealer o negocio de autos.",
    footnote: "La configuración de pagos y contratos se maneja con el sistema de administración Leonix.",
  },
  en: {
    label: "Dealer de Autos",
    priceDisplay: "$399 / month",
    description: "Package for dealerships or auto businesses.",
    footnote: "Payment and contract setup is handled through the Leonix admin system.",
  },
};

export function getAutosPlanDisplayCopy(lang: AutosNegociosLang, lane: AutosListingPlanLane): AutosPlanDisplayCopy {
  return lane === "privado" ? PRIVADO[lang] : NEGOCIOS[lang];
}

export type AutosLandingPublishCardCopy = {
  laneLabel: string;
  title: string;
  priceDisplay: string;
  body: string;
  cta: string;
};

export function getAutosLandingPublishCardCopy(
  lang: AutosNegociosLang,
  lane: AutosListingPlanLane,
): AutosLandingPublishCardCopy {
  const plan = getAutosPlanDisplayCopy(lang, lane);
  if (lane === "privado") {
    return lang === "es"
      ? {
          laneLabel: plan.label,
          title: "¿Quieres vender tu auto?",
          priceDisplay: plan.priceDisplay,
          body: plan.description,
          cta: "Publicar auto",
        }
      : {
          laneLabel: plan.label,
          title: "Want to sell your car?",
          priceDisplay: plan.priceDisplay,
          body: plan.description,
          cta: "Post your car",
        };
  }
  return lang === "es"
    ? {
        laneLabel: plan.label,
        title: "¿Eres dealer?",
        priceDisplay: plan.priceDisplay,
        body: "Paquete para agencias y negocios de autos.",
        cta: "Publicar como dealer",
      }
    : {
        laneLabel: plan.label,
        title: "Are you a dealer?",
        priceDisplay: plan.priceDisplay,
        body: "Package for dealerships and auto businesses.",
        cta: "Post as dealer",
      };
}

export type AutosApplicationPlanReminder = {
  planLine: string;
  helperLine: string;
};

export function getAutosApplicationPlanReminder(
  lang: AutosNegociosLang,
  lane: AutosListingPlanLane,
): AutosApplicationPlanReminder {
  const plan = getAutosPlanDisplayCopy(lang, lane);
  if (lane === "privado") {
    return lang === "es"
      ? {
          planLine: `Plan: ${plan.label} — ${plan.priceDisplay}`,
          helperLine: "Revisarás y confirmarás tu anuncio antes de pagar o publicarlo.",
        }
      : {
          planLine: `Plan: ${plan.label} — ${plan.priceDisplay}`,
          helperLine: "You'll review and confirm your listing before payment or publishing.",
        };
  }
  return lang === "es"
    ? {
        planLine: `Plan: ${plan.label} — ${plan.priceDisplay}`,
        helperLine: "Tu paquete de dealer se confirma antes de activar pagos o publicación.",
      }
    : {
        planLine: `Plan: ${plan.label} — ${plan.priceDisplay}`,
        helperLine: "Your dealer package is confirmed before payment or publishing is activated.",
      };
}

export type AutosConfirmPlanSummaryCopy = {
  planLabel: string;
  planValue: string;
  priceLabel: string;
  priceValue: string;
  statusLabel: string;
  statusValue: string;
  summaryFootnote: string;
};

export function getAutosConfirmPlanSummaryCopy(
  lang: AutosNegociosLang,
  lane: AutosListingPlanLane,
  qaBypassActive: boolean,
): AutosConfirmPlanSummaryCopy {
  const plan = getAutosPlanDisplayCopy(lang, lane);
  const summaryFootnote =
    lang === "es"
      ? "Este resumen muestra el plan seleccionado. El cobro y los códigos promocionales se activarán desde el sistema de pagos de Leonix."
      : "This summary shows the selected plan. Payment and promo codes will be activated through the Leonix payment system.";

  if (lane === "privado") {
    const statusValue = qaBypassActive
      ? lang === "es"
        ? "Modo QA — pago diferido hasta activar Stripe."
        : "QA mode — payment deferred until Stripe is active."
      : lang === "es"
        ? "El cobro se confirma en el último paso con Stripe."
        : "Payment is confirmed at the final step with Stripe.";
    return {
      planLabel: lang === "es" ? "Plan" : "Plan",
      planValue: plan.label,
      priceLabel: lang === "es" ? "Precio del plan" : "Plan price",
      priceValue: plan.priceDisplay,
      statusLabel: lang === "es" ? "Estado de pago" : "Payment status",
      statusValue,
      summaryFootnote,
    };
  }

  const statusValue = qaBypassActive
    ? lang === "es"
      ? "Modo QA — activación de pagos diferida (Revenue OS / admin Leonix)."
      : "QA mode — payment activation deferred (Revenue OS / Leonix admin)."
    : lang === "es"
      ? "Pagos y contratos vía sistema de administración Leonix / Stripe."
      : "Payments and contracts via Leonix admin system / Stripe.";

  return {
    planLabel: lang === "es" ? "Plan" : "Plan",
    planValue: plan.label,
    priceLabel: lang === "es" ? "Precio del plan" : "Plan price",
    priceValue: plan.priceDisplay,
    statusLabel: lang === "es" ? "Estado de pago" : "Payment status",
    statusValue,
    summaryFootnote,
  };
}
