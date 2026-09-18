/**
 * Learning Center — code-owned journey / checkpoint map (Gate G1).
 *
 * One school, one 7-checkpoint spine, three ordered views. Every lesson has exactly one home
 * checkpoint (`LEARNING_LESSON_CHECKPOINT`, the future `lessons.checkpoint_key`), and every journey
 * lists the lessons it uses with its own depth, urgency, framing and recommended action
 * (`LEARNING_JOURNEY_LESSONS`, shaped like the future `journey_lessons` table: array order is
 * `sort_order`). Lesson content is never duplicated here.
 *
 * Pure module (no I/O, no server-only guard) so it is directly testable from
 * scripts/verify-business-learning-center-01.ts. Every resolver takes the PUBLISHED catalog as
 * input and silently drops any key that is not published, so this map can never surface a
 * planned/draft lesson or invent a count. When the data model gains these columns the map is
 * replaced by repository reads; the resolver and component contracts stay.
 */
import type { SupportedLang } from "@/app/lib/language";
import { withLang } from "@/app/lib/language";
import type { LearningCategory, LearningLesson } from "@/app/lib/business/learning/types";
import type { LearningCheckpointKey, LearningJourneyKey } from "./learningCopy";

export const LEARNING_JOURNEY_KEYS: readonly LearningJourneyKey[] = ["idea", "empezando", "negocio"];

/** Canonical business spine (Master Construction Bible §6, owner decision D1). Order is fixed. */
export const LEARNING_CHECKPOINT_KEYS: readonly LearningCheckpointKey[] = [
  "entender",
  "construir",
  "preparar",
  "visible",
  "crecer",
  "proteger",
  "siguiente",
];

/** One home checkpoint per lesson_key. Unmapped lessons simply do not appear on a pathway. */
export const LEARNING_LESSON_CHECKPOINT: Record<string, LearningCheckpointKey> = {
  who_is_your_customer: "entender",
  revenue_vs_profit: "preparar",
  healthy_boundaries_and_capacity: "preparar",
  consistent_business_information: "visible",
  google_business_basics: "visible",
  whatsapp_business_basics: "visible",
  reviews_and_customer_response: "visible",
  advertising_fundamentals: "crecer",
};

export type LearningLessonDepth = "core" | "light" | "deep";
export type LearningLessonUrgency = "now" | "soon" | "later";
export type LocalizedText = { es: string; en: string };

/** How one journey uses one lesson. Keys must be real lesson_keys. */
export type JourneyLessonEntry = {
  lessonKey: string;
  depth: LearningLessonDepth;
  urgency: LearningLessonUrgency;
  framing: LocalizedText;
  action: LocalizedText;
};

export const LEARNING_JOURNEY_LESSONS: Record<LearningJourneyKey, readonly JourneyLessonEntry[]> = {
  idea: [
    {
      lessonKey: "who_is_your_customer",
      depth: "core",
      urgency: "now",
      framing: {
        es: "Antes de gastar, averigua a quién le serviría de verdad tu idea.",
        en: "Before you spend, find out who your idea would truly serve.",
      },
      action: {
        es: "Describe en una frase a la persona que más necesita lo que quieres ofrecer.",
        en: "Describe in one sentence the person who most needs what you want to offer.",
      },
    },
    {
      lessonKey: "revenue_vs_profit",
      depth: "light",
      urgency: "soon",
      framing: {
        es: "Un vistazo para saber si tu idea podría tener sentido con números reales.",
        en: "A first look at whether your idea could make sense with real numbers.",
      },
      action: {
        es: "Haz una lista de lo que costaría entregar tu producto o servicio una sola vez.",
        en: "List what it would cost to deliver your product or service one single time.",
      },
    },
    {
      lessonKey: "healthy_boundaries_and_capacity",
      depth: "light",
      urgency: "later",
      framing: {
        es: "Piensa cuánto tiempo real puedes dedicar antes de prometer algo.",
        en: "Think about how much real time you can commit before you promise anything.",
      },
      action: {
        es: "Anota cuántas horas a la semana puedes darle a tu idea sin descuidar lo demás.",
        en: "Write down how many hours a week you can give your idea without neglecting everything else.",
      },
    },
  ],
  empezando: [
    {
      lessonKey: "who_is_your_customer",
      depth: "core",
      urgency: "now",
      framing: {
        es: "Tu mensaje, tu perfil y tus anuncios dependen de tener claro a quién le hablas.",
        en: "Your message, your profile, and your ads all depend on knowing who you are talking to.",
      },
      action: {
        es: "Escribe la descripción de tu cliente y úsala en todo lo que publiques.",
        en: "Write your customer description and use it in everything you publish.",
      },
    },
    {
      lessonKey: "revenue_vs_profit",
      depth: "core",
      urgency: "now",
      framing: {
        es: "Desde el primer mes, separa lo que entra de lo que realmente te queda.",
        en: "From month one, separate what comes in from what you actually keep.",
      },
      action: {
        es: "Empieza hoy a anotar ingresos y costos en un solo lugar.",
        en: "Start today writing down revenue and costs in one place.",
      },
    },
    {
      lessonKey: "healthy_boundaries_and_capacity",
      depth: "core",
      urgency: "soon",
      framing: {
        es: "Define cuánto trabajo puedes aceptar antes de abrir la puerta.",
        en: "Decide how much work you can take on before you open the door.",
      },
      action: {
        es: "Fija cuántos clientes o pedidos puedes atender bien por semana.",
        en: "Set how many customers or orders you can serve well each week.",
      },
    },
    {
      lessonKey: "consistent_business_information",
      depth: "core",
      urgency: "now",
      framing: {
        es: "Deja tu nombre, teléfono, dirección y horario iguales en todos lados desde el inicio.",
        en: "Get your name, phone, address, and hours matching everywhere from the start.",
      },
      action: {
        es: "Crea tu documento maestro con la información de tu negocio.",
        en: "Create your master document with your business information.",
      },
    },
    {
      lessonKey: "google_business_basics",
      depth: "core",
      urgency: "now",
      framing: {
        es: "Aparece donde la gente busca: tu perfil es lo primero que muchos verán.",
        en: "Show up where people search: your profile is the first thing many will see.",
      },
      action: {
        es: "Crea o reclama tu perfil y complétalo con información real.",
        en: "Create or claim your profile and complete it with real information.",
      },
    },
    {
      lessonKey: "whatsapp_business_basics",
      depth: "core",
      urgency: "soon",
      framing: {
        es: "Prepárate para responder rápido cuando lleguen tus primeros mensajes.",
        en: "Get ready to respond quickly when your first messages arrive.",
      },
      action: {
        es: "Configura tu perfil, tu mensaje de bienvenida y tus respuestas rápidas.",
        en: "Set up your profile, welcome message, and quick replies.",
      },
    },
    {
      lessonKey: "reviews_and_customer_response",
      depth: "light",
      urgency: "later",
      framing: {
        es: "Tus primeras reseñas llegarán pronto; conviene saber cómo responder.",
        en: "Your first reviews will come soon; it helps to know how to respond.",
      },
      action: {
        es: "Guarda la plantilla de respuesta para cuando llegue tu primera reseña.",
        en: "Keep the response template ready for when your first review arrives.",
      },
    },
    {
      lessonKey: "advertising_fundamentals",
      depth: "core",
      urgency: "later",
      framing: {
        es: "Antes de pagar tu primer anuncio, entiende qué quieres que logre.",
        en: "Before paying for your first ad, understand what you want it to achieve.",
      },
      action: {
        es: "Define un solo objetivo para tu primer anuncio.",
        en: "Define a single goal for your first ad.",
      },
    },
  ],
  negocio: [
    {
      lessonKey: "who_is_your_customer",
      depth: "deep",
      urgency: "soon",
      framing: {
        es: "Compara al cliente que imaginabas con las personas que de verdad te compran.",
        en: "Compare the customer you imagined with the people who actually buy from you.",
      },
      action: {
        es: "Revisa tus últimos diez clientes y busca qué tienen en común.",
        en: "Review your last ten customers and look for what they have in common.",
      },
    },
    {
      lessonKey: "revenue_vs_profit",
      depth: "core",
      urgency: "now",
      framing: {
        es: "Vender más no siempre es ganar más: revisa qué te deja ganancia de verdad.",
        en: "Selling more is not always earning more: check what truly leaves you a profit.",
      },
      action: {
        es: "Calcula la ganancia real del mes pasado, no solo las ventas.",
        en: "Calculate last month's real profit, not just sales.",
      },
    },
    {
      lessonKey: "healthy_boundaries_and_capacity",
      depth: "core",
      urgency: "now",
      framing: {
        es: "Crecer sin medir tu capacidad desgasta la calidad y te desgasta a ti.",
        en: "Growing without measuring your capacity wears down quality and wears you down.",
      },
      action: {
        es: "Identifica en qué punto aceptar más trabajo empieza a bajar la calidad.",
        en: "Identify the point where taking on more work starts to lower quality.",
      },
    },
    {
      lessonKey: "consistent_business_information",
      depth: "core",
      urgency: "now",
      framing: {
        es: "Con los años la información se desordena; conviene revisarla completa.",
        en: "Over the years information drifts; it is worth a full review.",
      },
      action: {
        es: "Revisa cada lugar donde apareces y corrige lo que no coincida.",
        en: "Audit every place you appear and fix whatever does not match.",
      },
    },
    {
      lessonKey: "google_business_basics",
      depth: "core",
      urgency: "soon",
      framing: {
        es: "Un perfil actualizado mantiene tu negocio fácil de encontrar y de confiar.",
        en: "An up-to-date profile keeps your business easy to find and easy to trust.",
      },
      action: {
        es: "Actualiza fotos, horario y descripción de tu perfil este mes.",
        en: "Update your profile's photos, hours, and description this month.",
      },
    },
    {
      lessonKey: "whatsapp_business_basics",
      depth: "core",
      urgency: "soon",
      framing: {
        es: "Ordena tu atención por mensajes para no perder clientes por respuestas tardías.",
        en: "Organize your messaging so you don't lose customers to late replies.",
      },
      action: {
        es: "Define tu tiempo máximo de respuesta y prepara respuestas rápidas.",
        en: "Set your maximum response time and prepare quick replies.",
      },
    },
    {
      lessonKey: "reviews_and_customer_response",
      depth: "core",
      urgency: "now",
      framing: {
        es: "Tu reputación ya existe en línea; responder bien la fortalece.",
        en: "Your reputation already exists online; responding well strengthens it.",
      },
      action: {
        es: "Responde esta semana las reseñas que siguen sin respuesta.",
        en: "This week, respond to the reviews that still have no reply.",
      },
    },
    {
      lessonKey: "advertising_fundamentals",
      depth: "core",
      urgency: "soon",
      framing: {
        es: "Revisa si tus anuncios tienen un objetivo claro y un resultado que puedas medir.",
        en: "Check whether your ads have a clear goal and a result you can measure.",
      },
      action: {
        es: "Antes de repetir un anuncio, revisa qué resultado medible tuvo.",
        en: "Before repeating an ad, check what measurable result it had.",
      },
    },
  ],
};

/** Ordered lesson_key sequence per journey, derived from the entries above (never a second list). */
export const LEARNING_JOURNEY_LESSON_KEYS: Record<LearningJourneyKey, readonly string[]> = {
  idea: LEARNING_JOURNEY_LESSONS.idea.map((e) => e.lessonKey),
  empezando: LEARNING_JOURNEY_LESSONS.empezando.map((e) => e.lessonKey),
  negocio: LEARNING_JOURNEY_LESSONS.negocio.map((e) => e.lessonKey),
};

/** Idea → Empezando → Negocio: one progression, never three disconnected schools. */
export const LEARNING_NEXT_JOURNEY: Record<LearningJourneyKey, LearningJourneyKey | null> = {
  idea: "empezando",
  empezando: "negocio",
  negocio: null,
};

export const LEARNING_ANCHORS = {
  journeys: "donde-estas",
  helper: "empezar",
  tools: "herramientas",
  spine: "ruta",
  topics: "temas",
  toolkit: "kit",
  method: "metodo",
  bridge: "siguiente-ruta",
} as const;

export const LEARNING_ROUTES = {
  home: "/aprender",
  pathway: "/aprender/ruta",
  glossary: "/aprender/glosario",
  resources: "/aprender/recursos",
  ideaBuilder: "/dashboard/business-tools/idea-builder",
} as const;

export function checkpointAnchor(key: LearningCheckpointKey): string {
  return `punto-${key}`;
}

/** Canonical journey link: the dedicated pathway route. `/aprender?journey=` only survives as a redirect. */
export function buildJourneyHref(journey: LearningJourneyKey, routeLang: SupportedLang): string {
  return withLang(`${LEARNING_ROUTES.pathway}/${journey}`, routeLang);
}

export function landingHref(routeLang: SupportedLang, anchor?: string): string {
  return withLang(anchor ? `${LEARNING_ROUTES.home}#${anchor}` : LEARNING_ROUTES.home, routeLang);
}

/** Lesson link; `journey` is carried as context so a later lesson renderer can resolve breadcrumb and next step. */
export function lessonHref(lessonKey: string, routeLang: SupportedLang, journey?: LearningJourneyKey): string {
  return withLang(`${LEARNING_ROUTES.home}/leccion/${lessonKey}`, routeLang, journey ? { journey } : undefined);
}

export function categoryHref(categoryKey: string, routeLang: SupportedLang): string {
  return withLang(`${LEARNING_ROUTES.home}/${categoryKey}`, routeLang);
}

export function isLearningJourneyKey(value: unknown): value is LearningJourneyKey {
  return typeof value === "string" && (LEARNING_JOURNEY_KEYS as readonly string[]).includes(value);
}

/** Legacy Phase-1 `?journey=` reader — used only to redirect old shared links to the pathway route. */
export function journeyFromSearchParams(sp: Record<string, string | string[] | undefined> | undefined): LearningJourneyKey | null {
  const raw = sp?.journey;
  const value = Array.isArray(raw) ? raw[0] : raw;
  return isLearningJourneyKey(value) ? value : null;
}

function publishedByKey(lessons: readonly LearningLesson[]): Map<string, LearningLesson> {
  const map = new Map<string, LearningLesson>();
  for (const l of lessons) if (l.status === "published") map.set(l.lessonKey, l);
  return map;
}

/** Ordered published lessons for a journey; unknown/unpublished keys are dropped silently. */
export function resolveJourneyLessons(journey: LearningJourneyKey, lessons: readonly LearningLesson[]): LearningLesson[] {
  const byKey = publishedByKey(lessons);
  const out: LearningLesson[] = [];
  for (const key of LEARNING_JOURNEY_LESSON_KEYS[journey]) {
    const l = byKey.get(key);
    if (l) out.push(l);
  }
  return out;
}

export function resolveAllJourneys(lessons: readonly LearningLesson[]): Record<LearningJourneyKey, LearningLesson[]> {
  return {
    idea: resolveJourneyLessons("idea", lessons),
    empezando: resolveJourneyLessons("empezando", lessons),
    negocio: resolveJourneyLessons("negocio", lessons),
  };
}

export type CheckpointLessonView = { lesson: LearningLesson; entry: JourneyLessonEntry };

export type CheckpointView = {
  key: LearningCheckpointKey;
  index: number;
  items: CheckpointLessonView[];
};

/**
 * The seven checkpoints for one journey, each with that journey's published lessons in journey
 * order. A checkpoint with none renders "En preparación" — never a zero badge, never a planned title.
 */
export function resolveJourneyCheckpoints(journey: LearningJourneyKey, lessons: readonly LearningLesson[]): CheckpointView[] {
  const byKey = publishedByKey(lessons);
  return LEARNING_CHECKPOINT_KEYS.map((key, index) => {
    const items: CheckpointLessonView[] = [];
    for (const entry of LEARNING_JOURNEY_LESSONS[journey]) {
      if (LEARNING_LESSON_CHECKPOINT[entry.lessonKey] !== key) continue;
      const lesson = byKey.get(entry.lessonKey);
      if (lesson) items.push({ lesson, entry });
    }
    return { key, index, items };
  });
}

export type TopicTileView = {
  category: LearningCategory;
  publishedCount: number;
};

/** Active categories that have at least one published lesson (empty categories are hidden, never "0 lessons"). */
export function resolveTopicTiles(categories: readonly LearningCategory[], lessons: readonly LearningLesson[]): TopicTileView[] {
  const counts = new Map<string, number>();
  for (const l of lessons) {
    if (l.status !== "published") continue;
    counts.set(l.categoryId, (counts.get(l.categoryId) ?? 0) + 1);
  }
  return [...categories]
    .filter((c) => c.status === "active")
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((category) => ({ category, publishedCount: counts.get(category.id) ?? 0 }))
    .filter((t) => t.publishedCount > 0);
}

/** Sum of real estimated minutes — only ever computed from published lessons. */
export function totalMinutes(lessons: readonly LearningLesson[]): number {
  return lessons.reduce((sum, l) => sum + (Number.isFinite(l.estimatedMinutes) ? l.estimatedMinutes : 0), 0);
}
