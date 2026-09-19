-- =============================================================================
-- Leonix Learning Center — I-1A.1 SUPPLEMENTAL ACCENT CLEANUP
-- =============================================================================
-- GENERATED FILE. Do not edit by hand:
--   npx tsx scripts/generate-learning-content-seed-i1.ts --write
--
-- Two Spanish accents that the I-1A repair (D3) did not cover. Applied AFTER, and separately from,
-- I-1A — that artifact (20260918_content_batch_i1a_repairs.sql) is an executed production transaction
-- and is never edited. This file contains none of its 80 repairs.
--
-- TARGET: the canonical project Leonix Media (ref xuieateniufcrsfdomwl) and no other.
-- REVIEWED SEED — NOT A MIGRATION. DO NOT move it into supabase/migrations/. DO NOT use a blind
-- `supabase db push`. Apply explicitly, following docs/learning-center-i1-canonical-apply-runbook.md.
--
-- 2 guarded UPDATEs · 0 INSERT · 0 DELETE · 0 DDL. Each guard is the md5 of the exact value I-1A left
-- behind, so a drifted row is skipped, never overwritten. One transaction; the closing assertion block
-- aborts it unless both final values are exactly the reviewed text, lessons are still 16 and no I-1
-- lesson key exists. Idempotent: after a successful apply both guards match nothing.
-- =============================================================================

BEGIN;

-- S1. business_learning_lessons.consistent_business_information.summary_es: "Por que tu nombre" -> "Por qué tu nombre"
UPDATE public.business_learning_lessons SET summary_es = 'Por qué tu nombre, dirección, teléfono y horario deben coincidir en todos lados.'
WHERE lesson_key = 'consistent_business_information' AND md5(replace(summary_es, chr(13), '')) = '188456c3b179c078cbd568e28598d254';

-- S2. business_learning_lessons.healthy_boundaries_and_capacity.body_es: "y tu terminas agotado" -> "y tú terminas agotado"
UPDATE public.business_learning_lessons SET body_es = 'Muchos dueños de negocio piensan que decir que sí a cada cliente, cada pedido y cada solicitud es la única forma de crecer. Pero cuando aceptas más trabajo del que realmente puedes manejar bien, la calidad baja, los clientes actuales se sienten descuidados y tú terminas agotado.

Por qué importa: un negocio que crece más rápido de lo que su capacidad real permite suele terminar con clientes insatisfechos, entregas tardías y un dueño agotado que no puede sostener ese ritmo por mucho tiempo. Proteger tu capacidad es proteger la calidad de lo que ofreces.

Pasos prácticos:
1. Anota, durante una semana normal, cuántas horas realmente dedicas a atender clientes, producir tu producto o servicio, y manejar la parte administrativa del negocio.
2. Compara esas horas con las horas que tienes disponibles de forma sostenible, sin sacrificar tu descanso o tu salud de forma constante.
3. Identifica el punto donde aceptar más trabajo empieza a bajar la calidad de lo que entregas o a atrasar tus tiempos de entrega.
4. Define con claridad cuántos clientes o pedidos puedes aceptar por semana o por mes sin cruzar ese punto.
5. Practica decir que no o proponer una fecha más realista cuando una solicitud sobrepasa tu capacidad actual, explicando el motivo con honestidad.

Un dato importante: reconocer tus límites no es una debilidad ni significa que tu negocio no puede crecer. Es una forma de proteger la calidad de tu trabajo y tu propia salud mientras encuentras formas sostenibles de aumentar tu capacidad con el tiempo.'
WHERE lesson_key = 'healthy_boundaries_and_capacity' AND md5(replace(body_es, chr(13), '')) = '1179b7580d6a83eb9aee0ebbfbd24757';

DO $i1a1$
DECLARE
  n integer;
BEGIN
  SELECT count(*) INTO n FROM (VALUES
      ('consistent_business_information', 'summary_es', '79c58ebe3f6b3bc87a79678d03c83d89'),
      ('healthy_boundaries_and_capacity', 'body_es', '1e67dadd097bee586877cd6db947cd82')
    ) AS g(k, col, h) LEFT JOIN public.business_learning_lessons t ON t.lesson_key = g.k WHERE (CASE g.col WHEN 'summary_es' THEN md5(replace(t.summary_es, chr(13), '')) WHEN 'body_es' THEN md5(replace(t.body_es, chr(13), '')) END) IS DISTINCT FROM g.h;
  IF n <> 0 THEN RAISE EXCEPTION 'I-1A.1: % value(s) are not the reviewed text — rolling back', n; END IF;
  SELECT count(*) INTO n FROM public.business_learning_lessons;
  IF n <> 16 THEN RAISE EXCEPTION 'I-1A.1: expected 16 lessons, found % — rolling back', n; END IF;
  SELECT count(*) INTO n FROM public.business_learning_lessons WHERE lesson_key IN ('what_problem_do_you_solve', 'customer_conversations', 'know_your_competition');
  IF n <> 0 THEN RAISE EXCEPTION 'I-1A.1: % I-1 lesson row(s) exist — Part A is not part of this apply', n; END IF;
END
$i1a1$;

COMMIT;
