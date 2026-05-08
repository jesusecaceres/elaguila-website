import type { AdminLang } from "@/app/admin/_lib/adminI18nCookie";

/** Website editing workspace hub — bilingual copy (admin-only). */
export const WORKSPACE_HUB_LABELS: Record<
  AdminLang,
  Record<
    | "pageTitle"
    | "pageSubtitle"
    | "eyebrow"
    | "backToAdmin"
    | "canIEditWholeWebsite"
    | "canIEditExplanation"
    | "smokeTestTitle"
    | "smokeTestExplanation"
    | "area"
    | "purpose"
    | "adminRoutePattern"
    | "status"
    | "notes"
    | "action"
    | "open"
    | "whatThisControls"
    | "whatYouCanEditToday"
    | "whatStillRequiresCode"
    | "primaryAdminAction"
    | "publicPreview"
    | "addNewLineBlock"
    | "useExistingFields"
    | "useRepeatableItems"
    | "notEditableYet"
    | "howAddingContentWorks"
    | "contentExplanation"
    | "recommendedNextBuild"
    | "blockEditorExplanation"
    | "planBlockEditor"
    | "modulesCrossingPages"
    | "modulesExplanation"
    | "globalSiteSettings"
    | "customerOpsSearch"
    | "summaryCounts"
    | "needsBuild"
    | "fullyEditable"
    | "partlyEditable"
    | "notBuiltYet"
    | "lockedOnPurpose"
    | "openWorkspace"
    | "validationWarnings"
    | "validationErrors"
    | "filterAll"
    | "filterFullyEditable"
    | "filterPartlyEditable"
    | "filterNotBuilt"
    | "filterLocked"
    | "whatHappensWhenIClick"
    | "editingAdminContent"
    | "previewingPublicWebsite"
    | "safeToChange"
    | "filterByStatus"
    | "detailedGuidanceTitle"
    | "detailedGuidanceLead"
    | "blockListIntro"
    | "nothing"
    | "developmentNeeded"
    | "ownerAnswerTrue"
    | "ownerAnswerPartial"
    | "ownerAnswerMissing"
    | "ownerAnswerLocked"
    | "blockBullet1"
    | "blockBullet2"
    | "blockBullet3"
    | "blockBullet4"
    | "blockBullet5",
    string
  >
> = {
  en: {
    pageTitle: "Website Editing Workspace",
    pageSubtitle:
      "Admin workspace for managing website content. Not a Wix-style drag/drop builder yet.",
    eyebrow: "Workspace",
    backToAdmin: "← Back to admin",
    canIEditWholeWebsite: "Can I edit the whole website from here?",
    canIEditExplanation:
      "This admin is currently a structured CMS, not a Wix-style drag/drop builder. Fully editable means admin has a real save workflow for that area. Partly editable means some content can be changed, but layout or new sections still need code. Not built yet means there is no complete admin editor for that area. Locked on purpose means that area is intentionally not editable from admin.",
    smokeTestTitle: "Website editing status",
    smokeTestExplanation: "This shows what you can edit today and what still needs development work.",
    area: "Area",
    purpose: "Purpose",
    adminRoutePattern: "Admin route / pattern",
    status: "Status",
    notes: "Developer notes",
    action: "Action",
    open: "Open →",
    whatThisControls: "What this controls",
    whatYouCanEditToday: "What you can edit today",
    whatStillRequiresCode: "Still requires code",
    primaryAdminAction: "Primary admin action",
    publicPreview: "Public preview",
    addNewLineBlock: "Add new content?",
    useExistingFields: "Use existing fields. New content types need development.",
    useRepeatableItems: "Use the items list to add/reorder/remove content.",
    notEditableYet: "Not editable from admin yet. Requires development.",
    howAddingContentWorks: "How adding content works here",
    contentExplanation:
      "This admin is currently structured CMS, not freeform drag/drop. Existing fields can be edited immediately. New content requires either: 1) a field added to existing editor, 2) a repeatable content list, or 3) a future page-builder/block-builder module.",
    recommendedNextBuild: "Recommended next build: reusable page block editor",
    blockEditorExplanation:
      "This would let you add/reorder/remove controlled content blocks like text sections, image sections, CTA buttons, card groups, and announcement strips.",
    planBlockEditor: "Plan block editor",
    modulesCrossingPages: "Modules that affect multiple pages",
    modulesExplanation:
      "Settings that affect more than one page live in global settings. For customer support and tracking between accounts, ads, and Tienda orders, use the unified Customer ops search.",
    globalSiteSettings: "Global site settings →",
    customerOpsSearch: "Customer ops search →",
    summaryCounts: "Summary",
    needsBuild: "Needs work",
    fullyEditable: "Fully editable",
    partlyEditable: "Partly editable",
    notBuiltYet: "Not built yet",
    lockedOnPurpose: "Locked on purpose",
    openWorkspace: "Open workspace →",
    validationWarnings: "Status warnings",
    validationErrors: "Status errors",
    filterAll: "All",
    filterFullyEditable: "Fully editable",
    filterPartlyEditable: "Partly editable",
    filterNotBuilt: "Not built yet",
    filterLocked: "Locked",
    whatHappensWhenIClick: "What happens when I click this?",
    editingAdminContent: "You'll edit admin content that appears on the public website.",
    previewingPublicWebsite: "You'll see how this looks on the public website.",
    safeToChange: "Safe to change - this is the admin editor.",
    filterByStatus: "Filter by status",
    detailedGuidanceTitle: "Detailed guidance for each area",
    detailedGuidanceLead:
      "For each editing area, you can see exactly what's editable today and what still requires development work.",
    blockListIntro: "This would let you add/reorder/remove:",
    nothing: "Nothing",
    developmentNeeded: "Development work needed",
    ownerAnswerTrue: "Yes — this area is fully editable from admin.",
    ownerAnswerPartial:
      "Partly — you can edit copy/images/settings, but new sections still require code.",
    ownerAnswerMissing: "No — this editor still needs to be built.",
    ownerAnswerLocked: "Locked — this area is intentionally not editable from admin.",
    blockBullet1: "Text sections",
    blockBullet2: "Image sections",
    blockBullet3: "CTA buttons",
    blockBullet4: "Card groups",
    blockBullet5: "Announcement strips",
  },
  es: {
    pageTitle: "Espacio de trabajo del sitio web",
    pageSubtitle:
      "Espacio de trabajo admin para gestionar contenido del sitio. Todavía no es un constructor de arrastrar/soltar estilo Wix.",
    eyebrow: "Workspace",
    backToAdmin: "← Volver a admin",
    canIEditWholeWebsite: "¿Puedo editar todo el sitio web desde aquí?",
    canIEditExplanation:
      "Este admin es actualmente CMS estructurado, no arrastrar/soltar libre. Totalmente editable significa que admin tiene un flujo de guardado real para esa área. Parcialmente editable significa que algo de contenido se puede cambiar, pero el diseño o nuevas secciones aún necesitan código. No construido aún significa que no hay editor admin completo para esa área. Bloqueado a propósito significa que esa área intencionalmente no es editable desde admin.",
    smokeTestTitle: "Estado de edición del sitio",
    smokeTestExplanation: "Esto muestra lo que puedes editar hoy y qué aún necesita trabajo de desarrollo.",
    area: "Área",
    purpose: "Propósito",
    adminRoutePattern: "Ruta admin / patrón",
    status: "Estado",
    notes: "Notas de desarrollador",
    action: "Acción",
    open: "Abrir →",
    whatThisControls: "Qué controla esto",
    whatYouCanEditToday: "Qué puedes editar hoy",
    whatStillRequiresCode: "Aún requiere código",
    primaryAdminAction: "Acción admin principal",
    publicPreview: "Vista previa pública",
    addNewLineBlock: "¿Agregar nuevo contenido?",
    useExistingFields: "Usa los campos existentes. Nuevos tipos de contenido necesitan desarrollo.",
    useRepeatableItems: "Usa la lista de elementos para agregar/reordenar/eliminar contenido.",
    notEditableYet: "Aún no editable desde admin. Requiere desarrollo.",
    howAddingContentWorks: "Cómo funciona agregar contenido aquí",
    contentExplanation:
      "Este admin es actualmente CMS estructurado, no arrastrar/soltar libre. Los campos existentes se pueden editar inmediatamente. Nuevo contenido requiere: 1) un campo agregado al editor existente, 2) una lista de contenido repetible, o 3) un futuro módulo constructor de páginas/bloques.",
    recommendedNextBuild: "Próxima construcción recomendada: editor de bloques de página reutilizables",
    blockEditorExplanation:
      "Esto te permitiría agregar/reordenar/eliminar bloques de contenido controlados como secciones de texto, secciones de imagen, botones CTA, grupos de tarjetas y tiras de anuncios.",
    planBlockEditor: "Planificar editor de bloques",
    modulesCrossingPages: "Módulos que afectan múltiples páginas",
    modulesExplanation:
      "Las configuraciones que afectan más de una página viven en ajustes globales. Para soporte al cliente y seguimiento entre cuentas, anuncios y pedidos Tienda, usa la búsqueda unificada de operaciones de cliente.",
    globalSiteSettings: "Ajustes globales del sitio →",
    customerOpsSearch: "Búsqueda de operaciones de cliente →",
    summaryCounts: "Resumen",
    needsBuild: "Necesita trabajo",
    fullyEditable: "Totalmente editable",
    partlyEditable: "Parcialmente editable",
    notBuiltYet: "No construido aún",
    lockedOnPurpose: "Bloqueado a propósito",
    openWorkspace: "Abrir espacio de trabajo →",
    validationWarnings: "Advertencias de estado",
    validationErrors: "Errores de estado",
    filterAll: "Todos",
    filterFullyEditable: "Totalmente editable",
    filterPartlyEditable: "Parcialmente editable",
    filterNotBuilt: "No construido aún",
    filterLocked: "Bloqueado",
    whatHappensWhenIClick: "¿Qué pasa cuando hago clic en esto?",
    editingAdminContent: "Editarás contenido admin que aparece en el sitio web público.",
    previewingPublicWebsite: "Verás cómo se ve esto en el sitio web público.",
    safeToChange: "Seguro para cambiar - este es el editor admin.",
    filterByStatus: "Filtrar por estado",
    detailedGuidanceTitle: "Guía detallada por área",
    detailedGuidanceLead:
      "Para cada área de edición puedes ver con exactitud qué es editable hoy y qué aún requiere trabajo de desarrollo.",
    blockListIntro: "Esto te permitiría agregar/reordenar/eliminar:",
    nothing: "Nada",
    developmentNeeded: "Requiere trabajo de desarrollo",
    ownerAnswerTrue: "Sí — esta área es totalmente editable desde admin.",
    ownerAnswerPartial:
      "Parcialmente — puedes editar copia/imágenes/configuración, pero nuevas secciones aún requieren código.",
    ownerAnswerMissing: "No — este editor aún necesita ser construido.",
    ownerAnswerLocked: "Bloqueado — esta área intencionalmente no es editable desde admin.",
    blockBullet1: "Secciones de texto",
    blockBullet2: "Secciones de imagen",
    blockBullet3: "Botones CTA",
    blockBullet4: "Grupos de tarjetas",
    blockBullet5: "Tiras de anuncios",
  },
};

export function workspaceHubT(lang: AdminLang) {
  return WORKSPACE_HUB_LABELS[lang];
}
