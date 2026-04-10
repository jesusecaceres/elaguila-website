import type { BrNegocioCategoriaPropiedad } from "@/app/clasificados/bienes-raices/shared/brNegocioBranchParams";
import type { BienesRaicesNegocioFormState } from "@/app/clasificados/publicar/bienes-raices/negocio/application/schema/bienesRaicesNegocioFormState";

/** Aligns Leonix `Leonix:categoria_propiedad` with BR Negocio `publicationType`. */
export function inferCategoriaPropiedadFromBienesNegocioState(s: BienesRaicesNegocioFormState): BrNegocioCategoriaPropiedad {
  const p = s.publicationType;
  if (p === "comercial") return "comercial";
  if (p === "terreno") return "terreno_lote";
  return "residencial";
}
