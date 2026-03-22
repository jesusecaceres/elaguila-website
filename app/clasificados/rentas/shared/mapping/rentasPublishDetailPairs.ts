/**
 * Rentas-specific structured rows for publish detail pairs (business rail + lease dates).
 * Emitted before generic `getRentasDetailFields` iteration in the unified publish orchestrator.
 */

import { RENTAS_PLAZO_LABELS } from "@/app/clasificados/rentas/shared/utils/rentasPublishConstants";

export type PublishLang = "es" | "en";

export function getRentasPublishStructuredDetailPairs(
  lang: PublishLang,
  details: Record<string, string>
): Array<{ label: string; value: string }> {
  const out: Array<{ label: string; value: string }> = [];
  const rentasBranch = (details.rentasBranch ?? "").trim().toLowerCase();
  if (rentasBranch === "negocio") {
    const negocioNombre = (details.negocioNombre ?? "").trim();
    if (negocioNombre) {
      out.push({ label: lang === "es" ? "Nombre del negocio" : "Business name", value: negocioNombre });
    }
    out.push({ label: lang === "es" ? "Plan" : "Plan", value: lang === "es" ? "Negocio" : "Business" });
    const negocioAgente = (details.negocioAgente ?? "").trim();
    if (negocioAgente) {
      out.push({ label: lang === "es" ? "Agente" : "Agent", value: negocioAgente });
    }
  }
  const plazo = (details.plazo_contrato ?? "").trim();
  if (plazo) {
    const label = lang === "es" ? "Plazo del contrato" : "Lease term";
    const value =
      plazo === "otro"
        ? (details.plazo_contrato_otro ?? "").trim() || (lang === "es" ? "Otro" : "Other")
        : (RENTAS_PLAZO_LABELS[plazo]?.[lang] ?? plazo);
    out.push({ label, value });
  }
  const fechaDisp = (details.fechaDisponible ?? "").trim();
  if (fechaDisp) {
    out.push({
      label: lang === "es" ? "Fecha disponible" : "Available date",
      value: fechaDisp,
    });
  }
  return out;
}
