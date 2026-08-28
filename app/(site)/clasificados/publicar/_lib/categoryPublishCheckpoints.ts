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

export function getRestaurantesCheckpointCards(
  lang: PublishCheckpointLang,
  withLang: (path: string, extra?: Record<string, string>) => string,
): PublishCheckpointCardData[] {
  const es = lang === "es";
  const couponAddon = es
    ? "Cupones y ofertas destacadas incluidos sin costo adicional."
    : "Featured coupons and offers included at no extra cost.";
  const establishedPrice = monthlyPrice("restaurantes_base_monthly", "restaurantes");
  // Comida Local is its own category with its own real price (comida_local_base_monthly) — this
  // card is a cross-link to that canonical product for a visitor browsing the Restaurantes
  // selector, never a separate Restaurantes-priced product. It must show the real current Comida
  // Local price and route to the real Comida Local application, never into the Restaurantes
  // checkout flow. Fixed defect: this card previously showed a stale "$199/mes" literal and
  // routed into /publicar/restaurantes?product=mobile_food_vendor, whose checkout always charged
  // the real Restaurantes $399/mo base price regardless of that display — a real price-mismatch
  // defect, not a legitimate Restaurantes product tier.
  const comidaLocalPrice = monthlyPrice("comida_local_base_monthly", "comida-local");

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
        ? ["Cupones destacados: hasta 4, incluidos en tu plan"]
        : ["Featured coupons: up to 4, included with your plan"],
      couponEligible: isPromoEligible("restaurantes_base_monthly"),
      highlighted: false,
    },
    {
      id: "comida_local",
      variant: "paid",
      eyebrow: es ? "Comida Local" : "Local Food",
      title: es ? "Puesto, pop-up o vendedor móvil" : "Stand, pop-up, or mobile vendor",
      priceLabel: comidaLocalPrice,
      shortDescription: es
        ? "Para puestos, pop-ups, comida casera, vendedores móviles y fines de semana. Ideal para negocios que venden por ubicación temporal, eventos o servicio local."
        : "For stands, pop-ups, homemade food, mobile vendors, and weekend operations. Ideal for businesses that sell at temporary locations, events, or local service.",
      ctaLabel: es ? "Publicar comida local" : "Publish local food",
      // Comida Local is its own category — route to its own canonical application, never into
      // the Restaurantes checkout flow (see comment above; this used to route into
      // /publicar/restaurantes?product=mobile_food_vendor, which charged $399, not the $199 this
      // card displayed).
      ctaHref: withLang("/publicar/comida-local"),
      moreLabel: es ? "Ver más" : "See more",
      modalTitle: es
        ? `Qué incluye Puesto / Pop-up / Vendedor móvil — ${comidaLocalPrice}`
        : `What's included with Stand / Pop-up / Mobile vendor — ${comidaLocalPrice}`,
      modalIntro: es
        ? "Este plan ayuda a vendedores de comida móviles o temporales a mostrar dónde estarán, qué venden, cómo contactarlos y cómo la comunidad puede encontrarlos."
        : "This plan helps mobile or temporary food vendors show where they'll be, what they sell, how to contact them, and how the community can find them.",
      includedBullets: es
        ? [
            "Qué incluye: Perfil compacto y profesional con fotos o flyer",
            "Para quién es: Puestos, pop-ups, comida casera, vendedores móviles, mercados, eventos",
            "Qué aparece en la ficha: Zona de venta, ciudad, horarios, contacto, menú/pedidos",
            `Precio mensual: ${comidaLocalPrice}`,
            "Nota: La publicación se activa después de revisión final.",
          ]
        : [
            "What's included: Compact, professional profile with photos or flyer",
            "Who it's for: Stands, pop-ups, homemade food, mobile vendors, markets, events",
            "What appears on profile: Sales zone, city, hours, contact, menu/orders",
            `Monthly price: ${comidaLocalPrice}`,
            "Note: Publication activates after final review.",
          ],
      optionalUpgradeLine: couponAddon,
      optionalUpgradeBullets: es
        ? ["Cupones destacados incluidos en tu plan"]
        : ["Featured coupons included with your plan"],
      couponEligible: isPromoEligible("comida_local_base_monthly"),
      highlighted: true,
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
      ? "Cupones y ofertas destacadas incluidos sin costo adicional dentro de la aplicación."
      : "Featured coupons and offers included at no extra cost inside the application.",
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
      title: es ? "Dealers de Autos" : "Auto Dealers",
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
    title: es ? "Publicar renta" : "Publish rental",
    priceLabel: price,
    shortDescription: es
      ? "Publica una propiedad en renta por 30 días. Si tienes otra propiedad, crea un nuevo anuncio."
      : "Publish one rental property for 30 days. If you have another property, create a new listing.",
    ctaLabel: es ? "Publicar renta" : "Publish rental",
    ctaHref: privadoHref,
    moreLabel: es ? "Ver más" : "See more",
    modalTitle: es ? `Qué incluye Publicar renta — ${price}` : `What's included — Publish rental — ${price}`,
    modalIntro: es
      ? "Anuncio pagado para propietarios o arrendadores particulares. El pago se confirma en checkout después de la vista previa."
      : "Paid listing for individual owners or landlords. Payment is confirmed at checkout after preview.",
    includedBullets: es
      ? [
          "Ficha de renta con fotos y descripción",
          "Disponibilidad, requisitos y contacto",
          "Ubicación y mapa cuando aplique",
          `Precio: ${price}`,
          "Este paquete no incluye inventario adicional. Cada renta debe tener su propio anuncio.",
        ]
      : [
          "Rental listing with photos and description",
          "Availability, requirements, and contact",
          "Location and map when applicable",
          `Price: ${price}`,
          "This package does not include extra inventory. Each rental needs its own listing.",
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
    title: es ? "Publicar renta (negocio)" : "Publish rental (business)",
    priceLabel: pricePerListing,
    shortDescription: es
      ? "Publica una propiedad en renta por 30 días. Si tienes otra propiedad, crea un nuevo anuncio."
      : "Publish one rental property for 30 days. If you have another property, create a new listing.",
    ctaLabel: es ? "Publicar como negocio" : "Publish as business",
    ctaHref: negocioHref,
    moreLabel: es ? "Ver más" : "See more",
    modalTitle: es
      ? `Qué incluye Rentas negocio — ${pricePerListing}`
      : `What's included with Business rentals — ${pricePerListing}`,
    modalIntro: es
      ? "Cada anuncio de renta cuesta $24.99 por 30 días (misma tarifa que privado). El pago se confirma en checkout después de la vista previa."
      : "Each rental listing costs $24.99 for 30 days (same rate as private). Payment is confirmed at checkout after preview.",
    includedBullets: es
      ? [
          `Precio por anuncio: ${pricePerListing} (matriz: ${matrixPrice})`,
          "Para arrendadores, administradores de propiedades o negocios",
          "Más campos de negocio/contacto en el anuncio",
          "Este paquete no incluye inventario adicional. Cada renta debe tener su propio anuncio.",
          "Checkout y aplicación son la fuente de verdad del precio final",
        ]
      : [
          `Price per listing: ${pricePerListing} (matrix: ${matrixPrice})`,
          "For landlords, property managers, or businesses",
          "More business/contact fields on the listing",
          "This package does not include extra inventory. Each rental needs its own listing.",
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
      title: es ? "Dueño particular" : "Private owner",
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

/**
 * Globalization Package A Gate 2 — free quick-lane checkpoint cards.
 *
 * Before this gate, the seven lanes below had NO checkpoint before their application (recorded
 * as P3 Gate 6 "NOT YET BUILT"). Each card is truthful against `revenuePricingMatrix.ts`: the
 * free lanes' matrix entries are genuinely $0 (`busco_free`, `clases_free`, `comunidad_free`,
 * `mascotas_free`, `en_venta_free_v1`) or absent entirely (comida_local pipeline — no SKU, no
 * payment wiring), and Viajes prices come from the matrix (`viajes_business_monthly`). The
 * dormant `clases_paid_30d` SKU is deliberately NOT shown — no checkout path exists for it
 * (owner decision D2: launch free-only).
 */
type FreeQuickCheckpointCopy = {
  id: string;
  eyebrow: { es: string; en: string };
  title: { es: string; en: string };
  shortDescription: { es: string; en: string };
  ctaLabel: { es: string; en: string };
  modalTitle: { es: string; en: string };
  modalIntro: { es: string; en: string };
  includedBullets: { es: readonly string[]; en: readonly string[] };
};

function buildFreeQuickCheckpointCard(
  copy: FreeQuickCheckpointCopy,
  lang: PublishCheckpointLang,
  ctaHref: string,
): PublishCheckpointCardData {
  const es = lang === "es";
  return {
    id: copy.id,
    variant: "free",
    eyebrow: es ? copy.eyebrow.es : copy.eyebrow.en,
    title: es ? copy.title.es : copy.title.en,
    priceLabel: es ? "Gratis" : "Free",
    shortDescription: es ? copy.shortDescription.es : copy.shortDescription.en,
    ctaLabel: es ? copy.ctaLabel.es : copy.ctaLabel.en,
    ctaHref,
    moreLabel: es ? "Ver más" : "See more",
    modalTitle: es ? copy.modalTitle.es : copy.modalTitle.en,
    modalIntro: es ? copy.modalIntro.es : copy.modalIntro.en,
    includedBullets: es ? copy.includedBullets.es : copy.includedBullets.en,
    couponEligible: false,
  };
}

export function getBuscoCheckpointCard(lang: PublishCheckpointLang, quickHref: string): PublishCheckpointCardData {
  return buildFreeQuickCheckpointCard(
    {
      id: "busco_free",
      eyebrow: { es: "Comunidad", en: "Community" },
      title: { es: "Publicar Busco / Se Busca", en: "Post a Busco / Wanted ad" },
      shortDescription: {
        es: "Publica gratis lo que buscas — artículos, servicios, vivienda o ayuda — y recibe respuestas de la comunidad.",
        en: "Post what you're looking for — items, services, housing, or help — for free and get responses from the community.",
      },
      ctaLabel: { es: "Publicar gratis", en: "Post for free" },
      modalTitle: { es: "Busco / Se Busca — Gratis", en: "Busco / Wanted — Free" },
      modalIntro: {
        es: "Publicación gratuita. Sin pago ni cupón. Vista previa antes de publicar, y puedes editar tu anuncio desde tu panel.",
        en: "Free publication. No payment or coupon. Preview before publishing, and you can edit your ad from your dashboard.",
      },
      includedBullets: {
        es: ["Anuncio de búsqueda con fotos", "Contacto directo", "Vista previa antes de publicar", "Edición desde tu panel"],
        en: ["Wanted ad with photos", "Direct contact", "Preview before publishing", "Edit from your dashboard"],
      },
    },
    lang,
    quickHref,
  );
}

export function getClasesCheckpointCard(lang: PublishCheckpointLang, quickHref: string): PublishCheckpointCardData {
  return buildFreeQuickCheckpointCard(
    {
      id: "clases_free",
      eyebrow: { es: "Comunidad", en: "Community" },
      title: { es: "Publicar una clase", en: "Post a class" },
      shortDescription: {
        es: "Comparte tu clase, curso o taller — varias disciplinas, horario, materiales, pagos aceptados y más. Publicar en Leonix es gratis; si tu clase tiene costo para el estudiante, eso no cambia la publicación.",
        en: "Share your class, course, or workshop — multiple disciplines, schedule, materials, accepted payments, and more. Posting on Leonix is free; a paid class for students doesn't change that.",
      },
      ctaLabel: { es: "Publicar clase gratis", en: "Post class for free" },
      modalTitle: { es: "Clases — Gratis", en: "Classes — Free" },
      modalIntro: {
        es: "Publicación gratuita para clases y talleres. Sin pago ni cupón. Vista previa antes de publicar.",
        en: "Free publication for classes and workshops. No payment or coupon. Preview before publishing.",
      },
      includedBullets: {
        es: [
          "Clase, curso o taller — hasta 4 tipos por anuncio (ej. Boxeo + Yoga + Pilates)",
          "Presencial, en línea o híbrida, con horario semanal y fechas opcionales",
          "Materiales, requisitos y nivel de la clase",
          "Pagos aceptados por el instructor (efectivo, Zelle, Venmo, tarjeta y más)",
          "Fotos/flyer y contacto directo",
          "Vista previa antes de publicar",
          "Edición desde tu panel",
        ],
        en: [
          "Class, course, or workshop — up to 4 types per listing (e.g. Boxing + Yoga + Pilates)",
          "In person, online, or hybrid, with weekly schedule and optional dates",
          "Materials, requirements, and class level",
          "Payments the instructor accepts (cash, Zelle, Venmo, card, and more)",
          "Photos/flyer and direct contact",
          "Preview before publishing",
          "Edit from your dashboard",
        ],
      },
    },
    lang,
    quickHref,
  );
}

export function getComunidadCheckpointCard(lang: PublishCheckpointLang, quickHref: string): PublishCheckpointCardData {
  return buildFreeQuickCheckpointCard(
    {
      id: "comunidad_free",
      eyebrow: { es: "Comunidad", en: "Community" },
      title: { es: "Publicar evento comunitario", en: "Post a community event" },
      shortDescription: {
        es: "Anuncia gratis eventos, celebraciones, reuniones y actividades de la comunidad.",
        en: "Announce community events, celebrations, gatherings, and activities for free.",
      },
      ctaLabel: { es: "Publicar evento gratis", en: "Post event for free" },
      modalTitle: { es: "Comunidad y Eventos — Gratis", en: "Community & Events — Free" },
      modalIntro: {
        es: "Leonix ayuda a organizadores comunitarios a dar a su evento una presencia útil: flyer, información clara, enlaces de interés y contacto directo — todo con vista previa antes de publicar.",
        en: "Leonix helps community organizers give their event a useful presence: flyer, clear info, helpful links, and direct contact — all with a preview before you publish.",
      },
      includedBullets: {
        es: [
          "Flyer/imagen y datos del evento",
          "Fechas y horarios",
          "Estado: gratis, pagado o donación",
          "Enlaces de registro, boletos, donación y recursos",
          "Contacto del organizador y redes sociales",
          "Ubicación con mapa",
          "Vista previa antes de publicar",
          "Descubrimiento local en tu comunidad",
        ],
        en: [
          "Flyer/image and event details",
          "Dates and times",
          "Status: free, paid, or donation",
          "Registration, ticket, donation, and resource links",
          "Organizer contact and social links",
          "Location with map",
          "Preview before publishing",
          "Local discovery in your community",
        ],
      },
    },
    lang,
    quickHref,
  );
}

export function getMascotasCheckpointCard(lang: PublishCheckpointLang, quickHref: string): PublishCheckpointCardData {
  return buildFreeQuickCheckpointCard(
    {
      id: "mascotas_free",
      eyebrow: { es: "Comunidad", en: "Community" },
      title: { es: "Publicar mascota o aviso", en: "Post a pet or notice" },
      shortDescription: {
        es: "Publica gratis mascotas en adopción, perdidos y encontrados para tu comunidad.",
        en: "Post pets for adoption and lost & found notices for your community, free.",
      },
      ctaLabel: { es: "Publicar aviso gratis", en: "Post notice for free" },
      modalTitle: { es: "Mascotas y Perdidos — Gratis", en: "Pets & Lost — Free" },
      modalIntro: {
        es: "Publicación gratuita para avisos de mascotas y objetos. Sin pago ni cupón. Tu aviso puede ayudar a reportar una mascota perdida o encontrada, publicar una adopción, o reportar un objeto perdido o encontrado.",
        en: "Free publication for pet and item notices. No payment or coupon. Your notice can report a lost or found pet, post a pet adoption, or report a lost or found item.",
      },
      includedBullets: {
        es: [
          "Reporta una mascota perdida o encontrada",
          "Publica una adopción de mascota",
          "Reporta un objeto perdido o encontrado",
          "Hasta 4 fotos y señas particulares",
          "Recompensa opcional, visible en el aviso",
          "Teléfono, texto, WhatsApp, correo y redes sociales — el que prefieras",
          "Área de última vez vista/encontrada",
          "Vista previa antes de publicar",
          "Comparte tu aviso con la comunidad",
        ],
        en: [
          "Report a lost or found pet",
          "Post a pet adoption",
          "Report a lost or found item",
          "Up to 4 photos and identifying details",
          "Optional reward, shown on the notice",
          "Phone, text, WhatsApp, email, or social — whichever you prefer",
          "Last-seen/found area",
          "Preview before publishing",
          "Share your notice with the community",
        ],
      },
    },
    lang,
    quickHref,
  );
}

export function getEnVentaCheckpointCard(lang: PublishCheckpointLang, proHref: string): PublishCheckpointCardData {
  return buildFreeQuickCheckpointCard(
    {
      id: "en_venta_free",
      eyebrow: { es: "En Venta / Varios", en: "For Sale / Misc" },
      title: { es: "Publicar artículo en venta", en: "Post an item for sale" },
      shortDescription: {
        es: "Vende artículos, muebles, electrónicos y más — publicación gratuita con fotos y contacto directo.",
        en: "Sell items, furniture, electronics, and more — free publication with photos and direct contact.",
      },
      ctaLabel: { es: "Publicar gratis", en: "Post for free" },
      modalTitle: { es: "En Venta — Gratis", en: "For Sale — Free" },
      modalIntro: {
        es: "Publicación gratuita. Sin pago ni cupón. Vista previa antes de publicar, y tu anuncio se administra desde tu panel.",
        en: "Free publication. No payment or coupon. Preview before publishing, and your ad is managed from your dashboard.",
      },
      includedBullets: {
        es: ["Anuncio con galería de fotos", "Precio y contacto directo", "Vista previa antes de publicar", "Edición y republicación desde tu panel"],
        en: ["Ad with photo gallery", "Price and direct contact", "Preview before publishing", "Edit and republish from your dashboard"],
      },
    },
    lang,
    proHref,
  );
}

export function getComidaLocalCheckpointCard(lang: PublishCheckpointLang, applicationHref: string): PublishCheckpointCardData {
  const es = lang === "es";
  const price = monthlyPrice("comida_local_base_monthly", "comida-local");
  return {
    id: "comida_local_pipeline",
    variant: "paid",
    eyebrow: es ? "Comida Local" : "Local Food",
    title: es ? "Publicar comida local" : "Post local food",
    priceLabel: price,
    shortDescription: es
      ? "Para puestos, pop-ups, comida casera y vendedores móviles. Ficha con fotos, horario, ubicación y contacto directo."
      : "For stands, pop-ups, homemade food, and mobile vendors. A listing with photos, schedule, location, and direct contact.",
    ctaLabel: es ? "Publicar comida local" : "Post local food",
    ctaHref: applicationHref,
    moreLabel: es ? "Ver más" : "See more",
    modalTitle: es ? `Qué incluye Comida Local — ${price}` : `What's included with Local Food — ${price}`,
    modalIntro: es
      ? "Este plan crea una ficha para tu puesto o negocio de comida local: dónde te encuentran hoy, qué vendes, horario y cómo contactarte."
      : "This plan creates a listing for your local food stand or business: where to find you today, what you sell, hours, and how to contact you.",
    includedBullets: es
      ? [
          "Puesto, pop-up, comida casera o vendedor móvil",
          "«Encuéntrame hoy» — ubicación del día, aparte de tu dirección privada",
          "Fotos, horario semanal y galería",
          "Teléfono, WhatsApp, correo y redes sociales",
          "Vista previa antes de publicar",
        ]
      : [
          "Stand, pop-up, homemade food, or mobile vendor",
          "“Find me today” — today's location, separate from your private address",
          "Photos, weekly hours, and gallery",
          "Phone, WhatsApp, email, and social media",
          "Preview before publishing",
        ],
    couponEligible: isPromoEligible("comida_local_base_monthly"),
  };
}

export function getViajesCheckpointCards(
  lang: PublishCheckpointLang,
  negociosHref: string,
  privadoHref: string,
): PublishCheckpointCardData[] {
  const es = lang === "es";
  const businessPrice = monthlyPrice("viajes_business_monthly", "viajes");
  return [
    {
      id: "viajes_negocios",
      variant: "paid",
      eyebrow: es ? "Negocio de viajes" : "Travel business",
      title: es ? "Publicar como negocio de viajes" : "Publish as a travel business",
      priceLabel: businessPrice,
      shortDescription: es
        ? "Para agencias, operadores y negocios de viajes. Perfil con ofertas, galería, contacto y presencia en Leonix Viajes."
        : "For agencies, operators, and travel businesses. Profile with offers, gallery, contact, and presence on Leonix Viajes.",
      ctaLabel: es ? "Publicar como negocio" : "Publish as business",
      ctaHref: negociosHref,
      moreLabel: es ? "Ver más" : "See more",
      modalTitle: es
        ? `Qué incluye Negocio de viajes — ${businessPrice}`
        : `What's included with Travel business — ${businessPrice}`,
      modalIntro: es
        ? "Publicación de negocio de viajes. Tu anuncio pasa por revisión antes de aparecer públicamente."
        : "Travel business publication. Your listing goes through review before appearing publicly.",
      includedBullets: es
        ? [
            "Perfil de negocio con ofertas de viaje",
            "Fotos, contacto y enlaces",
            `Precio mensual: ${businessPrice}`,
            "Nota: la publicación se activa después de revisión.",
          ]
        : [
            "Business profile with travel offers",
            "Photos, contact, and links",
            `Monthly price: ${businessPrice}`,
            "Note: publication activates after review.",
          ],
      couponEligible: isPromoEligible("viajes_business_monthly"),
      highlighted: true,
    },
    buildFreeQuickCheckpointCard(
      {
        id: "viajes_privado",
        eyebrow: { es: "Particular", en: "Private" },
        title: { es: "Publicar viaje como particular", en: "Publish a trip as a private seller" },
        shortDescription: {
          es: "Comparte un viaje, tour o experiencia como particular — publicación gratuita con revisión.",
          en: "Share a trip, tour, or experience as a private seller — free publication with review.",
        },
        ctaLabel: { es: "Publicar como particular", en: "Publish as private" },
        modalTitle: { es: "Viajes particular — Gratis", en: "Private travel — Free" },
        modalIntro: {
          es: "Publicación gratuita para particulares. Sin pago ni cupón. Tu anuncio pasa por revisión antes de aparecer públicamente.",
          en: "Free publication for private sellers. No payment or coupon. Your listing goes through review before appearing publicly.",
        },
        includedBullets: {
          es: ["Viaje, tour o experiencia", "Fotos y contacto", "Revisión antes de publicación pública"],
          en: ["Trip, tour, or experience", "Photos and contact", "Review before public publication"],
        },
      },
      lang,
      privadoHref,
    ),
  ];
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
