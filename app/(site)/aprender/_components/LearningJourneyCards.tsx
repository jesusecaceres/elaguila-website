import Link from "next/link";
import { FiArrowRight, FiClock } from "react-icons/fi";
import type { SupportedLang } from "@/app/lib/language";
import type { LearningLesson } from "@/app/lib/business/learning/types";
import type { LearningJourneyKey, LearningLandingCopy } from "../learningCopy";
import { LEARNING_ANCHORS, LEARNING_JOURNEY_KEYS, buildJourneyHref, totalMinutes } from "../learningJourneys";
import { JOURNEY_ACCENT, JourneyVignette } from "./learningGlyphs";
import {
  LEARNING_BTN_PRIMARY,
  LEARNING_CONTAINER,
  LEARNING_EYEBROW,
  LEARNING_H2,
  LEARNING_INTRO,
  LEARNING_SECTION,
  lessonsCountLabel,
} from "./learningUi";

/**
 * Gate L1C / G1 — "¿Dónde estás hoy?" The three doors of the Learning Center, each with its own
 * code-drawn vignette. Counts/minutes are computed only from published lessons. Every door opens
 * its dedicated pathway page (`/aprender/ruta/{journey}`); the landing no longer expands a journey
 * inline.
 */
export function LearningJourneyCards({
  copy,
  chrome,
  routeLang,
  journeys,
}: {
  copy: LearningLandingCopy;
  chrome: { lessonSingular: string; lessonPlural: string; minutesLabel: string };
  routeLang: SupportedLang;
  journeys: Record<LearningJourneyKey, LearningLesson[]>;
}) {
  const c = copy.journeys;

  return (
    <section id={LEARNING_ANCHORS.journeys} className={`${LEARNING_SECTION} border-t border-[#D6C7AD]/70 py-10 sm:py-12`} aria-labelledby="aprender-journeys-title">
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
            const minutes = totalMinutes(lessons);
            return (
              <li key={key} className="min-w-0">
                <article className={`flex h-full flex-col overflow-hidden rounded-2xl border-2 bg-[#FFFDF7] shadow-[0_14px_36px_-22px_rgba(31,36,28,0.3)] transition ${accent.border}`}>
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
                        <span>{c.inPreparation}</span>
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
      </div>
    </section>
  );
}
