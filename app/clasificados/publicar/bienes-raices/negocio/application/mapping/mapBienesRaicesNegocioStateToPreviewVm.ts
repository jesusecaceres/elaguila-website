/**
 * Implementación del contrato descrito en `brNegocioInputToPreviewMap.ts`.
 * Único lugar donde el estado del formulario se convierte en `BienesRaicesNegocioPreviewVm`.
 */
import type { BienesRaicesNegocioFormState, BienesRaicesAdvertiserType, DeepDetailGroupKey } from "../schema/bienesRaicesNegocioFormState";
import { deepDetailGroupsForPublication } from "../schema/brNegocioBranching";
import { BR_DEEP_FIELD_LABELS, BR_DEEP_HEADINGS } from "../schema/brDeepDetailMeta";
import { BR_HIGHLIGHT_PRESET_DEFS } from "../schema/brHighlightMeta";
import type {
  BienesRaicesNegocioPreviewVm,
  BienesRaicesPreviewDeepBlockVm,
  BienesRaicesPreviewDetailClusterVm,
  BienesRaicesPreviewFact,
  BienesRaicesPreviewLocationVm,
  BienesRaicesPreviewQuickFactVm,
} from "./bienesRaicesNegocioPreviewVm";

const LISTING_STATUS_LABEL: Record<string, string> = {
  en_venta: "En venta",
  en_renta: "En renta",
  disponible_pronto: "Disponible pronto",
  preconstruccion: "Preconstrucción",
  bajo_contrato: "Bajo contrato",
};

const HIGHLIGHT_LABELS_ES: Record<string, string> = Object.fromEntries(BR_HIGHLIGHT_PRESET_DEFS.map((d) => [d.key, d.label]));

function trim(s: string): string {
  return (s ?? "").trim();
}

function bulletsFromGroup(
  group: DeepDetailGroupKey,
  data: Record<string, string>,
  labels: Record<string, string>
): string[] {
  const out: string[] = [];
  for (const [key, label] of Object.entries(labels)) {
    const v = trim(data[key] ?? "");
    if (!v) continue;
    if (group === "observacionesAgente" && key === "observacionesPrivadas") continue;
    out.push(`${label}: ${v}`);
  }
  return out;
}

function formatPrice(raw: string): string {
  const t = trim(raw);
  if (!t) return "—";
  const n = Number(String(t).replace(/[^0-9.]/g, ""));
  if (Number.isFinite(n)) {
    try {
      return new Intl.NumberFormat("es-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
    } catch {
      return t;
    }
  }
  return t;
}

function bathLine(complete: string, half: string): string {
  const c = trim(complete);
  const h = trim(half);
  const parts: string[] = [];
  if (c) parts.push(c);
  if (h) parts.push(`${h} medios`);
  return parts.length ? parts.join(" + ") : "—";
}

function buildAddress(s: BienesRaicesNegocioFormState): string {
  const parts = [trim(s.direccion), trim(s.colonia), trim(s.ciudad), trim(s.estado), trim(s.codigoPostal)].filter(Boolean);
  return parts.length ? parts.join(", ") : "—";
}

function publicationOperationSummary(s: BienesRaicesNegocioFormState): string {
  const pub = s.publicationType;
  const map: Record<string, string> = {
    residencial_venta: "Venta residencial",
    residencial_renta: "Renta residencial",
    comercial: "Inmueble comercial",
    terreno: "Terreno / lote",
    proyecto_nuevo: "Proyecto nuevo",
    multifamiliar_inversion: "Multifamiliar / inversión",
  };
  const base = pub ? map[pub] ?? "—" : "—";
  if (s.listingStatus === "bajo_contrato") return `${base} · ${LISTING_STATUS_LABEL.bajo_contrato}`;
  return base;
}

function buildPropertyDetails(s: BienesRaicesNegocioFormState): BienesRaicesPreviewFact[] {
  const pub = s.publicationType;
  const rows: BienesRaicesPreviewFact[] = [
    { label: "Tipo", value: trim(s.tipoPropiedad) || "—" },
    { label: "Subtipo", value: trim(s.propertySubtype) || "—" },
    { label: "Operación", value: publicationOperationSummary(s) },
  ];

  if (pub === "terreno") {
    rows.push(
      { label: "Tamaño del lote", value: trim(s.tamanoLote) || "—" },
      { label: "Dimensiones / frente", value: trim(s.deepDetails.loteTerreno.dimensiones) || "—" },
      { label: "Zonificación", value: trim(s.deepDetails.loteTerreno.zonificacion) || "—" },
      { label: "Uso de suelo", value: trim(s.deepDetails.loteTerreno.usoSuelo) || "—" },
      {
        label: "Servicios",
        value:
          [trim(s.deepDetails.utilidades.agua), trim(s.deepDetails.utilidades.electricidad), trim(s.deepDetails.utilidades.alcantarillado)]
            .filter(Boolean)
            .join(", ") || "—",
      }
    );
    return rows;
  }

  if (pub === "comercial") {
    rows.push(
      { label: "Pies cuadrados", value: trim(s.piesCuadrados) || "—" },
      { label: "Baños", value: bathLine(s.banosCompletos, s.mediosBanos) },
      { label: "Estacionamientos", value: trim(s.estacionamientos) || "—" },
      { label: "Uso", value: trim(s.deepDetails.tipoYEstilo.uso) || "—" },
      { label: "Niveles", value: trim(s.niveles) || "—" },
      { label: "Condición", value: trim(s.condicion) || "—" }
    );
    if (trim(s.amueblado)) rows.push({ label: "Amueblado", value: trim(s.amueblado) });
    if (trim(s.hoaSiNo)) rows.push({ label: "HOA", value: trim(s.hoaSiNo) });
    if (trim(s.cuotaHoa)) rows.push({ label: "Cuota HOA", value: trim(s.cuotaHoa) });
    return rows;
  }

  if (pub === "multifamiliar_inversion") {
    rows.push(
      { label: "Unidades", value: trim(s.invNumUnidades) || "—" },
      { label: "Ocupación", value: trim(s.invOcupacion) || "—" },
      { label: "Renta actual", value: trim(s.invRentaActual) || "—" },
      { label: "Cap rate", value: trim(s.invCapRate) || "—" },
      { label: "Ingreso estimado", value: trim(s.invIngresoEstimado) || "—" },
      { label: "Pies cuadrados", value: trim(s.piesCuadrados) || "—" },
      { label: "Estacionamientos", value: trim(s.estacionamientos) || "—" }
    );
    return rows;
  }

  if (pub === "proyecto_nuevo") {
    rows.push(
      { label: "Recámaras", value: trim(s.recamaras) || "—" },
      { label: "Baños", value: bathLine(s.banosCompletos, s.mediosBanos) },
      { label: "Pies cuadrados", value: trim(s.piesCuadrados) || "—" },
      { label: "Estacionamientos", value: trim(s.estacionamientos) || "—" },
      { label: "Comunidad", value: trim(s.proyectoComunidad) || "—" },
      {
        label: "Modelo / fase",
        value: [trim(s.proyectoModelo), trim(s.proyectoEtapa)].filter(Boolean).join(" · ") || "—",
      },
      { label: "Entrega estimada", value: trim(s.proyectoEntregaEstimada) || "—" },
      { label: "Unidades disponibles", value: trim(s.proyectoUnidadesDisponibles) || "—" }
    );
    return rows;
  }

  rows.push(
    { label: "Recámaras", value: trim(s.recamaras) || "—" },
    { label: "Baños", value: bathLine(s.banosCompletos, s.mediosBanos) },
    { label: "Pies cuadrados", value: trim(s.piesCuadrados) || "—" },
    { label: "Lote", value: trim(s.tamanoLote) || "—" },
    { label: "Estacionamientos", value: trim(s.estacionamientos) || "—" },
    { label: "Condición", value: trim(s.condicion) || "—" },
    { label: "HOA", value: trim(s.hoaSiNo) || "—" }
  );
  if (trim(s.cuotaHoa)) rows.push({ label: "Cuota HOA", value: trim(s.cuotaHoa) });
  return rows;
}

function buildQuickFacts(s: BienesRaicesNegocioFormState): BienesRaicesPreviewQuickFactVm[] {
  const pub = s.publicationType;
  if (pub === "terreno") {
    return [
      { label: "Lote", value: trim(s.tamanoLote) || "—", icon: "ruler" },
      {
        label: "Zona",
        value: trim(s.deepDetails.loteTerreno.zonificacion) || trim(s.propertySubtype) || "—",
        icon: "pin",
      },
      { label: "Frente / forma", value: trim(s.deepDetails.loteTerreno.dimensiones) || "—", icon: "home" },
      { label: "Topografía", value: trim(s.deepDetails.loteTerreno.topografia) || "—", icon: "sparkle" },
      {
        label: "Servicios",
        value:
          [trim(s.deepDetails.utilidades.agua), trim(s.deepDetails.utilidades.electricidad)].filter(Boolean).join(" · ") || "—",
        icon: "sparkle",
      },
    ];
  }
  if (pub === "comercial") {
    return [
      { label: "Superficie", value: trim(s.piesCuadrados) || "—", icon: "ruler" },
      { label: "Uso", value: trim(s.deepDetails.tipoYEstilo.uso) || "—", icon: "home" },
      { label: "Estacionamientos", value: trim(s.estacionamientos) || "—", icon: "car" },
      { label: "Niveles", value: trim(s.niveles) || "—", icon: "calendar" },
      { label: "Condición", value: trim(s.condicion) || "—", icon: "sparkle" },
    ];
  }
  if (pub === "multifamiliar_inversion") {
    return [
      { label: "Unidades", value: trim(s.invNumUnidades) || "—", icon: "home" },
      { label: "Ocupación", value: trim(s.invOcupacion) || "—", icon: "sparkle" },
      { label: "Renta actual", value: trim(s.invRentaActual) || "—", icon: "calendar" },
      { label: "Cap rate", value: trim(s.invCapRate) || "—", icon: "ruler" },
      { label: "Área", value: trim(s.piesCuadrados) || "—", icon: "ruler" },
    ];
  }
  if (pub === "proyecto_nuevo") {
    return [
      { label: "Modelo", value: trim(s.proyectoModelo) || "—", icon: "home" },
      { label: "Fase", value: trim(s.proyectoEtapa) || "—", icon: "calendar" },
      { label: "Entrega", value: trim(s.proyectoEntregaEstimada) || "—", icon: "calendar" },
      { label: "Desde (pies²)", value: trim(s.piesCuadrados) || "—", icon: "ruler" },
      { label: "Disponibles", value: trim(s.proyectoUnidadesDisponibles) || "—", icon: "sparkle" },
    ];
  }
  return [
    { label: "Habitaciones", value: trim(s.recamaras) || "—", icon: "bed" },
    { label: "Baños", value: bathLine(s.banosCompletos, s.mediosBanos), icon: "bath" },
    { label: "Superficie", value: trim(s.piesCuadrados) || "—", icon: "ruler" },
    { label: "Garajes", value: trim(s.estacionamientos) || "—", icon: "car" },
    { label: "Construido", value: trim(s.anioConstruccion) || "—", icon: "calendar" },
  ];
}

function buildHighlights(s: BienesRaicesNegocioFormState): BienesRaicesPreviewFact[] {
  const rows: BienesRaicesPreviewFact[] = [];
  for (const [k, on] of Object.entries(s.highlightPresets)) {
    if (!on) continue;
    const label = HIGHLIGHT_LABELS_ES[k];
    if (label) rows.push({ label: "Destacado", value: label });
  }
  for (const line of s.customHighlightsText.split("\n")) {
    const t = trim(line);
    if (t) rows.push({ label: "Personalizado", value: t });
  }
  return rows.length ? rows : [{ label: "Destacados", value: "Agrega características en el formulario." }];
}

const LOWER_PAGE_EXCLUDED_FROM_TECHNICAL: DeepDetailGroupKey[] = ["escuelasUbicacion", "comunidadHoa"];

const DETAIL_CLUSTER_DEFS: { id: string; title: string; blockIds: DeepDetailGroupKey[] }[] = [
  { id: "diseno", title: "Diseño y estructura", blockIds: ["tipoYEstilo", "construccion"] },
  { id: "espacios", title: "Interior y exterior", blockIds: ["interior", "exterior"] },
  { id: "servicios", title: "Estacionamiento y utilidades", blockIds: ["estacionamiento", "utilidades"] },
  { id: "lote", title: "Lote y terreno", blockIds: ["loteTerreno"] },
  { id: "finanzas", title: "Finanzas e identificación", blockIds: ["financiera", "identificadores"] },
  { id: "agente", title: "Observaciones y visitas", blockIds: ["observacionesAgente"] },
];

function factsFromPartialGroup(
  group: DeepDetailGroupKey,
  data: Record<string, string>,
  labels: Record<string, string>,
  onlyKeys?: string[]
): BienesRaicesPreviewFact[] {
  const rows: BienesRaicesPreviewFact[] = [];
  const entries: [string, string][] = onlyKeys
    ? onlyKeys.map((k) => [k, labels[k] ?? k])
    : Object.entries(labels);
  for (const [key, label] of entries) {
    if (!label) continue;
    const v = trim(data[key] ?? "");
    if (!v) continue;
    if (group === "observacionesAgente" && key === "observacionesPrivadas") continue;
    rows.push({ label, value: v });
  }
  return rows;
}

function buildSchoolRows(s: BienesRaicesNegocioFormState): BienesRaicesPreviewFact[] {
  return factsFromPartialGroup(
    "escuelasUbicacion",
    s.deepDetails.escuelasUbicacion,
    BR_DEEP_FIELD_LABELS.escuelasUbicacion,
    ["distrito", "primaria", "secundaria", "preparatoria"]
  );
}

function buildCommunityRows(s: BienesRaicesNegocioFormState): BienesRaicesPreviewFact[] {
  const rows = factsFromPartialGroup(
    "escuelasUbicacion",
    s.deepDetails.escuelasUbicacion,
    BR_DEEP_FIELD_LABELS.escuelasUbicacion,
    ["vecindario", "zona", "puntosCercanos", "transporte"]
  );
  const pub = s.publicationType;
  if (pub === "proyecto_nuevo") {
    if (trim(s.proyectoComunidad)) rows.push({ label: "Comunidad / desarrollo", value: trim(s.proyectoComunidad) });
    if (trim(s.proyectoAmenidades)) rows.push({ label: "Amenidades del desarrollo", value: trim(s.proyectoAmenidades) });
  }
  return rows;
}

function buildHoaDevelopmentRows(s: BienesRaicesNegocioFormState): BienesRaicesPreviewFact[] {
  const rows: BienesRaicesPreviewFact[] = factsFromPartialGroup(
    "comunidadHoa",
    s.deepDetails.comunidadHoa,
    BR_DEEP_FIELD_LABELS.comunidadHoa
  );
  const pub = s.publicationType;
  const hoaLine =
    trim(s.hoaSiNo) || trim(s.cuotaHoa)
      ? [
          trim(s.hoaSiNo) === "si" ? "HOA: sí" : trim(s.hoaSiNo) === "no" ? "HOA: no" : trim(s.hoaSiNo) || "",
          trim(s.cuotaHoa) ? `Cuota: ${trim(s.cuotaHoa)}` : "",
        ]
          .filter(Boolean)
          .join(" · ")
      : "";
  if (hoaLine) rows.unshift({ label: "Resumen HOA (listado)", value: hoaLine });
  if (pub === "proyecto_nuevo") {
    if (trim(s.proyectoModelo)) rows.push({ label: "Modelo (desarrollo)", value: trim(s.proyectoModelo) });
    if (trim(s.proyectoEtapa)) rows.push({ label: "Etapa", value: trim(s.proyectoEtapa) });
    if (trim(s.proyectoEntregaEstimada))
      rows.push({ label: "Entrega estimada", value: trim(s.proyectoEntregaEstimada) });
    if (trim(s.proyectoUnidadesDisponibles))
      rows.push({ label: "Unidades disponibles", value: trim(s.proyectoUnidadesDisponibles) });
  }
  return rows;
}

function buildLocationVm(s: BienesRaicesNegocioFormState): BienesRaicesPreviewLocationVm {
  const line1 = trim(s.direccion);
  const colonia = trim(s.colonia);
  const city = trim(s.ciudad);
  const st = trim(s.estado);
  const zip = trim(s.codigoPostal);
  const cityPart = [city, [st, zip].filter(Boolean).join(" ")].filter(Boolean).join(", ");
  const fullAddress = buildAddress(s);
  const mapsQuery = [line1, colonia, city, st, zip].filter(Boolean).join(", ");
  const mapsUrl = mapsQuery ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapsQuery)}` : null;
  const hasMeaningfulAddress = Boolean(line1 || colonia || (city && st) || zip);
  return {
    line1,
    colonia,
    cityStateZip: cityPart,
    fullAddress,
    mapsUrl,
    hasMeaningfulAddress,
  };
}

function buildTechnicalDeepBlocks(s: BienesRaicesNegocioFormState): BienesRaicesPreviewDeepBlockVm[] {
  const keys = deepDetailGroupsForPublication(s.publicationType).filter(
    (k) => !LOWER_PAGE_EXCLUDED_FROM_TECHNICAL.includes(k)
  );
  return keys.map((key) => {
    const bullets = bulletsFromGroup(key, s.deepDetails[key], BR_DEEP_FIELD_LABELS[key]);
    return {
      id: key,
      heading: BR_DEEP_HEADINGS[key],
      bullets,
      hasContent: bullets.length > 0,
    };
  });
}

function buildDetailClusters(blocksById: Map<string, BienesRaicesPreviewDeepBlockVm>): BienesRaicesPreviewDetailClusterVm[] {
  const clusters: BienesRaicesPreviewDetailClusterVm[] = [];
  for (const def of DETAIL_CLUSTER_DEFS) {
    const blocks = def.blockIds
      .map((id) => blocksById.get(id))
      .filter((b): b is BienesRaicesPreviewDeepBlockVm => Boolean(b && b.hasContent));
    if (blocks.length) clusters.push({ id: def.id, title: def.title, blocks });
  }
  return clusters;
}

function showSchoolsModule(pub: BienesRaicesNegocioFormState["publicationType"], schoolRows: BienesRaicesPreviewFact[]): boolean {
  if (schoolRows.length === 0) return false;
  if (pub === "terreno" || pub === "comercial") return false;
  return true;
}

function showCommunityModule(
  _pub: BienesRaicesNegocioFormState["publicationType"],
  communityRows: BienesRaicesPreviewFact[]
): boolean {
  return communityRows.length > 0;
}

function primaryPhone(s: BienesRaicesNegocioFormState, adv: BienesRaicesAdvertiserType): string {
  switch (adv) {
    case "agente_individual":
      return trim(s.identityAgente.telDirecto) || trim(s.identityAgente.telOficina);
    case "equipo_agentes":
      return trim(s.identityEquipo.telGeneral);
    case "oficina_brokerage":
      return trim(s.identityOficina.telPrincipal);
    case "constructor_desarrollador":
      return trim(s.identityConstructor.tel);
    default:
      return "";
  }
}

function contactRailTitle(adv: BienesRaicesAdvertiserType): string {
  switch (adv) {
    case "equipo_agentes":
      return "Contactar al equipo";
    case "oficina_brokerage":
      return "Contactar a la oficina";
    case "constructor_desarrollador":
      return "Contactar al desarrollador";
    case "agente_individual":
      return "Contactar al agente";
    default:
      return "Contacto";
  }
}

function buildIdentity(s: BienesRaicesNegocioFormState): BienesRaicesNegocioPreviewVm["identity"] {
  const adv = s.advertiserType;
  const trust = s.trust;

  if (adv === "equipo_agentes") {
    const ie = s.identityEquipo;
    const social = ie.redes.map(trim).filter(Boolean).slice(0, 5);
    const photoUrl = trim(ie.imagenUrl) || null;
    const lead = trim(ie.agentePrincipalNombre);
    return {
      photoUrl,
      name: trim(ie.nombreEquipo) || "Equipo",
      role: lead ? `Equipo · liderazgo: ${lead}` : "Equipo de agentes",
      brokerageName: trust.mostrarBrokerage ? trim(ie.brokerage) || "—" : "—",
      brokerageLogoUrl: trim(ie.logoUrl) || null,
      verifiedLine: "Equipo profesional Leonix",
      licenseLine: trim(ie.agentePrincipalRol) ? `Rol principal: ${trim(ie.agentePrincipalRol)}` : "",
      socialChips: trust.mostrarRedes ? social : [],
      profileCtaLabel: "Ver perfil del equipo →",
      hasPhoto: Boolean(photoUrl),
      hasSocialLinks: social.length > 0,
    };
  }

  if (adv === "oficina_brokerage") {
    const io = s.identityOficina;
    const social = io.redes.map(trim).filter(Boolean);
    const photoUrl = trim(io.logoUrl) || null;
    const lead = trim(io.contactoPrincipal);
    return {
      photoUrl,
      name: trim(io.nombreOficina) || "Oficina",
      role: lead ? `Oficina · ${lead}` : "Brokerage",
      brokerageName: trust.mostrarBrokerage ? trim(io.nombreOficina) : "—",
      brokerageLogoUrl: trim(io.logoUrl) || null,
      verifiedLine: "Oficina verificada",
      licenseLine: trim(io.direccionOficina),
      socialChips: trust.mostrarRedes && social.length ? social : [],
      profileCtaLabel: "Ver oficina →",
      hasPhoto: Boolean(photoUrl),
      hasSocialLinks: social.length > 0,
    };
  }

  if (adv === "constructor_desarrollador") {
    const ic = s.identityConstructor;
    const social = ic.redes.map(trim).filter(Boolean);
    const photoUrl = trim(ic.logoUrl) || null;
    const entrega = trim(ic.entregaEstimada);
    return {
      photoUrl,
      name: trim(ic.nombreDesarrollador) || "Desarrollador",
      role: trim(ic.proyectoNombre) || "Proyecto nuevo",
      brokerageName: trust.mostrarBrokerage ? trim(ic.proyectoNombre) : trim(ic.nombreDesarrollador),
      brokerageLogoUrl: trim(ic.logoUrl) || null,
      verifiedLine: entrega ? `Entrega estimada: ${entrega}` : "Desarrollador",
      licenseLine: trim(ic.estadoDesarrollo),
      socialChips: trust.mostrarRedes && social.length ? social : [],
      profileCtaLabel: "Ver centro de ventas →",
      hasPhoto: Boolean(photoUrl),
      hasSocialLinks: social.length > 0,
    };
  }

  const ia = s.identityAgente;
  const social = ia.redes.map(trim).filter(Boolean);
  const lic = trim(ia.licencia);
  const photoUrl = trim(ia.fotoUrl) || null;
  return {
    photoUrl,
    name: trim(ia.nombre) || "Agente",
    role: trim(ia.rol) || "Agente de listado",
    brokerageName: trust.mostrarBrokerage ? trim(ia.brokerage) || "—" : "—",
    brokerageLogoUrl: trim(ia.logoBrokerageUrl) || null,
    verifiedLine: "Agente verificado",
    licenseLine: trust.mostrarLicencia && lic ? `Lic. ${lic}` : "",
    socialChips: trust.mostrarRedes ? social : [],
    profileCtaLabel: "Ver perfil profesional →",
    hasPhoto: Boolean(photoUrl),
    hasSocialLinks: social.length > 0,
  };
}

function buildSecondAgentVm(s: BienesRaicesNegocioFormState): BienesRaicesNegocioPreviewVm["contact"]["secondAgent"] {
  const adv = s.advertiserType;
  if (adv === "equipo_agentes") {
    const n = trim(s.identityEquipo.segundoAgenteNombre);
    if (!n) return null;
    return {
      name: n,
      role: trim(s.identityEquipo.segundoAgenteRol) || "Agente",
      phone: trim(s.identityEquipo.segundoAgenteTelefono) || primaryPhone(s, adv) || "—",
      photoUrl: null,
    };
  }
  if (adv === "agente_individual" && s.identityAgente.segundoAgenteActivo) {
    const sg = s.segundoAgente;
    if (!trim(sg.nombre)) return null;
    return {
      name: trim(sg.nombre),
      role: trim(sg.rol) || "Segundo agente",
      phone: trim(sg.telefono) || "—",
      photoUrl: trim(sg.fotoUrl) || null,
    };
  }
  if (adv === "oficina_brokerage") {
    const sec = trim(s.identityOficina.contactoSecundario);
    if (!sec) return null;
    return {
      name: sec,
      role: "Contacto adicional",
      phone: trim(s.identityOficina.telPrincipal) || "—",
      photoUrl: null,
    };
  }
  if (adv === "constructor_desarrollador") {
    const sec = trim(s.identityConstructor.contactoSecundario);
    if (!sec) return null;
    return {
      name: sec,
      role: "Equipo de ventas",
      phone: trim(s.identityConstructor.tel) || "—",
      photoUrl: null,
    };
  }
  return null;
}

function buildLenderVm(s: BienesRaicesNegocioFormState): BienesRaicesNegocioPreviewVm["contact"]["lender"] {
  const a = s.asesorFinanciero;
  if (!trim(a.nombre)) return null;
  if (!s.asesorFinancieroActivo) return null;
  return {
    name: trim(a.nombre),
    role: trim(a.rol) || "Asesor de préstamos",
    subtitle: [trim(a.compania), trim(a.telefono), trim(a.textoApoyo)].filter(Boolean).join(" · ") || "Financiamiento",
    photoUrl: trim(a.fotoUrl) || null,
  };
}

function extractYoutubeId(url: string): string | null {
  const u = trim(url);
  const m = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/.exec(u);
  return m?.[1] ?? null;
}

function resolveNegocioVideoSlot(slot: BienesRaicesNegocioFormState["media"]["listingVideoSlots"][0]): {
  thumb: string | null;
  playback: string | null;
  youtubeId: string | null;
} {
  if (slot.status === "ready" && trim(slot.playbackUrl)) {
    return { thumb: trim(slot.thumbnailUrl) || null, playback: trim(slot.playbackUrl), youtubeId: null };
  }
  const fb = trim(slot.fallbackUrl);
  if (!fb) return { thumb: null, playback: null, youtubeId: null };
  const yt = extractYoutubeId(fb);
  if (yt) return { thumb: `https://img.youtube.com/vi/${yt}/hqdefault.jpg`, playback: fb, youtubeId: yt };
  if (/\.(png|jpe?g|webp|gif)(\?|$)/i.test(fb)) return { thumb: fb, playback: null, youtubeId: null };
  return { thumb: null, playback: fb, youtubeId: null };
}

function mediaMetaLine(s: BienesRaicesNegocioFormState): string {
  const nPhotos = s.media.photoUrls.filter((u) => trim(u)).length;
  let nVid = 0;
  for (const slot of s.media.listingVideoSlots) {
    const r = resolveNegocioVideoSlot(slot);
    if (r.playback || r.thumb || r.youtubeId) nVid += 1;
  }
  const tour = trim(s.media.virtualTourUrl) ? 1 : 0;
  const nFp = s.media.floorPlanUrls.filter((u) => trim(u)).length;
  const parts: string[] = [];
  parts.push(`${nPhotos} fotos`);
  parts.push(`${Math.min(nVid, 2)} videos`);
  if (tour) parts.push("Tour virtual");
  if (nFp) parts.push("Planos");
  if (trim(s.media.sitePlanUrl) && s.advertiserType === "constructor_desarrollador") parts.push("Plano de sitio");
  return parts.join(" · ");
}

/** Maps application state → preview view-model (single entry point for preview rendering). */
export function mapBienesRaicesNegocioStateToPreviewVm(s: BienesRaicesNegocioFormState): BienesRaicesNegocioPreviewVm {
  const photos = s.media.photoUrls.map(trim).filter(Boolean);
  const cover = Math.min(Math.max(0, s.media.primaryImageIndex), Math.max(0, photos.length - 1));
  const heroUrl = photos.length ? photos[cover]! : null;

  const r0 = resolveNegocioVideoSlot(s.media.listingVideoSlots[0]);
  const r1 = resolveNegocioVideoSlot(s.media.listingVideoSlots[1]);
  const videoThumbUrls: [string | null, string | null] = [r0.thumb, r1.thumb];
  const videoPlaybackUrls: [string | null, string | null] = [
    r0.youtubeId ? null : r0.playback,
    r1.youtubeId ? null : r1.playback,
  ];
  const youtubeIds: [string | null, string | null] = [r0.youtubeId, r1.youtubeId];
  const hasVideo1 = Boolean(r0.playback || r0.thumb || r0.youtubeId);
  const hasVideo2 = Boolean(r1.playback || r1.thumb || r1.youtubeId);

  const descLong = trim(s.descripcionLarga);
  const descShort = trim(s.descripcionCorta);
  const desc = descLong || descShort || "";
  const hasDescription = Boolean(descLong || descShort);

  const highlightRows = buildHighlights(s);
  const hasHighlights =
    highlightRows.length > 0 &&
    !(highlightRows.length === 1 && highlightRows[0]?.label === "Destacados" && /Agrega características/i.test(highlightRows[0]?.value ?? ""));

  const floorPlans = s.media.floorPlanUrls.map(trim).filter(Boolean).slice(0, 3);
  const virtualTourUrl = trim(s.media.virtualTourUrl) || null;
  const sitePlanUrl = s.advertiserType === "constructor_desarrollador" ? trim(s.media.sitePlanUrl) || null : null;

  const technicalDeepBlocks = buildTechnicalDeepBlocks(s);
  const detailClusters = buildDetailClusters(new Map(technicalDeepBlocks.map((b) => [b.id, b])));
  const schoolRows = buildSchoolRows(s);
  const communityRows = buildCommunityRows(s);
  const hoaDevRows = buildHoaDevelopmentRows(s);
  const sitePlanCallout = Boolean(sitePlanUrl && s.advertiserType === "constructor_desarrollador");
  const showHoaDev = hoaDevRows.length > 0 || sitePlanCallout;

  return {
    publicationType: s.publicationType,
    heroTitle: trim(s.titulo) || "Título del anuncio",
    addressLine: buildAddress(s),
    priceDisplay: formatPrice(s.precio),
    listingStatusLabel: LISTING_STATUS_LABEL[s.listingStatus] ?? "En venta",
    operationSummary: publicationOperationSummary(s),
    quickFacts: buildQuickFacts(s),
    contactRailTitle: contactRailTitle(s.advertiserType),
    identity: buildIdentity(s),
    media: {
      heroUrl,
      videoThumbUrls,
      videoPlaybackUrls,
      youtubeIds,
      virtualTourUrl,
      floorPlanUrls: floorPlans,
      sitePlanUrl,
      metaLine: mediaMetaLine(s),
      hasPhotos: photos.length > 0,
      hasVideo1,
      hasVideo2,
      hasVirtualTour: Boolean(virtualTourUrl),
      hasFloorPlans: floorPlans.length > 0,
      hasSitePlan: Boolean(sitePlanUrl),
    },
    propertyDetailsRows: buildPropertyDetails(s),
    highlightsRows: hasHighlights ? highlightRows : [],
    description: desc,
    hasDescription,
    hasHighlights,
    contact: {
      showSolicitarInfo: s.cta.permitirSolicitarInfo,
      showProgramarVisita: s.cta.permitirProgramarVisita,
      showLlamar: s.cta.permitirLlamar,
      showWhatsapp: s.cta.permitirWhatsapp,
      secondAgent: buildSecondAgentVm(s),
      lender: buildLenderVm(s),
    },
    deepBlocks: technicalDeepBlocks,
    detailClusters,
    location: buildLocationVm(s),
    schools: {
      rows: schoolRows,
      showModule: showSchoolsModule(s.publicationType, schoolRows),
    },
    community: {
      rows: communityRows,
      showModule: showCommunityModule(s.publicationType, communityRows),
    },
    hoaDevelopment: {
      rows: hoaDevRows,
      showModule: showHoaDev,
      sitePlanCallout,
    },
    footerNote: "Vista previa generada por Leonix · Podrás editar toda la información antes de publicar.",
  };
}
