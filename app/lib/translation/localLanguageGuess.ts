/**
 * Servicios Final UI Truth Closeout (2026-09-16) — zero-network, best-effort ES/EN content-language
 * guess used ONLY to predict the pre-click Translate button label for unknown-source ads
 * (Servicios: no stored `original_language`). The real, authoritative decision still runs
 * server-side (`detectAdLanguageWithConfiguredProvider` + `planUnknownSourceTranslation` in
 * app/api/translate-ad/route.ts) at click time — this heuristic never gates, replaces, or
 * duplicates that policy; it only makes the button's INITIAL wording likely-correct instead of a
 * blind assumption. Once a real result exists (this session, via cache or a completed translate),
 * the caller must prefer that real data over this guess.
 *
 * Fails to "unknown" (never a confident-but-wrong guess) on short, empty, or genuinely ambiguous
 * text, so the caller can fall back to today's baseline (assume target === siteLocale).
 */
import type { ContentLocale } from "./types";

const SPANISH_MARKERS_RE = /[ñáéíóúü¿¡]/i;

const SPANISH_STOPWORDS = new Set([
  "el", "la", "los", "las", "de", "del", "que", "y", "en", "un", "una", "unos", "unas", "con",
  "para", "por", "es", "son", "su", "sus", "muy", "pero", "como", "este", "esta", "estos", "estas",
  "nuestro", "nuestra", "nuestros", "nuestras", "servicio", "servicios", "negocio", "años",
  "experiencia", "trabajo", "trabajos", "calidad", "todo", "todos", "toda", "todas", "también",
  "sin", "al", "se", "lo", "le", "les", "más", "somos", "hacemos", "ofrecemos", "atención",
]);

const ENGLISH_STOPWORDS = new Set([
  "the", "and", "of", "to", "in", "is", "are", "with", "for", "our", "this", "that", "these",
  "those", "your", "we", "service", "services", "business", "years", "experience", "work", "works",
  "quality", "all", "without", "on", "it", "be", "you", "provide", "offer", "customer", "customers",
]);

function tokenize(text: string): string[] {
  return text.toLowerCase().match(/[a-záéíóúüñ]+/gi) ?? [];
}

/** Pure ES/EN guess over already-collected prose (e.g. `buildDetectionSample`). Never `es`/`en` on a tie. */
export function guessContentLocaleHeuristically(sampleText: string): ContentLocale {
  const text = sampleText.trim();
  if (text.length < 12) return "unknown";

  let esScore = 0;
  let enScore = 0;
  if (SPANISH_MARKERS_RE.test(text)) esScore += 3;

  for (const word of tokenize(text)) {
    if (SPANISH_STOPWORDS.has(word)) esScore += 1;
    else if (ENGLISH_STOPWORDS.has(word)) enScore += 1;
  }

  if (esScore === 0 && enScore === 0) return "unknown";
  if (esScore === enScore) return "unknown";
  return esScore > enScore ? "es" : "en";
}
