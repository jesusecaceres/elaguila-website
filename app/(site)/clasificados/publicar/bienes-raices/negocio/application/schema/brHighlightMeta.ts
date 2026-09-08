/** Preset highlights: keys match `highlightPresets` in form state. */
export const BR_HIGHLIGHT_PRESET_DEFS: Array<{ key: string; label: string }> = [
  { key: "piscina", label: "Alberca / piscina" },
  { key: "cocinaRemodelada", label: "Cocina remodelada" },
  { key: "electrodomesticosLujo", label: "Electrodomésticos de lujo" },
  { key: "patio", label: "Patio" },
  { key: "balcon", label: "Balcón" },
  { key: "vista", label: "Vista" },
  { key: "comunidadCerrada", label: "Comunidad cerrada" },
  { key: "techosAltos", label: "Techos altos" },
  { key: "cuartoPrincipalGrande", label: "Recámara principal amplia" },
  { key: "walkInCloset", label: "Walk-in closet" },
  { key: "oficinaEnCasa", label: "Oficina en casa" },
  { key: "panelesSolares", label: "Paneles solares" },
  { key: "smartHome", label: "Smart home" },
  { key: "chimenea", label: "Chimenea" },
  { key: "lavanderia", label: "Lavandería" },
  { key: "estacionamientoTechado", label: "Estacionamiento techado" },
  { key: "accesoControlado", label: "Acceso controlado" },
  { key: "elevador", label: "Elevador" },
  { key: "terraza", label: "Terraza" },
  { key: "gimnasio", label: "Gimnasio" },
  { key: "amenidadesDesarrollo", label: "Amenidades del desarrollo" },
  // Final Completion item 11 — additive canonical entries, reconciled in from BR Negocio's
  // separate 15-id AgenteResidencialDestacadoId vocabulary (agenteIndividualResidencialFormState.ts).
  // Adding these here (rather than leaving them BR-Negocio-only) lets AGENTE_RES_TO_HIGHLIGHT_PRESET
  // map every Negocio highlight to a stable structured preset instead of free text — no existing
  // key is renamed or removed, so no published listing's stored highlight data is affected.
  { key: "sotano", label: "Sótano" },
  { key: "garaje", label: "Garaje" },
  { key: "portonElectrico", label: "Portón eléctrico" },
  { key: "adu", label: "ADU / casita" },
  { key: "remodelada", label: "Remodelada" },
  { key: "nuevaConstruccion", label: "Nueva construcción" },
];
