/**
 * Gate G4-I1 — AI template set for "Conoce a tu competencia" (`know_your_competition`).
 * Goal: a research plan and an honest reading of the learner's OWN observations — never invented
 * competitor facts. An AI does not know the businesses in the learner's neighborhood: it can make
 * up names, prices, hours and reviews. Every template says so, and keeps research public, current
 * and honest (no scraping, no pretending to be a customer to extract private information).
 * Stage-aware, auto-filled locally from the learner's alternatives grid. Assistant-neutral; no AI API.
 */
import { CITY_FIELD, CUSTOMER_FIELD, IDEA_FIELD, MENTOR, OPENER_WITH_IDEA, PRIVACY, STAGE_FIELD, STAGE_LABELS, activityField, both, composeStages, type Stage } from "../promptParts";
import type { L, LessonPrompt, LessonPromptField } from "../types";

const GRID: L = {
  es: `Mi cliente: [[customer]]
Lo que más le importa a mi cliente al elegir: [[cares]]
Alternativa 1: [[alt_a]] — lo que observé: [[alt_a_notes]]
Alternativa 2: [[alt_b]] — lo que observé: [[alt_b_notes]]
Alternativa 3: [[alt_c]] — lo que observé: [[alt_c_notes]]
Donde creo que podría ser claramente mejor: [[gap]]`,
  en: `My customer: [[customer]]
What my customer cares about most when choosing: [[cares]]
Alternative 1: [[alt_a]] — what I observed: [[alt_a_notes]]
Alternative 2: [[alt_b]] — what I observed: [[alt_b_notes]]
Alternative 3: [[alt_c]] — what I observed: [[alt_c_notes]]
Where I think I could be clearly better: [[gap]]`,
};

const FRAME: Record<Stage, L> = {
  neutral: { es: "Estas son las alternativas que mi cliente tiene hoy, según lo que yo mismo he visto. Son observaciones mías, no datos comprobados:", en: "These are the alternatives my customer has today, based on what I have seen myself. They are my own observations, not verified data:" },
  idea: { es: "Antes de gastar dinero quiero entender qué usa hoy la gente en lugar de lo que yo ofrecería. Esto es lo que he visto hasta ahora; son observaciones mías:", en: "Before I spend money I want to understand what people use today instead of what I would offer. This is what I have seen so far; these are my own observations:" },
  empezando: { es: "Quiero entender qué otras opciones tiene mi cliente cerca de donde voy a trabajar. Esto es lo que he visto hasta ahora; son observaciones mías:", en: "I want to understand what other options my customer has near where I am going to work. This is what I have seen so far; these are my own observations:" },
  negocio: { es: "Quiero entender qué otras opciones usan mis clientes y qué puedo servirles mejor. Esto es lo que he observado; no son datos comprobados:", en: "I want to understand what other options my customers use and where I can serve them better. This is what I have observed; it is not verified data:" },
};

const NO_FACTS: L = {
  es: "Muy importante: tú no conoces los negocios de mi zona. No inventes nombres de negocios, precios, horarios, reseñas ni datos de mercado. Si necesitas un dato, dime dónde y cómo puedo comprobarlo yo: visitando, preguntando a clientes o revisando información pública y actual del propio negocio. No me propongas engañar a nadie, hacerme pasar por cliente para sacar información privada ni copiar a otro negocio. No me aconsejes atacar a otros negocios ni obsesionarme con ellos. El objetivo es servir mejor.",
  en: "Very important: you do not know the businesses in my area. Do not invent business names, prices, hours, reviews, or market facts. If you need a fact, tell me where and how I can check it myself: by visiting, by asking customers, or by looking at the business's own public, current information. Do not suggest deceiving anyone, posing as a customer to extract private information, or copying another business. Do not advise me to attack other businesses or obsess over them. The goal is to serve better.",
};

/* TEMPLATE A (type D) — PLAN MY RESEARCH */
const PLAN_TASK: Record<Stage, L> = {
  neutral: {
    es: `1. Primero pregúntame qué alternativas me faltan. Recuérdame incluir “no hacer nada” y “hacerlo uno mismo”.
2. Arma conmigo una lista corta de lo que debo observar en cada alternativa, según lo que le importa a mi cliente.
3. Dime qué puedo averiguar visitando u observando, y qué solo puedo saber preguntándole a clientes reales.`,
    en: `1. First ask me which alternatives I am missing. Remind me to include “do nothing” and “do it yourself”.
2. Build a short list with me of what to observe in each alternative, based on what my customer cares about.
3. Tell me what I can find out by visiting or observing, and what I can only learn by asking real customers.`,
  },
  idea: {
    es: `1. Primero pregúntame qué alternativas me faltan. Recuérdame incluir “no hacer nada” y “hacerlo uno mismo”.
2. Arma conmigo un plan de investigación que pueda hacer en una semana y sin gastar: qué observar desde mi casa y qué observar en la calle.
3. Dime qué señales indicarían que la gente ya está bien atendida y mi idea tendría que cambiar.`,
    en: `1. First ask me which alternatives I am missing. Remind me to include “do nothing” and “do it yourself”.
2. Build a research plan with me that I can do in one week without spending: what to observe from home and what to observe on the street.
3. Tell me which signals would show that people are already well served and my idea would have to change.`,
  },
  empezando: {
    es: `1. Primero pregúntame dónde voy a trabajar y qué opciones tiene mi cliente cerca de ahí.
2. Arma conmigo una lista corta de lo que debo observar en cada alternativa antes de fijar mis precios y mi mensaje.
3. Dime qué puedo averiguar visitando u observando, y qué solo puedo saber preguntándole a clientes reales.`,
    en: `1. First ask me where I am going to work and what options my customer has near there.
2. Build a short list with me of what to observe in each alternative before I set my prices and my message.
3. Tell me what I can find out by visiting or observing, and what I can only learn by asking real customers.`,
  },
  negocio: {
    es: `1. Primero pregúntame qué me han dicho mis clientes sobre a quién más le compran y por qué.
2. Arma conmigo preguntas sencillas para mis clientes actuales: qué otra opción usan, cuándo y qué les gusta de ella.
3. Dime qué debería revisar en mis ventas y en mi servicio para ver si alguna alternativa les está sirviendo mejor.`,
    en: `1. First ask me what my customers have told me about who else they buy from and why.
2. Build simple questions with me for my current customers: what other option they use, when, and what they like about it.
3. Tell me what I should review in my sales and in my service to see whether an alternative is serving them better.`,
  },
};
const PLAN = composeStages((s) => both(OPENER_WITH_IDEA[s], FRAME[s], GRID, MENTOR, PLAN_TASK[s], NO_FACTS));

/* TEMPLATE B (type A) — READ MY GRID */
const READ_END: Record<Stage, L> = {
  neutral: { es: "4. Dime qué parte de mi comparación es todavía una suposición y cómo comprobarla.", en: "4. Tell me which part of my comparison is still an assumption and how to check it." },
  idea: { es: "4. Dime qué parte de mi comparación es todavía una suposición y cómo comprobarla sin gastar.", en: "4. Tell me which part of my comparison is still an assumption and how to check it without spending." },
  empezando: { es: "4. Dime qué parte de mi comparación debería comprobar antes de fijar mis precios y mi mensaje.", en: "4. Tell me which part of my comparison I should check before I set my prices and my message." },
  negocio: { es: "4. Dime qué parte de mi comparación debería confirmar con mis clientes actuales y con mis ventas.", en: "4. Tell me which part of my comparison I should confirm with my current customers and my sales." },
};
const READ = composeStages((s) =>
  both(
    OPENER_WITH_IDEA[s],
    FRAME[s],
    GRID,
    MENTOR,
    {
      es: `1. Usando SOLO lo que yo escribí, ordena mi comparación: en qué es fuerte cada alternativa para mi cliente y en qué se queda corta.
2. Dime si el lugar donde creo ser mejor es algo que a mi cliente de verdad le importa, o solo algo que me importa a mí.
3. Ayúdame a decir esa diferencia en una frase honesta, sin hablar mal de nadie y sin prometer lo que no puedo cumplir.
${READ_END[s].es}`,
      en: `1. Using ONLY what I wrote, put my comparison in order: where each alternative is strong for my customer and where it falls short.
2. Tell me whether the place where I think I am better is something my customer truly cares about, or only something I care about.
3. Help me state that difference in one honest sentence, without speaking badly of anyone and without promising what I cannot deliver.
${READ_END[s].en}`,
    },
    NO_FACTS,
  ),
);

/* TEMPLATE C — CHALLENGE MY COMPARISON */
const CHALLENGE = composeStages((s) =>
  both(
    OPENER_WITH_IDEA[s],
    FRAME[s],
    GRID,
    { es: "No quiero que me des la razón: quiero que pongas a prueba mi comparación, con respeto.", en: "I do not want you to agree with me: I want you to test my comparison, respectfully." },
    {
      es: `1. Señala dónde puedo estar siendo injusto o demasiado optimista: ¿estoy subestimando alguna alternativa, sobre todo “no hacer nada”?
2. Dime qué haría falta para que un cliente cambiara su costumbre actual por mí, y si lo que ofrezco alcanza.
3. Señala las 2 suposiciones más débiles de mi comparación y dime cómo comprobar cada una con personas reales o visitando.`,
      en: `1. Point out where I may be unfair or too optimistic: am I underestimating an alternative, especially “do nothing”?
2. Tell me what it would take for a customer to swap their current habit for me, and whether what I offer is enough.
3. Point out the 2 weakest assumptions in my comparison and tell me how to check each one with real people or by visiting.`,
    },
    NO_FACTS,
  ),
);

const notes = (k: string, n: number) =>
  activityField(k, { es: `Lo que observaste de la alternativa ${n}`, en: `What you observed about alternative ${n}` }, { es: `qué observaste de la alternativa ${n}`, en: `what you observed about alternative ${n}` });
const alt = (k: string, n: number) => activityField(k, { es: `Alternativa ${n}`, en: `Alternative ${n}` }, { es: `alternativa ${n}`, en: `alternative ${n}` });

const FIELDS: LessonPromptField[] = [
  activityField("cares", { es: "Lo que más le importa a tu cliente", en: "What your customer cares about most" }, { es: "qué le importa más a tu cliente", en: "what your customer cares about most" }),
  alt("alt_a", 1),
  notes("alt_a_notes", 1),
  alt("alt_b", 2),
  notes("alt_b_notes", 2),
  alt("alt_c", 3),
  notes("alt_c_notes", 3),
  activityField("gap", { es: "Donde podrías ser claramente mejor", en: "Where you could be clearly better" }, { es: "dónde podrías ser mejor", en: "where you could be better" }),
  IDEA_FIELD,
  CUSTOMER_FIELD,
  CITY_FIELD,
  STAGE_FIELD,
];

const VERIFY: L = {
  es: "La IA ayuda. Tú verificas. Una IA puede inventar negocios, precios y reseñas: compruébalo visitando, preguntando a clientes y en información pública y actual.",
  en: "AI helps. You verify. An AI can invent businesses, prices, and reviews: check by visiting, by asking customers, and against public, current information.",
};

const base: Pick<LessonPrompt, "fields" | "journeyStageLabels" | "privacy" | "verify" | "consequential"> = {
  fields: FIELDS,
  journeyStageLabels: STAGE_LABELS,
  privacy: PRIVACY,
  verify: VERIFY,
  consequential: false,
};

export const KNOW_YOUR_COMPETITION_PROMPTS: LessonPrompt[] = [
  {
    ...base,
    promptKey: "know_your_competition",
    version: 1,
    title: { es: "Planea mi investigación", en: "Plan my research" },
    purpose: { es: "Para saber qué observar y a quién preguntar, en lugar de pedirle a una IA datos que no tiene.", en: "To know what to observe and who to ask, instead of asking an AI for facts it does not have." },
    body: PLAN.body,
    variants: PLAN.variants,
    whyItWorks: [
      { es: "Le pides un plan para investigar, no “datos” de tu competencia: esos la IA los puede inventar.", en: "You ask for a plan to research, not “facts” about your competition: an AI can make those up." },
      { es: "Le das lo que tú mismo observaste, dicho como observación y no como hecho.", en: "You give it what you observed yourself, stated as an observation and not as a fact." },
      { es: "Le recuerdas las alternativas invisibles: no hacer nada y hacerlo uno mismo.", en: "You remind it of the invisible alternatives: doing nothing and doing it yourself." },
      { es: "Marcas el límite: información pública, sin engañar y sin copiar.", en: "You set the boundary: public information, no deception, no copying." },
    ],
    customize: [
      { es: "Tu comparación de “Tu turno” ya está incluida; si cambias algo allá, cambia aquí.", en: "Your comparison from “Your turn” is already included; change something there and it changes here." },
      { es: "Escribe tu cliente en una frase; si ya hiciste “Quién es tu cliente”, usa esa.", en: "Write your customer in one sentence; if you already did “Who is your customer?”, use that one." },
      { es: "Pon tu ciudad o zona: las alternativas cambian de un barrio a otro.", en: "Add your city or area: the alternatives change from one neighborhood to the next." },
    ],
    followUps: [
      { es: "Convierte el plan en una hoja de visita: qué observar en 15 minutos en cada lugar.", en: "Turn the plan into a visit sheet: what to observe in 15 minutes at each place." },
      { es: "¿Qué le pregunto a un cliente para saber qué otra opción usa, sin incomodarlo?", en: "What do I ask a customer to learn which other option they use, without making them uncomfortable?" },
      { es: "¿Qué partes de tu respuesta son suposiciones tuyas? Enuméralas.", en: "Which parts of your answer are your own assumptions? List them." },
    ],
  },
  {
    ...base,
    promptKey: "know_your_competition_read",
    version: 1,
    title: { es: "Ayúdame a leer mi comparación", en: "Help me read my comparison" },
    purpose: { es: "Para ordenar lo que tú observaste y decir tu diferencia en una frase honesta.", en: "To put what you observed in order and state your difference in one honest sentence." },
    body: READ.body,
    variants: READ.variants,
    whyItWorks: [
      { es: "Trabaja solo con lo que tú escribiste: no agrega datos de nadie.", en: "It works only with what you wrote: it adds nobody's data." },
      { es: "Pregunta si tu ventaja le importa al cliente, no solo a ti.", en: "It asks whether your advantage matters to the customer, not only to you." },
      { es: "Pide una frase honesta: sin hablar mal de otros y sin promesas.", en: "It asks for an honest sentence: no bad-mouthing others and no promises." },
    ],
    customize: [],
    followUps: [],
  },
  {
    ...base,
    promptKey: "know_your_competition_challenge",
    version: 1,
    title: { es: "Reta mi comparación", en: "Challenge my comparison" },
    purpose: { es: "Para descubrir si estás subestimando a una alternativa, sobre todo a “no hacer nada”.", en: "To find out whether you are underestimating an alternative, especially “do nothing”." },
    body: CHALLENGE.body,
    variants: CHALLENGE.variants,
    whyItWorks: [
      { es: "Le quita a la IA la costumbre de darte la razón.", en: "It takes away the AI's habit of agreeing with you." },
      { es: "La costumbre del cliente suele ser tu competidor más fuerte.", en: "The customer's habit is often your strongest competitor." },
      { es: "Termina en cosas que puedes ir a comprobar, no en opiniones.", en: "It ends with things you can go and check, not with opinions." },
    ],
    customize: [],
    followUps: [],
  },
];
