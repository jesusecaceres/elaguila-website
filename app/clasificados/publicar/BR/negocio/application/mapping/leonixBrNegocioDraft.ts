import type { LeonixBRNegocioForm } from "../schema/leonixBrNegocioForm";

/** Serialización estable para persistencia / API posterior — hoy pasa el modelo tal cual. */
export function toLeonixBrNegocioDraftSnapshot(form: LeonixBRNegocioForm): LeonixBRNegocioForm {
  return structuredClone(form);
}
