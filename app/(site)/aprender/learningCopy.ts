import type { SupportedLang } from "@/app/lib/language";

export type Lang = "es" | "en";

/**
 * Learning Center — code-owned public chrome copy (ES primary, EN parity). Same
 * per-lang-object-literal convention as homePageCopy.ts / businessIdentityCopy.ts (no i18n
 * framework). Lesson/category/glossary/resource CONTENT always comes from the database and is
 * rendered exactly as stored; only chrome lives here.
 *
 * The eyebrow is "Centro de Aprendizaje Leonix" — never
 * "Leonix Business Concierge" (the Learning Center teaches; the Concierge applies).
 */
export function learningCopy(lang: Lang) {
  return lang === "es"
    ? {
        siteEyebrow: "Centro de Aprendizaje Leonix",
        homeTitle: "Centro de Aprendizaje",
        homeSubtitle:
          "Orientación práctica de negocios, en lenguaje claro, para servir a personas reales y sostener un negocio responsable.",
        comingSoonTitle: "Muy pronto",
        comingSoonBody: "El Centro de Aprendizaje todavía no está disponible. Vuelve pronto.",
        searchPlaceholder: "Buscar lecciones...",
        searchNoResults: "No se encontraron lecciones para esa búsqueda.",
        categoriesTitle: "Categorías",
        glossaryLink: "Glosario",
        resourcesLink: "Listas y plantillas",
        ideaBuilderLink: "Constructor de ideas",
        minutesLabel: "min",
        levelLabel: { foundation: "Fundamento", practical: "Práctico", advanced: "Avanzado" } as Record<string, string>,
        backToHome: "Volver al Centro de Aprendizaje",
        backToCategory: "Volver a la categoría",
        lessonNotFound: "No encontramos esta lección.",
        relatedResourcesTitle: "Listas y plantillas relacionadas",
        startButton: "Empezar lección",
        completeButton: "Marcar como completada",
        completedLabel: "Completada",
        signInPrompt: "Inicia sesión para guardar tu progreso.",
        loading: "Cargando...",
        emptyCategory: "Aún no hay lecciones publicadas en esta categoría.",
        glossaryTitle: "Glosario",
        glossarySubtitle: "Términos comunes explicados en lenguaje sencillo.",
        resourcesTitle: "Listas y plantillas",
        resourcesSubtitle: "Herramientas listas para usar.",
        checklistLabel: "Lista de verificación",
        templateLabel: "Plantilla",
        langToggleEs: "ES",
        langToggleEn: "EN",
        lessonSingular: "lección",
        lessonPlural: "lecciones",
      }
    : {
        siteEyebrow: "Leonix Learning Center",
        homeTitle: "Learning Center",
        homeSubtitle:
          "Practical business guidance in plain language, to serve real people and sustain a responsible business.",
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
        backToHome: "Back to the Learning Center",
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
        resourcesSubtitle: "Ready-to-use tools.",
        checklistLabel: "Checklist",
        templateLabel: "Template",
        langToggleEs: "ES",
        langToggleEn: "EN",
        lessonSingular: "lesson",
        lessonPlural: "lessons",
      };
}

export type LearningJourneyKey = "idea" | "empezando" | "negocio";

/** Canonical 7-checkpoint business spine (owner decision D1). "Marca" and "Números" live on as topics inside these. */
export type LearningCheckpointKey =
  | "entender"
  | "construir"
  | "preparar"
  | "visible"
  | "crecer"
  | "proteger"
  | "siguiente";

export type LearningLandingCopy = {
  hero: {
    eyebrow: string;
    title: string;
    support: string;
    ctaPrimary: string;
    ctaSecondary: string;
    trust: [string, string, string, string];
    trustLabel: string;
    vignetteLabel: string;
    vignetteStages: [string, string, string];
  };
  journeys: {
    eyebrow: string;
    title: string;
    intro: string;
    inPreparation: string;
    items: Record<LearningJourneyKey, { title: string; empathy: string; outcome: string; cta: string }>;
  };
  helper: {
    eyebrow: string;
    title: string;
    body: string;
    cta: string;
    firstLessonLabel: string;
  };
  topics: {
    eyebrow: string;
    title: string;
    intro: string;
    searchLabel: string;
    explore: string;
  };
  toolkit: {
    eyebrow: string;
    title: string;
    intro: string;
    rowTitle: string;
    glossary: { title: string; body: string; cta: string; countLabel: string };
    resources: { title: string; body: string; cta: string; countLabel: string };
    ideaBuilder: { title: string; body: string; note: string; signInShort: string; cta: string };
  };
  method: {
    eyebrow: string;
    title: string;
    intro: string;
    steps: [
      { title: string; body: string },
      { title: string; body: string },
      { title: string; body: string },
      { title: string; body: string },
      { title: string; body: string },
    ];
  };
  close: {
    title: string;
    support: string;
    trustLine: string;
    boundary: string;
    cta: string;
  };
};

const LANDING_ES: LearningLandingCopy = {
  hero: {
    eyebrow: "Centro de Aprendizaje Leonix",
    title: "Aprende. Sirve. Construye para durar.",
    support:
      "Orientación práctica de negocios, en lenguaje claro, para entender a las personas, servirlas con excelencia y sostener un negocio responsable.",
    ctaPrimary: "Encontrar mi punto de partida",
    ctaSecondary: "No sé por dónde empezar",
    trust: ["Bilingüe", "Práctico", "A tu ritmo", "Sin costo"],
    trustLabel: "Cómo es aprender aquí",
    vignetteLabel: "El camino: de la idea a un negocio que sirve y dura",
    vignetteStages: ["Idea", "Servicio", "Legado"],
  },
  journeys: {
    eyebrow: "Tu punto de partida",
    title: "¿Dónde estás hoy?",
    intro: "Elige la ruta que describe tu momento. Cada una ordena las lecciones para que sepas qué sigue.",
    inPreparation: "En preparación",
    items: {
      idea: {
        title: "Tengo una idea",
        empathy: "“Tengo una idea, pero no sé por dónde empezar.”",
        outcome: "Da forma a tu idea, entiende a quién quieres servir y empieza con claridad.",
        cta: "Empezar por mi idea",
      },
      empezando: {
        title: "Estoy empezando",
        empathy: "“Ya decidí hacerlo. Ahora necesito saber qué sigue.”",
        outcome: "Organiza las bases de tu negocio, hazte visible y prepárate para atender clientes.",
        cta: "Preparar mi negocio",
      },
      negocio: {
        title: "Ya tengo un negocio",
        empathy: "“Mi negocio ya existe. Quiero hacerlo más fuerte.”",
        outcome: "Cuida los números, la reputación, el servicio y la salud del negocio.",
        cta: "Fortalecer mi negocio",
      },
    },
  },
  helper: {
    eyebrow: "¿Con dudas?",
    title: "No sé por dónde empezar",
    body: "Empieza por “Tengo una idea”. Las tres rutas recorren la misma escuela, así que nada se pierde si después cambias de ruta.",
    cta: "Ir a “Tengo una idea”",
    firstLessonLabel: "O abre directamente la primera lección:",
  },
  topics: {
    eyebrow: "Explora por tema",
    title: "Elige el tema que necesitas hoy",
    intro: "Cada tema reúne lecciones cortas y prácticas. Solo mostramos temas con lecciones publicadas.",
    searchLabel: "Buscar lecciones",
    explore: "Ver lecciones",
  },
  toolkit: {
    eyebrow: "Kit práctico",
    title: "Herramientas para poner en práctica lo aprendido",
    intro: "Además de las lecciones, tienes estos apoyos listos para usar.",
    rowTitle: "Herramientas que puedes usar cuando quieras",
    glossary: {
      title: "Glosario",
      body: "Términos de negocio explicados en lenguaje sencillo, sin dar nada por sabido.",
      cta: "Abrir glosario",
      countLabel: "términos",
    },
    resources: {
      title: "Listas y plantillas",
      body: "Listas de verificación y plantillas que puedes seguir paso a paso.",
      cta: "Ver listas y plantillas",
      countLabel: "recursos",
    },
    ideaBuilder: {
      title: "Constructor de ideas",
      body: "Organiza tu idea paso a paso: a quién sirves, qué problema resuelves y si puedes sostenerlo.",
      note: "Inicia sesión para usar el Constructor de ideas y guardar tu progreso.",
      signInShort: "Requiere iniciar sesión",
      cta: "Abrir el Constructor de ideas",
    },
  },
  method: {
    eyebrow: "Nuestro método",
    title: "Así se aprende en Leonix",
    intro: "Cada lección está pensada para hacerse, no solo para leerse.",
    steps: [
      { title: "Aprende", body: "Una explicación clara, sin palabras técnicas innecesarias." },
      { title: "Mira un ejemplo", body: "Un negocio real y cercano muestra cómo se aplica." },
      { title: "Hazlo tú", body: "Un paso concreto que puedes dar hoy con lo que tienes." },
      { title: "Revisa", body: "Una lista para confirmar que quedó bien hecho." },
      { title: "Continúa", body: "Sabes cuál es la siguiente lección de tu ruta." },
    ],
  },
  close: {
    title: "Conocimiento para avanzar, sin barreras.",
    support: "Aprende a tu ritmo, en español o inglés, y vuelve cuando lo necesites.",
    trustLine: "Aprendizaje práctico. Bilingüe. Sin costo.",
    boundary:
      "Leonix educa y orienta. Para decisiones legales, fiscales o financieras, consulta a un profesional autorizado.",
    cta: "Encontrar mi ruta",
  },
};

const LANDING_EN: LearningLandingCopy = {
  hero: {
    eyebrow: "Leonix Learning Center",
    title: "Learn. Serve. Build to last.",
    support:
      "Practical business guidance, in plain language, to understand people, serve them with excellence, and sustain a responsible business.",
    ctaPrimary: "Find where to start",
    ctaSecondary: "I'm not sure where to start",
    trust: ["Bilingual", "Practical", "At your pace", "No cost"],
    trustLabel: "What learning here is like",
    vignetteLabel: "The path: from an idea to a business that serves and lasts",
    vignetteStages: ["Idea", "Service", "Legacy"],
  },
  journeys: {
    eyebrow: "Your starting point",
    title: "Where are you today?",
    intro: "Pick the path that describes where you are. Each one puts the lessons in order so you know what comes next.",
    inPreparation: "In preparation",
    items: {
      idea: {
        title: "I have an idea",
        empathy: "“I have an idea, but I don't know where to start.”",
        outcome: "Shape your idea, understand who you want to serve, and begin with clarity.",
        cta: "Start with my idea",
      },
      empezando: {
        title: "I'm getting started",
        empathy: "“I've decided to do it. Now I need to know what comes next.”",
        outcome: "Get your business basics in order, become visible, and get ready to serve customers.",
        cta: "Get my business ready",
      },
      negocio: {
        title: "I already own a business",
        empathy: "“My business already exists. I want to make it stronger.”",
        outcome: "Care for your numbers, reputation, service, and the health of the business.",
        cta: "Strengthen my business",
      },
    },
  },
  helper: {
    eyebrow: "Not sure?",
    title: "I'm not sure where to start",
    body: "Start with “I have an idea.” All three paths run through the same school, so nothing is lost if you switch paths later.",
    cta: "Go to “I have an idea”",
    firstLessonLabel: "Or open the first lesson directly:",
  },
  topics: {
    eyebrow: "Explore by topic",
    title: "Choose the topic you need today",
    intro: "Each topic gathers short, practical lessons. We only show topics with published lessons.",
    searchLabel: "Search lessons",
    explore: "See lessons",
  },
  toolkit: {
    eyebrow: "Practical toolkit",
    title: "Tools to put what you learn into practice",
    intro: "Beyond the lessons, these supports are ready to use.",
    rowTitle: "Tools you can use anytime",
    glossary: {
      title: "Glossary",
      body: "Business terms explained in plain language, with nothing taken for granted.",
      cta: "Open the glossary",
      countLabel: "terms",
    },
    resources: {
      title: "Checklists & templates",
      body: "Checklists and templates you can follow step by step.",
      cta: "See checklists & templates",
      countLabel: "resources",
    },
    ideaBuilder: {
      title: "Idea Builder",
      body: "Organize your idea step by step: who you serve, what problem you solve, and whether you can sustain it.",
      note: "Sign in to use the Idea Builder and save your progress.",
      signInShort: "Sign-in required",
      cta: "Open the Idea Builder",
    },
  },
  method: {
    eyebrow: "Our method",
    title: "How learning works at Leonix",
    intro: "Every lesson is designed to be done, not just read.",
    steps: [
      { title: "Learn", body: "A clear explanation, without unnecessary jargon." },
      { title: "See an example", body: "A real, familiar business shows how it applies." },
      { title: "Do it yourself", body: "One concrete step you can take today with what you have." },
      { title: "Review", body: "A checklist to confirm it was done well." },
      { title: "Continue", body: "You know the next lesson on your path." },
    ],
  },
  close: {
    title: "Knowledge to move forward, without barriers.",
    support: "Learn at your own pace, in Spanish or English, and come back whenever you need to.",
    trustLine: "Practical learning. Bilingual. No cost.",
    boundary:
      "Leonix educates and guides. For legal, tax, or financial decisions, consult a licensed professional.",
    cta: "Find my path",
  },
};


export function learningLandingCopy(lang: Lang): LearningLandingCopy {
  return lang === "es" ? LANDING_ES : LANDING_EN;
}

/** Content language for Learning pages: EN only when explicitly requested; everything else reads ES. */
export function langFromSearchParams(sp: Record<string, string | string[] | undefined> | undefined): Lang {
  const raw = sp?.lang;
  const value = Array.isArray(raw) ? raw[0] : raw;
  return value === "en" ? "en" : "es";
}

/** Content language from an already-normalized route language (pt/tl → ES content; the `?lang=` param itself is preserved in links). */
export function contentLangFromRouteLang(routeLang: SupportedLang): Lang {
  return routeLang === "en" ? "en" : "es";
}
