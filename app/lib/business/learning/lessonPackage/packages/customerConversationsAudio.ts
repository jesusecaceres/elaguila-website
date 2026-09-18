/**
 * Gate G4-I1 — LISTEN script for "Habla con clientes reales". Written for the ear (Bible §17): a
 * rehearsal of asking instead of pitching, useful with no screen at all. The only screen
 * instruction lives in the "parked" segment. No recording exists: `assets` is intentionally
 * absent, so no player is rendered. "Rosa" is an invented, illustrative example and the script says so.
 */
import type { LessonAudio } from "../types";

export const CUSTOMER_CONVERSATIONS_AUDIO: LessonAudio = {
  scriptVersion: 1,
  estimatedMinutes: 7,
  segments: [
    {
      id: "hook",
      kind: "hook",
      title: { es: "El “sí” que no sirve", en: "The “yes” that is worth nothing" },
      text: {
        es: "Hola, qué gusto tenerte aquí. Imagina esto: le cuentas tu idea de negocio a tu tía, con todo el entusiasmo del mundo, y al final le preguntas: “¿verdad que me comprarías?”. ¿Qué te va a contestar? Que sí. Claro que sí. No porque te esté mintiendo, sino porque te quiere. Ahora la pregunta difícil: ¿ese “sí” paga la renta? No. Hoy vamos a aprender a conseguir algo que vale mucho más que un “sí”: la verdad. Y la verdad se consigue preguntando, no vendiendo.",
        en: "Hi, so glad to have you here. Picture this: you tell your aunt about your business idea, with all the excitement in the world, and at the end you ask: “you'd buy from me, right?” What is she going to say? Yes. Of course yes. Not because she's lying, but because she loves you. Now the hard question: does that “yes” pay the rent? No. Today we're going to learn how to get something worth far more than a “yes”: the truth. And you get the truth by asking, not by pitching.",
      },
    },
    {
      id: "learn",
      kind: "learn",
      title: { es: "Lo que vas a aprender", en: "What you'll learn" },
      text: {
        es: "Al terminar vas a poder hacer tres cosas: hacerle preguntas útiles a tres personas reales sin venderles nada; escuchar y quedarte con sus palabras exactas; y ajustar lo que creías de tu cliente con lo que aprendiste. Esto sirve si apenas tienes una idea, si estás empezando, y también si llevas años con tu negocio. De hecho, casi todas las lecciones de este Centro terminan diciéndote “compruébalo con personas reales”. Esta lección es el cómo.",
        en: "By the end you'll be able to do three things: ask three real people useful questions without selling them anything; listen and hold on to their exact words; and update what you believed about your customer with what you learned. This works if all you have is an idea, if you're just starting, and also if you've been in business for years. In fact, almost every lesson in this Center ends by telling you to “check it with real people.” This lesson is the how.",
      },
    },
    {
      id: "story",
      kind: "story",
      title: { es: "Rosa y sus tres vecinas", en: "Rosa and her three neighbors" },
      text: {
        es: "Te cuento un ejemplo inventado. Rosa hace pasteles, y cree que las familias de su vecindario necesitan pasteles de cumpleaños personalizados. Pudo haber ido con sus vecinas a preguntarles “¿me comprarías un pastel?”. Pero hizo otra cosa. A cada una le dijo: “Cuéntame del último cumpleaños que organizaste. ¿Cómo le hiciste con el pastel?”. Y se calló. La primera le contó que lo compró en el supermercado, de última hora, porque ya no había tiempo. La segunda, igual: corriendo, un día antes. La tercera sí lo encargó, con una semana de anticipación, y pagó más. ¿Sabes qué no mencionó ninguna? El sabor. ¿Sabes qué mencionaron las tres? Las prisas. Rosa creía que su ventaja era lo rico de sus pasteles. Sus vecinas le enseñaron, sin saberlo, que el verdadero problema era el tiempo.",
        en: "Here's a made-up example. Rosa bakes cakes, and she believes the families in her neighborhood need custom birthday cakes. She could have gone to her neighbors and asked, “would you buy a cake from me?” But she did something else. She said to each one: “Tell me about the last birthday you organized. How did you handle the cake?” And then she stopped talking. The first told her she bought it at the supermarket, last minute, because there was no time left. The second, the same: rushing, the day before. The third did order one, a week ahead, and paid more. Do you know what none of them mentioned? Flavor. Do you know what all three mentioned? Being rushed. Rosa thought her advantage was how good her cakes taste. Her neighbors taught her, without knowing it, that the real problem was time.",
      },
    },
    {
      id: "concept",
      kind: "concept",
      title: { es: "El pasado es un hecho, el futuro es una opinión", en: "The past is a fact, the future is an opinion" },
      text: {
        es: "Quédate con esta idea: el pasado es un hecho, el futuro es una opinión. Cuando preguntas “¿comprarías…?”, le pides a la persona que adivine. Y la gente adivina mal, y además adivina con amabilidad. Cuando preguntas “¿qué hiciste la última vez que te pasó?”, le pides que recuerde. Y eso sí lo sabe. Entonces, tres reglas sencillas. Una: pregunta por la última vez que les pasó. Dos: pregunta qué hicieron, cuánto les costó y qué fue lo más molesto. Y tres: tú hablas poco. No interrumpas, no corrijas y, sobre todo, no defiendas tu idea. Si te preguntan qué andas haciendo, di la verdad: que estás aprendiendo cómo la gente resuelve esto, y que con gusto les cuentas después. Y una cosa más: tres conversaciones no comprueban un mercado. Son una señal. Pero una señal a tiempo te puede ahorrar meses y mucho dinero.",
        en: "Hold on to this idea: the past is a fact, the future is an opinion. When you ask “would you buy…?”, you're asking the person to guess. And people guess badly — and they guess kindly. When you ask “what did you do the last time this happened?”, you're asking them to remember. And that they do know. So, three simple rules. One: ask about the last time it happened to them. Two: ask what they did, what it cost them, and what was most annoying. And three: you speak very little. Don't interrupt, don't correct, and above all, don't defend your idea. If they ask what you're up to, tell the truth: that you're learning how people handle this, and you'll gladly tell them more later. One more thing: three conversations don't prove a market. They're a signal. But a signal in time can save you months and a lot of money.",
      },
    },
    {
      id: "reflect",
      kind: "reflect",
      title: { es: "Piensa en tres personas", en: "Think of three people" },
      text: {
        es: "Ahora tú. Piensa en tres personas con las que podrías hablar esta semana. Ojalá no todas sean familia: busca al menos una que no tenga motivos para quedar bien contigo. Te dejo unos segundos. ¿Quiénes son?",
        en: "Now you. Think of three people you could talk with this week. Ideally not all family: look for at least one who has no reason to be nice to you. I'll give you a few seconds. Who are they?",
      },
      pauseSeconds: 8,
    },
    {
      id: "action",
      kind: "action",
      title: { es: "Ensaya tu primera pregunta", en: "Rehearse your first question" },
      text: {
        es: "Vamos a ensayar en voz alta. Primero, cómo pedir el tiempo. Repite conmigo: “Estoy aprendiendo cómo la gente resuelve esto. ¿Me regalas diez minutos? No te voy a vender nada”. Bien. Ahora tu primera pregunta. Empieza con “Cuéntame de la última vez que…” y termina con el problema que te interesa. Dila en voz alta. ¿Se te coló tu producto en la pregunta? Quítalo. ¿Empezaste con “¿comprarías…?” o “¿te gustaría…?”? Cámbiala por algo que ya pasó. Y decide ahora mismo una cosa más: ¿qué tendrías que escuchar para cambiar de opinión? Si lo decides antes, no te vas a hacer trampa después.",
        en: "Let's rehearse out loud. First, how to ask for the time. Repeat after me: “I'm learning how people handle this. Could I have ten minutes? I'm not going to sell you anything.” Good. Now your first question. Start with “Tell me about the last time you…” and end with the problem you care about. Say it out loud. Did your product sneak into the question? Take it out. Did you start with “would you buy…?” or “would you like…?” Swap it for something that already happened. And decide one more thing right now: what would you have to hear to change your mind? If you decide it beforehand, you won't cheat yourself afterwards.",
      },
    },
    {
      id: "parked",
      kind: "parked",
      title: { es: "Cuando estés estacionado o en casa", en: "When you're parked or at home" },
      text: {
        es: "Cuando estés estacionado o en casa, abre la lección y ve a “Tu turno”. Ahí armas tu plan de tres conversaciones: qué quieres aprender, con quién vas a hablar, dónde, tus preguntas, y qué te haría cambiar de opinión. Describe a las personas por su situación, nunca por su nombre. Más abajo hay tres conversaciones para tu asistente de inteligencia artificial: una mejora tus preguntas, otra te deja ensayar, y otra te ayuda a ordenar tus notas después. Pero ojo: lo que la IA conteste en un ensayo es inventado. Sirve para practicar, no para decidir.",
        en: "When you're parked or at home, open the lesson and go to “Your turn.” That's where you build your three-conversation plan: what you want to learn, who you'll talk to, where, your questions, and what would change your mind. Describe people by their situation, never by name. Further down there are three conversations for your AI assistant: one improves your questions, one lets you rehearse, and one helps you organize your notes afterwards. But careful: whatever the AI answers in a rehearsal is made up. It's for practice, not for deciding.",
      },
    },
    {
      id: "recap",
      kind: "recap",
      title: { es: "Para que no se te olvide", en: "So you don't forget" },
      text: {
        es: "Repasemos. Pregunta, no vendas: un cumplido no es evidencia. Pregunta por lo que ya pasó, porque el pasado es un hecho y el futuro es una opinión. Y escucha: anota sus palabras exactas, sin nombres, y decide de antemano qué te haría cambiar de opinión.",
        en: "Let's review. Ask, don't pitch: a compliment is not evidence. Ask about what already happened, because the past is a fact and the future is an opinion. And listen: write down their exact words, without names, and decide in advance what would change your mind.",
      },
    },
    {
      id: "next",
      kind: "next",
      title: { es: "Tu siguiente paso", en: "Your next step" },
      text: {
        es: "Tu tarea: tres conversaciones de diez minutos, esta semana. No el próximo mes. Esta semana. Después de cada una, anota lo que escuchaste y regresa a tu frase de cliente para ajustarla con sus palabras. La IA ayuda. Tú verificas. Y verificar es exactamente esto. Nos escuchamos en la siguiente lección.",
        en: "Your task: three ten-minute conversations, this week. Not next month. This week. After each one, write down what you heard and go back to your customer sentence to adjust it with their words. AI helps. You verify. And verifying is exactly this. I'll talk to you in the next lesson.",
      },
    },
  ],
};
