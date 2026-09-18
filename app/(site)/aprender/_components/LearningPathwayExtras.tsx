import Link from "next/link";
import { FiArrowRight, FiChevronRight } from "react-icons/fi";
import type { SupportedLang } from "@/app/lib/language";
import type { Lang } from "../learningCopy";
import type { LearningPathwayCopy } from "../learningPathwayCopy";
import { LEARNING_ANCHORS, categoryHref, type TopicTileView } from "../learningJourneys";
import { METHOD_STRIP_GLYPHS } from "./learningGlyphs";
import { LEARNING_CONTAINER, LEARNING_EYEBROW, LEARNING_FOCUS_RING, LEARNING_SECTION } from "./learningUi";

/**
 * Gate G1 polish — the pathway's compact secondary band. A pathway is the school route, not a
 * second landing page, so the teaching method is one strip (learn → practice → use AI → verify →
 * keep going) and topic browsing is one row of links into the existing `/aprender/{categoryKey}`
 * pages. Only categories with published lessons are passed in (see resolveTopicTiles). Nothing is
 * hidden behind an accordion and nothing scrolls sideways: both rows simply wrap.
 */
export function LearningPathwayExtras({
  copy,
  lang,
  routeLang,
  tiles,
}: {
  copy: LearningPathwayCopy;
  lang: Lang;
  routeLang: SupportedLang;
  tiles: TopicTileView[];
}) {
  const c = copy.extras;
  return (
    <section id={LEARNING_ANCHORS.method} className={`${LEARNING_SECTION} border-t border-[#D6C7AD]/70 py-8 sm:py-10`} aria-labelledby="aprender-method-strip-title">
      <div className={`${LEARNING_CONTAINER} grid gap-8 lg:grid-cols-2 lg:gap-12`}>
        <div className="min-w-0">
          <p className={LEARNING_EYEBROW}>{c.methodEyebrow}</p>
          <h2 id="aprender-method-strip-title" className="mt-1 font-serif text-xl font-bold leading-snug text-[#2A4536]">
            {c.methodTitle}
          </h2>
          <ol className="mt-4 flex flex-wrap items-center gap-x-1.5 gap-y-2" aria-label={c.methodTitle}>
            {c.methodSteps.map((step, i) => {
              const Glyph = METHOD_STRIP_GLYPHS[i];
              return (
                <li key={step} className="flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[#C9A84A]/60 bg-[#FFFDF7] py-1 pl-1.5 pr-3 text-sm font-semibold text-[#2A4536]">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#2A4536] text-[#F3D98A]" aria-hidden>
                      <Glyph className="h-3.5 w-3.5" />
                    </span>
                    {step}
                  </span>
                  {i < c.methodSteps.length - 1 ? <FiChevronRight className="h-4 w-4 shrink-0 text-[#C9A84A]" aria-hidden /> : null}
                </li>
              );
            })}
          </ol>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-[#5C5346]">{c.methodNote}</p>
        </div>

        {tiles.length > 0 ? (
          <div id={LEARNING_ANCHORS.topics} className={`min-w-0 ${LEARNING_SECTION}`}>
            <p className={LEARNING_EYEBROW}>{c.topicsEyebrow}</p>
            <h2 className="mt-1 font-serif text-xl font-bold leading-snug text-[#2A4536]">{c.topicsTitle}</h2>
            <ul className="mt-4 flex flex-wrap gap-2" aria-label={c.topicsTitle}>
              {tiles.map(({ category }) => (
                <li key={category.id}>
                  <Link
                    href={categoryHref(category.categoryKey, routeLang)}
                    className={`inline-flex min-h-11 items-center gap-1.5 rounded-full border border-[#E8DFD0] bg-[#FFFDF7] px-4 text-sm font-semibold text-[#7A1E2C] transition hover:border-[#C9A84A]/70 ${LEARNING_FOCUS_RING}`}
                  >
                    <span className="break-words">{lang === "es" ? category.titleEs : category.titleEn}</span>
                    <FiArrowRight className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </section>
  );
}
