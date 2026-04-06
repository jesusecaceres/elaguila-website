/**
 * PHASE 1 — Hard slot audit: AgenteIndividualResidencialFormState → approved preview output.
 * Status: wired | excluded | N/A
 *
 * A. HERO / SUMMARY — wired: titulo, precio, ciudad, areaCiudad, direccion, estadoAnuncio (PreviewPage + format).
 *     tipoPublicacionFijo — wired: formatTipoPublicacionFijoLine → operation line under title.
 * B. QUICK FACTS — wired: buildQuickFacts by categoriaPropiedad (residencial: beds/baths/sqft/year/lot; comercial: interior/lot/offices/baths/levels/parking; terreno: lot).
 * C. GALLERY — wired: buildGalleryModel (fotosDataUrls, fotoPortadaIndex, videoUrl|videoDataUrl, tourUrl|tourDataUrl, brochureUrl|brochureDataUrl).
 * D. PROPERTY DETAILS — wired: buildPropertyDetailRows by categoriaPropiedad (residencial / comercial / terreno_lote row sets).
 * E. FEATURES — wired: buildDestacadosLabels + residencial/comercial/terreno destacados defs.
 * F. DESCRIPTION — wired: descripcionPrincipal, notasAdicionales.
 * G. AGENT CARD — wired: agenteFotoDataUrl, agenteNombre, agenteTitulo, agenteLicencia, agenteTelefonoPersonal/Oficina, agenteWhatsapp, agentePrincipalLlamadas, agenteSitioWeb, correoPrincipal (legacy telefonoPrincipal migrado), agenteAreaServicio, agenteIdiomas.
 * H. MARCA — wired behind mostrarMarcaEnTarjeta: marcaNombre, marcaLogoDataUrl, marcaLicencia, marcaSitioWeb (hasBrandBlockVisible + rail).
 * I. SOCIALS — wired: buildContactModel social* (agente principal) + permitirVerRedes; segundo agente: buildSecondAgentSocialHrefs en rail.
 * J. CTA — wired: buildContactModel (all permitir* + dedicated fields + fallbacks documented in agenteResidencialPreviewFormat buildContactModel).
 * K. LISTING FALLBACK — wired: listadoBloqueHref, listadoUrl, listadoArchivoDataUrl/Nombre in hrefListadoCompleto / listadoDownloadName.
 * L. EXTRAS — wired: buildOpenHouseSlotSummaries / normalizeOpenHouseSlots, buildBrokerSupportBlock (incl. legado asesor financiero → merge), map from buildMapQuery (direccion+ciudad+areaCiudad).
 *
 * Intentionally excluded (product): puntos cercanos, transporte, bio / agenteBioCorta (stripped in merge).
 */

export {};
