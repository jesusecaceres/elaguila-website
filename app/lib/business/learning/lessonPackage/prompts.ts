/**
 * Gate G2 / G2.1 — code-owned AI Companion prompt registry (stage 1; a table later, same shape).
 *
 * Doctrine (Bible §12–§14, §44A): assistant-neutral — the learner pastes the prompt into whichever
 * AI assistant they prefer. Leonix calls no AI API and nothing the learner types leaves the
 * browser. Templates are FULL business conversation starters (fill → copy → paste → continue),
 * assembled locally from the learner's own lesson answers, and they are stage-aware: same topic,
 * different stage, different AI conversation. Every template asks for questions first, forbids
 * invention, separates assumptions from facts, and ships with a privacy reminder and a
 * verification line. "AI helps. You verify."
 *
 * A published prompt version is immutable: changing the text means a new `version`.
 */
import type { L, LessonJourneyKey, LessonLang, LessonPrompt, LessonPromptField } from "./types";

/* ---------------------------------------------------------------------------------------------- */
/* Flagship template set — "Quién es tu cliente". Three templates × (neutral + three journeys).    */
/* The bodies are composed from shared parts so the five-answer context is written once per stage. */
/* ---------------------------------------------------------------------------------------------- */

type Stage = LessonJourneyKey | "neutral";
const STAGES: readonly Stage[] = ["neutral", "idea", "empezando", "negocio"];

const OPENER: Record<Stage, L> = {
  neutral: {
    es: "Tengo, o estoy pensando en tener, un negocio pequeño en [[city]]. Mi etapa: [[stage]].",
    en: "I have, or am thinking about having, a small business in [[city]]. My stage: [[stage]].",
  },
  idea: {
    es: "Estoy pensando en empezar un negocio pequeño en [[city]]. Todavía no vendo: estoy explorando la idea antes de gastar dinero.",
    en: "I am thinking about starting a small business in [[city]]. I am not selling yet: I am exploring the idea before I spend money.",
  },
  empezando: {
    es: "Ya decidí empezar un negocio pequeño en [[city]] y me estoy preparando para atender a mis primeros clientes.",
    en: "I have decided to start a small business in [[city]] and I am getting ready to serve my first customers.",
  },
  negocio: {
    es: "Ya opero un negocio pequeño en [[city]].",
    en: "I already operate a small business in [[city]].",
  },
};

/** The learner's five activity answers, worded as beliefs (idea/starting/neutral) or observations (operating). */
const CONTEXT: Record<"belief" | "operating", L> = {
  belief: {
    es: `Lo que vendo: [[offer]]
Quién creo que lo necesita más: [[who]]
El problema que creo que resuelvo: [[problem]]
Dónde creo que puedo encontrarlos: [[where]]
Por qué creo que me elegirían: [[why]]`,
    en: `What I sell: [[offer]]
Who I think needs it most: [[who]]
The problem I think I solve: [[problem]]
Where I think I can reach them: [[where]]
Why I think they may choose me: [[why]]`,
  },
  operating: {
    es: `Lo que vendo: [[offer]]
Quiénes creo que son mis clientes principales: [[who]]
El problema que creo que les resuelvo: [[problem]]
Dónde me encuentran o dónde los encuentro: [[where]]
Por qué creo que me eligen: [[why]]`,
    en: `What I sell: [[offer]]
Who I believe my main customers are: [[who]]
The problem I believe I solve for them: [[problem]]
Where they find me or where I find them: [[where]]
Why I believe they choose me: [[why]]`,
  },
};

const contextFor = (stage: Stage): L => (stage === "negocio" ? CONTEXT.operating : CONTEXT.belief);

function compose(parts: Record<Stage, (ctx: L, opener: L) => L>): { body: L; variants: Record<LessonJourneyKey, { body: L }> } {
  const built = Object.fromEntries(STAGES.map((s) => [s, parts[s](contextFor(s), OPENER[s])])) as Record<Stage, L>;
  return { body: built.neutral, variants: { idea: { body: built.idea }, empezando: { body: built.empezando }, negocio: { body: built.negocio } } };
}

const join = (lang: LessonLang, ...blocks: L[]): string => blocks.map((b) => b[lang]).join("\n\n");
const both = (...blocks: L[]): L => ({ es: join("es", ...blocks), en: join("en", ...blocks) });

const NO_INVENT: L = {
  es: "No inventes datos sobre mis clientes ni sobre mi mercado. Si supones algo, márcalo como suposición y dime cómo comprobarlo.",
  en: "Do not invent facts about my customers or my market. If you assume something, label it as an assumption and tell me how I could check it.",
};
const MENTOR: L = {
  es: "Actúa como un mentor de negocios paciente y usa lenguaje sencillo.",
  en: "Act as a patient business mentor and use plain language.",
};

/* TEMPLATE A — DEVELOP MY CUSTOMER */
const DEVELOP = compose({
  neutral: (ctx, opener) =>
    both(
      opener,
      { es: "Esto es lo que creo hoy sobre mi cliente. Trátalo como hipótesis, no como hechos:", en: "This is what I currently believe about my customer. Treat it as hypotheses, not facts:" },
      ctx,
      MENTOR,
      {
        es: `1. Primero dime qué información importante falta y pregúntamela. No la inventes.
2. Después ayúdame a organizar 2 o 3 posibles grupos de clientes usando solo lo que yo te diga.
3. Para cada grupo, dime qué debería comprobar hablando con personas reales.`,
        en: `1. First tell me what important information is missing and ask me for it. Do not make it up.
2. Then help me organize 2 or 3 possible customer groups using only what I tell you.
3. For each group, tell me what I should check by talking to real people.`,
      },
      NO_INVENT,
    ),
  idea: (ctx, opener) =>
    both(
      opener,
      { es: "Esto es lo que creo hoy sobre mi cliente. Trátalo como hipótesis, no como hechos:", en: "This is what I currently believe about my customer. Treat it as hypotheses, not facts:" },
      ctx,
      MENTOR,
      {
        es: `1. Primero dime qué me falta aprender todavía y pregúntamelo. No lo inventes.
2. Después ayúdame a organizar 2 o 3 posibles grupos de clientes usando solo lo que yo te diga.
3. Para cada grupo, ayúdame a decidir qué probar con personas reales, de forma barata, antes de gastar fuerte.`,
        en: `1. First tell me what I still need to learn and ask me about it. Do not make it up.
2. Then help me organize 2 or 3 possible customer groups using only what I tell you.
3. For each group, help me decide what to test with real people, cheaply, before I spend heavily.`,
      },
      NO_INVENT,
    ),
  empezando: (ctx, opener) =>
    both(
      opener,
      { es: "Esto es lo que entiendo hoy sobre mi cliente. Son mis mejores suposiciones, no hechos comprobados:", en: "This is what I currently understand about my customer. These are my best assumptions, not proven facts:" },
      ctx,
      MENTOR,
      {
        es: `1. Primero pregúntame lo que necesites saber sobre mis primeros clientes posibles y cómo pienso llegar a ellos.
2. Ayúdame a decidir a qué grupo conviene hablarle primero y qué información de ese cliente todavía me falta.
3. Convierte eso en una lista corta de acciones y de evidencia que debería reunir antes de lanzar, y dime qué comprobar hablando con personas reales.`,
        en: `1. First ask me whatever you need to know about my first possible customers and how I plan to reach them.
2. Help me decide which group to speak to first and what customer information I am still missing.
3. Turn that into a short list of actions and of evidence I should gather before I launch, and tell me what to check by talking with real people.`,
      },
      {
        es: "No inventes fechas, precios, requisitos ni datos sobre mis clientes o mi mercado. Si supones algo, márcalo como suposición y dime cómo comprobarlo.",
        en: "Do not invent dates, prices, requirements, or facts about my customers or my market. If you assume something, label it as an assumption and tell me how I could check it.",
      },
    ),
  negocio: (ctx, opener) =>
    both(
      opener,
      { es: "Esto es lo que hoy entiendo de mis clientes. Son mis observaciones, no datos comprobados:", en: "This is what I currently understand about my customers. These are my observations, not verified data:" },
      ctx,
      {
        es: "Quiero entender si mi base de clientes está cambiando y si hay otros grupos a los que podría servir sin perder a los clientes que ya tengo.",
        en: "I want to understand whether my customer base is changing and whether there are other groups I could serve without losing the customers I already have.",
      },
      MENTOR,
      {
        es: `1. Primero pregúntame qué información real de clientes y de ventas tengo disponible.
2. Ayúdame a buscar patrones usando solo lo que yo te comparta.
3. Dime qué oportunidades son solo hipótesis y qué debería comprobar con mis ventas reales y hablando con mis clientes.`,
        en: `1. First ask me what real customer and sales information I have available.
2. Help me look for patterns using only what I share with you.
3. Tell me which opportunities are only hypotheses and what I should check against my real sales and by talking with my customers.`,
      },
      {
        es: "No supongas datos demográficos, de ventas ni de mercado que yo no te haya dado. Si supones algo, márcalo como suposición.",
        en: "Do not assume demographic, sales, or market facts I have not provided. If you assume something, label it as an assumption.",
      },
    ),
});

/* TEMPLATE B — INTERVIEW ME */
const INTERVIEW_FOCUS: Record<Stage, L> = {
  neutral: {
    es: "Pregúntame sobre el problema, sobre quién lo tiene y sobre lo que ya sé de quienes me compran o muestran interés.",
    en: "Ask me about the problem, about who has it, and about what I already know about the people who buy or show interest.",
  },
  idea: {
    es: "Pregúntame sobre el problema, sobre quién lo tiene de verdad y sobre lo que todavía no sé.",
    en: "Ask me about the problem, about who really has it, and about what I still do not know.",
  },
  empezando: {
    es: "Pregúntame sobre mis primeros clientes posibles, sobre cómo pienso llegar a ellos y sobre la evidencia que tengo hasta ahora.",
    en: "Ask me about my first possible customers, about how I plan to reach them, and about the evidence I have so far.",
  },
  negocio: {
    es: "Pregúntame sobre quién me compra de verdad, quién regresa, quién dejó de venir y cómo me encuentran.",
    en: "Ask me about who actually buys from me, who comes back, who stopped coming, and how they find me.",
  },
};
const interviewBody = (stage: Stage) => (ctx: L, opener: L) =>
  both(
    opener,
    { es: "Este es mi punto de partida. Son suposiciones mías:", en: "This is my starting point. These are my own assumptions:" },
    ctx,
    {
      es: "No me des respuestas todavía. Entrevístame: hazme unas 5 preguntas, una a la vez, y espera mi respuesta antes de hacer la siguiente.",
      en: "Do not give me answers yet. Interview me: ask me about 5 questions, one at a time, and wait for my answer before asking the next one.",
    },
    INTERVIEW_FOCUS[stage],
    {
      es: "Cuando termine de responder, resume con mis propias palabras lo que aprendiste sobre mi cliente, señala qué sigue siendo suposición y dime qué debería preguntarle a personas reales. No inventes nada que yo no te haya dicho.",
      en: "When I finish answering, summarize in my own words what you learned about my customer, point out what is still an assumption, and tell me what I should ask real people. Do not invent anything I have not told you.",
    },
  );
const INTERVIEW = compose({ neutral: interviewBody("neutral"), idea: interviewBody("idea"), empezando: interviewBody("empezando"), negocio: interviewBody("negocio") });

/* TEMPLATE C — CHALLENGE MY ASSUMPTIONS */
const CHALLENGE_CHECK: Record<Stage, L> = {
  neutral: {
    es: "3. Para cada una, dime cómo podría comprobarla con personas reales o con información real de mi negocio.",
    en: "3. For each one, tell me how I could check it with real people or with real information from my business.",
  },
  idea: {
    es: "3. Para cada una, dime cómo podría comprobarla hablando con personas reales, de forma barata, antes de gastar.",
    en: "3. For each one, tell me how I could check it by talking to real people, cheaply, before I spend.",
  },
  empezando: {
    es: "3. Para cada una, dime qué debería comprobar antes de lanzar y cuál sería la forma más sencilla de hacerlo.",
    en: "3. For each one, tell me what I should check before I launch and the simplest way to do it.",
  },
  negocio: {
    es: "3. Para cada una, dime qué debería revisar en mis ventas y con mis clientes actuales para confirmarla o descartarla.",
    en: "3. For each one, tell me what I should review in my sales and with my current customers to confirm it or rule it out.",
  },
};
const challengeBody = (stage: Stage) => (ctx: L, opener: L) =>
  both(
    opener,
    { es: "Esto es lo que creo sobre mi cliente:", en: "This is what I believe about my customer:" },
    ctx,
    {
      es: "No quiero que me des la razón: quiero que pongas a prueba mis ideas con respeto.",
      en: "I do not want you to agree with me: I want you to test my thinking, respectfully.",
    },
    {
      es: `1. Separa lo que parece que realmente sé de lo que solo estoy suponiendo. Si no está claro, pregúntame.
2. Señala las 2 o 3 suposiciones más débiles o más riesgosas y explícame por qué.
${CHALLENGE_CHECK[stage].es}`,
      en: `1. Separate what I seem to actually know from what I am only assuming. If it is not clear, ask me.
2. Point out the 2 or 3 weakest or riskiest assumptions and explain why.
${CHALLENGE_CHECK[stage].en}`,
    },
    {
      es: "No presentes datos de mercado como si fueran ciertos: si no los tienes de mí, dilo.",
      en: "Do not present market facts as if they were certain: if you did not get them from me, say so.",
    },
  );
const CHALLENGE = compose({ neutral: challengeBody("neutral"), idea: challengeBody("idea"), empezando: challengeBody("empezando"), negocio: challengeBody("negocio") });

/** Shared by the three flagship templates: the five activity answers + city + stage. */
const CUSTOMER_FIELDS: LessonPromptField[] = [
  { token: "offer", label: { es: "Lo que vendes", en: "What you sell" }, placeholder: { es: "qué vendes", en: "what you sell" }, prefillFrom: { kind: "activity_field", fieldKey: "offer" } },
  { token: "who", label: { es: "Quién lo necesita más", en: "Who needs it most" }, placeholder: { es: "quién lo necesita más", en: "who needs it most" }, prefillFrom: { kind: "activity_field", fieldKey: "who" } },
  { token: "problem", label: { es: "El problema que resuelves", en: "The problem you solve" }, placeholder: { es: "qué problema resuelves", en: "what problem you solve" }, prefillFrom: { kind: "activity_field", fieldKey: "problem" } },
  { token: "where", label: { es: "Dónde están", en: "Where they are" }, placeholder: { es: "dónde están", en: "where they are" }, prefillFrom: { kind: "activity_field", fieldKey: "where" } },
  { token: "why", label: { es: "Por qué te elegirían", en: "Why they would choose you" }, placeholder: { es: "por qué te elegirían", en: "why they would choose you" }, prefillFrom: { kind: "activity_field", fieldKey: "why" } },
  { token: "city", label: { es: "Tu ciudad o zona", en: "Your city or area" }, placeholder: { es: "ciudad", en: "city" } },
  { token: "stage", label: { es: "Tu etapa", en: "Your stage" }, placeholder: { es: "idea / empezando / ya opero", en: "idea / getting started / already operating" }, prefillFrom: { kind: "journey_stage" } },
];

const STAGE_LABELS: Record<LessonJourneyKey, L> = {
  idea: { es: "tengo una idea y todavía no vendo", en: "I have an idea and I am not selling yet" },
  empezando: { es: "estoy empezando", en: "I am just getting started" },
  negocio: { es: "ya opero mi negocio", en: "I am already operating my business" },
};

const PRIVACY: LessonPrompt["privacy"] = {
  intro: { es: "Antes de pegar algo en una IA, quita los datos de personas reales. No pegues de tus clientes:", en: "Before you paste anything into an AI, remove real people's details. Do not paste your customers':" },
  never: [
    { es: "nombres completos", en: "full names" },
    { es: "números de teléfono", en: "phone numbers" },
    { es: "direcciones", en: "addresses" },
    { es: "información privada de cuentas", en: "private account information" },
  ],
};

const VERIFY_LINE: L = {
  es: "La IA ayuda. Tú verificas. Lo que te digan clientes reales vale más que cualquier suposición de una IA.",
  en: "AI helps. You verify. What real customers tell you outranks any guess an AI makes.",
};

/** TEMPLATE A — primary. v2: now carries all five activity answers and stage-aware variants (v1 had three fields, one body). */
export const WHO_IS_YOUR_CUSTOMER_PROMPT: LessonPrompt = {
  promptKey: "who_is_your_customer",
  version: 2,
  title: { es: "Desarrolla a mi cliente", en: "Develop my customer" },
  purpose: {
    es: "Para profundizar en la frase que acabas de armar y convertirla en 2 o 3 grupos de clientes posibles.",
    en: "To go deeper into the sentence you just built and turn it into 2 or 3 possible customer groups.",
  },
  body: DEVELOP.body,
  variants: DEVELOP.variants,
  fields: CUSTOMER_FIELDS,
  journeyStageLabels: STAGE_LABELS,
  whyItWorks: [
    { es: "Empieza con tu objetivo y tu etapa: la IA sabe para qué la necesitas.", en: "It opens with your goal and your stage: the AI knows what you need it for." },
    { es: "Le das contexto: tus cinco respuestas, dichas como hipótesis y no como hechos.", en: "You give it context: your five answers, stated as hypotheses and not as facts." },
    { es: "Le asignas un papel claro: mentor paciente, lenguaje sencillo.", en: "You give it a clear role: a patient mentor using plain language." },
    { es: "Le pides que pregunte lo que falta en lugar de inventarlo.", en: "You ask it to ask for what is missing instead of making it up." },
    { es: "Separa suposiciones de hechos y termina en qué comprobar con personas reales.", en: "It separates assumptions from facts and ends with what to check with real people." },
  ],
  customize: [
    { es: "Tus cinco respuestas de “Tu turno” ya están incluidas; si cambias una allá, cambia aquí.", en: "Your five answers from “Your turn” are already included; change one there and it changes here." },
    { es: "Pon tu ciudad o zona: el cliente de un barrio no es el de otro.", en: "Add your city or area: the customer in one neighborhood is not the customer in another." },
    { es: "Revisa tu etapa: una idea, empezando, o ya operando. Cambia la conversación.", en: "Check your stage: an idea, getting started, or already operating. It changes the conversation." },
    { es: "Agrega lo que ya sabes de quienes te compran o preguntan, sin datos personales.", en: "Add what you already know about the people who buy or ask, without personal details." },
  ],
  followUps: [
    { es: "¿Qué suposiciones hiciste? Enuméralas y dime cómo comprobar cada una.", en: "What assumptions did you make? List them and tell me how to check each one." },
    { es: "Dame 5 preguntas para hacerle a 3 clientes reales esta semana.", en: "Give me 5 questions to ask 3 real customers this week." },
    { es: "Resume mi cliente en una frase que pueda usar en mis mensajes.", en: "Summarize my customer in one sentence I can use in my messages." },
  ],
  privacy: PRIVACY,
  verify: VERIFY_LINE,
  consequential: false,
};

/** TEMPLATE B — the AI asks, the learner answers. */
export const WHO_IS_YOUR_CUSTOMER_INTERVIEW_PROMPT: LessonPrompt = {
  promptKey: "who_is_your_customer_interview",
  version: 1,
  title: { es: "Entrevístame", en: "Interview me" },
  purpose: {
    es: "Para que la IA te haga preguntas a ti, en lugar de darte una respuesta genérica.",
    en: "So the AI asks you the questions, instead of handing you a generic answer.",
  },
  body: INTERVIEW.body,
  variants: INTERVIEW.variants,
  fields: CUSTOMER_FIELDS,
  journeyStageLabels: STAGE_LABELS,
  whyItWorks: [
    { es: "Cambia el orden: primero preguntas, después respuestas.", en: "It flips the order: questions first, answers later." },
    { es: "Una pregunta a la vez te hace pensar, no solo leer.", en: "One question at a time makes you think, not just read." },
    { es: "Pide un resumen con tus propias palabras y lo que sigue siendo suposición.", en: "It asks for a summary in your own words and for what is still an assumption." },
  ],
  customize: [],
  followUps: [],
  privacy: PRIVACY,
  verify: VERIFY_LINE,
  consequential: false,
};

/** TEMPLATE C — AI is not only for agreement. */
export const WHO_IS_YOUR_CUSTOMER_CHALLENGE_PROMPT: LessonPrompt = {
  promptKey: "who_is_your_customer_challenge",
  version: 1,
  title: { es: "Reta mis suposiciones", en: "Challenge my assumptions" },
  purpose: {
    es: "Para encontrar los puntos débiles de tu idea de cliente antes de que te cuesten dinero.",
    en: "To find the weak spots in your customer thinking before they cost you money.",
  },
  body: CHALLENGE.body,
  variants: CHALLENGE.variants,
  fields: CUSTOMER_FIELDS,
  journeyStageLabels: STAGE_LABELS,
  whyItWorks: [
    { es: "Le quita a la IA la costumbre de darte la razón.", en: "It takes away the AI's habit of agreeing with you." },
    { es: "Separar lo que sabes de lo que supones te muestra dónde está el riesgo.", en: "Separating what you know from what you assume shows you where the risk is." },
    { es: "Termina en acciones para comprobar, no en opiniones.", en: "It ends with actions to check, not with opinions." },
  ],
  customize: [],
  followUps: [],
  privacy: PRIVACY,
  verify: VERIFY_LINE,
  consequential: false,
};

export const LEARNING_PROMPTS: Readonly<Record<string, LessonPrompt>> = {
  [WHO_IS_YOUR_CUSTOMER_PROMPT.promptKey]: WHO_IS_YOUR_CUSTOMER_PROMPT,
  [WHO_IS_YOUR_CUSTOMER_INTERVIEW_PROMPT.promptKey]: WHO_IS_YOUR_CUSTOMER_INTERVIEW_PROMPT,
  [WHO_IS_YOUR_CUSTOMER_CHALLENGE_PROMPT.promptKey]: WHO_IS_YOUR_CUSTOMER_CHALLENGE_PROMPT,
};

export function getLessonPrompt(promptKey: string): LessonPrompt | null {
  return LEARNING_PROMPTS[promptKey] ?? null;
}

/** Stage-aware body: the journey's variant when one exists; otherwise (no/unknown journey) the neutral body. */
export function resolvePromptBody(prompt: LessonPrompt, journey: LessonJourneyKey | null): L {
  return (journey && prompt.variants?.[journey]?.body) || prompt.body;
}

export function journeyStageValue(prompt: LessonPrompt, journey: LessonJourneyKey | null, lang: LessonLang): string {
  return journey && prompt.journeyStageLabels ? prompt.journeyStageLabels[journey][lang] : "";
}

/**
 * AUTO-FILL (Bible §44A-E), pure and local. Where each token's value comes from:
 *  - `activity_field` → ONLY the learner's activity answer (one source of truth: edit it in the
 *    activity and every template follows; clear the activity and it clears here);
 *  - `journey_stage`  → what the learner typed, else the journey's stage wording, else nothing;
 *  - no prefill        → what the learner typed (e.g. city).
 * A value that is missing stays missing. Nothing is ever guessed.
 */
export function resolvePromptValues(
  prompt: LessonPrompt,
  ctx: { answers: Readonly<Record<string, string | undefined>>; typed: Readonly<Record<string, string | undefined>>; journey: LessonJourneyKey | null; lang: LessonLang },
): Record<string, string> {
  const values: Record<string, string> = {};
  for (const field of prompt.fields) {
    const typed = ctx.typed[field.token];
    if (field.prefillFrom?.kind === "activity_field") values[field.token] = ctx.answers[field.prefillFrom.fieldKey] ?? "";
    else if (field.prefillFrom?.kind === "journey_stage") values[field.token] = typed !== undefined ? typed : journeyStageValue(prompt, ctx.journey, ctx.lang);
    else values[field.token] = typed ?? "";
  }
  return values;
}

/** Fields the learner fills in the AI block itself (everything that does not come from the activity). */
export function editablePromptFields(prompt: LessonPrompt): LessonPromptField[] {
  return prompt.fields.filter((f) => f.prefillFrom?.kind !== "activity_field");
}

export type PromptPart = { kind: "text"; text: string } | { kind: "filled" | "placeholder"; text: string; token: string };

/**
 * Fills `[[token]]` markers from learner-provided values only. An empty value stays a visible
 * bracketed placeholder so nobody pastes an unfinished prompt without noticing. Pure.
 */
export function renderPrompt(
  prompt: LessonPrompt,
  lang: LessonLang,
  values: Readonly<Record<string, string | undefined>>,
  journey: LessonJourneyKey | null = null,
): { parts: PromptPart[]; text: string; missing: string[] } {
  const parts: PromptPart[] = [];
  const missing: string[] = [];
  const body = resolvePromptBody(prompt, journey)[lang];
  const re = /\[\[([a-z_]+)\]\]/g;
  let last = 0;
  for (const m of body.matchAll(re)) {
    const idx = m.index ?? 0;
    if (idx > last) parts.push({ kind: "text", text: body.slice(last, idx) });
    const token = m[1];
    const value = (values[token] ?? "").replace(/\s+/g, " ").trim();
    if (value) {
      parts.push({ kind: "filled", text: value, token });
    } else {
      const field = prompt.fields.find((f) => f.token === token);
      parts.push({ kind: "placeholder", text: `[${field ? field.placeholder[lang] : token}]`, token });
      if (!missing.includes(token)) missing.push(token);
    }
    last = idx + m[0].length;
  }
  if (last < body.length) parts.push({ kind: "text", text: body.slice(last) });
  return { parts, text: parts.map((p) => p.text).join(""), missing };
}
