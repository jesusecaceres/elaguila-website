/**
 * Gate G4-I1 — AI template set for "Qué problema resuelves" (`what_problem_do_you_solve`).
 * Goal: sharpen and stress-test the PROBLEM, never the product. Three full conversation starters
 * (sharpen · interview · disprove), stage-aware, auto-filled locally from the learner's five
 * answers. Assistant-neutral; no AI API. "AI helps. You verify."
 */
import { CITY_FIELD, IDEA_FIELD, MENTOR, OPENER_WITH_IDEA, PRIVACY, STAGE_FIELD, STAGE_LABELS, activityField, both, composeStages, type Stage } from "../promptParts";
import type { L, LessonPrompt, LessonPromptField } from "../types";

const CONTEXT: Record<"belief" | "operating", L> = {
  belief: {
    es: `Quién creo que tiene el problema: [[who]]
Qué les sale mal: [[wrong]]
Cada cuánto les pasa: [[often]]
Qué hacen hoy para resolverlo: [[today]]
Qué les cuesta (dinero, tiempo o preocupación): [[cost]]`,
    en: `Who I think has the problem: [[who]]
What goes wrong for them: [[wrong]]
How often it happens: [[often]]
What they do about it today: [[today]]
What it costs them (money, time, or worry): [[cost]]`,
  },
  operating: {
    es: `Quién me compra: [[who]]
El problema que creo que les resuelvo: [[wrong]]
Cada cuánto les pasa: [[often]]
Qué hacían antes de conocerme, o qué hacen cuando no me compran: [[today]]
Qué les cuesta ese problema (dinero, tiempo o preocupación): [[cost]]`,
    en: `Who buys from me: [[who]]
The problem I believe I solve for them: [[wrong]]
How often it happens: [[often]]
What they did before they found me, or what they do when they do not buy from me: [[today]]
What that problem costs them (money, time, or worry): [[cost]]`,
  },
};
const ctx = (stage: Stage): L => (stage === "negocio" ? CONTEXT.operating : CONTEXT.belief);

const FRAME: Record<Stage, L> = {
  neutral: { es: "Esto es lo que creo sobre el problema. Trátalo como hipótesis, no como hecho:", en: "This is what I believe about the problem. Treat it as a hypothesis, not a fact:" },
  idea: { es: "Esto es lo que creo sobre el problema. Es una corazonada: todavía no la he comprobado con nadie.", en: "This is what I believe about the problem. It is a hunch: I have not checked it with anyone yet." },
  empezando: { es: "Esto es lo que entiendo hoy sobre el problema. Son mis mejores suposiciones:", en: "This is what I understand about the problem today. These are my best assumptions:" },
  negocio: { es: "Esto es lo que observo en mi negocio. Son observaciones mías, no datos comprobados:", en: "This is what I observe in my business. These are my own observations, not verified data:" },
};

const NO_INVENT: L = {
  es: "No inventes datos sobre estas personas ni sobre mi mercado. No me digas que la idea es buena o mala: ayúdame a ver qué falta comprobar. Si supones algo, márcalo como suposición.",
  en: "Do not invent facts about these people or about my market. Do not tell me the idea is good or bad: help me see what still has to be checked. If you assume something, label it as an assumption.",
};

/* TEMPLATE A — SHARPEN MY PROBLEM */
const SHARPEN_TASK: Record<Stage, L> = {
  neutral: {
    es: `1. Primero dime qué parte de mi descripción es vaga y pregúntame lo que falte. No lo inventes.
2. Ayúdame a separar el problema (lo que le pasa a la persona) de mi producto (lo que yo quiero vender).
3. Reescribe conmigo el problema en una sola frase, usando solo mis palabras y las de mis clientes.
4. Dime qué debería comprobar con personas reales.`,
    en: `1. First tell me which part of my description is vague and ask me for what is missing. Do not make it up.
2. Help me separate the problem (what happens to the person) from my product (what I want to sell).
3. Rewrite the problem with me in a single sentence, using only my words and my customers' words.
4. Tell me what I should check with real people.`,
  },
  idea: {
    es: `1. Primero dime qué parte de mi descripción es vaga y pregúntame lo que falte. No lo inventes.
2. Ayúdame a separar el problema (lo que le pasa a la persona) de mi producto (lo que yo quiero vender).
3. Reescribe conmigo el problema en una sola frase, usando solo mis palabras.
4. Dime qué señales, al hablar con personas reales, me indicarían que el problema SÍ existe y cuáles que NO, antes de gastar dinero.`,
    en: `1. First tell me which part of my description is vague and ask me for what is missing. Do not make it up.
2. Help me separate the problem (what happens to the person) from my product (what I want to sell).
3. Rewrite the problem with me in a single sentence, using only my words.
4. Tell me which signals, when I talk to real people, would show the problem DOES exist and which would show it does NOT, before I spend money.`,
  },
  empezando: {
    es: `1. Primero pregúntame qué he visto o escuchado de mis primeros clientes posibles.
2. Ayúdame a decidir cuál versión de este problema es la que mis primeros clientes pagarían por resolver.
3. Reescribe conmigo el problema en una sola frase que pueda usar al presentarme, usando solo mis palabras.
4. Dime qué debería comprobar con personas reales antes de lanzar.`,
    en: `1. First ask me what I have seen or heard from my first possible customers.
2. Help me decide which version of this problem my first customers would actually pay to solve.
3. Rewrite the problem with me in a single sentence I can use when I introduce myself, using only my words.
4. Tell me what I should check with real people before I launch.`,
  },
  negocio: {
    es: `1. Primero pregúntame qué dicen mis clientes cuando explican por qué me compran.
2. Ayúdame a comparar el problema que yo creo resolver con el que mis clientes describen.
3. Reescribe conmigo el problema en una sola frase, usando las palabras de mis clientes que yo te comparta.
4. Dime qué debería preguntarles a mis clientes actuales para confirmarlo.`,
    en: `1. First ask me what my customers say when they explain why they buy from me.
2. Help me compare the problem I believe I solve with the one my customers describe.
3. Rewrite the problem with me in a single sentence, using the customer words I share with you.
4. Tell me what I should ask my current customers to confirm it.`,
  },
};
const SHARPEN = composeStages((s) => both(OPENER_WITH_IDEA[s], FRAME[s], ctx(s), MENTOR, SHARPEN_TASK[s], NO_INVENT));

/* TEMPLATE B — INTERVIEW ME */
const INTERVIEW_FOCUS: Record<Stage, L> = {
  neutral: { es: "Pregúntame cómo sé que este problema existe, a quién se lo he visto y qué hace esa persona hoy.", en: "Ask me how I know this problem exists, who I have seen it happen to, and what that person does today." },
  idea: { es: "Pregúntame de dónde saqué esta idea, a quién le he visto este problema y qué es lo que todavía no sé.", en: "Ask me where this idea came from, who I have seen with this problem, and what I still do not know." },
  empezando: { es: "Pregúntame sobre las personas que ya mostraron interés, qué me dijeron con sus palabras y qué evidencia tengo.", en: "Ask me about the people who have already shown interest, what they told me in their own words, and what evidence I have." },
  negocio: { es: "Pregúntame por qué me compran, qué hacían antes, quién regresa y quién dejó de venir.", en: "Ask me why people buy from me, what they did before, who comes back, and who stopped coming." },
};
const INTERVIEW = composeStages((s) =>
  both(
    OPENER_WITH_IDEA[s],
    { es: "Este es mi punto de partida. Son suposiciones mías:", en: "This is my starting point. These are my own assumptions:" },
    ctx(s),
    {
      es: "No me des respuestas todavía. Entrevístame: hazme unas 5 preguntas, una a la vez, y espera mi respuesta antes de hacer la siguiente.",
      en: "Do not give me answers yet. Interview me: ask me about 5 questions, one at a time, and wait for my answer before asking the next one.",
    },
    INTERVIEW_FOCUS[s],
    {
      es: "Cuando termine de responder, resume con mis propias palabras el problema, señala qué sigue siendo suposición y dime qué debería preguntarle a personas reales. No inventes nada que yo no te haya dicho.",
      en: "When I finish answering, summarize the problem in my own words, point out what is still an assumption, and tell me what I should ask real people. Do not invent anything I have not told you.",
    },
  ),
);

/* TEMPLATE C — WHAT WOULD PROVE ME WRONG */
const DISPROVE_CHECK: Record<Stage, L> = {
  neutral: { es: "3. Para cada una, dime qué tendría que ver o escuchar, de personas reales, para saber que estoy equivocado.", en: "3. For each one, tell me what I would have to see or hear, from real people, to know I am wrong." },
  idea: { es: "3. Para cada una, dime qué tendría que escuchar de personas reales para saber que estoy equivocado, y cómo averiguarlo sin gastar.", en: "3. For each one, tell me what I would have to hear from real people to know I am wrong, and how to find out without spending." },
  empezando: { es: "3. Para cada una, dime qué debería comprobar antes de lanzar y cuál sería la forma más sencilla de hacerlo.", en: "3. For each one, tell me what I should check before I launch and the simplest way to do it." },
  negocio: { es: "3. Para cada una, dime qué debería revisar en mis ventas y con mis clientes actuales para confirmarla o descartarla.", en: "3. For each one, tell me what I should review in my sales and with my current customers to confirm it or rule it out." },
};
const DISPROVE = composeStages((s) =>
  both(
    OPENER_WITH_IDEA[s],
    { es: "Esto es lo que creo sobre el problema que resuelvo:", en: "This is what I believe about the problem I solve:" },
    ctx(s),
    { es: "No quiero que me des la razón: quiero que pongas a prueba mi idea del problema, con respeto.", en: "I do not want you to agree with me: I want you to test my idea of the problem, respectfully." },
    {
      es: `1. Separa lo que parece que realmente sé de lo que solo estoy suponiendo. Si no está claro, pregúntame.
2. Señala las 2 o 3 suposiciones más débiles: por ejemplo, que el problema sea frecuente, que de verdad les cueste, o que lo que hacen hoy no les baste.
${DISPROVE_CHECK[s].es}`,
      en: `1. Separate what I seem to actually know from what I am only assuming. If it is not clear, ask me.
2. Point out the 2 or 3 weakest assumptions: for example, that the problem is frequent, that it really costs them, or that what they do today is not enough.
${DISPROVE_CHECK[s].en}`,
    },
    { es: "No presentes datos de mercado como si fueran ciertos: si no los tienes de mí, dilo.", en: "Do not present market facts as if they were certain: if you did not get them from me, say so." },
  ),
);

const FIELDS: LessonPromptField[] = [
  activityField("who", { es: "Quién tiene el problema", en: "Who has the problem" }, { es: "quién tiene el problema", en: "who has the problem" }),
  activityField("wrong", { es: "Qué les sale mal", en: "What goes wrong" }, { es: "qué les sale mal", en: "what goes wrong" }),
  activityField("often", { es: "Cada cuánto pasa", en: "How often it happens" }, { es: "cada cuánto pasa", en: "how often it happens" }),
  activityField("today", { es: "Qué hacen hoy", en: "What they do today" }, { es: "qué hacen hoy", en: "what they do today" }),
  activityField("cost", { es: "Qué les cuesta", en: "What it costs them" }, { es: "qué les cuesta", en: "what it costs them" }),
  IDEA_FIELD,
  CITY_FIELD,
  STAGE_FIELD,
];

const VERIFY: L = {
  es: "La IA ayuda. Tú verificas. Una IA no sabe si tu problema existe: eso solo te lo dicen personas reales.",
  en: "AI helps. You verify. An AI cannot know whether your problem exists: only real people can tell you that.",
};

const base: Pick<LessonPrompt, "fields" | "journeyStageLabels" | "privacy" | "verify" | "consequential"> = {
  fields: FIELDS,
  journeyStageLabels: STAGE_LABELS,
  privacy: PRIVACY,
  verify: VERIFY,
  consequential: false,
};

export const WHAT_PROBLEM_DO_YOU_SOLVE_PROMPTS: LessonPrompt[] = [
  {
    ...base,
    promptKey: "what_problem_do_you_solve",
    version: 1,
    title: { es: "Afina mi problema", en: "Sharpen my problem" },
    purpose: { es: "Para pasar de una idea vaga a un problema claro, dicho en una sola frase.", en: "To go from a vague idea to a clear problem, stated in a single sentence." },
    body: SHARPEN.body,
    variants: SHARPEN.variants,
    whyItWorks: [
      { es: "Empieza con tu idea y tu etapa: la IA sabe desde dónde hablas.", en: "It opens with your idea and your stage: the AI knows where you are speaking from." },
      { es: "Le das tus cinco respuestas como hipótesis, no como hechos.", en: "You give it your five answers as hypotheses, not as facts." },
      { es: "Le pides separar el problema del producto: es el error más común.", en: "You ask it to separate the problem from the product: the most common mistake." },
      { es: "Le prohíbes opinar si la idea es “buena”: eso lo decide la gente, no una IA.", en: "You forbid it from judging whether the idea is “good”: people decide that, not an AI." },
    ],
    customize: [
      { es: "Tus cinco respuestas de “Tu turno” ya están incluidas; si cambias una allá, cambia aquí.", en: "Your five answers from “Your turn” are already included; change one there and it changes here." },
      { es: "Describe tu idea en pocas palabras, como se la dirías a un vecino.", en: "Describe your idea in a few words, the way you would tell a neighbor." },
      { es: "Agrega frases que hayas escuchado de personas reales, sin nombres.", en: "Add phrases you have heard from real people, without names." },
    ],
    followUps: [
      { es: "¿Qué suposiciones hiciste? Enuméralas y dime cómo comprobar cada una.", en: "What assumptions did you make? List them and tell me how to check each one." },
      { es: "Dame 5 preguntas sobre este problema para hacerle a 3 personas reales, sin mencionar mi producto.", en: "Give me 5 questions about this problem to ask 3 real people, without mentioning my product." },
      { es: "¿Qué otra versión de este problema podría ser más urgente para estas personas?", en: "What other version of this problem might be more urgent for these people?" },
    ],
  },
  {
    ...base,
    promptKey: "what_problem_do_you_solve_interview",
    version: 1,
    title: { es: "Entrevístame sobre el problema", en: "Interview me about the problem" },
    purpose: { es: "Para que la IA te pregunte cómo sabes que el problema existe, en lugar de darte la razón.", en: "So the AI asks how you know the problem exists, instead of simply agreeing with you." },
    body: INTERVIEW.body,
    variants: INTERVIEW.variants,
    whyItWorks: [
      { es: "Cambia el orden: primero preguntas, después respuestas.", en: "It flips the order: questions first, answers later." },
      { es: "Te obliga a recordar casos reales, no teorías.", en: "It makes you recall real cases, not theories." },
      { es: "Termina con lo que sigue siendo suposición.", en: "It ends with what is still an assumption." },
    ],
    customize: [],
    followUps: [],
  },
  {
    ...base,
    promptKey: "what_problem_do_you_solve_challenge",
    version: 1,
    title: { es: "¿Qué me demostraría que me equivoco?", en: "What would prove me wrong?" },
    purpose: { es: "Para encontrar los puntos débiles de tu problema antes de que te cuesten dinero.", en: "To find the weak spots in your problem before they cost you money." },
    body: DISPROVE.body,
    variants: DISPROVE.variants,
    whyItWorks: [
      { es: "Le quita a la IA la costumbre de darte la razón.", en: "It takes away the AI's habit of agreeing with you." },
      { es: "Buscar qué te desmentiría es más barato que descubrirlo después de invertir.", en: "Looking for what would disprove you is cheaper than finding out after you invest." },
      { es: "Termina en cosas que puedes ir a comprobar, no en opiniones.", en: "It ends with things you can go and check, not with opinions." },
    ],
    customize: [],
    followUps: [],
  },
];
