/**
 * Gate G4-I1 — LISTEN script for "Qué problema resuelves". Written for the ear (Bible §17): it is
 * NOT a reading of the page and stays useful with no screen at all. The only screen instruction
 * lives in the "parked" segment. No recording exists: `assets` is intentionally absent, so no
 * player is rendered. "Marco" is an invented, illustrative example and the script says so.
 */
import type { LessonAudio } from "../types";

export const WHAT_PROBLEM_DO_YOU_SOLVE_AUDIO: LessonAudio = {
  scriptVersion: 1,
  estimatedMinutes: 7,
  segments: [
    {
      id: "hook",
      kind: "hook",
      title: { es: "Nadie se despierta queriendo tu producto", en: "Nobody wakes up wanting your product" },
      text: {
        es: "Hola, qué bueno que estás aquí. Quiero empezar con una idea que al principio incomoda un poco: nadie se despierta en la mañana queriendo tu producto. Nadie. La gente se despierta pensando en sus propios asuntos: en que no le alcanza el tiempo, en que algo se descompuso, en que el sábado hay fiesta y no tiene pastel. La gente se despierta con problemas. Y un negocio, en el fondo, es eso: alguien que le quita un problema de encima a otra persona, y cobra por hacerlo. En esta lección vamos a buscar ese problema. El tuyo. Bueno, el de tu cliente.",
        en: "Hi, I'm glad you're here. I want to start with an idea that feels a little uncomfortable at first: nobody wakes up in the morning wanting your product. Nobody. People wake up thinking about their own lives: that there isn't enough time, that something broke, that there's a party on Saturday and no cake. People wake up with problems. And a business, deep down, is just that: someone who takes a problem off another person's hands, and gets paid for it. In this lesson we're going to look for that problem. Yours. Well — your customer's.",
      },
    },
    {
      id: "learn",
      kind: "learn",
      title: { es: "Lo que vas a aprender", en: "What you'll learn" },
      text: {
        es: "Al terminar vas a poder hacer tres cosas. Uno: decir el problema con las palabras de tu cliente, no con las tuyas. Dos: notar la diferencia entre un problema y una idea de producto, que se parecen mucho pero no son lo mismo. Y tres: nombrar a quién le duele más ese problema y qué hace hoy para resolverlo. No necesitas tener un negocio funcionando. Sirve igual si apenas tienes una idea.",
        en: "By the end you'll be able to do three things. One: say the problem in your customer's words, not your own. Two: notice the difference between a problem and a product idea, which look alike but are not the same thing. And three: name who feels that problem most, and what they do about it today. You don't need a running business for this. It works just as well if all you have is an idea.",
      },
    },
    {
      id: "story",
      kind: "story",
      title: { es: "La historia de Marco", en: "Marco's story" },
      text: {
        es: "Te cuento un ejemplo inventado, para que se entienda. Marco quiere empezar una lavandería móvil: recoge tu ropa, la lava y te la devuelve doblada. Cuando le preguntaban por qué iba a funcionar, Marco decía: “porque todo el mundo odia lavar”. Suena lógico, ¿verdad? Pero “todo el mundo” no es nadie. Un día Marco se hizo otra pregunta: ¿a quién le he visto yo este problema, de verdad? Y pensó en su hermana, que es enfermera. Turnos de doce horas. Cada semana junta la ropa hasta su único día libre, y ese día se lo pasa en la lavandería. Su hermana no necesita “ropa limpia”. Lo que necesita es recuperar su día de descanso. ¿Notas la diferencia? El servicio de Marco es el mismo. Pero ahora sabe qué problema resuelve, a quién, y cada cuánto.",
        en: "Here's a made-up example, to make it clear. Marco wants to start a mobile laundry: he picks up your clothes, washes them, and brings them back folded. When people asked why it would work, Marco said: “because everybody hates doing laundry.” Sounds logical, right? But “everybody” is nobody. One day Marco asked himself a different question: who have I actually seen with this problem? And he thought of his sister, who is a nurse. Twelve-hour shifts. Every week she piles up laundry until her one day off, and she spends that day at the laundromat. His sister doesn't need “clean clothes.” What she needs is her day of rest back. Do you hear the difference? Marco's service is the same. But now he knows what problem he solves, for whom, and how often.",
      },
    },
    {
      id: "concept",
      kind: "concept",
      title: { es: "Las tres señales de un problema de verdad", en: "The three signs of a real problem" },
      text: {
        es: "Un producto es tu respuesta. El problema es la pregunta de tu cliente. Y para saber si el problema es de verdad, busca tres señales. Primera: le pasa a alguien en concreto. No a “la gente”; a alguien que puedes describir. Segunda: pasa seguido. Un problema que aparece cada semana sostiene un negocio; uno que aparece una vez en la vida, difícilmente. Y tercera, la más importante: esa persona ya hace algo para resolverlo. A lo mejor lo resuelve a medias: improvisa, paga de más, pierde tiempo, o simplemente se aguanta. Eso que hace hoy es tu mejor pista. Te dice cuánto le importa, y también con qué vas a competir. Y fíjate en algo: si nadie hace nada al respecto, quizá el problema no es tan grande como tú crees. Eso también es una buena noticia, porque lo descubres antes de gastar.",
        en: "A product is your answer. The problem is your customer's question. And to know whether the problem is real, look for three signs. First: it happens to someone specific. Not to “people”; to someone you can describe. Second: it happens often. A problem that shows up every week can sustain a business; one that shows up once in a lifetime, hardly. And third, the most important: that person already does something about it. Maybe they only half solve it: they improvise, overpay, lose time, or just put up with it. Whatever they do today is your best clue. It tells you how much it matters to them, and also what you'll be competing with. And notice something: if nobody does anything about it, maybe the problem isn't as big as you think. That's good news too, because you find out before you spend.",
      },
    },
    {
      id: "reflect",
      kind: "reflect",
      title: { es: "Piénsalo un momento", en: "Think about it for a moment" },
      text: {
        es: "Ahora tú. Piensa en una persona real, alguien que conoces, que tenga el problema que tu idea resuelve. No un grupo: una persona. ¿Cuándo fue la última vez que le pasó? ¿Qué hizo? Te dejo unos segundos para pensarlo.",
        en: "Now you. Think of one real person, someone you know, who has the problem your idea solves. Not a group: one person. When was the last time it happened to them? What did they do? I'll give you a few seconds to think.",
      },
      pauseSeconds: 8,
    },
    {
      id: "action",
      kind: "action",
      title: { es: "Tu frase, en voz alta", en: "Your sentence, out loud" },
      text: {
        es: "Si te vino alguien a la mente, vas muy bien. Ahora intenta decirlo en voz alta, sin mencionar tu producto. Así: “Para tal persona, el problema es tal cosa. Le pasa cada tanto. Hoy lo resuelve de esta manera, y le cuesta esto”. Inténtalo. Si en la frase se te cuela tu producto —“el problema es que no hay una lavandería móvil”—, quítalo. Si al quitarlo el problema desaparece, todavía estás describiendo lo que quieres vender, no lo que le pasa a la persona. No pasa nada: vuelve a intentarlo pensando en su día, no en tu negocio.",
        en: "If someone came to mind, you're doing great. Now try to say it out loud, without mentioning your product. Like this: “For this person, the problem is this. It happens this often. Today they handle it this way, and it costs them this.” Try it. If your product sneaks into the sentence — “the problem is that there's no mobile laundry” — take it out. If the problem disappears when you remove it, you're still describing what you want to sell, not what happens to the person. That's fine: try again, thinking about their day, not your business.",
      },
    },
    {
      id: "parked",
      kind: "parked",
      title: { es: "Cuando estés estacionado o en casa", en: "When you're parked or at home" },
      text: {
        es: "Cuando estés estacionado o en casa, abre la lección y busca la parte que dice “Tu turno”. Ahí hay cinco preguntas cortas, y con tus respuestas se arma tu frase del problema. Solo usa tus palabras; no inventa nada. Y más abajo vas a encontrar tres conversaciones listas para copiar y pegar en el asistente de inteligencia artificial que tú prefieras. Ojo con esto: ninguna le pide a la IA que decida si tu idea es buena. Una IA no sabe si tu problema existe. Eso solo te lo puede decir la gente.",
        en: "When you're parked or at home, open the lesson and find the part called “Your turn.” There are five short questions there, and your answers build your problem sentence. It only uses your words; it doesn't make anything up. Further down you'll find three conversations ready to copy and paste into whichever AI assistant you prefer. One thing to notice: none of them asks the AI to decide whether your idea is good. An AI can't know whether your problem exists. Only people can tell you that.",
      },
    },
    {
      id: "recap",
      kind: "recap",
      title: { es: "Para que no se te olvide", en: "So you don't forget" },
      text: {
        es: "Repasemos. Nadie se despierta queriendo tu producto; la gente paga por quitarse un problema de encima. Un problema de verdad tiene tres señales: le pasa a alguien concreto, pasa seguido, y esa persona ya hace algo al respecto. Y tu frase del problema es una hipótesis: algo que crees, no algo que ya comprobaste.",
        en: "Let's review. Nobody wakes up wanting your product; people pay to get a problem off their hands. A real problem has three signs: it happens to someone specific, it happens often, and that person already does something about it. And your problem sentence is a hypothesis: something you believe, not something you've proven.",
      },
    },
    {
      id: "next",
      kind: "next",
      title: { es: "Tu siguiente paso", en: "Your next step" },
      text: {
        es: "Tu tarea para esta semana es sencilla: pregúntale a tres personas por la última vez que les pasó ese problema. Sin mencionar tu idea. Solo escucha qué hicieron y cuánto les costó. Si lo reconocen, vas por buen camino. Si no, ajusta tu frase antes de gastar un solo peso. La IA ayuda. Tú verificas. Nos escuchamos en la siguiente lección.",
        en: "Your task for this week is simple: ask three people about the last time that problem happened to them. Without mentioning your idea. Just listen to what they did and what it cost them. If they recognize it, you're on the right track. If not, adjust your sentence before you spend a single dollar. AI helps. You verify. I'll talk to you in the next lesson.",
      },
    },
  ],
};
