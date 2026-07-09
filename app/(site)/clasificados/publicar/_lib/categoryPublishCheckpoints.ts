import {
  EMPLEOS_JOB_POST_PAID_PACKAGE_KEY,
  formatRevenuePriceLabel,
  getRevenuePackageDefinition,
  getRevenuePackagePriceCents,
} from "@/app/lib/listingPlans/revenuePricingMatrix";
import type { PublishCheckpointLang } from "./publishCheckpointCopy";

export type PublishCheckpointVariant = "paid" | "free" | "dealer" | "upgrade" | "community";

export type PublishCheckpointCardData = {
  id: string;
  variant: PublishCheckpointVariant;
  eyebrow: string;
  title: string;
  priceLabel: string;
  billingLabel?: string;
  shortDescription: string;
  ctaLabel: string;
  ctaHref: string;
  moreLabel: string;
  modalTitle: string;
  modalIntro: string;
  includedBullets: readonly string[];
  bestForBullets?: readonly string[];
  requiredBeforePublishBullets?: readonly string[];
  optionalUpgradeBullets?: readonly string[];
  couponEligible: boolean;
  notIncludedBullets?: readonly string[];
  footnote?: string;
  optionalUpgradeLine?: string;
  highlighted?: boolean;
  comingSoon?: boolean;
  disabled?: boolean;
};

function monthlyPrice(packageKey: string, category: string): string {
  const { priceCents } = getRevenuePackagePriceCents({ category, packageKey });
  if (priceCents == null) return "—";
  return `${formatRevenuePriceLabel(priceCents)}/mes`;
}

function oneTimePrice(packageKey: string, category: string, days: number): string {
  const { priceCents } = getRevenuePackagePriceCents({ category, packageKey });
  if (priceCents == null) return "—";
  return `${formatRevenuePriceLabel(priceCents)} / ${days} días`;
}

function isPromoEligible(packageKey: string): boolean {
  const def = getRevenuePackageDefinition(packageKey);
  return def?.promoEligible === true;
}

/** Restaurantes comida local $199/mes — display on live page; not in Revenue V1 matrix yet. */
export const RESTAURANTES_COMIDA_LOCAL_DISPLAY_PRICE = "$199/mes";

export function getRestaurantesCheckpointCards(
  lang: PublishCheckpointLang,
  withLang: (path: string, extra?: Record<string, string>) => string,
): PublishCheckpointCardData[] {
  const es = lang === "es";
  const couponAddon = es ? "Opcional: agrega cupones destacados por +$99/mes" : "Optional: add featured coupons for +$99/month";
  const establishedPrice = monthlyPrice("restaurantes_base_monthly", "restaurantes");

  return [
    {
      id: "restaurante_establecido",
      variant: "paid",
      eyebrow: es ? "Establecimiento" : "Establishment",
      title: es ? "Restaurante establecido" : "Established restaurant",
      priceLabel: establishedPrice,
      shortDescription: es
        ? "Para restaurantes, cafés, panaderías, food trucks establecidos y negocios con perfil completo. Incluye ficha premium con galería, horarios, ubicación, contacto, redes, platillos destacados y presencia en Leonix."
        : "For restaurants, cafés, bakeries, established food trucks, and businesses with complete profile. Includes premium profile with gallery, hours, location, contact, social media, featured dishes and presence on Leonix.",
      ctaLabel: es ? "Publicar restaurante" : "Publish restaurant",
      ctaHref: withLang("/publicar/restaurantes", { product: "established_restaurant" }),
      moreLabel: es ? "Ver más" : "See more",
      modalTitle: es
        ? `Qué incluye Restaurante establecido — ${establishedPrice}`
        : `What's included with Established restaurant — ${establishedPrice}`,
      modalIntro: es
        ? "Este plan crea una ficha premium para que clientes encuentren tu restaurante, revisen tus platos, vean horarios, contacten, abran el mapa, visiten tus redes y entiendan por qué deben visitarte."
        : "This plan creates a premium profile so customers can find your restaurant, review your dishes, see hours, contact, open the map, visit your social media, and understand why they should visit.",
      includedBullets: es
        ? [
            "Qué incluye: Perfil visual con foto principal, logo y galería",
            "Para quién es: Restaurantes, cafés, panaderías, food trucks establecidos",
            "Qué aparece en la ficha: Especialidades, videos, contacto, mapa, horarios, redes",
            "Qué necesita completar: Información del negocio, fotos, horarios, contacto y ubicación",
            `Precio mensual: ${establishedPrice}`,
            "Nota: La publicación se activa después de revisión final.",
          ]
        : [
            "What's included: Visual profile with hero photo, logo, and gallery",
            "Who it's for: Restaurants, cafés, bakeries, established food trucks",
            "What appears on profile: Specialties, videos, contact, map, hours, social media",
            "What you need to complete: Business info, photos, hours, contact and location",
            `Monthly price: ${establishedPrice}`,
            "Note: Publication activates after final review.",
          ],
      optionalUpgradeLine: couponAddon,
      optionalUpgradeBullets: es
        ? ["Opcional: cupones destacados por +$99/mes (hasta 4 cupones)"]
        : ["Optional: featured coupons for +$99/month (up to 4 coupons)"],
      couponEligible: isPromoEligible("restaurantes_base_monthly"),
      highlighted: false,
    },
    {
      id: "comida_local",
      variant: "paid",
      eyebrow: es ? "Comida Local" : "Local Food",
      title: es ? "Puesto, pop-up o vendedor móvil" : "Stand, pop-up, or mobile vendor",
      priceLabel: RESTAURANTES_COMIDA_LOCAL_DISPLAY_PRICE,
      shortDescription: es
        ? "Para puestos, pop-ups, comida casera, vendedores móviles y fines de semana. Ideal para negocios que venden por ubicación temporal, eventos o servicio local."
        : "For stands, pop-ups, homemade food, mobile vendors, and weekend operations. Ideal for businesses that sell at temporary locations, events, or local service.",
      ctaLabel: es ? "Publicar comida local" : "Publish local food",
      ctaHref: withLang("/publicar/restaurantes", { product: "mobile_food_vendor" }),
      moreLabel: es ? "Ver más" : "See more",
      modalTitle: es
        ? `Qué incluye Puesto / Pop-up / Vendedor móvil — ${RESTAURANTES_COMIDA_LOCAL_DISPLAY_PRICE}`
        : `What's included with Stand / Pop-up / Mobile vendor — ${RESTAURANTES_COMIDA_LOCAL_DISPLAY_PRICE}`,
      modalIntro: es
        ? "Este plan ayuda a vendedores de comida móviles o temporales a mostrar dónde estarán, qué venden, cómo contactarlos y cómo la comunidad puede encontrarlos."
        : "This plan helps mobile or temporary food vendors show where they'll be, what they sell, how to contact them, and how the community can find them.",
      includedBullets: es
        ? [
            "Qué incluye: Perfil compacto y profesional con fotos o flyer",
            "Para quién es: Puestos, pop-ups, comida casera, vendedores móviles, mercados, eventos",
            "Qué aparece en la ficha: Zona de venta, ciudad, horarios, contacto, menú/pedidos",
            `Precio mensual: ${RESTAURANTES_COMIDA_LOCAL_DISPLAY_PRICE}`,
            "Nota: La publicación se activa después de revisión final.",
          ]
        : [
            "What's included: Compact, professional profile with photos or flyer",
            "Who it's for: Stands, pop-ups, homemade food, mobile vendors, markets, events",
            "What appears on profile: Sales zone, city, hours, contact, menu/orders",
            `Monthly price: ${RESTAURANTES_COMIDA_LOCAL_DISPLAY_PRICE}`,
            "Note: Publication activates after final review.",
          ],
      optionalUpgradeLine: couponAddon,
      optionalUpgradeBullets: es
        ? ["Opcional: cupones destacados por +$99/mes"]
        : ["Optional: featured coupons for +$99/month"],
      couponEligible: true,
      highlighted: true,
      footnote: es
        ? "Precio de pantalla Comida Local — verificar matriz Revenue OS en docs si difiere del checkout."
        : "Comida Local display price — see docs if Revenue OS matrix differs from checkout.",
    },
  ];
}

export function getServiciosCheckpointCard(
  lang: PublishCheckpointLang,
  applicationHref: string,
): PublishCheckpointCardData {
  const es = lang === "es";
  const price = monthlyPrice("servicios_base_monthly", "servicios");
  return {
    id: "servicios_profesionales",
    variant: "paid",
    eyebrow: es ? "SERVICIOS PROFESIONALES" : "PROFESSIONAL SERVICES",
    title: es ? "Servicios profesionales" : "Professional services",
    priceLabel: price,
    shortDescription: es
      ? "Para negocios y profesionales que ofrecen servicios locales: mecánicos, dentistas, contratistas, limpieza, belleza, reparación, impuestos, seguros, salud, asesorías y más."
      : "For businesses and professionals offering local services: mechanics, dentists, contractors, cleaning, beauty, repairs, taxes, insurance, health, consulting, and more.",
    ctaLabel: es ? "Publicar servicio" : "Publish service",
    ctaHref: applicationHref,
    moreLabel: es ? "Ver más" : "See more",
    modalTitle: es ? `Qué incluye Servicios profesionales — ${price}` : `What's included with Professional services — ${price}`,
    modalIntro: es
      ? "Este plan crea una ficha profesional para que clientes encuentren tu negocio, entiendan tus servicios, vean tus fotos, revisen tus horarios y contacten directamente desde Leonix."
      : "This plan creates a professional profile so customers can find your business, understand your services, see your photos, review your hours, and contact you directly from Leonix.",
    includedBullets: es
      ? [
          "Perfil visual con logo, foto principal y galería",
          "Servicios principales, especialidades y detalles rápidos",
          "Business Hub con teléfono, SMS, WhatsApp, email, sitio web y redes",
          "Áreas de servicio, ciudad, estado, ZIP y ubicación pública",
          "Horarios semanales y nota especial de horario",
          "Hasta 4 promociones generales incluidas",
          "Preparado para móvil/PWA",
        ]
      : [
          "Visual profile with logo, hero photo, and gallery",
          "Main services, specialties, and quick details",
          "Business Hub with phone, SMS, WhatsApp, email, website, and social media",
          "Service areas, city, state, ZIP, and public location",
          "Weekly hours and special hours note",
          "Up to 4 general promotions included",
          "Mobile/PWA ready",
        ],
    optionalUpgradeLine: es
      ? "Opcional: agrega cupones destacados por +$99/mes dentro de la aplicación."
      : "Optional: add featured coupons for +$99/mes inside the application.",
    optionalUpgradeBullets: es
      ? ["Cupones destacados: hasta 4, precio regular/especial, imagen y código"]
      : ["Featured coupons: up to 4, regular/special price, image and code"],
    couponEligible: isPromoEligible("servicios_base_monthly"),
  };
}

export function getAutosCheckpointCards(
  lang: PublishCheckpointLang,
  privadoHref: string,
  negociosHref: string,
): PublishCheckpointCardData[] {
  const es = lang === "es";
  const privadoPrice = oneTimePrice("autos_privado_30d", "autos", 30);
  const dealerPrice = monthlyPrice("autos_dealer_monthly", "autos");
  const upgradeDef = getRevenuePackageDefinition("autos_dealer_inventory_pack_monthly");
  const upgradePrice = upgradeDef ? formatRevenuePriceLabel(upgradeDef.priceCents) : "$129";

  return [
    {
      id: "autos_privado",
      variant: "paid",
      eyebrow: es ? "Vendedor privado" : "Private seller",
      title: es ? "Autos privado" : "Private seller",
      priceLabel: privadoPrice,
      shortDescription: es
        ? "Publica un vehículo como vendedor privado. Fotos, datos del vehículo, contacto y visibilidad en búsquedas de Autos Leonix."
        : "Post one vehicle as a private seller. Photos, vehicle details, contact, and visibility in Leonix Autos search.",
      ctaLabel: es ? "Empezar anuncio privado" : "Start private listing",
      ctaHref: privadoHref,
      moreLabel: es ? "Ver más" : "See more",
      modalTitle: es ? `Qué incluye Autos privado — ${privadoPrice}` : `What's included with Private Autos — ${privadoPrice}`,
      modalIntro: es
        ? "Ideal para vender tu auto localmente. Revisarás y confirmarás tu anuncio antes del pago en checkout."
        : "Ideal for selling your car locally. You'll review and confirm your listing before payment at checkout.",
      includedBullets: es
        ? [
            "1 vehículo por anuncio",
            "Fotos, precio, descripción y contacto",
            "Visibilidad en resultados de Autos",
            `Precio: ${privadoPrice}`,
          ]
        : [
            "1 vehicle per listing",
            "Photos, price, description, and contact",
            "Visibility in Autos results",
            `Price: ${privadoPrice}`,
          ],
      couponEligible: isPromoEligible("autos_privado_30d"),
    },
    {
      id: "autos_dealer",
      variant: "dealer",
      eyebrow: es ? "Dealer / negocio" : "Dealer / business",
      title: es ? "Dealer de Autos" : "Dealer de Autos",
      priceLabel: dealerPrice,
      billingLabel: es ? "10 vehículos incluidos" : "10 vehicles included",
      shortDescription: es
        ? "Para agencias y negocios de autos que necesitan presencia profesional e inventario de vehículos."
        : "For dealerships and auto businesses that need a professional presence and vehicle inventory.",
      ctaLabel: es ? "Empezar como dealer" : "Start as dealer",
      ctaHref: negociosHref,
      moreLabel: es ? "Ver más" : "See more",
      modalTitle: es ? `Qué incluye Dealer — ${dealerPrice}` : `What's included with Dealer — ${dealerPrice}`,
      modalIntro: es
        ? "Paquete mensual para dealers con perfil comercial e inventario activo."
        : "Monthly package for dealers with business profile and active inventory.",
      includedBullets: es
        ? [
            "Perfil de dealer y presencia profesional",
            "Hasta 10 vehículos activos incluidos",
            `Precio base: ${dealerPrice}`,
          ]
        : [
            "Dealer profile and professional presence",
            "Up to 10 active vehicles included",
            `Base price: ${dealerPrice}`,
          ],
      optionalUpgradeBullets: es
        ? [`Mejora opcional: +10 vehículos por ${upgradePrice}/mes`]
        : [`Optional upgrade: +10 vehicles for ${upgradePrice}/mo`],
      optionalUpgradeLine: es
        ? `Opcional: Paquete de inventario +10 vehículos por ${upgradePrice}/mes`
        : `Optional: Inventory pack +10 vehicles for ${upgradePrice}/mo`,
      couponEligible: isPromoEligible("autos_dealer_monthly"),
      highlighted: true,
    },
  ];
}

export function getRentasPrivadoCheckpointCard(
  lang: PublishCheckpointLang,
  privadoHref: string,
): PublishCheckpointCardData {
  const es = lang === "es";
  const price = oneTimePrice("rentas_30d", "rentas", 30);
  return {
    id: "rentas_privado",
    variant: "paid",
    eyebrow: es ? "Particular" : "Private",
    title: es ? "Rentas privado" : "Private rental",
    priceLabel: price,
    shortDescription: es
      ? "Publica una renta por 30 días: fotos, disponibilidad, requisitos, contacto y ubicación en el mapa."
      : "Publish a rental for 30 days: photos, availability, requirements, contact, and map location.",
    ctaLabel: es ? "Publicar renta" : "Publish rental",
    ctaHref: privadoHref,
    moreLabel: es ? "Ver más" : "See more",
    modalTitle: es ? `Qué incluye Rentas privado — ${price}` : `What's included with Private Rentas — ${price}`,
    modalIntro: es
      ? "Anuncio de renta para propietarios o arrendadores particulares. El pago se confirma en checkout después de la vista previa."
      : "Rental listing for individual owners or landlords. Payment is confirmed at checkout after preview.",
    includedBullets: es
      ? [
          "Ficha de renta con fotos y descripción",
          "Disponibilidad, requisitos y contacto",
          "Ubicación y mapa cuando aplique",
          `Precio: ${price}`,
        ]
      : [
          "Rental listing with photos and description",
          "Availability, requirements, and contact",
          "Location and map when applicable",
          `Price: ${price}`,
        ],
    couponEligible: isPromoEligible("rentas_30d"),
  };
}

export function getRentasNegocioCheckpointCard(
  lang: PublishCheckpointLang,
  negocioHref: string,
): PublishCheckpointCardData {
  const es = lang === "es";
  const pricePerListing = es ? "$24.99 / 30 días por anuncio" : "$24.99 / 30 days per listing";
  const matrixPrice = oneTimePrice("rentas_30d", "rentas", 30);
  return {
    id: "rentas_negocio",
    variant: "paid",
    eyebrow: es ? "Negocio" : "Business",
    title: es ? "Rentas negocio" : "Business rentals",
    priceLabel: pricePerListing,
    shortDescription: es
      ? "Publica una renta con información de negocio, contacto, requisitos, disponibilidad y ubicación."
      : "Publish a rental with business information, contact, requirements, availability, and location.",
    ctaLabel: es ? "Publicar como negocio" : "Publish as business",
    ctaHref: negocioHref,
    moreLabel: es ? "Ver más" : "See more",
    modalTitle: es
      ? `Qué incluye Rentas negocio — ${pricePerListing}`
      : `What's included with Business rentals — ${pricePerListing}`,
    modalIntro: es
      ? "Cada anuncio de renta cuesta $24.99 por 30 días. El camino de negocio recopila más información comercial y administrativa — no es un paquete con inventario incluido."
      : "Each rental listing costs $24.99 for 30 days. The business path collects more business and admin information — it is not a bulk inventory package.",
    includedBullets: es
      ? [
          `Precio por anuncio: ${pricePerListing} (misma tarifa que privado; matriz: ${matrixPrice})`,
          "Para arrendadores, administradores de propiedades o negocios",
          "Más campos de negocio/contacto en el anuncio",
          "No incluye paquete de inventario ni precio mayor por volumen",
          "Checkout y aplicación son la fuente de verdad del precio final",
        ]
      : [
          `Price per listing: ${pricePerListing} (same rate as private; matrix: ${matrixPrice})`,
          "For landlords, property managers, or businesses",
          "More business/contact fields on the listing",
          "Does not include inventory package or higher bulk pricing",
          "Application and checkout are the source of truth for final price",
        ],
    couponEligible: isPromoEligible("rentas_30d"),
    highlighted: true,
  };
}

export function getBienesRaicesCheckpointCards(
  lang: PublishCheckpointLang,
  privadoHref: string,
  negocioHref: string,
): PublishCheckpointCardData[] {
  const es = lang === "es";
  const agentPrice = monthlyPrice("br_agent_monthly", "bienes-raices");
  const fsboPrice = oneTimePrice("br_fsbo_45d", "bienes-raices", 45);
  const packPrice = formatRevenuePriceLabel(
    getRevenuePackageDefinition("br_inventory_pack_monthly")?.priceCents ?? 9900,
  );

  return [
    {
      id: "br_privado",
      variant: "paid",
      eyebrow: es ? "Particular" : "Individual",
      title: es ? "Privado (FSBO)" : "Private (FSBO)",
      priceLabel: fsboPrice,
      shortDescription: es
        ? "Para dueños y anuncios personales de una propiedad."
        : "For owners and personal property listings.",
      ctaLabel: es ? "Publicar como particular" : "Publish as individual",
      ctaHref: privadoHref,
      moreLabel: es ? "Ver más" : "See more",
      modalTitle: es ? `Qué incluye Privado — ${fsboPrice}` : `What's included with Private — ${fsboPrice}`,
      modalIntro: es
        ? "Publicación pagada por anuncio para vendedores particulares."
        : "Paid per-listing publication for individual sellers.",
      includedBullets: es
        ? ["1 propiedad por anuncio", `Precio: ${fsboPrice}`, "Vista previa antes de publicar"]
        : ["1 property per listing", `Price: ${fsboPrice}`, "Preview before publishing"],
      couponEligible: isPromoEligible("br_fsbo_45d"),
    },
    {
      id: "br_negocio",
      variant: "dealer",
      eyebrow: es ? "Profesional" : "Professional",
      title: es ? "Negocio / agente" : "Business / agent",
      priceLabel: agentPrice,
      shortDescription: es
        ? "Para agentes, equipos, oficinas y desarrolladores. Incluye vitrina de agente con 1 propiedad principal destacada."
        : "For agents, teams, offices, and developers. Includes agent showcase with 1 featured primary property.",
      ctaLabel: es ? "Publicar como agente" : "Publish as agent",
      ctaHref: negocioHref,
      moreLabel: es ? "Ver más" : "See more",
      modalTitle: es ? `Qué incluye Vitrina de agente — ${agentPrice}` : `What's included with Agent showcase — ${agentPrice}`,
      modalIntro: es
        ? "Perfil profesional con centro de contacto, fotos, video, tour y visibilidad en búsquedas."
        : "Professional profile with contact hub, photos, video, tour, and search visibility.",
      includedBullets: es
        ? [
            "1 propiedad principal/destacada",
            "Perfil profesional y centro de contacto",
            `Precio base: ${agentPrice}`,
          ]
        : [
            "1 featured primary property",
            "Professional profile and contact hub",
            `Base price: ${agentPrice}`,
          ],
      optionalUpgradeLine: es
        ? `Opcional: Paquete de inventario +${packPrice}/mes (hasta 4 propiedades adicionales)`
        : `Optional: Inventory pack +${packPrice}/mo (up to 4 additional properties)`,
      optionalUpgradeBullets: es
        ? [`Paquete de inventario: +${packPrice}/mes · hasta 4 propiedades adicionales`]
        : [`Inventory pack: +${packPrice}/mo · up to 4 additional properties`],
      couponEligible: isPromoEligible("br_agent_monthly"),
      highlighted: true,
    },
  ];
}

export function getEmpleosPaidCheckpointCard(
  lang: PublishCheckpointLang,
  quickHref: string,
): PublishCheckpointCardData {
  const es = lang === "es";
  const price = oneTimePrice(EMPLEOS_JOB_POST_PAID_PACKAGE_KEY, "empleos", 30);
  return {
    id: "empleos_paid",
    variant: "paid",
    eyebrow: es ? "Empleo local" : "Local job",
    title: es ? "Publicar empleo" : "Post a job",
    priceLabel: price,
    shortDescription: es
      ? "Anuncia un puesto local con fotos, videos y contacto directo."
      : "Advertise one local position with photos, videos, and direct contact.",
    ctaLabel: es ? "Publicar empleo" : "Post a job",
    ctaHref: quickHref,
    moreLabel: es ? "Ver más" : "See more",
    modalTitle: es ? `Qué incluye Publicar empleo — ${price}` : `What's included with Post a job — ${price}`,
    modalIntro: es
      ? "Anuncio de empleo pagado por 30 días. Vista previa antes de publicar."
      : "Paid job ad for 30 days. Preview before publishing.",
    includedBullets: es
      ? [
          "1 puesto por anuncio",
          "Fotos y hasta 4 videos",
          "Contacto directo",
          `Precio: ${price}`,
        ]
      : ["1 position per ad", "Photos and up to 4 videos", "Direct contact", `Price: ${price}`],
    couponEligible: isPromoEligible(EMPLEOS_JOB_POST_PAID_PACKAGE_KEY),
    highlighted: true,
  };
}

export function getEmpleosFreeCheckpointCard(
  lang: PublishCheckpointLang,
  feriaHref: string,
): PublishCheckpointCardData {
  const es = lang === "es";
  return {
    id: "empleos_feria",
    variant: "free",
    eyebrow: es ? "Comunidad" : "Community",
    title: es ? "Publicar feria de empleo" : "Post a job fair",
    priceLabel: es ? "Gratis" : "Free",
    shortDescription: es
      ? "Comparte una feria, reclutamiento comunitario o evento de contratación."
      : "Share a hiring fair, community recruiting event, or hiring event.",
    ctaLabel: es ? "Publicar feria gratis" : "Post free job fair",
    ctaHref: feriaHref,
    moreLabel: es ? "Ver más" : "See more",
    modalTitle: es ? "Feria de empleos — Gratis" : "Job fair — Free",
    modalIntro: es
      ? "Publicación gratuita para eventos de reclutamiento comunitario. Sin código Launch 25 ni checkout."
      : "Free publication for community recruiting events. No Launch 25 code or checkout.",
    includedBullets: es
      ? ["Evento o feria de empleo", "Sin pago ni cupón", "Vista previa antes de publicar"]
      : ["Job fair or hiring event", "No payment or coupon", "Preview before publishing"],
    couponEligible: false,
  };
}
