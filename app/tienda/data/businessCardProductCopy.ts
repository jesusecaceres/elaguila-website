import type { Lang } from "../types/tienda";

export const businessCardProductCopy = {
  standardIntro: {
    es: "Tarjetas premium estándar 3.5″×2″ — autogestión para stock y acabado profesional habitual. Opciones especiales (foil, terciopelo, cantos pintados, etc.) son por cotización.",
    en: "Standard premium 3.5″×2″ cards — self‑serve for typical professional stock and finish. Specialty options (foil, velvet, painted edges, etc.) are quote‑only.",
  },
  gatewayPathsFootnote: {
    es: "Tres entradas claras: (1) archivo listo solo para producción, (2) imagen o plantilla para editar en Studio, (3) LEO recopila datos y abre un borrador en Studio. La biblioteca de plantillas y Studio en blanco son atajos al mismo editor.",
    en: "Three clear starts: (1) print-ready file for production only, (2) an image or layout to rebuild in Studio, (3) LEO gathers details and opens a draft in Studio. The template library and blank Studio are shortcuts into the same editor.",
  },
  pathLeoBadge: { es: "Preparación", en: "Prep" },
  pathLeoTitle: { es: "LEO — datos y borrador inicial", en: "LEO — intake & starter draft" },
  pathLeoBody: {
    es: "Responde lo esencial; Leonix elige una plantilla acorde y rellena tu texto en Studio. No es creatividad automática: ahí afinas todo a mano.",
    en: "Answer the essentials; Leonix picks a fitting template and places your copy in Studio. This is not auto‑creative magic—you refine everything visually in the editor.",
  },
  pathLeoCta: { es: "Comenzar con LEO", en: "Start with LEO" },
  pathTemplateBadge: { es: "Biblioteca", en: "Library" },
  pathTemplateTitle: { es: "Plantilla Leonix", en: "Leonix template" },
  pathTemplateBody: {
    es: "Elige un estilo y entra a Studio con ese layout—mismo editor que tras LEO o al subir una imagen para editar.",
    en: "Pick a look and open Studio with that layout—the same editor as after LEO or when you upload an image to edit.",
  },
  pathTemplateCta: { es: "Ver plantillas", en: "Browse templates" },
  pathCustomBadge: { es: "Studio", en: "Studio" },
  pathCustomTitle: { es: "Lienzo en Studio", en: "Blank Studio" },
  pathCustomBody: {
    es: "Abre Studio sin plantilla previa: texto, logo, imágenes y formas con las mismas herramientas que en los otros caminos.",
    en: "Open Studio without a preselected template—text, logo, images, and shapes with the same tools as the other paths.",
  },
  pathCustomCta: { es: "Abrir Studio", en: "Open Studio" },
  pathUploadBadge: { es: "Solo producción", en: "Production file" },
  pathUploadTitle: { es: "Archivo listo para imprenta", en: "Print-ready file" },
  pathUploadBody: {
    es: "PDF o imagen final a tamaño de tarjeta. Para producción directa—sin edición en Studio. Si quieres retocar el diseño aquí, usa “Editar diseño actual”.",
    en: "Final PDF or image at card size. Handoff for production—no Studio editing. If you need to rework the design here, use “Edit your current design” instead.",
  },
  pathUploadCta: { es: "Subir archivo final", en: "Upload final file" },
  pathRefreshBadge: { es: "Editar diseño", en: "Edit design" },
  pathRefreshTitle: { es: "Tu plantilla o diseño actual", en: "Your template or current design" },
  pathRefreshBody: {
    es: "Foto, escaneo, plantilla sin terminar o captura. Lo ponemos en Studio como capa para reconstruir o modernizar—no sustituye la subida de archivo final para imprenta.",
    en: "Photo, scan, unfinished template, or screenshot. We place it in Studio as a layer you can rebuild or modernize—not the print‑ready production upload.",
  },
  pathRefreshCta: { es: "Subir y editar en Studio", en: "Upload to edit in Studio" },
  specialtyTitle: { es: "Tarjetas especiales y de lujo", en: "Specialty & luxury cards" },
  specialtyBody: {
    es: "Acabados como foil, UV relieve, cantos pintados, cartulina extra gruesa, formas especiales o materiales distintos requieren coordinación con Leonix.",
    en: "Finishes like foil, raised UV, painted edges, extra‑thick stock, specialty shapes, or unusual materials require Leonix coordination.",
  },
  specialtyExamples: {
    es: "Ejemplos: ante / terciopelo, foil, barnices especiales, cantos de color, gramajes de lujo, plástico o imanes.",
    en: "Examples: suede/velvet, foil, specialty coatings, painted edges, luxury thicknesses, plastic or magnets.",
  },
  specialtyContactCta: { es: "Contactar a Leonix", en: "Contact Leonix" },
  specialtyOfficeHint: {
    es: "También puedes visitar nuestra oficina con muestras y referencias.",
    en: "You can also visit our office with samples and references.",
  },
  templatesHeading: { es: "Biblioteca de plantillas Leonix", en: "Leonix template library" },
  templatesSubheading: {
    es: "Cada estilo reorganiza texto y logo al instante; tu información se conserva. Sigue refinando abajo cuando quieras.",
    en: "Each look rearranges text and logo instantly while keeping your details—refine further below anytime.",
  },
  backgroundHeading: { es: "Color y fondo de la tarjeta", en: "Card color & background" },
  backgroundHelp: {
    es: "Se aplica a la cara visible de la tarjeta (mismo fondo en frente y reverso). El marco oscuro es solo referencia de corte.",
    en: "Applies to both sides of the card. The dark frame around the card is only a trim reference.",
  },
  designBlocksHeading: { es: "Texto en la tarjeta", en: "Text on the card" },
  selectBlockHint: {
    es: "Toca una línea en la vista previa o elígela aquí para moverla o cambiar tamaño.",
    en: "Tap a line on the preview or pick it here to move or resize it.",
  },
  noBlockSelectedHint: {
    es: "Selecciona una línea de texto en la vista previa o en los botones de arriba para ver sus controles.",
    en: "Select a text line on the preview or use the chips above to edit position and type.",
  },
  adjustLogoHint: {
    es: "Arrastra el logo en la vista previa o usa los controles numéricos.",
    en: "Drag the logo on the preview or use the numeric controls.",
  },
  removeCustomBlock: { es: "Eliminar línea personalizada", en: "Remove custom line" },
  addCustomLine: { es: "Añadir línea de texto", en: "Add text line" },
  linkedFieldHint: {
    es: "Este texto está ligado al campo de información arriba.",
    en: "This line is linked to the business details field above.",
  },
  duplicateCustomBlock: { es: "Duplicar línea", en: "Duplicate line" },
  fineNudge: { es: "Ajuste fino (±1%)", en: "Fine nudge (±1%)" },
  logoOnCanvasTitle: { es: "Logo en la tarjeta", en: "Logo on card" },
  uploadStepFiles: { es: "Archivos", en: "Files" },
  uploadStepReview: { es: "Revisión", en: "Review" },
  uploadStepOrder: { es: "Pedido", en: "Order" },
  uploadDropHint: {
    es: "Suelta el archivo aquí o pulsa para elegir",
    en: "Drop a file here or tap to browse",
  },
  uploadPreferDesign: {
    es: "¿Prefieres diseñar en línea? Abre Studio (espacio editable; no sustituye esta subida final):",
    en: "Prefer to design online? Open Studio (editable workspace—does not replace this final-file upload):",
  },
  /** Print-upload shell: links into Studio — kept distinct from print-ready handoff */
  uploadStudioTemplateCta: { es: "Biblioteca de plantillas", en: "Template library" },
  uploadStudioRefreshCta: { es: "Editar diseño en Studio", en: "Edit design in Studio" },
  designIntakeCustomHint: {
    es: "Studio completo: pestaña Tarjeta para texto y logo; pestaña Capas Studio para imágenes y formas. Las plantillas siguen disponibles en Tarjeta.",
    en: "Full Studio: Card tab for copy and logo; Studio layers tab for images and shapes. Templates remain available in the Card tab.",
  },
  designIntakeTemplateHint: {
    es: "Toca un estilo Leonix para aplicarlo al instante—tus datos se mantienen. Ajusta en la pestaña Tarjeta o mueve capas en Capas Studio.",
    en: "Tap a Leonix style to apply it instantly—your details stay put. Tweak in the Card tab or move layers under Studio layers.",
  },
  designIntakeLeoHint: {
    es: "Este es tu borrador inicial de LEO. Las herramientas de la selección están arriba; la pestaña Tarjeta tiene plantillas y datos, Capas Studio añade imágenes y formas.",
    en: "This is your LEO starter draft. Selection tools are in the strip above; the Card tab holds templates and details, Studio layers adds images and shapes.",
  },
  designIntakeRefreshHint: {
    es: "Hay una imagen de referencia en el lienzo: baja opacidad en Capas Studio si vas a escribir encima; añade texto y formas desde ahí. La pestaña Tarjeta cambia plantilla y datos. Para archivo final de imprenta sin editar aquí, usa la subida de archivo listo.",
    en: "You have a reference image on the canvas—lower opacity in Studio layers if you’re typing over it; add text and shapes from there. The Card tab switches templates and copy. For a final print file without editing here, use the print-ready upload path.",
  },
  refreshPanelTitle: { es: "Editar diseño o plantilla actual", en: "Edit your current design or template" },
  refreshPanelBody: {
    es: "Ideal para tarjetas viejas, plantillas a medias o capturas. La imagen va a Studio como capa editable para reconstruir—no es la entrega de archivo final para imprenta.",
    en: "Use this for old cards, half-finished templates, or screenshots. The image lands in Studio as an editable layer to rebuild from—not the final print‑ready handoff.",
  },
  refreshPanelSideNote: {
    es: "Se coloca en la cara activa (frente o reverso). Cambia de cara arriba si quieres empezar en el otro lado.",
    en: "Placed on the active side (front or back). Switch sides above if you want to start on the other face.",
  },
  refreshPanelCta: { es: "Elegir imagen", en: "Choose image" },
  refreshPanelSkip: { es: "Empezar en Studio sin imagen", en: "Start in Studio without an image" },
  refreshSeedHelperTitle: { es: "Referencia en el lienzo", en: "Reference on the canvas" },
  refreshSeedNextHint: {
    es: "Úsala como guía: botones de opacidad arriba; en Capas Studio reordenas y añades formas o fotos. En la pestaña Tarjeta cambias texto, logo o plantilla. No es la subida de archivo final para imprenta.",
    en: "Use it as a guide—the opacity shortcuts are above; under Studio layers you reorder and add shapes or photos. The Card tab is for copy, logo, or templates. This is not the final print‑ready upload.",
  },
  refreshOpacityFaint: { es: "Sutil (referencia)", en: "Faint (reference)" },
  refreshOpacityFull: { es: "Opacidad completa", en: "Full opacity" },
  switchToCustomCta: { es: "Modo Studio completo (todas las herramientas)", en: "Full Studio mode (all tools)" },
} as const;

export function bcpPick<T>(v: { es: T; en: T }, lang: Lang): T {
  return lang === "en" ? v.en : v.es;
}
