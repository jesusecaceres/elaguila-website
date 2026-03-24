/**
 * Stub for future pipeline: map application state → `details` record / preview payload.
 * No preview wiring in this pass — keeps mapping boundary explicit.
 */

import type { LeonixBrNegocioFormState } from "../schema/leonixBrNegocioFormState";

export function leonixBrNegocioToFlatDetailsStub(state: LeonixBrNegocioFormState): Record<string, string> {
  const { inmueble, negocio, agente, equipo, redes, contacto } = state;
  return {
    br_lane: "negocio",
    titulo: inmueble.titulo,
    operacion: inmueble.operacion,
    ciudad: inmueble.ciudad,
    precio: inmueble.precio,
    moneda: inmueble.moneda,
    negocio_nombre: negocio.nombreComercial,
    agente_nombre: agente.nombreCompleto,
    equipo_coagente: equipo.coAgente,
    redes_facebook: redes.facebook,
    cta_principal: contacto.ctaPrincipal,
  };
}
