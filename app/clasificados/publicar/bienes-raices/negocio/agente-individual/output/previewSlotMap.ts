/**
 * Mapa campo → slot de plantilla (documentación). Lógica: `mapAgenteIndividualResidencialToPreview`.
 *
 * professionalCard.agentPhotoUrl ← agenteFotoDataUrl
 * professionalCard.agentName ← agenteNombre
 * professionalCard.agentTitle ← agenteTitulo
 * professionalCard.agentLicenseLine ← agenteLicencia
 * professionalCard.agentBio ← agenteBioCorta
 * professionalCard.phoneDisplay / emailDisplay ← telefonoPrincipal, correoPrincipal
 * professionalCard.brandLogoUrl ← marcaLogoDataUrl
 * professionalCard.brandName ← marcaNombre
 * professionalCard.brandLicenseLine ← marcaLicencia
 * professionalCard.brandWebsiteHref ← marcaSitioWeb
 *
 * social.instagram | .facebook | .youtube | .tiktok | .x | .otro ← mismos campos en estado
 *
 * contactRail.* ← toggles + cta* (ver mapper para respaldos documentados)
 *
 * listado bloque propiedad: listadoUrl | listadoArchivoDataUrl (información básica)
 */
export const AGENTE_INDIVIDUAL_RESIDENCIAL_PREVIEW_SLOT_MAP_NOTE =
  "agente-individual/residencial: ver este archivo y mapAgenteIndividualResidencialToPreview.ts";
