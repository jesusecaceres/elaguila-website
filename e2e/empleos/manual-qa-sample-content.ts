/**
 * Persistent manual visual-QA fixtures for Empleos (Quick / Premium / Feria).
 * Used by `empleos-manual-qa-seed.spec.ts`. Copy fields into release notes / QA sheets as needed.
 */

const IMG_MAIN =
  "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1600&q=80";
const IMG_SECOND =
  "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1600&q=80";
const LOGO =
  "https://images.unsplash.com/photo-1598514983318-2f36f2fcb843?auto=format&fit=crop&w=400&q=80";

/** Unique grep tokens (stable) embedded in titles for discovery smoke. */
export const MANUAL_QA_MARKERS = {
  quick: "MQA-CH-BAYVIEW",
  premium: "MQA-PM-TALENT",
  feria: "MQA-JF-NORCAL",
} as const;

export const manualQuickDraft = {
  title: `Chef de cocina línea — Mercado Gastronómico Bayview · ${MANUAL_QA_MARKERS.quick}`,
  businessName: "Bayview Tavola Cooperative Kitchen",
  categorySlug: "restaurante",
  experienceLevel: "senior" as const,
  city: "NorCal",
  state: "CA",
  jobType: "tiempo-completo",
  schedule: "Turnos 5×2: brunch 9:00–16:30 y cena 16:00–23:30; un domingo libre al mes coordinado con jefe de turno.",
  pay: "$26.50–$31.00 / hora + propinas repartidas y bonos de productividad trimestrales",
  description: [
    "Lideramos la estación caliente del mercado gastronómico cubierto de Bayview: mise en place, plancha, horno y terminación de platos mediterráneos con producto de estación de agricultores de Sonoma y Marin.",
    "Coordinación diaria con sommelier ligero (agua, refrescos, maridajes sencillos) y con panadería artesanal para salidas compartidas.",
    "Participación en rondas de degustación interna los martes; retroalimentación documentada en hoja de cocina compartida (Notion).",
  ].join("\n\n"),
  benefits: [
    "Comida de staff en servicio + bebidas filtradas e infusiones durante el turno.",
    "Uniforme técnico lavandería corporativa; zapatos de seguridad reembolsados hasta $120/año.",
    "Acceso a biblioteca Culinaria Pro (cursos cortos en línea) y 12h/año de mentoría con chef ejecutivo invitado.",
    "Seguro médico dental visión (plan grupal) tras periodo de prueba de 60 días.",
    "Estacionamiento con descuento en garage adyacente + bicicletero vigilado.",
  ],
  screenerQuestions: [
    "Describe una noche de servicio intenso donde mantuviste estándar de temperatura y sanidad — ¿qué checklist seguiste?",
    "¿Cuál es tu salsa madre favorita para pescados blancos y cómo la balanceas en acidez?",
    "Disponibilidad real para turno cena viernes/sábado en temporada alta (nov–feb).",
  ],
  images: [
    { id: "mq_quick_hero", url: IMG_MAIN, alt: "Línea de cocina abierta con plancha y brasa", isMain: true },
    { id: "mq_quick_2", url: IMG_SECOND, alt: "Equipo sirviendo platos en barra del mercado", isMain: false },
  ],
  logoUrl: LOGO,
  phone: "+1 (415) 555-0142",
  whatsapp: "+14155550143",
  email: "cocina@bayviewtavola.coop",
  website: "https://bayviewtavola.coop/careers",
  primaryCta: "email" as const,
  addressLine1: "1800 Bayview Mercado, Puesto C-14",
  addressCity: "San Francisco",
  addressState: "CA",
  addressZip: "94103",
  videoObjectUrl: null,
  videoFileName: "",
  videoUrl: "",
};

export const manualPremiumDraft = {
  title: `Gerente de producto senior — plataforma de pagos B2B · ${MANUAL_QA_MARKERS.premium}`,
  companyName: "Northgate Talent Partners LLC",
  categorySlug: "tecnologia",
  experienceLevel: "senior" as const,
  workModality: "hibrido" as const,
  scheduleLabel: "Híbrido: martes–jueves en oficina (94107), lunes y viernes remoto; horario núcleo 10:00–16:00 PT",
  city: "NorCal",
  state: "CA",
  salaryPrimary: "$165,000 – $195,000 / año + RSU (0.12%–0.18% en 4 años)",
  salarySecondary: "bono anual objetivo 15% sobre base si se cumplen OKRs de adopción",
  jobType: "tiempo-completo",
  featured: true,
  premium: true,
  gallery: [
    { id: "mq_prem_1", url: IMG_MAIN, alt: "Equipo de producto revisando roadmap en pizarra", isMain: true },
    { id: "mq_prem_2", url: IMG_SECOND, alt: "Oficina Northgate con vista a la bahía", isMain: false },
  ],
  logoUrl: LOGO,
  applyLabel: "Postular en portal seguro",
  websiteUrl: "https://careers.northgatetalent.example/apply/product-senior",
  whatsapp: "+14155550217",
  email: "talent@northgatetalent.example",
  primaryCta: "website" as const,
  screenerQuestions: [
    "Comparte un ejemplo donde priorizaste deuda técnica vs. entrega de roadmap — métricas y trade-offs.",
    "¿Qué framework usas para discovery continuo con equipos de ventas y soporte?",
    "¿Has liderado lanzamiento PCI o SOC2 relevante a pagos? Describe tu rol.",
  ],
  introduction: [
    "Northgate Talent Partners conecta fintechs medianas con squads de producto listos para escalar en mercados regulados de EE. UU.",
    "Buscamos un/a gerente de producto senior para liderar el vertical de conciliación y liquidaciones en tiempo casi real para clientes enterprise (>$500M GMV anual).",
  ].join("\n\n"),
  responsibilities: [
    "Definir visión trimestral del vertical, traducirla a OKRs medibles y alinear ingeniería, diseño, legal y risk.",
    "Instaurar ritos de discovery: entrevistas con tesoreros, shadowing de soporte N2 y análisis cuantitativo de embudos de fallo.",
    "Co-diseñar pricing y empaquetado con finance; modelar elasticidad y sensibilidad regulatoria.",
    "Ser sponsor de RFCs críticos y mentorear PMs mid en storytelling ejecutivo.",
  ],
  requirements: [
    "8+ años en producto B2B SaaS; 3+ en pagos, banking-as-a-service o adquirencia.",
    "Experiencia demostrable con APIs REST/GraphQL, webhooks, idempotencia y SLAs de disponibilidad.",
    "Inglés C1+ para calls con clientes en la costa este; español conversacional valorado por cartera LATAM.",
    "Comodidad con SQL analítico (BigQuery o Snowflake) y notebooks para experimentos.",
  ],
  offers: [
    "Seguro premium familiar (medical/dental/vision) 95% cubierto.",
    "PSA de $3,000/año + presupuesto home office $1,200.",
    "12 semanas parental paid + 20 días PTO + semana de cierre fin de año.",
    "401(k) match 5% + acceso a asesor financiero independiente.",
  ],
  companyOverview:
    "Fundada en 2014, Northgate opera desde SoMa con ~140 personas; cultura de feedback 360 cada 6 meses y transparencia salarial por bandas publicadas internamente.",
  employerRating: "4.7",
  employerAddress: "SoMa Gateway Tower, 450 Townsend St, San Francisco, CA 94107",
  reviewCount: "186",
  videoObjectUrl: null,
  videoFileName: "",
  videoUrl: "",
};

export const manualFeriaDraft = {
  title: `Feria de reclutamiento hospitalidad NorCal — ${MANUAL_QA_MARKERS.feria}`,
  flyerImageUrl: IMG_MAIN,
  flyerAlt: "Afiche: feria de empleo con logos de hoteles y restaurantes participantes",
  dateLine: "Sábado 14 de junio de 2026",
  timeLine: "10:00 a.m. – 3:30 p.m. (PT) · registro cierra 2:45 p.m.",
  venue: "Centro Cívico Mission Bay — Salones A y B (entrada por 3rd St)",
  city: "NorCal",
  state: "CA",
  organizer: "NorCal Hospitality Works Coalition",
  organizerUrl: "https://hospitalityworks.example/events/norcal-june-2026",
  modality: "híbrida" as const,
  freeEntry: true,
  bilingual: true,
  industryFocus: "Hospitalidad, alimentos y servicios al huésped (NorCal)",
  detailsBullets: [
    "Más de 35 empleadores verificados: hoteles boutique, grupos restauranteros, catering corporativo y gestión de eventos.",
    "Entrevistas cortas (15 min) + estaciones de revisión rápida de CV con coaches voluntarios.",
    "Sala silenciosa para videollamadas con reclutadores remotos de Reno y Sacramento.",
    "Taller express (20 min) sobre propinas, derechos laborales en CA y seguridad alimentaria.",
  ],
  secondaryDetails: [
    "Estacionamiento público Mission Bay Garage (tarifa reducida con cupón en recepción).",
    "Lactancia y cambio disponibles; perros de servicio bienvenidos.",
  ],
  ctaIntro:
    "Regístrate con anticipación para agendar slot preferente con Marriott Autograph Collection y Grupo Altamira; cupos limitados para cocina fina y pastry.",
  contactLink: "https://hospitalityworks.example/register/norcal-june-2026",
  contactPhone: "+1 (628) 555-0194",
  contactEmail: "eventos@hospitalityworks.example",
  ctaLabel: "Reservar mi horario",
};
