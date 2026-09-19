/**
 * Gate G4-I1 — generator for the FIRST reviewed Learning Center content seed (owner decisions OD-2, D3).
 *
 *   npx tsx scripts/generate-learning-content-seed-i1.ts --write
 *
 * Emits two files, deterministically, from sources that already live in the repo:
 *   1. supabase/reviewed-seeds/learning-center/20260918_content_batch_i1.sql   (DATA ONLY — no DDL)
 *        a. three new `published` lesson rows whose body is the plain-text rendition of the SAME
 *           validated LessonPackage the page renders (one source, no hand-written second copy);
 *        b. D3 — repair of the Spanish accents missing from the TODAY-1 foundation seed;
 *        c. five owner-reviewed English grammar repairs (missing possessive apostrophes) in that same seed.
 *   2. docs/learning-center-seed-i1-accent-ledger.md                              (before → after ledger, Spanish + English)
 *
 * D3 is deliberately mechanical and provable. Only diacritics and the opening marks ¿ ¡ may change:
 * for every repaired string, `stripMarks(after) === before` is asserted here and again by
 * `npm run verify:business-learning-center`. Meaning, wording, punctuation and English are untouched.
 * Each UPDATE is guarded by an md5 of the ORIGINAL value (CR-stripped), so a row that someone has
 * edited since seeding is left alone, and re-running the seed is a no-op.
 *
 * QUARANTINE (Gate G4-I1.1): the seed is written to `supabase/reviewed-seeds/`, which no Supabase
 * command reads. It must NEVER live in `supabase/migrations/`, where an ordinary `supabase db push`
 * would apply it (and publish three lessons) without review. Applying it is an explicit,
 * project-verified step: docs/learning-center-i1-canonical-apply-runbook.md.
 *
 * I-1A / I-1B (owner decision, exposure option C): the canonical database is LIVE, so the seed is applied in
 * two separately authorized steps. `--write` therefore also emits the I-1A artifact — Parts B + C ONLY (the
 * 80 guarded repairs of text that is already public), sliced from the very same generated seed so it cannot
 * drift, wrapped in one transaction with an assertion block. Part A (the three new lessons) is I-1B.
 *
 * This script never talks to a database. Generating the file does not apply it.
 */
import { createHash } from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";
import { CUSTOMER_CONVERSATIONS_PACKAGE } from "../app/lib/business/learning/lessonPackage/packages/customerConversations";
import { KNOW_YOUR_COMPETITION_PACKAGE } from "../app/lib/business/learning/lessonPackage/packages/knowYourCompetition";
import { WHAT_PROBLEM_DO_YOU_SOLVE_PACKAGE } from "../app/lib/business/learning/lessonPackage/packages/whatProblemDoYouSolve";
import { packageToPlainText } from "../app/lib/business/learning/lessonPackage/plainText";
import { LEARNING_PROMPTS } from "../app/lib/business/learning/lessonPackage/prompts";
import type { LessonPackage } from "../app/lib/business/learning/lessonPackage/types";
import { validateLessonPackage } from "../app/lib/business/learning/lessonPackage/validate";

const ROOT = path.resolve(__dirname, "..");
export const FOUNDATION_MIGRATION = "supabase/migrations/20260807120000_business_learning_center_foundation.sql";
/** Reviewed, NOT auto-applied. Never move this under supabase/migrations/. */
export const SEED_I1_SQL = "supabase/reviewed-seeds/learning-center/20260918_content_batch_i1.sql";
export const SEED_I1_LEDGER = "docs/learning-center-seed-i1-accent-ledger.md";
/** I-1A — Parts B + C only, derived from the seed above. Reviewed, NOT auto-applied. */
export const SEED_I1A_REPAIRS_SQL = "supabase/reviewed-seeds/learning-center/20260918_content_batch_i1a_repairs.sql";
export const SEED_I1_RUNBOOK = "docs/learning-center-i1-canonical-apply-runbook.md";
/** I-1A.1 — two supplemental Spanish accent repairs, applied separately AFTER I-1A. Reviewed, NOT auto-applied. */
export const SEED_I1A1_CLEANUP_SQL = "supabase/reviewed-seeds/learning-center/20260918_content_batch_i1a1_accent_cleanup.sql";
export const CANONICAL_PROJECT = { name: "Leonix Media", ref: "xuieateniufcrsfdomwl" } as const;

/* ---------------------------------------------------------------------------------------------- */
/* 1. New lesson rows                                                                              */
/* ---------------------------------------------------------------------------------------------- */

type NewLessonRow = {
  pkg: LessonPackage;
  categoryKey: string;
  summary: { es: string; en: string };
  level: "foundation" | "practical" | "advanced";
  capabilityKey: string;
  dimensionKeys: string[];
  sortOrder: number;
};

export const SEED_I1_LESSONS: readonly NewLessonRow[] = [
  {
    pkg: WHAT_PROBLEM_DO_YOU_SOLVE_PACKAGE,
    categoryKey: "clientes_y_demanda",
    summary: {
      es: "Antes del producto, el problema: cómo decir en una frase qué le resuelves a quién.",
      en: "Before the product, the problem: how to say in one sentence what you solve, and for whom.",
    },
    level: "foundation",
    capabilityKey: "what_problem_do_you_solve",
    dimensionKeys: ["customer_clarity", "offer_and_value"],
    sortOrder: 3,
  },
  {
    pkg: CUSTOMER_CONVERSATIONS_PACKAGE,
    categoryKey: "clientes_y_demanda",
    summary: {
      es: "Cómo hablar con 3 personas reales, preguntando por lo que ya les pasó y sin venderles nada.",
      en: "How to talk with 3 real people, asking about what already happened to them and selling nothing.",
    },
    level: "foundation",
    capabilityKey: "customer_conversations",
    dimensionKeys: ["customer_clarity", "communication_and_follow_up"],
    sortOrder: 4,
  },
  {
    pkg: KNOW_YOUR_COMPETITION_PACKAGE,
    categoryKey: "clientes_y_demanda",
    summary: {
      es: "Cómo comparar, con honestidad, las alternativas que tu cliente ya usa hoy y encontrar tu espacio.",
      en: "How to compare, honestly, the alternatives your customer already uses today and find your space.",
    },
    level: "foundation",
    capabilityKey: "know_your_competition",
    dimensionKeys: ["offer_and_value", "customer_clarity"],
    sortOrder: 5,
  },
];

/* ---------------------------------------------------------------------------------------------- */
/* 2. D3 — Spanish accent repair of the foundation seed                                            */
/* ---------------------------------------------------------------------------------------------- */

/** Removes diacritics and the opening marks ¿ ¡ — the ONLY things D3 is allowed to add. */
export function stripMarks(text: string): string {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[¿¡]/g, "").normalize("NFC");
}

/**
 * Context rules, applied first. Spanish words whose accent depends on meaning (qué/que, cómo/como,
 * está/esta, sí/si, mí/mi …) are repaired ONLY inside these exact, reviewed phrases. Everywhere
 * else they are left as seeded.
 */
const PHRASE_RULES: readonly [string, string][] = [
  ["Por que importa", "Por qué importa"],
  ["por que te eligieron", "por qué te eligieron"],
  ["Escribe que necesitaban", "Escribe qué necesitaban"],
  ["sabes que palabras usar, que problemas mencionar primero y que preocupaciones", "sabes qué palabras usar, qué problemas mencionar primero y qué preocupaciones"],
  ["que ofreces, a quien atiendes y que te hace diferente", "qué ofreces, a quién atiendes y qué te hace diferente"],
  ["a la persona que hacer", "a la persona qué hacer"],
  ["identificar que servicios", "identificar qué servicios"],
  ["decir que si a cada", "decir que sí a cada"],
  ["Lo que si hace", "Lo que sí hace"],
  ["y como se enteraron", "y cómo se enteraron"],
  ["y como prefieren comunicarse", "y cómo prefieren comunicarse"],
  ["y como tu negocio lo resuelve", "y cómo tu negocio lo resuelve"],
  ["y como lo resuelves", "y cómo lo resuelves"],
  ["a decidir donde, como y", "a decidir dónde, cómo y"],
  ["elegir mejor donde anunciarte", "elegir mejor dónde anunciarte"],
  ["donde realmente esta tu cliente", "dónde realmente está tu cliente"],
  ["Como respondes a esas", "Cómo respondes a esas"],
  ["dice mucho sobre como tratas", "dice mucho sobre cómo tratas"],
  ["a futuros clientes como tratas", "a futuros clientes cómo tratas"],
  ["muestran como se comporta", "muestran cómo se comporta"],
  ["Proximamente: como", "Proximamente: cómo"],
  ["Plantilla: como pedir", "Plantilla: cómo pedir"],
  ["Quien es tu cliente", "Quién es tu cliente"],
  ["exactamente quien es", "exactamente quién es"],
  ["sobre quien es tu cliente", "sobre quién es tu cliente"],
  ["sobre a quien puedes atender", "sobre a quién puedes atender"],
  ["no sabe cual es el correcto", "no sabe cuál es el correcto"],
  ["anota cuales", "anota cuáles"],
  ["Revisa cuales de tus", "Revisa cuáles de tus"],
  ["no solo cuales se venden", "no solo cuáles se venden"],
  ["y cuando le responderas", "y cuándo le responderas"],
  ["cuando esta cerrado", "cuando está cerrado"],
  ["en realidad esta perdiendo", "en realidad está perdiendo"],
  ["te esta costando", "te está costando"],
  ["si esta funcionando", "si está funcionando"],
  ["cuando estas fuera", "cuando estás fuera"],
  ["que estas dispuesto", "que estás dispuesto"],
  ["cerca de mi.", "cerca de mí."],
  ["la respuesta llego demasiado", "la respuesta llegó demasiado"],
  ["y pregunta: le hablan directamente a esta persona", "y pregunta: ¿le hablan directamente a esta persona"],
];
/** A summary that opens with "Como …" is always the question word ("Cómo definir a tu cliente…"). */
const LEADING_COMO = /^Como (?=[a-zñ])/;

/** Words that carry an accent in every sense they are used with in this seed (reviewed against the full word list). */
const WORD_RULES: Readonly<Record<string, string>> = {
  accion: "acción", agradeceria: "agradecería", algun: "algún", analitica: "analítica", angulos: "ángulos", apareceras: "aparecerás",
  aplicacion: "aplicación", asi: "así", atencion: "atención", aun: "aún", automatico: "automático", automaticos: "automáticos",
  ayudaran: "ayudarán", basica: "básica", basico: "básico", basicos: "básicos", boton: "botón", busqueda: "búsqueda", busquedas: "búsquedas",
  calificacion: "calificación", caracteristicas: "características", categoria: "categoría", combinacion: "combinación", comun: "común",
  comunicacion: "comunicación", confien: "confíen", confusion: "confusión", conversion: "conversión", critica: "crítica", criticas: "críticas",
  cuanto: "cuánto", cuantos: "cuántos", cuantas: "cuántas", deberias: "deberías", decision: "decisión", dejaras: "dejarás",
  descripcion: "descripción", despues: "después", dias: "días", dificil: "difícil", dificiles: "difíciles", direccion: "dirección",
  disenada: "diseñada", dueno: "dueño", duenos: "dueños", electronico: "electrónico", envie: "envíe", escribenos: "escríbenos",
  escribiendote: "escribiéndote", escribio: "escribió", especifica: "específica", especifico: "específico", especificos: "específicos",
  facil: "fácil", facilmente: "fácilmente", fotografia: "fotografía", generico: "genérico", gustaria: "gustaría", imagenes: "imágenes",
  informacion: "información", interaccion: "interacción", interactuan: "interactúan", interes: "interés", leccion: "lección",
  limites: "límites", linea: "línea", mas: "más", maximo: "máximo", menu: "menú", mostro: "mostró", ningun: "ningún", numero: "número",
  numeros: "números", opinion: "opinión", pagina: "página", patron: "patrón", pequena: "pequeña", pequenos: "pequeños",
  practicas: "prácticas", practicos: "prácticos", preocupacion: "preocupación", preparacion: "preparación", presentacion: "presentación",
  proteccion: "protección", proximamente: "próximamente", publica: "pública", rapidas: "rápidas", rapido: "rápido", recibiras: "recibirás",
  recomendo: "recomendó", reputacion: "reputación", resena: "reseña", resenas: "reseñas", responderas: "responderás", respondio: "respondió",
  revision: "revisión", segun: "según", sera: "será", subiras: "subirás", tambien: "también", tardias: "tardías", telefono: "teléfono",
  todavia: "todavía", ubicacion: "ubicación", unica: "única", venderas: "venderás", verificacion: "verificación", version: "versión",
  visitanos: "visítanos",
};

export function repairSpanishAccents(before: string): string {
  let text = before;
  for (const [from, to] of PHRASE_RULES) text = text.split(from).join(to);
  text = text.replace(LEADING_COMO, "Cómo ");
  return text.replace(/\p{L}+/gu, (word) => {
    const fixed = WORD_RULES[word.toLowerCase()];
    if (!fixed) return word;
    if (word === word.toLowerCase()) return fixed;
    if (word === word.toUpperCase()) return fixed.toUpperCase();
    return fixed[0].toLocaleUpperCase("es") + fixed.slice(1);
  });
}

/** SQL string literals of a file, in order (comments stripped; '' unescaped). */
function sqlLiterals(sql: string): string[] {
  const stripped = sql.split("\n").map((line) => { const i = line.indexOf("--"); return i === -1 ? line : line.slice(0, i); }).join("\n");
  const out: string[] = [];
  let i = 0;
  while (i < stripped.length) {
    if (stripped[i] !== "'") { i++; continue; }
    let j = i + 1;
    let buf = "";
    while (j < stripped.length) {
      if (stripped[j] === "'") { if (stripped[j + 1] === "'") { buf += "'"; j += 2; continue; } break; }
      buf += stripped[j];
      j++;
    }
    out.push(buf);
    i = j + 1;
  }
  return out;
}

export type AccentRepair = { table: string; keyColumn: string; key: string; column: string; before: string; after: string };

const CATEGORY_KEYS = ["fundamentos_del_negocio", "clientes_y_demanda", "dinero_y_capacidad", "visibilidad_y_publicidad", "comunicacion_y_reputacion", "proteccion_y_datos"];
const PUBLISHED_KEYS = ["consistent_business_information", "who_is_your_customer", "revenue_vs_profit", "healthy_boundaries_and_capacity", "google_business_basics", "advertising_fundamentals", "whatsapp_business_basics", "reviews_and_customer_response"];
const PLANNED_KEYS = ["branding_basics", "referrals_basics", "profitable_service_basics", "simple_analytics", "local_seo_basics", "product_photography_basics", "short_video_basics", "customer_data_protection"];
const RESOURCE_TYPES = ["glossary_term", "checklist", "template"];

/** Every seeded Spanish string of the foundation migration, in file order, with its repaired form. Unchanged strings are dropped. */
export function buildAccentRepairs(foundationSql: string): AccentRepair[] {
  const L = sqlLiterals(foundationSql.replace(/\r\n/g, "\n"));
  const at = (key: string): number => {
    const i = L.indexOf(key);
    if (i < 0) throw new Error(`foundation seed is missing ${key}`);
    return i;
  };
  const found: Omit<AccentRepair, "after">[] = [];
  for (const key of CATEGORY_KEYS) {
    const i = at(key);
    found.push({ table: "business_learning_categories", keyColumn: "category_key", key, column: "title_es", before: L[i + 1] });
    found.push({ table: "business_learning_categories", keyColumn: "category_key", key, column: "summary_es", before: L[i + 3] });
  }
  for (const key of [...PUBLISHED_KEYS, ...PLANNED_KEYS]) {
    const i = at(key);
    found.push({ table: "business_learning_lessons", keyColumn: "lesson_key", key, column: "title_es", before: L[i + 1] });
    found.push({ table: "business_learning_lessons", keyColumn: "lesson_key", key, column: "summary_es", before: L[i + 3] });
    if (PUBLISHED_KEYS.includes(key)) found.push({ table: "business_learning_lessons", keyColumn: "lesson_key", key, column: "body_es", before: L[i + 5] });
  }
  const resourceKeys = [...new Set(L.filter((x) => /^(glossary|checklist|template)_[a-z_]+$/.test(x)))].filter((k) => RESOURCE_TYPES.includes(L[at(k) + 1]));
  for (const key of resourceKeys) {
    const i = at(key);
    found.push({ table: "business_learning_resources", keyColumn: "resource_key", key, column: "title_es", before: L[i + 2] });
    found.push({ table: "business_learning_resources", keyColumn: "resource_key", key, column: "body_es", before: L[i + 4] });
  }
  const repairs: AccentRepair[] = [];
  for (const r of found) {
    const after = repairSpanishAccents(r.before);
    if (stripMarks(after) !== r.before) throw new Error(`D3 rule changed more than accents in ${r.table}.${r.key}.${r.column}`);
    if (after !== r.before) repairs.push({ ...r, after });
  }
  return repairs;
}

/** Word-level before → after pairs of one repair (both sides tokenize identically because only marks changed). */
export function changedWords(r: AccentRepair): [string, string][] {
  const tokens = (t: string) => t.match(/[¿¡]?\p{L}+/gu) ?? [];
  const a = tokens(r.before);
  const b = tokens(r.after);
  if (a.length !== b.length) throw new Error(`token mismatch in ${r.key}.${r.column}`);
  const out: [string, string][] = [];
  a.forEach((w, i) => { if (w !== b[i]) out.push([w, b[i]]); });
  return out;
}

/* ---------------------------------------------------------------------------------------------- */
/* 2b. Part C — reviewed English grammar repairs (Gate G4-I1.2)                                     */
/* ---------------------------------------------------------------------------------------------- */

/**
 * The ONLY English changes this seed makes: five possessive apostrophes missing from the TODAY-1
 * seed, each approved by the owner as an exact before → after pair. Grammar only — no rewording, no
 * style edits, no other English string. The historical migration file is never modified; this
 * reviewed seed is the correction vehicle.
 */
export const ENGLISH_GRAMMAR_REPAIRS: readonly { table: string; keyColumn: string; key: string; column: "summary_en" | "body_en"; from: string; to: string }[] = [
  { table: "business_learning_categories", keyColumn: "category_key", key: "proteccion_y_datos", column: "summary_en", from: "customers information", to: "customers' information" },
  { table: "business_learning_lessons", keyColumn: "lesson_key", key: "customer_data_protection", column: "summary_en", from: "customers information", to: "customers' information" },
  { table: "business_learning_lessons", keyColumn: "lesson_key", key: "reviews_and_customer_response", column: "body_en", from: "many people decisions", to: "many people's decisions" },
  { table: "business_learning_lessons", keyColumn: "lesson_key", key: "reviews_and_customer_response", column: "body_en", from: "customers experience", to: "customers' experience" },
  { table: "business_learning_lessons", keyColumn: "lesson_key", key: "reviews_and_customer_response", column: "body_en", from: "customers opinions", to: "customers' opinions" },
];

export type EnglishRepair = { table: string; keyColumn: string; key: string; column: string; from: string; to: string; before: string; after: string };

/**
 * Resolves each approved pair against the seeded value. Repairs on the same column are CHAINED
 * (C3 → C4 → C5 on the reviews body): each one's `before` is the previous one's `after`, so every UPDATE is guarded by the exact value
 * it expects to find and a drifted row is skipped entirely.
 */
export function buildEnglishRepairs(foundationSql: string): EnglishRepair[] {
  const L = sqlLiterals(foundationSql.replace(/\r\n/g, "\n"));
  const current = new Map<string, string>();
  return ENGLISH_GRAMMAR_REPAIRS.map((r) => {
    const i = L.indexOf(r.key);
    if (i < 0) throw new Error(`foundation seed is missing ${r.key}`);
    const id = `${r.table}.${r.key}.${r.column}`;
    // categories: key, title_es, title_en, summary_es, summary_en · lessons: …, summary_en (+4), body_es, body_en (+6)
    const before = current.get(id) ?? L[i + (r.column === "summary_en" ? 4 : 6)];
    if (before.split(r.from).length !== 2) throw new Error(`${id}: expected exactly one "${r.from}"`);
    const after = before.replace(r.from, r.to);
    if (after.replace(r.to, r.from) !== before || after.length - before.length !== r.to.length - r.from.length) throw new Error(`${id}: more than the approved phrase changed`);
    current.set(id, after);
    return { ...r, before, after };
  });
}

/* ---------------------------------------------------------------------------------------------- */
/* 3. Emit                                                                                         */
/* ---------------------------------------------------------------------------------------------- */

const q = (text: string): string => `'${text.replace(/'/g, "''")}'`;
const md5 = (text: string): string => createHash("md5").update(text, "utf8").digest("hex");

export function buildSeedSql(foundationSql: string): string {
  const lines: string[] = [];
  lines.push(
    "-- =============================================================================",
    "-- Leonix Learning Center — CONTENT SEED, Idea batch I-1 (Gate G4-I1)",
    "-- =============================================================================",
    "-- GENERATED FILE. Do not edit by hand:",
    "--   npx tsx scripts/generate-learning-content-seed-i1.ts --write",
    "--",
    "-- DATA ONLY. No DDL: no table, column, constraint, index, policy or function is created or",
    "-- changed. Touches exactly three tables that already exist (TODAY-1 foundation):",
    "--   business_learning_lessons · business_learning_categories · business_learning_resources",
    "--",
    "-- REVIEWED SEED — NOT A MIGRATION. This file lives in supabase/reviewed-seeds/ on purpose:",
    "-- nothing applies it automatically. DO NOT move it into supabase/migrations/ and DO NOT use a",
    "-- blind `supabase db push` for it. Apply it explicitly, to a project you have verified, following",
    "-- docs/learning-center-i1-canonical-apply-runbook.md.",
    "--",
    "-- REVIEW BEFORE APPLYING (owner decision OD-2). There is no staging database: the only target is the",
    "-- canonical project Leonix Media (ref xuieateniufcrsfdomwl). Parts B + C are applied first, on their own,",
    "-- through the derived I-1A artifact (20260918_content_batch_i1a_repairs.sql). Part A is I-1B and needs",
    "-- its own authorization.",
    "-- Authoring this file did NOT apply it. Applying it PUBLISHES three lessons.",
    "--",
    "-- Part A — three new published lessons (additive; ON CONFLICT DO NOTHING):",
    ...SEED_I1_LESSONS.map((l) => `--   ${l.pkg.lessonKey}`),
    "--   Each body is the plain-text rendition of the validated LessonPackage in",
    "--   app/lib/business/learning/lessonPackage/packages/ — the same source the page renders.",
    "--",
    "-- Part B — D3: Spanish accent repair of the TODAY-1 seed (owner-approved). Only diacritics and",
    "--   the opening marks ¿ ¡ change; wording, meaning and English are untouched. Every UPDATE is",
    "--   guarded by the md5 of the ORIGINAL value (CR-stripped), so an edited row is left alone and",
    "--   re-running is a no-op. Before → after ledger: docs/learning-center-seed-i1-accent-ledger.md",
    "--",
    "-- Part C — five owner-reviewed ENGLISH grammar repairs in the TODAY-1 seed (missing possessive",
    "--   apostrophes). Grammar only; no other English text changes. Same guard as Part B: each UPDATE",
    "--   matches the md5 of the exact value it expects, so a drifted row is skipped, never overwritten.",
    "--",
    "-- The historical TODAY-1 migration file is not modified; this reviewed seed is the correction vehicle.",
    "--",
    "-- Idempotent. Safe to re-run.",
    "-- =============================================================================",
    "",
    "-- ---------------------------------------------------------------------------",
    "-- Part A — new lessons",
    "-- ---------------------------------------------------------------------------",
    "",
  );
  for (const l of SEED_I1_LESSONS) {
    const result = validateLessonPackage(l.pkg, { prompts: LEARNING_PROMPTS });
    if (!result.ok) throw new Error(`refusing to seed ${l.pkg.lessonKey}: ${result.errors.join(" | ")}`);
    lines.push(
      "INSERT INTO public.business_learning_lessons",
      "  (category_id, lesson_key, title_es, title_en, summary_es, summary_en, body_es, body_en, level, estimated_minutes, capability_key, related_dimension_keys, status, published_at, sort_order)",
      `SELECT c.id, ${q(l.pkg.lessonKey)},`,
      `  ${q(l.pkg.meta.title.es)}, ${q(l.pkg.meta.title.en)},`,
      `  ${q(l.summary.es)}, ${q(l.summary.en)},`,
      `  ${q(packageToPlainText(l.pkg, "es"))},`,
      `  ${q(packageToPlainText(l.pkg, "en"))},`,
      `  ${q(l.level)}, ${l.pkg.meta.readMinutes}, ${q(l.capabilityKey)}, ARRAY[${l.dimensionKeys.map(q).join(", ")}], 'published', now(), ${l.sortOrder}`,
      `FROM public.business_learning_categories c WHERE c.category_key = ${q(l.categoryKey)}`,
      "ON CONFLICT (lesson_key) DO NOTHING;",
      "",
    );
  }
  lines.push(
    "-- ---------------------------------------------------------------------------",
    "-- Part B — D3 Spanish accent repair (guarded; diacritics and ¿ ¡ only)",
    "-- ---------------------------------------------------------------------------",
    "",
  );
  for (const r of buildAccentRepairs(foundationSql)) {
    lines.push(
      `UPDATE public.${r.table} SET ${r.column} = ${q(r.after)}`,
      `WHERE ${r.keyColumn} = ${q(r.key)} AND md5(replace(${r.column}, chr(13), '')) = ${q(md5(r.before))};`,
      "",
    );
  }
  lines.push(
    "-- ---------------------------------------------------------------------------",
    "-- PART C — REVIEWED ENGLISH GRAMMAR REPAIRS (exactly five; guarded; apostrophes only)",
    "-- ---------------------------------------------------------------------------",
    "",
  );
  buildEnglishRepairs(foundationSql).forEach((r, i) => {
    lines.push(
      `-- C${i + 1}. ${r.table}.${r.key}.${r.column}: "${r.from}" -> "${r.to}"`,
      `UPDATE public.${r.table} SET ${r.column} = ${q(r.after)}`,
      `WHERE ${r.keyColumn} = ${q(r.key)} AND md5(replace(${r.column}, chr(13), '')) = ${q(md5(r.before))};`,
      "",
    );
  });
  return lines.join("\n");
}

export function buildLedger(foundationSql: string): string {
  const repairs = buildAccentRepairs(foundationSql);
  const totals = new Map<string, number>();
  for (const r of repairs) for (const [a, b] of changedWords(r)) totals.set(`${a} → ${b}`, (totals.get(`${a} → ${b}`) ?? 0) + 1);
  const out: string[] = [
    "# Learning Center seed I-1 — content repair ledger (D3 Spanish accents + reviewed English grammar)",
    "",
    "> GENERATED by `scripts/generate-learning-content-seed-i1.ts`. Do not edit by hand.",
    "",
    "Owner decision **D3**: the Spanish text seeded by TODAY-1 (`20260807120000_business_learning_center_foundation.sql`) was written without accents. Seed I-1 repairs it.",
    "",
    "**Rule of the repair:** only diacritics (á é í ó ú ñ ü) and the opening marks ¿ ¡ may change. For every string below, removing those marks from *after* gives back *before* exactly — asserted by the generator and by `npm run verify:business-learning-center`. No wording, meaning, punctuation or English text changes.",
    "",
    "**English:** D3 touches no English text. The only English changes in this seed are the five reviewed grammar repairs of Part C, listed in section 3.",
    "",
    `**Scope:** ${repairs.length} strings · ${[...totals.values()].reduce((n, x) => n + x, 0)} word repairs · ${totals.size} distinct before → after pairs.`,
    "",
    "## 1. Every distinct repair",
    "",
    "| Before → after | Times |",
    "|---|---|",
    ...[...totals.entries()].sort((x, y) => x[0].localeCompare(y[0], "es")).map(([pair, n]) => `| ${pair} | ${n} |`),
    "",
    "## 2. Per string",
    "",
    "Short strings are shown whole. Lesson and resource bodies list their repaired words (the full text is in the seed file).",
    "",
    "| Table | Key | Column | Before → after |",
    "|---|---|---|---|",
  ];
  for (const r of repairs) {
    const short = r.before.length <= 140 && !r.before.includes("\n");
    const detail = short ? `${r.before} → **${r.after}**` : changedWords(r).map(([a, b]) => `${a} → ${b}`).join(" · ");
    out.push(`| ${r.table.replace("business_learning_", "")} | \`${r.key}\` | ${r.column} | ${detail.replace(/\|/g, "\\|")} |`);
  }
  out.push(
    "",
    "## 3. Part C — reviewed English grammar repairs",
    "",
    "Exactly five, each an owner-approved before → after pair. **Reason for every row: grammar-only repair** (missing possessive apostrophe). No rewording, no style edits, no other English string is touched. Each UPDATE is guarded by the md5 of the exact value it expects (the three repairs of the same body are chained: C3 → C4 → C5), so a drifted row is skipped.",
    "",
    "| # | Table | Row | Column | Exact before | Exact after | Reason |",
    "|---|---|---|---|---|---|---|",
    ...buildEnglishRepairs(foundationSql).map((r, i) => `| C${i + 1} | ${r.table} | \`${r.key}\` | ${r.column} | ${r.from} | ${r.to} | grammar-only repair |`),
    "",
    "## 4. I-1A.1 — supplemental accent cleanup (separate, later transaction)",
    "",
    "Sections 1–3 are the 80 repairs of **I-1A**, executed on the canonical database as one transaction. The two repairs below were **not** part of it: D3 had no phrase rule for these meaning-dependent words. They were approved afterwards and are applied by their own artifact (`20260918_content_batch_i1a1_accent_cleanup.sql`), each guarded by the md5 of the value I-1A left behind. 80 + 2 — never \"82 in one transaction\".",
    "",
    "| # | Table | Row | Column | Exact before | Exact after | Reason |",
    "|---|---|---|---|---|---|---|",
    ...SUPPLEMENTAL_ACCENT_REPAIRS.map((r, i) => `| S${i + 1} | business_learning_lessons | \`${r.key}\` | ${r.column} | ${r.from} | ${r.to} | accent-only repair (missed by D3) |`),
    "",
  );
  return out.join("\n");
}

/* ---------------------------------------------------------------------------------------------- */
/* 4. I-1A — the live-text repair artifact (Parts B + C only)                                      */
/* ---------------------------------------------------------------------------------------------- */

const PART_B_MARK = "-- Part B — D3 Spanish accent repair";

/** Final expected value of every column the repairs touch (the C3 → C4 → C5 chain collapses to its last value). */
export function expectedRepairedValues(foundationSql: string): { table: string; keyColumn: string; key: string; column: string; after: string }[] {
  const finals = new Map<string, { table: string; keyColumn: string; key: string; column: string; after: string }>();
  for (const r of [...buildAccentRepairs(foundationSql), ...buildEnglishRepairs(foundationSql)]) {
    finals.set(`${r.table}.${r.key}.${r.column}`, { table: r.table, keyColumn: r.keyColumn, key: r.key, column: r.column, after: r.after });
  }
  return [...finals.values()];
}

/**
 * Parts B + C of the reviewed seed, byte-for-byte (sliced from `buildSeedSql`, never re-authored), inside ONE
 * transaction that ends with an assertion block: if any repaired value is not exactly the reviewed text, if a
 * lesson was added, or if an I-1 lesson key exists, the block raises, the batch aborts before COMMIT and
 * nothing is kept. Contains no INSERT, no DELETE and no DDL.
 */
export function buildRepairSql(foundationSql: string): string {
  const seed = buildSeedSql(foundationSql);
  const start = seed.lastIndexOf("-- -----", seed.indexOf(PART_B_MARK));
  if (start < 0) throw new Error("Part B not found in the generated seed");
  const repairs = seed.slice(start).trimEnd();
  const finals = expectedRepairedValues(foundationSql);
  const tables = [...new Set(finals.map((r) => r.table))];
  const checks = tables.map((table) => {
    const list = finals.filter((r) => r.table === table);
    const cols = [...new Set(list.map((r) => r.column))];
    const actual = "CASE g.col " + cols.map((c) => `WHEN '${c}' THEN md5(replace(t.${c}, chr(13), ''))`).join(" ") + " END";
    const values = list.map((r) => `(${q(r.key)}, ${q(r.column)}, ${q(md5(r.after))})`).join(",\n      ");
    return `  SELECT count(*) INTO n FROM (VALUES\n      ${values}\n    ) AS g(k, col, h) LEFT JOIN public.${table} t ON t.${list[0].keyColumn} = g.k WHERE (${actual}) IS DISTINCT FROM g.h;\n  bad := bad + n;`;
  });
  return [
    "-- =============================================================================",
    "-- Leonix Learning Center — I-1A LIVE TEXT REPAIRS (Parts B + C of content batch I-1)",
    "-- =============================================================================",
    "-- GENERATED FILE. Do not edit by hand:",
    "--   npx tsx scripts/generate-learning-content-seed-i1.ts --write",
    "--",
    "-- DERIVED, NOT FORKED: the statements below are Parts B and C of",
    "--   supabase/reviewed-seeds/learning-center/20260918_content_batch_i1.sql, byte for byte.",
    "-- Part A (the three new lessons) is deliberately ABSENT. It is I-1B and is not authorized here.",
    "--",
    `-- TARGET: the canonical project ${CANONICAL_PROJECT.name} (ref ${CANONICAL_PROJECT.ref}) and no other.`,
    "-- REVIEWED SEED — NOT A MIGRATION. DO NOT move it into supabase/migrations/. DO NOT use a blind",
    `-- \`supabase db push\`. Apply explicitly, following ${SEED_I1_RUNBOOK}.`,
    "--",
    "-- 80 guarded UPDATEs (75 Spanish accent repairs + 5 English grammar repairs) of text that is already",
    "-- public. 0 INSERT · 0 DELETE · 0 DDL. One transaction; the closing assertion block aborts it (nothing is",
    "-- committed) unless every repaired value is exactly the reviewed text, the lesson count is unchanged and",
    "-- no I-1 lesson key exists. Idempotent: after a successful apply every guard matches nothing.",
    "-- =============================================================================",
    "",
    "BEGIN;",
    "",
    repairs,
    "",
    "-- ---------------------------------------------------------------------------",
    "-- Assertions — raise (and therefore roll back) on any mismatch",
    "-- ---------------------------------------------------------------------------",
    "",
    "DO $i1a$",
    "DECLARE",
    "  n integer;",
    "  bad integer := 0;",
    "BEGIN",
    ...checks,
    `  IF bad <> 0 THEN RAISE EXCEPTION 'I-1A: % repaired value(s) are not the reviewed text — rolling back', bad; END IF;`,
    "  SELECT count(*) INTO n FROM public.business_learning_lessons;",
    "  IF n <> 16 THEN RAISE EXCEPTION 'I-1A: expected 16 lessons, found % — rolling back', n; END IF;",
    `  SELECT count(*) INTO n FROM public.business_learning_lessons WHERE lesson_key IN (${SEED_I1_LESSONS.map((l) => q(l.pkg.lessonKey)).join(", ")});`,
    "  IF n <> 0 THEN RAISE EXCEPTION 'I-1A: % I-1 lesson row(s) exist — Part A is not part of this apply', n; END IF;",
    "END",
    "$i1a$;",
    "",
    "COMMIT;",
    "",
  ].join("\n");
}

/* ---------------------------------------------------------------------------------------------- */
/* 5. I-1A.1 — supplemental accent cleanup (two repairs D3 missed)                                 */
/* ---------------------------------------------------------------------------------------------- */

/**
 * Two meaning-dependent accents that the D3 phrase rules did not cover. They were found while the I-1A
 * artifact was being applied and were approved by the owner as exact before → after pairs. They are NOT
 * added to PHRASE_RULES: Part B and the I-1A artifact are an executed production transaction and must stay
 * byte-identical. Each repair starts from the value I-1A left in the database (the D3 `after`).
 */
export const SUPPLEMENTAL_ACCENT_REPAIRS: readonly { key: string; column: "summary_es" | "body_es"; from: string; to: string }[] = [
  { key: "consistent_business_information", column: "summary_es", from: "Por que tu nombre", to: "Por qué tu nombre" },
  { key: "healthy_boundaries_and_capacity", column: "body_es", from: "y tu terminas agotado", to: "y tú terminas agotado" },
];

export function buildSupplementalRepairs(foundationSql: string): AccentRepair[] {
  const d3 = buildAccentRepairs(foundationSql);
  return SUPPLEMENTAL_ACCENT_REPAIRS.map((r) => {
    const base = d3.find((x) => x.table === "business_learning_lessons" && x.key === r.key && x.column === r.column);
    if (!base) throw new Error(`I-1A.1: ${r.key}.${r.column} was not repaired by D3 — cannot chain from it`);
    const before = base.after;
    if (before.split(r.from).length !== 2) throw new Error(`I-1A.1: expected exactly one "${r.from}" in ${r.key}.${r.column}`);
    if (before.includes(r.to)) throw new Error(`I-1A.1: "${r.to}" is already present in ${r.key}.${r.column}`);
    const after = before.replace(r.from, r.to);
    if (stripMarks(after) !== stripMarks(before) || after.length !== before.length) throw new Error(`I-1A.1: more than an accent changed in ${r.key}.${r.column}`);
    return { table: "business_learning_lessons", keyColumn: "lesson_key", key: r.key, column: r.column, before, after };
  });
}

/** Exactly two guarded UPDATEs in one asserting transaction. Contains none of the 80 I-1A repairs. */
export function buildSupplementalSql(foundationSql: string): string {
  const repairs = buildSupplementalRepairs(foundationSql);
  return [
    "-- =============================================================================",
    "-- Leonix Learning Center — I-1A.1 SUPPLEMENTAL ACCENT CLEANUP",
    "-- =============================================================================",
    "-- GENERATED FILE. Do not edit by hand:",
    "--   npx tsx scripts/generate-learning-content-seed-i1.ts --write",
    "--",
    "-- Two Spanish accents that the I-1A repair (D3) did not cover. Applied AFTER, and separately from,",
    "-- I-1A — that artifact (20260918_content_batch_i1a_repairs.sql) is an executed production transaction",
    "-- and is never edited. This file contains none of its 80 repairs.",
    "--",
    `-- TARGET: the canonical project ${CANONICAL_PROJECT.name} (ref ${CANONICAL_PROJECT.ref}) and no other.`,
    "-- REVIEWED SEED — NOT A MIGRATION. DO NOT move it into supabase/migrations/. DO NOT use a blind",
    `-- \`supabase db push\`. Apply explicitly, following ${SEED_I1_RUNBOOK}.`,
    "--",
    "-- 2 guarded UPDATEs · 0 INSERT · 0 DELETE · 0 DDL. Each guard is the md5 of the exact value I-1A left",
    "-- behind, so a drifted row is skipped, never overwritten. One transaction; the closing assertion block",
    "-- aborts it unless both final values are exactly the reviewed text, lessons are still 16 and no I-1",
    "-- lesson key exists. Idempotent: after a successful apply both guards match nothing.",
    "-- =============================================================================",
    "",
    "BEGIN;",
    "",
    ...repairs.flatMap((r, i) => [
      `-- S${i + 1}. ${r.table}.${r.key}.${r.column}: "${SUPPLEMENTAL_ACCENT_REPAIRS[i].from}" -> "${SUPPLEMENTAL_ACCENT_REPAIRS[i].to}"`,
      `UPDATE public.${r.table} SET ${r.column} = ${q(r.after)}`,
      `WHERE ${r.keyColumn} = ${q(r.key)} AND md5(replace(${r.column}, chr(13), '')) = ${q(md5(r.before))};`,
      "",
    ]),
    "DO $i1a1$",
    "DECLARE",
    "  n integer;",
    "BEGIN",
    "  SELECT count(*) INTO n FROM (VALUES",
    repairs.map((r) => `      (${q(r.key)}, ${q(r.column)}, ${q(md5(r.after))})`).join(",\n"),
    "    ) AS g(k, col, h) LEFT JOIN public.business_learning_lessons t ON t.lesson_key = g.k WHERE (CASE g.col WHEN 'summary_es' THEN md5(replace(t.summary_es, chr(13), '')) WHEN 'body_es' THEN md5(replace(t.body_es, chr(13), '')) END) IS DISTINCT FROM g.h;",
    "  IF n <> 0 THEN RAISE EXCEPTION 'I-1A.1: % value(s) are not the reviewed text — rolling back', n; END IF;",
    "  SELECT count(*) INTO n FROM public.business_learning_lessons;",
    "  IF n <> 16 THEN RAISE EXCEPTION 'I-1A.1: expected 16 lessons, found % — rolling back', n; END IF;",
    `  SELECT count(*) INTO n FROM public.business_learning_lessons WHERE lesson_key IN (${SEED_I1_LESSONS.map((l) => q(l.pkg.lessonKey)).join(", ")});`,
    "  IF n <> 0 THEN RAISE EXCEPTION 'I-1A.1: % I-1 lesson row(s) exist — Part A is not part of this apply', n; END IF;",
    "END",
    "$i1a1$;",
    "",
    "COMMIT;",
    "",
  ].join("\n");
}

if (process.argv.includes("--write")) {
  const foundation = fs.readFileSync(path.join(ROOT, FOUNDATION_MIGRATION), "utf8");
  fs.mkdirSync(path.dirname(path.join(ROOT, SEED_I1_SQL)), { recursive: true });
  fs.writeFileSync(path.join(ROOT, SEED_I1_SQL), buildSeedSql(foundation));
  // The I-1A artifact is an EXECUTED production transaction: it is never rewritten. If the generator ever
  // stops reproducing it, that is an error to look at, not something to overwrite.
  const executed = fs.readFileSync(path.join(ROOT, SEED_I1A_REPAIRS_SQL), "utf8").replace(/\r\n/g, "\n");
  if (executed !== buildRepairSql(foundation)) throw new Error(`${SEED_I1A_REPAIRS_SQL} no longer matches the generator — it is immutable history; fix the generator`);
  fs.writeFileSync(path.join(ROOT, SEED_I1A1_CLEANUP_SQL), buildSupplementalSql(foundation));
  fs.writeFileSync(path.join(ROOT, SEED_I1_LEDGER), buildLedger(foundation));
  console.log(`wrote ${SEED_I1_SQL}\nkept  ${SEED_I1A_REPAIRS_SQL} (executed — immutable)\nwrote ${SEED_I1A1_CLEANUP_SQL}\nwrote ${SEED_I1_LEDGER}`);
}
