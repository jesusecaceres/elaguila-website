/**
 * Leonix doctrine overlay for published lessons whose teaching still lives in the database body.
 * The database row remains the publish-state truth. This module only replaces summary and body
 * text for lessons whose stored wording treats profit as personal take, customers as wins, or
 * advertising as urgency. Authored LessonPackages ignore these bodies.
 */
import type { LearningCategory, LearningLesson } from "./types";

type LessonCopy = {
  summaryEs: string;
  summaryEn: string;
  bodyEs: string;
  bodyEn: string;
};

const LESSONS: Record<string, LessonCopy> = {
  revenue_vs_profit: {
    summaryEs: "La diferencia entre lo que vendes y lo que queda para sostener el negocio, a las personas y el trabajo.",
    summaryEn: "The difference between what you sell and what remains to sustain the business, the people, and the work.",
    bodyEs: `Vender mucho no siempre deja un negocio sano. Ingresos es todo el dinero que entra. Ganancia es lo que queda después de pagar los costos. Esa ganancia no es un premio para acumular: es lo que permite sobrevivir, pagar a quienes trabajan, cuidar a las familias, reinvertir, mejorar el servicio y seguir ayudando a los clientes.

Por qué importa: si solo miras cuánto vendes, puedes bajar precios para vender más y descubrir que cada venta debilita el negocio. Un precio justo cubre el costo, el trabajo y una ganancia que el negocio puede usar con responsabilidad.

Pasos prácticos:
1. Durante un mes completo, anota todo el dinero que entra por ventas. Ese número es tu ingreso, no tu ganancia.
2. En una lista separada, anota los costos del mismo mes: materiales, renta, transporte, sueldos, servicios y cualquier otro gasto del negocio.
3. Resta el total de costos del total de ingresos. Lo que queda es la ganancia real de ese mes, positiva o negativa.
4. Revisa qué productos o servicios dejan ganancia después de sus costos, no solo cuáles se venden más. Un servicio que se vende mucho y no cubre el trabajo no se puede sostener.
5. Repite el ejercicio cada mes durante al menos tres meses, y anota para qué usará el negocio esa ganancia: reservas, salarios, mejoras o seguir sirviendo.

Un dato importante: esta lección no te dice cuánto deberías ganar ni garantiza rentabilidad. Te ayuda a ver si el negocio puede sostenerse y servir bien, con información real. Para decisiones fiscales, consulta a un profesional autorizado.`,
    bodyEn: `Selling a lot does not always leave a healthy business. Revenue is all the money that comes in. Profit is what remains after the costs are paid. That profit is not a prize to pile up: it is what lets the business survive, pay the people who work, support families, reinvest, improve the service, and keep helping customers.

Why it matters: if you only look at how much you sell, you can lower prices to sell more and then discover that each sale weakens the business. A fair price covers the cost, the labor, and a profit the business can use responsibly.

Practical steps:
1. Over one full month, write down all the money that comes in from sales. That number is your revenue, not your profit.
2. In a separate list, write down that month's costs: materials, rent, transportation, wages, services, and any other business expense.
3. Subtract total costs from total revenue. What remains is that month's real profit, whether positive or negative.
4. Review which products or services leave a profit after their costs, not only which ones sell the most. A service that sells a lot and does not cover the work cannot be sustained.
5. Repeat this every month for at least three months, and note what the business will use that profit for: reserves, wages, improvements, or continuing to serve.

An important note: this lesson does not tell you how much you should earn, and it does not guarantee profitability. It helps you see whether the business can sustain itself and serve well, with real information. For tax decisions, consult a licensed professional.`,
  },
  consistent_business_information: {
    summaryEs: "Por qué tu nombre, dirección, teléfono y horario deben coincidir en todos lados, para no hacer perder el tiempo a quien te busca.",
    summaryEn: "Why your name, address, phone, and hours should match everywhere, so you do not waste the time of the person looking for you.",
    bodyEs: `Cuando el nombre, la dirección, el teléfono y el horario de tu negocio aparecen distintos en cada lugar, la persona que te busca se confunde. Puede llamar al número equivocado o llegar cuando estás cerrado. Eso no es un detalle menor: es faltar al cuidado de quien ya quiso encontrarte.

Por qué importa: información igual en todos lados ayuda a que la gente confíe, porque ve la misma historia. Cada diferencia les cuesta tiempo y puede alejar a alguien que ya estaba interesado.

Pasos prácticos:
1. Escribe en un solo documento el nombre exacto de tu negocio, la dirección completa, el teléfono principal, el correo electrónico y el horario real de atención, incluyendo días festivos si aplica.
2. Haz una lista de cada lugar donde tu negocio aparece hoy: tu perfil de Google Business, tus redes sociales, tu sitio web si tienes uno, directorios locales, tarjetas de presentación y cualquier anuncio impreso.
3. Revisa cada lugar de la lista y compara la información contra tu documento maestro. Anota cada diferencia que encuentres, por pequeña que sea.
4. Corrige cada lugar, uno por uno, hasta que toda la información coincida exactamente con tu documento maestro.
5. Marca en tu calendario una revisión cada tres o cuatro meses, porque los horarios y los teléfonos cambian y es fácil que un lugar se quede desactualizado.

Un dato importante: mantener tu información consistente no garantiza más clientes ni un mejor lugar en las búsquedas. Lo que sí hace es quitar una confusión que puede alejar a personas que ya querían contactarte.`,
    bodyEn: `When your business name, address, phone number, and hours appear differently in every place, the person looking for you gets confused. They may call the wrong number or arrive when you are closed. That is not a small detail: it fails the person who already tried to find you.

Why it matters: matching information helps people trust you, because they see the same story everywhere. Each difference costs them time and can turn away someone who was already interested.

Practical steps:
1. Write down, in a single document, your exact business name, full address, main phone number, email address, and real operating hours, including holidays if that applies.
2. Make a list of every place your business appears today: your Google Business profile, your social media accounts, your website if you have one, local directories, business cards, and any printed advertising.
3. Go through each place on your list and compare the information against your master document. Note every difference you find, no matter how small.
4. Correct each place, one at a time, until all of the information matches your master document exactly.
5. Set a reminder to review this every three or four months, because hours and phone numbers change and it is easy for one place to fall out of date.

An important note: keeping your information consistent does not guarantee more customers or a better place in search results. What it does is remove a confusion that can turn away people who already wanted to contact you.`,
  },
  google_business_basics: {
    summaryEs: "Cómo crear y mantener un perfil completo y verdadero en Google Business.",
    summaryEn: "How to create and maintain a complete, truthful Google Business profile.",
    bodyEs: `Cuando alguien busca un negocio como el tuyo en Google o en Google Maps, lo primero que ve suele ser tu perfil de Google Business, no tu sitio web. Un perfil completo y correcto ayuda a que las personas te encuentren y confíen en lo que ven.

Por qué importa: un perfil incompleto, con información vieja o sin fotos, hace dudar si el negocio sigue abierto o si la información es confiable. Esa duda no es justa para quien busca un servicio real.

Pasos prácticos:
1. Busca tu negocio en Google para ver si ya tienes un perfil de Google Business. Si no existe, puedes crear uno gratis siguiendo las instrucciones que Google proporciona.
2. Verifica que el nombre, la dirección, el teléfono y el horario coincidan exactamente con tu documento maestro de información del negocio.
3. Escribe una descripción clara y verdadera: qué ofreces, a quién atiendes y qué es distinto de verdad, en lenguaje sencillo, sin promesas infladas.
4. Sube al menos ocho a diez fotos reales de tu negocio: el local, tus productos o servicios, y tu equipo si es apropiado para tu tipo de negocio.
5. Revisa tu perfil cada mes para actualizar horarios especiales, responder preguntas y confirmar que toda la información siga siendo correcta.

Un dato importante: tener un perfil completo no garantiza que aparecerás primero en las búsquedas ni que recibirás más clientes. Lo que sí hace es asegurar que, cuando alguien te busque, encuentre información clara y confiable.`,
    bodyEn: `When someone searches for a business like yours on Google or Google Maps, the first thing they usually see is your Google Business profile, not your website. A complete and accurate profile helps people find you and trust what they see.

Why it matters: an incomplete profile, with outdated information or no photos, makes people unsure whether the business is still open or whether the information is reliable. That doubt is unfair to someone looking for a real service.

Practical steps:
1. Search for your business on Google to see whether you already have a Google Business profile. If it does not exist, you can create one for free by following the instructions Google provides.
2. Check that the name, address, phone number, and hours match your master business information document exactly.
3. Write a clear, truthful description: what you offer, who you serve, and what is genuinely different, in plain language, without inflated promises.
4. Upload at least eight to ten real photos of your business: your location, your products or services, and your team if that fits your type of business.
5. Review your profile every month to update special hours, answer questions, and confirm that all of the information is still correct.

An important note: having a complete profile does not guarantee that you will appear first in search results or that you will receive more customers. What it does is make sure that when someone looks for you, they find clear and trustworthy information.`,
  },
  advertising_fundamentals: {
    summaryEs: "Conceptos básicos para anunciar con verdad, antes de pagar por tu primer anuncio.",
    summaryEn: "Basic concepts for advertising truthfully, before you pay for your first ad.",
    bodyEs: `Anunciarte sin un plan claro suele significar gastar dinero sin saber si el mensaje es verdadero o útil. Antes de pagar, entiende a quién sirves, qué problema resuelves y qué puede hacer después la persona: llamar, visitar o escribir.

Por qué importa: un anuncio dirigido a la persona equivocada, con una promesa inflada o sin una forma clara de contacto, cuesta dinero y daña la confianza. La publicidad debe decir la verdad sobre lo que ofreces.

Pasos prácticos:
1. Define un objetivo claro: que la gente llame, visite el negocio, escriba por WhatsApp o compre. Un anuncio no puede hacer todo a la vez.
2. Escribe el mensaje pensando en la persona de la lección sobre tu cliente. Menciona su problema real y cómo lo resuelves, sin urgencia falsa ni promesas que no puedes cumplir.
3. Incluye una acción clara y honesta: llámanos, visítanos o escríbenos por WhatsApp, con datos de contacto correctos y fáciles de encontrar.
4. Elige dónde anunciarte según dónde está esa persona: redes sociales, Google, medios locales o una combinación, no por costumbre.
5. Antes de repetir un anuncio, revisa si hubo un resultado que puedas medir, como llamadas, mensajes o visitas, y corrige el mensaje si no fue claro o no fue fiel a tu oferta.

Un dato importante: ningún anuncio garantiza ventas ni un número de clientes nuevos. La publicidad ayuda a que más personas conozcan un servicio real. El resultado también depende de tu oferta, de un precio justo y de la calidad con la que atiendes.`,
    bodyEn: `Advertising without a clear plan usually means spending money without knowing whether the message is true or useful. Before you pay, understand who you serve, what problem you solve, and what the person can do next: call, visit, or write.

Why it matters: an ad aimed at the wrong person, with an inflated promise or no clear way to make contact, costs money and damages trust. Advertising should tell the truth about what you offer.

Practical steps:
1. Define a clear goal: people call, visit the business, write on WhatsApp, or buy. One ad cannot do all of these at once.
2. Write the message with the person from the who-is-your-customer lesson in mind. Mention their real problem and how you solve it, without fake urgency or promises you cannot keep.
3. Include a clear, honest action: call us, visit us, or message us on WhatsApp, with correct contact details that are easy to find.
4. Choose where to advertise based on where that person actually is: social media, Google, local media, or a combination, not out of habit.
5. Before repeating an ad, check whether it produced a result you can measure, such as calls, messages, or visits, and correct the message if it was unclear or untrue to your offer.

An important note: no ad guarantees sales or a number of new customers. Advertising helps more people learn about a real service. The result also depends on your offer, a fair price, and the quality of how you serve.`,
  },
  whatsapp_business_basics: {
    summaryEs: "Cómo configurar WhatsApp Business para responder con claridad y respeto.",
    summaryEn: "How to set up WhatsApp Business so you can reply with clarity and respect.",
    bodyEs: `Para muchos negocios pequeños, WhatsApp es el primer lugar donde una persona hace contacto. Responder con claridad, respeto y un tiempo razonable es parte de servir bien. No se trata de ganarle la respuesta a otro negocio: se trata de no dejar esperando a quien ya confió en escribirte.

Por qué importa: alguien que espera demasiado, o que recibe una respuesta confusa, no sabe si puede confiar en ti. WhatsApp Business ofrece herramientas gratuitas para organizar la atención sin prometer lo que no puedes cumplir.

Pasos prácticos:
1. Descarga la aplicación WhatsApp Business, que es gratuita y separada de tu WhatsApp personal, y configura tu perfil con tu nombre, dirección, horario y una breve descripción verdadera.
2. Crea un mensaje de bienvenida automático para quien escribe por primera vez, agradeciendo el contacto y diciendo con honestidad en cuánto tiempo responderás.
3. Configura un mensaje de ausencia para cuando estás fuera de horario, para que la persona sepa que su mensaje llegó y cuándo le responderás.
4. Prepara respuestas rápidas para las preguntas frecuentes, como precios, horarios o ubicación, para responder con claridad sin escribir todo de nuevo cada vez.
5. Define un tiempo máximo razonable para responder durante tu horario, y revisa el teléfono con esa frecuencia para cumplir lo que prometiste.

Un dato importante: responder a tiempo no garantiza que cada persona se convierta en cliente. Lo que sí hace es honrar a quien escribió y no perder su confianza por descuido.`,
    bodyEn: `For many small businesses, WhatsApp is the first place a person makes contact. Replying with clarity, respect, and a reasonable time is part of serving well. This is not about beating another business to the reply: it is about not leaving waiting the person who already trusted you enough to write.

Why it matters: someone who waits too long, or who receives a confusing answer, does not know whether they can trust you. WhatsApp Business offers free tools to organize the care you give without promising what you cannot keep.

Practical steps:
1. Download the WhatsApp Business app, which is free and separate from your personal WhatsApp, and set up your profile with your name, address, hours, and a short truthful description.
2. Create an automatic welcome message for someone writing for the first time, thanking them and honestly saying how soon you will reply.
3. Set up an away message for outside your hours, so the person knows their message arrived and when you will reply.
4. Prepare quick replies for frequent questions, such as prices, hours, or location, so you can answer clearly without typing everything again each time.
5. Set a reasonable maximum response time during your hours, and check the phone at that frequency so you keep what you promised.

An important note: replying on time does not guarantee that every person will become a customer. What it does is honor the person who wrote and not lose their trust through carelessness.`,
  },
};

const CATEGORIES: Record<string, { summaryEs: string; summaryEn: string }> = {
  clientes_y_demanda: {
    summaryEs: "Cómo entender a las personas que sirves y merecer su confianza.",
    summaryEn: "How to understand the people you serve and earn their trust.",
  },
  dinero_y_capacidad: {
    summaryEs: "Cómo distinguir ingresos de ganancia, usar la ganancia con responsabilidad y cuidar tu capacidad de trabajo.",
    summaryEn: "How to tell revenue from profit, use profit responsibly, and protect your working capacity.",
  },
  visibilidad_y_publicidad: {
    summaryEs: "Cómo aparecer con información verdadera donde te buscan, y anunciarte con un plan claro y honesto.",
    summaryEn: "How to show up with truthful information where people look for you, and advertise with a clear, honest plan.",
  },
};

export function applyLeonixLessonDoctrine<T extends Pick<LearningLesson, "lessonKey" | "summaryEs" | "summaryEn" | "bodyEs" | "bodyEn">>(lesson: T): T {
  const copy = LESSONS[lesson.lessonKey];
  if (!copy) return lesson;
  return { ...lesson, ...copy };
}

export function applyLeonixCategoryDoctrine<T extends Pick<LearningCategory, "categoryKey" | "summaryEs" | "summaryEn">>(category: T): T {
  const copy = CATEGORIES[category.categoryKey];
  if (!copy) return category;
  return { ...category, ...copy };
}
