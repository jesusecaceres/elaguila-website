/**
 * Full `EnVentaFreeApplicationState`-shaped payloads for manual QA seeding (sessionStorage → publish wizard).
 * Mirrors `app/(site)/clasificados/publicar/en-venta/free/application/schema/enVentaFreeFormState.ts`.
 */

export const MANUAL_QA_MARKER_PREFIX = "EVMQA26";

export type EnVentaManualDept =
  | "electronicos"
  | "hogar"
  | "muebles"
  | "ropa-accesorios"
  | "bebes-ninos"
  | "herramientas"
  | "vehiculos-partes"
  | "deportes"
  | "juguetes-juegos"
  | "coleccionables"
  | "musica-foto-video"
  | "otros";

/** One publish row per department: optional Level-2 + item type aligned with live taxonomy. */
export const EN_VENTA_MANUAL_DEPT_ROWS: Array<{
  dept: EnVentaManualDept;
  evSub: string;
  itemType: string;
  /** Short marker token for `q=` discovery (no spaces). */
  markerToken: string;
}> = [
  { dept: "electronicos", evSub: "phones", itemType: "phone", markerToken: "EVMQA26-EL-PH" },
  { dept: "hogar", evSub: "cocina", itemType: "kitchen", markerToken: "EVMQA26-HO-CK" },
  { dept: "muebles", evSub: "sala", itemType: "sofa", markerToken: "EVMQA26-MU-SL" },
  { dept: "ropa-accesorios", evSub: "ropa", itemType: "tops", markerToken: "EVMQA26-RP-TP" },
  { dept: "bebes-ninos", evSub: "equipo", itemType: "gear", markerToken: "EVMQA26-BN-GQ" },
  { dept: "herramientas", evSub: "manuales", itemType: "hand", markerToken: "EVMQA26-HT-HN" },
  { dept: "vehiculos-partes", evSub: "llantas", itemType: "wheels", markerToken: "EVMQA26-VP-WH" },
  { dept: "deportes", evSub: "ciclismo", itemType: "bike", markerToken: "EVMQA26-DP-BK" },
  { dept: "juguetes-juegos", evSub: "consolas", itemType: "console", markerToken: "EVMQA26-JJ-CN" },
  { dept: "coleccionables", evSub: "arte", itemType: "art", markerToken: "EVMQA26-CL-AR" },
  { dept: "musica-foto-video", evSub: "instrumentos", itemType: "instrument", markerToken: "EVMQA26-MV-IN" },
  { dept: "otros", evSub: "general", itemType: "misc", markerToken: "EVMQA26-OT-GN" },
];

function emptyMuxSlot(slot: 0 | 1) {
  return {
    slot,
    uploadId: "",
    assetId: "",
    playbackId: "",
    playbackUrl: "",
    thumbnailUrl: "",
    durationSeconds: null,
    status: "idle" as const,
    progressPct: 0,
    fileName: "",
    errorMessage: "",
  };
}

export type ManualLane = "privado" | "negocio";

export type BuildManualEnVentaDraftArgs = {
  row: (typeof EN_VENTA_MANUAL_DEPT_ROWS)[number];
  lane: ManualLane;
  plan: "free" | "pro";
  sellerEmail: string;
};

/**
 * Polished Spanish copy; marker appears in description tail for search without crowding the title.
 */
export function buildManualEnVentaDraft(args: BuildManualEnVentaDraftArgs): Record<string, unknown> {
  const { row, lane, plan, sellerEmail } = args;
  const markerLine = `Referencia interna Leonix manual QA: ${args.row.markerToken}`;

  const titles: Record<EnVentaManualDept, { privado: string; negocio: string }> = {
    electronicos: {
      privado: "iPhone 13 mini 128 GB — desbloqueado, batería 91%",
      negocio: "Lote display iPhone 13 mini — inventario tienda (empaque abierto)",
    },
    hogar: {
      privado: "Batidora KitchenAid Artisan 5 qt — poco uso, color crema",
      negocio: "Licuadora industrial Vitamix 5200 — excedente de cafetería (garantía restante)",
    },
    muebles: {
      privado: "Sofá seccional 3 piezas tela performance gris perla",
      negocio: "Sofá modular showroom — liquidación de sala de exposición",
    },
    "ropa-accesorios": {
      privado: "Chamarra denim Levi’s trucker talla M — lavada una vez",
      negocio: "Overstock chamarras denim unisex — surtido tallas S–L",
    },
    "bebes-ninos": {
      privado: "Carriola UPPAbaby Cruz V2 — funda lavada, llantas con buen rodaje",
      negocio: "Sillas para auto Graco Extend2Fit — inventario cierre de temporada",
    },
    herramientas: {
      privado: "Juego llaves combinadas Craftsman 20 pzas métrico",
      negocio: "Rotomartillo DeWalt D25263K — demo ferretería, estuche incluido",
    },
    "vehiculos-partes": {
      privado: "4 llantas Michelin Defender2 205/55R16 — 7/32 restante",
      negocio: "Rines aleación 17\" OEM Honda Civic — juego de cuatro",
    },
    deportes: {
      privado: "Bicicleta híbrida Trek FX 2 talla M — revisada en taller",
      negocio: "Bicis urbanas batch outlet — modelos 2023–2024",
    },
    "juguetes-juegos": {
      privado: "Nintendo Switch OLED blanca + estuche y protector",
      negocio: "Consolas Nintendo Switch OLED — venta al mayoreo mínimo 3 pzas",
    },
    coleccionables: {
      privado: "Grabado botánico enmarcado siglo XX — certificado de procedencia",
      negocio: "Lote láminas vintage arquitectura — ideal galería o marco",
    },
    "musica-foto-video": {
      privado: "Guitarra acústica Taylor GS Mini caoba — humidificador incluido",
      negocio: "Cámara Sony A6400 + lente 16-50 — equipo demo estudio",
    },
    otros: {
      privado: "Caja organizadora industrial 120 L con tapa hermética",
      negocio: "Exhibidor metálico 4 niveles — retiro de local comercial",
    },
  };

  const businessDisplayNames: Record<EnVentaManualDept, string> = {
    electronicos: "Bay Tech Resell Partners LLC",
    hogar: "Cocina y Hogar del Pacífico Inc.",
    muebles: "Showroom Divano SF LLC",
    "ropa-accesorios": "Distribuidora Textil 24 LLC",
    "bebes-ninos": "PequePlanet Retail Co.",
    herramientas: "FerreMart Pro Supply LLC",
    "vehiculos-partes": "AutoPartes Bay LLC",
    deportes: "Outdoor Collective SF LLC",
    "juguetes-juegos": "GameStock NorCal LLC",
    coleccionables: "Galería Horizonte Curado LLC",
    "musica-foto-video": "Estudio Resonancia Baja LLC",
    otros: "Liquidaciones Metro LLC",
  };

  const descriptions: Record<EnVentaManualDept, string> = {
    electronicos:
      "Vendo con transparencia total: sin cuenta iCloud activa, Face ID y cámara funcionando. Incluye cable USB‑C/Lightning original. Entrega en zona céntrica previa cita. No cambios.",
    hogar:
      "Artículo de cocina usado con cuidado. Motor probado en tres velocidades; incluye accesorios de batido estándar. Se entrega limpio y desinfectado. Recibo de compra disponible.",
    muebles:
      "Mueble de sala sin mascotas ni humo. Cojines firmes, fundas removibles lavadas hace dos semanas. Desarme parcial para transporte (llaves incluidas). Medidas en fotos.",
    "ropa-accesorios":
      "Prenda auténtica, corte clásico. Medidas: hombros 44 cm, largo 63 cm. Sin manchas ni roturas; olor neutro. Ideal oficina o fin de semana.",
    "bebes-ninos":
      "Equipo revisado: frenos y mecanismo de plegado operativos. Incluye barra de seguridad y portavasos. Manual digital por QR del fabricante.",
    herramientas:
      "Herramientas de taller casero; sin golpes severos en mangos. Ideal quien arma muebles o bricolaje ligero. Se vende junto; no separo piezas.",
    "vehiculos-partes":
      "Neumáticos sin reparaciones ni burbujas; balanceo reciente. Fecha de DOT legible en costado. Ideal sedán compacto o hatchback.",
    deportes:
      "Bici lista para rodar: cadena lubricada, frenos ajustados, neumáticos con buen dibujo. Ideal desplazamientos 5–15 km.",
    "juguetes-juegos":
      "Consola sin ban; Joy‑Con sin drift evidente en prueba de 30 min. Pantalla con protector desde nueva. Incluye dock y HDMI.",
    coleccionables:
      "Pieza enmarcada con UV filter glass. Procedencia: colección privada CDMX → CA. Listo para colgar (cable incluido).",
    "musica-foto-video":
      "Instrumento con trasteo revisado en taller; cejilla original. Tope de viaje perfecto para apartment. Funda acolchada incluida.",
    otros:
      "Artículo general en buen estado estructural; ideal trastero, mudanza o comercio ligero. Pregunta por medidas exactas antes de acudir.",
  };

  const wear = {
    privado: "Uso doméstico moderado; marcas leves de uso visibles solo de cerca.",
    negocio: "Rotación de inventario: puede presentar empaque reabierto o demo controlada.",
  }[lane];

  const acc = {
    privado: "Incluye accesorios listados en la descripción principal; nada adicional negociado salvo acuerdo escrito.",
    negocio: "Factura simplificada disponible para empresas; términos de recogida acordados por correo.",
  }[lane];

  const extraByDept: Record<EnVentaManualDept, string> = {
    electronicos: "Almacenamiento 128 GB · iOS actualizado en restauración de fábrica · compatible AT&T/T‑Mobile (verificar bandas).",
    hogar: "Voltaje 120 V · cable polarizado · base antideslizante intacta.",
    muebles: "Medidas aproximadas: 240 cm × 95 cm profundidad × 85 cm alto (confirmar en visita).",
    "ropa-accesorios": "Composición según etiqueta del fabricante; lavado en frío recomendado.",
    "bebes-ninos": "Peso máximo recomendado según manual; adaptador recién nacido no incluido.",
    herramientas: "Acero cromo‑vanadio; no completo para uso industrial pesado.",
    "vehiculos-partes": "DOT y semanas de fabricación visibles; compatibilidad OEM verificada por comprador.",
    deportes: "Cuadro aluminio Alpha Gold; horquilla rígida; transmisión 2×8.",
    "juguetes-juegos": "Firmware actualizado; modo avión desactivado para prueba en tienda.",
    coleccionables: "Marco 61×46 cm aprox.; vidrio con protección UV.",
    "musica-foto-video": "Escala 23\" · diapasón ébano laminado · pastillas originales.",
    otros: "Material polipropileno reforzado; ruedas funcionan en superficie lisa.",
  };

  const priceByDept: Record<EnVentaManualDept, { privado: string; negocio: string }> = {
    electronicos: { privado: "349", negocio: "2899" },
    hogar: { privado: "275", negocio: "420" },
    muebles: { privado: "780", negocio: "5400" },
    "ropa-accesorios": { privado: "48", negocio: "360" },
    "bebes-ninos": { privado: "420", negocio: "1850" },
    herramientas: { privado: "65", negocio: "225" },
    "vehiculos-partes": { privado: "220", negocio: "980" },
    deportes: { privado: "520", negocio: "4100" },
    "juguetes-juegos": { privado: "285", negocio: "7200" },
    coleccionables: { privado: "190", negocio: "2400" },
    "musica-foto-video": { privado: "430", negocio: "1650" },
    otros: { privado: "35", negocio: "180" },
  };

  /** Prefix ensures admin queue (`AdminListingsTable` title cell) and `q=` search can find the row. */
  const title = `[${row.markerToken}] ${titles[row.dept][lane]}`;
  const price = priceByDept[row.dept][lane];
  const description = `${descriptions[row.dept]}\n\n${markerLine}`;
  const displayName = lane === "negocio" ? businessDisplayNames[row.dept] : "Lucía Hernández";

  return {
    rama: row.dept,
    evSub: row.evSub,
    itemType: row.itemType,
    condition: lane === "negocio" ? "like-new" : "good",
    title,
    priceIsFree: false,
    price,
    negotiable: "yes" as const,
    description,
    quantity: lane === "negocio" ? "4" : "1",
    brand: lane === "negocio" ? "Leonix Outlet QA" : "Particular verificado",
    model:
      row.dept === "electronicos"
        ? lane === "negocio"
          ? "Lote mixto A2633"
          : "A2482"
        : row.dept === "hogar"
          ? "KSM150PS"
          : row.dept === "muebles"
            ? "SF-SEC-240"
            : row.dept === "ropa-accesorios"
              ? "72345-0134"
              : row.dept === "bebes-ninos"
                ? "CRUZ-V2-2021"
                : row.dept === "herramientas"
                  ? "CMMT99446"
                  : row.dept === "vehiculos-partes"
                    ? "2055516VXL"
                    : row.dept === "deportes"
                      ? "FX-2-M"
                      : row.dept === "juguetes-juegos"
                        ? "HEG-S-KAB"
                        : row.dept === "coleccionables"
                          ? "FRM-61x46"
                          : row.dept === "musica-foto-video"
                            ? "GS-Mini-M"
                            : "SKU-GEN-01",
    images: [] as string[],
    primaryImageIndex: 0,
    city: "San Francisco",
    zip: "94102",
    pickup: true,
    meetup: true,
    localDelivery: true,
    shipping: true,
    shippingNotes: "Envío UPS Ground desde 94102; empaque reforzado y seguimiento en 24 h.",
    pickupDetailNotes: "Recogida acordada en estación Civic Center / UN Plaza en horario diurno.",
    meetupDetailNotes: "Punto de encuentro sugerido: zona Powell BART, siempre en espacio público.",
    localDeliveryDetailNotes: "Radio ~8 millas desde downtown SF; tarifa plana acordada por mensaje.",
    seller_kind: lane === "negocio" ? "business" : "individual",
    displayName,
    phone: "(415) 555-0142",
    email: sellerEmail,
    whatsapp: "(415) 555-0143",
    contactMethod: "both" as const,
    listingVideoUrl:
      plan === "pro"
        ? "https://www.youtube.com/watch?v=668nUCeBUMY"
        : "",
    listingVideoSlots: [emptyMuxSlot(0), emptyMuxSlot(1)],
    confirmListingAccurate: true,
    confirmPhotosRepresentItem: true,
    confirmCommunityRules: true,
    wearNotes: wear,
    accessoriesNotes: acc,
    itemExtraDetails: extraByDept[row.dept],
  };
}
