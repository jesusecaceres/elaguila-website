/**
 * Persistent manual visual-QA fixtures for Autos (Privado + Negocios).
 * Field values mirror live application taxonomies (`BODY_STYLE_OPTIONS`, `FEATURE_OPTIONS`, etc.).
 * Used by `autos-manual-qa-seed.spec.ts`.
 */

/** Grep-friendly tokens embedded in titles for discovery / filter smoke. */
export const MANUAL_QA_MARKERS = {
  privado: "MQA-AUTOS-PRIV-NORCAL",
  negocios: "MQA-AUTOS-NEG-DEALER",
} as const;

/** Every `FEATURE_OPTIONS` label from `app/(site)/publicar/autos/negocios/lib/autoDealerTaxonomy.ts`. */
export const AUTOS_MANUAL_QA_ALL_FEATURES: string[] = [
  "Apple CarPlay",
  "Android Auto",
  "Monitor de punto ciego",
  "Cámara de reversa",
  "Asientos calefactables",
  "Navegación",
  "Techo panorámico",
  "AWD / 4WD",
  "Arranque a distancia",
  "Tercera fila",
  "Control crucero adaptativo",
];

const IMG_HERO =
  "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1600&q=82";
const IMG_REAR =
  "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=1600&q=82";
const IMG_INTERIOR =
  "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1600&q=82";
const DEALER_LOGO =
  "https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&w=320&q=80";

export type AutosManualQaDraftBundle = {
  vehicleTitleOverride: boolean;
  listing: Record<string, unknown>;
};

export function buildManualPrivadoDraft(baseUrl: string): AutosManualQaDraftBundle {
  const hero = [IMG_HERO, IMG_REAR, IMG_INTERIOR, `${baseUrl.replace(/\/+$/, "")}/logo.png`];
  return {
    vehicleTitleOverride: true,
    listing: {
      autosLane: "privado",
      vehicleTitle: `2018 Honda CR-V Touring AWD — un dueño, historial Honda · ${MANUAL_QA_MARKERS.privado}`,
      year: 2018,
      make: "Honda",
      model: "CR-V",
      trim: "Touring AWD",
      condition: "used",
      price: 26_450,
      mileage: 54_200,
      city: "San Jose",
      state: "CA",
      zip: "95112",
      vin: "2HKRW2H90JH123456",
      transmission: "CVT",
      drivetrain: "AWD",
      fuelType: "Gasolina",
      bodyStyle: "SUV",
      exteriorColor: "Azul",
      interiorColor: "Negro",
      titleStatus: "Título limpio",
      features: [...AUTOS_MANUAL_QA_ALL_FEATURES],
      description: [
        `Vendo mi CR-V Touring 2018 (${MANUAL_QA_MARKERS.privado}) comprada nueva en Stevens Creek Honda; único dueño no fumador.`,
        "Mantenimiento al día en agencia (12 servicios documentados). Llantas Michelin CrossClimate2 al 70%, frenos delanteros al 55%.",
        "Equipo Touring: asientos de cuero, panel digital, Honda Sensing (ACC/LKAS), techo panorámico, sistema de audio premium, subwoofer.",
        "Ideal para familia: segunda fila amplia, maletero plano con doble fondo, ganchos ISOFIX en ambas plazas traseras.",
        "Cita presencial en zona Willow Glen; aceptamos inspección mecánica seria. Título limpio a mi nombre, listo para traspaso el mismo día.",
      ].join("\n\n"),
      heroImages: hero,
      dealerName: "María Elena Ortiz",
      dealerPhoneOffice: "(408) 555-0148",
      dealerWhatsapp: "+14085550148",
      dealerEmail: "maria.ortiz.crvexample@icloud.com",
      privadoSiteMessageEnabled: true,
    },
  };
}

export function buildManualNegociosDraft(baseUrl: string): AutosManualQaDraftBundle {
  const hero = [IMG_REAR, IMG_HERO, IMG_INTERIOR, `${baseUrl.replace(/\/+$/, "")}/logo.png`];
  return {
    vehicleTitleOverride: true,
    listing: {
      autosLane: "negocios",
      vehicleTitle: `2021 Lexus RX 350 F Sport — certificado, historial Lexus · ${MANUAL_QA_MARKERS.negocios}`,
      year: 2021,
      make: "Lexus",
      model: "RX 350",
      trim: "F Sport",
      condition: "certified",
      price: 44_875,
      monthlyEstimate: "Desde $689/mes a 60 meses con crédito preaprobado OEM (sujeto a aprobación).",
      mileage: 28_900,
      city: "Burlingame",
      state: "CA",
      zip: "94010",
      vin: "2T2BZMCA7MC098765",
      stockNumber: "PEG-2144-MQA",
      transmission: "Automática",
      drivetrain: "AWD",
      fuelType: "Gasolina premium",
      engine: "V6 3.5L DOHC 24 válvulas con inyección directa",
      mpgCity: 20,
      mpgHighway: 27,
      doors: 4,
      seats: 5,
      bodyStyle: "SUV",
      exteriorColor: "Gris",
      interiorColor: "Rojo",
      titleStatus: "Título limpio",
      badges: ["certified", "clean_title", "one_owner", "low_miles", "dealer_maintained"],
      features: [...AUTOS_MANUAL_QA_ALL_FEATURES],
      description: [
        `Inventario certificado Peninsula EuroAuto Gallery (${MANUAL_QA_MARKERS.negocios}). Este RX 350 F Sport 2021 pasó inspección de 175 puntos y conserva garantía limitada Lexus L/Certified.`,
        "Paquete F Sport: suspensión adaptativa, asientos ventilados y calefactables, instrumentación digital 12.3\", head-up display, sonido Mark Levinson, llantas 20\" exclusivas.",
        "Historial: dos dueños corporativos en la península; cero colisiones reportadas en Carfax. Último servicio mayor en Lexus of Redwood City (febrero 2026) con cambio de aceite sintético y rotación.",
        "Incluye dos llaves inteligentes, manual digital, cargador inalámbrico, techo panorámico, asistente de estacionamiento y paquete de asistencia al conductor.",
        "Financiamiento competitivo y aceptamos auto a cuenta. Agende prueba de manejo; estacionamiento cubierto en Broadway para clientes verificados.",
      ].join("\n\n"),
      heroImages: hero,
      dealerName: "Peninsula EuroAuto Gallery",
      dealerLogo: DEALER_LOGO,
      dealerPhoneOffice: "(650) 555-0191",
      dealerPhoneMobile: "(650) 555-0192",
      dealerWhatsapp: "+16505550191",
      dealerAddress: "1200 Broadway, Burlingame, CA 94010 — showroom con 18 plazas de estacionamiento para clientes.",
      dealerWebsite: "https://peninsula-euroauto.example.com/inventario",
      dealerBookingUrl: "https://peninsula-euroauto.example.com/agendar-prueba",
      dealerHours: [
        { rowId: "mq-neg-h0", day: "Lunes", open: "09:00", close: "19:00", closed: false },
        { rowId: "mq-neg-h1", day: "Martes", open: "09:00", close: "19:00", closed: false },
        { rowId: "mq-neg-h2", day: "Miércoles", open: "09:00", close: "19:00", closed: false },
        { rowId: "mq-neg-h3", day: "Jueves", open: "09:00", close: "19:00", closed: false },
        { rowId: "mq-neg-h4", day: "Viernes", open: "09:00", close: "20:00", closed: false },
        { rowId: "mq-neg-h5", day: "Sábado", open: "10:00", close: "18:00", closed: false },
        { rowId: "mq-neg-h6", day: "Domingo", open: "", close: "", closed: true },
      ],
      dealerSocials: {
        instagram: "https://instagram.com/peninsulaeuroautoqa",
        facebook: "https://facebook.com/peninsulaeuroautoqa",
        youtube: "https://youtube.com/@peninsulaeuroautoqa",
        tiktok: "https://tiktok.com/@peninsulaeuroautoqa",
        website: "https://peninsula-euroauto.example.com",
      },
    },
  };
}
