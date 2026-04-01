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
  if (st(state.agenteNombre) || st(state.agenteEmail)) return true;
  if (st(state.descripcionPrincipal)) return true;
  return false;
}
