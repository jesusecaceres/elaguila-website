import Link from "next/link";
import { FiClock } from "react-icons/fi";
import type { SupportedLang } from "@/app/lib/language";
import type { Lang, LearningLandingCopy } from "../learningCopy";
import { LEARNING_ANCHORS, lessonHref, type RoadmapStageView } from "../learningJourneys";
import { STAGE_GLYPHS } from "./learningGlyphs";
import { LEARNING_CONTAINER, LEARNING_EYEBROW, LEARNING_FOCUS_RING, LEARNING_H2, LEARNING_INTRO, LEARNING_SECTION, lessonsCountLabel } from "./learningUi";

/**
 * Gate L1D — "El camino de un negocio". Seven stages on one gold path: horizontal editorial
 * roadmap from `lg`, vertical timeline below it (never a horizontal scroll strip). Each stage
 * lists its real published lessons or the truthful "En preparación" state — never a zero badge.
 */
export function LearningBusinessRoadmap({
  copy,
  chrome,
  lang,
  routeLang,
  stages,
}: {
  copy: LearningLandingCopy;
  chrome: { lessonSingular: string; lessonPlural: string; minutesLabel: string };
  lang: Lang;
  routeLang: SupportedLang;
  stages: RoadmapStageView[];
}) {
  const c = copy.roadmap;
  return (
    <section id={LEARNING_ANCHORS.roadmap} className={`${LEARNING_SECTION} border-t border-[#D6C7AD]/70 bg-[#FFFDF7]/60 py-12 sm:py-14`} aria-labelledby="aprender-roadmap-title">
      <div className={LEARNING_CONTAINER}>
        <p className={LEARNING_EYEBROW}>{c.eyebrow}</p>
        <h2 id="aprender-roadmap-title" className={LEARNING_H2}>
          {c.title}
        </h2>
        <p className={`${LEARNING_INTRO} font-serif text-lg italic`}>{c.intro}</p>

        <ol className="relative mt-10 grid gap-6 lg:grid-cols-7 lg:gap-3" aria-label={c.stageAria}>
          {/* Connector: vertical rail on phones/tablets, horizontal gold path on desktop. */}
          <div className="pointer-events-none absolute left-[1.375rem] top-2 h-[calc(100%-1rem)] w-0.5 bg-[#C9A84A]/60 lg:left-0 lg:top-[1.375rem] lg:h-0.5 lg:w-full" aria-hidden />
          {stages.map((stage) => {
            const Glyph = STAGE_GLYPHS[stage.key];
            const label = c.stages[stage.key];
            const hasLessons = stage.lessons.length > 0;
            return (
              <li key={stage.key} className="relative flex gap-4 lg:flex-col lg:gap-3">
                <span
                  className={`relative z-10 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-[#C9A84A]/70 ${
                    hasLessons ? "bg-[#2A4536] text-[#F3D98A]" : "bg-[#FFFDF7] text-[#7A1E2C]"
                  }`}
                  aria-hidden
                >
                  <Glyph className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1 rounded-2xl border border-[#E8DFD0] bg-[#FFFDF7] p-4 shadow-[0_10px_28px_-20px_rgba(31,36,28,0.3)] lg:p-3.5">
                  <p className="text-[0.66rem] font-bold uppercase tracking-[0.14em] text-[#556B3E]">
                    {String(stage.index + 1).padStart(2, "0")}
                  </p>
                  <h3 className="mt-0.5 font-serif text-xl font-bold leading-tight text-[#2A4536] lg:text-lg">{label.title}</h3>
                  <p className="mt-1 text-sm leading-snug text-[#3D3428] lg:text-[0.8125rem]">{label.body}</p>
                  {hasLessons ? (
                    <>
                      <p className="mt-3 inline-flex items-center rounded-full bg-[#2A4536]/[0.08] px-2.5 py-0.5 text-xs font-bold text-[#2A4536]">
                        {lessonsCountLabel(stage.lessons.length, chrome.lessonSingular, chrome.lessonPlural)}
                      </p>
                      <ul className="mt-2 space-y-1.5">
                        {stage.lessons.map((l) => (
                          <li key={l.id}>
                            <Link
                              href={lessonHref(l.lessonKey, routeLang)}
                              className={`inline-flex min-h-11 items-center gap-1.5 rounded-lg text-sm font-semibold leading-snug text-[#7A1E2C] underline-offset-4 hover:underline lg:text-[0.8125rem] ${LEARNING_FOCUS_RING}`}
                            >
                              <span className="break-words">{lang === "es" ? l.titleEs : l.titleEn}</span>
                              <span className="shrink-0 text-xs font-normal text-[#5C5346]">
                                · {l.estimatedMinutes} {chrome.minutesLabel}
                              </span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </>
                  ) : (
                    <p className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-dashed border-[#7A1E2C]/45 px-2.5 py-0.5 text-xs font-bold text-[#7A1E2C]">
                      <FiClock className="h-3.5 w-3.5" aria-hidden />
                      {c.inPreparation}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
