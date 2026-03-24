import type { LeonixBrPrivadoFormState } from "../schema/leonixBrPrivadoFormState";

export function leonixBrPrivadoToFlatDetailsStub(state: LeonixBrPrivadoFormState): Record<string, string> {
  return {
    br_lane: "privado",
    titulo: state.inmueble.titulo,
    ciudad: state.inmueble.ciudad,
    anunciante: state.anunciante.nombre,
    relacion: state.anunciante.relacion,
  };
}
