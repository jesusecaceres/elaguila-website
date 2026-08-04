export type Lang = "es" | "en";

/**
 * TODAY-1 — local typed COPY object for the public Learning Center, following the same
 * per-lang-object-literal convention as businessIdentityCopy.ts and the dashboard business-tools
 * pages (no new i18n framework).
 */
export function learningCopy(lang: Lang) {
  return lang === "es"
    ? {
        siteEyebrow: "Leonix Business Concierge",
        homeTitle: "Centro de aprendizaje",
        homeSubtitle: "Educacion practica y gratuita para dueños de negocio y personas que estan pensando en empezar uno.",
        comingSoonTitle: "Muy pronto",
        comingSoonBody: "El Centro de aprendizaje todavia no esta disponible. Vuelve pronto.",
        searchPlaceholder: "Buscar lecciones...",
        searchNoResults: "No se encontraron lecciones para esa busqueda.",
        categoriesTitle: "Categorias",
        glossaryLink: "Glosario",
        resourcesLink: "Listas y plantillas",
        ideaBuilderLink: "Constructor de ideas",
        minutesLabel: "min",
        levelLabel: { foundation: "Fundamento", practical: "Practico", advanced: "Avanzado" } as Record<string, string>,
        backToHome: "Volver al centro de aprendizaje",
        backToCategory: "Volver a la categoria",
        lessonNotFound: "No encontramos esta leccion.",
        relatedResourcesTitle: "Listas y plantillas relacionadas",
        startButton: "Empezar leccion",
        completeButton: "Marcar como completada",
        completedLabel: "Completada",
        signInPrompt: "Inicia sesion para guardar tu progreso.",
        loading: "Cargando...",
        emptyCategory: "Aun no hay lecciones publicadas en esta categoria.",
        glossaryTitle: "Glosario",
        glossarySubtitle: "Terminos comunes explicados en lenguaje sencillo.",
        resourcesTitle: "Listas y plantillas",
        resourcesSubtitle: "Herramientas descargables listas para usar.",
        checklistLabel: "Lista de verificacion",
        templateLabel: "Plantilla",
        langToggleEs: "ES",
        langToggleEn: "EN",
      }
    : {
        siteEyebrow: "Leonix Business Concierge",
        homeTitle: "Learning Center",
        homeSubtitle: "Free, practical education for business owners and people thinking about starting one.",
        comingSoonTitle: "Coming soon",
        comingSoonBody: "The Learning Center is not available yet. Check back soon.",
        searchPlaceholder: "Search lessons...",
        searchNoResults: "No lessons found for that search.",
        categoriesTitle: "Categories",
        glossaryLink: "Glossary",
        resourcesLink: "Checklists & templates",
        ideaBuilderLink: "Idea Builder",
        minutesLabel: "min",
        levelLabel: { foundation: "Foundation", practical: "Practical", advanced: "Advanced" } as Record<string, string>,
        backToHome: "Back to Learning Center",
        backToCategory: "Back to category",
        lessonNotFound: "We could not find this lesson.",
        relatedResourcesTitle: "Related checklists & templates",
        startButton: "Start lesson",
        completeButton: "Mark as complete",
        completedLabel: "Completed",
        signInPrompt: "Sign in to save your progress.",
        loading: "Loading...",
        emptyCategory: "No published lessons in this category yet.",
        glossaryTitle: "Glossary",
        glossarySubtitle: "Common terms explained in plain language.",
        resourcesTitle: "Checklists & templates",
        resourcesSubtitle: "Ready-to-use downloadable tools.",
        checklistLabel: "Checklist",
        templateLabel: "Template",
        langToggleEs: "ES",
        langToggleEn: "EN",
      };
}

export function langFromSearchParams(sp: Record<string, string | string[] | undefined> | undefined): Lang {
  const raw = sp?.lang;
  const value = Array.isArray(raw) ? raw[0] : raw;
  return value === "en" ? "en" : "es";
}
