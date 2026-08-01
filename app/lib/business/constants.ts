/**
 * Controlled value sets and bounded default copy for the Business Identity core.
 * These mirror the CHECK constraints in the BCO-1C.1 migration exactly — do not
 * drift from them without a corresponding migration change.
 */
import type {
  AreaKind,
  AuthorizationRole,
  BroadBusinessType,
  BusinessStage,
  ChannelKind,
  ContactCapability,
  ContactLabel,
  ContactType,
  ContactVisibility,
  CoverageLevel,
  CustomLinkType,
  DeliveryModel,
  DigitalProfilePlatform,
  FieldErrorCode,
  OperatingModel,
  PreferredResponseMethod,
  PrimaryLanguage,
  SalesChannel,
  SalesRelationship,
} from "./types";

export const BUSINESS_IDENTITY_FLAG_KEY = "business_identity_foundation";

export const PRIMARY_LANGUAGES: readonly PrimaryLanguage[] = ["es", "en"];
export const CONTACT_TYPES: readonly ContactType[] = ["phone", "email", "website"];
export const CHANNEL_KINDS: readonly ChannelKind[] = ["whatsapp", "call", "email"];
export const AREA_KINDS: readonly AreaKind[] = ["physical_address", "service_area_text"];

type LabeledOption<T extends string> = { value: T; es: string; en: string };

/** Gate BCO-3R Phase 5 — 16-item controlled top-level taxonomy. Mirrors businesses_broad_business_type_chk. */
export const BROAD_BUSINESS_TYPES: readonly LabeledOption<BroadBusinessType>[] = [
  { value: "retail_ecommerce", es: "Comercio minorista y en línea", en: "Retail and e-commerce" },
  { value: "professional_services", es: "Servicios profesionales", en: "Professional services" },
  { value: "food_hospitality", es: "Comida y hospitalidad", en: "Food and hospitality" },
  { value: "health_beauty_wellness", es: "Salud, belleza y bienestar", en: "Health, beauty and wellness" },
  { value: "construction_trades", es: "Construcción y oficios especializados", en: "Construction and skilled trades" },
  { value: "technology_digital_services", es: "Tecnología y servicios digitales", en: "Technology and digital services" },
  { value: "education_training_coaching", es: "Educación, capacitación y coaching", en: "Education, training and coaching" },
  { value: "real_estate_property_services", es: "Bienes raíces y servicios de propiedad", en: "Real estate and property services" },
  { value: "automotive_transportation", es: "Automotriz y transporte", en: "Automotive and transportation" },
  { value: "manufacturing_local_production", es: "Manufactura y producción local", en: "Manufacturing and local production" },
  { value: "arts_entertainment_events", es: "Arte, entretenimiento y eventos", en: "Arts, entertainment and events" },
  { value: "home_personal_services", es: "Servicios del hogar y personales", en: "Home and personal services" },
  { value: "nonprofit_faith_community", es: "Sin fines de lucro, fe y comunidad", en: "Nonprofit, faith and community organizations" },
  { value: "agriculture_food_production", es: "Agricultura y producción de alimentos", en: "Agriculture and food production" },
  { value: "finance_insurance", es: "Finanzas y seguros", en: "Finance and insurance" },
  { value: "other", es: "Otro", en: "Other" },
];

/** Bounded specific-type suggestions per broad category — not exhaustive, "Other" always available. */
export const SPECIFIC_BUSINESS_TYPE_SUGGESTIONS: Readonly<Record<BroadBusinessType, readonly { value: string; es: string; en: string }[]>> = {
  retail_ecommerce: [
    { value: "clothing_store", es: "Tienda de ropa", en: "Clothing store" },
    { value: "grocery_market", es: "Tienda de abarrotes", en: "Grocery / market" },
    { value: "online_store", es: "Tienda en línea", en: "Online store" },
    { value: "gift_shop", es: "Tienda de regalos", en: "Gift shop" },
  ],
  professional_services: [
    { value: "lawyer", es: "Abogado(a)", en: "Lawyer" },
    { value: "accountant", es: "Contador(a)", en: "Accountant" },
    { value: "consultant", es: "Consultor(a)", en: "Consultant" },
    { value: "marketing_agency", es: "Agencia de marketing", en: "Marketing agency" },
    { value: "insurance_agent", es: "Agente de seguros", en: "Insurance agent" },
    { value: "tax_preparer", es: "Preparador(a) de impuestos", en: "Tax preparer" },
  ],
  food_hospitality: [
    { value: "restaurant", es: "Restaurante", en: "Restaurant" },
    { value: "food_truck", es: "Camión de comida", en: "Food truck" },
    { value: "caterer", es: "Servicio de banquetes", en: "Caterer" },
    { value: "bakery", es: "Panadería", en: "Bakery" },
    { value: "cafe", es: "Café", en: "Cafe" },
    { value: "home_based_food", es: "Negocio de comida casera", en: "Home-based food business" },
  ],
  health_beauty_wellness: [
    { value: "salon", es: "Salón de belleza", en: "Salon" },
    { value: "barbershop", es: "Barbería", en: "Barbershop" },
    { value: "spa", es: "Spa", en: "Spa" },
    { value: "fitness_trainer", es: "Entrenador(a) físico", en: "Fitness trainer" },
    { value: "clinic", es: "Clínica", en: "Clinic" },
  ],
  construction_trades: [
    { value: "plumber", es: "Plomero(a)", en: "Plumber" },
    { value: "electrician", es: "Electricista", en: "Electrician" },
    { value: "roofer", es: "Techador(a)", en: "Roofer" },
    { value: "painter", es: "Pintor(a)", en: "Painter" },
    { value: "remodeling_contractor", es: "Contratista de remodelación", en: "Remodeling contractor" },
    { value: "landscaping", es: "Jardinería/paisajismo", en: "Landscaping" },
    { value: "general_contractor", es: "Contratista general", en: "General contractor" },
  ],
  technology_digital_services: [
    { value: "web_developer", es: "Desarrollador(a) web", en: "Web developer" },
    { value: "it_support", es: "Soporte técnico", en: "IT support" },
    { value: "software_company", es: "Empresa de software", en: "Software company" },
  ],
  education_training_coaching: [
    { value: "tutor", es: "Tutor(a)", en: "Tutor" },
    { value: "language_school", es: "Escuela de idiomas", en: "Language school" },
    { value: "life_coach", es: "Coach de vida", en: "Life coach" },
  ],
  real_estate_property_services: [
    { value: "real_estate_agent", es: "Agente de bienes raíces", en: "Real estate agent" },
    { value: "property_management", es: "Administración de propiedades", en: "Property management" },
  ],
  automotive_transportation: [
    { value: "auto_repair", es: "Taller mecánico", en: "Auto repair shop" },
    { value: "car_dealer", es: "Distribuidor de autos", en: "Car dealer" },
    { value: "towing", es: "Grúas", en: "Towing" },
  ],
  manufacturing_local_production: [
    { value: "artisan_producer", es: "Productor(a) artesanal", en: "Artisan producer" },
    { value: "small_factory", es: "Pequeña fábrica", en: "Small factory" },
  ],
  arts_entertainment_events: [
    { value: "photographer", es: "Fotógrafo(a)", en: "Photographer" },
    { value: "event_planner", es: "Planificador(a) de eventos", en: "Event planner" },
    { value: "musician_dj", es: "Músico(a) / DJ", en: "Musician / DJ" },
  ],
  home_personal_services: [
    { value: "cleaning_service", es: "Servicio de limpieza", en: "Cleaning service" },
    { value: "handyman", es: "Manitas / reparaciones", en: "Handyman" },
    { value: "childcare", es: "Cuidado infantil", en: "Childcare" },
  ],
  nonprofit_faith_community: [
    { value: "church", es: "Iglesia", en: "Church" },
    { value: "nonprofit_org", es: "Organización sin fines de lucro", en: "Nonprofit organization" },
  ],
  agriculture_food_production: [
    { value: "farm", es: "Granja", en: "Farm" },
    { value: "food_producer", es: "Productor(a) de alimentos", en: "Food producer" },
  ],
  finance_insurance: [
    { value: "financial_advisor", es: "Asesor(a) financiero", en: "Financial advisor" },
    { value: "insurance_broker", es: "Corredor(a) de seguros", en: "Insurance broker" },
  ],
  other: [],
};

/** Gate BCO-3R — replaces the earlier vague/unconstrained business_stage set. */
export const BUSINESS_STAGES: readonly LabeledOption<BusinessStage>[] = [
  { value: "planning_prelaunch", es: "Planeando / antes de abrir", en: "Planning / pre-launch" },
  { value: "newly_opened", es: "Recién abierto", en: "Newly opened" },
  { value: "operating", es: "En operación", en: "Operating" },
  { value: "growing", es: "Creciendo", en: "Growing" },
  { value: "established_mature", es: "Establecido / maduro", en: "Established / mature" },
  { value: "paused_restructuring", es: "En pausa / reestructurando", en: "Paused / restructuring" },
];

export const OPERATING_MODELS: readonly LabeledOption<OperatingModel>[] = [
  { value: "fixed_location", es: "Ubicación física fija", en: "Fixed physical location" },
  { value: "mobile", es: "Móvil / voy donde el cliente", en: "Mobile / travels to customers" },
  { value: "online_remote", es: "En línea / remoto", en: "Online / remote" },
  { value: "regional", es: "Zona de servicio regional", en: "Regional service area" },
  { value: "hybrid", es: "Híbrido", en: "Hybrid" },
  { value: "multiple_locations", es: "Múltiples ubicaciones", en: "Multiple locations" },
];

export const SALES_RELATIONSHIPS: readonly LabeledOption<SalesRelationship>[] = [
  { value: "b2c", es: "A consumidores (B2C)", en: "B2C / consumers" },
  { value: "b2b", es: "A negocios (B2B)", en: "B2B / businesses" },
  { value: "b2g", es: "Gobierno o instituciones (B2G)", en: "B2G / government or institutions" },
  { value: "direct_to_consumer", es: "Directo al consumidor", en: "Direct-to-consumer" },
  { value: "wholesale", es: "Mayoreo", en: "Wholesale" },
  { value: "marketplace", es: "Plataforma / marketplace", en: "Marketplace" },
  { value: "subscription", es: "Suscripción o membresía", en: "Subscription or membership" },
  { value: "nonprofit_community", es: "Servicio comunitario / sin fines de lucro", en: "Nonprofit / community service" },
  { value: "other", es: "Otro", en: "Other" },
];

export const SALES_CHANNELS: readonly LabeledOption<SalesChannel>[] = [
  { value: "physical_location", es: "Ubicación física", en: "Physical location" },
  { value: "website", es: "Sitio web / tienda en línea", en: "Website / e-commerce" },
  { value: "social_media", es: "Redes sociales", en: "Social media" },
  { value: "phone", es: "Teléfono", en: "Phone" },
  { value: "whatsapp", es: "WhatsApp", en: "WhatsApp" },
  { value: "marketplace_platform", es: "Plataforma de marketplace", en: "Marketplace platform" },
  { value: "mobile_on_site", es: "Servicio móvil / en sitio", en: "Mobile / on-site service" },
  { value: "events", es: "Eventos / pop-ups", en: "Events / pop-ups" },
  { value: "referrals", es: "Referencias / boca a boca", en: "Referrals / word of mouth" },
  { value: "other", es: "Otro", en: "Other" },
];

export const CONTACT_LABELS: readonly LabeledOption<ContactLabel>[] = [
  { value: "main", es: "Principal", en: "Main" },
  { value: "sales", es: "Ventas", en: "Sales" },
  { value: "customer_service", es: "Servicio al cliente", en: "Customer service" },
  { value: "booking", es: "Reservaciones o citas", en: "Booking or appointments" },
  { value: "quotes", es: "Cotizaciones", en: "Quotes" },
  { value: "billing", es: "Facturación", en: "Billing" },
  { value: "other", es: "Otro", en: "Other" },
];
export const CONTACT_LABEL_VALUES: readonly ContactLabel[] = CONTACT_LABELS.map((o) => o.value);

export const CONTACT_VISIBILITIES: readonly ContactVisibility[] = ["public", "private"];

/** Gate BCO-3R-B.2 — only meaningful for contactType === "phone". */
export const CONTACT_CAPABILITIES: readonly LabeledOption<ContactCapability>[] = [
  { value: "calls", es: "Llamadas", en: "Calls" },
  { value: "sms", es: "Mensajes de texto (SMS)", en: "Text messages (SMS)" },
  { value: "whatsapp", es: "WhatsApp", en: "WhatsApp" },
];
export const CONTACT_CAPABILITY_VALUES: readonly ContactCapability[] = CONTACT_CAPABILITIES.map((o) => o.value);

/** Gate BCO-3R-B.2 — single business-wide preferred response method. */
export const PREFERRED_RESPONSE_METHODS: readonly LabeledOption<PreferredResponseMethod>[] = [
  { value: "whatsapp", es: "WhatsApp", en: "WhatsApp" },
  { value: "phone_call", es: "Llamada telefónica", en: "Phone call" },
  { value: "sms", es: "Mensaje de texto (SMS)", en: "Text message (SMS)" },
  { value: "email", es: "Correo electrónico", en: "Email" },
];

export const DIGITAL_PROFILE_PLATFORMS: readonly LabeledOption<DigitalProfilePlatform>[] = [
  { value: "google_business", es: "Perfil de Google Business", en: "Google Business Profile" },
  { value: "facebook", es: "Facebook", en: "Facebook" },
  { value: "instagram", es: "Instagram", en: "Instagram" },
  { value: "tiktok", es: "TikTok", en: "TikTok" },
  { value: "youtube", es: "YouTube", en: "YouTube" },
  { value: "linkedin", es: "LinkedIn", en: "LinkedIn" },
  { value: "x", es: "X (Twitter)", en: "X (Twitter)" },
  { value: "yelp", es: "Yelp", en: "Yelp" },
  { value: "whatsapp_business", es: "Enlace de WhatsApp Business", en: "WhatsApp Business link" },
  { value: "snapchat", es: "Snapchat", en: "Snapchat" },
  { value: "pinterest", es: "Pinterest", en: "Pinterest" },
  { value: "other", es: "Otro", en: "Other" },
];
export const DIGITAL_PROFILE_PLATFORM_VALUES: readonly DigitalProfilePlatform[] = DIGITAL_PROFILE_PLATFORMS.map((o) => o.value);

/** Gate BCO-3R-B.2 — repeatable, labeled business links (business_custom_links). */
export const CUSTOM_LINK_TYPES: readonly LabeledOption<CustomLinkType>[] = [
  { value: "booking", es: "Reservaciones", en: "Booking" },
  { value: "menu_catalog", es: "Menú o catálogo", en: "Menu or catalog" },
  { value: "order_online", es: "Pedidos en línea", en: "Order online" },
  { value: "portfolio", es: "Portafolio", en: "Portfolio" },
  { value: "request_quote", es: "Solicitar cotización", en: "Request a quote" },
  { value: "reviews", es: "Reseñas", en: "Reviews" },
  { value: "other", es: "Otro", en: "Other" },
];

/** Gate BCO-3R-B.3 — the single primary "how far does your business serve?" question. */
export const COVERAGE_LEVELS: readonly LabeledOption<CoverageLevel>[] = [
  { value: "local", es: "Área local", en: "Local area" },
  { value: "multi_city", es: "Varias ciudades", en: "Multiple cities" },
  { value: "one_state", es: "Un estado o provincia", en: "One state or province" },
  { value: "multi_state", es: "Varios estados o provincias", en: "Multiple states or provinces" },
  { value: "nationwide", es: "Todo el país", en: "Nationwide" },
  { value: "multi_country", es: "Varios países", en: "Multiple countries" },
  { value: "worldwide", es: "Todo el mundo / en línea", en: "Worldwide / online" },
];

/** Gate BCO-3R-B.3 — local-coverage radius presets; "custom" reveals a free-entry number field. */
export const RADIUS_PRESETS: readonly number[] = [5, 10, 25, 50, 100];

/** Gate BCO-3R-B.3 — worldwide coverage's delivery/service model, so "worldwide" never silently implies physical shipping. */
export const DELIVERY_MODELS: readonly LabeledOption<DeliveryModel>[] = [
  { value: "fully_remote", es: "Totalmente remoto", en: "Fully remote" },
  { value: "digital_delivery", es: "Entrega digital", en: "Digital delivery" },
  { value: "shipping", es: "Envío de productos", en: "Shipping" },
  { value: "consultation", es: "Consultoría / asesoría", en: "Consultation" },
  { value: "other", es: "Otro", en: "Other" },
];

export const AUTHORIZATION_ROLES: readonly LabeledOption<AuthorizationRole>[] = [
  { value: "owner", es: "Soy dueño(a) del negocio", en: "I own the business" },
  { value: "authorized_representative", es: "Tengo autorización para administrarlo", en: "I am authorized to manage the business" },
];

/** contact_type -> allowed channel_kind values when preferred_channel = true. Mirrors the DB CHECK exactly. */
export const ALLOWED_PREFERRED_CHANNEL_KINDS_BY_CONTACT_TYPE: Readonly<Record<ContactType, readonly ChannelKind[]>> = {
  phone: ["whatsapp", "call"],
  email: ["email"],
  website: [],
};

/**
 * Bounded default field-error copy, es/en. Package 3's UI may render its own copy per field/code;
 * this is a safety-net default so no path in domain logic ever hardcodes final UI strings.
 */
export const FIELD_ERROR_DEFAULT_MESSAGES: Readonly<Record<FieldErrorCode, { es: string; en: string }>> = {
  required: { es: "Este campo es obligatorio.", en: "This field is required." },
  invalid_display_name: { es: "El nombre del negocio no es válido.", en: "The business name is not valid." },
  invalid_business_type: { es: "Selecciona un tipo de negocio válido.", en: "Select a valid business type." },
  invalid_business_stage: { es: "Selecciona una etapa de negocio válida.", en: "Select a valid business stage." },
  invalid_language: { es: "Selecciona un idioma válido.", en: "Select a valid language." },
  invalid_contact_combination: {
    es: "Esa combinación de contacto y canal no es válida.",
    en: "That contact and channel combination is not valid.",
  },
  invalid_area_kind: { es: "El tipo de ubicación no es válido.", en: "The location type is not valid." },
  missing_contact: { es: "Agrega al menos un contacto.", en: "Add at least one contact." },
  missing_service_area: { es: "Agrega una ubicación o zona de servicio.", en: "Add a location or service area." },
  ownership_not_confirmed: {
    es: "Confirma que tienes autorización para crear este negocio.",
    en: "Confirm you're authorized to create this business.",
  },
  feature_access_denied: {
    es: "Tu cuenta no tiene acceso a Business Concierge todavía.",
    en: "Your account doesn't have access to Business Concierge yet.",
  },
  listing_ownership_unverified: {
    es: "No pudimos verificar que este anuncio te pertenece.",
    en: "We couldn't verify that this listing belongs to you.",
  },
  unsupported_listing_source: {
    es: "Ese tipo de anuncio todavía no se puede vincular.",
    en: "That listing type can't be linked yet.",
  },
  invalid_country: { es: "Selecciona un país válido.", en: "Select a valid country." },
  invalid_operating_model: { es: "Selecciona al menos un modelo de operación.", en: "Select at least one operating model." },
  invalid_authorization_role: { es: "Selecciona tu relación con el negocio.", en: "Select your relationship to the business." },
  invalid_digital_profile: { es: "Revisa los perfiles digitales agregados.", en: "Check the digital profiles you added." },
  invalid_contact_capability: { es: "Selecciona al menos una capacidad válida para este teléfono.", en: "Select at least one valid capability for this phone." },
  invalid_preferred_response_method: { es: "El método de respuesta preferido no coincide con ningún contacto ingresado.", en: "The preferred response method doesn't match any entered contact." },
  invalid_custom_link: { es: "Revisa los enlaces de negocio agregados.", en: "Check the business links you added." },
  invalid_service_coverage: { es: "Revisa la zona de cobertura de tu negocio.", en: "Check your business's service coverage." },
};

export function fieldErrorDefaultMessage(code: FieldErrorCode, lang: PrimaryLanguage): string {
  return FIELD_ERROR_DEFAULT_MESSAGES[code][lang];
}

/** Draft lifecycle default (matches the repository-level "30 days" precedent from the BCO-1B blueprint). */
export const DRAFT_DEFAULT_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export const MAX_DISPLAY_NAME_LENGTH = 200;
export const MAX_CONTACT_VALUE_LENGTH = 320;
export const MAX_SERVICE_AREA_TEXT_LENGTH = 500;
