/**
 * Gate G4-I1 — LISTEN script for "Conoce a tu competencia". Written for the ear (Bible §17); useful
 * with no screen at all. The only screen instruction lives in the "parked" segment. No recording
 * exists: `assets` is intentionally absent, so no player is rendered. "Marco" is an invented,
 * illustrative example and the script says so.
 */
import type { LessonAudio } from "../types";

export const KNOW_YOUR_COMPETITION_AUDIO: LessonAudio = {
  scriptVersion: 1,
  estimatedMinutes: 7,
  segments: [
    {
      id: "hook",
      kind: "hook",
      title: { es: "“Yo no tengo competencia”", en: "“I have no competition”" },
      text: {
        es: "Hola, qué gusto que sigas aquí. Hay una frase que escucho mucho de personas que están empezando un negocio: “es que yo no tengo competencia”. Y lo dicen contentos. Pero piénsalo un momento. Si tu cliente tiene un problema, y tú todavía no existes para él… ¿qué hace hoy? Algo hace. Lo resuelve él mismo, se lo pide a un familiar, va a otro lado, o simplemente se aguanta. Tu cliente ya resuelve esto sin ti. Y eso que hace hoy, sea lo que sea, es tu competencia. Hoy vamos a aprender a verla con claridad, y con honestidad.",
        en: "Hi, glad you're still here. There's a sentence I hear a lot from people starting a business: “the thing is, I have no competition.” And they say it happily. But think about it for a moment. If your customer has a problem, and you don't exist for them yet… what do they do today? They do something. They handle it themselves, ask a relative, go somewhere else, or just put up with it. Your customer already solves this without you. And whatever they do today is your competition. Today we're going to learn to see it clearly, and honestly.",
      },
    },
    {
      id: "learn",
      kind: "learn",
      title: { es: "Lo que vas a aprender", en: "What you'll learn" },
      text: {
        es: "Al terminar vas a poder hacer tres cosas. Uno: enumerar las alternativas reales de tu cliente, incluyendo dos que casi todos olvidan: “no hacer nada” y “hacerlo uno mismo”. Dos: compararlas en lo que a tu cliente le importa, no en lo que te importa a ti. Y tres: encontrar un espacio donde puedes ser claramente mejor, sin copiar a nadie y sin hablar mal de nadie.",
        en: "By the end you'll be able to do three things. One: list your customer's real alternatives, including two that almost everyone forgets: “do nothing” and “do it yourself.” Two: compare them on what your customer cares about, not on what you care about. And three: find a space where you can be clearly better, without copying anyone and without speaking badly of anyone.",
      },
    },
    {
      id: "story",
      kind: "story",
      title: { es: "Marco visita la lavandería", en: "Marco visits the laundromat" },
      text: {
        es: "Un ejemplo inventado. Marco quiere empezar una lavandería móvil, y estaba seguro de que no tenía competencia, porque en su zona nadie más recoge la ropa a domicilio. Pero sus posibles clientas son enfermeras con turnos largos, y hoy su ropa no se queda sucia. Entonces Marco hizo una lista de lo que hacen hoy: van a la lavandería de monedas en su día libre; lavan en casa de un familiar; o usan la lavadora del edificio a medianoche. Y luego hizo algo muy sencillo: un domingo fue a la lavandería de monedas, como cualquier cliente. ¿Qué vio? Que era barata. Muy barata. Pero estaba llena, y había que esperar dos horas. Ahí Marco entendió algo importante: nunca le iba a ganar en precio. Pero no necesitaba ganarle en precio. Su espacio era otro: devolverle a esa enfermera su día libre.",
        en: "A made-up example. Marco wants to start a mobile laundry, and he was sure he had no competition, because nobody else in his area picks up laundry at home. But his possible customers are nurses on long shifts, and today their clothes don't stay dirty. So Marco listed what they do now: they go to the coin laundromat on their day off; they do laundry at a relative's house; or they use the building's washer at midnight. And then he did something very simple: one Sunday he went to the coin laundromat, like any customer. What did he see? That it was cheap. Very cheap. But it was crowded, and there was a two-hour wait. That's when Marco understood something important: he would never beat it on price. But he didn't need to beat it on price. His space was something else: giving that nurse her day off back.",
      },
    },
    {
      id: "concept",
      kind: "concept",
      title: { es: "Enumera, compara, encuentra tu espacio", en: "List, compare, find your space" },
      text: {
        es: "El método tiene tres pasos. Primero, enumera: todo lo que tu cliente usa hoy, y no olvides “no hacer nada” y “hacerlo uno mismo”. La costumbre suele ser el competidor más fuerte, porque es gratis y ya la conocen. Segundo, compara, pero compara en lo que a tu cliente le importa: precio, comodidad, confianza, rapidez. Si no sabes qué le importa más, no adivines: pregúntale. Y tercero, encuentra tu espacio: algo que a tu cliente le importa y que las alternativas no le dan. No tienes que ser mejor en todo. Ahora, dos advertencias. La primera: investiga como un cliente honesto. Usa lo que cualquiera puede ver: visita, observa, lee precios y horarios públicos. No engañes a nadie y no copies. La segunda: no le pidas a una inteligencia artificial “los datos de tu competencia”. No conoce tu barrio. Puede inventar negocios, precios y reseñas, y decírtelo con toda seguridad. La IA te puede ayudar a planear qué observar. Los datos los consigues tú.",
        en: "The method has three steps. First, list: everything your customer uses today, and don't forget “do nothing” and “do it yourself.” Habit is often the strongest competitor, because it's free and already familiar. Second, compare — but compare on what your customer cares about: price, convenience, trust, speed. If you don't know what matters most to them, don't guess: ask. And third, find your space: something your customer cares about that the alternatives don't give them. You don't have to be better at everything. Now, two warnings. The first: research like an honest customer. Use what anyone can see: visit, observe, read public prices and hours. Don't deceive anyone and don't copy. The second: don't ask an artificial intelligence for “facts about your competitors.” It doesn't know your neighborhood. It can invent businesses, prices, and reviews, and tell you with total confidence. AI can help you plan what to observe. You get the facts yourself.",
      },
    },
    {
      id: "reflect",
      kind: "reflect",
      title: { es: "¿Qué hace hoy tu cliente?", en: "What does your customer do today?" },
      text: {
        es: "Ahora tú. Piensa en tu cliente, en esa persona concreta. Cuando le pasa el problema que tú quieres resolver… ¿qué hace hoy? Trata de pensar en tres cosas distintas. Te dejo unos segundos.",
        en: "Now you. Think about your customer, that specific person. When the problem you want to solve happens to them… what do they do today? Try to think of three different things. I'll give you a few seconds.",
      },
      pauseSeconds: 8,
    },
    {
      id: "action",
      kind: "action",
      title: { es: "Dilo en voz alta", en: "Say it out loud" },
      text: {
        es: "Ahora dilo en voz alta: “Hoy mi cliente lo resuelve de estas tres maneras…”, y nómbralas. ¿Alguna es “no hacer nada” o “hacerlo él mismo”? Si no, agrégala. Después completa esta otra frase: “Lo que más le importa a mi cliente al elegir es…”. Y si en este momento te das cuenta de que no lo sabes con certeza, perfecto: acabas de encontrar lo primero que tienes que averiguar. Anótalo mentalmente como “por averiguar”. Eso también es un resultado.",
        en: "Now say it out loud: “Today my customer handles it in these three ways…”, and name them. Is one of them “do nothing” or “do it themselves”? If not, add it. Then finish this other sentence: “What my customer cares about most when choosing is…”. And if right now you realize you don't know for sure, perfect: you've just found the first thing you need to find out. Make a mental note: “to find out.” That's a result too.",
      },
    },
    {
      id: "parked",
      kind: "parked",
      title: { es: "Cuando estés estacionado o en casa", en: "When you're parked or at home" },
      text: {
        es: "Cuando estés estacionado o en casa, abre la lección y ve a “Tu turno”. Ahí armas tu comparación: qué le importa a tu cliente, tres alternativas con lo que tú observaste de cada una, y dónde crees que puedes ser mejor. Escribe solo lo que viste o lo que te contaron tus clientes. Más abajo hay tres conversaciones para tu asistente de inteligencia artificial. Ninguna le pide datos de otros negocios: le piden ayudarte a planear tu investigación y a leer tu propia comparación.",
        en: "When you're parked or at home, open the lesson and go to “Your turn.” That's where you build your comparison: what your customer cares about, three alternatives with what you observed about each one, and where you think you can be better. Write only what you saw or what your customers told you. Further down there are three conversations for your AI assistant. None of them asks for facts about other businesses: they ask it to help you plan your research and read your own comparison.",
      },
    },
    {
      id: "recap",
      kind: "recap",
      title: { es: "Para que no se te olvide", en: "So you don't forget" },
      text: {
        es: "Repasemos. Tu competencia es todo lo que tu cliente hace hoy en lugar de comprarte, incluso no hacer nada. Compara en lo que a tu cliente le importa, con lo que tú mismo observaste, y con honestidad. Y no necesitas ser mejor en todo: necesitas ser claramente mejor en algo que importa.",
        en: "Let's review. Your competition is everything your customer does today instead of buying from you, including doing nothing. Compare on what your customer cares about, with what you observed yourself, and honestly. And you don't need to be better at everything: you need to be clearly better at something that matters.",
      },
    },
    {
      id: "next",
      kind: "next",
      title: { es: "Tu siguiente paso", en: "Your next step" },
      text: {
        es: "Tu tarea para esta semana: visita u observa una alternativa, como lo haría un cliente, y pregúntale a tres personas qué usan hoy y qué les gusta y les molesta de esa opción. Anota la fecha, porque todo esto cambia. La IA ayuda. Tú verificas. Nos escuchamos en la siguiente lección.",
        en: "Your task for this week: visit or observe one alternative, the way a customer would, and ask three people what they use today and what they like and dislike about that option. Write down the date, because all of this changes. AI helps. You verify. I'll talk to you in the next lesson.",
      },
    },
  ],
};
