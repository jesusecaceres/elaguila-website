/**
 * Mapa explícito campo → slot de preview (documentación; la lógica está en `mapAgenteIndividualResidencialToPreview`).
 *
 * listing.titulo → hero.title
 * listing.tipoPublicacion → hero.operationLine
 * listing.ciudad + listing.areaCiudad + listing.direccion → hero.locationLine
 * listing.precio → hero.priceDisplay
 * listing.estadoAnuncio → hero.statusPill
 * detalles (recámaras, baños, tamanoInterior) → hero.quickFacts
 * detalles.* → propertyRows.*
 * destacados[*] → destacadosLabels[]
 * descripcionPrincipal → descripcion card
 * notasAdicionales → notas card
 * agente.fotoUrl → sidebar.photoUrl
 * agente.nombre → sidebar.name
 * agente.titulo → sidebar.title
 * agente.marcaOficina → sidebar.marcaOficina
 * agente.telefono → sidebar.phoneDisplay + CTA tel:/WhatsApp
 * agente.email → sidebar.email + mailto CTAs
 * agente.licencia → sidebar.licenciaLine
 * agente.sitioWeb → sidebar.websiteHref
 * agente.redes[] → sidebar.socialLinks
 * media.photoUrls + primaryImageIndex → media.heroUrl / secondaryUrls
 * media video/tour/brochure → media.videoEmbedUrl / tourHref / brochureHref
 * enlaceListado → cta.verListadoHref (si toggle)
 * cta.* + destinos anteriores → cta.* (sólo visible con href real)
 * extras → extras.* (módulos inferiores)
 *
 * No se muestran en preview: campos vacíos de extras opcionales (se omiten bloques).
 */

export const PREVIEW_SLOT_MAP_NOTE =
  "agente-individual/residencial: ver comentarios en este archivo y en mapAgenteIndividualResidencialToPreview.ts";
