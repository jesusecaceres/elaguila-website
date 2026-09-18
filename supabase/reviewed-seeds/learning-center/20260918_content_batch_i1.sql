-- =============================================================================
-- Leonix Learning Center — CONTENT SEED, Idea batch I-1 (Gate G4-I1)
-- =============================================================================
-- GENERATED FILE. Do not edit by hand:
--   npx tsx scripts/generate-learning-content-seed-i1.ts --write
--
-- DATA ONLY. No DDL: no table, column, constraint, index, policy or function is created or
-- changed. Touches exactly three tables that already exist (TODAY-1 foundation):
--   business_learning_lessons · business_learning_categories · business_learning_resources
--
-- REVIEWED SEED — NOT A MIGRATION. This file lives in supabase/reviewed-seeds/ on purpose:
-- nothing applies it automatically. DO NOT move it into supabase/migrations/ and DO NOT use a
-- blind `supabase db push` for it. Apply it explicitly, to a project you have verified, following
-- docs/learning-center-i1-staging-apply-runbook.md.
--
-- REVIEW BEFORE APPLYING (owner decision OD-2): staging first, never straight to production.
-- Authoring this file did NOT apply it. Applying it PUBLISHES three lessons.
--
-- Part A — three new published lessons (additive; ON CONFLICT DO NOTHING):
--   what_problem_do_you_solve
--   customer_conversations
--   know_your_competition
--   Each body is the plain-text rendition of the validated LessonPackage in
--   app/lib/business/learning/lessonPackage/packages/ — the same source the page renders.
--
-- Part B — D3: Spanish accent repair of the TODAY-1 seed (owner-approved). Only diacritics and
--   the opening marks ¿ ¡ change; wording, meaning and English are untouched. Every UPDATE is
--   guarded by the md5 of the ORIGINAL value (CR-stripped), so an edited row is left alone and
--   re-running is a no-op. Before → after ledger: docs/learning-center-seed-i1-accent-ledger.md
--
-- Idempotent. Safe to re-run.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Part A — new lessons
-- ---------------------------------------------------------------------------

INSERT INTO public.business_learning_lessons
  (category_id, lesson_key, title_es, title_en, summary_es, summary_en, body_es, body_en, level, estimated_minutes, capability_key, related_dimension_keys, status, published_at, sort_order)
SELECT c.id, 'what_problem_do_you_solve',
  'Qué problema resuelves', 'What problem do you solve?',
  'Antes del producto, el problema: cómo decir en una frase qué le resuelves a quién.', 'Before the product, the problem: how to say in one sentence what you solve, and for whom.',
  'Nadie se despierta queriendo tu producto. La gente se despierta con un problema. Si tu negocio se lo quita de encima, te paga. Si no, solo le pareces “interesante”.

Al terminar podrás:
- Decir el problema con las palabras de tu cliente, no con las tuyas.
- Distinguir un problema de una idea de producto.
- Nombrar quién lo siente más y qué hace hoy para resolverlo.

Primero el problema, después el producto

Un producto es tu respuesta. El problema es su pregunta.
“Quiero vender pasteles”, “quiero abrir una lavandería”, “quiero hacer páginas web”: todo eso son respuestas. Un negocio funciona cuando esa respuesta le sirve a una pregunta que alguien ya se está haciendo: “¿de dónde saco un pastel para el sábado?”, “¿cuándo voy a lavar esta ropa?”.

Un problema de verdad se nota
Tiene tres señales. Le pasa a alguien en concreto, no a “la gente”. Pasa seguido, no una vez en la vida. Y esa persona ya hace algo para resolverlo, aunque sea a medias: improvisa, paga de más, pierde tiempo o se aguanta. Si nadie hace nada al respecto, quizá no sea un problema tan grande.

Lo que hacen hoy es tu mejor pista
Lo que la persona hace hoy te dice cuánto le importa el problema y con qué vas a competir. Si le cuesta dinero, tiempo o preocupación, hay algo que tu negocio puede mejorar. Y sus palabras para describirlo son las mismas que después usarás para que te entienda.

Enamórate del problema de tu cliente, no de tu producto.

Ejemplo ilustrativo — Lavandería móvil de Marco:
Marco quiere ofrecer un servicio que recoge la ropa, la lava y la devuelve doblada. Su razón era: “todo el mundo odia lavar”. Cuando se preguntó a quién le había visto ese problema de verdad, pensó en enfermeras con turnos de 12 horas: cada semana acumulan ropa hasta su único día libre y lo pasan en la lavandería. No necesitan “ropa limpia”; necesitan recuperar su día de descanso. Ese es el problema.
Marco no cambió su servicio. Cambió la pregunta: de “¿qué vendo?” a “¿qué le quito de encima a quién?”.

De tu producto a su problema:
1. Lo que quieres vender: Tu punto de partida. Es válido, pero todavía es tu respuesta.
2. A quién le pasa algo: Una persona concreta, en una situación concreta, que pasa seguido.
3. Qué hace hoy y qué le cuesta: Su salida actual, y el dinero, tiempo o preocupación que le cuesta.
Si puedes llenar los tres pasos con ejemplos reales, tienes un problema. Si no, todavía tienes una idea de producto.

Idea de producto contra problema:
Débil: “Voy a ofrecer el mejor servicio de lavandería a domicilio.” Habla de ti. No dice a quién le sirve, cuándo, ni qué le resuelve.
Fuerte: “Para enfermeras con turnos de 12 horas, el problema es no tener tiempo ni energía para lavar. Pasa cada semana. Hoy la salida es acumular ropa hasta el día libre, y el costo es su único día de descanso.”

Tu turno — Arma la frase de tu problema:
Contesta sin mencionar tu producto. La frase se arma solo con lo que tú escribes: si dejas algo en blanco, se queda en blanco. Es tu primera suposición; después la vas a comprobar con personas reales.
1. ¿Quién tiene el problema?
2. ¿Qué les sale mal?
3. ¿Cada cuánto les pasa?
4. ¿Qué hacen hoy para resolverlo?
5. ¿Qué les cuesta? (dinero, tiempo o preocupación)

¿Y ahora qué hago con esto?
Esta frase es tu hipótesis del problema: lo que hoy crees, no algo que ya comprobaste.
- Te dice con quién hablar primero y sobre qué preguntarle.
- Te sirve para revisar tu idea: ¿lo que quieres vender de verdad le quita ese problema de encima?
- Todavía hay que comprobarla: que el problema exista, que pase seguido y que de verdad les cueste.

Errores comunes:
- Describir tu producto y llamarlo “problema”: “el problema es que no existe una lavandería móvil”. Mejor: Quita tu producto de la frase. Si el problema desaparece al quitarlo, era una idea de producto.
- Creer que un problema existe porque a ti te parece obvio, o porque tu familia dice que es buena idea. Mejor: Busca a alguien que ya esté gastando dinero, tiempo o paciencia en resolverlo. Esa es la señal.

Antes de seguir, confirma:
- Puedo decir el problema sin mencionar mi producto.
- Sé quién lo siente más, y no es “todo el mundo”.
- Sé qué hace hoy esa persona para resolverlo y qué le cuesta.
- Tengo en mente a 3 personas reales a quienes preguntarles.

Verifica — Compruébalo con la realidad:
Un problema no existe porque tú lo creas, ni porque una IA te diga que suena bien. Existe si personas reales te lo cuentan sin que tú se lo sugieras.
1. Pregúntale a 3 personas por la última vez que les pasó, sin mencionar tu idea.
2. Pon atención a qué hicieron para resolverlo y cuánto les costó.
3. Si nadie lo reconoce como problema, ajusta tu frase antes de gastar dinero.
La IA ayuda. Tú verificas.

En resumen:
- Nadie se despierta queriendo tu producto: la gente paga por quitarse un problema de encima.
- Un problema de verdad le pasa a alguien concreto, pasa seguido y esa persona ya hace algo al respecto.
- Tu frase del problema es una hipótesis. Se comprueba escuchando a personas reales, no a una IA.',
  'Nobody wakes up wanting your product. People wake up with a problem. If your business takes it off their hands, they pay you. If not, you are just “interesting” to them.

By the end you will be able to:
- State the problem in your customer''s words, not your own.
- Tell a problem apart from a product idea.
- Name who feels it most and what they do about it today.

First the problem, then the product

A product is your answer. The problem is their question.
“I want to sell cakes,” “I want to open a laundry,” “I want to build websites”: all of those are answers. A business works when that answer fits a question someone is already asking: “where do I get a cake by Saturday?”, “when am I going to wash these clothes?”

A real problem shows
It has three signs. It happens to someone specific, not to “people.” It happens often, not once in a lifetime. And that person already does something about it, even halfway: they improvise, overpay, lose time, or put up with it. If nobody does anything about it, it may not be that big a problem.

What they do today is your best clue
What the person does today tells you how much the problem matters to them and what you will be competing with. If it costs them money, time, or worry, there is something your business can improve. And the words they use to describe it are the same words you will later use so they understand you.

Fall in love with your customer''s problem, not with your product.

Illustrative example — Marco''s Mobile Laundry:
Marco wants to offer a service that picks up laundry, washes it, and returns it folded. His reason was: “everybody hates doing laundry.” When he asked himself who he had actually seen with that problem, he thought of nurses on 12-hour shifts: every week they pile up laundry until their one day off, and spend it at the laundromat. They do not need “clean clothes”; they need their day of rest back. That is the problem.
Marco did not change his service. He changed the question: from “what do I sell?” to “what do I take off whose hands?”

From your product to their problem:
1. What you want to sell: Your starting point. It is valid, but it is still your answer.
2. Who something happens to: A specific person, in a specific situation, that happens often.
3. What they do today and what it costs: Their current workaround, and the money, time, or worry it costs them.
If you can fill all three steps with real examples, you have a problem. If not, you still have a product idea.

Product idea versus problem:
Weak: “I am going to offer the best home laundry service.” It talks about you. It does not say who it serves, when, or what it solves for them.
Strong: “For nurses on 12-hour shifts, the problem is having no time or energy to do laundry. It happens every week. Today the workaround is piling up clothes until the day off, and the cost is their only day of rest.”

Your turn — Build your problem sentence:
Answer without mentioning your product. The sentence is built only from what you type: if you leave something blank, it stays blank. It is your first assumption; later you will check it with real people.
1. Who has the problem?
2. What goes wrong for them?
3. How often does it happen?
4. What do they do about it today?
5. What does it cost them? (money, time, or worry)

What do I do with this now?
This sentence is your problem hypothesis: what you believe today, not something you have proven.
- It tells you who to talk to first and what to ask them about.
- It lets you check your idea: does what you want to sell really take that problem off their hands?
- It still has to be tested: that the problem exists, that it happens often, and that it really costs them.

Common mistakes:
- Describing your product and calling it a “problem”: “the problem is that there is no mobile laundry.” Instead: Take your product out of the sentence. If the problem disappears when you remove it, it was a product idea.
- Believing a problem exists because it seems obvious to you, or because your family says it is a good idea. Instead: Look for someone who is already spending money, time, or patience to solve it. That is the signal.

Before you move on, confirm:
- I can state the problem without mentioning my product.
- I know who feels it most, and it is not “everyone.”
- I know what that person does about it today and what it costs them.
- I have 3 real people in mind to ask.

Verify — Check it against reality:
A problem does not exist because you believe it, or because an AI says it sounds right. It exists if real people describe it to you without you suggesting it.
1. Ask 3 people about the last time it happened to them, without mentioning your idea.
2. Pay attention to what they did about it and what it cost them.
3. If nobody recognizes it as a problem, adjust your sentence before you spend money.
AI helps. You verify.

In short:
- Nobody wakes up wanting your product: people pay to get a problem off their hands.
- A real problem happens to someone specific, happens often, and that person already does something about it.
- Your problem sentence is a hypothesis. It is checked by listening to real people, not to an AI.',
  'foundation', 10, 'what_problem_do_you_solve', ARRAY['customer_clarity', 'offer_and_value'], 'published', now(), 3
FROM public.business_learning_categories c WHERE c.category_key = 'clientes_y_demanda'
ON CONFLICT (lesson_key) DO NOTHING;

INSERT INTO public.business_learning_lessons
  (category_id, lesson_key, title_es, title_en, summary_es, summary_en, body_es, body_en, level, estimated_minutes, capability_key, related_dimension_keys, status, published_at, sort_order)
SELECT c.id, 'customer_conversations',
  'Habla con clientes reales', 'Talk to real customers',
  'Cómo hablar con 3 personas reales, preguntando por lo que ya les pasó y sin venderles nada.', 'How to talk with 3 real people, asking about what already happened to them and selling nothing.',
  'Pregunta. No vendas. Cuando le cuentas tu idea a alguien, te regala un cumplido. Cuando le preguntas por su vida, te regala la verdad.

Al terminar podrás:
- Hacerle preguntas útiles a 3 personas reales sin venderles nada.
- Escuchar y anotar sus palabras exactas.
- Ajustar lo que creías de tu cliente con lo que aprendiste.

Por qué los cumplidos no sirven

La gente es amable, y eso te confunde
Si le preguntas a tu tía “¿me comprarías?”, te va a decir que sí. No te miente: te quiere. Pero un “sí” de cortesía no paga la renta. Por eso no preguntes por tu idea. Pregunta por su vida.

El pasado es un hecho. El futuro es una opinión.
“¿Comprarías…?” pide adivinar. “¿Qué hiciste la última vez que…?” pide recordar. Las personas recuerdan bien lo que hicieron y adivinan mal lo que harían. Pregunta por la última vez que les pasó, qué hicieron, cuánto les costó y qué fue lo más molesto.

Tú escuchas. Ellos hablan.
En una buena conversación tú hablas poco. No interrumpas, no corrijas y no defiendas tu idea. Anota sus palabras exactas: son las que después vas a usar en tus mensajes, porque así es como ellos describen su problema.

Tres conversaciones son una señal, no una prueba
No vas a “comprobar el mercado” con tres pláticas. Pero sí vas a descubrir si vas por buen camino, y a veces con una sola conversación basta para notar que tu suposición estaba equivocada. Eso, antes de gastar, vale oro.

No busques que te digan que sí. Busca que te cuenten qué pasó.

Pregunta que vende contra pregunta que aprende:
Débil: “Voy a hacer pasteles personalizados, bien ricos y a buen precio. ¿Me comprarías uno?” Ya le dijiste qué contestar. Y le pides adivinar el futuro. Casi cualquiera dirá que sí.
Fuerte: “Cuéntame del último cumpleaños que organizaste en tu casa. ¿Cómo resolviste lo del pastel? ¿Qué fue lo más complicado?”

Ejemplo ilustrativo — Panadería de Rosa:
Rosa vende pasteles y cree que su cliente son las familias de su vecindario. En lugar de preguntar “¿me comprarías?”, habló con tres vecinas y les pidió que le contaran el último cumpleaños que organizaron. Dos compraron el pastel en el supermercado “porque ya no había tiempo”. Una lo encargó con una semana de anticipación y pagó más. Ninguna mencionó el sabor. Las tres mencionaron las prisas.
Rosa no salió con tres “sí”. Salió con algo mejor: las palabras exactas de su cliente y una suposición corregida.

Cómo llevar la conversación:
1. Pide permiso y poco tiempo: “Estoy aprendiendo sobre cómo la gente resuelve esto. ¿Me regalas 10 minutos? No te voy a vender nada.”
2. Empieza por la última vez que les pasó. Deja que cuenten la historia completa.
3. Pregunta qué hicieron, qué les costó y qué fue lo más molesto. Si dicen algo interesante, pregunta “¿y por qué?”.
4. No expliques tu idea. Si te preguntan, di que todavía estás aprendiendo y que con gusto les cuentas después.
5. Al terminar, agradece y anota de inmediato sus palabras exactas. No anotes nombres ni datos personales: basta con “vecina con dos hijos”.

Tu turno — Arma tu plan de 3 conversaciones:
Cinco respuestas cortas y sales con un plan para esta semana. Describe a las personas por su situación, nunca por su nombre. El plan se arma solo con lo que tú escribes.
1. ¿Qué quieres aprender?
2. ¿Con qué 3 personas vas a hablar? (sin nombres)
3. ¿Dónde y cómo las vas a encontrar?
4. Tus 3 a 5 preguntas (sobre lo que ya pasó, no sobre tu idea)
5. ¿Qué tendrías que escuchar para cambiar de opinión?

¿Y ahora qué hago con esto?
Este es tu plan para salir a escuchar. No es una encuesta ni un guion de ventas.
- Ponle fecha: tres conversaciones de 10 minutos caben en una semana.
- Decidir de antemano qué te haría cambiar de opinión te protege de oír solo lo que quieres oír.
- Después de cada plática, anota sus palabras exactas y vuelve a tu frase de cliente para ajustarla.

Errores comunes:
- Contar tu idea primero y preguntar después. Mejor: Pregunta primero por su experiencia. Si quieres contar tu idea, hazlo al final, cuando ya aprendiste lo que necesitabas.
- Hablar solo con familia y amigos que te quieren. Mejor: Busca al menos a una persona que no tenga motivos para quedar bien contigo.
- Tomar un “qué buena idea” como evidencia. Mejor: La evidencia es lo que ya hicieron: lo que pagaron, el tiempo que perdieron, lo que intentaron.

Antes de seguir, confirma:
- Sé con qué 3 personas voy a hablar y cuándo.
- Mis preguntas son sobre lo que ya pasó, no sobre mi idea.
- Decidí de antemano qué me haría cambiar de opinión.
- Voy a anotar sus palabras exactas, sin nombres ni datos personales.

Verifica — Esta lección ES la verificación:
Todo lo que armes en el Centro de Aprendizaje es una suposición hasta que lo compares con lo que dicen y hacen personas reales. Ensayar con una IA no cuenta como hablar con un cliente.
1. Habla con 3 personas reales esta semana.
2. Compara lo que escuchaste con lo que dijiste que te haría cambiar de opinión.
3. Ajusta tu frase de cliente y tu frase del problema con sus palabras.
La IA ayuda. Tú verificas.

En resumen:
- Pregunta, no vendas: los cumplidos no son evidencia.
- Pregunta por lo que ya pasó. El pasado es un hecho; el futuro es una opinión.
- Escucha, anota sus palabras exactas y decide de antemano qué te haría cambiar de opinión.',
  'Ask. Don''t pitch. When you tell someone your idea, they hand you a compliment. When you ask about their life, they hand you the truth.

By the end you will be able to:
- Ask 3 real people useful questions without selling them anything.
- Listen for, and write down, their exact words.
- Update what you believed about your customer with what you learned.

Why compliments are useless

People are kind, and that misleads you
If you ask your aunt “would you buy from me?”, she will say yes. She is not lying: she loves you. But a polite “yes” does not pay the rent. So do not ask about your idea. Ask about their life.

The past is a fact. The future is an opinion.
“Would you buy…?” asks them to guess. “What did you do the last time…?” asks them to remember. People remember what they did well and guess badly at what they would do. Ask about the last time it happened, what they did, what it cost them, and what was most annoying.

You listen. They talk.
In a good conversation you speak very little. Do not interrupt, do not correct, and do not defend your idea. Write down their exact words: those are the ones you will later use in your messages, because that is how they describe their problem.

Three conversations are a signal, not proof
You will not “prove the market” with three chats. But you will find out whether you are on the right track, and sometimes a single conversation is enough to notice that your assumption was wrong. That, before you spend, is worth gold.

Do not look for a yes. Look for the story of what happened.

A question that sells versus a question that learns:
Weak: “I am going to make custom cakes, really tasty and well priced. Would you buy one?” You already told them what to answer. And you are asking them to guess the future. Almost anyone will say yes.
Strong: “Tell me about the last birthday you organized at home. How did you handle the cake? What was the hardest part?”

Illustrative example — Rosa''s Bakery:
Rosa sells cakes and believes her customer is the families in her neighborhood. Instead of asking “would you buy from me?”, she talked with three neighbors and asked them to tell her about the last birthday they organized. Two bought the cake at the supermarket “because there was no time left.” One ordered it a week ahead and paid more. None of them mentioned flavor. All three mentioned being rushed.
Rosa did not walk away with three yeses. She walked away with something better: her customer''s exact words and a corrected assumption.

How to run the conversation:
1. Ask permission and for little time: “I am learning how people handle this. Can I have 10 minutes? I am not going to sell you anything.”
2. Start with the last time it happened to them. Let them tell the whole story.
3. Ask what they did, what it cost them, and what was most annoying. If they say something interesting, ask “and why was that?”
4. Do not explain your idea. If they ask, say you are still learning and will gladly tell them later.
5. When you finish, thank them and immediately write down their exact words. Do not record names or personal details: “a neighbor with two kids” is enough.

Your turn — Build your 3-conversation plan:
Five short answers and you leave with a plan for this week. Describe people by their situation, never by name. The plan is built only from what you type.
1. What do you want to learn?
2. Which 3 people will you talk to? (no names)
3. Where and how will you find them?
4. Your 3 to 5 questions (about what already happened, not about your idea)
5. What would you have to hear to change your mind?

What do I do with this now?
This is your plan to go out and listen. It is not a survey and it is not a sales script.
- Put a date on it: three 10-minute conversations fit in one week.
- Deciding in advance what would change your mind protects you from hearing only what you want to hear.
- After each chat, write down their exact words and go back to your customer sentence to adjust it.

Common mistakes:
- Explaining your idea first and asking afterwards. Instead: Ask about their experience first. If you want to share your idea, do it at the end, once you have learned what you needed.
- Talking only with family and friends who love you. Instead: Find at least one person who has no reason to be nice to you.
- Taking “what a great idea” as evidence. Instead: Evidence is what they already did: what they paid, the time they lost, what they tried.

Before you move on, confirm:
- I know which 3 people I will talk to and when.
- My questions are about what already happened, not about my idea.
- I decided in advance what would change my mind.
- I will write down their exact words, without names or personal details.

Verify — This lesson IS the verification:
Everything you build in the Learning Center is an assumption until you compare it with what real people say and do. Rehearsing with an AI does not count as talking to a customer.
1. Talk with 3 real people this week.
2. Compare what you heard with what you said would change your mind.
3. Adjust your customer sentence and your problem sentence with their words.
AI helps. You verify.

In short:
- Ask, don''t pitch: compliments are not evidence.
- Ask about what already happened. The past is a fact; the future is an opinion.
- Listen, write down their exact words, and decide in advance what would change your mind.',
  'foundation', 11, 'customer_conversations', ARRAY['customer_clarity', 'communication_and_follow_up'], 'published', now(), 4
FROM public.business_learning_categories c WHERE c.category_key = 'clientes_y_demanda'
ON CONFLICT (lesson_key) DO NOTHING;

INSERT INTO public.business_learning_lessons
  (category_id, lesson_key, title_es, title_en, summary_es, summary_en, body_es, body_en, level, estimated_minutes, capability_key, related_dimension_keys, status, published_at, sort_order)
SELECT c.id, 'know_your_competition',
  'Conoce a tu competencia', 'Know your competition',
  'Cómo comparar, con honestidad, las alternativas que tu cliente ya usa hoy y encontrar tu espacio.', 'How to compare, honestly, the alternatives your customer already uses today and find your space.',
  'Tu cliente ya resuelve esto sin ti. Tu competencia no es solo el negocio de enfrente. Es todo lo que tu cliente hace hoy en lugar de comprarte, incluso no hacer nada.

Al terminar podrás:
- Enumerar las alternativas reales de tu cliente, incluidas “no hacer nada” y “hacerlo uno mismo”.
- Compararlas en lo que a tu cliente le importa, no en lo que te importa a ti.
- Encontrar un espacio donde puedes ser mejor, sin copiar ni hablar mal de nadie.

Competencia es todo lo que tu cliente usa hoy

“No tengo competencia” casi nunca es verdad
Si nadie más vende lo tuyo, tu cliente igual resuelve el problema de alguna forma: lo hace él mismo, se lo pide a un familiar, usa algo parecido o se aguanta. Esa costumbre es tu competencia, y a veces es la más difícil de vencer, porque es gratis y ya la conoce.

Compara en lo que al cliente le importa
Es fácil comparar en lo que tú haces bien. Lo útil es comparar en lo que tu cliente valora al elegir: precio, comodidad, confianza, rapidez, cercanía. Si no sabes qué le importa más, todavía no toca investigar a la competencia: toca hablar con clientes.

Investiga como cliente honesto
Usa solo lo que cualquier persona puede ver: visita, observa, lee sus precios y horarios públicos, revisa lo que el propio negocio publica y pregunta a tus clientes qué otras opciones usan. No engañes a nadie, no te hagas pasar por cliente para sacar información privada y no copies. La información cambia: anota la fecha de lo que viste.

Busca tu espacio, no una pelea
No necesitas ser mejor en todo. Necesitas ser claramente mejor en algo que a tu cliente le importa y que las alternativas no le dan. Tu comparación es una foto de hoy, no un veredicto: revísala cada cierto tiempo.

Tu competidor más fuerte suele ser la costumbre de tu cliente.

Ejemplo ilustrativo — Lavandería móvil de Marco:
Marco pensaba que no tenía competencia: “nadie más recoge la ropa a domicilio en mi zona”. Entonces hizo una lista de lo que sus clientas, enfermeras con turnos largos, hacen hoy: ir a la lavandería de monedas en su día libre, lavar en casa de un familiar, o usar la lavadora del edificio a medianoche. Visitó la lavandería un domingo: barata, pero llena y con dos horas de espera. Su espacio no era el precio. Era devolverles el día libre.
Marco no encontró un enemigo. Encontró lo que sus clientas ya soportan, y ahí estaba su oportunidad.

De “no tengo competencia” a tu espacio:
1. Enumera: Todo lo que tu cliente usa hoy, incluidas “no hacer nada” y “hacerlo uno mismo”.
2. Compara: En lo que al cliente le importa: precio, comodidad, confianza. Con lo que tú mismo observaste.
3. Encuentra tu espacio: Algo que le importa a tu cliente y que las alternativas no le dan.
Es una foto de hoy. Las alternativas cambian; revisa tu comparación cada cierto tiempo.

Tu turno — Arma tu comparación de alternativas:
Escribe solo lo que tú has visto o lo que te han contado tus clientes. Si no sabes algo, escribe “por averiguar”: eso también es un resultado. Al menos una alternativa debe ser “no hacer nada” o “hacerlo uno mismo”.
1. ¿Qué le importa más a tu cliente al elegir?
2. Alternativa 1: ¿qué usa hoy?
3. Lo que observaste: precio, comodidad, confianza, qué hace bien
4. Alternativa 2
5. Lo que observaste de la alternativa 2
6. Alternativa 3 (¿no hacer nada? ¿hacerlo uno mismo?)
7. Lo que observaste de la alternativa 3
8. ¿Dónde podrías ser claramente mejor para tu cliente?

¿Y ahora qué hago con esto?
Esta comparación es una foto de hoy, hecha con tus propias observaciones. No es un veredicto.
- Te muestra dónde puedes ser claramente mejor para TU cliente, no para todos.
- Lo que marcaste “por averiguar” es tu lista de investigación: visita, observa y pregunta a clientes.
- Es la base de tu siguiente paso: decir con claridad qué te hace diferente.

Errores comunes:
- Decir “no tengo competencia”. Mejor: Pregunta: ¿qué hace hoy mi cliente en lugar de comprarme? Esa es tu competencia, aunque no sea un negocio.
- Copiar al negocio más conocido, o bajar tus precios solo porque el otro cobra menos. Mejor: Busca lo que a tu cliente le importa y los demás no le dan. Competir solo por precio casi siempre lo gana el más grande.
- Pedirle a una IA “los datos de mi competencia” y creerlos. Mejor: Usa la IA para planear y ordenar. Los datos los consigues tú: visitando, observando y preguntando.

Investiga con respeto: usa solo información pública y actual, no engañes a nadie para obtener información y no hables mal de otros negocios. Compararte con honestidad te hace mejor; atacar a otros te hace menos confiable.

Antes de seguir, confirma:
- Enumeré al menos 3 alternativas reales, y una es “no hacer nada” o “hacerlo uno mismo”.
- Comparé en lo que a mi cliente le importa, no en lo que me importa a mí.
- Lo que escribí lo vi yo o me lo contaron clientes; lo demás está marcado “por averiguar”.
- Tengo una idea de dónde puedo ser claramente mejor, y sé que debo comprobarla.

Verifica — Compruébalo con la realidad:
Los precios, horarios y servicios de otros negocios cambian, y una IA puede inventarlos. Lo único confiable es lo que tú ves con tus ojos y lo que tus clientes te cuentan.
1. Visita u observa al menos una alternativa esta semana, como lo haría un cliente.
2. Pregunta a 3 personas qué usan hoy y qué les gusta y les molesta de esa opción.
3. Anota la fecha de lo que viste y revisa tu comparación cada pocos meses.
La IA ayuda. Tú verificas.

En resumen:
- Tu competencia es todo lo que tu cliente hace hoy en lugar de comprarte, incluso no hacer nada.
- Compara en lo que a tu cliente le importa, con lo que tú mismo observaste, y con honestidad.
- No necesitas ser mejor en todo: necesitas ser claramente mejor en algo que importa. Y comprobarlo.',
  'Your customer already solves this without you. Your competition is not only the business across the street. It is everything your customer does today instead of buying from you, including doing nothing.

By the end you will be able to:
- List your customer''s real alternatives, including “do nothing” and “do it yourself.”
- Compare them on what your customer cares about, not on what you care about.
- Find a space where you can be better, without copying or bad-mouthing anyone.

Competition is everything your customer uses today

“I have no competition” is almost never true
If nobody else sells what you sell, your customer still solves the problem somehow: they do it themselves, ask a relative, use something similar, or put up with it. That habit is your competition, and sometimes it is the hardest to beat, because it is free and already familiar.

Compare on what the customer cares about
It is easy to compare on what you do well. What is useful is comparing on what your customer values when choosing: price, convenience, trust, speed, closeness. If you do not know what matters most to them, it is not yet time to research the competition: it is time to talk to customers.

Research like an honest customer
Use only what anyone can see: visit, observe, read their public prices and hours, look at what the business itself publishes, and ask your customers what other options they use. Do not deceive anyone, do not pose as a customer to extract private information, and do not copy. Information changes: write down the date of what you saw.

Look for your space, not a fight
You do not need to be better at everything. You need to be clearly better at something your customer cares about and the alternatives do not give them. Your comparison is a snapshot of today, not a verdict: revisit it from time to time.

Your strongest competitor is often your customer''s habit.

Illustrative example — Marco''s Mobile Laundry:
Marco thought he had no competition: “nobody else picks up laundry at home in my area.” Then he listed what his customers, nurses on long shifts, do today: go to the coin laundromat on their day off, do laundry at a relative''s house, or use the building''s washer at midnight. He visited the laundromat on a Sunday: cheap, but crowded, with a two-hour wait. His space was not price. It was giving them their day off back.
Marco did not find an enemy. He found what his customers already put up with, and that was his opportunity.

From “I have no competition” to your space:
1. List: Everything your customer uses today, including “do nothing” and “do it yourself.”
2. Compare: On what the customer cares about: price, convenience, trust. With what you observed yourself.
3. Find your space: Something your customer cares about that the alternatives do not give them.
It is a snapshot of today. Alternatives change; revisit your comparison from time to time.

Your turn — Build your alternatives comparison:
Write only what you have seen yourself or what your customers have told you. If you do not know something, write “to find out”: that is a result too. At least one alternative should be “do nothing” or “do it yourself.”
1. What does your customer care about most when choosing?
2. Alternative 1: what do they use today?
3. What you observed: price, convenience, trust, what it does well
4. Alternative 2
5. What you observed about alternative 2
6. Alternative 3 (do nothing? do it yourself?)
7. What you observed about alternative 3
8. Where could you be clearly better for your customer?

What do I do with this now?
This comparison is a snapshot of today, made from your own observations. It is not a verdict.
- It shows you where you can be clearly better for YOUR customer, not for everyone.
- Whatever you marked “to find out” is your research list: visit, observe, and ask customers.
- It is the basis of your next step: stating clearly what makes you different.

Common mistakes:
- Saying “I have no competition.” Instead: Ask: what does my customer do today instead of buying from me? That is your competition, even if it is not a business.
- Copying the best-known business, or lowering your prices just because someone else charges less. Instead: Look for what your customer cares about and the others do not provide. Competing on price alone is almost always won by the biggest player.
- Asking an AI for “facts about my competitors” and believing them. Instead: Use AI to plan and organize. You get the facts yourself: by visiting, observing, and asking.

Research respectfully: use only public, current information, do not deceive anyone to get information, and do not speak badly of other businesses. Comparing yourself honestly makes you better; attacking others makes you less trustworthy.

Before you move on, confirm:
- I listed at least 3 real alternatives, and one is “do nothing” or “do it yourself.”
- I compared on what my customer cares about, not on what I care about.
- What I wrote, I saw myself or customers told me; the rest is marked “to find out.”
- I have an idea of where I can be clearly better, and I know I have to check it.

Verify — Check it against reality:
Other businesses'' prices, hours, and services change, and an AI can invent them. The only reliable source is what you see with your own eyes and what your customers tell you.
1. Visit or observe at least one alternative this week, the way a customer would.
2. Ask 3 people what they use today and what they like and dislike about that option.
3. Write down the date of what you saw and revisit your comparison every few months.
AI helps. You verify.

In short:
- Your competition is everything your customer does today instead of buying from you, including doing nothing.
- Compare on what your customer cares about, with what you observed yourself, and honestly.
- You do not need to be better at everything: you need to be clearly better at something that matters. And to check it.',
  'foundation', 11, 'know_your_competition', ARRAY['offer_and_value', 'customer_clarity'], 'published', now(), 5
FROM public.business_learning_categories c WHERE c.category_key = 'clientes_y_demanda'
ON CONFLICT (lesson_key) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Part B — D3 Spanish accent repair (guarded; diacritics and ¿ ¡ only)
-- ---------------------------------------------------------------------------

UPDATE public.business_learning_categories SET summary_es = 'Las bases que necesita todo negocio: información clara, identidad definida y consistencia en todos lados.'
WHERE category_key = 'fundamentos_del_negocio' AND md5(replace(summary_es, chr(13), '')) = '902d0e751fc8c037046486a1dfa8b97c';

UPDATE public.business_learning_categories SET summary_es = 'Cómo entender a tus clientes y hacer que te recomienden más.'
WHERE category_key = 'clientes_y_demanda' AND md5(replace(summary_es, chr(13), '')) = '5123455ed3f138ada96abc3bc2f7cd95';

UPDATE public.business_learning_categories SET summary_es = 'Cómo distinguir ingresos de ganancia y cuidar tu capacidad de trabajo.'
WHERE category_key = 'dinero_y_capacidad' AND md5(replace(summary_es, chr(13), '')) = 'df2a375501db4caffa3151988cc3bb3a';

UPDATE public.business_learning_categories SET summary_es = 'Cómo aparecer donde tus clientes buscan y anunciarte con un plan claro.'
WHERE category_key = 'visibilidad_y_publicidad' AND md5(replace(summary_es, chr(13), '')) = 'c2a1d04987e926f6862cc8182bdf5cd6';

UPDATE public.business_learning_categories SET title_es = 'Comunicación y reputación'
WHERE category_key = 'comunicacion_y_reputacion' AND md5(replace(title_es, chr(13), '')) = 'ce5efa854d8292a755410b121bdb0baa';

UPDATE public.business_learning_categories SET summary_es = 'Cómo responder rápido y manejar tu reputación en línea.'
WHERE category_key = 'comunicacion_y_reputacion' AND md5(replace(summary_es, chr(13), '')) = '75b60a7720dd8142f73cfde1f9a713a4';

UPDATE public.business_learning_categories SET title_es = 'Protección de datos'
WHERE category_key = 'proteccion_y_datos' AND md5(replace(title_es, chr(13), '')) = 'a8b6196c4cd4d650f05958c1cd19378a';

UPDATE public.business_learning_categories SET summary_es = 'Cómo cuidar la información de tus clientes de forma responsable.'
WHERE category_key = 'proteccion_y_datos' AND md5(replace(summary_es, chr(13), '')) = '82d125caaea223fcd26b8aad4c9089b4';

UPDATE public.business_learning_lessons SET title_es = 'Información consistente del negocio'
WHERE lesson_key = 'consistent_business_information' AND md5(replace(title_es, chr(13), '')) = '8f5c463dbd6e0c3043fe44fbd51462d7';

UPDATE public.business_learning_lessons SET summary_es = 'Por que tu nombre, dirección, teléfono y horario deben coincidir en todos lados.'
WHERE lesson_key = 'consistent_business_information' AND md5(replace(summary_es, chr(13), '')) = '1a4717e33e94e92f5dc5a6dcbd4e8204';

UPDATE public.business_learning_lessons SET body_es = 'Cuando el nombre, la dirección, el teléfono y el horario de tu negocio aparecen de forma distinta en cada lugar donde la gente te busca, generas confusión y pierdes clientes que simplemente se rinden y buscan a alguien más.

Por qué importa: un cliente que encuentra dos números de teléfono diferentes para tu negocio no sabe cuál es el correcto y puede llamar al equivocado. Un cliente que ve un horario en un lugar y otro horario distinto en otro lugar puede llegar a tu negocio cuando está cerrado. Cada inconsistencia es una oportunidad perdida, no solo una molestia menor. La información consistente también ayuda a que las personas confíen más en tu negocio, porque ven la misma historia en todos lados.

Pasos prácticos:
1. Escribe en un solo documento el nombre exacto de tu negocio, la dirección completa, el teléfono principal, el correo electrónico y el horario real de atención, incluyendo días festivos si aplica.
2. Haz una lista de cada lugar donde tu negocio aparece hoy: tu perfil de Google Business, tus redes sociales, tu sitio web si tienes uno, directorios locales, tarjetas de presentación y cualquier anuncio impreso.
3. Revisa cada lugar de la lista y compara la información contra tu documento maestro. Anota cada diferencia que encuentres, por pequeña que sea.
4. Corrige cada lugar, uno por uno, hasta que toda la información coincida exactamente con tu documento maestro.
5. Marca en tu calendario una revisión cada tres o cuatro meses, porque los horarios y números de teléfono cambian y es fácil que un lugar se quede desactualizado sin que te des cuenta.

Un dato importante: mantener tu información consistente no garantiza más clientes ni mejores resultados en búsquedas. Lo que sí hace es eliminar una fuente común de confusión que puede alejar a clientes que ya estaban interesados en tu negocio.'
WHERE lesson_key = 'consistent_business_information' AND md5(replace(body_es, chr(13), '')) = '011abfe3a401830dc755ef2f1940b784';

UPDATE public.business_learning_lessons SET title_es = 'Quién es tu cliente'
WHERE lesson_key = 'who_is_your_customer' AND md5(replace(title_es, chr(13), '')) = '736b2a88fef149209c9834adad87219b';

UPDATE public.business_learning_lessons SET summary_es = 'Cómo definir a tu cliente ideal para escribir mensajes más claros.'
WHERE lesson_key = 'who_is_your_customer' AND md5(replace(summary_es, chr(13), '')) = '16754ad7f53d142881386507fc88ffdf';

UPDATE public.business_learning_lessons SET body_es = 'Muchos negocios intentan venderle a todo el mundo, y el resultado casi siempre es un mensaje confuso que no le habla claramente a nadie. Saber exactamente quién es tu cliente ideal te permite escribir anuncios más claros, elegir mejor dónde anunciarte y responder preguntas con más confianza.

Por qué importa: cuando entiendes a tu cliente, sabes qué palabras usar, qué problemas mencionar primero y qué preocupaciones responder antes de que las pregunten. Un mensaje dirigido a una persona específica casi siempre funciona mejor que un mensaje genérico dirigido a nadie en particular.

Pasos prácticos:
1. Piensa en tres clientes reales que hayas atendido y que quedaron satisfechos. Escribe qué necesitaban, por qué te eligieron a ti y cómo se enteraron de tu negocio.
2. Busca lo que esos tres clientes tienen en común: edad aproximada, zona donde viven o trabajan, el problema específico que necesitaban resolver, y cómo prefieren comunicarse.
3. Escribe una descripción corta de tu cliente ideal usando esos patrones, por ejemplo: dueños de restaurantes pequeños en tu ciudad que necesitan ayuda con su menú digital.
4. Revisa tus anuncios, tu perfil y tus publicaciones actuales y pregunta: ¿le hablan directamente a esta persona, o le hablan a cualquiera?
5. Ajusta tu lenguaje para que hable directamente a esa persona, mencionando su problema específico y cómo tu negocio lo resuelve.

Un dato importante: definir a tu cliente ideal no significa rechazar a otros clientes que lleguen. Es una herramienta para escribir mensajes más claros, no una regla estricta sobre a quién puedes atender.'
WHERE lesson_key = 'who_is_your_customer' AND md5(replace(body_es, chr(13), '')) = 'caf6c71d0352f9c312de516d142be64d';

UPDATE public.business_learning_lessons SET body_es = 'Vender mucho no siempre significa ganar dinero. Muchos dueños de negocio confunden ingresos, que es todo el dinero que entra, con ganancia, que es lo que sobra después de pagar todos los costos. Esta confusión puede hacer que un negocio parezca exitoso mientras en realidad está perdiendo dinero cada mes.

Por qué importa: si solo miras cuánto vendes sin restar tus costos, puedes tomar decisiones equivocadas, como bajar precios pensando que así venderás más, sin darte cuenta de que cada venta te está costando dinero en lugar de generarlo.

Pasos prácticos:
1. Durante un mes completo, anota todo el dinero que entra a tu negocio por ventas. Ese número es tu ingreso, no tu ganancia.
2. En una lista separada, anota todos tus costos del mismo mes: materiales, renta, transporte, sueldos, servicios, y cualquier otro gasto relacionado con el negocio.
3. Resta el total de costos del total de ingresos. El número que queda es tu ganancia real de ese mes, positiva o negativa.
4. Revisa cuáles de tus productos o servicios dejan más ganancia después de restar sus costos específicos, no solo cuáles se venden más.
5. Repite este ejercicio cada mes durante al menos tres meses para ver un patrón real, en lugar de sacar conclusiones de un solo mes que pudo ser inusual.

Un dato importante: esta lección no te dice cuánto deberías ganar ni garantiza que tu negocio será rentable. Solo te da una forma clara de ver la diferencia entre lo que entra y lo que realmente te queda, para que tomes decisiones con información real.'
WHERE lesson_key = 'revenue_vs_profit' AND md5(replace(body_es, chr(13), '')) = '7c040ad64bb234eb2cb2b1c3cbb8e607';

UPDATE public.business_learning_lessons SET title_es = 'Límites sanos y capacidad'
WHERE lesson_key = 'healthy_boundaries_and_capacity' AND md5(replace(title_es, chr(13), '')) = 'c306f2a85f8ea5076b31d2eeec750ba6';

UPDATE public.business_learning_lessons SET summary_es = 'Cómo proteger la calidad de tu trabajo sin aceptar más de lo que puedes manejar.'
WHERE lesson_key = 'healthy_boundaries_and_capacity' AND md5(replace(summary_es, chr(13), '')) = '2053b412baa47af1cfafd34896a7c913';

UPDATE public.business_learning_lessons SET body_es = 'Muchos dueños de negocio piensan que decir que sí a cada cliente, cada pedido y cada solicitud es la única forma de crecer. Pero cuando aceptas más trabajo del que realmente puedes manejar bien, la calidad baja, los clientes actuales se sienten descuidados y tu terminas agotado.

Por qué importa: un negocio que crece más rápido de lo que su capacidad real permite suele terminar con clientes insatisfechos, entregas tardías y un dueño agotado que no puede sostener ese ritmo por mucho tiempo. Proteger tu capacidad es proteger la calidad de lo que ofreces.

Pasos prácticos:
1. Anota, durante una semana normal, cuántas horas realmente dedicas a atender clientes, producir tu producto o servicio, y manejar la parte administrativa del negocio.
2. Compara esas horas con las horas que tienes disponibles de forma sostenible, sin sacrificar tu descanso o tu salud de forma constante.
3. Identifica el punto donde aceptar más trabajo empieza a bajar la calidad de lo que entregas o a atrasar tus tiempos de entrega.
4. Define con claridad cuántos clientes o pedidos puedes aceptar por semana o por mes sin cruzar ese punto.
5. Practica decir que no o proponer una fecha más realista cuando una solicitud sobrepasa tu capacidad actual, explicando el motivo con honestidad.

Un dato importante: reconocer tus límites no es una debilidad ni significa que tu negocio no puede crecer. Es una forma de proteger la calidad de tu trabajo y tu propia salud mientras encuentras formas sostenibles de aumentar tu capacidad con el tiempo.'
WHERE lesson_key = 'healthy_boundaries_and_capacity' AND md5(replace(body_es, chr(13), '')) = '6583522e26e1d05cc2c5b99dcee8cb62';

UPDATE public.business_learning_lessons SET summary_es = 'Cómo crear y mantener un perfil completo en Google Business.'
WHERE lesson_key = 'google_business_basics' AND md5(replace(summary_es, chr(13), '')) = '6d84bbf886ff4fae554e5f801f077242';

UPDATE public.business_learning_lessons SET body_es = 'Cuando alguien busca un negocio como el tuyo en Google o en Google Maps, lo primero que ve suele ser tu perfil de Google Business, no tu sitio web. Un perfil completo y correcto ayuda a que las personas encuentren tu negocio, confíen en la información que ven y decidan contactarte.

Por qué importa: un perfil incompleto, con información vieja o sin fotos, hace que las personas duden si tu negocio todavía existe o si la información es confiable. Muchas veces esa duda es suficiente para que elijan a otro negocio en su lugar.

Pasos prácticos:
1. Busca tu negocio en Google para ver si ya tienes un perfil de Google Business. Si no existe, puedes crear uno gratis siguiendo las instrucciones que Google proporciona.
2. Verifica que el nombre, la dirección, el teléfono y el horario coincidan exactamente con tu documento maestro de información del negocio.
3. Escribe una descripción clara de tu negocio: qué ofreces, a quién atiendes y qué te hace diferente, usando un lenguaje sencillo y directo.
4. Sube al menos ocho a diez fotos reales de tu negocio: el local, tus productos o servicios, y tu equipo si es apropiado para tu tipo de negocio.
5. Revisa tu perfil cada mes para actualizar horarios especiales, responder preguntas de clientes y confirmar que toda la información siga siendo correcta.

Un dato importante: tener un perfil completo no garantiza que aparecerás primero en las búsquedas ni que recibirás más clientes. Lo que sí hace es asegurar que, cuando alguien te busque, encuentre información clara y confiable sobre tu negocio.'
WHERE lesson_key = 'google_business_basics' AND md5(replace(body_es, chr(13), '')) = 'e73d35bbf42b81c0c86c4406d2771813';

UPDATE public.business_learning_lessons SET summary_es = 'Conceptos básicos antes de pagar por tu primer anuncio.'
WHERE lesson_key = 'advertising_fundamentals' AND md5(replace(summary_es, chr(13), '')) = '487b09daaa6b2f1155313fb3d4e2f933';

UPDATE public.business_learning_lessons SET body_es = 'Anunciarte sin un plan claro suele significar gastar dinero sin saber realmente si está funcionando. Antes de pagar por un anuncio, vale la pena entender algunos conceptos básicos que te ayudarán a decidir dónde, cómo y cuánto anunciarte.

Por qué importa: un anuncio dirigido a la persona equivocada, con un mensaje confuso o sin una forma clara de que te contacten, puede costar dinero sin traer resultados. Entender lo básico te ayuda a evitar ese desperdicio.

Pasos prácticos:
1. Define un objetivo claro para tu anuncio: quieres que la gente llame, que visite tu negocio, que envíe un mensaje de WhatsApp, o que compre en línea. Un anuncio no puede hacer todo a la vez de forma efectiva.
2. Escribe tu mensaje pensando en el cliente que definiste en la lección sobre quién es tu cliente, mencionando su problema específico y cómo lo resuelves.
3. Incluye siempre una acción clara: llama ahora, visítanos hoy, escríbenos por WhatsApp, con la información de contacto correcta y fácil de encontrar.
4. Elige el lugar donde anunciarte según dónde realmente está tu cliente: redes sociales, Google, medios locales, o una combinación, en lugar de elegir por costumbre.
5. Antes de repetir un anuncio, revisa si tuvo algún resultado que puedas medir, como llamadas, mensajes o visitas, y ajusta el mensaje o el lugar si no fue claro.

Un dato importante: ningún anuncio garantiza ventas ni un número específico de clientes nuevos. La publicidad ayuda a que más personas conozcan tu negocio, pero el resultado final también depende de tu oferta, tus precios y tu servicio.'
WHERE lesson_key = 'advertising_fundamentals' AND md5(replace(body_es, chr(13), '')) = '5f6cdf3974253a8cf66e46db31e91965';

UPDATE public.business_learning_lessons SET summary_es = 'Cómo configurar y usar WhatsApp Business para responder mejor.'
WHERE lesson_key = 'whatsapp_business_basics' AND md5(replace(summary_es, chr(13), '')) = '8637fd3ea376ecc18d0dfde521a29c2f';

UPDATE public.business_learning_lessons SET body_es = 'Para muchos negocios pequeños, WhatsApp es el primer lugar donde un cliente hace contacto. Responder rápido, con información clara y de forma organizada, puede ser la diferencia entre ganar un cliente y perderlo frente a otro negocio que respondió primero.

Por qué importa: un cliente que espera mucho tiempo una respuesta, o que recibe una respuesta confusa, fácilmente busca a otro negocio que le conteste más rápido. WhatsApp Business ofrece herramientas gratuitas que ayudan a responder mejor sin necesidad de contratar a alguien más.

Pasos prácticos:
1. Descarga la aplicación WhatsApp Business, que es gratuita y separada de tu WhatsApp personal, y configura tu perfil de negocio con tu nombre, dirección, horario y una breve descripción.
2. Crea un mensaje de bienvenida automático que se envíe cuando alguien te escribe por primera vez, agradeciendo el contacto y explicando en cuánto tiempo responderás.
3. Configura un mensaje de ausencia para cuando estás fuera de tu horario de atención, para que el cliente sepa que su mensaje fue recibido y cuándo le responderás.
4. Prepara respuestas rápidas guardadas para las preguntas que recibes con más frecuencia, como precios, horarios o ubicación, para responder más rápido sin escribir todo de nuevo cada vez.
5. Define un tiempo máximo razonable para responder mensajes durante tu horario de atención, y revisa tu teléfono con esa frecuencia para no dejar a nadie esperando demasiado.

Un dato importante: responder rápido no garantiza que cada persona se convierta en cliente. Lo que sí hace es asegurar que ninguna oportunidad se pierda simplemente porque la respuesta llegó demasiado tarde.'
WHERE lesson_key = 'whatsapp_business_basics' AND md5(replace(body_es, chr(13), '')) = '9683c9903418f289f38b02bae167878f';

UPDATE public.business_learning_lessons SET title_es = 'Reseñas y respuesta a clientes'
WHERE lesson_key = 'reviews_and_customer_response' AND md5(replace(title_es, chr(13), '')) = 'deb0b19f8813a77d4e0c22fa3f7b86b7';

UPDATE public.business_learning_lessons SET summary_es = 'Cómo responder reseñas positivas y difíciles de forma profesional.'
WHERE lesson_key = 'reviews_and_customer_response' AND md5(replace(summary_es, chr(13), '')) = 'dac806d1119ca2c26140c44c65d1de79';

UPDATE public.business_learning_lessons SET body_es = 'Las reseñas en línea influyen en la decisión de muchas personas antes de elegir un negocio. Cómo respondes a esas reseñas, tanto las buenas como las difíciles, dice mucho sobre cómo tratas a tus clientes en general.

Por qué importa: una reseña negativa sin respuesta puede parecer que al negocio no le importa la opinión de sus clientes. Una respuesta cuidadosa, incluso a una crítica difícil, muestra que tomas en serio la experiencia de tus clientes y que estás dispuesto a mejorar.

Pasos prácticos:
1. Revisa las reseñas que ya tienes en tu perfil de Google Business y en otras plataformas donde tu negocio aparezca, y anota cuáles aún no tienen respuesta.
2. Para las reseñas positivas, responde con un agradecimiento breve y personal, mencionando algo específico de lo que la persona escribió si es posible.
3. Para las reseñas difíciles, espera un momento antes de responder si sientes molestia, y luego escribe una respuesta calmada que reconozca la preocupación sin ponerte a la defensiva.
4. Nunca compartas información privada del cliente en tu respuesta pública, y si el problema requiere más detalle, invita a la persona a contactarte directamente por teléfono o WhatsApp.
5. Pide reseñas de forma natural a clientes satisfechos después de una buena experiencia, por ejemplo enviando un enlace directo a tu perfil de Google Business.

Un dato importante: responder bien a las reseñas no garantiza que dejarás de recibir críticas, ni que subirás en las búsquedas. Lo que sí hace es mostrar a futuros clientes cómo tratas a las personas cuando algo no sale perfecto.'
WHERE lesson_key = 'reviews_and_customer_response' AND md5(replace(body_es, chr(13), '')) = '3b4671f2ad99949c9160e8878f011c83';

UPDATE public.business_learning_lessons SET summary_es = 'Próximamente: cómo definir una identidad visual y de mensaje simple y consistente.'
WHERE lesson_key = 'branding_basics' AND md5(replace(summary_es, chr(13), '')) = '90d68213b6e74fb6a4b95a3b4ddbb663';

UPDATE public.business_learning_lessons SET summary_es = 'Próximamente: cómo pedir referidos de forma natural y sin incomodar.'
WHERE lesson_key = 'referrals_basics' AND md5(replace(summary_es, chr(13), '')) = 'b6053151cbd599949643ba848d7fe893';

UPDATE public.business_learning_lessons SET summary_es = 'Próximamente: cómo identificar qué servicios realmente te convienen ofrecer.'
WHERE lesson_key = 'profitable_service_basics' AND md5(replace(summary_es, chr(13), '')) = '8cbe14406fd640ebcf59ae6ad89596cf';

UPDATE public.business_learning_lessons SET title_es = 'Analítica simple para tu negocio'
WHERE lesson_key = 'simple_analytics' AND md5(replace(title_es, chr(13), '')) = 'd216c7f9ac6f8315744f746ebb9eca8b';

UPDATE public.business_learning_lessons SET summary_es = 'Próximamente: cómo leer números básicos sin necesitar ser experto.'
WHERE lesson_key = 'simple_analytics' AND md5(replace(summary_es, chr(13), '')) = '3868abfe1fb3346ddf6f5eb1ea95ca58';

UPDATE public.business_learning_lessons SET summary_es = 'Próximamente: cómo ayudar a que tu negocio aparezca en búsquedas locales.'
WHERE lesson_key = 'local_seo_basics' AND md5(replace(summary_es, chr(13), '')) = '58834bb02c3f60c101e38a615c675d99';

UPDATE public.business_learning_lessons SET title_es = 'Fotografía de producto básica'
WHERE lesson_key = 'product_photography_basics' AND md5(replace(title_es, chr(13), '')) = '8e811bb6ece87098bba150e67222afb1';

UPDATE public.business_learning_lessons SET summary_es = 'Próximamente: cómo tomar mejores fotos de tu negocio con tu teléfono.'
WHERE lesson_key = 'product_photography_basics' AND md5(replace(summary_es, chr(13), '')) = '00e7944bfdea49f43dcbefcd5eb6aeb4';

UPDATE public.business_learning_lessons SET title_es = 'Video corto básico'
WHERE lesson_key = 'short_video_basics' AND md5(replace(title_es, chr(13), '')) = '7862085effd7bd822a0273cde592f7e3';

UPDATE public.business_learning_lessons SET summary_es = 'Próximamente: cómo grabar videos cortos simples para redes sociales.'
WHERE lesson_key = 'short_video_basics' AND md5(replace(summary_es, chr(13), '')) = '95b14f63cd23969894a956a5fe2adfde';

UPDATE public.business_learning_lessons SET title_es = 'Protección de datos del cliente'
WHERE lesson_key = 'customer_data_protection' AND md5(replace(title_es, chr(13), '')) = '9459fd1df42c94c975525390d21e2527';

UPDATE public.business_learning_lessons SET summary_es = 'Próximamente: cómo manejar con cuidado la información de tus clientes.'
WHERE lesson_key = 'customer_data_protection' AND md5(replace(summary_es, chr(13), '')) = '30fe67b123174a3084dd287ee63de15f';

UPDATE public.business_learning_resources SET body_es = 'El perfil gratuito que aparece en Google Búsqueda y Google Maps cuando alguien busca tu negocio, con tu nombre, dirección, teléfono, horario y reseñas.'
WHERE resource_key = 'glossary_google_business_profile' AND md5(replace(body_es, chr(13), '')) = '1b0db1ed9a10e98f2e3ccfb8d260749a';

UPDATE public.business_learning_resources SET body_es = 'Conjunto de prácticas que ayudan a que un sitio web o perfil aparezca en los resultados de búsqueda cuando alguien escribe palabras relacionadas con tu negocio.'
WHERE resource_key = 'glossary_seo' AND md5(replace(body_es, chr(13), '')) = 'c2ca89eec184e09aa5793295dc2aebf3';

UPDATE public.business_learning_resources SET body_es = 'La parte del SEO enfocada en aparecer en búsquedas hechas por personas cerca de tu ubicación, como restaurantes cerca de mí.'
WHERE resource_key = 'glossary_local_seo' AND md5(replace(body_es, chr(13), '')) = 'c1906b3f23c28f87048cc36df12da71d';

UPDATE public.business_learning_resources SET title_es = 'Página de aterrizaje'
WHERE resource_key = 'glossary_landing_page' AND md5(replace(title_es, chr(13), '')) = 'fc71dfd2ad40c99e4fe92fd945bd19f9';

UPDATE public.business_learning_resources SET body_es = 'Una página web sencilla diseñada para que la persona que llega tome una acción específica, como llamar o dejar sus datos.'
WHERE resource_key = 'glossary_landing_page' AND md5(replace(body_es, chr(13), '')) = '773a260f192f1a72618786b1fc9ed60c';

UPDATE public.business_learning_resources SET title_es = 'Llamada a la acción'
WHERE resource_key = 'glossary_cta' AND md5(replace(title_es, chr(13), '')) = 'df0a10a027ec24adbdd2451822304fcf';

UPDATE public.business_learning_resources SET body_es = 'La frase o botón que le dice claramente a la persona qué hacer después, como llamar ahora o escríbenos por WhatsApp.'
WHERE resource_key = 'glossary_cta' AND md5(replace(body_es, chr(13), '')) = 'cc8cbf484b0d4b65183789baf4d42197';

UPDATE public.business_learning_resources SET body_es = 'Una persona que mostró interés en tu negocio, por ejemplo dejando su teléfono o escribiéndote, pero que todavía no ha comprado.'
WHERE resource_key = 'glossary_lead' AND md5(replace(body_es, chr(13), '')) = '9601d0de6927b39f5651118a8e93551a';

UPDATE public.business_learning_resources SET title_es = 'Conversión'
WHERE resource_key = 'glossary_conversion' AND md5(replace(title_es, chr(13), '')) = '3bb1503332637805beddb73a2dd1fe1b';

UPDATE public.business_learning_resources SET body_es = 'El momento en que una persona interesada toma la acción que buscabas, como comprar, llamar o agendar una cita.'
WHERE resource_key = 'glossary_conversion' AND md5(replace(body_es, chr(13), '')) = '9e18197fd3ca0a98d95134846a86ce27';

UPDATE public.business_learning_resources SET title_es = 'Interacción'
WHERE resource_key = 'glossary_engagement' AND md5(replace(title_es, chr(13), '')) = '7f30074f0a1c40ee3c7553f487ff05e0';

UPDATE public.business_learning_resources SET body_es = 'La forma en que las personas interactúan con tus publicaciones, como comentarios, mensajes y veces que comparten tu contenido.'
WHERE resource_key = 'glossary_engagement' AND md5(replace(body_es, chr(13), '')) = 'bd0202a771eaacabc27d9ad9fca2be43';

UPDATE public.business_learning_resources SET body_es = 'El conjunto de colores, logo, tono de voz e imágenes que hacen que tu negocio se vea y suene igual en todos lados.'
WHERE resource_key = 'glossary_branding' AND md5(replace(body_es, chr(13), '')) = 'da02300ae9f209fca332e992fb664a43';

UPDATE public.business_learning_resources SET body_es = 'La descripción de la persona que tu negocio busca atender de forma principal, basada en necesidades y características reales.'
WHERE resource_key = 'glossary_target_customer' AND md5(replace(body_es, chr(13), '')) = 'd1817e8d3b898410404110a2010a2789';

UPDATE public.business_learning_resources SET title_es = 'Reseña'
WHERE resource_key = 'glossary_review' AND md5(replace(title_es, chr(13), '')) = '81daf2193425fc7345a48a7d64f580af';

UPDATE public.business_learning_resources SET body_es = 'El comentario y calificación que un cliente deja sobre su experiencia con tu negocio en plataformas como Google.'
WHERE resource_key = 'glossary_review' AND md5(replace(body_es, chr(13), '')) = '9537c221952a25d0d7e57b97142d1be3';

UPDATE public.business_learning_resources SET body_es = 'La versión gratuita de WhatsApp diseñada para negocios, con perfil de negocio, respuestas rápidas y mensajes automáticos.'
WHERE resource_key = 'glossary_whatsapp_business' AND md5(replace(body_es, chr(13), '')) = '4ef1d8d5f13ae038c31d3819a16f373d';

UPDATE public.business_learning_resources SET title_es = 'Analítica'
WHERE resource_key = 'glossary_analytics' AND md5(replace(title_es, chr(13), '')) = 'a0a79ce3242f61e8558c53dcd3acb55e';

UPDATE public.business_learning_resources SET body_es = 'Los números que muestran cómo se comporta tu negocio o tus publicaciones, como cuántas personas vieron o contactaron.'
WHERE resource_key = 'glossary_analytics' AND md5(replace(body_es, chr(13), '')) = '090b2d6d945c8a6fc5cb31654d263f07';

UPDATE public.business_learning_resources SET body_es = 'Un cliente nuevo que llega a tu negocio porque otro cliente satisfecho lo recomendó.'
WHERE resource_key = 'glossary_referral' AND md5(replace(body_es, chr(13), '')) = '3f39ee4d61346852b4b442921cee9e9e';

UPDATE public.business_learning_resources SET body_es = 'La parte del precio de venta que queda como ganancia después de restar los costos directos de ese producto o servicio.'
WHERE resource_key = 'glossary_profit_margin' AND md5(replace(body_es, chr(13), '')) = '545dfbad332f4c86f8b5e827060b9f55';

UPDATE public.business_learning_resources SET body_es = 'Los gastos que tu negocio paga sin importar cuánto vendas, como renta, servicios básicos y ciertos sueldos.'
WHERE resource_key = 'glossary_overhead' AND md5(replace(body_es, chr(13), '')) = '1f6fb2aa2015e23eac060684e0a5755f';

UPDATE public.business_learning_resources SET body_es = 'Cualquier información personal de un cliente que tu negocio guarda, como su teléfono, correo o dirección.'
WHERE resource_key = 'glossary_customer_data' AND md5(replace(body_es, chr(13), '')) = '25e9b45258a873e0e8cf3e527ac1872e';

UPDATE public.business_learning_resources SET title_es = 'Lista de verificación: información consistente'
WHERE resource_key = 'checklist_business_info_consistency' AND md5(replace(title_es, chr(13), '')) = 'aa7e8664c60ed266645a6b4a24da48b2';

UPDATE public.business_learning_resources SET body_es = 'Nombre exacto del negocio escrito igual en todos lados
Dirección completa y correcta en cada perfil
Teléfono principal correcto en cada perfil
Correo electrónico correcto en cada perfil
Horario de atención actualizado en cada perfil
Revisión programada cada tres a cuatro meses'
WHERE resource_key = 'checklist_business_info_consistency' AND md5(replace(body_es, chr(13), '')) = '370d04ee80d2faddc1dbbe0192f8dc12';

UPDATE public.business_learning_resources SET title_es = 'Lista de verificación: respuesta semanal en WhatsApp'
WHERE resource_key = 'checklist_whatsapp_weekly_response' AND md5(replace(title_es, chr(13), '')) = 'a61c54066c838204f4f9873d7cc77f65';

UPDATE public.business_learning_resources SET body_es = 'Mensaje de bienvenida automático configurado
Mensaje de ausencia configurado para fuera de horario
Respuestas rápidas guardadas para preguntas frecuentes
Tiempo máximo de respuesta definido
Revisión diaria de mensajes pendientes'
WHERE resource_key = 'checklist_whatsapp_weekly_response' AND md5(replace(body_es, chr(13), '')) = '3924231f06e7c8393f54d3520ecda5ff';

UPDATE public.business_learning_resources SET title_es = 'Lista de verificación: perfil de Google Business'
WHERE resource_key = 'checklist_google_business_setup' AND md5(replace(title_es, chr(13), '')) = '392ecb014e3c8b70c94172c4f525d4e1';

UPDATE public.business_learning_resources SET body_es = 'Perfil creado y verificado
Nombre, dirección, teléfono y horario correctos
Descripción clara del negocio escrita
Al menos ocho fotos reales subidas
Categoría del negocio seleccionada correctamente
Revisión mensual programada'
WHERE resource_key = 'checklist_google_business_setup' AND md5(replace(body_es, chr(13), '')) = 'b0e24ee9e54781c9853151ad599995fe';

UPDATE public.business_learning_resources SET title_es = 'Plantilla: respuesta a reseñas'
WHERE resource_key = 'template_review_response' AND md5(replace(title_es, chr(13), '')) = '7c1b2aa17103746473c85e3728ff0e03';

UPDATE public.business_learning_resources SET body_es = 'Para reseñas positivas: Gracias [nombre] por tu comentario, nos alegra mucho haberte ayudado con [detalle específico].
Para reseñas difíciles: Gracias por contarnos tu experiencia, [nombre]. Lamentamos que [problema] no haya sido lo que esperabas. Nos gustaría conocer más detalles, puedes escribirnos directamente a [teléfono o correo].'
WHERE resource_key = 'template_review_response' AND md5(replace(body_es, chr(13), '')) = '84e4de2ba894b739a15e841033041ef2';

UPDATE public.business_learning_resources SET body_es = 'Columnas sugeridas: Fecha, Descripción del gasto, Categoría (materiales, renta, servicios, transporte, sueldos, otros), Monto.
Al final del mes suma cada categoría y compara el total contra tus ingresos del mismo mes para conocer tu ganancia real.'
WHERE resource_key = 'template_monthly_expense_tracker' AND md5(replace(body_es, chr(13), '')) = 'b54dffa01cf4d4d8a46324a27794773d';

UPDATE public.business_learning_resources SET title_es = 'Lista de verificación: preparación para fotos'
WHERE resource_key = 'checklist_photo_shoot_prep' AND md5(replace(title_es, chr(13), '')) = '8e6f7efaf1380233aab75316c4f3a777';

UPDATE public.business_learning_resources SET body_es = 'Local limpio y ordenado antes de tomar fotos
Buena luz natural disponible, evitar flash directo
Productos o espacios acomodados de forma atractiva
Varios ángulos tomados de cada producto o espacio
Fotos revisadas y las mejores seleccionadas antes de subir'
WHERE resource_key = 'checklist_photo_shoot_prep' AND md5(replace(body_es, chr(13), '')) = '0ce9bd6444609422051b915c4ff82fba';

UPDATE public.business_learning_resources SET title_es = 'Plantilla: cómo pedir un referido'
WHERE resource_key = 'template_referral_ask_script' AND md5(replace(title_es, chr(13), '')) = 'cd07cfb7e9601c7d159c8b1a658d099e';

UPDATE public.business_learning_resources SET body_es = 'Ejemplo de mensaje: Hola [nombre], me alegra mucho que hayas quedado contento con [producto o servicio]. Si conoces a alguien que pueda necesitar algo similar, se lo agradecería mucho si le compartes mi contacto.'
WHERE resource_key = 'template_referral_ask_script' AND md5(replace(body_es, chr(13), '')) = '1087110c154c05f300c01544990ec982';
