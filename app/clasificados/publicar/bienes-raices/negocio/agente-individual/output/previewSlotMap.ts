/**
 * Mapa explícito campo → slot de vista previa (documentación; la lógica está en `mapAgenteIndividualResidencialToPreview`).
 *
 * tipoPublicacionFijo → hero.operationLine (fijo: «Venta residencial»)
 * titulo → hero.title
 * precio → hero.priceDisplay
 * ciudad, areaCiudad, direccion → hero.locationLine
 * estadoAnuncio → hero.statusPill
 * recamaras, banos, tamanoInteriorSqft → hero.quickFacts
 *
 * tipoPropiedadCodigo, tipoPropiedadOtro, subtipoPropiedad → propertyRows «Tipo de propiedad»
 * detalle numérico / condicionPropiedad → propertyRows
 *
 * destacados[*] → destacadosLabels
 * descripcionPrincipal, notasAdicionales → cuerpo de descripción
 *
 * agente* → sidebar (nombre, título, foto, licencia, bio, redes, sitio, área de servicio, idiomas)
 *
 * listadoUrl | listadoArchivoDataUrl → cta.verListadoHref / verMlsHref (si activos)
 * tourUrl|tourDataUrl → cta.verTourHref; brochureUrl|brochureDataUrl → cta.verFolletoHref
 *
 * extras (open house, asesor, puntos, transporte) → extras.*
 *
 * Nota: `tipoPublicacion`/`enlaceListado`/`media`/`detalles`/`agente`/`cta`/`extras` anidados legacy
 * se migran en `mergePartialAgenteIndividualResidencial` y no forman parte del estado nuevo.
 */
export const AGENTE_INDIVIDUAL_RESIDENCIAL_PREVIEW_SLOT_MAP_NOTE =
  "agente-individual/residencial: ver comentarios en este archivo y en mapAgenteIndividualResidencialToPreview.ts";
