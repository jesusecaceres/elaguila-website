/**
 * Gate G2 — flagship LessonPackage: "Quién es tu cliente" (lesson_key `who_is_your_customer`).
 * The reference implementation for every future Leonix lesson (Master Construction Bible §11).
 *
 * Code-owned in G2. The database row keeps publish state, identity (`lesson_key`,
 * `capability_key`) and the legacy plain body; nothing here mutates it. The display title is
 * correctly accented here even though the stored title is not (accent repair of stored content is
 * a later reviewed gate).
 *
 * "Panadería de Rosa" is an illustrative, invented example and is always labelled as such.
 */
import { LESSON_PACKAGE_SCHEMA_VERSION, type LessonPackage } from "../types";
import { WHO_IS_YOUR_CUSTOMER_AUDIO } from "./whoIsYourCustomerAudio";

export const WHO_IS_YOUR_CUSTOMER_PACKAGE: LessonPackage = {
  schemaVersion: LESSON_PACKAGE_SCHEMA_VERSION,
  lessonKey: "who_is_your_customer",
  source: "package",
  meta: {
    title: { es: "Quién es tu cliente", en: "Who is your customer?" },
    outcome: {
      es: "Al terminar podrás describir a tu cliente en una sola frase.",
      en: "By the end you will be able to describe your customer in a single sentence.",
    },
    readMinutes: 12,
    truthClass: "evergreen",
    consequential: false,
  },
  blocks: [
    {
      id: "hook",
      type: "hook",
      visualKey: "customer_focus_orbit",
      headline: { es: "Tu cliente no es “todo el mundo”.", en: "Your customer is not “everyone”." },
      support: {
        es: "Enfocarte no significa rechazar a nadie. Significa saber a quién le hablas primero.",
        en: "Focusing does not mean refusing anyone. It means knowing who you speak to first.",
      },
      visualLabels: {
        center: { es: "Tu negocio", en: "Your business" },
        focus: { es: "Familias del vecindario", en: "Neighborhood families" },
        focusTag: { es: "Empiezas aquí", en: "You start here" },
        groupB: { es: "Oficinas", en: "Offices" },
        groupC: { es: "Estudiantes", en: "Students" },
        groupD: { es: "Visitantes", en: "Visitors" },
        groupE: { es: "Otros negocios", en: "Other businesses" },
      },
      textAlternative: {
        es: "Diagrama: tu negocio al centro, rodeado por cinco grupos de posibles clientes: familias del vecindario, oficinas, estudiantes, visitantes y otros negocios. Todos pueden comprarte, pero un solo grupo, las familias del vecindario, está resaltado con un anillo dorado y la etiqueta “Empiezas aquí”: es a quien le hablas primero.",
        en: "Diagram: your business in the center, surrounded by five groups of possible customers: neighborhood families, offices, students, visitors, and other businesses. All of them can buy from you, but one group, neighborhood families, is highlighted with a gold ring and the label “You start here”: it is who you speak to first.",
      },
    },
    {
      id: "outcomes",
      type: "outcomes",
      intro: { es: "Al terminar esta lección podrás:", en: "By the end of this lesson you will be able to:" },
      items: [
        { es: "Describir a quién sirve tu negocio.", en: "Describe who your business serves." },
        { es: "Explicar el problema que le resuelves.", en: "Explain the problem you solve for them." },
        { es: "Identificar dónde puedes encontrar a ese cliente.", en: "Identify where you can reach that customer." },
      ],
    },
    {
      id: "explain",
      type: "explain",
      title: { es: "Por qué “todos” es demasiado", en: "Why “everyone” is too much" },
      chunks: [
        {
          heading: { es: "“Todos” es demasiado amplio", en: "“Everyone” is too broad" },
          body: {
            es: "Cuando le hablas a todo el mundo, tu mensaje tiene que ser tan general que no le dice nada especial a nadie. Es como hablar en una plaza llena: muchos te oyen, pero nadie siente que le hablas a él.",
            en: "When you speak to everyone, your message has to be so general that it says nothing special to anyone. It is like talking in a crowded plaza: many people hear you, but nobody feels you are talking to them.",
          },
        },
        {
          heading: { es: "El enfoque aclara tu mensaje", en: "Focus makes your message clear" },
          body: {
            es: "Cuando sabes quién te necesita más, puedes hablar de su problema con sus propias palabras. Esa persona lee tu mensaje y piensa: “esto es para mí”.",
            en: "When you know who needs you most, you can talk about their problem in their own words. That person reads your message and thinks: “this is for me.”",
          },
        },
        {
          heading: { es: "La claridad te ayuda a decidir", en: "Clarity helps you decide" },
          body: {
            es: "Conocer a tu cliente ordena tres cosas: tus precios (qué valora y por qué lo pagaría), tu publicidad (dónde anunciarte y qué decir) y tus decisiones (qué ofrecer primero y a qué decir que no por ahora).",
            en: "Knowing your customer puts three things in order: your pricing (what they value and why they would pay for it), your advertising (where to show up and what to say), and your decisions (what to offer first and what to say no to for now).",
          },
        },
      ],
      pullQuote: {
        es: "No estás cerrando la puerta. Estás decidiendo a quién saludas primero.",
        en: "You are not closing the door. You are deciding who you greet first.",
      },
    },
    {
      id: "model",
      type: "visual_model",
      visualKey: "focus_progression",
      title: { es: "De “todos” a tu mensaje", en: "From “everyone” to your message" },
      steps: [
        {
          label: { es: "Todos", en: "Everyone" },
          note: { es: "Cualquiera podría comprarte. Por eso no es una descripción útil.", en: "Anyone could buy from you. That is why it is not a useful description." },
        },
        {
          label: { es: "Quien más lo necesita", en: "Who needs it most" },
          note: { es: "El grupo que tiene el problema que tú resuelves mejor.", en: "The group with the problem you solve best." },
        },
        {
          label: { es: "Tu mensaje", en: "Your message" },
          note: { es: "Palabras, fotos y lugares elegidos para esa persona.", en: "Words, photos, and places chosen for that person." },
        },
      ],
      caption: {
        es: "Los demás siguen siendo bienvenidos. Solo cambia a quién le hablas primero.",
        en: "Everyone else is still welcome. What changes is who you speak to first.",
      },
      textAlternative: {
        es: "Progresión de tres pasos: de “Todos”, a “Quien más lo necesita”, a “Tu mensaje”.",
        en: "Three-step progression: from “Everyone”, to “Who needs it most”, to “Your message”.",
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
            es: "Rosa planea vender pasteles desde su casa. Su primera idea fue “pasteles para toda ocasión, para todos”. Antes de gastar en empaques y anuncios, revisó a quiénes ya les había hecho pasteles: casi siempre eran familias de su vecindario que querían un pastel de cumpleaños personalizado y le escribían por WhatsApp con dos o tres días de aviso. Decidió empezar por ellas.",
            en: "Rosa is planning to sell cakes from home. Her first idea was “cakes for every occasion, for everyone.” Before spending on packaging and ads, she looked at who she had already baked for: almost always families in her neighborhood who wanted a custom birthday cake and messaged her on WhatsApp with two or three days' notice. She decided to start with them.",
          },
        },
        {
          journey: "empezando",
          story: {
            es: "Rosa está en su primer mes. Publicó “hago de todo, para todos” y recibió pedidos imposibles: cien cupcakes para mañana, un pastel de bodas con descuento, personas que preguntan el precio y desaparecen. Revisó sus primeras ventas reales: casi todas eran familias de su vecindario que pedían pasteles de cumpleaños personalizados por WhatsApp. Cambió su mensaje para hablarles a ellas.",
            en: "Rosa is in her first month. She posted “I make everything, for everyone” and received impossible requests: one hundred cupcakes for tomorrow, a discounted wedding cake, people who ask the price and disappear. She reviewed her first real sales: almost all were families in her neighborhood ordering custom birthday cakes by WhatsApp. She changed her message to speak to them.",
          },
        },
        {
          journey: "negocio",
          story: {
            es: "Rosa lleva tres años vendiendo. Siempre creyó que su cliente eran “las oficinas del centro”, porque eran los pedidos más grandes. Al revisar sus ventas de los últimos meses descubrió que quienes regresan y la recomiendan son familias de su vecindario que piden pasteles de cumpleaños personalizados. Aprendió de quien de verdad le compra, no de quien ella imaginaba.",
            en: "Rosa has been selling for three years. She always believed her customer was “the downtown offices,” because those were her biggest orders. When she reviewed the last few months of sales, she discovered that the people who come back and recommend her are families in her neighborhood ordering custom birthday cakes. She learned from who actually buys, not from who she imagined.",
          },
        },
        {
          story: {
            es: "Rosa vende pasteles. Su primer mensaje fue “hago de todo, para todos”, y casi nadie respondió. Cuando revisó quién le compraba de verdad, encontró un patrón: familias de su vecindario que necesitaban un pastel de cumpleaños personalizado y preferían pedirlo por WhatsApp con dos o tres días de aviso. No cambió su receta. Cambió a quién le hablaba primero.",
            en: "Rosa sells cakes. Her first message was “I make everything, for everyone,” and almost nobody responded. When she looked at who actually bought from her, she found a pattern: families in her neighborhood who needed a custom birthday cake and preferred to order it by WhatsApp with two or three days' notice. She did not change her recipe. She changed who she spoke to first.",
          },
        },
      ],
      takeaway: {
        es: "Rosa sigue atendiendo a quien llegue. Pero ahora sabe a quién le habla primero, y su mensaje por fin le dice algo a alguien.",
        en: "Rosa still serves whoever shows up. But now she knows who she speaks to first, and her message finally says something to someone.",
      },
    },
    {
      id: "compare",
      type: "compare",
      title: { es: "Débil contra fuerte", en: "Weak versus strong" },
      weak: {
        label: { es: "Descripción débil", en: "Weak description" },
        text: { es: "“Mi cliente es cualquiera que quiera comprar.”", en: "“My customer is anyone who wants to buy.”" },
        why: {
          es: "No te dice qué escribir, dónde anunciarte ni qué ofrecer primero.",
          en: "It does not tell you what to write, where to advertise, or what to offer first.",
        },
      },
      strong: {
        label: { es: "Descripción fuerte", en: "Strong description" },
        text: {
          es: "“Familias de mi vecindario que necesitan pasteles de cumpleaños personalizados con 2–3 días de aviso y prefieren pedir por WhatsApp.”",
          en: "“Families in my neighborhood who need custom birthday cakes with 2–3 days' notice and prefer to order by WhatsApp.”",
        },
        annotations: [
          {
            tag: { es: "Quién", en: "Who" },
            fragment: { es: "Familias de mi vecindario", en: "Families in my neighborhood" },
            note: { es: "Un grupo real que puedes imaginar y encontrar.", en: "A real group you can picture and find." },
          },
          {
            tag: { es: "Problema", en: "Problem" },
            fragment: { es: "necesitan pasteles de cumpleaños", en: "need custom birthday cakes" },
            note: { es: "Lo que esa persona quiere resolver.", en: "What that person wants solved." },
          },
          {
            tag: { es: "Dónde", en: "Where" },
            fragment: { es: "prefieren pedir por WhatsApp", en: "prefer to order by WhatsApp" },
            note: { es: "El lugar donde ya están y por donde te pueden contactar.", en: "The place where they already are and how they can reach you." },
          },
          {
            tag: { es: "Por qué tú", en: "Why you" },
            fragment: { es: "personalizados con 2–3 días de aviso", en: "with 2–3 days' notice" },
            note: { es: "Lo que tú haces y otros no les ofrecen.", en: "What you do that others do not offer them." },
          },
        ],
      },
    },
    {
      id: "activity",
      type: "activity",
      activityKey: "customer_statement_builder",
      title: { es: "Arma la frase de tu cliente", en: "Build your customer sentence" },
      intro: {
        es: "Contesta con tus propias palabras. La frase se arma solo con lo que tú escribes: si dejas algo en blanco, se queda en blanco. Tu primera versión es una suposición; ya la comprobarás.",
        en: "Answer in your own words. The sentence is built only from what you type: if you leave something blank, it stays blank. Your first version is an assumption; you will check it later.",
      },
      estimatedMinutes: 5,
      fields: [
        {
          key: "offer",
          label: { es: "¿Qué vendes?", en: "What do you sell?" },
          placeholder: { es: "p. ej. pasteles de cumpleaños personalizados", en: "e.g. custom birthday cakes" },
        },
        {
          key: "who",
          label: { es: "¿Quién lo necesita más?", en: "Who needs it most?" },
          placeholder: { es: "p. ej. familias de mi vecindario", en: "e.g. families in my neighborhood" },
        },
        {
          key: "problem",
          label: { es: "¿Qué problema resuelves?", en: "What problem do you solve?" },
          placeholder: { es: "p. ej. un pastel especial con pocos días de aviso", en: "e.g. a special cake on short notice" },
        },
        {
          key: "where",
          label: { es: "¿Dónde están?", en: "Where are they?" },
          placeholder: { es: "p. ej. mi vecindario y grupos de WhatsApp", en: "e.g. my neighborhood and WhatsApp groups" },
        },
        {
          key: "why",
          label: { es: "¿Por qué te elegirían?", en: "Why would they choose you?" },
          placeholder: { es: "p. ej. lo hago a su gusto y cumplo la fecha", en: "e.g. I make it the way they want and I deliver on time" },
        },
      ],
    },
    { id: "ask-ai", type: "ai_prompt", promptKey: "who_is_your_customer" },
    {
      id: "mistakes",
      type: "mistakes",
      items: [
        {
          mistake: {
            es: "Elegir al cliente que te gustaría tener, en lugar de aprender de las personas que de verdad te compran o muestran interés.",
            en: "Choosing the customer you wish you had, instead of learning from the people who actually buy or show interest.",
          },
          instead: {
            es: "Empieza por la evidencia: ¿quién te ha comprado, preguntado o recomendado? Describe primero a esas personas.",
            en: "Start from the evidence: who has bought, asked, or recommended you? Describe those people first.",
          },
        },
      ],
    },
    { id: "glossary", type: "glossary", resourceKeys: ["glossary_target_customer", "glossary_lead", "glossary_referral"] },
    {
      id: "checklist",
      type: "checklist",
      title: { es: "Antes de seguir, confirma", en: "Before you move on, confirm" },
      items: [
        { key: "who", text: { es: "Puedo describir quién necesita más lo que ofrezco.", en: "I can describe who needs my offer most." } },
        { key: "problem", text: { es: "Puedo nombrar el problema que resuelvo.", en: "I can name the problem I solve." } },
        { key: "where", text: { es: "Conozco al menos un lugar donde puedo encontrar a este cliente.", en: "I know at least one place where I can reach this customer." } },
        { key: "test", text: { es: "Sé cómo comprobar mis suposiciones con personas reales.", en: "I know how to test my assumptions with real people." } },
      ],
    },
    {
      id: "verify",
      type: "verify",
      title: { es: "Compruébalo con la realidad", en: "Check it against reality" },
      statement: {
        es: "Antes de cambiar todo tu negocio por la respuesta de una IA, o por tu propia suposición, habla con 3 clientes reales o personas que podrían serlo.",
        en: "Before you change your whole business because of an AI answer, or your own guess, talk to 3 real customers or people who could become one.",
      },
      steps: [
        { es: "Pregúntales por qué te compraron, o qué les haría comprarte.", en: "Ask why they bought from you, or what would make them buy." },
        { es: "Escucha las palabras exactas que usan para describir su problema.", en: "Listen for the exact words they use to describe their problem." },
        { es: "Ajusta tu frase con lo que aprendiste, no con lo que esperabas oír.", en: "Adjust your sentence with what you learned, not with what you hoped to hear." },
      ],
      doctrine: { es: "La IA ayuda. Tú verificas.", en: "AI helps. You verify." },
    },
    {
      id: "recap",
      type: "recap",
      points: [
        { es: "Tu cliente no es “todo el mundo”: cuando le hablas a todos, nadie se siente aludido.", en: "Your customer is not “everyone”: when you speak to all, nobody feels spoken to." },
        { es: "Enfocarte no es rechazar; es saber a quién le hablas primero.", en: "Focusing is not refusing; it is knowing who you speak to first." },
        { es: "Un cliente claro tiene cuatro partes: quién, problema, dónde y por qué tú. Y se comprueba con personas reales.", en: "A clear customer has four parts: who, problem, where, and why you. And it is checked with real people." },
      ],
    },
  ],
  audio: WHO_IS_YOUR_CUSTOMER_AUDIO,
  next: {
    // Desired future sequence. Skipped automatically until those lessons are published.
    preferred: { idea: ["know_your_competition"], neutral: ["know_your_competition"] },
  },
};
