/**
 * Gate G4-I1 — LessonPackage: "Habla con clientes reales" (lesson_key `customer_conversations`).
 * Matrix row 6 · CP1 · evergreen · all three pathways. Every Leonix lesson ends in "verify with
 * real people" — this lesson teaches how: ask about what already happened, listen, write down
 * their exact words. Activity `conversation_plan_builder` → a 3-conversation plan.
 *
 * "Panadería de Rosa" is an illustrative, invented example and is always labelled as such.
 */
import { LESSON_PACKAGE_SCHEMA_VERSION, type LessonPackage } from "../types";
import { CUSTOMER_CONVERSATIONS_AUDIO } from "./customerConversationsAudio";

export const CUSTOMER_CONVERSATIONS_PACKAGE: LessonPackage = {
  schemaVersion: LESSON_PACKAGE_SCHEMA_VERSION,
  lessonKey: "customer_conversations",
  source: "package",
  meta: {
    title: { es: "Habla con clientes reales", en: "Talk to real customers" },
    outcome: {
      es: "Al terminar tendrás un plan para hablar con 3 personas reales esta semana, con preguntas que descubren hechos y no cumplidos.",
      en: "By the end you will have a plan to talk with 3 real people this week, with questions that uncover facts and not compliments.",
    },
    readMinutes: 11,
    truthClass: "evergreen",
    consequential: false,
  },
  blocks: [
    {
      id: "hook",
      type: "hook",
      visualKey: "pitch_vs_ask",
      headline: { es: "Pregunta. No vendas.", en: "Ask. Don't pitch." },
      support: {
        es: "Cuando le cuentas tu idea a alguien, te regala un cumplido. Cuando le preguntas por su vida, te regala la verdad.",
        en: "When you tell someone your idea, they hand you a compliment. When you ask about their life, they hand you the truth.",
      },
      visualLabels: {
        pitch: { es: "“¿Verdad que mi idea es buena?”", en: "“Isn't my idea great?”" },
        pitchReply: { es: "“Sí, claro…”", en: "“Sure, of course…”" },
        pitchTag: { es: "Vender", en: "Pitching" },
        ask: { es: "“¿Cómo lo resolviste la última vez?”", en: "“How did you handle it last time?”" },
        askReply: { es: "“Uy, te cuento…”", en: "“Oh, let me tell you…”" },
        askTag: { es: "Preguntar", en: "Asking" },
      },
      textAlternative: {
        es: "Diagrama con dos conversaciones. Arriba, etiquetada “Vender”: una persona pregunta “¿Verdad que mi idea es buena?” y la otra contesta, por cortesía, “Sí, claro…”. Abajo, etiquetada “Preguntar” y resaltada en dorado: una persona pregunta “¿Cómo lo resolviste la última vez?” y la otra contesta “Uy, te cuento…”. La segunda conversación es la que enseña algo.",
        en: "Diagram with two conversations. On top, labelled “Pitching”: one person asks “Isn't my idea great?” and the other answers, out of politeness, “Sure, of course…”. Below, labelled “Asking” and highlighted in gold: one person asks “How did you handle it last time?” and the other answers “Oh, let me tell you…”. The second conversation is the one that teaches something.",
      },
    },
    {
      id: "outcomes",
      type: "outcomes",
      intro: { es: "Al terminar esta lección podrás:", en: "By the end of this lesson you will be able to:" },
      items: [
        { es: "Hacerle preguntas útiles a 3 personas reales sin venderles nada.", en: "Ask 3 real people useful questions without selling them anything." },
        { es: "Escuchar y anotar sus palabras exactas.", en: "Listen for, and write down, their exact words." },
        { es: "Ajustar lo que creías de tu cliente con lo que aprendiste.", en: "Update what you believed about your customer with what you learned." },
      ],
    },
    {
      id: "explain",
      type: "explain",
      title: { es: "Por qué los cumplidos no sirven", en: "Why compliments are useless" },
      chunks: [
        {
          heading: { es: "La gente es amable, y eso te confunde", en: "People are kind, and that misleads you" },
          body: {
            es: "Si le preguntas a tu tía “¿me comprarías?”, te va a decir que sí. No te miente: te quiere. Pero un “sí” de cortesía no paga la renta. Por eso no preguntes por tu idea. Pregunta por su vida.",
            en: "If you ask your aunt “would you buy from me?”, she will say yes. She is not lying: she loves you. But a polite “yes” does not pay the rent. So do not ask about your idea. Ask about their life.",
          },
        },
        {
          heading: { es: "El pasado es un hecho. El futuro es una opinión.", en: "The past is a fact. The future is an opinion." },
          body: {
            es: "“¿Comprarías…?” pide adivinar. “¿Qué hiciste la última vez que…?” pide recordar. Las personas recuerdan bien lo que hicieron y adivinan mal lo que harían. Pregunta por la última vez que les pasó, qué hicieron, cuánto les costó y qué fue lo más molesto.",
            en: "“Would you buy…?” asks them to guess. “What did you do the last time…?” asks them to remember. People remember what they did well and guess badly at what they would do. Ask about the last time it happened, what they did, what it cost them, and what was most annoying.",
          },
        },
        {
          heading: { es: "Tú escuchas. Ellos hablan.", en: "You listen. They talk." },
          body: {
            es: "En una buena conversación tú hablas poco. No interrumpas, no corrijas y no defiendas tu idea. Anota sus palabras exactas: son las que después vas a usar en tus mensajes, porque así es como ellos describen su problema.",
            en: "In a good conversation you speak very little. Do not interrupt, do not correct, and do not defend your idea. Write down their exact words: those are the ones you will later use in your messages, because that is how they describe their problem.",
          },
        },
        {
          heading: { es: "Tres conversaciones son una señal, no una prueba", en: "Three conversations are a signal, not proof" },
          body: {
            es: "No vas a “comprobar el mercado” con tres pláticas. Pero sí vas a descubrir si vas por buen camino, y a veces con una sola conversación basta para notar que tu suposición estaba equivocada. Eso, antes de gastar, vale oro.",
            en: "You will not “prove the market” with three chats. But you will find out whether you are on the right track, and sometimes a single conversation is enough to notice that your assumption was wrong. That, before you spend, is worth gold.",
          },
        },
      ],
      pullQuote: {
        es: "No busques que te digan que sí. Busca que te cuenten qué pasó.",
        en: "Do not look for a yes. Look for the story of what happened.",
      },
    },
    {
      id: "compare",
      type: "compare",
      title: { es: "Pregunta que vende contra pregunta que aprende", en: "A question that sells versus a question that learns" },
      weak: {
        label: { es: "Pregunta que vende", en: "A question that sells" },
        text: {
          es: "“Voy a hacer pasteles personalizados, bien ricos y a buen precio. ¿Me comprarías uno?”",
          en: "“I am going to make custom cakes, really tasty and well priced. Would you buy one?”",
        },
        why: {
          es: "Ya le dijiste qué contestar. Y le pides adivinar el futuro. Casi cualquiera dirá que sí.",
          en: "You already told them what to answer. And you are asking them to guess the future. Almost anyone will say yes.",
        },
      },
      strong: {
        label: { es: "Pregunta que aprende", en: "A question that learns" },
        text: {
          es: "“Cuéntame del último cumpleaños que organizaste en tu casa. ¿Cómo resolviste lo del pastel? ¿Qué fue lo más complicado?”",
          en: "“Tell me about the last birthday you organized at home. How did you handle the cake? What was the hardest part?”",
        },
        annotations: [
          {
            tag: { es: "Pasado", en: "Past" },
            fragment: { es: "último cumpleaños que organizaste", en: "last birthday you organized" },
            note: { es: "Algo que ya pasó: lo recuerda, no lo adivina.", en: "Something that already happened: they remember it, they do not guess." },
          },
          {
            tag: { es: "Qué hizo", en: "What they did" },
            fragment: { es: "¿Cómo resolviste lo del pastel?", en: "How did you handle the cake?" },
            note: { es: "Descubre su alternativa de hoy, sin mencionar tu negocio.", en: "It uncovers today's alternative, without mentioning your business." },
          },
          {
            tag: { es: "Dónde duele", en: "Where it hurts" },
            fragment: { es: "¿Qué fue lo más complicado?", en: "What was the hardest part?" },
            note: { es: "Deja que la persona nombre el problema con sus palabras.", en: "It lets the person name the problem in their own words." },
          },
        ],
      },
    },
    {
      id: "example",
      type: "example",
      label: { es: "Ejemplo ilustrativo", en: "Illustrative example" },
      business: { es: "Panadería de Rosa", en: "Rosa's Bakery" },
      variants: [
        {
          journey: "idea",
          story: {
            es: "Rosa todavía no vende. Cree que las familias de su vecindario necesitan pasteles de cumpleaños personalizados. En lugar de preguntar “¿me comprarías?”, habló con tres vecinas y les pidió que le contaran el último cumpleaños que organizaron. Dos compraron el pastel en el supermercado “porque ya no había tiempo”. Una lo encargó con una semana de anticipación y pagó más. Ninguna mencionó el sabor. Las tres mencionaron las prisas.",
            en: "Rosa is not selling yet. She believes the families in her neighborhood need custom birthday cakes. Instead of asking “would you buy from me?”, she talked with three neighbors and asked them to tell her about the last birthday they organized. Two bought the cake at the supermarket “because there was no time left.” One ordered it a week ahead and paid more. None of them mentioned flavor. All three mentioned being rushed.",
          },
        },
        {
          journey: "empezando",
          story: {
            es: "Rosa lleva un mes vendiendo. Habló con dos clientas que sí compraron y con una persona que preguntó el precio y desapareció. A las que compraron les preguntó qué estaban buscando ese día y qué otra cosa consideraron. A la que no compró le preguntó, sin reclamar, qué terminó haciendo. Respondió: “lo necesitaba para el día siguiente y me dijiste tres días”. Rosa pensaba que el problema era el precio. Era el tiempo.",
            en: "Rosa has been selling for a month. She talked with two customers who did buy and with one person who asked the price and disappeared. She asked the buyers what they were looking for that day and what else they considered. She asked the one who did not buy, without any reproach, what she ended up doing. The answer: “I needed it for the next day and you said three days.” Rosa thought the problem was price. It was time.",
          },
        },
        {
          journey: "negocio",
          story: {
            es: "Rosa lleva tres años vendiendo. Habló con dos clientas de siempre y con una que dejó de pedirle. A las de siempre les preguntó por qué regresan: “porque cumples la fecha”. A la que se fue le preguntó, con curiosidad y sin reclamos, qué hace ahora: encarga por una aplicación porque puede pedir a las once de la noche. Rosa no había perdido por sabor ni por precio; había perdido por la forma de pedir.",
            en: "Rosa has been selling for three years. She talked with two regulars and with one customer who stopped ordering. She asked the regulars why they come back: “because you deliver on the date.” She asked the one who left, with curiosity and no reproach, what she does now: she orders through an app because she can order at eleven at night. Rosa had not lost on flavor or price; she had lost on how people order.",
          },
        },
        {
          story: {
            es: "Rosa vende pasteles y cree que su cliente son las familias de su vecindario. En lugar de preguntar “¿me comprarías?”, habló con tres vecinas y les pidió que le contaran el último cumpleaños que organizaron. Dos compraron el pastel en el supermercado “porque ya no había tiempo”. Una lo encargó con una semana de anticipación y pagó más. Ninguna mencionó el sabor. Las tres mencionaron las prisas.",
            en: "Rosa sells cakes and believes her customer is the families in her neighborhood. Instead of asking “would you buy from me?”, she talked with three neighbors and asked them to tell her about the last birthday they organized. Two bought the cake at the supermarket “because there was no time left.” One ordered it a week ahead and paid more. None of them mentioned flavor. All three mentioned being rushed.",
          },
        },
      ],
      takeaway: {
        es: "Rosa no salió con tres “sí”. Salió con algo mejor: las palabras exactas de su cliente y una suposición corregida.",
        en: "Rosa did not walk away with three yeses. She walked away with something better: her customer's exact words and a corrected assumption.",
      },
    },
    {
      id: "steps",
      type: "steps",
      title: { es: "Cómo llevar la conversación", en: "How to run the conversation" },
      items: [
        {
          es: "Pide permiso y poco tiempo: “Estoy aprendiendo sobre cómo la gente resuelve esto. ¿Me regalas 10 minutos? No te voy a vender nada.”",
          en: "Ask permission and for little time: “I am learning how people handle this. Can I have 10 minutes? I am not going to sell you anything.”",
        },
        {
          es: "Empieza por la última vez que les pasó. Deja que cuenten la historia completa.",
          en: "Start with the last time it happened to them. Let them tell the whole story.",
        },
        {
          es: "Pregunta qué hicieron, qué les costó y qué fue lo más molesto. Si dicen algo interesante, pregunta “¿y por qué?”.",
          en: "Ask what they did, what it cost them, and what was most annoying. If they say something interesting, ask “and why was that?”",
        },
        {
          es: "No expliques tu idea. Si te preguntan, di que todavía estás aprendiendo y que con gusto les cuentas después.",
          en: "Do not explain your idea. If they ask, say you are still learning and will gladly tell them later.",
        },
        {
          es: "Al terminar, agradece y anota de inmediato sus palabras exactas. No anotes nombres ni datos personales: basta con “vecina con dos hijos”.",
          en: "When you finish, thank them and immediately write down their exact words. Do not record names or personal details: “a neighbor with two kids” is enough.",
        },
      ],
    },
    {
      id: "activity",
      type: "activity",
      activityKey: "conversation_plan_builder",
      title: { es: "Arma tu plan de 3 conversaciones", en: "Build your 3-conversation plan" },
      intro: {
        es: "Cinco respuestas cortas y sales con un plan para esta semana. Describe a las personas por su situación, nunca por su nombre. El plan se arma solo con lo que tú escribes.",
        en: "Five short answers and you leave with a plan for this week. Describe people by their situation, never by name. The plan is built only from what you type.",
      },
      estimatedMinutes: 8,
      fields: [
        {
          key: "learn",
          label: { es: "¿Qué quieres aprender?", en: "What do you want to learn?" },
          placeholder: { es: "p. ej. cómo resuelven hoy el pastel de cumpleaños", en: "e.g. how they handle the birthday cake today" },
        },
        {
          key: "who",
          label: { es: "¿Con qué 3 personas vas a hablar? (sin nombres)", en: "Which 3 people will you talk to? (no names)" },
          placeholder: { es: "p. ej. dos vecinas con hijos chicos y una compañera de trabajo", en: "e.g. two neighbors with young kids and a coworker" },
        },
        {
          key: "where",
          label: { es: "¿Dónde y cómo las vas a encontrar?", en: "Where and how will you find them?" },
          placeholder: { es: "p. ej. a la salida de la escuela y por mensaje", en: "e.g. at school pickup and by text message" },
        },
        {
          key: "questions",
          label: { es: "Tus 3 a 5 preguntas (sobre lo que ya pasó, no sobre tu idea)", en: "Your 3 to 5 questions (about what already happened, not about your idea)" },
          placeholder: {
            es: "p. ej. ¿Cómo resolviste el pastel la última vez?\n¿Qué fue lo más complicado?\n¿Cuánto terminaste gastando?",
            en: "e.g. How did you handle the cake last time?\nWhat was the hardest part?\nHow much did you end up spending?",
          },
          multiline: true,
        },
        {
          key: "change",
          label: { es: "¿Qué tendrías que escuchar para cambiar de opinión?", en: "What would you have to hear to change your mind?" },
          placeholder: { es: "p. ej. que a nadie le importa que sea personalizado", en: "e.g. that nobody cares whether it is custom" },
        },
      ],
      result: {
        label: { es: "Tu plan de conversaciones", en: "Your conversation plan" },
        hint: { es: "Se arma solo con lo que tú escribes. Llévalo en tu teléfono o imprímelo.", en: "It is built only from what you type. Carry it on your phone or print it." },
        sections: [
          { label: { es: "Quiero aprender", en: "I want to learn" }, fieldKeys: ["learn"] },
          { label: { es: "Voy a hablar con", en: "I will talk with" }, fieldKeys: ["who"] },
          { label: { es: "Dónde y cómo", en: "Where and how" }, fieldKeys: ["where"] },
          { label: { es: "Mis preguntas", en: "My questions" }, fieldKeys: ["questions"] },
          { label: { es: "Cambiaría de opinión si escucho", en: "I would change my mind if I hear" }, fieldKeys: ["change"] },
        ],
        copyLabel: { es: "Copiar mi plan", en: "Copy my plan" },
        copiedLabel: { es: "Plan copiado", en: "Plan copied" },
        printLabel: { es: "Mi plan de conversaciones", en: "My conversation plan" },
      },
      resultBridge: {
        title: { es: "¿Y ahora qué hago con esto?", en: "What do I do with this now?" },
        lead: {
          es: "Este es tu plan para salir a escuchar. No es una encuesta ni un guion de ventas.",
          en: "This is your plan to go out and listen. It is not a survey and it is not a sales script.",
        },
        points: [
          { es: "Ponle fecha: tres conversaciones de 10 minutos caben en una semana.", en: "Put a date on it: three 10-minute conversations fit in one week." },
          {
            es: "Decidir de antemano qué te haría cambiar de opinión te protege de oír solo lo que quieres oír.",
            en: "Deciding in advance what would change your mind protects you from hearing only what you want to hear.",
          },
          {
            es: "Después de cada plática, anota sus palabras exactas y vuelve a tu frase de cliente para ajustarla.",
            en: "After each chat, write down their exact words and go back to your customer sentence to adjust it.",
          },
        ],
        carryForward: {
          es: "Tu plan ya quedó listo como contexto para las conversaciones con tu IA, aquí abajo: para mejorar tus preguntas, ensayar y entender lo que escuches.",
          en: "Your plan is now ready as context for the AI conversations just below: to improve your questions, rehearse, and make sense of what you hear.",
        },
        cta: { es: "Prepararme con mi IA", en: "Prepare with my AI" },
      },
    },
    {
      id: "ask-ai",
      type: "ai_prompt",
      promptKey: "customer_conversations",
      moreTemplateKeys: ["customer_conversations_practice", "customer_conversations_debrief"],
      title: { es: "Prepárate con tu IA. La conversación real es tuya.", en: "Prepare with AI. The real conversation is yours." },
      intro: {
        es: "Una IA puede mejorar tus preguntas, ayudarte a ensayar y a ordenar tus notas. Lo que no puede hacer es contestar por tus clientes: lo que invente en un ensayo no es evidencia. Completa lo que falte, copia y pega en el asistente de IA que tú prefieras.",
        en: "An AI can improve your questions, help you rehearse, and help you organize your notes. What it cannot do is answer for your customers: whatever it makes up in a rehearsal is not evidence. Fill in what is missing, copy, and paste into whichever AI assistant you prefer.",
      },
    },
    {
      id: "mistakes",
      type: "mistakes",
      items: [
        {
          mistake: { es: "Contar tu idea primero y preguntar después.", en: "Explaining your idea first and asking afterwards." },
          instead: {
            es: "Pregunta primero por su experiencia. Si quieres contar tu idea, hazlo al final, cuando ya aprendiste lo que necesitabas.",
            en: "Ask about their experience first. If you want to share your idea, do it at the end, once you have learned what you needed.",
          },
        },
        {
          mistake: { es: "Hablar solo con familia y amigos que te quieren.", en: "Talking only with family and friends who love you." },
          instead: {
            es: "Busca al menos a una persona que no tenga motivos para quedar bien contigo.",
            en: "Find at least one person who has no reason to be nice to you.",
          },
        },
        {
          mistake: { es: "Tomar un “qué buena idea” como evidencia.", en: "Taking “what a great idea” as evidence." },
          instead: {
            es: "La evidencia es lo que ya hicieron: lo que pagaron, el tiempo que perdieron, lo que intentaron.",
            en: "Evidence is what they already did: what they paid, the time they lost, what they tried.",
          },
        },
      ],
    },
    { id: "glossary", type: "glossary", resourceKeys: ["glossary_target_customer", "glossary_lead"] },
    {
      id: "checklist",
      type: "checklist",
      title: { es: "Antes de seguir, confirma", en: "Before you move on, confirm" },
      items: [
        { key: "people", text: { es: "Sé con qué 3 personas voy a hablar y cuándo.", en: "I know which 3 people I will talk to and when." } },
        { key: "past", text: { es: "Mis preguntas son sobre lo que ya pasó, no sobre mi idea.", en: "My questions are about what already happened, not about my idea." } },
        { key: "change", text: { es: "Decidí de antemano qué me haría cambiar de opinión.", en: "I decided in advance what would change my mind." } },
        { key: "notes", text: { es: "Voy a anotar sus palabras exactas, sin nombres ni datos personales.", en: "I will write down their exact words, without names or personal details." } },
      ],
    },
    {
      id: "verify",
      type: "verify",
      title: { es: "Esta lección ES la verificación", en: "This lesson IS the verification" },
      statement: {
        es: "Todo lo que armes en el Centro de Aprendizaje es una suposición hasta que lo compares con lo que dicen y hacen personas reales. Ensayar con una IA no cuenta como hablar con un cliente.",
        en: "Everything you build in the Learning Center is an assumption until you compare it with what real people say and do. Rehearsing with an AI does not count as talking to a customer.",
      },
      steps: [
        { es: "Habla con 3 personas reales esta semana.", en: "Talk with 3 real people this week." },
        { es: "Compara lo que escuchaste con lo que dijiste que te haría cambiar de opinión.", en: "Compare what you heard with what you said would change your mind." },
        { es: "Ajusta tu frase de cliente y tu frase del problema con sus palabras.", en: "Adjust your customer sentence and your problem sentence with their words." },
      ],
      doctrine: { es: "La IA ayuda. Tú verificas.", en: "AI helps. You verify." },
    },
    {
      id: "recap",
      type: "recap",
      points: [
        { es: "Pregunta, no vendas: los cumplidos no son evidencia.", en: "Ask, don't pitch: compliments are not evidence." },
        { es: "Pregunta por lo que ya pasó. El pasado es un hecho; el futuro es una opinión.", en: "Ask about what already happened. The past is a fact; the future is an opinion." },
        { es: "Escucha, anota sus palabras exactas y decide de antemano qué te haría cambiar de opinión.", en: "Listen, write down their exact words, and decide in advance what would change your mind." },
      ],
    },
  ],
  audio: CUSTOMER_CONVERSATIONS_AUDIO,
};
