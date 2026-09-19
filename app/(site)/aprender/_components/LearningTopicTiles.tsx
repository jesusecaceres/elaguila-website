import Link from "next/link";
import type { ReactNode } from "react";
import { FiArrowRight } from "react-icons/fi";
import type { SupportedLang } from "@/app/lib/language";
import type { Lang, LearningLandingCopy } from "../learningCopy";
import { LEARNING_ANCHORS, categoryHref, type TopicTileView } from "../learningJourneys";
import { categoryGlyph } from "./learningGlyphs";
import { LEARNING_CONTAINER, LEARNING_EYEBROW, LEARNING_FOCUS_RING, LEARNING_H2, LEARNING_INTRO, LEARNING_SECTION, lessonsCountLabel, tintForCategory } from "./learningUi";

/**
 * Gate L1F — "Explora por tema": the existing category repository rendered as editorial tinted
 * tiles (real title, summary, published count). Categories with zero published lessons are not
 * passed in (see resolveTopicTiles). The existing LearningSearch is slotted in via `search`.
 * Retained but not rendered since the G1 polish: pathways link to the category pages from the
 * compact "Explorar por tema" row in LearningPathwayExtras.
 */
export function LearningTopicTiles({
  copy,
  chrome,
  lang,
  routeLang,
  tiles,
  search,
}: {
  copy: LearningLandingCopy;
  chrome: { lessonSingular: string; lessonPlural: string };
  lang: Lang;
  routeLang: SupportedLang;
  tiles: TopicTileView[];
  search: ReactNode;
}) {
  const c = copy.topics;
  return (
    <section id={LEARNING_ANCHORS.topics} className={`${LEARNING_SECTION} border-t border-[#D6C7AD]/70 bg-[#FFFDF7]/60 py-12 sm:py-14`} aria-labelledby="aprender-topics-title">
      <div className={LEARNING_CONTAINER}>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:items-end">
          <div>
            <p className={LEARNING_EYEBROW}>{c.eyebrow}</p>
            <h2 id="aprender-topics-title" className={LEARNING_H2}>
              {c.title}
            </h2>
            <p className={LEARNING_INTRO}>{c.intro}</p>
          </div>
          <div className="min-w-0" role="search" aria-label={c.searchLabel}>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-[#556B3E]">{c.searchLabel}</p>
            {search}
          </div>
        </div>

        {tiles.length > 0 ? (
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label={c.title}>
            {tiles.map(({ category, publishedCount }) => {
              const tint = tintForCategory(category.categoryKey);
              const Glyph = categoryGlyph(category.categoryKey);
              return (
                <li key={category.id}>
                  <Link
                    href={categoryHref(category.categoryKey, routeLang)}
                    className={`group flex h-full min-h-[10rem] flex-col rounded-2xl p-5 ring-1 transition hover:ring-2 ${tint.panel} ${tint.ring} ${LEARNING_FOCUS_RING}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${tint.glyph}`} aria-hidden>
                        <Glyph className="h-5 w-5" />
                      </span>
                      <span className={`rounded-full bg-[#FFFDF7] px-2.5 py-1 text-xs font-bold ${tint.ink}`}>
                        {lessonsCountLabel(publishedCount, chrome.lessonSingular, chrome.lessonPlural)}
                      </span>
                    </div>
                    <h3 className="mt-4 break-words font-serif text-xl font-bold leading-snug text-[#2A4536]">
                      {lang === "es" ? category.titleEs : category.titleEn}
                    </h3>
                    <p className="mt-2 flex-1 break-words text-sm leading-relaxed text-[#3D3428]">{lang === "es" ? category.summaryEs : category.summaryEn}</p>
                    <span className={`mt-4 inline-flex items-center gap-1.5 text-sm font-bold ${tint.ink}`}>
                      {c.explore}
                      <FiArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
