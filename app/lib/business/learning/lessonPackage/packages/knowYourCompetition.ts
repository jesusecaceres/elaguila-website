/**
 * Gate G4-I1 — LessonPackage: "Conoce a tu competencia" (lesson_key `know_your_competition`).
 * Matrix row 7 · CP1 · evergreen · all three pathways. Competition is every alternative the
 * customer has today — including "do nothing" and "do it myself". Activity `alternatives_grid` →
 * a comparison snapshot built from the learner's OWN observations. Research stays public, current
 * and honest: no scraping, no deception, no copying; an AI must never be trusted for competitor facts.
 *
 * "Lavandería móvil de Marco" is an illustrative, invented example and is always labelled as such.
 */
import { LESSON_PACKAGE_SCHEMA_VERSION, type LessonPackage } from "../types";
import { KNOW_YOUR_COMPETITION_AUDIO } from "./knowYourCompetitionAudio";

export const KNOW_YOUR_COMPETITION_PACKAGE: LessonPackage = {
  schemaVersion: LESSON_PACKAGE_SCHEMA_VERSION,
  lessonKey: "know_your_competition",
  source: "package",
  meta: {
    title: { es: "Conoce a tu competencia", en: "Know your competition" },
    outcome: {
      es: "Al terminar tendrás una comparación honesta de las alternativas que tu cliente ya usa hoy, y una pista de dónde puedes servir claramente mejor.",
      en: "By the end you will have an honest comparison of the alternatives your customer already uses today, and a clue about where you can serve clearly better.",
    },
    readMinutes: 11,
    truthClass: "evergreen",
    consequential: false,
  },
  blocks: [
    {
      id: "hook",
      type: "hook",
      visualKey: "alternatives_fork",
      headline: { es: "Tu cliente ya resuelve esto sin ti.", en: "Your customer already solves this without you." },
      support: {
        es: "Tu competencia no es solo el negocio de enfrente. Es todo lo que tu cliente hace hoy en lugar de comprarte, incluso no hacer nada.",
        en: "Your competition is not only the business across the street. It is everything your customer does today instead of buying from you, including doing nothing.",
      },
      visualLabels: {
        customer: { es: "Tu cliente", en: "Your customer" },
        pathA: { es: "Otro negocio", en: "Another business" },
        pathB: { es: "Hacerlo uno mismo", en: "Do it yourself" },
        pathC: { es: "Un familiar o conocido", en: "A relative or friend" },
        pathD: { es: "No hacer nada", en: "Do nothing" },
        pathYou: { es: "Tú", en: "You" },
        youTag: { es: "¿Por qué este camino?", en: "Why this path?" },
      },
      textAlternative: {
        es: "Diagrama: tu cliente parado frente a cinco caminos. Cuatro ya existen hoy: “Otro negocio”, “Hacerlo uno mismo”, “Un familiar o conocido” y “No hacer nada”. El quinto camino eres “Tú”, resaltado en dorado con la pregunta “¿Por qué este camino?”. Para que ese camino valga la pena, tiene que servirles mejor en algo que ya les importa.",
        en: "Diagram: your customer standing in front of five paths. Four already exist today: “Another business”, “Do it yourself”, “A relative or friend”, and “Do nothing”. The fifth path is “You”, highlighted in gold with the question “Why this path?”. For that path to be worth taking, it has to serve them better at something that already matters to them.",
      },
    },
    {
      id: "outcomes",
      type: "outcomes",
      intro: { es: "Al terminar esta lección podrás:", en: "By the end of this lesson you will be able to:" },
      items: [
        { es: "Enumerar las alternativas reales de tu cliente, incluidas “no hacer nada” y “hacerlo uno mismo”.", en: "List your customer's real alternatives, including “do nothing” and “do it yourself.”" },
        { es: "Compararlas en lo que a tu cliente le importa, no en lo que te importa a ti.", en: "Compare them on what your customer cares about, not on what you care about." },
        { es: "Encontrar un espacio donde puedes ser mejor, sin copiar ni hablar mal de nadie.", en: "Find a space where you can be better, without copying or bad-mouthing anyone." },
      ],
    },
    {
      id: "explain",
      type: "explain",
      title: { es: "Competencia es todo lo que tu cliente usa hoy", en: "Competition is everything your customer uses today" },
      chunks: [
        {
          heading: { es: "“No tengo competencia” casi nunca es verdad", en: "“I have no competition” is almost never true" },
          body: {
            es: "Si nadie más vende lo tuyo, tu cliente igual resuelve el problema de alguna forma: lo hace él mismo, se lo pide a un familiar, usa algo parecido o se aguanta. Esa costumbre es la alternativa que ya tiene, y a veces es la más difícil de servir mejor, porque es gratis y ya la conoce.",
            en: "If nobody else sells what you sell, your customer still solves the problem somehow: they do it themselves, ask a relative, use something similar, or put up with it. That habit is the alternative they already have, and sometimes it is the hardest to serve better than, because it is free and already familiar.",
          },
        },
        {
          heading: { es: "Compara en lo que al cliente le importa", en: "Compare on what the customer cares about" },
          body: {
            es: "Es fácil comparar en lo que tú haces bien. Lo útil es comparar en lo que tu cliente valora al elegir: precio, comodidad, confianza, rapidez, cercanía. Si no sabes qué le importa más, todavía no toca investigar a la competencia: toca hablar con clientes.",
            en: "It is easy to compare on what you do well. What is useful is comparing on what your customer values when choosing: price, convenience, trust, speed, closeness. If you do not know what matters most to them, it is not yet time to research the competition: it is time to talk to customers.",
          },
        },
        {
          heading: { es: "Investiga como cliente honesto", en: "Research like an honest customer" },
          body: {
            es: "Usa solo lo que cualquier persona puede ver: visita, observa, lee sus precios y horarios públicos, revisa lo que el propio negocio publica y pregunta a tus clientes qué otras opciones usan. No engañes a nadie, no te hagas pasar por cliente para sacar información privada y no copies. La información cambia: anota la fecha de lo que viste.",
            en: "Use only what anyone can see: visit, observe, read their public prices and hours, look at what the business itself publishes, and ask your customers what other options they use. Do not deceive anyone, do not pose as a customer to extract private information, and do not copy. Information changes: write down the date of what you saw.",
          },
        },
        {
          heading: { es: "Busca tu espacio, no una pelea", en: "Look for your space, not a fight" },
          body: {
            es: "No necesitas ser mejor en todo. Necesitas ser claramente mejor en algo que a tu cliente le importa y que las alternativas no le dan. Tu comparación es una foto de hoy, no un veredicto: revísala cada cierto tiempo.",
            en: "You do not need to be better at everything. You need to be clearly better at something your customer cares about and the alternatives do not give them. Your comparison is a snapshot of today, not a verdict: revisit it from time to time.",
          },
        },
      ],
      pullQuote: {
        es: "La alternativa más fuerte suele ser la costumbre de tu cliente.",
        en: "The strongest alternative is often your customer's habit.",
      },
    },
    {
      id: "example",
      type: "example",
      label: { es: "Ejemplo ilustrativo", en: "Illustrative example" },
      business: { es: "Lavandería móvil de Marco", en: "Marco's Mobile Laundry" },
      variants: [
        {
          journey: "idea",
          story: {
            es: "Marco pensaba que no tenía competencia: “nadie más recoge la ropa a domicilio en mi zona”. Antes de gastar, hizo una lista de lo que sus posibles clientas, enfermeras con turnos largos, hacen hoy: ir a la lavandería de monedas en su día libre, lavar en casa de un familiar, o usar la lavadora del edificio a medianoche. Visitó la lavandería un domingo: barata, pero llena y con dos horas de espera. Su espacio no era el precio. Era devolverles el día libre.",
            en: "Marco thought he had no competition: “nobody else picks up laundry at home in my area.” Before spending, he listed what his possible customers, nurses on long shifts, do today: go to the coin laundromat on their day off, do laundry at a relative's house, or use the building's washer at midnight. He visited the laundromat on a Sunday: cheap, but crowded, with a two-hour wait. His space was not price. It was giving them their day off back.",
          },
        },
        {
          journey: "empezando",
          story: {
            es: "Marco está por lanzar y necesita fijar su precio. Visitó las dos lavanderías cercanas a su zona y anotó, con fecha, lo que cualquiera puede ver: precios en la pared, horarios, tiempo de espera. Notó que ninguna recoge ni entrega. No copió sus precios: entendió que la alternativa era “barato, pero te cuesta tu domingo”, y armó su mensaje alrededor de eso.",
            en: "Marco is about to launch and needs to set his price. He visited the two laundromats near his area and wrote down, with the date, what anyone can see: prices on the wall, hours, waiting time. He noticed that neither picks up nor delivers. He did not copy their prices: he understood the alternative was “cheap, but it costs you your Sunday,” and built his message around that.",
          },
        },
        {
          journey: "negocio",
          story: {
            es: "Marco lleva dos años operando y notó que algunas clientas dejaron de pedir. En lugar de suponer, les preguntó a sus clientas actuales qué otra opción usan cuando no lo llaman. La respuesta lo sorprendió: no era otra lavandería, era la lavadora nueva que instalaron en su edificio. Su competencia había cambiado, y no era un negocio. Ajustó su oferta hacia lo que la lavadora no hace: planchado y ropa de cama.",
            en: "Marco has been operating for two years and noticed some customers stopped ordering. Instead of guessing, he asked his current customers what other option they use when they do not call him. The answer surprised him: it was not another laundry, it was the new washer installed in their building. His competition had changed, and it was not a business. He adjusted his offer toward what the washer does not do: ironing and bedding.",
          },
        },
        {
          story: {
            es: "Marco pensaba que no tenía competencia: “nadie más recoge la ropa a domicilio en mi zona”. Entonces hizo una lista de lo que sus clientas, enfermeras con turnos largos, hacen hoy: ir a la lavandería de monedas en su día libre, lavar en casa de un familiar, o usar la lavadora del edificio a medianoche. Visitó la lavandería un domingo: barata, pero llena y con dos horas de espera. Su espacio no era el precio. Era devolverles el día libre.",
            en: "Marco thought he had no competition: “nobody else picks up laundry at home in my area.” Then he listed what his customers, nurses on long shifts, do today: go to the coin laundromat on their day off, do laundry at a relative's house, or use the building's washer at midnight. He visited the laundromat on a Sunday: cheap, but crowded, with a two-hour wait. His space was not price. It was giving them their day off back.",
          },
        },
      ],
      takeaway: {
        es: "Marco no encontró un enemigo. Encontró lo que sus clientas ya soportan, y ahí vio cómo podía servirlas mejor.",
        en: "Marco did not find an enemy. He found what his customers already put up with, and there he saw how he could serve them better.",
      },
    },
    {
      id: "model",
      type: "visual_model",
      visualKey: "focus_progression",
      title: { es: "De “no tengo competencia” a tu espacio", en: "From “I have no competition” to your space" },
      steps: [
        {
          label: { es: "Enumera", en: "List" },
          note: { es: "Todo lo que tu cliente usa hoy, incluidas “no hacer nada” y “hacerlo uno mismo”.", en: "Everything your customer uses today, including “do nothing” and “do it yourself.”" },
        },
        {
          label: { es: "Compara", en: "Compare" },
          note: { es: "En lo que al cliente le importa: precio, comodidad, confianza. Con lo que tú mismo observaste.", en: "On what the customer cares about: price, convenience, trust. With what you observed yourself." },
        },
        {
          label: { es: "Encuentra tu espacio", en: "Find your space" },
          note: { es: "Algo que le importa a tu cliente y que las alternativas no le dan.", en: "Something your customer cares about that the alternatives do not give them." },
        },
      ],
      caption: {
        es: "Es una foto de hoy. Las alternativas cambian; revisa tu comparación cada cierto tiempo.",
        en: "It is a snapshot of today. Alternatives change; revisit your comparison from time to time.",
      },
      textAlternative: {
        es: "Progresión de tres pasos: “Enumera” las alternativas, “Compara” en lo que al cliente le importa y “Encuentra tu espacio”.",
        en: "Three-step progression: “List” the alternatives, “Compare” on what the customer cares about, and “Find your space”.",
      },
    },
    {
      id: "activity",
      type: "activity",
      activityKey: "alternatives_grid",
      title: { es: "Arma tu comparación de alternativas", en: "Build your alternatives comparison" },
      intro: {
        es: "Escribe solo lo que tú has visto o lo que te han contado tus clientes. Si no sabes algo, escribe “por averiguar”: eso también es un resultado. Al menos una alternativa debe ser “no hacer nada” o “hacerlo uno mismo”.",
        en: "Write only what you have seen yourself or what your customers have told you. If you do not know something, write “to find out”: that is a result too. At least one alternative should be “do nothing” or “do it yourself.”",
      },
      estimatedMinutes: 10,
      fields: [
        {
          key: "cares",
          label: { es: "¿Qué le importa más a tu cliente al elegir?", en: "What does your customer care about most when choosing?" },
          placeholder: { es: "p. ej. no perder su día libre; confianza con su ropa", en: "e.g. not losing their day off; trust with their clothes" },
        },
        {
          key: "alt_a",
          label: { es: "Alternativa 1: ¿qué usa hoy?", en: "Alternative 1: what do they use today?" },
          placeholder: { es: "p. ej. lavandería de monedas del barrio", en: "e.g. the neighborhood coin laundromat" },
          blankLabel: { es: "alternativa 1", en: "alternative 1" },
        },
        {
          key: "alt_a_notes",
          label: { es: "Lo que observaste: precio, comodidad, confianza, qué hace bien", en: "What you observed: price, convenience, trust, what it does well" },
          placeholder: { es: "p. ej. barata; llena los domingos; 2 horas de espera", en: "e.g. cheap; crowded on Sundays; 2-hour wait" },
          multiline: true,
          blankLabel: { es: "lo que observaste de la alternativa 1", en: "what you observed about alternative 1" },
        },
        {
          key: "alt_b",
          label: { es: "Alternativa 2", en: "Alternative 2" },
          placeholder: { es: "p. ej. lavar en casa de un familiar", en: "e.g. doing laundry at a relative's house" },
          blankLabel: { es: "alternativa 2", en: "alternative 2" },
        },
        {
          key: "alt_b_notes",
          label: { es: "Lo que observaste de la alternativa 2", en: "What you observed about alternative 2" },
          placeholder: { es: "p. ej. gratis; depende de la visita; incómodo pedirlo", en: "e.g. free; depends on visiting; awkward to ask" },
          multiline: true,
          blankLabel: { es: "lo que observaste de la alternativa 2", en: "what you observed about alternative 2" },
        },
        {
          key: "alt_c",
          label: { es: "Alternativa 3 (¿no hacer nada? ¿hacerlo uno mismo?)", en: "Alternative 3 (do nothing? do it yourself?)" },
          placeholder: { es: "p. ej. acumular ropa y lavar a medianoche", en: "e.g. piling up laundry and washing at midnight" },
          blankLabel: { es: "alternativa 3", en: "alternative 3" },
        },
        {
          key: "alt_c_notes",
          label: { es: "Lo que observaste de la alternativa 3", en: "What you observed about alternative 3" },
          placeholder: { es: "p. ej. no cuesta dinero; cuesta sueño y descanso", en: "e.g. costs no money; costs sleep and rest" },
          multiline: true,
          blankLabel: { es: "lo que observaste de la alternativa 3", en: "what you observed about alternative 3" },
        },
        {
          key: "gap",
          label: { es: "¿Dónde podrías ser claramente mejor para tu cliente?", en: "Where could you be clearly better for your customer?" },
          placeholder: { es: "p. ej. recoger y entregar en su horario", en: "e.g. pickup and delivery on their schedule" },
          blankLabel: { es: "dónde podrías ser mejor", en: "where you could be better" },
        },
      ],
      result: {
        label: { es: "Tu comparación de alternativas", en: "Your alternatives comparison" },
        hint: { es: "Se arma solo con lo que tú escribes. Es una foto de hoy: ponle fecha.", en: "It is built only from what you type. It is a snapshot of today: date it." },
        sections: [
          { label: { es: "Lo que más le importa a mi cliente", en: "What my customer cares about most" }, fieldKeys: ["cares"] },
          { label: { es: "Alternativa 1", en: "Alternative 1" }, fieldKeys: ["alt_a", "alt_a_notes"] },
          { label: { es: "Alternativa 2", en: "Alternative 2" }, fieldKeys: ["alt_b", "alt_b_notes"] },
          { label: { es: "Alternativa 3", en: "Alternative 3" }, fieldKeys: ["alt_c", "alt_c_notes"] },
          { label: { es: "Donde podría ser claramente mejor", en: "Where I could be clearly better" }, fieldKeys: ["gap"] },
        ],
        copyLabel: { es: "Copiar mi comparación", en: "Copy my comparison" },
        copiedLabel: { es: "Comparación copiada", en: "Comparison copied" },
        printLabel: { es: "Mi comparación de alternativas", en: "My alternatives comparison" },
      },
      resultBridge: {
        title: { es: "¿Y ahora qué hago con esto?", en: "What do I do with this now?" },
        lead: {
          es: "Esta comparación es una foto de hoy, hecha con tus propias observaciones. No es un veredicto.",
          en: "This comparison is a snapshot of today, made from your own observations. It is not a verdict.",
        },
        points: [
          { es: "Te muestra dónde puedes ser claramente mejor para TU cliente, no para todos.", en: "It shows you where you can be clearly better for YOUR customer, not for everyone." },
          {
            es: "Lo que marcaste “por averiguar” es tu lista de investigación: visita, observa y pregunta a clientes.",
            en: "Whatever you marked “to find out” is your research list: visit, observe, and ask customers.",
          },
          {
            es: "Es la base de tu siguiente paso: decir con claridad qué te hace diferente.",
            en: "It is the basis of your next step: stating clearly what makes you different.",
          },
        ],
        carryForward: {
          es: "Tu comparación ya quedó lista como contexto para las conversaciones con tu IA, aquí abajo.",
          en: "Your comparison is now ready as context for the AI conversations just below.",
        },
        cta: { es: "Planear mi investigación con mi IA", en: "Plan my research with my AI" },
      },
    },
    {
      id: "ask-ai",
      type: "ai_prompt",
      promptKey: "know_your_competition",
      moreTemplateKeys: ["know_your_competition_read", "know_your_competition_challenge"],
      title: { es: "Investiga con tu IA, sin creerle datos", en: "Research with AI, without trusting its facts" },
      intro: {
        es: "Una IA no conoce los negocios de tu zona: puede inventar nombres, precios y reseñas. Por eso estas conversaciones no le piden datos; le piden ayudarte a planear qué observar y a leer lo que tú mismo viste. Completa lo que falte, copia y pega en el asistente de IA que tú prefieras.",
        en: "An AI does not know the businesses in your area: it can invent names, prices, and reviews. That is why these conversations do not ask it for facts; they ask it to help you plan what to observe and to read what you saw yourself. Fill in what is missing, copy, and paste into whichever AI assistant you prefer.",
      },
    },
    {
      id: "mistakes",
      type: "mistakes",
      items: [
        {
          mistake: { es: "Decir “no tengo competencia”.", en: "Saying “I have no competition.”" },
          instead: {
            es: "Pregunta: ¿qué hace hoy mi cliente en lugar de comprarme? Esa es tu competencia, aunque no sea un negocio.",
            en: "Ask: what does my customer do today instead of buying from me? That is your competition, even if it is not a business.",
          },
        },
        {
          mistake: { es: "Copiar al negocio más conocido, o bajar tus precios solo porque el otro cobra menos.", en: "Copying the best-known business, or lowering your prices just because someone else charges less." },
          instead: {
            es: "Busca lo que a tu cliente le importa y los demás no le dan. Competir solo por precio casi siempre lo gana el más grande.",
            en: "Look for what your customer cares about and the others do not provide. Competing on price alone is almost always won by the biggest player.",
          },
        },
        {
          mistake: { es: "Pedirle a una IA “los datos de mi competencia” y creerlos.", en: "Asking an AI for “facts about my competitors” and believing them." },
          instead: {
            es: "Usa la IA para planear y ordenar. Los datos los consigues tú: visitando, observando y preguntando.",
            en: "Use AI to plan and organize. You get the facts yourself: by visiting, observing, and asking.",
          },
        },
      ],
    },
    {
      id: "note",
      type: "note",
      body: {
        es: "Investiga con respeto: usa solo información pública y actual, no engañes a nadie para obtener información y no hables mal de otros negocios. Compararte con honestidad te hace mejor; atacar a otros te hace menos confiable.",
        en: "Research respectfully: use only public, current information, do not deceive anyone to get information, and do not speak badly of other businesses. Comparing yourself honestly makes you better; attacking others makes you less trustworthy.",
      },
    },
    { id: "glossary", type: "glossary", resourceKeys: ["glossary_target_customer"] },
    {
      id: "checklist",
      type: "checklist",
      title: { es: "Antes de seguir, confirma", en: "Before you move on, confirm" },
      items: [
        { key: "alternatives", text: { es: "Enumeré al menos 3 alternativas reales, y una es “no hacer nada” o “hacerlo uno mismo”.", en: "I listed at least 3 real alternatives, and one is “do nothing” or “do it yourself.”" } },
        { key: "cares", text: { es: "Comparé en lo que a mi cliente le importa, no en lo que me importa a mí.", en: "I compared on what my customer cares about, not on what I care about." } },
        { key: "observed", text: { es: "Lo que escribí lo vi yo o me lo contaron clientes; lo demás está marcado “por averiguar”.", en: "What I wrote, I saw myself or customers told me; the rest is marked “to find out.”" } },
        { key: "gap", text: { es: "Tengo una idea de dónde puedo ser claramente mejor, y sé que debo comprobarla.", en: "I have an idea of where I can be clearly better, and I know I have to check it." } },
      ],
    },
    {
      id: "verify",
      type: "verify",
      title: { es: "Compruébalo con la realidad", en: "Check it against reality" },
      statement: {
        es: "Los precios, horarios y servicios de otros negocios cambian, y una IA puede inventarlos. Lo único confiable es lo que tú ves con tus ojos y lo que tus clientes te cuentan.",
        en: "Other businesses' prices, hours, and services change, and an AI can invent them. The only reliable source is what you see with your own eyes and what your customers tell you.",
      },
      steps: [
        { es: "Visita u observa al menos una alternativa esta semana, como lo haría un cliente.", en: "Visit or observe at least one alternative this week, the way a customer would." },
        { es: "Pregunta a 3 personas qué usan hoy y qué les gusta y les molesta de esa opción.", en: "Ask 3 people what they use today and what they like and dislike about that option." },
        { es: "Anota la fecha de lo que viste y revisa tu comparación cada pocos meses.", en: "Write down the date of what you saw and revisit your comparison every few months." },
      ],
      doctrine: { es: "La IA ayuda. Tú verificas.", en: "AI helps. You verify." },
    },
    {
      id: "recap",
      type: "recap",
      points: [
        { es: "Tu competencia es todo lo que tu cliente hace hoy en lugar de comprarte, incluso no hacer nada.", en: "Your competition is everything your customer does today instead of buying from you, including doing nothing." },
        { es: "Compara en lo que a tu cliente le importa, con lo que tú mismo observaste, y con honestidad.", en: "Compare on what your customer cares about, with what you observed yourself, and honestly." },
        { es: "No necesitas ser mejor en todo: necesitas ser claramente mejor en algo que importa. Y comprobarlo.", en: "You do not need to be better at everything: you need to be clearly better at something that matters. And to check it." },
      ],
    },
  ],
  audio: KNOW_YOUR_COMPETITION_AUDIO,
};
