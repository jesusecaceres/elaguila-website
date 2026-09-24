/**
 * Gate G4-I1 — LessonPackage: "Qué problema resuelves" (lesson_key `what_problem_do_you_solve`).
 * Matrix row 1 · CP1 · evergreen. The first lesson of the Idea pathway: name the problem before the
 * product. Activity `problem_statement_builder` → a one-sentence problem statement (a hypothesis
 * about pain, not proof) that opens every later AI conversation.
 *
 * "Lavandería móvil de Marco" is an illustrative, invented example and is always labelled as such.
 */
import { LESSON_PACKAGE_SCHEMA_VERSION, type LessonPackage } from "../types";
import { WHAT_PROBLEM_DO_YOU_SOLVE_AUDIO } from "./whatProblemDoYouSolveAudio";

export const WHAT_PROBLEM_DO_YOU_SOLVE_PACKAGE: LessonPackage = {
  schemaVersion: LESSON_PACKAGE_SCHEMA_VERSION,
  lessonKey: "what_problem_do_you_solve",
  source: "package",
  meta: {
    title: { es: "Qué problema resuelves", en: "What problem do you solve?" },
    outcome: {
      es: "Al terminar podrás decir, en una sola frase, el problema que tu negocio le resuelve a alguien.",
      en: "By the end you will be able to say, in a single sentence, the problem your business solves for someone.",
    },
    readMinutes: 10,
    truthClass: "evergreen",
    consequential: false,
  },
  blocks: [
    {
      id: "hook",
      type: "hook",
      visualKey: "product_vs_problem",
      headline: { es: "Nadie se despierta queriendo tu producto.", en: "Nobody wakes up wanting your product." },
      support: {
        es: "La gente se despierta con un problema. Si tu negocio se lo resuelve con cuidado y con un intercambio justo, les sirves de verdad. Si no, solo les pareces “interesante”.",
        en: "People wake up with a problem. If your business solves it with care and a fair exchange, you truly serve them. If not, you are just “interesting” to them.",
      },
      visualLabels: {
        product: { es: "Tu producto", en: "Your product" },
        productNote: { es: "Esperando en el estante", en: "Waiting on the shelf" },
        person: { es: "Una persona", en: "A person" },
        problem: { es: "“No me alcanza el día”", en: "“Not enough hours in my day”" },
        startTag: { es: "Empieza aquí", en: "Start here" },
      },
      textAlternative: {
        es: "Diagrama en dos partes. A la izquierda, un producto solo en un estante, con la nota “Esperando en el estante”. A la derecha, una persona con un globo de pensamiento que dice “No me alcanza el día”, resaltada con un anillo dorado y la etiqueta “Empieza aquí”. El negocio empieza por la persona y su problema, no por el producto.",
        en: "Two-part diagram. On the left, a product alone on a shelf, with the note “Waiting on the shelf”. On the right, a person with a thought bubble that says “Not enough hours in my day”, highlighted with a gold ring and the label “Start here”. The business starts with the person and their problem, not with the product.",
      },
    },
    {
      id: "outcomes",
      type: "outcomes",
      intro: { es: "Al terminar esta lección podrás:", en: "By the end of this lesson you will be able to:" },
      items: [
        { es: "Decir el problema con las palabras de tu cliente, no con las tuyas.", en: "State the problem in your customer's words, not your own." },
        { es: "Distinguir un problema de una idea de producto.", en: "Tell a problem apart from a product idea." },
        { es: "Nombrar quién lo siente más y qué hace hoy para resolverlo.", en: "Name who feels it most and what they do about it today." },
      ],
    },
    {
      id: "explain",
      type: "explain",
      title: { es: "Primero el problema, después el producto", en: "First the problem, then the product" },
      chunks: [
        {
          heading: { es: "Un producto es tu respuesta. El problema es su pregunta.", en: "A product is your answer. The problem is their question." },
          body: {
            es: "“Quiero vender pasteles”, “quiero abrir una lavandería”, “quiero hacer páginas web”: todo eso son respuestas. Un negocio funciona cuando esa respuesta le sirve a una pregunta que alguien ya se está haciendo: “¿de dónde saco un pastel para el sábado?”, “¿cuándo voy a lavar esta ropa?”.",
            en: "“I want to sell cakes,” “I want to open a laundry,” “I want to build websites”: all of those are answers. A business works when that answer fits a question someone is already asking: “where do I get a cake by Saturday?”, “when am I going to wash these clothes?”",
          },
        },
        {
          heading: { es: "Un problema de verdad se nota", en: "A real problem shows" },
          body: {
            es: "Tiene tres señales. Le pasa a alguien en concreto, no a “la gente”. Pasa seguido, no una vez en la vida. Y esa persona ya hace algo para resolverlo, aunque sea a medias: improvisa, paga de más, pierde tiempo o se aguanta. Si nadie hace nada al respecto, quizá no sea un problema tan grande.",
            en: "It has three signs. It happens to someone specific, not to “people.” It happens often, not once in a lifetime. And that person already does something about it, even halfway: they improvise, overpay, lose time, or put up with it. If nobody does anything about it, it may not be that big a problem.",
          },
        },
        {
          heading: { es: "Lo que hacen hoy es tu mejor pista", en: "What they do today is your best clue" },
          body: {
            es: "Lo que la persona hace hoy te dice cuánto le importa el problema y qué alternativa ya usa. Si le cuesta dinero, tiempo o preocupación, hay algo que tu negocio puede servir mejor. Y sus palabras para describirlo son las mismas que después usarás para que te entienda.",
            en: "What the person does today tells you how much the problem matters to them and which alternative they already use. If it costs them money, time, or worry, there is something your business can serve better. And the words they use to describe it are the same words you will later use so they understand you.",
          },
        },
      ],
      pullQuote: {
        es: "Enamórate del problema de tu cliente, no de tu producto.",
        en: "Fall in love with your customer's problem, not with your product.",
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
            es: "Marco quiere empezar un servicio que recoge la ropa, la lava y la devuelve doblada. Su razón era: “todo el mundo odia lavar”. Antes de comprar nada, se preguntó a quién le había visto ese problema de verdad. Pensó en su hermana y sus compañeras, enfermeras con turnos de 12 horas: cada semana acumulan ropa hasta su único día libre y lo pasan en la lavandería. Eso ya no era “todo el mundo”. Era alguien, con un problema, cada semana.",
            en: "Marco wants to start a service that picks up laundry, washes it, and returns it folded. His reason was: “everybody hates doing laundry.” Before buying anything, he asked himself who he had actually seen with that problem. He thought of his sister and her coworkers, nurses on 12-hour shifts: every week they pile up laundry until their one day off, and spend it at the laundromat. That was no longer “everybody.” It was someone, with a problem, every week.",
          },
        },
        {
          journey: "empezando",
          story: {
            es: "Marco ya tiene sus primeros clientes. Anunció “lavandería a domicilio para todos” y casi nadie respondió. Revisó quiénes sí le escribieron: casi todas eran enfermeras con turnos de 12 horas, y todas decían algo parecido: “no quiero pasar mi único día libre lavando”. No pagaban por ropa limpia; pagaban por recuperar su día de descanso. Marco cambió su mensaje para hablar de eso.",
            en: "Marco already has his first customers. He advertised “home laundry service for everyone” and almost nobody responded. He looked at who did message him: almost all were nurses on 12-hour shifts, and they all said something similar: “I don't want to spend my only day off doing laundry.” They were not paying for clean clothes; they were paying to get their day of rest back. Marco changed his message to talk about that.",
          },
        },
        {
          story: {
            es: "Marco quiere ofrecer un servicio que recoge la ropa, la lava y la devuelve doblada. Su razón era: “todo el mundo odia lavar”. Cuando se preguntó a quién le había visto ese problema de verdad, pensó en enfermeras con turnos de 12 horas: cada semana acumulan ropa hasta su único día libre y lo pasan en la lavandería. No necesitan “ropa limpia”; necesitan recuperar su día de descanso. Ese es el problema.",
            en: "Marco wants to offer a service that picks up laundry, washes it, and returns it folded. His reason was: “everybody hates doing laundry.” When he asked himself who he had actually seen with that problem, he thought of nurses on 12-hour shifts: every week they pile up laundry until their one day off, and spend it at the laundromat. They do not need “clean clothes”; they need their day of rest back. That is the problem.",
          },
        },
      ],
      takeaway: {
        es: "Marco no cambió su servicio. Cambió la pregunta: de “¿qué vendo?” a “¿qué le quito de encima a quién?”.",
        en: "Marco did not change his service. He changed the question: from “what do I sell?” to “what do I take off whose hands?”",
      },
    },
    {
      id: "model",
      type: "visual_model",
      visualKey: "focus_progression",
      title: { es: "De tu producto a su problema", en: "From your product to their problem" },
      steps: [
        {
          label: { es: "Lo que quieres vender", en: "What you want to sell" },
          note: { es: "Tu punto de partida. Es válido, pero todavía es tu respuesta.", en: "Your starting point. It is valid, but it is still your answer." },
        },
        {
          label: { es: "A quién le pasa algo", en: "Who something happens to" },
          note: { es: "Una persona concreta, en una situación concreta, que pasa seguido.", en: "A specific person, in a specific situation, that happens often." },
        },
        {
          label: { es: "Qué hace hoy y qué le cuesta", en: "What they do today and what it costs" },
          note: { es: "Su salida actual, y el dinero, tiempo o preocupación que le cuesta.", en: "Their current workaround, and the money, time, or worry it costs them." },
        },
      ],
      caption: {
        es: "Si puedes llenar los tres pasos con ejemplos reales, tienes un problema. Si no, todavía tienes una idea de producto.",
        en: "If you can fill all three steps with real examples, you have a problem. If not, you still have a product idea.",
      },
      textAlternative: {
        es: "Progresión de tres pasos: de “Lo que quieres vender”, a “A quién le pasa algo”, a “Qué hace hoy y qué le cuesta”.",
        en: "Three-step progression: from “What you want to sell”, to “Who something happens to”, to “What they do today and what it costs”.",
      },
    },
    {
      id: "compare",
      type: "compare",
      title: { es: "Idea de producto contra problema", en: "Product idea versus problem" },
      weak: {
        label: { es: "Idea de producto", en: "Product idea" },
        text: { es: "“Voy a ofrecer el mejor servicio de lavandería a domicilio.”", en: "“I am going to offer the best home laundry service.”" },
        why: {
          es: "Habla de ti. No dice a quién le sirve, cuándo, ni qué le resuelve.",
          en: "It talks about you. It does not say who it serves, when, or what it solves for them.",
        },
      },
      strong: {
        label: { es: "Problema claro", en: "Clear problem" },
        text: {
          es: "“Para enfermeras con turnos de 12 horas, el problema es no tener tiempo ni energía para lavar. Pasa cada semana. Hoy la salida es acumular ropa hasta el día libre, y el costo es su único día de descanso.”",
          en: "“For nurses on 12-hour shifts, the problem is having no time or energy to do laundry. It happens every week. Today the workaround is piling up clothes until the day off, and the cost is their only day of rest.”",
        },
        annotations: [
          {
            tag: { es: "Quién", en: "Who" },
            fragment: { es: "enfermeras con turnos de 12 horas", en: "nurses on 12-hour shifts" },
            note: { es: "Alguien concreto que puedes ir a buscar y escuchar.", en: "Someone specific you can go find and listen to." },
          },
          {
            tag: { es: "Qué sale mal", en: "What goes wrong" },
            fragment: { es: "no tener tiempo ni energía para lavar", en: "having no time or energy to do laundry" },
            note: { es: "Dicho como lo diría esa persona, sin mencionar tu servicio.", en: "Said the way that person would say it, without mentioning your service." },
          },
          {
            tag: { es: "Cada cuánto", en: "How often" },
            fragment: { es: "cada semana", en: "every week" },
            note: { es: "Un problema frecuente sostiene un negocio; uno raro, no.", en: "A frequent problem sustains a business; a rare one does not." },
          },
          {
            tag: { es: "Hoy y costo", en: "Today and cost" },
            fragment: { es: "su único día de descanso", en: "their only day of rest" },
            note: { es: "Lo que ya pierden hoy. Eso es lo que tu negocio puede devolverles.", en: "What they already lose today. That is what your business can give back." },
          },
        ],
      },
    },
    {
      id: "activity",
      type: "activity",
      activityKey: "problem_statement_builder",
      title: { es: "Arma la frase de tu problema", en: "Build your problem sentence" },
      intro: {
        es: "Contesta sin mencionar tu producto. La frase se arma solo con lo que tú escribes: si dejas algo en blanco, se queda en blanco. Es tu primera suposición; después la vas a comprobar con personas reales.",
        en: "Answer without mentioning your product. The sentence is built only from what you type: if you leave something blank, it stays blank. It is your first assumption; later you will check it with real people.",
      },
      estimatedMinutes: 6,
      fields: [
        {
          key: "who",
          label: { es: "¿Quién tiene el problema?", en: "Who has the problem?" },
          placeholder: { es: "p. ej. enfermeras con turnos de 12 horas", en: "e.g. nurses on 12-hour shifts" },
          blankLabel: { es: "quién", en: "who" },
        },
        {
          key: "wrong",
          label: { es: "¿Qué les sale mal?", en: "What goes wrong for them?" },
          placeholder: { es: "p. ej. no tener tiempo ni energía para lavar", en: "e.g. having no time or energy to do laundry" },
          blankLabel: { es: "qué sale mal", en: "what goes wrong" },
        },
        {
          key: "often",
          label: { es: "¿Cada cuánto les pasa?", en: "How often does it happen?" },
          placeholder: { es: "p. ej. cada semana", en: "e.g. every week" },
          blankLabel: { es: "cada cuánto", en: "how often" },
        },
        {
          key: "today",
          label: { es: "¿Qué hacen hoy para resolverlo?", en: "What do they do about it today?" },
          placeholder: { es: "p. ej. acumular ropa hasta el día libre", en: "e.g. piling up clothes until the day off" },
          blankLabel: { es: "qué hacen hoy", en: "what they do today" },
        },
        {
          key: "cost",
          label: { es: "¿Qué les cuesta? (dinero, tiempo o preocupación)", en: "What does it cost them? (money, time, or worry)" },
          placeholder: { es: "p. ej. su único día de descanso", en: "e.g. their only day of rest" },
          blankLabel: { es: "qué les cuesta", en: "what it costs" },
        },
      ],
      result: {
        label: { es: "Tu frase del problema", en: "Your problem sentence" },
        hint: { es: "Se arma solo con lo que tú escribes.", en: "It is built only from what you type." },
        sentence: {
          es: "Para [[who]], el problema es [[wrong]]. Pasa [[often]]. Hoy la salida es [[today]], y el costo es [[cost]].",
          en: "For [[who]], the problem is [[wrong]]. It happens [[often]]. Today the workaround is [[today]], and the cost is [[cost]].",
        },
        copyLabel: { es: "Copiar mi frase", en: "Copy my sentence" },
        copiedLabel: { es: "Frase copiada", en: "Sentence copied" },
        printLabel: { es: "Mi frase del problema", en: "My problem sentence" },
      },
      resultBridge: {
        title: { es: "¿Y ahora qué hago con esto?", en: "What do I do with this now?" },
        lead: {
          es: "Esta frase es tu hipótesis del problema: lo que hoy crees, no algo que ya comprobaste.",
          en: "This sentence is your problem hypothesis: what you believe today, not something you have proven.",
        },
        points: [
          { es: "Te dice con quién hablar primero y sobre qué preguntarle.", en: "It tells you who to talk to first and what to ask them about." },
          {
            es: "Te sirve para revisar tu idea: ¿lo que quieres vender de verdad le quita ese problema de encima?",
            en: "It lets you check your idea: does what you want to sell really take that problem off their hands?",
          },
          {
            es: "Todavía hay que comprobarla: que el problema exista, que pase seguido y que de verdad les cueste.",
            en: "It still has to be tested: that the problem exists, that it happens often, and that it really costs them.",
          },
        ],
        carryForward: {
          es: "Tus respuestas ya quedaron listas como contexto para las conversaciones con tu IA, aquí abajo.",
          en: "Your answers are now ready as context for the AI conversations just below.",
        },
        cta: { es: "Afinarlo con mi IA", en: "Sharpen it with my AI" },
      },
    },
    {
      id: "ask-ai",
      type: "ai_prompt",
      promptKey: "what_problem_do_you_solve",
      moreTemplateKeys: ["what_problem_do_you_solve_interview", "what_problem_do_you_solve_challenge"],
      title: { es: "Pon a prueba tu problema con tu IA", en: "Test your problem with AI" },
      intro: {
        es: "Tres conversaciones completas, armadas con tus propias respuestas. Ninguna le pide a la IA que decida si tu idea es buena: eso te lo dirán personas reales. Completa lo que falte, copia y pega en el asistente de IA que tú prefieras.",
        en: "Three complete conversations, built from your own answers. None of them asks the AI to decide whether your idea is good: real people will tell you that. Fill in what is missing, copy, and paste into whichever AI assistant you prefer.",
      },
    },
    {
      id: "mistakes",
      type: "mistakes",
      items: [
        {
          mistake: {
            es: "Describir tu producto y llamarlo “problema”: “el problema es que no existe una lavandería móvil”.",
            en: "Describing your product and calling it a “problem”: “the problem is that there is no mobile laundry.”",
          },
          instead: {
            es: "Quita tu producto de la frase. Si el problema desaparece al quitarlo, era una idea de producto.",
            en: "Take your product out of the sentence. If the problem disappears when you remove it, it was a product idea.",
          },
        },
        {
          mistake: {
            es: "Creer que un problema existe porque a ti te parece obvio, o porque tu familia dice que es buena idea.",
            en: "Believing a problem exists because it seems obvious to you, or because your family says it is a good idea.",
          },
          instead: {
            es: "Busca a alguien que ya esté gastando dinero, tiempo o paciencia en resolverlo. Esa es la señal.",
            en: "Look for someone who is already spending money, time, or patience to solve it. That is the signal.",
          },
        },
      ],
    },
    { id: "glossary", type: "glossary", resourceKeys: ["glossary_target_customer"] },
    {
      id: "checklist",
      type: "checklist",
      title: { es: "Antes de seguir, confirma", en: "Before you move on, confirm" },
      items: [
        { key: "no_product", text: { es: "Puedo decir el problema sin mencionar mi producto.", en: "I can state the problem without mentioning my product." } },
        { key: "who", text: { es: "Sé quién lo siente más, y no es “todo el mundo”.", en: "I know who feels it most, and it is not “everyone.”" } },
        { key: "today", text: { es: "Sé qué hace hoy esa persona para resolverlo y qué le cuesta.", en: "I know what that person does about it today and what it costs them." } },
        { key: "ask", text: { es: "Tengo en mente a 3 personas reales a quienes preguntarles.", en: "I have 3 real people in mind to ask." } },
      ],
    },
    {
      id: "verify",
      type: "verify",
      title: { es: "Compruébalo con la realidad", en: "Check it against reality" },
      statement: {
        es: "Un problema no existe porque tú lo creas, ni porque una IA te diga que suena bien. Existe si personas reales te lo cuentan sin que tú se lo sugieras.",
        en: "A problem does not exist because you believe it, or because an AI says it sounds right. It exists if real people describe it to you without you suggesting it.",
      },
      steps: [
        { es: "Pregúntale a 3 personas por la última vez que les pasó, sin mencionar tu idea.", en: "Ask 3 people about the last time it happened to them, without mentioning your idea." },
        { es: "Pon atención a qué hicieron para resolverlo y cuánto les costó.", en: "Pay attention to what they did about it and what it cost them." },
        { es: "Si nadie lo reconoce como problema, ajusta tu frase antes de gastar dinero.", en: "If nobody recognizes it as a problem, adjust your sentence before you spend money." },
      ],
      doctrine: { es: "La IA ayuda. Tú verificas.", en: "AI helps. You verify." },
    },
    {
      id: "recap",
      type: "recap",
      points: [
        { es: "Nadie se despierta queriendo tu producto: la gente busca que alguien resuelva un problema real, con utilidad y honestidad.", en: "Nobody wakes up wanting your product: people look for someone to solve a real problem, usefully and honestly." },
        { es: "Un problema de verdad le pasa a alguien concreto, pasa seguido y esa persona ya hace algo al respecto.", en: "A real problem happens to someone specific, happens often, and that person already does something about it." },
        { es: "Tu frase del problema es una hipótesis. Se comprueba escuchando a personas reales, no a una IA.", en: "Your problem sentence is a hypothesis. It is checked by listening to real people, not to an AI." },
      ],
    },
  ],
  audio: WHAT_PROBLEM_DO_YOU_SOLVE_AUDIO,
};
