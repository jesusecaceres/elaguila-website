/**
 * Gate G4-I1 — AI template set for "Habla con clientes reales" (`customer_conversations`).
 * The AI prepares and debriefs; it NEVER stands in for a real person. Template B is a labelled
 * rehearsal: whatever the AI "customer" says is practice, not evidence. Stage-aware, auto-filled
 * locally from the learner's conversation plan. Assistant-neutral; no AI API.
 */
import { CITY_FIELD, CUSTOMER_FIELD, IDEA_FIELD, MENTOR, OPENER_WITH_IDEA, PRIVACY, STAGE_FIELD, STAGE_LABELS, activityField, both, composeStages, type Stage } from "../promptParts";
import type { L, LessonPrompt, LessonPromptField } from "../types";

const PLAN: L = {
  es: `Mi cliente, como lo entiendo hoy: [[customer]]
Lo que quiero aprender: [[learn]]
Con quién voy a hablar: [[who]]
Dónde y cómo los voy a encontrar: [[where]]
Mis preguntas: [[questions]]
Lo que me haría cambiar de opinión: [[change]]`,
  en: `My customer, as I understand them today: [[customer]]
What I want to learn: [[learn]]
Who I will talk to: [[who]]
Where and how I will find them: [[where]]
My questions: [[questions]]
What would change my mind: [[change]]`,
};

const PEOPLE: Record<Stage, L> = {
  neutral: { es: "Voy a hablar con 3 personas reales para comprobar lo que creo.", en: "I am going to talk with 3 real people to check what I believe." },
  idea: {
    es: "Voy a hablar con 3 personas que podrían ser mis clientes. No les voy a vender nada: quiero entender su situación antes de gastar dinero.",
    en: "I am going to talk with 3 people who could become my customers. I will not sell them anything: I want to understand their situation before I spend money.",
  },
  empezando: {
    es: "Voy a hablar con 3 personas: mis primeros compradores o personas que preguntaron y no compraron. Quiero entender qué los hizo decidir.",
    en: "I am going to talk with 3 people: my first buyers or people who asked and did not buy. I want to understand what made them decide.",
  },
  negocio: {
    es: "Voy a hablar con 3 personas: clientes frecuentes y, si puedo, alguien que dejó de venir. Quiero entender por qué se quedan y por qué se van.",
    en: "I am going to talk with 3 people: regular customers and, if I can, someone who stopped coming. I want to understand why people stay and why they leave.",
  },
};

/* TEMPLATE A — IMPROVE MY QUESTIONS */
const IMPROVE = composeStages((s) =>
  both(
    OPENER_WITH_IDEA[s],
    PEOPLE[s],
    { es: "Este es mi plan:", en: "This is my plan:" },
    PLAN,
    MENTOR,
    {
      es: `1. Revisa mis preguntas una por una. Marca las que sugieren la respuesta, las que en realidad son una venta disfrazada y las que preguntan por el futuro (“¿comprarías…?”) en lugar de por algo que ya pasó.
2. Propón una versión mejor de cada una, corta y en lenguaje de todos los días, que pregunte por hechos: la última vez que les pasó, qué hicieron, cuánto les costó.
3. Dime qué pregunta importante me falta para aprender lo que quiero aprender.
4. Recuérdame cómo escuchar: no interrumpir, no defender mi idea y anotar sus palabras exactas.`,
      en: `1. Review my questions one by one. Flag the ones that suggest the answer, the ones that are really a disguised sales pitch, and the ones that ask about the future (“would you buy…?”) instead of something that already happened.
2. Suggest a better version of each one, short and in everyday language, that asks about facts: the last time it happened, what they did, what it cost them.
3. Tell me which important question I am missing to learn what I want to learn.
4. Remind me how to listen: do not interrupt, do not defend my idea, and write down their exact words.`,
    },
    {
      es: "No inventes lo que estas personas van a contestar. Solo ellas lo saben.",
      en: "Do not invent what these people will answer. Only they know.",
    },
  ),
);

/* TEMPLATE B — REHEARSAL (practice only) */
const REHEARSE_ROLE: Record<Stage, L> = {
  neutral: { es: "Haz el papel de una persona común que podría ser mi cliente.", en: "Play an ordinary person who could be my customer." },
  idea: { es: "Haz el papel de una persona común que podría ser mi cliente y que nunca ha oído hablar de mi idea.", en: "Play an ordinary person who could be my customer and has never heard of my idea." },
  empezando: { es: "Haz el papel de una persona que preguntó por mi negocio y al final no compró.", en: "Play a person who asked about my business and in the end did not buy." },
  negocio: { es: "Haz el papel de un cliente que me compraba seguido y dejó de venir.", en: "Play a customer who used to buy from me often and stopped coming." },
};
const REHEARSE = composeStages((s) =>
  both(
    OPENER_WITH_IDEA[s],
    PEOPLE[s],
    { es: "ESTO ES SOLO UN ENSAYO. Quiero practicar cómo preguntar antes de hablar con personas reales. Este es mi plan:", en: "THIS IS ONLY A REHEARSAL. I want to practice how to ask before I talk with real people. This is my plan:" },
    PLAN,
    REHEARSE_ROLE[s],
    {
      es: `Reglas del ensayo:
1. Yo hago las preguntas, una a la vez. Tú contestas corto, como contesta la gente ocupada, y a veces con dudas o cambiando de tema.
2. No me facilites las cosas: si mi pregunta es confusa o suena a venta, reacciona como reaccionaría una persona real.
3. Cuando yo escriba “terminar”, sal del papel y dime qué preguntas funcionaron, cuáles sonaron a venta y cómo mejorarlas.`,
      en: `Rehearsal rules:
1. I ask the questions, one at a time. You answer briefly, the way busy people answer, and sometimes with doubts or by changing the subject.
2. Do not make it easy for me: if my question is confusing or sounds like a pitch, react the way a real person would.
3. When I type “finish”, step out of the role and tell me which questions worked, which sounded like selling, and how to improve them.`,
    },
    {
      es: "Importante: tus respuestas en este ensayo son inventadas. No son evidencia sobre mis clientes y no las voy a usar para decidir nada. Recuérdamelo al terminar.",
      en: "Important: your answers in this rehearsal are made up. They are not evidence about my customers and I will not use them to decide anything. Remind me of that when we finish.",
    },
  ),
);

/* TEMPLATE C — MAKE SENSE OF WHAT I HEARD */
const DEBRIEF_NEXT: Record<Stage, L> = {
  neutral: { es: "4. Dime qué le preguntaría a las siguientes personas para aclarar lo que quedó en duda.", en: "4. Tell me what I should ask the next people to clear up what is still in doubt." },
  idea: { es: "4. Dime si lo que escuché apoya, contradice o no dice nada sobre mi idea, y qué le preguntaría a las siguientes personas antes de gastar.", en: "4. Tell me whether what I heard supports, contradicts, or says nothing about my idea, and what I should ask the next people before I spend." },
  empezando: { es: "4. Dime qué cambiaría en mi oferta o en mi mensaje antes de lanzar, y qué necesito escuchar de más personas para estar seguro.", en: "4. Tell me what I would change in my offer or my message before I launch, and what I need to hear from more people to be sure." },
  negocio: { es: "4. Dime qué patrón se repite entre quienes se quedan y quienes se van, y qué debería revisar en mis ventas para confirmarlo.", en: "4. Tell me what pattern repeats among those who stay and those who leave, and what I should review in my sales to confirm it." },
};
const DEBRIEF = composeStages((s) =>
  both(
    OPENER_WITH_IDEA[s],
    { es: "Ya hablé con personas reales. Este era mi plan:", en: "I have now talked with real people. This was my plan:" },
    PLAN,
    {
      es: "Estas son mis notas de lo que dijeron, sin nombres ni datos personales:\n(pega aquí tus notas)",
      en: "These are my notes on what they said, without names or personal details:\n(paste your notes here)",
    },
    MENTOR,
    {
      es: `1. Separa lo que las personas DIJERON de lo que yo INTERPRETÉ. Si no está claro, pregúntame.
2. Señala las palabras o frases exactas que se repiten: son las que debería usar en mis mensajes.
3. Compara lo que escuché con lo que dije que me haría cambiar de opinión.
${DEBRIEF_NEXT[s].es}`,
      en: `1. Separate what people SAID from what I INTERPRETED. If it is not clear, ask me.
2. Point out the exact words or phrases that repeat: those are the ones I should use in my messages.
3. Compare what I heard with what I said would change my mind.
${DEBRIEF_NEXT[s].en}`,
    },
    {
      es: "Tres conversaciones son una señal, no una prueba. No saques conclusiones sobre “el mercado” ni agregues nada que no esté en mis notas.",
      en: "Three conversations are a signal, not proof. Do not draw conclusions about “the market” and do not add anything that is not in my notes.",
    },
  ),
);

const FIELDS: LessonPromptField[] = [
  activityField("learn", { es: "Lo que quieres aprender", en: "What you want to learn" }, { es: "qué quieres aprender", en: "what you want to learn" }),
  activityField("who", { es: "Con quién vas a hablar", en: "Who you will talk to" }, { es: "con quién vas a hablar", en: "who you will talk to" }),
  activityField("where", { es: "Dónde y cómo", en: "Where and how" }, { es: "dónde y cómo los encuentras", en: "where and how you find them" }),
  activityField("questions", { es: "Tus preguntas", en: "Your questions" }, { es: "tus preguntas", en: "your questions" }),
  activityField("change", { es: "Qué te haría cambiar de opinión", en: "What would change your mind" }, { es: "qué te haría cambiar de opinión", en: "what would change your mind" }),
  IDEA_FIELD,
  CUSTOMER_FIELD,
  CITY_FIELD,
  STAGE_FIELD,
];

const VERIFY: L = {
  es: "La IA ayuda. Tú verificas. Ensayar con una IA no cuenta como hablar con un cliente: la evidencia solo viene de personas reales.",
  en: "AI helps. You verify. Rehearsing with an AI does not count as talking to a customer: evidence only comes from real people.",
};

const base: Pick<LessonPrompt, "fields" | "journeyStageLabels" | "privacy" | "verify" | "consequential"> = {
  fields: FIELDS,
  journeyStageLabels: STAGE_LABELS,
  privacy: PRIVACY,
  verify: VERIFY,
  consequential: false,
};

export const CUSTOMER_CONVERSATIONS_PROMPTS: LessonPrompt[] = [
  {
    ...base,
    promptKey: "customer_conversations",
    version: 1,
    title: { es: "Mejora mis preguntas", en: "Improve my questions" },
    purpose: { es: "Para llegar a tus conversaciones con preguntas que descubren hechos, no cumplidos.", en: "To walk into your conversations with questions that uncover facts, not compliments." },
    body: IMPROVE.body,
    variants: IMPROVE.variants,
    whyItWorks: [
      { es: "Le das tu plan completo: qué quieres aprender, con quién y con qué preguntas.", en: "You give it your whole plan: what you want to learn, with whom, and with which questions." },
      { es: "Le pides detectar tres fallas concretas: preguntas que sugieren, que venden o que adivinan el futuro.", en: "You ask it to catch three specific flaws: questions that lead, that sell, or that guess the future." },
      { es: "Las personas recuerdan bien lo que ya hicieron y adivinan mal lo que harían.", en: "People remember what they already did well, and guess badly at what they would do." },
      { es: "Le prohíbes inventar las respuestas: esas solo las tienen las personas.", en: "You forbid it from inventing the answers: only the people have those." },
    ],
    customize: [
      { es: "Tu plan de “Tu turno” ya está incluido; si cambias algo allá, cambia aquí.", en: "Your plan from “Your turn” is already included; change something there and it changes here." },
      { es: "Escribe tu cliente en una frase; si ya hiciste “Quién es tu cliente”, usa esa.", en: "Write your customer in one sentence; if you already did “Who is your customer?”, use that one." },
      { es: "Describe a las personas por su situación (“vecina con dos hijos”), nunca por su nombre.", en: "Describe people by their situation (“a neighbor with two kids”), never by name." },
    ],
    followUps: [
      { es: "Acorta mis preguntas para que pueda decirlas en voz alta sin leer.", en: "Shorten my questions so I can say them out loud without reading." },
      { es: "¿Cómo pido 10 minutos de su tiempo sin que suene a que les voy a vender?", en: "How do I ask for 10 minutes of their time without it sounding like I am going to sell to them?" },
      { es: "Dame una hoja sencilla para tomar notas durante cada conversación.", en: "Give me a simple sheet for taking notes during each conversation." },
    ],
  },
  {
    ...base,
    promptKey: "customer_conversations_practice",
    version: 1,
    title: { es: "Ensaya conmigo (solo práctica)", en: "Rehearse with me (practice only)" },
    purpose: { es: "Para perder los nervios y pulir tus preguntas. El ensayo no reemplaza ninguna conversación real.", en: "To shake off the nerves and polish your questions. The rehearsal does not replace any real conversation." },
    body: REHEARSE.body,
    variants: REHEARSE.variants,
    whyItWorks: [
      { es: "Practicar en voz alta quita el miedo antes de la primera conversación real.", en: "Practicing out loud removes the fear before the first real conversation." },
      { es: "Le pides que no te la ponga fácil: así descubres qué preguntas suenan a venta.", en: "You ask it not to make it easy: that is how you find out which questions sound like selling." },
      { es: "Deja escrito que sus respuestas son inventadas y no son evidencia.", en: "It states in writing that its answers are made up and are not evidence." },
    ],
    customize: [],
    followUps: [],
  },
  {
    ...base,
    promptKey: "customer_conversations_debrief",
    version: 1,
    title: { es: "Ayúdame a entender lo que escuché", en: "Help me make sense of what I heard" },
    purpose: { es: "Para después de tus conversaciones: separar lo que dijeron de lo que tú querías oír.", en: "For after your conversations: separating what they said from what you wanted to hear." },
    body: DEBRIEF.body,
    variants: DEBRIEF.variants,
    whyItWorks: [
      { es: "Separa lo dicho de lo interpretado: ahí es donde más nos engañamos.", en: "It separates what was said from what was interpreted: that is where we fool ourselves most." },
      { es: "Compara lo que escuchaste con lo que tú mismo dijiste que te haría cambiar de opinión.", en: "It compares what you heard with what you yourself said would change your mind." },
      { es: "Le recuerda a la IA que tres conversaciones son una señal, no una prueba.", en: "It reminds the AI that three conversations are a signal, not proof." },
    ],
    customize: [],
    followUps: [],
  },
];
