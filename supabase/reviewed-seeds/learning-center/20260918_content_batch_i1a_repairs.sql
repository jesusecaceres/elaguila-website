-- =============================================================================
-- Leonix Learning Center — I-1A LIVE TEXT REPAIRS (Parts B + C of content batch I-1)
-- =============================================================================
-- GENERATED FILE. Do not edit by hand:
--   npx tsx scripts/generate-learning-content-seed-i1.ts --write
--
-- DERIVED, NOT FORKED: the statements below are Parts B and C of
--   supabase/reviewed-seeds/learning-center/20260918_content_batch_i1.sql, byte for byte.
-- Part A (the three new lessons) is deliberately ABSENT. It is I-1B and is not authorized here.
--
-- TARGET: the canonical project Leonix Media (ref xuieateniufcrsfdomwl) and no other.
-- REVIEWED SEED — NOT A MIGRATION. DO NOT move it into supabase/migrations/. DO NOT use a blind
-- `supabase db push`. Apply explicitly, following docs/learning-center-i1-canonical-apply-runbook.md.
--
-- 80 guarded UPDATEs (75 Spanish accent repairs + 5 English grammar repairs) of text that is already
-- public. 0 INSERT · 0 DELETE · 0 DDL. One transaction; the closing assertion block aborts it (nothing is
-- committed) unless every repaired value is exactly the reviewed text, the lesson count is unchanged and
-- no I-1 lesson key exists. Idempotent: after a successful apply every guard matches nothing.
-- =============================================================================

BEGIN;

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

-- ---------------------------------------------------------------------------
-- PART C — REVIEWED ENGLISH GRAMMAR REPAIRS (exactly five; guarded; apostrophes only)
-- ---------------------------------------------------------------------------

-- C1. business_learning_categories.proteccion_y_datos.summary_en: "customers information" -> "customers' information"
UPDATE public.business_learning_categories SET summary_en = 'How to handle your customers'' information responsibly.'
WHERE category_key = 'proteccion_y_datos' AND md5(replace(summary_en, chr(13), '')) = '61153ca6ae17df64237779105644c441';

-- C2. business_learning_lessons.customer_data_protection.summary_en: "customers information" -> "customers' information"
UPDATE public.business_learning_lessons SET summary_en = 'Coming soon: how to carefully handle your customers'' information.'
WHERE lesson_key = 'customer_data_protection' AND md5(replace(summary_en, chr(13), '')) = '7fd2ec686bc8596c285ab8613d17d8d0';

-- C3. business_learning_lessons.reviews_and_customer_response.body_en: "many people decisions" -> "many people's decisions"
UPDATE public.business_learning_lessons SET body_en = 'Online reviews influence many people''s decisions before they choose a business. How you respond to those reviews, both the good ones and the difficult ones, says a lot about how you treat your customers in general.

Why it matters: a negative review with no response can make it look like the business does not care about its customers opinions. A thoughtful response, even to a difficult criticism, shows that you take your customers experience seriously and that you are willing to improve.

Practical steps:
1. Review the feedback you already have on your Google Business profile and any other platforms where your business appears, and note which ones still have no response.
2. For positive reviews, respond with a brief and personal thank you, mentioning something specific from what the person wrote if possible.
3. For difficult reviews, wait a moment before responding if you feel upset, then write a calm reply that acknowledges the concern without becoming defensive.
4. Never share private customer information in your public response, and if the issue needs more detail, invite the person to contact you directly by phone or WhatsApp.
5. Ask satisfied customers for reviews in a natural way after a good experience, for example by sending a direct link to your Google Business profile.

An important note: responding well to reviews does not guarantee that you will stop receiving criticism, or that you will rank higher in search results. What it does is show future customers how you treat people when something does not go perfectly.'
WHERE lesson_key = 'reviews_and_customer_response' AND md5(replace(body_en, chr(13), '')) = '6ced81b086210c27545f9c82f68939f6';

-- C4. business_learning_lessons.reviews_and_customer_response.body_en: "customers experience" -> "customers' experience"
UPDATE public.business_learning_lessons SET body_en = 'Online reviews influence many people''s decisions before they choose a business. How you respond to those reviews, both the good ones and the difficult ones, says a lot about how you treat your customers in general.

Why it matters: a negative review with no response can make it look like the business does not care about its customers opinions. A thoughtful response, even to a difficult criticism, shows that you take your customers'' experience seriously and that you are willing to improve.

Practical steps:
1. Review the feedback you already have on your Google Business profile and any other platforms where your business appears, and note which ones still have no response.
2. For positive reviews, respond with a brief and personal thank you, mentioning something specific from what the person wrote if possible.
3. For difficult reviews, wait a moment before responding if you feel upset, then write a calm reply that acknowledges the concern without becoming defensive.
4. Never share private customer information in your public response, and if the issue needs more detail, invite the person to contact you directly by phone or WhatsApp.
5. Ask satisfied customers for reviews in a natural way after a good experience, for example by sending a direct link to your Google Business profile.

An important note: responding well to reviews does not guarantee that you will stop receiving criticism, or that you will rank higher in search results. What it does is show future customers how you treat people when something does not go perfectly.'
WHERE lesson_key = 'reviews_and_customer_response' AND md5(replace(body_en, chr(13), '')) = 'd108b933d2b64baf0de7abbf9e96f0ba';

-- C5. business_learning_lessons.reviews_and_customer_response.body_en: "customers opinions" -> "customers' opinions"
UPDATE public.business_learning_lessons SET body_en = 'Online reviews influence many people''s decisions before they choose a business. How you respond to those reviews, both the good ones and the difficult ones, says a lot about how you treat your customers in general.

Why it matters: a negative review with no response can make it look like the business does not care about its customers'' opinions. A thoughtful response, even to a difficult criticism, shows that you take your customers'' experience seriously and that you are willing to improve.

Practical steps:
1. Review the feedback you already have on your Google Business profile and any other platforms where your business appears, and note which ones still have no response.
2. For positive reviews, respond with a brief and personal thank you, mentioning something specific from what the person wrote if possible.
3. For difficult reviews, wait a moment before responding if you feel upset, then write a calm reply that acknowledges the concern without becoming defensive.
4. Never share private customer information in your public response, and if the issue needs more detail, invite the person to contact you directly by phone or WhatsApp.
5. Ask satisfied customers for reviews in a natural way after a good experience, for example by sending a direct link to your Google Business profile.

An important note: responding well to reviews does not guarantee that you will stop receiving criticism, or that you will rank higher in search results. What it does is show future customers how you treat people when something does not go perfectly.'
WHERE lesson_key = 'reviews_and_customer_response' AND md5(replace(body_en, chr(13), '')) = 'b74eab3a296a8aa290e932e8bc81bd50';

-- ---------------------------------------------------------------------------
-- Assertions — raise (and therefore roll back) on any mismatch
-- ---------------------------------------------------------------------------

DO $i1a$
DECLARE
  n integer;
  bad integer := 0;
BEGIN
  SELECT count(*) INTO n FROM (VALUES
      ('fundamentos_del_negocio', 'summary_es', '7d7dbdc84ad24a462c95eb3d17e14afc'),
      ('clientes_y_demanda', 'summary_es', '8a1c96e0c8e5afbc71f5266d7f79bab5'),
      ('dinero_y_capacidad', 'summary_es', 'dbed805c0ec2916055bfc93235443461'),
      ('visibilidad_y_publicidad', 'summary_es', 'e46ba6f29b87a18be0ddfa5c75b8b463'),
      ('comunicacion_y_reputacion', 'title_es', 'fe907d5337f6549608a2850cc41c6a60'),
      ('comunicacion_y_reputacion', 'summary_es', 'da9c52d979b02e29d70b4128ce5808c4'),
      ('proteccion_y_datos', 'title_es', 'd0fdf2f32b4b3e49c8504496c6978175'),
      ('proteccion_y_datos', 'summary_es', '0410e6a5f20fecf117f9e0a551da326c'),
      ('proteccion_y_datos', 'summary_en', '9a7aa6f663347f6d513e80af42193301')
    ) AS g(k, col, h) LEFT JOIN public.business_learning_categories t ON t.category_key = g.k WHERE (CASE g.col WHEN 'summary_es' THEN md5(replace(t.summary_es, chr(13), '')) WHEN 'title_es' THEN md5(replace(t.title_es, chr(13), '')) WHEN 'summary_en' THEN md5(replace(t.summary_en, chr(13), '')) END) IS DISTINCT FROM g.h;
  bad := bad + n;
  SELECT count(*) INTO n FROM (VALUES
      ('consistent_business_information', 'title_es', 'b4a043883048b28c2b3ac310753fa4b9'),
      ('consistent_business_information', 'summary_es', '188456c3b179c078cbd568e28598d254'),
      ('consistent_business_information', 'body_es', '5532e3202f7af3ebf6fa6670d01f39b4'),
      ('who_is_your_customer', 'title_es', 'eee6b0ebcce8b7676ddcae0a1c521096'),
      ('who_is_your_customer', 'summary_es', '0e40a27ca56f318324d1359f0bbacf8c'),
      ('who_is_your_customer', 'body_es', '674e136ef798a8a0696d42d3eca83e0b'),
      ('revenue_vs_profit', 'body_es', '540c0eac5bde263a4065981c04ee7b0f'),
      ('healthy_boundaries_and_capacity', 'title_es', '5b1e9e1a764e8f691ed8ed04e7817ddd'),
      ('healthy_boundaries_and_capacity', 'summary_es', '0d5a99952605dbd9d4e7c2e3024aca69'),
      ('healthy_boundaries_and_capacity', 'body_es', '1179b7580d6a83eb9aee0ebbfbd24757'),
      ('google_business_basics', 'summary_es', 'dda4961a276efa05899b103b8ed98231'),
      ('google_business_basics', 'body_es', '16c113806dfbba810381198054dc1315'),
      ('advertising_fundamentals', 'summary_es', '70d09e6565454ed2e1e8f3130fa97a4b'),
      ('advertising_fundamentals', 'body_es', 'c0d572e9d1e45b69099b37a3e6468cce'),
      ('whatsapp_business_basics', 'summary_es', 'f3acc1e55b5e34f17770942a75611553'),
      ('whatsapp_business_basics', 'body_es', 'd3c5aadd9d85fb3e69305594fa519edd'),
      ('reviews_and_customer_response', 'title_es', 'c49669729135e6c64807d0a163b564b4'),
      ('reviews_and_customer_response', 'summary_es', '182bb6cf83c17de691e7c06490c35c71'),
      ('reviews_and_customer_response', 'body_es', 'af90eee3e53d786a7a21800f9e06e54c'),
      ('branding_basics', 'summary_es', '800eb88d9ac7970668d7100338b73b0d'),
      ('referrals_basics', 'summary_es', '30f115a995f9a16fc9afa2ee3eccd146'),
      ('profitable_service_basics', 'summary_es', 'e70e6d73c35c0033394f5f6fc2779a37'),
      ('simple_analytics', 'title_es', 'e77a7c4828b22e69949b9c81aad8c644'),
      ('simple_analytics', 'summary_es', '9124f2a9d537255f8e55d002b5027c68'),
      ('local_seo_basics', 'summary_es', 'ae9da858d9d2121c8164826becef080e'),
      ('product_photography_basics', 'title_es', '8b16b851209e790777cc5b22079a9ca2'),
      ('product_photography_basics', 'summary_es', 'c2e15f37cd3aa941d0c8ec24a83c9ff4'),
      ('short_video_basics', 'title_es', 'd3fe89f700582965aeb22e994245314d'),
      ('short_video_basics', 'summary_es', 'a7094deda1ff49efb72caa256fef2848'),
      ('customer_data_protection', 'title_es', 'd43eb377239e2bc10a9dda556e763ae1'),
      ('customer_data_protection', 'summary_es', 'd28b502b49ab35e2512350f2045ac181'),
      ('customer_data_protection', 'summary_en', '12ce9a1499ba75479def2f358a61d09f'),
      ('reviews_and_customer_response', 'body_en', 'd86d9502aec0d15da27b22481931e1c7')
    ) AS g(k, col, h) LEFT JOIN public.business_learning_lessons t ON t.lesson_key = g.k WHERE (CASE g.col WHEN 'title_es' THEN md5(replace(t.title_es, chr(13), '')) WHEN 'summary_es' THEN md5(replace(t.summary_es, chr(13), '')) WHEN 'body_es' THEN md5(replace(t.body_es, chr(13), '')) WHEN 'summary_en' THEN md5(replace(t.summary_en, chr(13), '')) WHEN 'body_en' THEN md5(replace(t.body_en, chr(13), '')) END) IS DISTINCT FROM g.h;
  bad := bad + n;
  SELECT count(*) INTO n FROM (VALUES
      ('glossary_google_business_profile', 'body_es', '12ec3514784c49aacda1a8cffeccad38'),
      ('glossary_seo', 'body_es', '84a5055ec59d2d412304778a3132efd0'),
      ('glossary_local_seo', 'body_es', 'c37924dcd663dae24779fa316d1f07ec'),
      ('glossary_landing_page', 'title_es', '01018725afe3572aa4a5c9b298f9c26d'),
      ('glossary_landing_page', 'body_es', 'd17f322c98a33ef6038d21e74824f11c'),
      ('glossary_cta', 'title_es', 'a1482a0d77fbc30928b3a01409642af5'),
      ('glossary_cta', 'body_es', '22cced717fdaf1e1512ed58abdf5ff3f'),
      ('glossary_lead', 'body_es', '025bfe2db17bcc2e4f7892a3f991067d'),
      ('glossary_conversion', 'title_es', 'da7b6d8dfe264f4ccff36490deb37c50'),
      ('glossary_conversion', 'body_es', 'ca77afdc3f36b565d111903ee69324d0'),
      ('glossary_engagement', 'title_es', 'b867cd50c088c60c804d5ebab466840e'),
      ('glossary_engagement', 'body_es', '77277bcbb8e9cdb4c1e745a0313c06b1'),
      ('glossary_branding', 'body_es', '77d8c025651d8d476dc7bf3641292e20'),
      ('glossary_target_customer', 'body_es', '2c778769875abe4eb578d6f8891e5dd8'),
      ('glossary_review', 'title_es', 'f7464ed42d0f9b053923988070138470'),
      ('glossary_review', 'body_es', '0b8ef72f5996e13fb50406420729756b'),
      ('glossary_whatsapp_business', 'body_es', '9a6bf9f46a387074b819de948a042e7f'),
      ('glossary_analytics', 'title_es', '7d10e92da5b0c508eef86104fb28312c'),
      ('glossary_analytics', 'body_es', '9d33146cfc2b9d12bde90a869501bc97'),
      ('glossary_referral', 'body_es', '1b128312c7da671a6ac1e16cbb95fdce'),
      ('glossary_profit_margin', 'body_es', '2f9347d63e676d3f2477a581957de87d'),
      ('glossary_overhead', 'body_es', '5dbbf2bbe9fc246e6e08ee8ea8a371b7'),
      ('glossary_customer_data', 'body_es', '9e4ef1516b74c38e1ca32c2e77ba63c1'),
      ('checklist_business_info_consistency', 'title_es', '5a9f87e8f5da0e1c9a7c2f3e7888105f'),
      ('checklist_business_info_consistency', 'body_es', '4869b59669a438157faf5a1ef40b94a3'),
      ('checklist_whatsapp_weekly_response', 'title_es', '7005b9881946f1cea99c2d0d48bdde99'),
      ('checklist_whatsapp_weekly_response', 'body_es', '12f980f206f5c92a18cf0207e1e4825d'),
      ('checklist_google_business_setup', 'title_es', '2f477e4df8ef437e4a85ccff68d92d33'),
      ('checklist_google_business_setup', 'body_es', '0aade4a19f0b008ee3ba4f11744e7718'),
      ('template_review_response', 'title_es', '3b1199dc70848aa1a855c7146adf09a6'),
      ('template_review_response', 'body_es', 'fada14d645934a6663116db299f852b8'),
      ('template_monthly_expense_tracker', 'body_es', 'b4a27b8f80f71fc41097c48bb31dc3a8'),
      ('checklist_photo_shoot_prep', 'title_es', '37b45488fb6f2743d5da7add31b830b4'),
      ('checklist_photo_shoot_prep', 'body_es', '4d7d56e1bea09850bebed9e57db1a931'),
      ('template_referral_ask_script', 'title_es', '96e50a2afe41e709e94b30b574b4ba00'),
      ('template_referral_ask_script', 'body_es', 'f1fe42d2932a7c46724ed9be9bd45528')
    ) AS g(k, col, h) LEFT JOIN public.business_learning_resources t ON t.resource_key = g.k WHERE (CASE g.col WHEN 'body_es' THEN md5(replace(t.body_es, chr(13), '')) WHEN 'title_es' THEN md5(replace(t.title_es, chr(13), '')) END) IS DISTINCT FROM g.h;
  bad := bad + n;
  IF bad <> 0 THEN RAISE EXCEPTION 'I-1A: % repaired value(s) are not the reviewed text — rolling back', bad; END IF;
  SELECT count(*) INTO n FROM public.business_learning_lessons;
  IF n <> 16 THEN RAISE EXCEPTION 'I-1A: expected 16 lessons, found % — rolling back', n; END IF;
  SELECT count(*) INTO n FROM public.business_learning_lessons WHERE lesson_key IN ('what_problem_do_you_solve', 'customer_conversations', 'know_your_competition');
  IF n <> 0 THEN RAISE EXCEPTION 'I-1A: % I-1 lesson row(s) exist — Part A is not part of this apply', n; END IF;
END
$i1a$;

COMMIT;
