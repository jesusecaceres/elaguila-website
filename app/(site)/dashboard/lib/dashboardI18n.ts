import type { Lang } from "./listingDisplayStatus";
import {
  dashboardCountLabelActivos,
  dashboardCountLabelCompartidos,
  dashboardCountLabelTotalGestionados,
  dashboardCountLabelVistas,
} from "./dashboardCountDefinitions";
import { categoryToolsTrustCopy } from "./dashboardMisAnunciosCategoryTools";

export type { Lang };

export function dashboardLangFromSearchParams(
  searchParams: { get: (k: string) => string | null } | null | undefined,
): Lang {
  return searchParams?.get("lang") === "en" ? "en" : "es";
}

export function dashboardShellCopy(lang: Lang) {
  if (lang === "es") {
    return {
      accountStatus: "Estado de cuenta",
      accountMetadata: "Cuenta",
      home: "Resumen",
      profile: "Perfil y cuenta",
      security: "Seguridad",
      listings: "Mis anuncios",
      restaurants: "Mis restaurantes",
      messages: "Mensajes",
      drafts: "Borradores",
      analytics: "Analíticas de cuenta",
      notifications: "Notificaciones",
      businessTools: "Herramientas de negocio",
      saved: "Guardados",
      savedSearches: "Alertas y búsquedas",
      recent: "Vistos recientemente",
      servicios: "Servicios (prueba)",
      viajesStaged: "Viajes (revisión)",
      activity: "Actividad",
      publish: "Publicar anuncio",
      signOut: "Cerrar sesión",
      badgeInbox: "Consultas en bandeja",
      badgeDrafts: "Borradores sin publicar",
      badgeExpiring: "Visibilidad por expirar",
      dashboardLabel: "Panel",
      accountType: "Tipo",
      // Package 1 — sidebar group headings (presentation/IA only, routes unchanged)
      navGroupInicio: "Inicio",
      navGroupMisAnuncios: "Mis anuncios",
      navGroupClientesYRendimiento: "Clientes y rendimiento",
      navGroupMiActividad: "Mi actividad",
      navGroupCuenta: "Cuenta",
      navGroupNegocio: "Negocio",
      openMenu: "Abrir menú",
      closeMenu: "Cerrar menú",
      menuLabel: "Menú del panel",
    };
  }
  return {
    accountStatus: "Account status",
    accountMetadata: "Account",
    home: "Overview",
    profile: "Profile & account",
    security: "Security",
    listings: "My listings",
    restaurants: "My restaurants",
    messages: "Messages",
    drafts: "Drafts",
    analytics: "Account analytics",
    notifications: "Notifications",
    businessTools: "Business tools",
    saved: "Saved",
    savedSearches: "Alerts & saved searches",
    recent: "Recently viewed",
    servicios: "Servicios (test)",
    viajesStaged: "Viajes (review)",
    activity: "Activity",
    publish: "Publish listing",
    signOut: "Sign out",
    badgeInbox: "Inquiries in inbox",
    badgeDrafts: "Unpublished drafts",
    badgeExpiring: "Visibility expiring soon",
    dashboardLabel: "Dashboard",
    accountType: "Type",
    // Package 1 — sidebar group headings (presentation/IA only, routes unchanged)
    navGroupInicio: "Home",
    navGroupMisAnuncios: "My listings",
    navGroupClientesYRendimiento: "Customers & performance",
    navGroupMiActividad: "My activity",
    navGroupCuenta: "Account",
    navGroupNegocio: "Business",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    menuLabel: "Dashboard menu",
  };
}

export function misAnunciosListCopy(lang: Lang) {
  if (lang === "es") {
    return {
      title: "Mis anuncios",
      subtitle: "Elige una categoría y administra solo esos anuncios.",
      searchPh: "Buscar por título…",
      tabAll: "Todos",
      tabActive: "Activos",
      tabExpired: "Finalizados",
      tabMod: "Moderación",
      statActive: dashboardCountLabelActivos("es"),
      statTotalManaged: dashboardCountLabelTotalGestionados("es"),
      statViews: dashboardCountLabelVistas("es"),
      statShares: dashboardCountLabelCompartidos("es"),
      loading: "Cargando…",
      empty: "No hay anuncios en esta vista.",
      emptyCategory: "Aún no tienes anuncios en esta categoría.",
      emptyCategoryBody: "Publica uno cuando estés listo.",
      publishInCategory: "Publicar en",
      emptyAll: "Aún no tienes anuncios.",
      restaurantSectionTitle: "Restaurantes",
      restaurantSectionHint: "Administra tus restaurantes publicados desde el panel.",
      cta: "Publicar anuncio",
      yourListings: "Anuncios",
      categoryPanel: "Categorías",
      workspaceLabel: "Área de gestión",
      publish: "Publicar",
      results: "Ver resultados",
      toolsTrust: categoryToolsTrustCopy("es"),
      errorTitle: "No pudimos cargar tus anuncios",
      back: "Volver al resumen",
      analyticsNotice: "Las analíticas se actualizan cuando tus anuncios reciben actividad real.",
      countFootnote:
        "Los totales por categoría incluyen registros gestionables (activos, pausados, archivados). Activos en resumen = visibles hoy.",
      viewPublic: "Ver público",
      manageListing: "Administrar anuncio",
      viewRequests: "Ver solicitudes",
      archiveAd: "Archivar anuncio",
      editListing: "Editar",
    };
  }
  return {
    title: "My listings",
    subtitle: "Pick a category and manage only those listings.",
    searchPh: "Search by title…",
    tabAll: "All",
    tabActive: "Active",
    tabExpired: "Ended",
    tabMod: "Moderation",
    statActive: dashboardCountLabelActivos("en"),
    statTotalManaged: dashboardCountLabelTotalGestionados("en"),
    statViews: dashboardCountLabelVistas("en"),
    statShares: dashboardCountLabelCompartidos("en"),
    loading: "Loading…",
    empty: "No listings in this view.",
    emptyCategory: "You don't have listings in this category yet.",
    emptyCategoryBody: "Publish one when you're ready.",
    publishInCategory: "Publish in",
    emptyAll: "You don't have any listings yet.",
    restaurantSectionTitle: "Restaurants",
    restaurantSectionHint: "Manage your published restaurants from dashboard.",
    cta: "Publish listing",
    yourListings: "Listings",
    categoryPanel: "Categories",
    workspaceLabel: "Management area",
    publish: "Publish",
    results: "View results",
    toolsTrust: categoryToolsTrustCopy("en"),
    errorTitle: "We couldn't load your listings",
    back: "Back to overview",
    analyticsNotice: "Analytics update when your listings receive real activity.",
    countFootnote:
      "Category totals include manageable records (active, paused, archived). Overview Active = visible today only.",
    viewPublic: "View public",
    manageListing: "Manage listing",
    viewRequests: "View requests",
    archiveAd: "Archive ad",
    editListing: "Edit",
  };
}

export function misAnunciosDetailCopy(lang: Lang) {
  if (lang === "es") {
    return {
      loading: "Cargando…",
      notFound: "No encontramos este anuncio.",
      forbidden: "No tienes acceso a este anuncio.",
      back: "Volver a Mis anuncios",
      publicLink: "Ver público",
      listingRef: "Referencia",
      created: "Creado",
      updated: "Última actualización",
      published: "Publicado",
      listingExpires: "Expiración del anuncio",
      expires: "Fin de ventana de visibilidad",
      plan: "Plan del anuncio",
      visibilityState: "Estado de visibilidad",
      views: "Vistas",
      uniq: "Vistas únicas",
      saves: "Guardados",
      shares: "Compartidos",
      opens: "Aperturas del anuncio",
      likes: "Me gusta",
      cta: "Clics en CTA",
      phone: "Llamadas",
      whatsapp: "WhatsApp",
      email: "Correo",
      sms: "SMS / Texto",
      leads: "Contactos",
      editCta: "Editar anuncio",
      refreshAd: "Actualizar anuncio",
      refreshNotReady: "Este anuncio aún no está listo para actualizar.",
      lastRefresh: "Última renovación (Pro)",
      refreshCount: "Veces actualizado",
      markSold: "Marcar vendido",
      pauseAd: "Pausar anuncio",
      resumeAd: "Restaurar",
      archive: "Archivar anuncio",
      analyticsDegraded:
        "La tabla de analíticas aún no está disponible. Los números permanecen en cero hasta que exista `listing_analytics`.",
      // Gate 3B — Owner Entity Workspace migration additions.
      moreOptions: "Más opciones",
      moreOptionsClose: "Cerrar",
      performanceTitle: "Rendimiento",
      activityTitle: "Mensajes",
      activityEmpty: "Aún no hay mensajes vinculados a este anuncio.",
      visibilityTitle: "Visibilidad Pro",
    };
  }
  return {
    loading: "Loading…",
    notFound: "We couldn't find this listing.",
    forbidden: "You don't have access to this listing.",
    back: "Back to My listings",
    publicLink: "View public",
    listingRef: "Reference",
    created: "Created",
    updated: "Last updated",
    published: "Published",
    listingExpires: "Listing expiration",
    expires: "Visibility window ends",
    plan: "Listing plan",
    visibilityState: "Visibility state",
    views: "Views",
    uniq: "Unique views",
    saves: "Saves",
    shares: "Shares",
    opens: "Card opens",
    likes: "Likes",
    cta: "CTA clicks",
    phone: "Calls",
    whatsapp: "WhatsApp",
    email: "Email",
    sms: "SMS / Text",
    leads: "Leads",
    editCta: "Edit listing",
    refreshAd: "Refresh listing",
    refreshNotReady: "This listing is not ready to refresh yet.",
    lastRefresh: "Last refresh (Pro)",
    refreshCount: "Refresh count",
    markSold: "Mark sold",
    pauseAd: "Pause listing",
    resumeAd: "Restore",
    archive: "Archive listing",
    analyticsDegraded:
      "The analytics table is not available yet. Numbers here stay at zero until `listing_analytics` exists.",
    // Gate 3B — Owner Entity Workspace migration additions.
    moreOptions: "More options",
    moreOptionsClose: "Close",
    performanceTitle: "Performance",
    activityTitle: "Messages",
    activityEmpty: "No messages linked to this listing yet.",
    visibilityTitle: "Pro visibility",
  };
}

/** Gate 3B — canonical owner-facing category eyebrow label for the generic listings-table
 * family (En Venta, Rentas Privado, Bienes Raíces Privado, Clases, Comunidad, Busco, Mascotas
 * y Perdidos). Shared here rather than duplicated per adapter since every one of these
 * categories renders through the same `mis-anuncios/[id]` workspace. */
export function genericCategoryEyebrow(category: string | null | undefined, lang: Lang): string {
  const key = String(category ?? "").toLowerCase().trim();
  const es: Record<string, string> = {
    "en-venta": "En venta",
    rentas: "Rentas",
    "bienes-raices": "Bienes raíces",
    clases: "Clases",
    comunidad: "Comunidad",
    busco: "Busco",
    mascotas: "Mascotas y perdidos",
    "mascotas-y-perdidos": "Mascotas y perdidos",
  };
  const en: Record<string, string> = {
    "en-venta": "For sale",
    rentas: "Rentals",
    "bienes-raices": "Real estate",
    clases: "Classes",
    comunidad: "Community",
    busco: "Wanted",
    mascotas: "Pets & lost",
    "mascotas-y-perdidos": "Pets & lost",
  };
  const map = lang === "es" ? es : en;
  return map[key] ?? (lang === "es" ? "Mis anuncios" : "My listings");
}

/** Gate 3C — shared specialized-module headings (gold zone). */
export function ownerToolsTitle(lang: Lang): string {
  return lang === "es" ? "Herramientas Leonix" : "Leonix tools";
}

export function ownerApplicationsModuleTitle(lang: Lang): string {
  return lang === "es" ? "Aplicaciones" : "Applications";
}

export function ownerInventoryModuleTitle(lang: Lang): string {
  return lang === "es" ? "Inventario" : "Inventory";
}

/** Gate 3D — campaign / review specialized-module headings. */
export function ownerCampaignModuleTitle(lang: Lang): string {
  return lang === "es" ? "Campaña" : "Campaign";
}

export function ownerAiReviewModuleTitle(lang: Lang): string {
  return lang === "es" ? "Revisión con IA" : "AI review";
}

/** Gate 3E — Account Command Center + Business Concierge owner orchestration copy. */
export function accountCommandCenterCopy(lang: Lang) {
  return lang === "es"
    ? {
        eyebrow: "Centro de comando",
        title: "Tu cuenta Leonix de un vistazo",
        greetingNamed: (name: string) => `Hola, ${name}`,
        greetingAnon: "Bienvenido a tu cuenta Leonix",
        subtitle:
          "Esto resume lo que administras, lo que necesita tu atención y el siguiente paso honesto. No es un segundo panel de negocio.",
        publish: "Publicar anuncio",
        attentionTitle: "Necesita tu atención",
        attentionEmpty: "Nada urgente ahora. Cuando haya un pago, vencimiento o revisión real, aparecerá aquí.",
        attentionLoading: "Revisando señales reales de tu cuenta…",
        attentionError: "No pudimos cargar las alertas. Intenta de nuevo más tarde.",
        performanceTitle: "Rendimiento de la cuenta",
        performanceLoading: "Cargando métricas reales…",
        views: "Vistas",
        viewsHint: "Interacciones reales registradas en analíticas",
        contactActions: "Acciones de contacto",
        contactHint: "Clics de contacto medidos en analíticas (teléfono, WhatsApp, mensaje u otros)",
        entitiesTitle: "Mis anuncios",
        entitiesEmpty: "Aún no hay anuncios para mostrar. Publica el primero cuando quieras.",
        entitiesLoading: "Cargando un resumen de tus anuncios…",
        entitiesError: "No pudimos cargar el resumen de anuncios.",
        entitiesSubsetNote: "Resumen de la biblioteca canónica de anuncios. No incluye cada categoría especializada.",
        seeAllListings: "Ver todos mis anuncios",
        manageListing: "Administrar anuncio",
        activityTitle: "Actividad reciente",
        activityUnsupported:
          "Leonix aún no tiene una bitácora de cuenta persistida. Las alertas reales aparecen en “Necesita tu atención”; el detalle de compromiso está en Analíticas.",
        growthTitle: "Negocio / crecer",
        growthBody:
          "Business Concierge es inteligencia y guía para un negocio real. Si todavía no tienes uno en Leonix, te mostramos un camino honesto — nunca un diagnóstico inventado.",
        growthCta: "Herramientas de negocio",
        growthIdea: "¿Tienes una idea? Empieza publicando o completa tu perfil. No hay un constructor de ideas separado en este espacio de trabajo todavía.",
        growthLearn: "El Centro de aprendizaje (/aprender) no está publicado en este espacio de trabajo. No inventamos lecciones.",
        analyticsDegraded:
          "Las analíticas de Leonix aún no están disponibles. Vistas y contactos se ocultan en lugar de mostrar ceros falsos.",
        metricsFootnote:
          "Estas métricas vienen de interacciones reales. Un anuncio nuevo puede permanecer en cero hasta que alguien lo vea o contacte.",
        expiringFootnote:
          "“Por expirar” usa la ventana de visibilidad tras republicar y la fecha de expiración cuando existe en la tabla principal.",
        activeListingsFootnote: "Activos = anuncios visibles o publicados hoy en las fuentes conectadas. No incluye borradores.",
      }
    : {
        eyebrow: "Command center",
        title: "Your Leonix account at a glance",
        greetingNamed: (name: string) => `Hello, ${name}`,
        greetingAnon: "Welcome to your Leonix account",
        subtitle:
          "This summarizes what you manage, what needs attention, and the next honest step. It is not a second business dashboard.",
        publish: "Publish listing",
        attentionTitle: "Needs your attention",
        attentionEmpty: "Nothing urgent right now. Real payment, expiry, or review items will appear here.",
        attentionLoading: "Checking real account signals…",
        attentionError: "We could not load alerts. Try again later.",
        performanceTitle: "Account performance",
        performanceLoading: "Loading real metrics…",
        views: "Views",
        viewsHint: "Real interactions recorded in analytics",
        contactActions: "Contact actions",
        contactHint: "Measured contact clicks in analytics (phone, WhatsApp, message, or other)",
        entitiesTitle: "My listings",
        entitiesEmpty: "No listings to preview yet. Publish the first one whenever you are ready.",
        entitiesLoading: "Loading a preview of your listings…",
        entitiesError: "We could not load the listing preview.",
        entitiesSubsetNote: "Preview from the canonical listings library. Specialized category tables are not all included here.",
        seeAllListings: "See all my listings",
        manageListing: "Manage listing",
        activityTitle: "Recent activity",
        activityUnsupported:
          "Leonix does not yet persist an account activity log. Real alerts appear under “Needs your attention”; engagement detail lives in Analytics.",
        growthTitle: "Business / grow",
        growthBody:
          "Business Concierge is intelligence and guidance for a real business. If you do not have one on Leonix yet, we show an honest path — never a fabricated diagnosis.",
        growthCta: "Business tools",
        growthIdea: "Have an idea? Start by publishing or complete your profile. A separate idea builder is not in this workspace yet.",
        growthLearn: "The Learning Center (/aprender) is not published in this workspace. We do not invent lessons.",
        analyticsDegraded:
          "Leonix analytics are not available yet. Views and contacts are hidden instead of showing fake zeros.",
        metricsFootnote:
          "These metrics come from real interactions. A new listing may stay at zero until someone views or contacts it.",
        expiringFootnote:
          "“Expiring soon” uses the post-republish visibility window and listing expiry when those fields exist on the primary listings table.",
        activeListingsFootnote: "Active = listings visible or published today across connected sources. Excludes drafts.",
      };
}

export function businessConciergeHubCopy(lang: Lang) {
  return lang === "es"
    ? {
        eyebrow: "Business Concierge",
        title: "Inteligencia de negocio",
        subtitle:
          "Esta página organiza lo que Leonix ya puede mostrar con seguridad. No recrea el Libro de negocio, el Mapa de salud ni el motor de recomendaciones.",
        identityTitle: "Identidad de negocio",
        identityMissing:
          "No hay un registro canónico public.businesses.id en este espacio de trabajo. La identidad comercial hoy es el anuncio y tu cuenta.",
        identityListingBased: "Identidad actual: tus anuncios de Restaurantes o Servicios, con el id de anunciante Leonix cuando existe.",
        whatMattersTitle: "Lo que importa ahora",
        nrmTitle: "Siguiente paso correcto",
        nrmUnsupported:
          "Leonix todavía está aprendiendo lo suficiente para recomendar con responsabilidad. No hay un motor de Next Right Move expuesto al dueño en este espacio de trabajo.",
        attentionTitle: "Necesita tu atención",
        healthTitle: "Salud del negocio",
        healthUnsupported:
          "El Mapa de salud del dueño no está publicado aquí. No mostramos un puntaje 0–100 ni un diagnóstico inventado.",
        actionTitle: "Plan de acción",
        actionUnsupported:
          "El plan DIY Concierge del dueño no está publicado en este espacio de trabajo. No creamos tareas falsas.",
        understandTitle: "Lo que Leonix entiende",
        understandUnsupported:
          "La vista de dueño de “lo que entendemos” no está publicada aquí. No mostramos notas de staff ni borradores internos.",
        learnTitle: "Aprendizaje",
        learnUnsupported: "El Centro de aprendizaje (/aprender) no está en este espacio de trabajo. No inventamos lecciones personalizadas.",
        approvalsTitle: "Aprobaciones / trabajar con Leonix",
        progressTitle: "Progreso / resultados",
        progressUnsupported: "No hay resultados de Business Concierge con evidencia para mostrar. No convertimos analíticas de anuncios en ROI.",
        assistantTitle: "Asistente",
        assistantUnsupported:
          "El asistente de negocio para dueños no está listo en este espacio de trabajo. No implica que Leonix cobre, publique o apruebe solo.",
        generalTitle: "¿Tienes una idea o un oficio?",
        generalBody:
          "Si aún no administras un negocio real en Leonix, puedes publicar un anuncio o completar tu perfil. No hay Mapa de salud ni Siguiente paso correcto hasta que exista un negocio canónico y APIs seguras para el dueño.",
        ideaCta: "Publicar un anuncio",
        profileCta: "Completar perfil",
        mailtoCta: "Pedir información a Leonix",
        capabilitiesTitle: "Capacidades por anuncio",
        capabilitiesHint: "Estado real según tu paquete activo — nunca según el plan de tu cuenta.",
        capabilitiesEmpty: "No tienes anuncios de Restaurantes o Servicios todavía. Esta capacidad aplica a esas categorías.",
        included: "Incluido",
        notIncluded: "No incluido",
        completenessTitle: "Completitud del perfil (campos reales)",
        completenessHint: "Esto cuenta campos de perfil que ya podemos leer. No es un puntaje de salud de negocio.",
        nextSteps: "Siguientes pasos del perfil",
        overview: "Resumen",
        noPendingApprovals: "No hay un centro de aprobaciones del dueño publicado aquí. Las capacidades reales de cupones/ofertas aparecen abajo cuando aplican.",
        moduleLive: "Disponible",
        moduleUnavailable: "Aún no",
        whatMattersEmpty:
          "No hay un “siguiente paso correcto” aprobado. Los campos reales de perfil que faltan aparecen abajo cuando existen.",
        loading: "Cargando…",
      }
    : {
        eyebrow: "Business Concierge",
        title: "Business intelligence",
        subtitle:
          "This page organizes what Leonix can already show safely. It does not recreate the Living Business Book, Health Map, or recommendation engine.",
        identityTitle: "Business identity",
        identityMissing:
          "There is no canonical public.businesses.id record in this workspace. Commercial identity today is the listing plus your account.",
        identityListingBased: "Current identity: your Restaurantes or Servicios listings, with the Leonix ad id when it exists.",
        whatMattersTitle: "What matters now",
        nrmTitle: "Next right move",
        nrmUnsupported:
          "Leonix is still learning enough to recommend responsibly. No owner-facing Next Right Move engine is published in this workspace.",
        attentionTitle: "Needs your attention",
        healthTitle: "Business health",
        healthUnsupported:
          "The owner Health Map is not published here. We do not show a 0–100 score or a fabricated diagnosis.",
        actionTitle: "Action plan",
        actionUnsupported:
          "The owner DIY Concierge plan is not published in this workspace. We do not create fake tasks.",
        understandTitle: "What Leonix understands",
        understandUnsupported:
          "The owner view of “what we understand” is not published here. We do not show staff notes or internal drafts.",
        learnTitle: "Learning",
        learnUnsupported: "The Learning Center (/aprender) is not in this workspace. We do not invent personalized lessons.",
        approvalsTitle: "Approvals / work with Leonix",
        progressTitle: "Progress / results",
        progressUnsupported: "There are no evidence-backed Business Concierge outcomes to show. Listing analytics are not treated as ROI.",
        assistantTitle: "Assistant",
        assistantUnsupported:
          "The owner business assistant is not ready in this workspace. This does not imply Leonix will charge, publish, or approve on its own.",
        generalTitle: "Have an idea or a trade?",
        generalBody:
          "If you do not yet manage a real business on Leonix, you can publish a listing or complete your profile. There is no Health Map or Next Right Move until a canonical business and owner-safe APIs exist.",
        ideaCta: "Publish a listing",
        profileCta: "Complete profile",
        mailtoCta: "Ask Leonix for information",
        capabilitiesTitle: "Per-listing capabilities",
        capabilitiesHint: "Real status from your active package — never from your account plan.",
        capabilitiesEmpty: "You do not have Restaurantes or Servicios listings yet. This capability applies to those categories.",
        included: "Included",
        notIncluded: "Not included",
        completenessTitle: "Profile completeness (real fields)",
        completenessHint: "This counts profile fields we can already read. It is not a business-health score.",
        nextSteps: "Profile next steps",
        overview: "Overview",
        noPendingApprovals: "No owner approval center is published here. Real coupon/offer listing capabilities appear below when they apply.",
        moduleLive: "Available",
        moduleUnavailable: "Not yet",
        whatMattersEmpty:
          "There is no approved Next Right Move. Real missing profile fields appear below when they exist.",
        loading: "Loading…",
      };
}
