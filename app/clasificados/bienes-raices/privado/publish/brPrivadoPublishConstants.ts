/** Property-type gates for BR privado publish (minimal implementation for unified publish config). */

export function isBrPrivadoResidential(pt: string): boolean {
  const v = (pt ?? "").trim().toLowerCase();
  return v === "casa" || v === "departamento" || v === "condominio";
}

export function isBrPrivadoLote(pt: string): boolean {
  const v = (pt ?? "").trim().toLowerCase();
  return v === "terreno" || v === "lote";
}

export function isBrPrivadoComercial(pt: string): boolean {
  const v = (pt ?? "").trim().toLowerCase();
  return v.includes("comercial") || v.includes("oficina") || v === "local";
}

export function isBrPrivadoEdificio(pt: string): boolean {
  const v = (pt ?? "").trim().toLowerCase();
  return v.includes("edificio");
}

export function isBrPrivadoProyectoNuevo(pt: string): boolean {
  const v = (pt ?? "").trim().toLowerCase();
  return v.includes("proyecto") || v.includes("nuevo");
}
