import { createEmptyAgenteIndividualResidencialState, type AgenteIndividualResidencialFormState } from "../schema/agenteIndividualResidencialFormState";

function st(v: unknown): string {
  return String(v ?? "").trim();
}

export function agenteResFormHasProgress(state: AgenteIndividualResidencialFormState): boolean {
  const e = createEmptyAgenteIndividualResidencialState();
  if (st(state.titulo) !== e.titulo) return true;
  if (st(state.precio) || st(state.ciudad) || st(state.areaCiudad) || st(state.direccion)) return true;
  if (st(state.listadoUrl) || st(state.listadoArchivoDataUrl)) return true;
  if (state.fotosDataUrls.some((u) => st(u))) return true;
  if (st(state.videoUrl) || st(state.videoDataUrl) || st(state.tourUrl) || st(state.tourDataUrl) || st(state.brochureUrl) || st(state.brochureDataUrl))
    return true;
  if (
    st(state.agenteNombre) ||
    st(state.correoPrincipal) ||
    st(state.telefonoPrincipal) ||
    st(state.agente2Nombre) ||
    st(state.agente2Telefono) ||
    st(state.agente2Correo)
  )
    return true;
  if (
    st(state.brokerNombre) ||
    st(state.brokerEmail) ||
    st(state.brokerTelefono) ||
    st(state.brokerSitioWeb) ||
    st(state.brokerInstagram) ||
    st(state.brokerFacebook) ||
    st(state.brokerYoutube) ||
    st(state.brokerTiktok) ||
    st(state.brokerX) ||
    st(state.brokerOtro)
  )
    return true;
  if (st(state.marcaNombre) || st(state.marcaLogoDataUrl) || st(state.marcaSitioWeb)) return true;
  if (
    st(state.socialInstagram) ||
    st(state.socialFacebook) ||
    st(state.socialYoutube) ||
    st(state.socialTiktok) ||
    st(state.socialX) ||
    st(state.socialOtro)
  )
    return true;
  if (st(state.descripcionPrincipal)) return true;
  if (state.openHouseSlots.some((slot) => st(slot.fecha) || st(slot.inicio) || st(slot.fin) || st(slot.notas))) return true;
  if (state.extraOpenHouse && (st(state.openHouseFecha) || st(state.openHouseInicio) || st(state.openHouseFin) || st(state.openHouseNotas)))
    return true;
  return false;
}
