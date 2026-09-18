/**
 * Gate G2 — code-owned AI Companion prompt registry (stage 1; a table later, same shape).
 *
 * Doctrine (Bible §12–§14): assistant-neutral — the learner pastes the prompt into whichever AI
 * assistant they prefer. Leonix calls no AI API and nothing the learner types leaves the browser.
 * Every prompt asks the assistant to ask questions first, forbids invention, separates assumptions
 * from facts, and ships with a privacy reminder and a verification line. "AI helps. You verify."
 *
 * A published prompt version is immutable: changing the text means a new `version`.
 */
import type { LessonJourneyKey, LessonLang, LessonPrompt } from "./types";

export const WHO_IS_YOUR_CUSTOMER_PROMPT: LessonPrompt = {
  promptKey: "who_is_your_customer",
  version: 1,
  title: { es: "Descubre a tu cliente con ayuda de tu IA", en: "Discover your customer with help from your AI" },
  body: {
    es: `Quiero entender mejor quién es mi cliente. Actúa como un mentor de negocios paciente y usa lenguaje sencillo.

Mi negocio: [[offer]]
Ciudad: [[city]]
Etapa: [[stage]]

Antes de responder, hazme de 5 a 7 preguntas, una a la vez, sobre lo que vendo y sobre las personas que ya me compraron o mostraron interés.

Después ayúdame a organizar 2 o 3 posibles perfiles de cliente usando solo lo que yo te diga.

No inventes datos sobre mis clientes ni sobre mi mercado.

Si supones algo, márcalo como suposición y dime cómo comprobarlo.`,
    en: `I want to better understand who my customer is. Act as a patient business mentor and use plain language.

My business: [[offer]]
City: [[city]]
Stage: [[stage]]

Before you answer, ask me 5 to 7 questions, one at a time, about what I sell and about the people who have already bought from me or shown interest.

Then help me organize 2 or 3 possible customer profiles using only what I tell you.

Do not invent facts about my customers or my market.

If you assume something, label it as an assumption and tell me how I could check it.`,
  },
  fields: [
    {
      token: "offer",
      label: { es: "Tu negocio o producto", en: "Your business or product" },
      placeholder: { es: "qué vendes", en: "what you sell" },
      prefillFrom: { kind: "activity_field", fieldKey: "offer" },
    },
    {
      token: "city",
      label: { es: "Tu ciudad", en: "Your city" },
      placeholder: { es: "ciudad", en: "city" },
    },
    {
      token: "stage",
      label: { es: "Tu etapa", en: "Your stage" },
      placeholder: { es: "idea / empezando / ya opero", en: "idea / getting started / already operating" },
      prefillFrom: { kind: "journey_stage" },
    },
  ],
  journeyStageLabels: {
    idea: { es: "tengo una idea y todavía no vendo", en: "I have an idea and I am not selling yet" },
    empezando: { es: "estoy empezando", en: "I am just getting started" },
    negocio: { es: "ya opero mi negocio", en: "I am already operating my business" },
  },
  whyItWorks: [
    { es: "Le das contexto: tu negocio, tu ciudad y tu etapa.", en: "You give it context: your business, your city, and your stage." },
    { es: "Le asignas un papel claro: mentor paciente, lenguaje sencillo.", en: "You give it a clear role: a patient mentor using plain language." },
    { es: "Pides preguntas primero, así responde con tu realidad y no con generalidades.", en: "You ask for questions first, so it works from your reality instead of generalities." },
    { es: "Le prohíbes inventar datos sobre tus clientes o tu mercado.", en: "You forbid it from inventing facts about your customers or your market." },
    { es: "Separas suposiciones de hechos, y pides cómo comprobar cada suposición.", en: "You separate assumptions from facts, and ask how to check each assumption." },
  ],
  customize: [
    { es: "Escribe qué vendes con tus propias palabras, tal como se lo dirías a un vecino.", en: "Describe what you sell in your own words, the way you would tell a neighbor." },
    { es: "Pon tu ciudad o zona: el cliente de un barrio no es el de otro.", en: "Add your city or area: the customer in one neighborhood is not the customer in another." },
    { es: "Di en qué etapa estás: una idea, empezando, o ya operando.", en: "Say what stage you are in: an idea, getting started, or already operating." },
    { es: "Agrega lo que ya sabes de quienes te compran o preguntan, sin datos personales.", en: "Add what you already know about the people who buy or ask, without personal details." },
  ],
  followUps: [
    { es: "¿Qué suposiciones hiciste? Enuméralas y dime cómo comprobar cada una.", en: "What assumptions did you make? List them and tell me how to check each one." },
    { es: "Dame 5 preguntas para hacerle a 3 clientes reales esta semana.", en: "Give me 5 questions to ask 3 real customers this week." },
    { es: "Resume mi cliente en una frase que pueda usar en mis mensajes.", en: "Summarize my customer in one sentence I can use in my messages." },
  ],
  privacy: {
    intro: { es: "Antes de pegar algo en una IA, quita los datos de personas reales. No pegues de tus clientes:", en: "Before you paste anything into an AI, remove real people's details. Do not paste your customers':" },
    never: [
      { es: "nombres completos", en: "full names" },
      { es: "números de teléfono", en: "phone numbers" },
      { es: "direcciones", en: "addresses" },
      { es: "información privada de cuentas", en: "private account information" },
    ],
  },
  verify: {
    es: "La IA ayuda. Tú verificas. Lo que te digan clientes reales vale más que cualquier suposición de una IA.",
    en: "AI helps. You verify. What real customers tell you outranks any guess an AI makes.",
  },
  consequential: false,
};

export const LEARNING_PROMPTS: Readonly<Record<string, LessonPrompt>> = {
  [WHO_IS_YOUR_CUSTOMER_PROMPT.promptKey]: WHO_IS_YOUR_CUSTOMER_PROMPT,
};

export function getLessonPrompt(promptKey: string): LessonPrompt | null {
  return LEARNING_PROMPTS[promptKey] ?? null;
}

export type PromptPart = { kind: "text"; text: string } | { kind: "filled" | "placeholder"; text: string; token: string };

/**
 * Fills `[[token]]` markers from learner-provided values only. An empty value stays a visible
 * bracketed placeholder so nobody pastes an unfinished prompt without noticing. Pure.
 */
export function renderPrompt(prompt: LessonPrompt, lang: LessonLang, values: Readonly<Record<string, string | undefined>>): { parts: PromptPart[]; text: string; missing: string[] } {
  const parts: PromptPart[] = [];
  const missing: string[] = [];
  const body = prompt.body[lang];
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

export function journeyStageValue(prompt: LessonPrompt, journey: LessonJourneyKey | null, lang: LessonLang): string {
  return journey && prompt.journeyStageLabels ? prompt.journeyStageLabels[journey][lang] : "";
}
