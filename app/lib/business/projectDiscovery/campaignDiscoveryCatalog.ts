/**
 * Client Discovery & Project Blueprint Engine, Gate 6 — Media / Exposure Campaign discovery catalog
 * (MD <media_campaign_discovery>, <campaign_rule>: "LEONIX THINKS IN CAMPAIGNS, NOT ISOLATED ADS").
 *
 * Channel selection is deliberately a free `valueType: "list"` of channel_key strings rather than a
 * hardcoded `options` list — the real channel catalog lives in business_growth_media_channels (DB,
 * seeded, can grow) and is validated live by the campaign-execution bridge route against
 * listGrowthMediaChannels(), exactly mirroring how the existing Campaign Builder route already
 * validates mediaChannelIds before creating a campaign. A recommended channel (especially "radio",
 * a partner channel) is NEVER sold inventory, confirmed placement, or a contracted service until
 * the canonical Campaign/channel-availability state says so — this catalog never invents pricing,
 * availability, or guaranteed reach.
 */
import type { SpecializedRequirementDefinition } from "./specializedDiscoveryEngine";

export const CAMPAIGN_CATALOG_VERSION = "campaign_discovery_v1";

export type CampaignSection = "objective" | "audience" | "offer_message" | "cta" | "channels" | "timing" | "creative" | "measurement" | "approval";

export const CAMPAIGN_SECTIONS: readonly CampaignSection[] = [
  "objective", "audience", "offer_message", "cta", "channels", "timing", "creative", "measurement", "approval",
];

type CampaignReq = SpecializedRequirementDefinition<CampaignSection>;

export const CAMPAIGN_REQUIREMENTS: readonly CampaignReq[] = [
  // ---------------------------------------------------------------------------------------------
  // CAMPAIGN OBJECTIVE
  // ---------------------------------------------------------------------------------------------
  {
    fieldKey: "campaign_objective", section: "objective",
    labelEn: "Campaign objective", labelEs: "Objetivo de la campaña",
    operatorGuidanceEn: "The single real driving goal — never assume 'more customers' as a default.",
    operatorGuidanceEs: "El único objetivo real que impulsa esto — nunca asuma 'más clientes' como predeterminado.",
    clientQuestionEn: "What is the main goal of this campaign?", clientQuestionEs: "¿Cuál es el objetivo principal de esta campaña?",
    valueType: "choice", defaultCompletenessClass: "required_before_build", whoShouldAnswer: "CLIENT",
    options: [
      { value: "awareness", labelEn: "Awareness", labelEs: "Reconocimiento" },
      { value: "launch", labelEn: "Launch", labelEs: "Lanzamiento" },
      { value: "event", labelEn: "Event", labelEs: "Evento" },
      { value: "promotion", labelEn: "Promotion", labelEs: "Promoción" },
      { value: "leads", labelEn: "Leads", labelEs: "Prospectos" },
      { value: "visits", labelEn: "Visits", labelEs: "Visitas" },
      { value: "calls", labelEn: "Calls", labelEs: "Llamadas" },
      { value: "bookings", labelEn: "Bookings", labelEs: "Reservas" },
      { value: "other", labelEn: "Other", labelEs: "Otro" },
    ],
    priority: 1, mayBlockBuild: true, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
  },

  // ---------------------------------------------------------------------------------------------
  // AUDIENCE
  // ---------------------------------------------------------------------------------------------
  {
    fieldKey: "primary_customer", section: "audience",
    labelEn: "Who this campaign targets", labelEs: "A quién se dirige esta campaña",
    operatorGuidanceEn: "Shared with Website/Logo audience fields.", operatorGuidanceEs: "Compartido con los campos de audiencia de Sitio Web/Logo.",
    clientQuestionEn: "Who is this campaign trying to reach?", clientQuestionEs: "¿A quién intenta llegar esta campaña?",
    valueType: "text", defaultCompletenessClass: "required_before_build", whoShouldAnswer: "CLIENT",
    priority: 1, mayBlockBuild: true, mayBlockLaunch: false, canonicalTruthMaySatisfy: true, recommendReconfirmation: false,
  },
  {
    fieldKey: "campaign_audience_geography", section: "audience",
    labelEn: "Geography", labelEs: "Geografía",
    operatorGuidanceEn: "Confirm the real service/target area — never assume citywide reach by default.",
    operatorGuidanceEs: "Confirme el área real de servicio/objetivo — nunca asuma alcance a nivel de toda la ciudad por defecto.",
    clientQuestionEn: "What geographic area should this campaign focus on?", clientQuestionEs: "¿En qué área geográfica debe enfocarse esta campaña?",
    valueType: "text", defaultCompletenessClass: "required_before_build", whoShouldAnswer: "CLIENT",
    priority: 2, mayBlockBuild: true, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
  },
  {
    fieldKey: "campaign_audience_language", section: "audience",
    labelEn: "Audience language", labelEs: "Idioma de la audiencia",
    operatorGuidanceEn: "Confirms which language(s) the creative and channels should target.", operatorGuidanceEs: "Confirma en qué idioma(s) deben dirigirse el creativo y los canales.",
    clientQuestionEn: "What language does your target audience speak?", clientQuestionEs: "¿Qué idioma habla su audiencia objetivo?",
    valueType: "choice", defaultCompletenessClass: "helpful", whoShouldAnswer: "CLIENT",
    options: [
      { value: "es", labelEn: "Spanish", labelEs: "Español" },
      { value: "en", labelEn: "English", labelEs: "Inglés" },
      { value: "bilingual", labelEn: "Bilingual", labelEs: "Bilingüe" },
    ],
    priority: 3, mayBlockBuild: false, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
  },

  // ---------------------------------------------------------------------------------------------
  // OFFER / MESSAGE
  // ---------------------------------------------------------------------------------------------
  {
    fieldKey: "campaign_primary_message", section: "offer_message",
    labelEn: "Primary message", labelEs: "Mensaje principal",
    operatorGuidanceEn: "The one thing this campaign needs to say — never a generic filler message.", operatorGuidanceEs: "Lo único que esta campaña necesita decir — nunca un mensaje de relleno genérico.",
    clientQuestionEn: "What is the single most important message this campaign should communicate?", clientQuestionEs: "¿Cuál es el mensaje más importante que debe comunicar esta campaña?",
    valueType: "text", defaultCompletenessClass: "required_before_build", whoShouldAnswer: "CLIENT",
    priority: 1, mayBlockBuild: true, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
  },
  {
    fieldKey: "campaign_promotion_details", section: "offer_message",
    labelEn: "Promotion / offer details and exclusions", labelEs: "Detalles de promoción / oferta y exclusiones",
    operatorGuidanceEn: "Only the client's own supplied terms — Leonix never invents or embellishes an offer's terms.",
    operatorGuidanceEs: "Solo los términos proporcionados por el propio cliente — Leonix nunca inventa ni embellece los términos de una oferta.",
    clientQuestionEn: "Is there a specific promotion or offer, and what are its exact terms/exclusions?", clientQuestionEs: "¿Hay una promoción u oferta específica, y cuáles son sus términos/exclusiones exactos?",
    valueType: "text", defaultCompletenessClass: "helpful", whoShouldAnswer: "CLIENT",
    priority: 2, mayBlockBuild: false, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
  },

  // ---------------------------------------------------------------------------------------------
  // CTA
  // ---------------------------------------------------------------------------------------------
  {
    fieldKey: "campaign_cta", section: "cta",
    labelEn: "Call to action / destination", labelEs: "Llamado a la acción / destino",
    operatorGuidanceEn: "What the campaign is actually driving toward — never left implicit.", operatorGuidanceEs: "Hacia qué realmente impulsa la campaña — nunca se deja implícito.",
    clientQuestionEn: "What do you want people to do (call, text, WhatsApp, visit website, Business Hub, get directions, use a coupon, book)?", clientQuestionEs: "¿Qué quiere que haga la gente (llamar, enviar texto, WhatsApp, visitar el sitio web, Business Hub, obtener direcciones, usar un cupón, reservar)?",
    valueType: "choice", defaultCompletenessClass: "required_before_build", whoShouldAnswer: "CLIENT",
    options: [
      { value: "call", labelEn: "Call", labelEs: "Llamar" },
      { value: "sms", labelEn: "SMS", labelEs: "SMS" },
      { value: "whatsapp", labelEn: "WhatsApp", labelEs: "WhatsApp" },
      { value: "website", labelEn: "Website", labelEs: "Sitio web" },
      { value: "business_hub", labelEn: "Business Hub", labelEs: "Business Hub" },
      { value: "directions", labelEn: "Directions", labelEs: "Direcciones" },
      { value: "coupon", labelEn: "Coupon", labelEs: "Cupón" },
      { value: "booking", labelEn: "Booking", labelEs: "Reserva" },
      { value: "other", labelEn: "Other", labelEs: "Otro" },
    ],
    priority: 1, mayBlockBuild: true, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
  },

  // ---------------------------------------------------------------------------------------------
  // CHANNELS — never fabricates inventory. `campaign_desired_channels` holds channel_key strings
  // validated live against business_growth_media_channels by the execution-bridge route.
  // ---------------------------------------------------------------------------------------------
  {
    fieldKey: "campaign_desired_channels", section: "channels",
    labelEn: "Desired channels", labelEs: "Canales deseados",
    operatorGuidanceEn: "A desired channel here is a REQUEST, not a confirmed booking — the campaign execution bridge validates each channel_key against the live, current channel catalog before anything is created. Never tell the client a channel is secured based on this answer alone.",
    operatorGuidanceEs: "Un canal deseado aquí es una SOLICITUD, no una reserva confirmada — el puente de ejecución de campaña valida cada channel_key contra el catálogo de canales actual y en vivo antes de crear nada. Nunca le diga al cliente que un canal está asegurado basándose solo en esta respuesta.",
    clientQuestionEn: "Which channels are you interested in (website, print magazine, newsletter, social, Business Hub, radio, etc.)?", clientQuestionEs: "¿En qué canales está interesado (sitio web, revista impresa, boletín, redes sociales, Business Hub, radio, etc.)?",
    valueType: "list", defaultCompletenessClass: "required_before_build", whoShouldAnswer: "CLIENT",
    priority: 1, mayBlockBuild: true, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
  },
  {
    fieldKey: "campaign_radio_interest_note", section: "channels",
    labelEn: "Radio interest — inventory/terms must be confirmed separately", labelEs: "Interés en radio — el inventario/términos deben confirmarse por separado",
    operatorGuidanceEn: "Radio is a PARTNER channel (available_partner_terms_required), never Leonix-owned inventory. Interest here NEVER implies confirmed station inventory, audience, schedule, price, or production terms — those must be confirmed with the partner before any final package is presented.",
    operatorGuidanceEs: "Radio es un canal SOCIO (available_partner_terms_required), nunca inventario propio de Leonix. El interés aquí NUNCA implica inventario, audiencia, horario, precio, o términos de producción confirmados de la estación — esos deben confirmarse con el socio antes de presentar cualquier paquete final.",
    clientQuestionEn: "Are you interested in radio exposure as part of this campaign (pending confirmed availability and terms)?", clientQuestionEs: "¿Está interesado en exposición en radio como parte de esta campaña (sujeto a disponibilidad y términos confirmados)?",
    valueType: "boolean", defaultCompletenessClass: "helpful", whoShouldAnswer: "CLIENT",
    priority: 4, mayBlockBuild: false, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
  },

  // ---------------------------------------------------------------------------------------------
  // TIMING
  // ---------------------------------------------------------------------------------------------
  {
    fieldKey: "campaign_start_date", section: "timing",
    labelEn: "Start date", labelEs: "Fecha de inicio",
    operatorGuidanceEn: "A real planned start, never assumed 'as soon as possible.'", operatorGuidanceEs: "Un inicio real planeado, nunca asumido 'lo antes posible.'",
    clientQuestionEn: "When should this campaign start?", clientQuestionEs: "¿Cuándo debe comenzar esta campaña?",
    valueType: "date", defaultCompletenessClass: "required_before_build", whoShouldAnswer: "CLIENT",
    priority: 2, mayBlockBuild: true, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
  },
  {
    fieldKey: "campaign_end_date", section: "timing",
    labelEn: "End date", labelEs: "Fecha de finalización",
    operatorGuidanceEn: "Confirm a real end date — an open-ended campaign should say so explicitly rather than being left blank.",
    operatorGuidanceEs: "Confirme una fecha de finalización real — una campaña sin fecha definida debe decirlo explícitamente en lugar de dejarse en blanco.",
    clientQuestionEn: "When should this campaign end?", clientQuestionEs: "¿Cuándo debe terminar esta campaña?",
    valueType: "date", defaultCompletenessClass: "required_before_launch", whoShouldAnswer: "CLIENT",
    priority: 2, mayBlockBuild: false, mayBlockLaunch: true, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
  },
  {
    fieldKey: "campaign_hard_deadline_event", section: "timing",
    labelEn: "Hard deadline / event date (and why)", labelEs: "Fecha límite firme / fecha de evento (y por qué)",
    operatorGuidanceEn: "Confirm it's real, not assumed urgency.", operatorGuidanceEs: "Confirme que es real, no urgencia asumida.",
    clientQuestionEn: "Is there a hard deadline or event date driving this campaign?", clientQuestionEs: "¿Hay una fecha límite firme o fecha de evento que impulse esta campaña?",
    valueType: "text", defaultCompletenessClass: "helpful", whoShouldAnswer: "CLIENT",
    priority: 3, mayBlockBuild: false, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
  },

  // ---------------------------------------------------------------------------------------------
  // CREATIVE
  // ---------------------------------------------------------------------------------------------
  {
    fieldKey: "campaign_existing_creative_available", section: "creative",
    labelEn: "Existing creative available", labelEs: "Creativo existente disponible",
    operatorGuidanceEn: "Confirm what already exists before assuming new creative is needed.", operatorGuidanceEs: "Confirme qué ya existe antes de asumir que se necesita creativo nuevo.",
    clientQuestionEn: "Do you already have creative assets (images, video, copy) for this campaign?", clientQuestionEs: "¿Ya tiene activos creativos (imágenes, video, texto) para esta campaña?",
    valueType: "boolean", defaultCompletenessClass: "required_before_build", whoShouldAnswer: "CLIENT",
    priority: 2, mayBlockBuild: true, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
  },
  {
    fieldKey: "campaign_new_creative_needed", section: "creative",
    labelEn: "New creative needed", labelEs: "Se necesita creativo nuevo",
    operatorGuidanceEn: "When true, this campaign has a real Creative Studio dependency — surface it as a dependency, not a silent assumption.",
    operatorGuidanceEs: "Cuando es verdadero, esta campaña tiene una dependencia real de Creative Studio — muéstrela como una dependencia, no como una suposición silenciosa.",
    clientQuestionEn: "Do you need new creative produced for this campaign?", clientQuestionEs: "¿Necesita creativo nuevo producido para esta campaña?",
    valueType: "boolean", defaultCompletenessClass: "required_before_build", whoShouldAnswer: "CLIENT",
    priority: 2, mayBlockBuild: true, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
  },
  {
    fieldKey: "campaign_creative_sizes_formats", section: "creative",
    labelEn: "Sizes/formats needed", labelEs: "Tamaños/formatos necesarios",
    operatorGuidanceEn: "Only relevant once new creative is confirmed needed.", operatorGuidanceEs: "Solo relevante una vez que se confirma que se necesita creativo nuevo.",
    clientQuestionEn: "What sizes or formats does the new creative need to cover?", clientQuestionEs: "¿Qué tamaños o formatos debe cubrir el creativo nuevo?",
    valueType: "text", defaultCompletenessClass: "helpful", whoShouldAnswer: "CLIENT",
    priority: 3, mayBlockBuild: false, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
    dependencyCondition: (ctx) => ctx.getCapturedValue("campaign_new_creative_needed") === true,
  },

  // ---------------------------------------------------------------------------------------------
  // MEASUREMENT — only what's actually measurable through supported channels; never a guaranteed
  // reach/results promise.
  // ---------------------------------------------------------------------------------------------
  {
    fieldKey: "campaign_measurement_goals", section: "measurement",
    labelEn: "Measurable outcomes of interest", labelEs: "Resultados medibles de interés",
    operatorGuidanceEn: "Only include outcomes the selected channels can actually measure — never promise a guaranteed reach or result.",
    operatorGuidanceEs: "Solo incluya resultados que los canales seleccionados realmente puedan medir — nunca prometa un alcance o resultado garantizado.",
    clientQuestionEn: "What would you like to measure (impressions/views, clicks, leads, calls/messages, coupon redemptions, other)?", clientQuestionEs: "¿Qué le gustaría medir (impresiones/vistas, clics, prospectos, llamadas/mensajes, canjes de cupón, otro)?",
    valueType: "list", defaultCompletenessClass: "helpful", whoShouldAnswer: "CLIENT",
    priority: 3, mayBlockBuild: false, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
  },

  // ---------------------------------------------------------------------------------------------
  // APPROVAL
  // ---------------------------------------------------------------------------------------------
  {
    fieldKey: "decision_maker_approver", section: "approval",
    labelEn: "Approver", labelEs: "Persona que aprueba",
    operatorGuidanceEn: "Shared with Website/Logo/Print approval sections.", operatorGuidanceEs: "Compartido con las secciones de aprobación de Sitio Web/Logo/Impresos.",
    clientQuestionEn: "Who will give final approval on this campaign?", clientQuestionEs: "¿Quién dará la aprobación final de esta campaña?",
    valueType: "text", defaultCompletenessClass: "required_before_build", whoShouldAnswer: "CLIENT",
    priority: 1, mayBlockBuild: true, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
  },
  {
    fieldKey: "campaign_review_deadline", section: "approval",
    labelEn: "Review deadline", labelEs: "Fecha límite de revisión",
    operatorGuidanceEn: "When the client needs to review/approve by, so the campaign can still start on time.", operatorGuidanceEs: "Para cuándo el cliente necesita revisar/aprobar, para que la campaña aún pueda iniciar a tiempo.",
    clientQuestionEn: "By when do you need to review and approve this campaign?", clientQuestionEs: "¿Para cuándo necesita revisar y aprobar esta campaña?",
    valueType: "date", defaultCompletenessClass: "helpful", whoShouldAnswer: "CLIENT",
    priority: 3, mayBlockBuild: false, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
  },
];
