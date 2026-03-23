import type { PublishDraftSnapshot } from "@/app/clasificados/lib/publishDraftSnapshot";

export function computeRentasPublishMetaOk(s: PublishDraftSnapshot, contactOk: boolean): boolean {
  const rentasBranch = (s.details.rentasBranch ?? "").trim();
  const rentasNegocio = s.category === "rentas" && rentasBranch === "negocio";
  const rentasNegocioNameOk = !rentasNegocio || !!(s.details.negocioNombre ?? "").trim();
  const rentasNegocioTierOk = !rentasNegocio || !!(s.details.rentasTier ?? "").trim();
  const negocioOfficePhone = (s.details.negocioTelOficina ?? "").replace(/\D/g, "").slice(0, 10);
  const rentasNegocioContactOk = !rentasNegocio || contactOk || negocioOfficePhone.length === 10;

  return (
    s.category !== "rentas" ||
    (!!(s.details.rentasSubcategoria ?? "").trim() &&
      !!(s.details.tipoPropiedad ?? "").trim() &&
      !!rentasBranch &&
      !!(s.details.fechaDisponible ?? "").trim() &&
      rentasNegocioNameOk &&
      rentasNegocioTierOk &&
      rentasNegocioContactOk)
  );
}
