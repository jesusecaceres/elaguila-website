/**
 * Maps BR/Rentas negocio form identity blocks → `listings.business_meta` JSON (see `businessListingContract.ts`).
 */

import type { BienesRaicesNegocioFormState } from "@/app/clasificados/publicar/bienes-raices/negocio/application/schema/bienesRaicesNegocioFormState";

function trim(s: unknown): string {
  if (s == null) return "";
  return typeof s === "string" ? s.trim() : String(s).trim();
}

function joinRedes(lines: string[]): string {
  return lines.map((x) => trim(x)).filter(Boolean).join("\n");
}

/**
 * Produces a JSON string suitable for `listings.business_meta`, or null when nothing to store.
 */
export function buildBusinessMetaJsonFromBienesRaicesNegocioState(s: BienesRaicesNegocioFormState): string | null {
  const meta: Record<string, string> = {};
  const adv = s.advertiserType;

  if (adv === "agente_individual") {
    const id = s.identityAgente;
    if (trim(id.nombre)) meta.negocioAgente = trim(id.nombre);
    if (trim(id.rol)) meta.negocioCargo = trim(id.rol);
    if (trim(id.brokerage)) meta.negocioNombreCorreduria = trim(id.brokerage);
    if (trim(id.licencia)) meta.negocioLicencia = trim(id.licencia);
    if (trim(id.telOficina)) meta.negocioTelOficina = trim(id.telOficina);
    if (trim(id.email)) meta.negocioEmail = trim(id.email);
    if (trim(id.sitioWeb)) meta.negocioSitioWeb = trim(id.sitioWeb);
    const redes = joinRedes(id.redes ?? []);
    if (redes) meta.negocioRedes = redes;
    if (trim(id.fotoUrl)) meta.negocioFotoAgenteUrl = trim(id.fotoUrl);
    if (trim(id.logoBrokerageUrl)) meta.negocioLogoUrl = trim(id.logoBrokerageUrl);
    if (trim(id.idiomas)) meta.negocioIdiomas = trim(id.idiomas);
    if (trim(id.areasServicio)) meta.negocioZonasServicio = trim(id.areasServicio);
    if (trim(id.bio)) meta.negocioDescripcion = trim(id.bio);
  } else if (adv === "equipo_agentes") {
    const id = s.identityEquipo;
    if (trim(id.nombreEquipo)) meta.negocioNombre = trim(id.nombreEquipo);
    if (trim(id.brokerage)) meta.negocioNombreCorreduria = trim(id.brokerage);
    if (trim(id.telGeneral)) meta.negocioTelOficina = trim(id.telGeneral);
    if (trim(id.email)) meta.negocioEmail = trim(id.email);
    if (trim(id.sitioWeb)) meta.negocioSitioWeb = trim(id.sitioWeb);
    const redes = joinRedes(id.redes ?? []);
    if (redes) meta.negocioRedes = redes;
    if (trim(id.logoUrl)) meta.negocioLogoUrl = trim(id.logoUrl);
    if (trim(id.bio)) meta.negocioDescripcion = trim(id.bio);
    if (trim(id.agentePrincipalNombre)) meta.negocioAgente = trim(id.agentePrincipalNombre);
    if (trim(id.agentePrincipalRol)) meta.negocioCargo = trim(id.agentePrincipalRol);
    if (trim(id.segundoAgenteNombre)) {
      meta.negocioCoAgente = [trim(id.segundoAgenteNombre), trim(id.segundoAgenteRol), trim(id.segundoAgenteTelefono)]
        .filter(Boolean)
        .join(" · ");
    }
  } else if (adv === "oficina_brokerage") {
    const id = s.identityOficina;
    if (trim(id.nombreOficina)) meta.negocioNombre = trim(id.nombreOficina);
    if (trim(id.logoUrl)) meta.negocioLogoUrl = trim(id.logoUrl);
    if (trim(id.telPrincipal)) meta.negocioTelOficina = trim(id.telPrincipal);
    if (trim(id.email)) meta.negocioEmail = trim(id.email);
    if (trim(id.sitioWeb)) meta.negocioSitioWeb = trim(id.sitioWeb);
    const redes = joinRedes(id.redes ?? []);
    if (redes) meta.negocioRedes = redes;
    if (trim(id.horario)) meta.negocioHorario = trim(id.horario);
    if (trim(id.bio)) meta.negocioDescripcion = trim(id.bio);
    if (trim(id.areasServicio)) meta.negocioZonasServicio = trim(id.areasServicio);
  } else if (adv === "constructor_desarrollador") {
    const id = s.identityConstructor;
    if (trim(id.nombreDesarrollador)) meta.negocioNombre = trim(id.nombreDesarrollador);
    if (trim(id.logoUrl)) meta.negocioLogoUrl = trim(id.logoUrl);
    if (trim(id.tel)) meta.negocioTelOficina = trim(id.tel);
    if (trim(id.email)) meta.negocioEmail = trim(id.email);
    if (trim(id.sitioWeb)) meta.negocioSitioWeb = trim(id.sitioWeb);
    const redes = joinRedes(id.redes ?? []);
    if (redes) meta.negocioRedes = redes;
    if (trim(id.descripcionProyecto)) meta.negocioDescripcion = trim(id.descripcionProyecto);
  }

  const sa = s.segundoAgente;
  if (trim(sa.nombre) && !meta.negocioCoAgente) {
    meta.negocioCoAgente = [trim(sa.nombre), trim(sa.rol), trim(sa.telefono), trim(sa.email)].filter(Boolean).join(" · ");
  }

  const fin = s.asesorFinanciero;
  if (trim(fin.nombre)) {
    meta.negocioSocioFinanciero = [trim(fin.nombre), trim(fin.compania), trim(fin.telefono), trim(fin.email)].filter(Boolean).join(" · ");
  }

  return Object.keys(meta).length ? JSON.stringify(meta) : null;
}
