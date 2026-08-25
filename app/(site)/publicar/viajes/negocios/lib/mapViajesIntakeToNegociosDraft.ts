/**
 * Package 3 — pure prefill mapper: Community Opportunity Intake → full negocios application
 * draft. Goal: NO DUPLICATE TYPING. Reused fields map 1:1; derivations are applied only where
 * truthful; community-benefit prose is deliberately NOT dumped into `descripcion`/`incluye` or
 * any public field — the intake block stays an auditable snapshot read by admin, and the
 * benefit's public presentation is governed solely by the admin-approved
 * `community_benefit_status` column.
 *
 * Only used when hydrating a staged row that has an `intake` block and NO `negocios` block; a
 * row that already has `negocios` always wins (a returning user's full application is never
 * overwritten by intake data).
 */

import type { ViajesIntakeV1 } from "@/app/(site)/clasificados/viajes/lib/viajesIntakeTypes";

import type { ViajesNegociosDraft } from "./viajesNegociosDraftTypes";

const PRICE_BASIS_SUFFIX: Record<string, { es: string }> = {
  per_person: { es: "por persona" },
  couple: { es: "por pareja" },
  family: { es: "por familia" },
  group: { es: "por grupo" },
};

export function mapViajesIntakeToNegociosDraft(intake: ViajesIntakeV1): Partial<ViajesNegociosDraft> {
  const basisSuffix = intake.priceBasis ? PRICE_BASIS_SUFFIX[intake.priceBasis]?.es ?? "" : "";
  const precio = intake.precio.trim()
    ? basisSuffix
      ? `${intake.precio.trim()} ${basisSuffix}`
      : intake.precio.trim()
    : "";

  return {
    businessName: intake.businessName,
    email: intake.email,
    phone: intake.phone,
    website: intake.website,
    socials: intake.socials,
    offerType: intake.offerType,
    destino: intake.destino,
    ciudadSalida: intake.ciudadSalida,
    precio,
    // Truthful audience derivations from the extended offer-type vocabulary.
    ...(intake.offerType === "viaje-grupo" ? { grupos: true } : {}),
    ...(intake.offerType === "viaje-familiar" ? { familias: true } : {}),
    // `titulo` is intentionally NOT derived — the provider writes the real offer title in the
    // full application (the intake-stage row's provisional DB title is replaced at submit).
  };
}
