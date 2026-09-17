-- Gate BCO-TODAY-1 — Public Business Learning Center + Idea Builder foundation.
--
-- Additive only: six new tables, no changes to any existing table/column/RPC. Every table is
-- server-only (read/written exclusively via getAdminSupabase(), the service-role client). Public
-- catalog/lesson/glossary/resource reads happen through server components using the service-role
-- client filtered to status='published' -- never through an anon grant. Signed-in progress and
-- Idea Builder drafts are always scoped to the caller's own auth_user_id, resolved server-side
-- from a verified bearer token -- never trusted from a request body. RLS is enabled with zero
-- policies on every table (deny-all for anon/authenticated), matching the businesses-family,
-- Sales Workspace, Living Business Book, and Health Map precedent exactly. Grant hardening
-- follows the owner-proven, live-certified Gate BCO-4A.6/4A.7/5A/6A pattern exactly: REVOKE ALL
-- FROM PUBLIC, then an explicit GRANT SELECT, INSERT, UPDATE, DELETE to service_role only --
-- never GRANT ALL PRIVILEGES, never a grant to anon/authenticated/PUBLIC.
--
-- Content-quality doctrine (locked correction): business_learning_lessons carries a CHECK
-- constraint (business_learning_lessons_published_body_chk) that makes it structurally
-- impossible to publish a lesson without a non-empty Spanish AND English body. The remaining
-- required learning domains beyond this gates eight fully-written lessons are seeded as real,
-- queryable 'planned' curriculum records (title, summary, capability/dimension metadata) with no
-- body -- never publicly served -- documented as the next content batch in
-- docs/business-learning-center-content-batch-02.md. The published-lesson count is never raised
-- by lowering the quality bar.
--
-- Dependency order:
--   1. public.business_learning_categories
--   2. public.business_learning_lessons    (references business_learning_categories)
--   3. public.business_learning_resources  (references business_learning_lessons)
--   4. public.business_learning_progress   (references business_learning_lessons)
--   5. public.business_capability_records  (references business_learning_lessons, admin_team_members)
--   6. public.business_idea_drafts

-- =============================================================================================
-- 1. business_learning_categories — the curriculum spine. Mutable content, not business-scoped.
-- =============================================================================================
CREATE TABLE IF NOT EXISTS public.business_learning_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  category_key text NOT NULL UNIQUE CHECK (char_length(btrim(category_key)) > 0),
  title_es text NOT NULL CHECK (char_length(btrim(title_es)) > 0 AND char_length(title_es) <= 200),
  title_en text NOT NULL CHECK (char_length(btrim(title_en)) > 0 AND char_length(title_en) <= 200),
  summary_es text NOT NULL CHECK (char_length(summary_es) <= 500),
  summary_en text NOT NULL CHECK (char_length(summary_en) <= 500),

  sort_order int NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS business_learning_categories_sort_order_idx ON public.business_learning_categories (sort_order);

ALTER TABLE public.business_learning_categories ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.business_learning_categories FROM PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.business_learning_categories TO service_role;

COMMENT ON TABLE public.business_learning_categories IS
  'TODAY-1 — Learning Center curriculum categories. Public content, server-role read only (never an anon grant). Not business-scoped.';

-- =============================================================================================
-- 2. business_learning_lessons — lessons AND planned (unpublished) curriculum records in one
-- table. A lesson can never be published without a real, non-empty bilingual body.
-- =============================================================================================
CREATE TABLE IF NOT EXISTS public.business_learning_lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES public.business_learning_categories(id) ON DELETE CASCADE,

  lesson_key text NOT NULL UNIQUE CHECK (char_length(btrim(lesson_key)) > 0),
  title_es text NOT NULL CHECK (char_length(btrim(title_es)) > 0 AND char_length(title_es) <= 200),
  title_en text NOT NULL CHECK (char_length(btrim(title_en)) > 0 AND char_length(title_en) <= 200),
  summary_es text NOT NULL CHECK (char_length(summary_es) <= 500),
  summary_en text NOT NULL CHECK (char_length(summary_en) <= 500),
  body_es text NULL,
  body_en text NULL,

  level text NOT NULL CHECK (level IN ('foundation', 'practical', 'advanced')),
  estimated_minutes int NOT NULL CHECK (estimated_minutes > 0),
  capability_key text NOT NULL CHECK (char_length(btrim(capability_key)) > 0),
  related_dimension_keys text[] NOT NULL DEFAULT '{}',

  status text NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'draft', 'published', 'archived')),
  published_at timestamptz NULL,
  sort_order int NOT NULL DEFAULT 0,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  -- Locked correction: a lesson can never be published without a real, non-empty bilingual body.
  CONSTRAINT business_learning_lessons_published_body_chk CHECK (
    status <> 'published' OR (
      body_es IS NOT NULL AND char_length(btrim(body_es)) > 0 AND
      body_en IS NOT NULL AND char_length(btrim(body_en)) > 0
    )
  ),
  CONSTRAINT business_learning_lessons_published_at_chk CHECK (
    status <> 'published' OR published_at IS NOT NULL
  )
);

CREATE INDEX IF NOT EXISTS business_learning_lessons_category_id_idx ON public.business_learning_lessons (category_id, sort_order);
CREATE INDEX IF NOT EXISTS business_learning_lessons_status_idx ON public.business_learning_lessons (status, published_at DESC);

ALTER TABLE public.business_learning_lessons ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.business_learning_lessons FROM PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.business_learning_lessons TO service_role;

COMMENT ON TABLE public.business_learning_lessons IS
  'TODAY-1 — Lessons AND planned (unpublished) curriculum records. business_learning_lessons_published_body_chk makes a bodyless publish impossible. Planned rows carry title/summary/capability/dimension metadata only and are never returned by a public route.';

-- =============================================================================================
-- 3. business_learning_resources — glossary terms, checklists, and templates, one table.
-- =============================================================================================
CREATE TABLE IF NOT EXISTS public.business_learning_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid NULL REFERENCES public.business_learning_lessons(id) ON DELETE SET NULL,

  resource_key text NOT NULL UNIQUE CHECK (char_length(btrim(resource_key)) > 0),
  resource_type text NOT NULL CHECK (resource_type IN ('glossary_term', 'checklist', 'template')),
  title_es text NOT NULL CHECK (char_length(btrim(title_es)) > 0 AND char_length(title_es) <= 200),
  title_en text NOT NULL CHECK (char_length(btrim(title_en)) > 0 AND char_length(title_en) <= 200),
  body_es text NOT NULL CHECK (char_length(btrim(body_es)) > 0),
  body_en text NOT NULL CHECK (char_length(btrim(body_en)) > 0),

  status text NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
  sort_order int NOT NULL DEFAULT 0,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS business_learning_resources_type_status_idx ON public.business_learning_resources (resource_type, status, sort_order);
CREATE INDEX IF NOT EXISTS business_learning_resources_lesson_id_idx ON public.business_learning_resources (lesson_id);

ALTER TABLE public.business_learning_resources ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.business_learning_resources FROM PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.business_learning_resources TO service_role;

COMMENT ON TABLE public.business_learning_resources IS
  'TODAY-1 — Glossary terms, checklists, and templates in one table, distinguished by resource_type. Public content, server-role read only.';

-- =============================================================================================
-- 4. business_learning_progress — one row per (auth_user_id, lesson_id). Never deleted; a
-- reassessment or later batch never erases what an owner already learned.
-- =============================================================================================
CREATE TABLE IF NOT EXISTS public.business_learning_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id uuid NOT NULL,
  business_id uuid NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  lesson_id uuid NOT NULL REFERENCES public.business_learning_lessons(id) ON DELETE CASCADE,

  status text NOT NULL DEFAULT 'started' CHECK (status IN ('started', 'completed')),
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz NULL,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT business_learning_progress_one_per_user_lesson UNIQUE (auth_user_id, lesson_id),
  CONSTRAINT business_learning_progress_completion_chk CHECK (
    (status = 'started' AND completed_at IS NULL) OR
    (status = 'completed' AND completed_at IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS business_learning_progress_user_idx ON public.business_learning_progress (auth_user_id, status);
CREATE INDEX IF NOT EXISTS business_learning_progress_lesson_idx ON public.business_learning_progress (lesson_id);

ALTER TABLE public.business_learning_progress ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.business_learning_progress FROM PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.business_learning_progress TO service_role;

COMMENT ON TABLE public.business_learning_progress IS
  'TODAY-1 — Signed-in lesson progress, one row per (auth_user_id, lesson_id). Always scoped server-side to the verified bearer-token user id -- never a client-supplied id. Never deleted.';

-- =============================================================================================
-- 5. business_capability_records — append-only record of a capability the owner has gained.
-- Same dual-actor shape proven throughout Gate BCO-5A/6A -- never a bare string.
-- =============================================================================================
CREATE TABLE IF NOT EXISTS public.business_capability_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id uuid NOT NULL,
  business_id uuid NULL REFERENCES public.businesses(id) ON DELETE CASCADE,

  capability_key text NOT NULL CHECK (char_length(btrim(capability_key)) > 0),
  source text NOT NULL CHECK (source IN ('lesson_completed', 'action_completed', 'staff_confirmed')),
  source_lesson_id uuid NULL REFERENCES public.business_learning_lessons(id) ON DELETE SET NULL,
  source_reference_id uuid NULL,

  granted_at timestamptz NOT NULL DEFAULT now(),

  created_actor_type text NOT NULL CHECK (created_actor_type IN ('staff', 'owner')),
  created_by_roster_id uuid NULL REFERENCES public.admin_team_members(id),
  created_by_auth_user_id uuid NOT NULL,
  created_by_email text NOT NULL,
  created_by_role text NOT NULL,

  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT business_capability_records_actor_chk CHECK (
    (created_actor_type = 'staff' AND created_by_roster_id IS NOT NULL) OR
    (created_actor_type = 'owner' AND created_by_roster_id IS NULL)
  )
);

-- Idempotent capability granting: completing the same lesson twice never creates a duplicate
-- capability record for the same user.
CREATE UNIQUE INDEX IF NOT EXISTS business_capability_records_one_per_user_lesson_idx
  ON public.business_capability_records (auth_user_id, source_lesson_id)
  WHERE source = 'lesson_completed';

CREATE INDEX IF NOT EXISTS business_capability_records_user_idx ON public.business_capability_records (auth_user_id, granted_at DESC);
CREATE INDEX IF NOT EXISTS business_capability_records_business_idx ON public.business_capability_records (business_id, granted_at DESC);

ALTER TABLE public.business_capability_records ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.business_capability_records FROM PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.business_capability_records TO service_role;

COMMENT ON TABLE public.business_capability_records IS
  'TODAY-1 — Append-only record of a capability the owner has gained (lesson completion, action completion, or staff confirmation). Never deleted, never mutated after creation.';

-- =============================================================================================
-- 6. business_idea_drafts — Idea Builder save/resume, scoped to the caller's own auth_user_id.
-- =============================================================================================
CREATE TABLE IF NOT EXISTS public.business_idea_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id uuid NOT NULL,
  intent_id uuid NOT NULL DEFAULT gen_random_uuid(),

  path text NOT NULL CHECK (path IN ('have_business', 'thinking_about_starting')),
  idea_description text NULL CHECK (idea_description IS NULL OR char_length(idea_description) <= 4000),
  customer_definition text NULL CHECK (customer_definition IS NULL OR char_length(customer_definition) <= 4000),
  problem_definition text NULL CHECK (problem_definition IS NULL OR char_length(problem_definition) <= 4000),
  simple_offer text NULL CHECK (simple_offer IS NULL OR char_length(simple_offer) <= 4000),
  readiness_answers jsonb NOT NULL DEFAULT '{}'::jsonb,

  language text NOT NULL DEFAULT 'es' CHECK (language IN ('es', 'en')),
  status text NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
  completed_at timestamptz NULL,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT business_idea_drafts_one_per_user_intent UNIQUE (auth_user_id, intent_id),
  CONSTRAINT business_idea_drafts_completion_chk CHECK (
    status <> 'completed' OR completed_at IS NOT NULL
  )
);

CREATE INDEX IF NOT EXISTS business_idea_drafts_user_idx ON public.business_idea_drafts (auth_user_id, status);

ALTER TABLE public.business_idea_drafts ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.business_idea_drafts FROM PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.business_idea_drafts TO service_role;

COMMENT ON TABLE public.business_idea_drafts IS
  'TODAY-1 — Idea Builder save/resume drafts. Always scoped server-side to the verified bearer-token user id -- never a client-supplied id. Never claims market validation, profitability, or a guaranteed outcome.';

-- =============================================================================================
-- Seed: 6 categories.
-- =============================================================================================
INSERT INTO public.business_learning_categories (category_key, title_es, title_en, summary_es, summary_en, sort_order, status) VALUES
('fundamentos_del_negocio', 'Fundamentos del negocio', 'Business foundation', 'Las bases que necesita todo negocio: informacion clara, identidad definida y consistencia en todos lados.', 'The basics every business needs: clear information, a defined identity, and consistency everywhere.', 1, 'active'),
('clientes_y_demanda', 'Clientes y demanda', 'Customers and demand', 'Como entender a tus clientes y hacer que te recomienden mas.', 'How to understand your customers and get more referrals.', 2, 'active'),
('dinero_y_capacidad', 'Dinero y capacidad', 'Money and capacity', 'Como distinguir ingresos de ganancia y cuidar tu capacidad de trabajo.', 'How to tell revenue from profit and protect your working capacity.', 3, 'active'),
('visibilidad_y_publicidad', 'Visibilidad y publicidad', 'Visibility and advertising', 'Como aparecer donde tus clientes buscan y anunciarte con un plan claro.', 'How to show up where your customers search and advertise with a clear plan.', 4, 'active'),
('comunicacion_y_reputacion', 'Comunicacion y reputacion', 'Communication and reputation', 'Como responder rapido y manejar tu reputacion en linea.', 'How to respond quickly and manage your online reputation.', 5, 'active'),
('proteccion_y_datos', 'Proteccion de datos', 'Data protection', 'Como cuidar la informacion de tus clientes de forma responsable.', 'How to handle your customers information responsibly.', 6, 'active')
ON CONFLICT (category_key) DO NOTHING;

-- =============================================================================================
-- Seed: 16 lessons -- 8 published (fully written bilingual bodies, each exceeding 1,200
-- characters per language) + 8 planned (title/summary/metadata only, no body, never published).
-- =============================================================================================

-- Published 1/8 — Consistent business information (business_foundation)
INSERT INTO public.business_learning_lessons
  (category_id, lesson_key, title_es, title_en, summary_es, summary_en, body_es, body_en, level, estimated_minutes, capability_key, related_dimension_keys, status, published_at, sort_order)
SELECT c.id, 'consistent_business_information',
  'Informacion consistente del negocio', 'Consistent business information',
  'Por que tu nombre, direccion, telefono y horario deben coincidir en todos lados.', 'Why your name, address, phone, and hours should match everywhere.',
  'Cuando el nombre, la direccion, el telefono y el horario de tu negocio aparecen de forma distinta en cada lugar donde la gente te busca, generas confusion y pierdes clientes que simplemente se rinden y buscan a alguien mas.

Por que importa: un cliente que encuentra dos numeros de telefono diferentes para tu negocio no sabe cual es el correcto y puede llamar al equivocado. Un cliente que ve un horario en un lugar y otro horario distinto en otro lugar puede llegar a tu negocio cuando esta cerrado. Cada inconsistencia es una oportunidad perdida, no solo una molestia menor. La informacion consistente tambien ayuda a que las personas confien mas en tu negocio, porque ven la misma historia en todos lados.

Pasos practicos:
1. Escribe en un solo documento el nombre exacto de tu negocio, la direccion completa, el telefono principal, el correo electronico y el horario real de atencion, incluyendo dias festivos si aplica.
2. Haz una lista de cada lugar donde tu negocio aparece hoy: tu perfil de Google Business, tus redes sociales, tu sitio web si tienes uno, directorios locales, tarjetas de presentacion y cualquier anuncio impreso.
3. Revisa cada lugar de la lista y compara la informacion contra tu documento maestro. Anota cada diferencia que encuentres, por pequena que sea.
4. Corrige cada lugar, uno por uno, hasta que toda la informacion coincida exactamente con tu documento maestro.
5. Marca en tu calendario una revision cada tres o cuatro meses, porque los horarios y numeros de telefono cambian y es facil que un lugar se quede desactualizado sin que te des cuenta.

Un dato importante: mantener tu informacion consistente no garantiza mas clientes ni mejores resultados en busquedas. Lo que si hace es eliminar una fuente comun de confusion que puede alejar a clientes que ya estaban interesados en tu negocio.',
  'When your business name, address, phone number, and hours appear differently in every place people look for you, you create confusion and lose customers who simply give up and search for someone else.

Why it matters: a customer who finds two different phone numbers for your business does not know which one is correct and may call the wrong one. A customer who sees one set of hours in one place and a different set of hours somewhere else may show up when you are closed. Each inconsistency is a lost opportunity, not just a minor annoyance. Consistent information also helps people trust your business more, because they see the same story everywhere they look.

Practical steps:
1. Write down, in a single document, your exact business name, full address, main phone number, email address, and real operating hours, including holidays if that applies to you.
2. Make a list of every place your business appears today: your Google Business profile, your social media accounts, your website if you have one, local directories, business cards, and any printed advertising.
3. Go through each place on your list and compare the information against your master document. Note every difference you find, no matter how small.
4. Correct each place, one at a time, until all of the information matches your master document exactly.
5. Set a reminder to review this every three or four months, because hours and phone numbers change and it is easy for one place to fall out of date without you noticing.

An important note: keeping your information consistent does not guarantee more customers or better search results. What it does is remove a common source of confusion that can push away customers who were already interested in your business.',
  'foundation', 10, 'consistent_business_info', ARRAY['business_foundation'], 'published', now(), 1
FROM public.business_learning_categories c WHERE c.category_key = 'fundamentos_del_negocio'
ON CONFLICT (lesson_key) DO NOTHING;

-- Planned 1/8 — Branding basics (business_foundation, offer_and_value)
INSERT INTO public.business_learning_lessons
  (category_id, lesson_key, title_es, title_en, summary_es, summary_en, level, estimated_minutes, capability_key, related_dimension_keys, status, sort_order)
SELECT c.id, 'branding_basics',
  'Fundamentos de identidad de marca', 'Branding basics',
  'Proximamente: como definir una identidad visual y de mensaje simple y consistente.', 'Coming soon: how to define a simple, consistent visual and message identity.',
  'practical', 15, 'branding_basics', ARRAY['business_foundation', 'offer_and_value'], 'planned', 2
FROM public.business_learning_categories c WHERE c.category_key = 'fundamentos_del_negocio'
ON CONFLICT (lesson_key) DO NOTHING;

-- Published 2/8 — Who is your customer (customer_clarity)
INSERT INTO public.business_learning_lessons
  (category_id, lesson_key, title_es, title_en, summary_es, summary_en, body_es, body_en, level, estimated_minutes, capability_key, related_dimension_keys, status, published_at, sort_order)
SELECT c.id, 'who_is_your_customer',
  'Quien es tu cliente', 'Who is your customer',
  'Como definir a tu cliente ideal para escribir mensajes mas claros.', 'How to define your ideal customer to write clearer messages.',
  'Muchos negocios intentan venderle a todo el mundo, y el resultado casi siempre es un mensaje confuso que no le habla claramente a nadie. Saber exactamente quien es tu cliente ideal te permite escribir anuncios mas claros, elegir mejor donde anunciarte y responder preguntas con mas confianza.

Por que importa: cuando entiendes a tu cliente, sabes que palabras usar, que problemas mencionar primero y que preocupaciones responder antes de que las pregunten. Un mensaje dirigido a una persona especifica casi siempre funciona mejor que un mensaje generico dirigido a nadie en particular.

Pasos practicos:
1. Piensa en tres clientes reales que hayas atendido y que quedaron satisfechos. Escribe que necesitaban, por que te eligieron a ti y como se enteraron de tu negocio.
2. Busca lo que esos tres clientes tienen en comun: edad aproximada, zona donde viven o trabajan, el problema especifico que necesitaban resolver, y como prefieren comunicarse.
3. Escribe una descripcion corta de tu cliente ideal usando esos patrones, por ejemplo: duenos de restaurantes pequenos en tu ciudad que necesitan ayuda con su menu digital.
4. Revisa tus anuncios, tu perfil y tus publicaciones actuales y pregunta: le hablan directamente a esta persona, o le hablan a cualquiera?
5. Ajusta tu lenguaje para que hable directamente a esa persona, mencionando su problema especifico y como tu negocio lo resuelve.

Un dato importante: definir a tu cliente ideal no significa rechazar a otros clientes que lleguen. Es una herramienta para escribir mensajes mas claros, no una regla estricta sobre a quien puedes atender.',
  'Many businesses try to sell to everyone, and the result is almost always a confusing message that does not speak clearly to anyone. Knowing exactly who your ideal customer is helps you write clearer ads, choose better places to advertise, and answer questions with more confidence.

Why it matters: when you understand your customer, you know which words to use, which problems to mention first, and which concerns to address before they even ask. A message aimed at one specific person almost always works better than a generic message aimed at no one in particular.

Practical steps:
1. Think of three real customers you have served who left satisfied. Write down what they needed, why they chose you, and how they heard about your business.
2. Look for what those three customers have in common: approximate age, the area where they live or work, the specific problem they needed solved, and how they prefer to communicate.
3. Write a short description of your ideal customer based on those patterns, for example: owners of small restaurants in your city who need help with their digital menu.
4. Review your current ads, profile, and posts and ask yourself: do they speak directly to this person, or do they speak to anyone at all?
5. Adjust your language so it speaks directly to that person, mentioning their specific problem and how your business solves it.

An important note: defining your ideal customer does not mean turning away other customers who show up. It is a tool for writing clearer messages, not a strict rule about who you are allowed to serve.',
  'foundation', 12, 'know_your_customer', ARRAY['customer_clarity'], 'published', now(), 1
FROM public.business_learning_categories c WHERE c.category_key = 'clientes_y_demanda'
ON CONFLICT (lesson_key) DO NOTHING;

-- Planned 2/8 — Referrals basics (customer_clarity, communication_and_follow_up)
INSERT INTO public.business_learning_lessons
  (category_id, lesson_key, title_es, title_en, summary_es, summary_en, level, estimated_minutes, capability_key, related_dimension_keys, status, sort_order)
SELECT c.id, 'referrals_basics',
  'Fundamentos de referidos', 'Referrals basics',
  'Proximamente: como pedir referidos de forma natural y sin incomodar.', 'Coming soon: how to ask for referrals naturally and comfortably.',
  'practical', 10, 'referral_program_basics', ARRAY['customer_clarity', 'communication_and_follow_up'], 'planned', 2
FROM public.business_learning_categories c WHERE c.category_key = 'clientes_y_demanda'
ON CONFLICT (lesson_key) DO NOTHING;

-- Published 3/8 — Revenue versus profit (offer_and_value, owner_goals_and_sustainability)
INSERT INTO public.business_learning_lessons
  (category_id, lesson_key, title_es, title_en, summary_es, summary_en, body_es, body_en, level, estimated_minutes, capability_key, related_dimension_keys, status, published_at, sort_order)
SELECT c.id, 'revenue_vs_profit',
  'Ingresos contra ganancia', 'Revenue versus profit',
  'La diferencia entre lo que vendes y lo que realmente te queda.', 'The difference between what you sell and what you actually keep.',
  'Vender mucho no siempre significa ganar dinero. Muchos duenos de negocio confunden ingresos, que es todo el dinero que entra, con ganancia, que es lo que sobra despues de pagar todos los costos. Esta confusion puede hacer que un negocio parezca exitoso mientras en realidad esta perdiendo dinero cada mes.

Por que importa: si solo miras cuanto vendes sin restar tus costos, puedes tomar decisiones equivocadas, como bajar precios pensando que asi venderas mas, sin darte cuenta de que cada venta te esta costando dinero en lugar de generarlo.

Pasos practicos:
1. Durante un mes completo, anota todo el dinero que entra a tu negocio por ventas. Ese numero es tu ingreso, no tu ganancia.
2. En una lista separada, anota todos tus costos del mismo mes: materiales, renta, transporte, sueldos, servicios, y cualquier otro gasto relacionado con el negocio.
3. Resta el total de costos del total de ingresos. El numero que queda es tu ganancia real de ese mes, positiva o negativa.
4. Revisa cuales de tus productos o servicios dejan mas ganancia despues de restar sus costos especificos, no solo cuales se venden mas.
5. Repite este ejercicio cada mes durante al menos tres meses para ver un patron real, en lugar de sacar conclusiones de un solo mes que pudo ser inusual.

Un dato importante: esta leccion no te dice cuanto deberias ganar ni garantiza que tu negocio sera rentable. Solo te da una forma clara de ver la diferencia entre lo que entra y lo que realmente te queda, para que tomes decisiones con informacion real.',
  'Selling a lot does not always mean making money. Many business owners confuse revenue, which is all the money coming in, with profit, which is what is left after paying every cost. This confusion can make a business look successful while it is actually losing money every month.

Why it matters: if you only look at how much you sell without subtracting your costs, you can make the wrong decisions, like lowering prices thinking it will help you sell more, without realizing that each sale is costing you money instead of making you money.

Practical steps:
1. Over one full month, write down all the money that comes into your business from sales. That number is your revenue, not your profit.
2. In a separate list, write down all of your costs for that same month: materials, rent, transportation, wages, services, and any other expense related to the business.
3. Subtract your total costs from your total revenue. The number left over is your real profit for that month, whether positive or negative.
4. Review which of your products or services leave the most profit after subtracting their specific costs, not just which ones sell the most.
5. Repeat this exercise every month for at least three months to see a real pattern, instead of drawing conclusions from a single month that might have been unusual.

An important note: this lesson does not tell you how much you should earn, and it does not guarantee that your business will be profitable. It simply gives you a clear way to see the difference between what comes in and what you actually keep, so you can make decisions with real information.',
  'foundation', 12, 'revenue_vs_profit', ARRAY['offer_and_value', 'owner_goals_and_sustainability'], 'published', now(), 1
FROM public.business_learning_categories c WHERE c.category_key = 'dinero_y_capacidad'
ON CONFLICT (lesson_key) DO NOTHING;

-- Published 4/8 — Healthy boundaries and capacity (operations_and_capacity)
INSERT INTO public.business_learning_lessons
  (category_id, lesson_key, title_es, title_en, summary_es, summary_en, body_es, body_en, level, estimated_minutes, capability_key, related_dimension_keys, status, published_at, sort_order)
SELECT c.id, 'healthy_boundaries_and_capacity',
  'Limites sanos y capacidad', 'Healthy boundaries and capacity',
  'Como proteger la calidad de tu trabajo sin aceptar mas de lo que puedes manejar.', 'How to protect your work quality without taking on more than you can handle.',
  'Muchos duenos de negocio piensan que decir que si a cada cliente, cada pedido y cada solicitud es la unica forma de crecer. Pero cuando aceptas mas trabajo del que realmente puedes manejar bien, la calidad baja, los clientes actuales se sienten descuidados y tu terminas agotado.

Por que importa: un negocio que crece mas rapido de lo que su capacidad real permite suele terminar con clientes insatisfechos, entregas tardias y un dueno agotado que no puede sostener ese ritmo por mucho tiempo. Proteger tu capacidad es proteger la calidad de lo que ofreces.

Pasos practicos:
1. Anota, durante una semana normal, cuantas horas realmente dedicas a atender clientes, producir tu producto o servicio, y manejar la parte administrativa del negocio.
2. Compara esas horas con las horas que tienes disponibles de forma sostenible, sin sacrificar tu descanso o tu salud de forma constante.
3. Identifica el punto donde aceptar mas trabajo empieza a bajar la calidad de lo que entregas o a atrasar tus tiempos de entrega.
4. Define con claridad cuantos clientes o pedidos puedes aceptar por semana o por mes sin cruzar ese punto.
5. Practica decir que no o proponer una fecha mas realista cuando una solicitud sobrepasa tu capacidad actual, explicando el motivo con honestidad.

Un dato importante: reconocer tus limites no es una debilidad ni significa que tu negocio no puede crecer. Es una forma de proteger la calidad de tu trabajo y tu propia salud mientras encuentras formas sostenibles de aumentar tu capacidad con el tiempo.',
  'Many business owners believe that saying yes to every customer, every order, and every request is the only way to grow. But when you take on more work than you can actually handle well, quality drops, existing customers feel neglected, and you end up exhausted.

Why it matters: a business that grows faster than its real capacity allows usually ends up with unhappy customers, late deliveries, and an exhausted owner who cannot keep up that pace for long. Protecting your capacity is a way of protecting the quality of what you offer.

Practical steps:
1. During one normal week, write down how many hours you actually spend serving customers, producing your product or service, and handling the administrative side of the business.
2. Compare those hours to the hours you have available in a sustainable way, without constantly sacrificing your rest or your health.
3. Identify the point where accepting more work starts to lower the quality of what you deliver or delay your delivery times.
4. Clearly define how many customers or orders you can accept per week or per month without crossing that point.
5. Practice saying no, or offering a more realistic timeline, when a request goes beyond your current capacity, explaining the reason honestly.

An important note: recognizing your limits is not a weakness and does not mean your business cannot grow. It is a way to protect the quality of your work and your own health while you find sustainable ways to increase your capacity over time.',
  'foundation', 12, 'healthy_capacity_boundaries', ARRAY['operations_and_capacity'], 'published', now(), 2
FROM public.business_learning_categories c WHERE c.category_key = 'dinero_y_capacidad'
ON CONFLICT (lesson_key) DO NOTHING;

-- Planned 3/8 — Profitable-service basics (offer_and_value)
INSERT INTO public.business_learning_lessons
  (category_id, lesson_key, title_es, title_en, summary_es, summary_en, level, estimated_minutes, capability_key, related_dimension_keys, status, sort_order)
SELECT c.id, 'profitable_service_basics',
  'Fundamentos de servicios rentables', 'Profitable-service basics',
  'Proximamente: como identificar que servicios realmente te convienen ofrecer.', 'Coming soon: how to identify which services are actually worth offering.',
  'practical', 15, 'profitable_service_basics', ARRAY['offer_and_value'], 'planned', 3
FROM public.business_learning_categories c WHERE c.category_key = 'dinero_y_capacidad'
ON CONFLICT (lesson_key) DO NOTHING;

-- Planned 4/8 — Simple analytics (operations_and_capacity)
INSERT INTO public.business_learning_lessons
  (category_id, lesson_key, title_es, title_en, summary_es, summary_en, level, estimated_minutes, capability_key, related_dimension_keys, status, sort_order)
SELECT c.id, 'simple_analytics',
  'Analitica simple para tu negocio', 'Simple analytics',
  'Proximamente: como leer numeros basicos sin necesitar ser experto.', 'Coming soon: how to read basic numbers without being an expert.',
  'practical', 15, 'simple_analytics_basics', ARRAY['operations_and_capacity'], 'planned', 4
FROM public.business_learning_categories c WHERE c.category_key = 'dinero_y_capacidad'
ON CONFLICT (lesson_key) DO NOTHING;

-- Published 5/8 — Google Business basics (visibility_and_discovery)
INSERT INTO public.business_learning_lessons
  (category_id, lesson_key, title_es, title_en, summary_es, summary_en, body_es, body_en, level, estimated_minutes, capability_key, related_dimension_keys, status, published_at, sort_order)
SELECT c.id, 'google_business_basics',
  'Fundamentos de Google Business', 'Google Business basics',
  'Como crear y mantener un perfil completo en Google Business.', 'How to create and maintain a complete Google Business profile.',
  'Cuando alguien busca un negocio como el tuyo en Google o en Google Maps, lo primero que ve suele ser tu perfil de Google Business, no tu sitio web. Un perfil completo y correcto ayuda a que las personas encuentren tu negocio, confien en la informacion que ven y decidan contactarte.

Por que importa: un perfil incompleto, con informacion vieja o sin fotos, hace que las personas duden si tu negocio todavia existe o si la informacion es confiable. Muchas veces esa duda es suficiente para que elijan a otro negocio en su lugar.

Pasos practicos:
1. Busca tu negocio en Google para ver si ya tienes un perfil de Google Business. Si no existe, puedes crear uno gratis siguiendo las instrucciones que Google proporciona.
2. Verifica que el nombre, la direccion, el telefono y el horario coincidan exactamente con tu documento maestro de informacion del negocio.
3. Escribe una descripcion clara de tu negocio: que ofreces, a quien atiendes y que te hace diferente, usando un lenguaje sencillo y directo.
4. Sube al menos ocho a diez fotos reales de tu negocio: el local, tus productos o servicios, y tu equipo si es apropiado para tu tipo de negocio.
5. Revisa tu perfil cada mes para actualizar horarios especiales, responder preguntas de clientes y confirmar que toda la informacion siga siendo correcta.

Un dato importante: tener un perfil completo no garantiza que apareceras primero en las busquedas ni que recibiras mas clientes. Lo que si hace es asegurar que, cuando alguien te busque, encuentre informacion clara y confiable sobre tu negocio.',
  'When someone searches for a business like yours on Google or Google Maps, the first thing they usually see is your Google Business profile, not your website. A complete and accurate profile helps people find your business, trust the information they see, and decide to contact you.

Why it matters: an incomplete profile, with outdated information or no photos, makes people wonder whether your business still exists or whether the information is reliable. Often that doubt alone is enough for them to choose a different business instead.

Practical steps:
1. Search for your business on Google to see whether you already have a Google Business profile. If it does not exist, you can create one for free by following the instructions Google provides.
2. Check that the name, address, phone number, and hours match your master business information document exactly.
3. Write a clear description of your business: what you offer, who you serve, and what makes you different, using simple and direct language.
4. Upload at least eight to ten real photos of your business: your location, your products or services, and your team if that fits your type of business.
5. Review your profile every month to update special hours, respond to customer questions, and confirm that all of the information is still correct.

An important note: having a complete profile does not guarantee that you will appear first in search results or that you will receive more customers. What it does is make sure that when someone looks for you, they find clear and trustworthy information about your business.',
  'foundation', 15, 'google_business_basics', ARRAY['visibility_and_discovery'], 'published', now(), 1
FROM public.business_learning_categories c WHERE c.category_key = 'visibilidad_y_publicidad'
ON CONFLICT (lesson_key) DO NOTHING;

-- Published 6/8 — Advertising fundamentals (visibility_and_discovery)
INSERT INTO public.business_learning_lessons
  (category_id, lesson_key, title_es, title_en, summary_es, summary_en, body_es, body_en, level, estimated_minutes, capability_key, related_dimension_keys, status, published_at, sort_order)
SELECT c.id, 'advertising_fundamentals',
  'Fundamentos de publicidad', 'Advertising fundamentals',
  'Conceptos basicos antes de pagar por tu primer anuncio.', 'Basic concepts to understand before paying for your first ad.',
  'Anunciarte sin un plan claro suele significar gastar dinero sin saber realmente si esta funcionando. Antes de pagar por un anuncio, vale la pena entender algunos conceptos basicos que te ayudaran a decidir donde, como y cuanto anunciarte.

Por que importa: un anuncio dirigido a la persona equivocada, con un mensaje confuso o sin una forma clara de que te contacten, puede costar dinero sin traer resultados. Entender lo basico te ayuda a evitar ese desperdicio.

Pasos practicos:
1. Define un objetivo claro para tu anuncio: quieres que la gente llame, que visite tu negocio, que envie un mensaje de WhatsApp, o que compre en linea. Un anuncio no puede hacer todo a la vez de forma efectiva.
2. Escribe tu mensaje pensando en el cliente que definiste en la leccion sobre quien es tu cliente, mencionando su problema especifico y como lo resuelves.
3. Incluye siempre una accion clara: llama ahora, visitanos hoy, escribenos por WhatsApp, con la informacion de contacto correcta y facil de encontrar.
4. Elige el lugar donde anunciarte segun donde realmente esta tu cliente: redes sociales, Google, medios locales, o una combinacion, en lugar de elegir por costumbre.
5. Antes de repetir un anuncio, revisa si tuvo algun resultado que puedas medir, como llamadas, mensajes o visitas, y ajusta el mensaje o el lugar si no fue claro.

Un dato importante: ningun anuncio garantiza ventas ni un numero especifico de clientes nuevos. La publicidad ayuda a que mas personas conozcan tu negocio, pero el resultado final tambien depende de tu oferta, tus precios y tu servicio.',
  'Advertising without a clear plan usually means spending money without really knowing whether it is working. Before you pay for an ad, it is worth understanding a few basic concepts that will help you decide where, how, and how much to advertise.

Why it matters: an ad aimed at the wrong person, with a confusing message or no clear way for people to contact you, can cost money without bringing results. Understanding the basics helps you avoid that waste.

Practical steps:
1. Define a clear goal for your ad: do you want people to call, visit your business, send a WhatsApp message, or buy online. One ad cannot do all of these effectively at the same time.
2. Write your message with the customer you defined in the who-is-your-customer lesson in mind, mentioning their specific problem and how you solve it.
3. Always include a clear action: call now, visit us today, message us on WhatsApp, along with correct and easy to find contact information.
4. Choose where to advertise based on where your customer actually is: social media, Google, local media, or a combination, instead of choosing out of habit.
5. Before repeating an ad, check whether it produced any result you can measure, such as calls, messages, or visits, and adjust the message or the placement if it was not clear.

An important note: no ad guarantees sales or a specific number of new customers. Advertising helps more people learn about your business, but the final result also depends on your offer, your prices, and your service.',
  'foundation', 15, 'advertising_fundamentals', ARRAY['visibility_and_discovery'], 'published', now(), 2
FROM public.business_learning_categories c WHERE c.category_key = 'visibilidad_y_publicidad'
ON CONFLICT (lesson_key) DO NOTHING;

-- Planned 5/8 — Local SEO basics (visibility_and_discovery)
INSERT INTO public.business_learning_lessons
  (category_id, lesson_key, title_es, title_en, summary_es, summary_en, level, estimated_minutes, capability_key, related_dimension_keys, status, sort_order)
SELECT c.id, 'local_seo_basics',
  'Fundamentos de SEO local', 'Local SEO basics',
  'Proximamente: como ayudar a que tu negocio aparezca en busquedas locales.', 'Coming soon: how to help your business show up in local searches.',
  'practical', 18, 'local_seo_basics', ARRAY['visibility_and_discovery'], 'planned', 3
FROM public.business_learning_categories c WHERE c.category_key = 'visibilidad_y_publicidad'
ON CONFLICT (lesson_key) DO NOTHING;

-- Planned 6/8 — Product photography basics (visibility_and_discovery)
INSERT INTO public.business_learning_lessons
  (category_id, lesson_key, title_es, title_en, summary_es, summary_en, level, estimated_minutes, capability_key, related_dimension_keys, status, sort_order)
SELECT c.id, 'product_photography_basics',
  'Fotografia de producto basica', 'Product photography basics',
  'Proximamente: como tomar mejores fotos de tu negocio con tu telefono.', 'Coming soon: how to take better photos of your business with your phone.',
  'practical', 12, 'product_photography_basics', ARRAY['visibility_and_discovery'], 'planned', 4
FROM public.business_learning_categories c WHERE c.category_key = 'visibilidad_y_publicidad'
ON CONFLICT (lesson_key) DO NOTHING;

-- Planned 7/8 — Short video basics (visibility_and_discovery)
INSERT INTO public.business_learning_lessons
  (category_id, lesson_key, title_es, title_en, summary_es, summary_en, level, estimated_minutes, capability_key, related_dimension_keys, status, sort_order)
SELECT c.id, 'short_video_basics',
  'Video corto basico', 'Short video basics',
  'Proximamente: como grabar videos cortos simples para redes sociales.', 'Coming soon: how to record simple short videos for social media.',
  'practical', 12, 'short_video_basics', ARRAY['visibility_and_discovery'], 'planned', 5
FROM public.business_learning_categories c WHERE c.category_key = 'visibilidad_y_publicidad'
ON CONFLICT (lesson_key) DO NOTHING;

-- Published 7/8 — WhatsApp Business basics (communication_and_follow_up)
INSERT INTO public.business_learning_lessons
  (category_id, lesson_key, title_es, title_en, summary_es, summary_en, body_es, body_en, level, estimated_minutes, capability_key, related_dimension_keys, status, published_at, sort_order)
SELECT c.id, 'whatsapp_business_basics',
  'Fundamentos de WhatsApp Business', 'WhatsApp Business basics',
  'Como configurar y usar WhatsApp Business para responder mejor.', 'How to set up and use WhatsApp Business to respond better.',
  'Para muchos negocios pequenos, WhatsApp es el primer lugar donde un cliente hace contacto. Responder rapido, con informacion clara y de forma organizada, puede ser la diferencia entre ganar un cliente y perderlo frente a otro negocio que respondio primero.

Por que importa: un cliente que espera mucho tiempo una respuesta, o que recibe una respuesta confusa, facilmente busca a otro negocio que le conteste mas rapido. WhatsApp Business ofrece herramientas gratuitas que ayudan a responder mejor sin necesidad de contratar a alguien mas.

Pasos practicos:
1. Descarga la aplicacion WhatsApp Business, que es gratuita y separada de tu WhatsApp personal, y configura tu perfil de negocio con tu nombre, direccion, horario y una breve descripcion.
2. Crea un mensaje de bienvenida automatico que se envie cuando alguien te escribe por primera vez, agradeciendo el contacto y explicando en cuanto tiempo responderas.
3. Configura un mensaje de ausencia para cuando estas fuera de tu horario de atencion, para que el cliente sepa que su mensaje fue recibido y cuando le responderas.
4. Prepara respuestas rapidas guardadas para las preguntas que recibes con mas frecuencia, como precios, horarios o ubicacion, para responder mas rapido sin escribir todo de nuevo cada vez.
5. Define un tiempo maximo razonable para responder mensajes durante tu horario de atencion, y revisa tu telefono con esa frecuencia para no dejar a nadie esperando demasiado.

Un dato importante: responder rapido no garantiza que cada persona se convierta en cliente. Lo que si hace es asegurar que ninguna oportunidad se pierda simplemente porque la respuesta llego demasiado tarde.',
  'For many small businesses, WhatsApp is the first place a customer makes contact. Responding quickly, with clear information and in an organized way, can be the difference between winning a customer and losing them to another business that responded first.

Why it matters: a customer who waits a long time for a reply, or who receives a confusing answer, easily looks for another business that responds faster. WhatsApp Business offers free tools that help you respond better without needing to hire someone else.

Practical steps:
1. Download the WhatsApp Business app, which is free and separate from your personal WhatsApp, and set up your business profile with your name, address, hours, and a short description.
2. Create an automatic welcome message that sends when someone writes to you for the first time, thanking them for reaching out and explaining how soon you will respond.
3. Set up an away message for when you are outside your business hours, so the customer knows their message was received and when you will reply.
4. Prepare saved quick replies for the questions you receive most often, such as prices, hours, or location, so you can respond faster without typing everything again each time.
5. Set a reasonable maximum response time during your business hours, and check your phone at that frequency so no one is left waiting too long.

An important note: responding quickly does not guarantee that every person will become a customer. What it does is make sure that no opportunity is lost simply because the reply arrived too late.',
  'foundation', 12, 'whatsapp_business_basics', ARRAY['communication_and_follow_up'], 'published', now(), 1
FROM public.business_learning_categories c WHERE c.category_key = 'comunicacion_y_reputacion'
ON CONFLICT (lesson_key) DO NOTHING;

-- Published 8/8 — Reviews and customer response (communication_and_follow_up)
INSERT INTO public.business_learning_lessons
  (category_id, lesson_key, title_es, title_en, summary_es, summary_en, body_es, body_en, level, estimated_minutes, capability_key, related_dimension_keys, status, published_at, sort_order)
SELECT c.id, 'reviews_and_customer_response',
  'Resenas y respuesta a clientes', 'Reviews and customer response',
  'Como responder resenas positivas y dificiles de forma profesional.', 'How to respond to positive and difficult reviews professionally.',
  'Las resenas en linea influyen en la decision de muchas personas antes de elegir un negocio. Como respondes a esas resenas, tanto las buenas como las dificiles, dice mucho sobre como tratas a tus clientes en general.

Por que importa: una resena negativa sin respuesta puede parecer que al negocio no le importa la opinion de sus clientes. Una respuesta cuidadosa, incluso a una critica dificil, muestra que tomas en serio la experiencia de tus clientes y que estas dispuesto a mejorar.

Pasos practicos:
1. Revisa las resenas que ya tienes en tu perfil de Google Business y en otras plataformas donde tu negocio aparezca, y anota cuales aun no tienen respuesta.
2. Para las resenas positivas, responde con un agradecimiento breve y personal, mencionando algo especifico de lo que la persona escribio si es posible.
3. Para las resenas dificiles, espera un momento antes de responder si sientes molestia, y luego escribe una respuesta calmada que reconozca la preocupacion sin ponerte a la defensiva.
4. Nunca compartas informacion privada del cliente en tu respuesta publica, y si el problema requiere mas detalle, invita a la persona a contactarte directamente por telefono o WhatsApp.
5. Pide resenas de forma natural a clientes satisfechos despues de una buena experiencia, por ejemplo enviando un enlace directo a tu perfil de Google Business.

Un dato importante: responder bien a las resenas no garantiza que dejaras de recibir criticas, ni que subiras en las busquedas. Lo que si hace es mostrar a futuros clientes como tratas a las personas cuando algo no sale perfecto.',
  'Online reviews influence many people decisions before they choose a business. How you respond to those reviews, both the good ones and the difficult ones, says a lot about how you treat your customers in general.

Why it matters: a negative review with no response can make it look like the business does not care about its customers opinions. A thoughtful response, even to a difficult criticism, shows that you take your customers experience seriously and that you are willing to improve.

Practical steps:
1. Review the feedback you already have on your Google Business profile and any other platforms where your business appears, and note which ones still have no response.
2. For positive reviews, respond with a brief and personal thank you, mentioning something specific from what the person wrote if possible.
3. For difficult reviews, wait a moment before responding if you feel upset, then write a calm reply that acknowledges the concern without becoming defensive.
4. Never share private customer information in your public response, and if the issue needs more detail, invite the person to contact you directly by phone or WhatsApp.
5. Ask satisfied customers for reviews in a natural way after a good experience, for example by sending a direct link to your Google Business profile.

An important note: responding well to reviews does not guarantee that you will stop receiving criticism, or that you will rank higher in search results. What it does is show future customers how you treat people when something does not go perfectly.',
  'foundation', 12, 'review_response_basics', ARRAY['communication_and_follow_up'], 'published', now(), 2
FROM public.business_learning_categories c WHERE c.category_key = 'comunicacion_y_reputacion'
ON CONFLICT (lesson_key) DO NOTHING;

-- Planned 8/8 — Customer-data protection (operations_and_capacity)
INSERT INTO public.business_learning_lessons
  (category_id, lesson_key, title_es, title_en, summary_es, summary_en, level, estimated_minutes, capability_key, related_dimension_keys, status, sort_order)
SELECT c.id, 'customer_data_protection',
  'Proteccion de datos del cliente', 'Customer-data protection',
  'Proximamente: como manejar con cuidado la informacion de tus clientes.', 'Coming soon: how to carefully handle your customers information.',
  'foundation', 10, 'customer_data_protection', ARRAY['operations_and_capacity'], 'planned', 1
FROM public.business_learning_categories c WHERE c.category_key = 'proteccion_y_datos'
ON CONFLICT (lesson_key) DO NOTHING;

-- =============================================================================================
-- Seed: 18 glossary terms.
-- =============================================================================================
INSERT INTO public.business_learning_resources (resource_key, resource_type, title_es, title_en, body_es, body_en, status, sort_order) VALUES
('glossary_google_business_profile', 'glossary_term', 'Perfil de Google Business', 'Google Business Profile', 'El perfil gratuito que aparece en Google Busqueda y Google Maps cuando alguien busca tu negocio, con tu nombre, direccion, telefono, horario y resenas.', 'The free profile that appears in Google Search and Google Maps when someone looks for your business, showing your name, address, phone number, hours, and reviews.', 'published', 1),
('glossary_seo', 'glossary_term', 'SEO', 'SEO', 'Conjunto de practicas que ayudan a que un sitio web o perfil aparezca en los resultados de busqueda cuando alguien escribe palabras relacionadas con tu negocio.', 'A set of practices that help a website or profile appear in search results when someone types words related to your business.', 'published', 2),
('glossary_local_seo', 'glossary_term', 'SEO local', 'Local SEO', 'La parte del SEO enfocada en aparecer en busquedas hechas por personas cerca de tu ubicacion, como restaurantes cerca de mi.', 'The part of SEO focused on appearing in searches made by people near your location, such as restaurants near me.', 'published', 3),
('glossary_landing_page', 'glossary_term', 'Pagina de aterrizaje', 'Landing page', 'Una pagina web sencilla disenada para que la persona que llega tome una accion especifica, como llamar o dejar sus datos.', 'A simple web page designed to get the person who lands on it to take one specific action, such as calling or leaving their information.', 'published', 4),
('glossary_cta', 'glossary_term', 'Llamada a la accion', 'Call to action', 'La frase o boton que le dice claramente a la persona que hacer despues, como llamar ahora o escribenos por WhatsApp.', 'The phrase or button that clearly tells the person what to do next, such as call now or message us on WhatsApp.', 'published', 5),
('glossary_lead', 'glossary_term', 'Lead', 'Lead', 'Una persona que mostro interes en tu negocio, por ejemplo dejando su telefono o escribiendote, pero que todavia no ha comprado.', 'A person who showed interest in your business, for example by leaving their phone number or messaging you, but who has not purchased yet.', 'published', 6),
('glossary_conversion', 'glossary_term', 'Conversion', 'Conversion', 'El momento en que una persona interesada toma la accion que buscabas, como comprar, llamar o agendar una cita.', 'The moment an interested person takes the action you wanted, such as buying, calling, or booking an appointment.', 'published', 7),
('glossary_engagement', 'glossary_term', 'Interaccion', 'Engagement', 'La forma en que las personas interactuan con tus publicaciones, como comentarios, mensajes y veces que comparten tu contenido.', 'The way people interact with your posts, such as comments, messages, and how often they share your content.', 'published', 8),
('glossary_branding', 'glossary_term', 'Identidad de marca', 'Branding', 'El conjunto de colores, logo, tono de voz e imagenes que hacen que tu negocio se vea y suene igual en todos lados.', 'The set of colors, logo, tone of voice, and images that make your business look and sound the same everywhere.', 'published', 9),
('glossary_target_customer', 'glossary_term', 'Cliente objetivo', 'Target customer', 'La descripcion de la persona que tu negocio busca atender de forma principal, basada en necesidades y caracteristicas reales.', 'The description of the person your business primarily aims to serve, based on real needs and characteristics.', 'published', 10),
('glossary_review', 'glossary_term', 'Resena', 'Review', 'El comentario y calificacion que un cliente deja sobre su experiencia con tu negocio en plataformas como Google.', 'The comment and rating a customer leaves about their experience with your business on platforms such as Google.', 'published', 11),
('glossary_whatsapp_business', 'glossary_term', 'WhatsApp Business', 'WhatsApp Business', 'La version gratuita de WhatsApp disenada para negocios, con perfil de negocio, respuestas rapidas y mensajes automaticos.', 'The free version of WhatsApp designed for businesses, with a business profile, quick replies, and automatic messages.', 'published', 12),
('glossary_analytics', 'glossary_term', 'Analitica', 'Analytics', 'Los numeros que muestran como se comporta tu negocio o tus publicaciones, como cuantas personas vieron o contactaron.', 'The numbers that show how your business or your posts are performing, such as how many people viewed or contacted you.', 'published', 13),
('glossary_referral', 'glossary_term', 'Referido', 'Referral', 'Un cliente nuevo que llega a tu negocio porque otro cliente satisfecho lo recomendo.', 'A new customer who comes to your business because another satisfied customer recommended you.', 'published', 14),
('glossary_profit_margin', 'glossary_term', 'Margen de ganancia', 'Profit margin', 'La parte del precio de venta que queda como ganancia despues de restar los costos directos de ese producto o servicio.', 'The part of the sale price that remains as profit after subtracting the direct costs of that product or service.', 'published', 15),
('glossary_overhead', 'glossary_term', 'Costos fijos', 'Overhead', 'Los gastos que tu negocio paga sin importar cuanto vendas, como renta, servicios basicos y ciertos sueldos.', 'The expenses your business pays regardless of how much you sell, such as rent, utilities, and certain wages.', 'published', 16),
('glossary_capacity', 'glossary_term', 'Capacidad operativa', 'Operating capacity', 'La cantidad de trabajo que tu negocio puede manejar bien, con la calidad y el tiempo que prometes, sin agotar al equipo.', 'The amount of work your business can handle well, with the quality and timing you promise, without exhausting your team.', 'published', 17),
('glossary_customer_data', 'glossary_term', 'Datos del cliente', 'Customer data', 'Cualquier informacion personal de un cliente que tu negocio guarda, como su telefono, correo o direccion.', 'Any personal information about a customer that your business stores, such as their phone number, email, or address.', 'published', 18)
ON CONFLICT (resource_key) DO NOTHING;

-- =============================================================================================
-- Seed: 7 checklists/templates, some linked to a lesson (published or planned) via lesson_key.
-- =============================================================================================
INSERT INTO public.business_learning_resources (lesson_id, resource_key, resource_type, title_es, title_en, body_es, body_en, status, sort_order)
SELECT l.id, 'checklist_business_info_consistency', 'checklist', 'Lista de verificacion: informacion consistente', 'Checklist: consistent business information',
  'Nombre exacto del negocio escrito igual en todos lados
Direccion completa y correcta en cada perfil
Telefono principal correcto en cada perfil
Correo electronico correcto en cada perfil
Horario de atencion actualizado en cada perfil
Revision programada cada tres a cuatro meses',
  'Exact business name written the same everywhere
Full and correct address on every profile
Correct main phone number on every profile
Correct email address on every profile
Updated operating hours on every profile
Scheduled review every three to four months',
  'published', 1
FROM public.business_learning_lessons l WHERE l.lesson_key = 'consistent_business_information'
ON CONFLICT (resource_key) DO NOTHING;

INSERT INTO public.business_learning_resources (lesson_id, resource_key, resource_type, title_es, title_en, body_es, body_en, status, sort_order)
SELECT l.id, 'checklist_whatsapp_weekly_response', 'checklist', 'Lista de verificacion: respuesta semanal en WhatsApp', 'Checklist: weekly WhatsApp response',
  'Mensaje de bienvenida automatico configurado
Mensaje de ausencia configurado para fuera de horario
Respuestas rapidas guardadas para preguntas frecuentes
Tiempo maximo de respuesta definido
Revision diaria de mensajes pendientes',
  'Automatic welcome message set up
Away message configured for outside business hours
Saved quick replies for frequent questions
Maximum response time defined
Daily review of pending messages',
  'published', 2
FROM public.business_learning_lessons l WHERE l.lesson_key = 'whatsapp_business_basics'
ON CONFLICT (resource_key) DO NOTHING;

INSERT INTO public.business_learning_resources (lesson_id, resource_key, resource_type, title_es, title_en, body_es, body_en, status, sort_order)
SELECT l.id, 'checklist_google_business_setup', 'checklist', 'Lista de verificacion: perfil de Google Business', 'Checklist: Google Business profile setup',
  'Perfil creado y verificado
Nombre, direccion, telefono y horario correctos
Descripcion clara del negocio escrita
Al menos ocho fotos reales subidas
Categoria del negocio seleccionada correctamente
Revision mensual programada',
  'Profile created and verified
Correct name, address, phone, and hours
Clear business description written
At least eight real photos uploaded
Correct business category selected
Monthly review scheduled',
  'published', 3
FROM public.business_learning_lessons l WHERE l.lesson_key = 'google_business_basics'
ON CONFLICT (resource_key) DO NOTHING;

INSERT INTO public.business_learning_resources (lesson_id, resource_key, resource_type, title_es, title_en, body_es, body_en, status, sort_order)
SELECT l.id, 'template_review_response', 'template', 'Plantilla: respuesta a resenas', 'Template: review response',
  'Para resenas positivas: Gracias [nombre] por tu comentario, nos alegra mucho haberte ayudado con [detalle especifico].
Para resenas dificiles: Gracias por contarnos tu experiencia, [nombre]. Lamentamos que [problema] no haya sido lo que esperabas. Nos gustaria conocer mas detalles, puedes escribirnos directamente a [telefono o correo].',
  'For positive reviews: Thank you [name] for your comment, we are glad we could help with [specific detail].
For difficult reviews: Thank you for sharing your experience, [name]. We are sorry that [issue] was not what you expected. We would like to learn more, please reach out directly at [phone or email].',
  'published', 4
FROM public.business_learning_lessons l WHERE l.lesson_key = 'reviews_and_customer_response'
ON CONFLICT (resource_key) DO NOTHING;

INSERT INTO public.business_learning_resources (lesson_id, resource_key, resource_type, title_es, title_en, body_es, body_en, status, sort_order)
SELECT l.id, 'template_monthly_expense_tracker', 'template', 'Plantilla: seguimiento mensual de gastos', 'Template: simple monthly expense tracker',
  'Columnas sugeridas: Fecha, Descripcion del gasto, Categoria (materiales, renta, servicios, transporte, sueldos, otros), Monto.
Al final del mes suma cada categoria y compara el total contra tus ingresos del mismo mes para conocer tu ganancia real.',
  'Suggested columns: Date, Expense description, Category (materials, rent, utilities, transportation, wages, other), Amount.
At the end of the month, add up each category and compare the total against that same months revenue to see your real profit.',
  'published', 5
FROM public.business_learning_lessons l WHERE l.lesson_key = 'revenue_vs_profit'
ON CONFLICT (resource_key) DO NOTHING;

INSERT INTO public.business_learning_resources (lesson_id, resource_key, resource_type, title_es, title_en, body_es, body_en, status, sort_order)
SELECT l.id, 'checklist_photo_shoot_prep', 'checklist', 'Lista de verificacion: preparacion para fotos', 'Checklist: photo shoot prep',
  'Local limpio y ordenado antes de tomar fotos
Buena luz natural disponible, evitar flash directo
Productos o espacios acomodados de forma atractiva
Varios angulos tomados de cada producto o espacio
Fotos revisadas y las mejores seleccionadas antes de subir',
  'Location clean and tidy before taking photos
Good natural light available, avoid direct flash
Products or spaces arranged attractively
Multiple angles taken of each product or space
Photos reviewed and best ones selected before uploading',
  'published', 6
FROM public.business_learning_lessons l WHERE l.lesson_key = 'product_photography_basics'
ON CONFLICT (resource_key) DO NOTHING;

INSERT INTO public.business_learning_resources (lesson_id, resource_key, resource_type, title_es, title_en, body_es, body_en, status, sort_order)
SELECT l.id, 'template_referral_ask_script', 'template', 'Plantilla: como pedir un referido', 'Template: referral ask script',
  'Ejemplo de mensaje: Hola [nombre], me alegra mucho que hayas quedado contento con [producto o servicio]. Si conoces a alguien que pueda necesitar algo similar, se lo agradeceria mucho si le compartes mi contacto.',
  'Example message: Hi [name], I am really glad you were happy with [product or service]. If you know anyone who might need something similar, I would really appreciate it if you shared my contact with them.',
  'published', 7
FROM public.business_learning_lessons l WHERE l.lesson_key = 'referrals_basics'
ON CONFLICT (resource_key) DO NOTHING;

-- =============================================================================================
-- Feature flag — reuses the existing business_identity_flags table (Gate BCO-1C.1) rather than
-- creating a parallel flags table, matching every prior gate's precedent. Starts disabled.
-- =============================================================================================
INSERT INTO public.business_identity_flags (flag_key, enabled, emergency_disabled, pilot_user_ids)
VALUES ('business_learning_center', false, false, '{}')
ON CONFLICT (flag_key) DO NOTHING;
