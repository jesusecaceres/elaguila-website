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
      es: "Artículos de marca para eventos—cotización y apoyo de Leonix.",
      en: "Branded items for events—quote and Leonix support.",
    },
    longDescription: {
      es: "Esta familia depende de proveedores y variantes. Por ahora, contáctanos para armar tu kit; el catálogo en línea llegará después.",
      en: "This family depends on vendors and variants. Contact us to build your kit; online catalog comes later.",
    },
    productMode: "mixed",
    startingPrice: { amount: 150, currency: "USD" },
    badges: [{ es: "Próximamente", en: "Coming soon" }],
    specs: [
      { es: "Rango según proveedor", en: "Range per vendor" },
    ],
    optionsSummary: [{ es: "Cotización personalizada", en: "Custom quoting" }],
    supportsUpload: true,
    supportsOnlineDesign: false,
    supportsTwoSided: false,
    requiresApproval: true,
    needsPrintReadyFiles: false,
    futureConfiguratorType: "none",
    href: "/tienda/p/promo-giveaways",
    comingSoon: true,
    howOrdered: {
      es: "Contacto → cotización → archivos y aprobación → producción (sin checkout automático aún).",
      en: "Contact → quote → files and approval → production (no auto checkout yet).",
    },
    responsibilityBullets: [
      {
        es: "Los pedidos promocionales suelen requerir revisión humana y tiempos de proveedor.",
        en: "Promo orders often need human review and vendor lead times.",
      },
    ],
  },
];

export const tiendaProductFamilyBySlug = Object.fromEntries(
  tiendaProductFamilies.map((p) => [p.slug, p])
) as Record<string, TiendaProductFamily>;
