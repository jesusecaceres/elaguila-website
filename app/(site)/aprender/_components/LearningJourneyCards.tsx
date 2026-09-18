import Link from "next/link";
import { FiArrowRight, FiClock } from "react-icons/fi";
import type { SupportedLang } from "@/app/lib/language";
import type { LearningLesson } from "@/app/lib/business/learning/types";
import type { Lang, LearningJourneyKey, LearningLandingCopy } from "../learningCopy";
import { LEARNING_ANCHORS, LEARNING_JOURNEY_KEYS, buildJourneyHref, lessonHref, totalMinutes } from "../learningJourneys";
import { JOURNEY_ACCENT, JourneyVignette } from "./learningGlyphs";
import {
  LEARNING_BTN_PRIMARY,
  LEARNING_CONTAINER,
  LEARNING_EYEBROW,
  LEARNING_FOCUS_RING,
  LEARNING_H2,
  LEARNING_INTRO,
  LEARNING_LINK,
  LEARNING_SECTION,
  lessonsCountLabel,
} from "./learningUi";

/**
 * Gate L1C — "¿Dónde estás hoy?" Three journey choices, each with its own code-drawn vignette.
 * Counts/minutes are computed only from published lessons. When `?journey=` is present the
 * matching card is marked current and its ordered lesson sequence renders underneath
 * (Phase 1 behaviour; Phase 2 swaps `buildJourneyHref` to dedicated pathway routes).
 */
export function LearningJourneyCards({
  copy,
  chrome,
  lang,
  routeLang,
  journeys,
  selected,
}: {
  copy: LearningLandingCopy;
  chrome: { lessonSingular: string; lessonPlural: string; minutesLabel: string };
  lang: Lang;
  routeLang: SupportedLang;
  journeys: Record<LearningJourneyKey, LearningLesson[]>;
  selected: LearningJourneyKey | null;
}) {
  const c = copy.journeys;
  const selectedLessons = selected ? journeys[selected] : [];

  return (
    <section id={LEARNING_ANCHORS.journeys} className={`${LEARNING_SECTION} border-t border-[#D6C7AD]/70 py-12 sm:py-14`} aria-labelledby="aprender-journeys-title">
      <div className={LEARNING_CONTAINER}>
        <p className={LEARNING_EYEBROW}>{c.eyebrow}</p>
        <h2 id="aprender-journeys-title" className={LEARNING_H2}>
          {c.title}
        </h2>
        <p className={LEARNING_INTRO}>{c.intro}</p>

        <ul className="mt-8 grid gap-5 md:grid-cols-3 md:gap-6" aria-label={c.title}>
          {LEARNING_JOURNEY_KEYS.map((key, index) => {
            const item = c.items[key];
            const accent = JOURNEY_ACCENT[key];
            const lessons = journeys[key];
            const isCurrent = selected === key;
            const minutes = totalMinutes(lessons);
            return (
              <li key={key} className="min-w-0">
                <article
                  aria-current={isCurrent ? "true" : undefined}
                  className={`flex h-full flex-col overflow-hidden rounded-2xl border-2 bg-[#FFFDF7] shadow-[0_14px_36px_-22px_rgba(31,36,28,0.3)] transition ${accent.border} ${
                    isCurrent ? "ring-4 ring-[#C9A84A]/45" : ""
                  }`}
                >
                  <div className="relative">
                    <JourneyVignette journey={key} className="block h-auto w-full" />
                    <span className={`absolute left-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-full font-serif text-sm font-bold ${accent.badge}`} aria-hidden>
                      {index + 1}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col p-5 sm:p-6">
                    <h3 className={`font-serif text-2xl font-bold leading-tight ${accent.ink}`}>{item.title}</h3>
                    <p className="mt-2 font-serif text-[1.05rem] italic leading-snug text-[#3D3428]">{item.empathy}</p>
                    <p className="mt-3 flex-1 text-sm leading-relaxed text-[#3D3428] sm:text-[0.9375rem]">{item.outcome}</p>
                    <p className={`mt-4 inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 text-xs font-bold ${accent.chip}`}>
                      {lessons.length > 0 ? (
                        <>
                          <span>{lessonsCountLabel(lessons.length, chrome.lessonSingular, chrome.lessonPlural)}</span>
                          <span aria-hidden>·</span>
                          <FiClock className="h-3.5 w-3.5" aria-hidden />
                          <span>
                            {minutes} {chrome.minutesLabel}
                          </span>
                        </>
                      ) : (
                        <span>{copy.roadmap.inPreparation}</span>
                      )}
                    </p>
                    <Link href={buildJourneyHref(key, routeLang)} className={`mt-5 ${LEARNING_BTN_PRIMARY}`}>
                      {item.cta}
                      <FiArrowRight className="h-4 w-4" aria-hidden />
                    </Link>
                  </div>
                </article>
              </li>
            );
          })}
        </ul>

        <p className="mt-5 text-sm text-[#5C5346]">{c.unsure}</p>

        {selected ? (
          <div
            id="ruta-seleccionada"
            className="mt-8 rounded-2xl border border-[#C9A84A]/45 bg-[#FFFDF7] p-5 shadow-[0_14px_36px_-22px_rgba(31,36,28,0.25)] sm:p-7"
            aria-labelledby="aprender-selected-journey-title"
          >
            <p className={LEARNING_EYEBROW}>{c.selectedEyebrow}</p>
            <h3 id="aprender-selected-journey-title" className={`mt-1 font-serif text-2xl font-bold ${JOURNEY_ACCENT[selected].ink}`}>
              {c.items[selected].title}
            </h3>
            {selectedLessons.length > 0 ? (
              <>
                <p className="mt-2 text-sm text-[#3D3428]">{c.selectedIntro}</p>
                <ol className="mt-5 grid gap-3 sm:grid-cols-2">
                  {selectedLessons.map((l, i) => {
                    const title = lang === "es" ? l.titleEs : l.titleEn;
                    const summary = lang === "es" ? l.summaryEs : l.summaryEn;
                    const href = lessonHref(l.lessonKey, routeLang);
                    return (
                      <li key={l.id} className="flex gap-3 rounded-xl border border-[#E8DFD0] bg-[#FAF6EE] p-4">
                        <span className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-serif text-sm font-bold ${JOURNEY_ACCENT[selected].badge}`} aria-hidden>
                          {i + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="break-words font-semibold text-[#1E1810]">{title}</p>
                          <p className="mt-1 break-words text-xs leading-relaxed text-[#5C5346]">{summary}</p>
                          <p className="mt-1 text-xs text-[#5C5346]">
                            {l.estimatedMinutes} {chrome.minutesLabel}
                          </p>
                          <Link href={href} className={i === 0 ? `mt-3 ${LEARNING_BTN_PRIMARY}` : `mt-1 ${LEARNING_LINK}`}>
                            {i === 0 ? c.startWith : c.openLesson}
                            <FiArrowRight className="h-4 w-4" aria-hidden />
                          </Link>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </>
            ) : (
              <p className="mt-2 text-sm text-[#3D3428]">{copy.roadmap.inPreparation}</p>
            )}
            <a href={`#${LEARNING_ANCHORS.roadmap}`} className={`mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-[#2A4536] underline-offset-4 hover:underline ${LEARNING_FOCUS_RING}`}>
              {copy.roadmap.title} ↓
            </a>
          </div>
        ) : null}
      </div>
    </section>
  );
}
