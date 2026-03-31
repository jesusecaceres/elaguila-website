import type { TiendaCategory } from "../types/tienda";

export const TIENDA_CATEGORY_SLUGS = [
  "business-cards",
  "flyers",
  "brochures",
  "banners",
  "signs",
  "stickers-labels",
  "promo-products",
  "marketing-materials",
] as const;

export type TiendaCategorySlug = (typeof TIENDA_CATEGORY_SLUGS)[number];

export const tiendaCategories: TiendaCategory[] = [
  {
    id: "cat-business-cards",
    slug: "business-cards",
    eyebrow: { es: "Esencial", en: "Essential" },
    title: { es: "Tarjetas de Presentación", en: "Business Cards" },
    description: {
      es: "Clásicas, premium y listas para ventas. Acabados y cortes con presencia.",
      en: "Classic and premium options built for sales. Finishes and cuts with presence.",
    },
    href: "/tienda/c/business-cards",
    featured: true,
    accent: "gold",
    familyCount: 2,
    familySlugs: ["standard-business-cards", "two-sided-business-cards"],
    productMode: "design-online",
    heroSummary: {
      es: "Diseña en línea con el constructor Leonix o, más adelante, sube un archivo si tu flujo lo requiere.",
      en: "Design online with the Leonix builder—or upload a file later if your workflow needs it.",
    },
    supportMessage: {
      es: "¿Marca corporativa avanzada o cantidades especiales? Escríbenos—we’ll align options.",
      en: "Advanced brand work or special quantities? Contact us—we’ll align options.",
    },
    howOrderingWorks: {
      es: "Elige una familia (una cara o dos), abre el configurador cuando esté activo, arma y aprueba tu tarjeta, luego completa la compra.",
      en: "Pick a family (one‑ or two‑sided), open the configurator when live, build and approve your card, then complete checkout.",
    },
  },
  {
    id: "cat-flyers",
    slug: "flyers",
    eyebrow: { es: "Promoción", en: "Promotion" },
    title: { es: "Volantes", en: "Flyers" },
    description: {
      es: "Impulsa ofertas, eventos y campañas con impresión nítida.",
      en: "Boost offers, events, and campaigns with crisp print.",
    },
    href: "/tienda/c/flyers",
    accent: "stone",
    familySlugs: ["flyers-standard"],
    productMode: "upload-ready",
    heroSummary: {
      es: "Sube tu PDF listo para imprenta. Validación y pruebas digitales llegarán en el configurador.",
      en: "Upload press‑ready PDFs. Validation and digital proofs arrive in the configurator.",
    },
    supportMessage: {
      es: "¿Necesitas diseño desde cero? Leonix puede ayudarte antes de imprimir.",
      en: "Need design from scratch? Leonix can help before we print.",
    },
    howOrderingWorks: {
      es: "Selecciona volantes estándar, define tamaño y cantidad, sube tu archivo y aprueba la prueba antes de producción.",
      en: "Choose standard flyers, set size and quantity, upload your file, and approve the proof before production.",
    },
  },
  {
    id: "cat-brochures",
    slug: "brochures",
    eyebrow: { es: "Ventas", en: "Sales" },
    title: { es: "Brochures", en: "Brochures" },
    description: {
      es: "Presenta tus servicios con un formato editorial y profesional.",
      en: "Present services with an editorial, professional format.",
    },
    href: "/tienda/c/brochures",
    accent: "cream",
    familySlugs: ["brochures-standard"],
    productMode: "upload-ready",
    heroSummary: {
      es: "Piezas plegadas con marcas de plegado y sangrado correctos en tu archivo.",
      en: "Folded pieces need correct fold marks and bleed in your file.",
    },
    supportMessage: {
      es: "¿No tienes archivo? Pedimos diseño o retoque con el equipo Leonix.",
      en: "No file yet? We’ll route you to design or retouch with the Leonix team.",
    },
    howOrderingWorks: {
      es: "Elige brochure, tipo de pliegue, cantidad, sube arte y aprueba antes de imprimir.",
      en: "Pick brochure, fold type, quantity, upload art, and approve before print.",
    },
  },
  {
    id: "cat-banners",
    slug: "banners",
    eyebrow: { es: "Exterior", en: "Outdoor" },
    title: { es: "Banners", en: "Banners" },
    description: {
      es: "Impacto grande para anuncios, aperturas y promociones.",
      en: "Big impact for announcements, openings, and promos.",
    },
    href: "/tienda/c/banners",
    accent: "sky",
    familySlugs: ["retractable-banners"],
    productMode: "upload-ready",
    heroSummary: {
      es: "Retráctiles y displays verticales: arte a la medida exacta del soporte.",
      en: "Retractables and vertical displays—art sized exactly to the hardware.",
    },
    supportMessage: {
      es: "Eventos grandes o instalaciones especiales: cotización con Leonix.",
      en: "Large events or special installs—get a Leonix quote.",
    },
    howOrderingWorks: {
      es: "Selecciona banner retráctil, confirma medidas del soporte, sube el gráfico y aprueba.",
      en: "Select retractable banner, confirm hardware dimensions, upload graphic, and approve.",
    },
  },
  {
    id: "cat-signs",
    slug: "signs",
    eyebrow: { es: "Señalización", en: "Signage" },
    title: { es: "Letreros", en: "Signs" },
    description: {
      es: "Yard signs, paneles y señalización para orientar y vender.",
      en: "Yard signs, panels, and signage to guide and sell.",
    },
    href: "/tienda/c/signs",
    accent: "sage",
    familySlugs: ["yard-signs"],
    productMode: "upload-ready",
    heroSummary: {
      es: "Exterior legible a distancia—archivos en alta resolución recomendada.",
      en: "Outdoor legibility—high‑resolution files recommended.",
    },
    supportMessage: {
      es: "¿Varios diseños o instalación? Coordinemos con la oficina.",
      en: "Multiple designs or install? Coordinate with the office.",
    },
    howOrderingWorks: {
      es: "Elige yard sign, tamaño y cantidad, sube tu arte y aprueba la prueba.",
      en: "Pick yard sign, size and quantity, upload art, and approve proof.",
    },
  },
  {
    id: "cat-stickers",
    slug: "stickers-labels",
    eyebrow: { es: "Branding", en: "Branding" },
    title: { es: "Stickers & Etiquetas", en: "Stickers & Labels" },
    description: {
      es: "Marca, empaques y promociones con adhesivos de calidad.",
      en: "Brand packaging and promos with quality adhesive print.",
    },
    href: "/tienda/c/stickers-labels",
    accent: "plum",
    familySlugs: ["stickers-standard"],
    productMode: "upload-ready",
    heroSummary: {
      es: "Vector o raster alta resolución. Troquel avanzado vendrá después.",
      en: "Vector or hi‑res raster. Advanced die‑cut comes later.",
    },
    supportMessage: {
      es: "Empaques complejos: mejor con revisión humana en Leonix.",
      en: "Complex packaging—best with human review at Leonix.",
    },
    howOrderingWorks: {
      es: "Selecciona stickers, acabado y cantidad, sube arte con sangrado, aprueba.",
      en: "Pick stickers, finish and quantity, upload art with bleed, approve.",
    },
  },
  {
    id: "cat-promo",
    slug: "promo-products",
    eyebrow: { es: "Regalos", en: "Giveaways" },
    title: { es: "Productos Promocionales", en: "Promo Products" },
    description: {
      es: "Merch para eventos y clientes. Ideal para fidelización.",
      en: "Merch for events and clients. Built for retention.",
    },
    href: "/tienda/c/promo-products",
    accent: "gold",
    familySlugs: ["promo-giveaways"],
    productMode: "mixed",
    heroSummary: {
      es: "Catálogo amplio y variables por proveedor—empezamos con cotización y soporte.",
      en: "Broad vendor‑dependent catalog—starting with quotes and support.",
    },
    supportMessage: {
      es: "Cuéntanos fecha, cantidad y presupuesto—we’ll propose opciones.",
      en: "Share date, quantity, and budget—we’ll propose options.",
    },
    howOrderingWorks: {
      es: "Explora la familia promocional, contacta para cotización y aprueba arte antes de producir.",
      en: "Browse the promo family, contact for a quote, and approve art before production.",
    },
  },
  {
    id: "cat-marketing",
    slug: "marketing-materials",
    eyebrow: { es: "Kit", en: "Kit" },
    title: { es: "Materiales de Marketing", en: "Marketing Materials" },
    description: {
      es: "Postcards, menús, folletos y piezas de campaña en un solo lugar.",
      en: "Postcards, menus, handouts, and campaign pieces in one place.",
    },
    href: "/tienda/c/marketing-materials",
    accent: "stone",
    familySlugs: ["postcards-standard"],
    productMode: "mixed",
    heroSummary: {
      es: "Piezas de correo y campaña—upload primero, diseño en línea después donde aplique.",
      en: "Mail and campaign pieces—upload first, online design later where it fits.",
    },
    supportMessage: {
      es: "Campañas multi‑pieza: coordinamos con Leonix para coherencia de marca.",
      en: "Multi‑piece campaigns—we coordinate brand consistency with Leonix.",
    },
    howOrderingWorks: {
      es: "Elige postcards u otras piezas, prepara tu archivo o solicita diseño, aprueba prueba, ordena.",
      en: "Pick postcards or related pieces, prepare files or request design, approve proof, order.",
    },
  },
];

export const tiendaCategoryBySlug = Object.fromEntries(
  tiendaCategories.map((c) => [c.slug, c])
) as Record<string, TiendaCategory>;
