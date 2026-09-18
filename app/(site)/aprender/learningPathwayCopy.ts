import type { Lang, LearningCheckpointKey, LearningJourneyKey } from "./learningCopy";

/**
 * Learning Center — code-owned chrome for the three pathway pages (Gate G1). Same
 * per-lang-object-literal convention as learningCopy.ts. Journey titles, empathy lines and
 * outcomes are reused from learningLandingCopy (one source); this file only adds what a pathway
 * page needs: the journey goal, the 7-checkpoint spine labels, the per-journey focus of each
 * checkpoint, depth/urgency labels and the bridge to the next journey.
 */
export type LearningPathwayCopy = {
  hero: {
    eyebrow: string;
    back: string;
    startFirst: string;
    goals: Record<LearningJourneyKey, string>;
  };
  spine: {
    eyebrow: string;
    title: string;
    intro: string;
    overviewAria: string;
    checkpointLabel: string;
    inPreparation: string;
    inPreparationBody: string;
    actionLabel: string;
    includesLabel: string;
    openLesson: string;
    depth: Record<"core" | "light" | "deep", string>;
    urgency: Record<"now" | "soon" | "later", string>;
    checkpoints: Record<LearningCheckpointKey, { title: string; body: string }>;
    focus: Record<LearningJourneyKey, Record<LearningCheckpointKey, string>>;
  };
  bridge: {
    eyebrow: string;
    continuity: string;
    next: Record<LearningJourneyKey, { title: string; body: string; cta: string }>;
    switchLabel: string;
    allPaths: string;
  };
  seo: Record<LearningJourneyKey, { title: string; description: string }>;
};

const PATHWAY_ES: LearningPathwayCopy = {
  hero: {
    eyebrow: "Ruta de aprendizaje",
    back: "Centro de Aprendizaje",
    startFirst: "Empezar con la primera lección",
    goals: {
      idea: "La pregunta de esta ruta: ¿puede esto convertirse en un negocio real, y qué debo entender antes de gastar fuerte?",
      empezando: "La meta de esta ruta: construir bien las bases y quedar listo para atender clientes.",
      negocio: "La meta de esta ruta: un negocio más fuerte, más moderno, más fácil de encontrar y más sostenible.",
    },
  },
  spine: {
    eyebrow: "Tu ruta, punto por punto",
    title: "Los siete puntos del camino",
    intro:
      "Las tres rutas recorren la misma escuela. Lo que cambia es el orden, la profundidad y lo que conviene hacer primero en tu momento.",
    overviewAria: "Los siete puntos del camino de un negocio",
    checkpointLabel: "Punto",
    inPreparation: "En preparación",
    inPreparationBody: "Estamos preparando las lecciones de este punto. Mientras tanto, avanza con los puntos que ya están disponibles.",
    actionLabel: "Tu acción",
    includesLabel: "Incluye",
    openLesson: "Abrir lección",
    depth: { core: "Esencial", light: "Vistazo", deep: "A fondo" },
    urgency: { now: "Ahora", soon: "Pronto", later: "Después" },
    checkpoints: {
      entender: { title: "Entender", body: "Tu idea, el problema que resuelves, tu cliente y tu competencia." },
      construir: { title: "Construir", body: "Identidad, marca y las bases del negocio, incluyendo qué licencias y permisos investigar." },
      preparar: { title: "Preparar", body: "Precios, números, operación, capacidad y experiencia del cliente." },
      visible: { title: "Hacerte visible", body: "Google, Yelp, sitio web, redes sociales, mensajes y reputación." },
      crecer: { title: "Crecer", body: "Marketing, referidos, publicidad, mezcla de medios y medición." },
      proteger: { title: "Proteger", body: "Registros, seguros, impuestos, obligaciones con empleados, datos y ayuda profesional." },
      siguiente: { title: "Siguiente paso", body: "Qué aprender o hacer ahora, y cómo seguir avanzando." },
    },
    focus: {
      idea: {
        entender: "Aquí empieza todo: comprueba que tu idea resuelve un problema real para alguien.",
        construir: "Por ahora, solo entiende qué bases necesitarás; todavía no tienes que tramitar nada.",
        preparar: "Un primer vistazo a costos, precios y al tiempo que de verdad tienes.",
        visible: "Conoce dónde te buscarán tus clientes cuando llegue el momento.",
        crecer: "Todavía no toca anunciarte; primero valida tu idea.",
        proteger: "Aprende qué preguntas hacer antes de comprometer dinero.",
        siguiente: "Convierte lo aprendido en un primer plan práctico.",
      },
      empezando: {
        entender: "Afina a quién sirves para que todo lo demás sea más claro.",
        construir: "Pon en orden la identidad y las bases de tu negocio.",
        preparar: "Deja listos tus precios, tus registros y tu forma de atender.",
        visible: "Hazte fácil de encontrar y de contactar desde el primer día.",
        crecer: "Da tus primeros pasos de marketing con un objetivo claro.",
        proteger: "Conoce qué debes verificar y con quién, antes de que sea urgente.",
        siguiente: "Arma tu plan de lanzamiento.",
      },
      negocio: {
        entender: "Vuelve a mirar a tu cliente y a tu competencia con lo que ya sabes.",
        construir: "Revisa si tu marca y tus bases siguen el ritmo de tu negocio.",
        preparar: "Rentabilidad, capacidad y sistemas para trabajar mejor.",
        visible: "Fortalece tu presencia, tu reputación y tu búsqueda local.",
        crecer: "Marketing, seguimiento y medición para crecer con intención.",
        proteger: "Revisa seguros, registros, obligaciones y datos antes de crecer más.",
        siguiente: "Define tu siguiente punto de control.",
      },
    },
  },
  bridge: {
    eyebrow: "Después de esta ruta",
    continuity: "Las lecciones son las mismas en las tres rutas: lo que ya aprendiste te sigue sirviendo y no empiezas de cero.",
    next: {
      idea: {
        title: "Cuando tu idea tenga forma, prepárate para abrir",
        body: "“Estoy empezando” retoma lo que ya sabes de tu cliente y tus números, y lo convierte en las bases de tu negocio.",
        cta: "Ir a “Estoy empezando”",
      },
      empezando: {
        title: "Cuando ya estés atendiendo clientes, hazlo más fuerte",
        body: "“Ya tengo un negocio” profundiza en rentabilidad, reputación, marketing y forma de operar.",
        cta: "Ir a “Ya tengo un negocio”",
      },
      negocio: {
        title: "Esta es la ruta más avanzada por ahora",
        body: "Vuelve a cualquier punto cuando lo necesites. Un negocio se revisa muchas veces, no una sola.",
        cta: "Ver las tres rutas",
      },
    },
    switchLabel: "¿Esta no es tu ruta?",
    allPaths: "Ver las tres rutas",
  },
  seo: {
    idea: {
      title: "Tengo una idea: ruta de aprendizaje para empezar un negocio",
      description:
        "Ruta guiada, bilingüe y sin costo del Centro de Aprendizaje Leonix para dar forma a una idea de negocio: cliente, números y primeros pasos, punto por punto.",
    },
    empezando: {
      title: "Estoy empezando: ruta de aprendizaje para abrir tu negocio",
      description:
        "Ruta guiada, bilingüe y sin costo del Centro de Aprendizaje Leonix para poner en orden las bases de tu negocio, hacerte visible y prepararte para atender clientes.",
    },
    negocio: {
      title: "Ya tengo un negocio: ruta de aprendizaje para fortalecerlo",
      description:
        "Ruta guiada, bilingüe y sin costo del Centro de Aprendizaje Leonix para fortalecer los números, la reputación, el marketing y la operación de tu negocio.",
    },
  },
};

const PATHWAY_EN: LearningPathwayCopy = {
  hero: {
    eyebrow: "Learning path",
    back: "Learning Center",
    startFirst: "Start with the first lesson",
    goals: {
      idea: "The question on this path: can this become a real business, and what should I understand before I spend heavily?",
      empezando: "The goal of this path: build the foundation correctly and become ready to serve customers.",
      negocio: "The goal of this path: a business that is stronger, more modern, easier to find, and more sustainable.",
    },
  },
  spine: {
    eyebrow: "Your path, point by point",
    title: "The seven checkpoints",
    intro:
      "All three paths run through the same school. What changes is the order, the depth, and what is worth doing first at your stage.",
    overviewAria: "The seven checkpoints on the path of a business",
    checkpointLabel: "Checkpoint",
    inPreparation: "In preparation",
    inPreparationBody: "We are preparing the lessons for this checkpoint. In the meantime, move ahead with the checkpoints already available.",
    actionLabel: "Your action",
    includesLabel: "Includes",
    openLesson: "Open lesson",
    depth: { core: "Essential", light: "Quick look", deep: "In depth" },
    urgency: { now: "Now", soon: "Soon", later: "Later" },
    checkpoints: {
      entender: { title: "Understand", body: "Your idea, the problem you solve, your customer, and your competition." },
      construir: { title: "Build", body: "Identity, brand, and business foundations, including which licenses and permits to look into." },
      preparar: { title: "Prepare", body: "Pricing, numbers, operations, capacity, and customer experience." },
      visible: { title: "Become visible", body: "Google, Yelp, website, social media, messaging, and reputation." },
      crecer: { title: "Grow", body: "Marketing, referrals, advertising, media mix, and measurement." },
      proteger: { title: "Protect", body: "Records, insurance, taxes, employee obligations, data, and professional help." },
      siguiente: { title: "Next step", body: "What to learn or do now, and how to keep moving forward." },
    },
    focus: {
      idea: {
        entender: "This is where it all starts: confirm your idea solves a real problem for someone.",
        construir: "For now, just understand which foundations you will need; you don't have to file anything yet.",
        preparar: "A first look at costs, prices, and the time you truly have.",
        visible: "Learn where your customers will look for you when the time comes.",
        crecer: "It is not time to advertise yet; validate your idea first.",
        proteger: "Learn which questions to ask before committing money.",
        siguiente: "Turn what you learned into a first practical plan.",
      },
      empezando: {
        entender: "Sharpen who you serve so everything else becomes clearer.",
        construir: "Get your business identity and foundations in order.",
        preparar: "Get your prices, your records, and the way you serve customers ready.",
        visible: "Become easy to find and easy to contact from day one.",
        crecer: "Take your first marketing steps with a clear goal.",
        proteger: "Know what to verify, and with whom, before it becomes urgent.",
        siguiente: "Put together your launch plan.",
      },
      negocio: {
        entender: "Look again at your customer and your competition with what you now know.",
        construir: "Check whether your brand and foundations are keeping pace with your business.",
        preparar: "Profitability, capacity, and systems to work better.",
        visible: "Strengthen your presence, your reputation, and your local search.",
        crecer: "Marketing, follow-up, and measurement to grow with intention.",
        proteger: "Review insurance, records, obligations, and data before you grow further.",
        siguiente: "Define your next checkpoint.",
      },
    },
  },
  bridge: {
    eyebrow: "After this path",
    continuity: "The lessons are the same across all three paths: what you already learned still counts, and you never start from zero.",
    next: {
      idea: {
        title: "Once your idea has shape, get ready to open",
        body: "“I'm getting started” picks up what you already know about your customer and your numbers, and turns it into your business foundations.",
        cta: "Go to “I'm getting started”",
      },
      empezando: {
        title: "Once you are serving customers, make it stronger",
        body: "“I already own a business” goes deeper into profitability, reputation, marketing, and the way you operate.",
        cta: "Go to “I already own a business”",
      },
      negocio: {
        title: "This is the most advanced path for now",
        body: "Come back to any checkpoint whenever you need it. A business is reviewed many times, not just once.",
        cta: "See all three paths",
      },
    },
    switchLabel: "Not your path?",
    allPaths: "See all three paths",
  },
  seo: {
    idea: {
      title: "I have an idea: a learning path for starting a business",
      description:
        "A guided, bilingual, no-cost path from the Leonix Learning Center to shape a business idea: customer, numbers, and first steps, checkpoint by checkpoint.",
    },
    empezando: {
      title: "I'm getting started: a learning path for opening your business",
      description:
        "A guided, bilingual, no-cost path from the Leonix Learning Center to get your business foundations in order, become visible, and get ready to serve customers.",
    },
    negocio: {
      title: "I already own a business: a learning path to strengthen it",
      description:
        "A guided, bilingual, no-cost path from the Leonix Learning Center to strengthen your business's numbers, reputation, marketing, and operations.",
    },
  },
};

export function learningPathwayCopy(lang: Lang): LearningPathwayCopy {
  return lang === "es" ? PATHWAY_ES : PATHWAY_EN;
}
