/**
 * Gate G2 — LISTEN script for "Quién es tu cliente". A conversational teaching script written for
 * the ear (Bible §17): it is NOT a reading of the page. It must stay useful with no screen at all,
 * and it never asks a driver to touch the phone — the only screen instruction lives in the
 * "parked" segment ("cuando estés estacionado o en casa…").
 *
 * Roughly 8–10 minutes per language at a calm teaching pace. No recording exists yet: `assets` is
 * intentionally absent, so no player is rendered. When Coach provides a recording, add
 * `assets.es` / `assets.en` with the same `scriptVersion` — the lesson content does not change.
 * "Rosa" is an invented, illustrative example and the script says so.
 */
import type { LessonAudio } from "../types";

export const WHO_IS_YOUR_CUSTOMER_AUDIO: LessonAudio = {
  scriptVersion: 1,
  estimatedMinutes: 9,
  segments: [
    {
      id: "hook",
      kind: "hook",
      title: { es: "Una pregunta para empezar", en: "A question to begin" },
      text: {
        es: "Hola, qué gusto que estés aquí. Te voy a hacer una pregunta, y quiero que la contestes en voz alta, aunque estés solo. ¿A quién le vendes? Piénsalo un segundo. Si tu respuesta fue “a todo el mundo”, o “a quien quiera comprar”, no te preocupes: es la respuesta más común que existe. Casi todos empezamos así. Pero en los próximos minutos te voy a mostrar por qué esa respuesta, que suena tan generosa, en realidad te está haciendo el trabajo más difícil. Y te voy a enseñar una forma sencilla de cambiarla.",
        en: "Hi, I'm really glad you're here. I'm going to ask you a question, and I want you to answer it out loud, even if you're alone. Who do you sell to? Think about it for a second. If your answer was “everyone,” or “anyone who wants to buy,” don't worry: it is the most common answer there is. Almost all of us start there. But over the next few minutes I'm going to show you why that answer, which sounds so generous, is actually making your work harder. And I'm going to teach you a simple way to change it.",
      },
    },
    {
      id: "learn",
      kind: "learn",
      title: { es: "Lo que vas a aprender", en: "What you'll learn" },
      text: {
        es: "Esta es la lección “Quién es tu cliente”, del Centro de Aprendizaje Leonix. Al terminar vas a poder hacer tres cosas. Primera: describir, en una sola frase, a quién sirve tu negocio. Segunda: explicar qué problema le resuelves a esa persona. Y tercera: saber en qué lugar puedes encontrarla. No necesitas papel ni nada más ahora mismo. Solo escucha, y piensa en tu negocio, o en tu idea, mientras te cuento una historia.",
        en: "This is the lesson “Who is your customer?”, from the Leonix Learning Center. By the end you'll be able to do three things. First: describe, in a single sentence, who your business serves. Second: explain what problem you solve for that person. And third: know where you can find them. You don't need paper or anything else right now. Just listen, and think about your business, or your idea, while I tell you a story.",
      },
    },
    {
      id: "story",
      kind: "story",
      title: { es: "La historia de Rosa", en: "Rosa's story" },
      text: {
        es: "Te presento a Rosa. Rosa es un ejemplo que inventamos para esta lección, pero seguro conoces a alguien como ella. Rosa hace unos pasteles que todo el mundo le celebra. En cada cumpleaños de la familia, alguien le dice: “Rosa, tú deberías vender esto”. Así que un día se anima. Abre una página en redes sociales y escribe: “Pasteles para toda ocasión. Hago de todo, para todos”. ¿Y qué pasa? Casi nada. Le escribe una persona que quiere cien cupcakes para mañana. Otra que quiere un pastel de bodas de cinco pisos, con descuento. Otra que solo pregunta el precio y desaparece. Rosa termina la semana cansada, sin saber qué comprar, cuánto cobrar ni qué publicar. Y empieza a pensar que tal vez su negocio no sirve. Pero un día, Rosa hace algo muy simple. Se sienta y revisa quién le ha comprado de verdad en los últimos dos meses. Y nota un patrón. La mayoría son mamás y papás de su mismo vecindario. Casi todos le piden lo mismo: un pastel de cumpleaños personalizado, con el nombre y el personaje favorito del niño. Casi todos le escriben por WhatsApp. Y casi todos le avisan con dos o tres días de anticipación, porque ya buscaron en el supermercado y no encontraron algo especial. Rosa no cambió su receta. Cambió su mensaje. Ahora su página dice: “Pasteles de cumpleaños personalizados para familias de este vecindario. Pídelo por WhatsApp con dos o tres días de aviso”. ¿Dejó de venderles a los demás? No. Si alguien le pide otra cosa y ella puede hacerla, la hace. Pero ahora, cuando una mamá del vecindario ve su mensaje, piensa: “esto es exactamente lo que necesito”. Y eso lo cambia todo.",
        en: "Let me introduce you to Rosa. Rosa is an example we made up for this lesson, but you probably know someone just like her. Rosa bakes cakes that everybody raves about. At every family birthday, someone tells her: “Rosa, you should be selling these.” So one day she goes for it. She opens a social media page and writes: “Cakes for every occasion. I make everything, for everyone.” And what happens? Almost nothing. One person writes wanting a hundred cupcakes by tomorrow. Another wants a five-tier wedding cake, at a discount. Another just asks the price and disappears. Rosa ends the week tired, not knowing what to buy, what to charge, or what to post. And she starts to think that maybe her business just doesn't work. But one day, Rosa does something very simple. She sits down and looks at who has actually bought from her in the last two months. And she notices a pattern. Most of them are moms and dads from her own neighborhood. Almost all of them ask for the same thing: a custom birthday cake, with the child's name and favorite character. Almost all of them message her on WhatsApp. And almost all of them give her two or three days' notice, because they already looked at the supermarket and couldn't find anything special. Rosa didn't change her recipe. She changed her message. Now her page says: “Custom birthday cakes for families in this neighborhood. Order by WhatsApp with two or three days' notice.” Did she stop selling to everyone else? No. If someone asks for something different and she can make it, she makes it. But now, when a mom from the neighborhood sees her message, she thinks: “this is exactly what I need.” And that changes everything.",
      },
    },
    {
      id: "concept",
      kind: "concept",
      title: { es: "La idea central", en: "The core idea" },
      text: {
        es: "Vamos a ponerle nombre a lo que hizo Rosa. Cuando le hablas a todo el mundo, tu mensaje tiene que ser tan general que no le dice nada especial a nadie. Es como hablar en una plaza llena: mucha gente te oye, pero nadie siente que le hablas a él. En cambio, cuando sabes quién te necesita más, puedes hablarle de su problema con sus propias palabras. Y fíjate en algo importante: enfocarte no significa rechazar a nadie. Significa saber a quién le hablas primero. Esa claridad te ayuda en tres cosas muy prácticas. Una: tus mensajes. Sabes qué decir y qué foto poner. Dos: tus precios. Entiendes qué valora esa persona y por qué estaría dispuesta a pagarlo. Y tres: tus decisiones. Sabes dónde anunciarte, qué ofrecer primero y a qué decirle que no por ahora. Un cliente bien descrito tiene cuatro partes. Quién es. Qué problema tiene. Dónde lo encuentras. Y por qué te elegiría a ti. Quién, problema, dónde, y por qué tú. Dilo conmigo: quién, problema, dónde, y por qué tú.",
        en: "Let's put a name on what Rosa did. When you speak to everyone, your message has to be so general that it says nothing special to anyone. It's like talking in a crowded plaza: lots of people hear you, but nobody feels you're talking to them. But when you know who needs you most, you can talk about their problem in their own words. And notice something important: focusing does not mean refusing anyone. It means knowing who you speak to first. That clarity helps you with three very practical things. One: your messages. You know what to say and which photo to post. Two: your prices. You understand what that person values and why they would be willing to pay for it. And three: your decisions. You know where to advertise, what to offer first, and what to say no to for now. A well-described customer has four parts. Who they are. What problem they have. Where you find them. And why they would choose you. Who, problem, where, and why you. Say it with me: who, problem, where, and why you.",
      },
    },
    {
      id: "reflect",
      kind: "reflect",
      title: { es: "Piénsalo un momento", en: "Think about it for a moment" },
      text: {
        es: "Ahora te toca a ti. Piensa en las últimas tres personas que te compraron. O, si todavía no vendes, en las tres personas que más interés han mostrado en tu idea. No las que te gustaría tener: las reales. ¿Qué tienen en común? ¿Qué problema querían resolver? Te dejo unos segundos para pensarlo.",
        en: "Now it's your turn. Think about the last three people who bought from you. Or, if you're not selling yet, the three people who have shown the most interest in your idea. Not the ones you wish you had: the real ones. What do they have in common? What problem were they trying to solve? I'll give you a few seconds to think about it.",
      },
      pauseSeconds: 6,
    },
    {
      id: "action",
      kind: "action",
      title: { es: "Tu acción de hoy", en: "Your action for today" },
      text: {
        es: "Tu acción de hoy es pequeña, pero poderosa. Completa esta frase con tus propias palabras: “Ayudo a… con… en… ofreciendo… Y me eligen porque…”. Por ejemplo, Rosa diría: “Ayudo a familias de mi vecindario con el pastel de cumpleaños de sus hijos, ofreciendo pasteles personalizados, y me eligen porque los hago a su gusto con pocos días de aviso”. Tu primera versión no tiene que ser perfecta. De hecho, no lo será. Es una suposición, y las suposiciones se comprueban. Por eso, esta semana, habla con tres clientes reales, o con tres personas que podrían serlo, y pregúntales por qué te compraron, o qué les haría comprarte. Lo que ellos te digan vale más que cualquier cosa que tú o yo imaginemos.",
        en: "Your action for today is small, but powerful. Finish this sentence in your own words: “I help… with… in… by offering… And they choose me because…”. For example, Rosa would say: “I help families in my neighborhood with their kids' birthday cake by offering custom cakes, and they choose me because I make them the way they want with just a few days' notice.” Your first version doesn't have to be perfect. In fact, it won't be. It's an assumption, and assumptions get checked. So this week, talk with three real customers, or three people who could become one, and ask why they bought from you, or what would make them buy. What they tell you is worth more than anything you or I could imagine.",
      },
    },
    {
      id: "parked",
      kind: "parked",
      title: { es: "Para cuando tengas calma", en: "For when you have a quiet moment" },
      text: {
        es: "Una cosa más. Cuando estés estacionado, o ya en casa, con calma, abre esta lección en tu teléfono o en tu computadora. Ahí vas a encontrar un ejercicio para armar tu frase paso a paso, y una pregunta lista para copiar en el asistente de inteligencia artificial que tú prefieras. Esa pregunta le pide a la IA que primero te haga preguntas a ti, y que no invente nada sobre tus clientes. Recuerda nuestra regla: la IA ayuda, tú verificas. Y un cuidado importante: nunca le pegues a una IA nombres completos, teléfonos ni direcciones de tus clientes. Pero todo eso es para después. Si vas manejando, ahorita solo escucha.",
        en: "One more thing. When you're parked, or back at home, with a calm moment, open this lesson on your phone or your computer. There you'll find an exercise to build your sentence step by step, and a question that's ready to copy into whichever artificial intelligence assistant you prefer. That question asks the AI to ask you questions first, and not to invent anything about your customers. Remember our rule: AI helps, you verify. And one important caution: never paste your customers' full names, phone numbers, or addresses into an AI. But all of that is for later. If you're driving, for now just listen.",
      },
    },
    {
      id: "recap",
      kind: "recap",
      title: { es: "Repaso", en: "Recap" },
      text: {
        es: "Repasemos. Uno: tu cliente no es todo el mundo. Cuando le hablas a todos, nadie se siente aludido. Dos: enfocarte no es rechazar; es saber a quién le hablas primero. Tres: un cliente claro tiene cuatro partes: quién, problema, dónde, y por qué tú. Y cuatro: tu descripción es una suposición hasta que la compruebas hablando con personas reales.",
        en: "Let's recap. One: your customer is not everyone. When you speak to all, nobody feels spoken to. Two: focusing is not refusing; it's knowing who you speak to first. Three: a clear customer has four parts: who, problem, where, and why you. And four: your description is an assumption until you check it by talking with real people.",
      },
    },
    {
      id: "next",
      kind: "next",
      title: { es: "Lo que sigue", en: "What comes next" },
      text: {
        es: "La siguiente lección de tu ruta te va a ayudar a usar lo que acabas de aprender, porque casi todo en un negocio se vuelve más fácil cuando sabes a quién sirves. Gracias por aprender con Leonix. Un negocio se construye así: un paso claro a la vez. Nos escuchamos en la siguiente lección.",
        en: "The next lesson on your path will help you use what you just learned, because almost everything in a business gets easier once you know who you serve. Thank you for learning with Leonix. A business is built like this: one clear step at a time. I'll talk to you in the next lesson.",
      },
    },
  ],
};
