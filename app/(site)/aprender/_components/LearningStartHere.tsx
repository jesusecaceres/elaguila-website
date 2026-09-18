import Link from "next/link";
import { FiArrowRight, FiClock } from "react-icons/fi";
import type { SupportedLang } from "@/app/lib/language";
import type { LearningCategory, LearningLesson } from "@/app/lib/business/learning/types";
import type { Lang, LearningLandingCopy } from "../learningCopy";
import { LEARNING_ANCHORS, journeysForLesson, lessonHref } from "../learningJourneys";
import { categoryGlyph } from "./learningGlyphs";
import { LEARNING_CONTAINER, LEARNING_EYEBROW, LEARNING_FOCUS_RING, LEARNING_H2, LEARNING_INTRO, LEARNING_SECTION, tintForCategory } from "./learningUi";

/**
 * Gate L1E — "Empieza aquí": curated published fundamentals. Each card opens with a typographic
 * hero (category tint + glyph + step number) so no lesson needs an image asset. Title, summary,
 * minutes and category are real DB values; the journey chip comes from the code-owned map.
 */
export function LearningStartHere({
  copy,
  chrome,
  lang,
  routeLang,
  lessons,
  categoriesById,
}: {
  copy: LearningLandingCopy;
  chrome: { minutesLabel: string };
  lang: Lang;
  routeLang: SupportedLang;
  lessons: LearningLesson[];
  categoriesById: Map<string, LearningCategory>;
}) {
  if (lessons.length === 0) return null;
  const c = copy.startHere;
  return (
    <section id={LEARNING_ANCHORS.startHere} className={`${LEARNING_SECTION} border-t border-[#D6C7AD]/70 py-12 sm:py-14`} aria-labelledby="aprender-start-title">
      <div className={LEARNING_CONTAINER}>
        <p className={LEARNING_EYEBROW}>{c.eyebrow}</p>
        <h2 id="aprender-start-title" className={LEARNING_H2}>
          {c.title}
        </h2>
        <p className={LEARNING_INTRO}>{c.intro}</p>

        <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5" aria-label={c.title}>
          {lessons.map((l, i) => {
            const category = categoriesById.get(l.categoryId);
            const categoryKey = category?.categoryKey ?? "";
            const tint = tintForCategory(categoryKey);
            const Glyph = categoryGlyph(categoryKey);
            const title = lang === "es" ? l.titleEs : l.titleEn;
            const summary = lang === "es" ? l.summaryEs : l.summaryEn;
            const categoryTitle = category ? (lang === "es" ? category.titleEs : category.titleEn) : null;
            const journey = journeysForLesson(l.lessonKey)[0];
            const journeyLabel = journey ? copy.journeys.items[journey].title : null;
            const isFirst = i === 0;
            return (
              <li key={l.id} className={isFirst ? "sm:col-span-2 lg:col-span-1" : ""}>
                <Link
                  href={lessonHref(l.lessonKey, routeLang)}
                  className={`group flex h-full flex-col overflow-hidden rounded-2xl border border-[#E8DFD0] bg-[#FFFDF7] shadow-[0_14px_36px_-24px_rgba(31,36,28,0.35)] transition hover:border-[#C9A84A]/70 ${LEARNING_FOCUS_RING}`}
                >
                  <div className={`flex items-start justify-between gap-3 p-5 ${tint.panel}`}>
                    <div>
                      <p className={`text-[0.66rem] font-bold uppercase tracking-[0.14em] ${tint.ink}`}>
                        {c.stepLabel} {String(i + 1).padStart(2, "0")}
                      </p>
                      {categoryTitle ? <p className="mt-1 text-xs font-semibold text-[#3D3428]">{categoryTitle}</p> : null}
                    </div>
                    <span className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${tint.glyph}`} aria-hidden>
                      <Glyph className="h-5 w-5" />
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="break-words font-serif text-xl font-bold leading-snug text-[#2A4536] group-hover:text-[#7A1E2C]">{title}</h3>
                    <p className="mt-2 flex-1 break-words text-sm leading-relaxed text-[#3D3428]">{summary}</p>
                    <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-[#5C5346]">
                      <span className="inline-flex items-center gap-1">
                        <FiClock className="h-3.5 w-3.5" aria-hidden />
                        {l.estimatedMinutes} {chrome.minutesLabel}
                      </span>
                      {journeyLabel ? (
                        <span className="inline-flex items-center rounded-full border border-[#C9A84A]/60 bg-[#FFFDF7] px-2 py-0.5 font-semibold text-[#2A4536]">{journeyLabel}</span>
                      ) : null}
                      <span className="ml-auto inline-flex items-center gap-1 font-bold text-[#7A1E2C]">
                        <FiArrowRight className="h-4 w-4" aria-hidden />
                      </span>
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
