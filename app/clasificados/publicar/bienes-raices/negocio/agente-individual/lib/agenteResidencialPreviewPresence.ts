/**
 * Qué secciones tienen contenido — patrón Autos (`autoDealerPresence`).
 */
import type { AgenteIndividualResidencialFormState } from "../schema/agenteIndividualResidencialFormState";
import {
  buildAsesorBlock,
  buildDestacadosLabels,
  buildGalleryModel,
  buildMapQuery,
  buildOpenHouseSummary,
  buildPropertyDetailRows,
  buildQuickFacts,
  trim,
  videoPlayableUrl,
  tourMediaHref,
  brochureMediaHref,
} from "./agenteResidencialPreviewFormat";

export function hasGalleryVisual(s: AgenteIndividualResidencialFormState): boolean {
  const g = buildGalleryModel(s);
  return Boolean(
    g.mainUrl ||
      g.secondary1 ||
      g.secondary2 ||
      g.videoDataUrl ||
      g.videoExternalHref ||
      g.tourOrPlan.href,
  );
}

export function hasTitleBand(s: AgenteIndividualResidencialFormState): boolean {
  return Boolean(trim(s.titulo) || trim(s.precio) || trim(s.ciudad) || trim(s.areaCiudad) || trim(s.direccion));
}

export function hasQuickFacts(s: AgenteIndividualResidencialFormState): boolean {
  return buildQuickFacts(s).length > 0;
}

export function hasPropertyDetails(s: AgenteIndividualResidencialFormState): boolean {
  return buildPropertyDetailRows(s).length > 0;
}

export function hasFeatures(s: AgenteIndividualResidencialFormState): boolean {
  return buildDestacadosLabels(s).length > 0;
}

export function hasDescription(s: AgenteIndividualResidencialFormState): boolean {
  return Boolean(trim(s.descripcionPrincipal));
}

export function hasNotas(s: AgenteIndividualResidencialFormState): boolean {
  return Boolean(trim(s.notasAdicionales));
}

export function hasAgentOrContactSurface(s: AgenteIndividualResidencialFormState): boolean {
  return Boolean(
    trim(s.agenteNombre) ||
      trim(s.agenteTitulo) ||
      trim(s.agenteFotoDataUrl) ||
      trim(s.agenteLicencia) ||
      trim(s.telefonoPrincipal) ||
      trim(s.correoPrincipal) ||
      trim(s.agenteAreaServicio) ||
      trim(s.agenteIdiomas),
  );
}

export function hasLowerExtras(s: AgenteIndividualResidencialFormState): boolean {
  const mapQ = buildMapQuery(s);
  return Boolean(buildOpenHouseSummary(s) || buildAsesorBlock(s) || mapQ);
}

export function hasAnyMediaOrTourSlot(s: AgenteIndividualResidencialFormState): boolean {
  return Boolean(
    videoPlayableUrl(s) || tourMediaHref(s) || brochureMediaHref(s) || buildGalleryModel(s).mainUrl,
  );
}
