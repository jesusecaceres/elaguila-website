import type { TiendaProductFamily } from "../types/tienda";

const respUpload: TiendaProductFamily["responsibilityBullets"] = [
  {
    es: "Los archivos listos para imprimir obtienen el mejor resultado. Verifica resolución, sangrado y márgenes seguros.",
    en: "Print‑ready files get the best outcome. Check resolution, bleed, and safe margins.",
  },
  {
    es: "Archivos de baja resolución pueden verse pixelados o opacos al imprimir.",
    en: "Low‑resolution files may look soft or muddy in print.",
  },
  {
    es: "Leonix imprime el archivo que apruebes tal como se envía.",
    en: "Leonix prints the file you approve as submitted.",
  },
  {
    es: "Revisa ortografía, tamaños, colores y diseño antes de aprobar.",
    en: "Review spelling, sizing, colors, and layout before you approve.",
  },
];

const respDesign: TiendaProductFamily["responsibilityBullets"] = [
  {
    es: "Podrás cargar tu logo, ingresar texto y revisar frente y reverso antes de comprar (editor próximamente).",
    en: "You’ll upload your logo, enter copy, and review front/back before purchase (editor coming soon).",
  },
  {
    es: "Aún así, revisa cuidadosamente la vista previa final: lo aprobado es lo que producimos.",
    en: "Still review the final preview carefully—what you approve is what we produce.",
  },
  {
    es: "Para diseño avanzado o archivos fuera de plantilla, usa la ruta de ayuda de Leonix.",
    en: "For advanced design or non‑template work, use Leonix’s help path.",
  },
];

export const tiendaProductFamilies: TiendaProductFamily[] = [
  {
    id: "pf-standard-bc",
    slug: "standard-business-cards",
    categorySlug: "business-cards",
    title: { es: "Tarjetas estándar (un lado)", en: "Standard business cards (one side)" },
    description: {
      es: "Diseño en línea con plantillas Leonix. Ideal para equipos y ventas rápidas.",
      en: "Online design with Leonix templates. Built for teams and fast turnaround.",
    },
    longDescription: {
      es: "Pronto podrás cargar tu logo, ingresar nombre e información, alinear elementos en el lienzo y aprobar el frente antes de comprar. Esta familia es la base del constructor de tarjetas Leonix.",
      en: "Soon you’ll upload your logo, enter name and details, arrange elements on the canvas, and approve the front before purchase. This family anchors the Leonix business card builder.",
    },
    productMode: "design-online",
    startingPrice: { amount: 95, currency: "USD" },
    badges: [
      { es: "Diseño en línea", en: "Design online" },
      { es: "Listo para negocios", en: "Business‑ready" },
    ],
    specs: [
      { es: "Tamaño estándar 3.5\" × 2\"", en: 'Standard size 3.5" × 2"' },
      { es: "Impresión a todo color", en: "Full‑color print" },
      { es: "Papel premium", en: "Premium stock options" },
    ],
    optionsSummary: [
      { es: "Cantidades comunes: 250, 500, 1000+", en: "Common quantities: 250, 500, 1000+" },
      { es: "Acabados y cortes según disponibilidad", en: "Finishes and cuts as available" },
    ],
    supportsUpload: false,
    supportsOnlineDesign: true,
    supportsTwoSided: false,
    requiresApproval: true,
    needsPrintReadyFiles: false,
    futureConfiguratorType: "business-card-builder",
    href: "/tienda/p/standard-business-cards",
    howOrdered: {
      es: "Elige esta familia → abre el configurador → arma tu diseño → revisa y aprueba → completa la compra (checkout después).",
      en: "Choose this family → open the configurator → build your design → review and approve → complete purchase (checkout later).",
    },
    responsibilityBullets: respDesign,
  },
  {
    id: "pf-two-sided-bc",
    slug: "two-sided-business-cards",
    categorySlug: "business-cards",
    title: { es: "Tarjetas dos lados", en: "Two‑sided business cards" },
    description: {
      es: "Frente y reverso con el mismo flujo de diseño en línea y revisión final.",
      en: "Front and back with the same online design flow and final review.",
    },
    longDescription: {
      es: "El constructor permitirá revisar ambas caras, alinear elementos por cara y confirmar sangrado y zona segura antes de aprobar.",
      en: "The builder will let you review both sides, align elements per side, and confirm bleed and safe zones before approval.",
    },
    productMode: "design-online",
    startingPrice: { amount: 110, currency: "USD" },
    badges: [
      { es: "Dos caras", en: "Two‑sided" },
      { es: "Diseño en línea", en: "Design online" },
    ],
    specs: [
      { es: "Frente y reverso", en: "Front + back" },
      { es: "Guías de corte y sangrado", en: "Trim and bleed guides" },
      { es: "Vista previa antes de comprar", en: "Preview before purchase" },
    ],
    optionsSummary: [
      { es: "Mismas opciones de cantidad que estándar", en: "Same quantity tiers as standard" },
      { es: "Ideal para contacto + oferta en el reverso", en: "Great for contact + offer on back" },
    ],
    supportsUpload: false,
    supportsOnlineDesign: true,
    supportsTwoSided: true,
    requiresApproval: true,
    needsPrintReadyFiles: false,
    futureConfiguratorType: "business-card-builder",
    href: "/tienda/p/two-sided-business-cards",
    howOrdered: {
      es: "Elige dos lados → diseña frente y reverso → revisión final en ambas caras → aprueba → compra (próximamente).",
      en: "Choose two‑sided → design front and back → final review on both → approve → purchase (coming soon).",
    },
    responsibilityBullets: respDesign,
  },
  {
    id: "pf-flyers",
    slug: "flyers-standard",
    categorySlug: "flyers",
    title: { es: "Volantes estándar", en: "Standard flyers" },
    description: {
      es: "Sube tu arte listo para imprimir. Ideal para promos y eventos.",
      en: "Upload print‑ready artwork. Built for promos and events.",
    },
    longDescription: {
      es: "Selecciona tamaño y cantidad, sube tu PDF o archivo aceptado y aprueba la prueba digital antes de producción. La validación avanzada llegará en la siguiente fase.",
      en: "Pick size and quantity, upload your PDF or accepted file, and approve a digital proof before production. Advanced validation comes next.",
    },
    productMode: "upload-ready",
    startingPrice: { amount: 140, currency: "USD" },
    badges: [
      { es: "Sube tu archivo", en: "Upload your file" },
      { es: "Campañas", en: "Campaigns" },
    ],
    specs: [
      { es: "Una o dos caras según tu archivo", en: "One or two sides per your file" },
      { es: "Impresión a todo color", en: "Full‑color print" },
      { es: "Papeles estándar y premium", en: "Standard and premium papers" },
    ],
    optionsSummary: [
      { es: "Tamaños comerciales populares", en: "Popular commercial sizes" },
      { es: "Cantidades flexibles", en: "Flexible quantities" },
    ],
    supportsUpload: true,
    supportsOnlineDesign: false,
    supportsTwoSided: true,
    requiresApproval: true,
    needsPrintReadyFiles: true,
    futureConfiguratorType: "print-upload",
    href: "/tienda/p/flyers-standard",
    howOrdered: {
      es: "Elige volantes → configura tamaño/cantidad → sube archivo → revisa prueba → aprueba → compra (checkout después).",
      en: "Choose flyers → set size/quantity → upload file → review proof → approve → purchase (checkout later).",
    },
    responsibilityBullets: respUpload,
  },
  {
    id: "pf-brochures",
    slug: "brochures-standard",
    categorySlug: "brochures",
    title: { es: "Brochures estándar", en: "Standard brochures" },
    description: {
      es: "Piezas plegadas y editoriales con archivo listo para imprenta.",
      en: "Folded editorial pieces with press‑ready artwork.",
    },
    longDescription: {
      es: "Trifold, bifold y formatos similares: sube tu arte con marcas de plegado y sangrado correctos. Te guiaremos en tipos de archivo aceptados en el configurador de carga.",
      en: "Trifold, bifold, and similar formats—upload art with correct fold marks and bleed. Accepted file guidance will live in the upload configurator.",
    },
    productMode: "upload-ready",
    startingPrice: { amount: 175, currency: "USD" },
    badges: [{ es: "Archivo listo", en: "Print‑ready" }],
    specs: [
      { es: "Plieges comunes", en: "Common fold types" },
      { es: "Papel couché / estucado", en: "Coated stocks" },
    ],
    optionsSummary: [
      { es: "Acabados mate o brillante", en: "Matte or gloss finishes" },
    ],
    supportsUpload: true,
    supportsOnlineDesign: false,
    supportsTwoSided: true,
    requiresApproval: true,
    needsPrintReadyFiles: true,
    futureConfiguratorType: "print-upload",
    href: "/tienda/p/brochures-standard",
    howOrdered: {
      es: "Selecciona brochure → define plegado y cantidad → sube PDF → aprueba prueba → compra (próximamente).",
      en: "Pick brochure → set fold and quantity → upload PDF → approve proof → purchase (coming soon).",
    },
    responsibilityBullets: respUpload,
  },
  {
    id: "pf-retractable",
    slug: "retractable-banners",
    categorySlug: "banners",
    title: { es: "Banners retráctiles", en: "Retractable banners" },
    description: {
      es: "Gráfico vertical de alto impacto para eventos y recepciones.",
      en: "High‑impact vertical graphics for events and lobbies.",
    },
    longDescription: {
      es: "Sube tu diseño a la medida del soporte retráctil. Verificaremos dimensiones y resolución recomendada en el flujo de carga.",
      en: "Upload graphics sized for the retractable hardware. We’ll verify dimensions and recommended resolution in the upload flow.",
    },
    productMode: "upload-ready",
    startingPrice: { amount: 110, currency: "USD" },
    badges: [{ es: "Eventos", en: "Events" }],
    specs: [
      { es: "Impresión nítida a gran formato", en: "Crisp large‑format print" },
      { es: "Base retráctil incluida según opción", en: "Retractable base per option" },
    ],
    optionsSummary: [
      { es: "Alturas comunes de display", en: "Common display heights" },
    ],
    supportsUpload: true,
    supportsOnlineDesign: false,
    supportsTwoSided: false,
    requiresApproval: true,
    needsPrintReadyFiles: true,
    futureConfiguratorType: "print-upload",
    href: "/tienda/p/retractable-banners",
    howOrdered: {
      es: "Elige retráctil → confirma medidas → sube arte → aprueba → compra (próximamente).",
      en: "Choose retractable → confirm dimensions → upload art → approve → purchase (coming soon).",
    },
    responsibilityBullets: respUpload,
  },
  {
    id: "pf-yard",
    slug: "yard-signs",
    categorySlug: "signs",
    title: { es: "Yard signs", en: "Yard signs" },
    description: {
      es: "Señalización exterior resistente para política, bienes raíces y promos.",
      en: "Durable outdoor signage for real estate, promos, and campaigns.",
    },
    longDescription: {
      es: "Archivo grande y legible desde lejos. Incluiremos validaciones de resolución para distancias de lectura típicas.",
      en: "Large, legible‑from‑a‑distance files. We’ll add resolution checks for typical viewing distances.",
    },
    productMode: "upload-ready",
    startingPrice: { amount: 85, currency: "USD" },
    badges: [{ es: "Exterior", en: "Outdoor" }],
    specs: [
      { es: "Materiales para exterior", en: "Outdoor‑rated materials" },
      { es: "Colores vivos UV", en: "UV‑rich color" },
    ],
    optionsSummary: [
      { es: "Dimensiones coroplast comunes", en: "Common coroplast sizes" },
    ],
    supportsUpload: true,
    supportsOnlineDesign: false,
    supportsTwoSided: false,
    requiresApproval: true,
    needsPrintReadyFiles: true,
    futureConfiguratorType: "print-upload",
    href: "/tienda/p/yard-signs",
    howOrdered: {
      es: "Elige yard sign → tamaño y cantidad → sube arte → aprueba → compra (próximamente).",
      en: "Pick yard sign → size and quantity → upload art → approve → purchase (coming soon).",
    },
    responsibilityBullets: respUpload,
  },
  {
    id: "pf-stickers",
    slug: "stickers-standard",
    categorySlug: "stickers-labels",
    title: { es: "Stickers estándar", en: "Standard stickers" },
    description: {
      es: "Etiquetas y adhesivos con archivo vectorial o alta resolución.",
      en: "Labels and stickers with vector or high‑resolution art.",
    },
    longDescription: {
      es: "Los cortes personalizados y validaciones de sangrado se integrarán en el configurador de carga. Por ahora, prepárate con archivos nítidos y sangrado adecuado.",
      en: "Custom cuts and bleed validation will plug into the upload configurator. For now, prepare crisp files with proper bleed.",
    },
    productMode: "upload-ready",
    startingPrice: { amount: 60, currency: "USD" },
    badges: [{ es: "Branding", en: "Branding" }],
    specs: [
      { es: "Acabados mate o brillante", en: "Matte or gloss" },
      { es: "Rollo o pliego según opción", en: "Roll or sheet per option" },
    ],
    optionsSummary: [
      { es: "Formas estándar primero; troquel avanzado después", en: "Standard shapes first; advanced die‑cut later" },
    ],
    supportsUpload: true,
    supportsOnlineDesign: false,
    supportsTwoSided: false,
    requiresApproval: true,
    needsPrintReadyFiles: true,
    futureConfiguratorType: "print-upload",
    href: "/tienda/p/stickers-standard",
    howOrdered: {
      es: "Elige stickers → tamaño/cantidad → sube arte → aprueba → compra (próximamente).",
      en: "Pick stickers → size/quantity → upload art → approve → purchase (coming soon).",
    },
    responsibilityBullets: respUpload,
  },
  {
    id: "pf-postcards",
    slug: "postcards-standard",
    categorySlug: "marketing-materials",
    title: { es: "Postcards estándar", en: "Standard postcards" },
    description: {
      es: "Mailers y piezas de marketing—diseño en línea o archivo listo según el flujo que elijas.",
      en: "Mailers and marketing pieces—online design or print‑ready file depending on the path you pick.",
    },
    longDescription: {
      es: "Primeras postcards pueden abrir en modo subida (rápido) y luego añadiremos plantillas de diseño en línea. Revisa siempre la prueba final.",
      en: "Initial postcards may launch in upload mode (fast), then we’ll add online templates. Always review the final proof.",
    },
    productMode: "mixed",
    startingPrice: { amount: 120, currency: "USD" },
    badges: [
      { es: "Marketing directo", en: "Direct mail" },
      { es: "Upload primero", en: "Upload first" },
    ],
    specs: [
      { es: "Tamaños postales comunes", en: "Common postal sizes" },
      { es: "Impresión a todo color dos caras opcional", en: "Optional two‑sided full color" },
    ],
    optionsSummary: [
      { es: "Inicia con archivo listo; diseño en línea después", en: "Starts print‑ready; online design later" },
    ],
    supportsUpload: true,
    supportsOnlineDesign: true,
    supportsTwoSided: true,
    requiresApproval: true,
    needsPrintReadyFiles: true,
    futureConfiguratorType: "print-upload",
    href: "/tienda/p/postcards-standard",
    comingSoon: false,
    howOrdered: {
      es: "Elige postcards → (pronto) diseño o subida → revisión → aprueba → compra.",
      en: "Choose postcards → (soon) design or upload → review → approve → purchase.",
    },
    responsibilityBullets: [
      {
        es: "Puedes empezar con archivo listo; el diseño en línea se añadirá después.",
        en: "You can start print‑ready; online design will be added later.",
      },
      ...respUpload,
    ],
  },
  {
    id: "pf-promo-giveaways",
    slug: "promo-giveaways",
    categorySlug: "promo-products",
    title: { es: "Regalos promocionales", en: "Promotional giveaways" },
    description: {
      es: "Artículos de marca para ferias y campañas — Leonix cotiza y coordina.",
      en: "Branded items for tradeshows and campaigns — Leonix quotes and coordinates.",
    },
    longDescription: {
      es: "USB, kits de bienvenida, artículos de escritorio y detalles para clientes. Elegimos proveedor según calidad, MOQ y fecha. No hay editor en línea: el pedido es cotización y mockup aprobado.",
      en: "USB drives, welcome kits, desk items, and client gifts. We match vendors to quality, MOQ, and your date. There is no online editor—orders flow through quote and approved mockups.",
    },
    productMode: "mixed",
    startingPrice: { amount: 150, currency: "USD" },
    badges: [
      { es: "Catálogo", en: "Catalog" },
      { es: "Cotización", en: "Quote" },
    ],
    specs: [
      { es: "MOQ y tiempos según artículo", en: "MOQ and lead times vary by item" },
      { es: "Marca con logo del cliente", en: "Decoration with your logo" },
    ],
    optionsSummary: [
      { es: "Empaque y surtidos bajo pedido", en: "Packing and assortments on request" },
      { es: "Muestreo cuando aplique", en: "Sampling when available" },
    ],
    supportsUpload: true,
    supportsOnlineDesign: false,
    supportsTwoSided: false,
    requiresApproval: true,
    needsPrintReadyFiles: false,
    futureConfiguratorType: "none",
    href: "/tienda/p/promo-giveaways",
    comingSoon: false,
    howOrdered: {
      es: "Solicitud → cotización → mockup → aprobación → producción con Leonix.",
      en: "Request → quote → mockup → approval → production with Leonix.",
    },
    responsibilityBullets: [
      {
        es: "Los pedidos promocionales requieren revisión humana y tiempos de proveedor — plazos reales en cotización.",
        en: "Promo orders need human review and vendor lead times—real timelines in the quote.",
      },
    ],
  },
  {
    id: "pf-promo-pens",
    slug: "promo-pens",
    categorySlug: "promo-products",
    title: { es: "Bolígrafos y escritura", en: "Pens & writing" },
    description: {
      es: "Plumas, rollers y sets de escritura con marca — catálogo por solicitud.",
      en: "Pens, rollers, and writing sets with your brand—catalog on request.",
    },
    longDescription: {
      es: "Desde bolígrafos económicos hasta metal grabado. Leonix muestra opciones reales de proveedor, colores de tinta y técnicas de marca. Sin diseñador en línea: todo va por cotización y prueba visual.",
      en: "From budget pens to engraved metal. Leonix presents real vendor options, ink colors, and imprint methods. No online designer—all quoting and visual proofing with our team.",
    },
    productMode: "mixed",
    startingPrice: { amount: 125, currency: "USD" },
    badges: [
      { es: "Catálogo", en: "Catalog" },
      { es: "Grabado / tampografía", en: "Engraving / pad print" },
    ],
    specs: [
      { es: "Variedad de acabados y estilos", en: "Range of finishes and styles" },
      { es: "Áreas de marca según pieza", en: "Imprint areas per style" },
    ],
    optionsSummary: [
      { es: "Pedidos desde cientos hasta miles", en: "Runs from hundreds to thousands" },
    ],
    supportsUpload: true,
    supportsOnlineDesign: false,
    supportsTwoSided: false,
    requiresApproval: true,
    needsPrintReadyFiles: false,
    futureConfiguratorType: "none",
    href: "/tienda/p/promo-pens",
    howOrdered: {
      es: "Contacto con referencia de producto → opciones y precio → arte y producción.",
      en: "Contact with product reference → options and pricing → artwork and production.",
    },
    responsibilityBullets: [
      {
        es: "Los colores de marca en objeto promocional pueden variar respecto a pantalla — Leonix orienta en prueba física o mockup.",
        en: "Brand colors on physical promos may differ from screen—Leonix guides with proof or mockup.",
      },
    ],
  },
  {
    id: "pf-promo-drinkware",
    slug: "promo-drinkware",
    categorySlug: "promo-products",
    title: { es: "Drinkware", en: "Drinkware" },
    description: {
      es: "Termos, tasas y botellas promocionales para tu marca.",
      en: "Travel mugs, cups, and bottles branded for your business.",
    },
    longDescription: {
      es: "Piezas de acero, cerámica o plástico reutilizable. Cotizamos según capacidad, recubrimiento y método de impresión o láser. Ideal para kits de bienvenida o campañas ESG.",
      en: "Stainless, ceramic, or reusable plastic pieces. We quote by capacity, coating, and print or laser method—great for welcome kits or sustainability campaigns.",
    },
    productMode: "mixed",
    startingPrice: { amount: 180, currency: "USD" },
    badges: [
      { es: "Catálogo", en: "Catalog" },
      { es: "Marca duradera", en: "Durable branding" },
    ],
    specs: [
      { es: "Lavavajillas según modelo", en: "Dishwasher-safe per model" },
      { es: "Cajas individuales o bulk", en: "Individual or bulk packaging" },
    ],
    optionsSummary: [{ es: "Sets coordinados con otros promo", en: "Coordinated sets with other promo" }],
    supportsUpload: true,
    supportsOnlineDesign: false,
    supportsTwoSided: false,
    requiresApproval: true,
    needsPrintReadyFiles: false,
    futureConfiguratorType: "none",
    href: "/tienda/p/promo-drinkware",
    howOrdered: {
      es: "Solicitud → muestras si aplica → cotización → producción.",
      en: "Request → samples if applicable → quote → production.",
    },
    responsibilityBullets: [
      {
        es: "Tamaños nominales pueden variar ligeramente por lote de fábrica.",
        en: "Nominal sizes may vary slightly by factory batch.",
      },
    ],
  },
  {
    id: "pf-promo-bags",
    slug: "promo-bags",
    categorySlug: "promo-products",
    title: { es: "Bolsas y portátiles", en: "Bags & totes" },
    description: {
      es: "Totes, morrales y bolsas de feria con impresión.",
      en: "Totes, backpacks, and event bags with imprint.",
    },
    longDescription: {
      es: "Lona, no tejido, yute o poliéster reciclado según disponibilidad. Leonix define método (serigrafía, transfer, bordado) según arte y presupuesto. Flujo por solicitud, no carrito instantáneo.",
      en: "Canvas, non-woven, jute, or recycled polyester as available. Leonix matches method—screen, transfer, embroidery—to your art and budget. Request-based flow, not instant cart.",
    },
    productMode: "mixed",
    startingPrice: { amount: 200, currency: "USD" },
    badges: [
      { es: "Catálogo", en: "Catalog" },
      { es: "Eventos", en: "Events" },
    ],
    specs: [
      { es: "Capacidad y asas según modelo", en: "Capacity and handles per model" },
      { es: "Colores de tela limitados por temporada", en: "Fabric colors limited by season" },
    ],
    optionsSummary: [{ es: "Etiquetas o hang tags opcionales", en: "Optional hang tags or labels" }],
    supportsUpload: true,
    supportsOnlineDesign: false,
    supportsTwoSided: false,
    requiresApproval: true,
    needsPrintReadyFiles: false,
    futureConfiguratorType: "none",
    href: "/tienda/p/promo-bags",
    howOrdered: {
      es: "Brief → cotización → prueba de marca → producción.",
      en: "Brief → quote → branding proof → production.",
    },
    responsibilityBullets: [
      {
        es: "El bordado requiere archivo vectorial o reproducción aprobada en puntada.",
        en: "Embroidery needs vector art or approved stitch reproduction.",
      },
    ],
  },
  {
    id: "pf-promo-desk-office",
    slug: "promo-desk-office",
    categorySlug: "promo-products",
    title: { es: "Oficina y escritorio", en: "Office & desk" },
    description: {
      es: "Artículos para despacho: libretas, clips, organizadores y detalles corporativos.",
      en: "Desk essentials: notebooks, clips, organizers, and corporate gifts.",
    },
    longDescription: {
      es: "Ideal para onboarding y kits de oficina. Leonix agrupa proveedores para que recibas una sola propuesta. Personalización según marca; sin simulador web de producto.",
      en: "Ideal for onboarding and office kits. Leonix bundles vendor lines into one proposal. Decoration per your brand—no web product simulator.",
    },
    productMode: "mixed",
    startingPrice: { amount: 140, currency: "USD" },
    badges: [
      { es: "Catálogo", en: "Catalog" },
      { es: "Kits", en: "Kits" },
    ],
    specs: [
      { es: "Combinaciones bajo pedido", en: "Custom combinations on request" },
      { es: "Empaque con tarjeta o sello", en: "Packaging with card or seal" },
    ],
    optionsSummary: [{ es: "Entrega en oficina o envío", en: "Office pickup or shipping" }],
    supportsUpload: true,
    supportsOnlineDesign: false,
    supportsTwoSided: false,
    requiresApproval: true,
    needsPrintReadyFiles: false,
    futureConfiguratorType: "none",
    href: "/tienda/p/promo-desk-office",
    howOrdered: {
      es: "Lista de piezas deseadas → cotización unificada → producción.",
      en: "List of items → unified quote → production.",
    },
    responsibilityBullets: [
      {
        es: "Las fotos de catálogo son referencia; el artículo final sigue ficha técnica aprobada.",
        en: "Catalog photos are reference; final goods follow the approved spec sheet.",
      },
    ],
  },
  {
    id: "pf-promo-apparel",
    slug: "promo-apparel-program",
    categorySlug: "promo-products",
    title: { es: "Textiles y gorras (programa básico)", en: "Apparel & caps (basic program)" },
    description: {
      es: "Playeras, polos y gorras con marca — cotización con Leonix (sin probador virtual).",
      en: "Tees, polos, and caps with branding—quote with Leonix (no virtual fitting).",
    },
    longDescription: {
      es: "Programa básico de textiles promocionales: tallas estándar, paleta de prendas algodón o mezcla, y técnicas serigrafía o bordado según complejidad. No ofrecemos personalización en línea ni tallas a medida en este paso.",
      en: "A basic promotional apparel program: standard sizes, cotton or blend garment palettes, and screen print or embroidery by complexity. We do not offer online personalization or bespoke sizing in this path.",
    },
    productMode: "mixed",
    startingPrice: { amount: 250, currency: "USD" },
    badges: [
      { es: "Catálogo", en: "Catalog" },
      { es: "Por cotización", en: "Quote only" },
    ],
    specs: [
      { es: "Guía de tallas proveedor", en: "Vendor size chart" },
      { es: "Colores de prenda por temporada", en: "Garment colors by season" },
    ],
    optionsSummary: [
      { es: "Mínimos por estilo y color", en: "Minimums per style and color" },
    ],
    supportsUpload: true,
    supportsOnlineDesign: false,
    supportsTwoSided: false,
    requiresApproval: true,
    needsPrintReadyFiles: false,
    futureConfiguratorType: "none",
    href: "/tienda/p/promo-apparel-program",
    howOrdered: {
      es: "Brief de prendas y colores → cotización → muestra si aplica → producción.",
      en: "Garment and color brief → quote → sample if needed → production.",
    },
    responsibilityBullets: [
      {
        es: "Las tallas y caída de tela varían por marca de prenda — Leonix recomienda tabla del proveedor.",
        en: "Fit and drape vary by garment brand—Leonix follows the vendor chart.",
      },
    ],
  },
];

export const tiendaProductFamilyBySlug = Object.fromEntries(
  tiendaProductFamilies.map((p) => [p.slug, p])
) as Record<string, TiendaProductFamily>;
