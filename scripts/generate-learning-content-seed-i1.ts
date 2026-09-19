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
 * project-verified step: docs/learning-center-i1-staging-apply-runbook.md.
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
    "-- docs/learning-center-i1-staging-apply-runbook.md.",
    "--",
    "-- REVIEW BEFORE APPLYING (owner decision OD-2): staging first, never straight to production.",
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
  );
  return out.join("\n");
}

if (process.argv.includes("--write")) {
  const foundation = fs.readFileSync(path.join(ROOT, FOUNDATION_MIGRATION), "utf8");
  fs.mkdirSync(path.dirname(path.join(ROOT, SEED_I1_SQL)), { recursive: true });
  fs.writeFileSync(path.join(ROOT, SEED_I1_SQL), buildSeedSql(foundation));
  fs.writeFileSync(path.join(ROOT, SEED_I1_LEDGER), buildLedger(foundation));
  console.log(`wrote ${SEED_I1_SQL}\nwrote ${SEED_I1_LEDGER}`);
}
