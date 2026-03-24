import type { LeonixBRPrivadoForm } from "../schema/leonixBrPrivadoForm";

export function toLeonixBrPrivadoDraftSnapshot(form: LeonixBRPrivadoForm): LeonixBRPrivadoForm {
  return structuredClone(form);
}
