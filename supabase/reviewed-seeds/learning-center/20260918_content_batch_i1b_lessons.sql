-- =============================================================================
-- Leonix Learning Center — I-1B LESSON PUBLICATION (Part A of content batch I-1)
-- =============================================================================
-- GENERATED FILE. Do not edit by hand:
--   npx tsx scripts/generate-learning-content-seed-i1.ts --write
--
-- DERIVED, NOT FORKED: the three INSERTs below are Part A of
--   supabase/reviewed-seeds/learning-center/20260918_content_batch_i1.sql, byte for byte. Each body is the
--   plain-text rendition of the validated LessonPackage the page renders — no second copy of lesson text.
-- The 82 executed repairs (I-1A, I-1A.1) are NOT repeated here.
--
-- TARGET: the canonical project Leonix Media (ref xuieateniufcrsfdomwl) and no other.
-- REVIEWED SEED — NOT A MIGRATION. DO NOT move it into supabase/migrations/. DO NOT use a blind
-- `supabase db push`. Apply explicitly, following docs/learning-center-i1-canonical-apply-runbook.md.
--
-- APPLYING THIS FILE PUBLISHES THREE LESSONS. Apply it only AFTER the Learning engine that renders
-- these packages is live in production (code first, data second).
--
-- 3 INSERT · 0 UPDATE · 0 DELETE · 0 DDL. One transaction; the closing assertion block aborts it unless the
-- catalog is exactly 6 categories / 19 lessons (11 published, 8 planned) / 25 resources and each new row is
-- exactly the reviewed content. Idempotent: ON CONFLICT (lesson_key) DO NOTHING.
--
-- WITHDRAWAL (never DELETE — learner progress may reference a lesson):
--   UPDATE public.business_learning_lessons SET status = 'draft'
--   WHERE lesson_key = '<key>' AND status = 'published';
-- =============================================================================

BEGIN;

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
-- Assertions — raise (and therefore roll back) on any mismatch
-- ---------------------------------------------------------------------------

DO $i1b$
DECLARE
  n integer;
BEGIN
  SELECT count(*) INTO n FROM public.business_learning_categories;
  IF n <> 6 THEN RAISE EXCEPTION 'I-1B: expected 6 categories, found %', n; END IF;
  SELECT count(*) INTO n FROM public.business_learning_resources;
  IF n <> 25 THEN RAISE EXCEPTION 'I-1B: expected 25 resources, found %', n; END IF;
  SELECT count(*) INTO n FROM public.business_learning_lessons;
  IF n <> 19 THEN RAISE EXCEPTION 'I-1B: expected 19 lessons, found %', n; END IF;
  SELECT count(*) INTO n FROM public.business_learning_lessons WHERE status = 'published';
  IF n <> 11 THEN RAISE EXCEPTION 'I-1B: expected 11 published lessons, found %', n; END IF;
  SELECT count(*) INTO n FROM public.business_learning_lessons WHERE status = 'planned';
  IF n <> 8 THEN RAISE EXCEPTION 'I-1B: expected 8 planned lessons, found %', n; END IF;
  SELECT count(*) INTO n FROM public.business_learning_lessons WHERE lesson_key NOT IN ('what_problem_do_you_solve', 'customer_conversations', 'know_your_competition') AND status = 'published';
  IF n <> 8 THEN RAISE EXCEPTION 'I-1B: the 8 previously published lessons changed (found %)', n; END IF;
  SELECT count(*) INTO n FROM (VALUES
      ('what_problem_do_you_solve', 'clientes_y_demanda', 3, 'what_problem_do_you_solve', 10, '04fd05c2dc9be0ba2a141005f0b81098'),
      ('customer_conversations', 'clientes_y_demanda', 4, 'customer_conversations', 11, 'bbb0cfa70998d0342395b09b17fa52aa'),
      ('know_your_competition', 'clientes_y_demanda', 5, 'know_your_competition', 11, 'baa5f650e095da9b73537142b3ba8dc9')
    ) AS g(k, cat, sort, cap, mins, h)
    JOIN public.business_learning_lessons l ON l.lesson_key = g.k
    JOIN public.business_learning_categories c ON c.id = l.category_id AND c.category_key = g.cat
    WHERE l.status = 'published' AND l.published_at IS NOT NULL AND l.sort_order = g.sort AND l.capability_key = g.cap
      AND l.estimated_minutes = g.mins AND l.level = 'foundation'
      AND char_length(l.body_es) > 1200 AND char_length(l.body_en) > 1200
      AND md5(concat_ws(chr(1), l.title_es, l.title_en, l.summary_es, l.summary_en, replace(l.body_es, chr(13), ''), replace(l.body_en, chr(13), ''))) = g.h;
  IF n <> 3 THEN RAISE EXCEPTION 'I-1B: % of 3 new lessons are exactly the reviewed content — rolling back', n; END IF;
END
$i1b$;

COMMIT;
