import { createEmptyAgenteIndividualResidencialState, type AgenteIndividualResidencialFormState } from "../schema/agenteIndividualResidencialFormState";

function st(v: unknown): string {
  return String(v ?? "").trim();
}

export function agenteResFormHasProgress(state: AgenteIndividualResidencialFormState): boolean {
  const e = createEmptyAgenteIndividualResidencialState();
  if (st(state.titulo) !== e.titulo) return true;
  if (st(state.precio) || st(state.ciudad) || st(state.areaCiudad) || st(state.direccion)) return true;
  if (st(state.enlaceListado)) return true;
  if (state.media.photoUrls.some((u) => st(u))) return true;
  if (st(state.media.videoUrl) || st(state.media.videoDataUrl) || st(state.media.tourUrl) || st(state.media.brochureUrl))
    return true;
  if (st(state.agente.nombre) || st(state.agente.email)) return true;
  if (st(state.descripcionPrincipal)) return true;
  return false;
}
