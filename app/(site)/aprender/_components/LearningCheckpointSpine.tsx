import Link from "next/link";
import { FiArrowRight, FiCheckSquare, FiClock } from "react-icons/fi";
import type { SupportedLang } from "@/app/lib/language";
import type { LearningResource } from "@/app/lib/business/learning/types";
import type { Lang, LearningJourneyKey } from "../learningCopy";
import type { LearningPathwayCopy } from "../learningPathwayCopy";
import { LEARNING_ANCHORS, checkpointAnchor, lessonHref, type CheckpointView } from "../learningJourneys";
import { CHECKPOINT_GLYPHS, JOURNEY_ACCENT } from "./learningGlyphs";
import { LEARNING_CONTAINER, LEARNING_EYEBROW, LEARNING_FOCUS_RING, LEARNING_H2, LEARNING_INTRO, LEARNING_LINK, LEARNING_SECTION } from "./learningUi";

/**
 * Gate G1 — the canonical 7-checkpoint business spine for one journey (evolved from the Phase-1
 * "El camino de un negocio" roadmap, same gold-rail language). From `lg` a horizontal overview
 * rail links to each checkpoint; at every width the checkpoints themselves read as one vertical
 * progression (never a sideways-scrolling strip). A checkpoint lists this journey's real published
 * lessons — with the journey's own depth, urgency, framing and action — or the truthful
 * "En preparación" state. Planned lessons are never named.
 */
export function LearningCheckpointSpine({
  copy,
  chrome,
  lang,
  routeLang,
  journey,
  checkpoints,
  resourcesByLessonId,
}: {
  copy: LearningPathwayCopy;
  chrome: { minutesLabel: string };
  lang: Lang;
  routeLang: SupportedLang;
  journey: LearningJourneyKey;
  checkpoints: CheckpointView[];
  resourcesByLessonId: Map<string, LearningResource[]>;
}) {
  const c = copy.spine;
  const accent = JOURNEY_ACCENT[journey];
  const focus = c.focus[journey];
  /** The longer "in preparation" explanation is said once; later empty checkpoints keep only the chip. */
  const firstEmptyKey = checkpoints.find((cp) => cp.items.length === 0)?.key ?? null;

  return (
    <section id={LEARNING_ANCHORS.spine} className={`${LEARNING_SECTION} border-t border-[#D6C7AD]/70 bg-[#FFFDF7]/60 py-12 sm:py-14`} aria-labelledby="aprender-spine-title">
      <div className={LEARNING_CONTAINER}>
        <p className={LEARNING_EYEBROW}>{c.eyebrow}</p>
        <h2 id="aprender-spine-title" className={LEARNING_H2}>
          {c.title}
        </h2>
        <p className={LEARNING_INTRO}>{c.intro}</p>

        {/* Overview rail — desktop only; on smaller screens the vertical progression below is the spine. */}
        <nav className="relative mt-10 hidden lg:block" aria-label={c.overviewAria}>
          <div className="pointer-events-none absolute left-0 top-[1.375rem] h-0.5 w-full bg-[#C9A84A]/60" aria-hidden />
          <ol className="relative grid grid-cols-7 gap-3">
            {checkpoints.map((cp) => {
              const Glyph = CHECKPOINT_GLYPHS[cp.key];
              const hasLessons = cp.items.length > 0;
              return (
                <li key={cp.key} className="min-w-0">
                  <a href={`#${checkpointAnchor(cp.key)}`} className={`group flex min-h-11 flex-col gap-2 rounded-xl ${LEARNING_FOCUS_RING}`}>
                    <span
                      className={`relative z-10 inline-flex h-11 w-11 items-center justify-center rounded-full border-2 border-[#C9A84A]/70 ${
                        hasLessons ? "bg-[#2A4536] text-[#F3D98A]" : "bg-[#FFFDF7] text-[#7A1E2C]"
                      }`}
                      aria-hidden
                    >
                      <Glyph className="h-5 w-5" />
                    </span>
                    <span className="text-[0.66rem] font-bold uppercase tracking-[0.14em] text-[#556B3E]">{String(cp.index + 1).padStart(2, "0")}</span>
                    <span className="-mt-1.5 font-serif text-base font-bold leading-tight text-[#2A4536] underline-offset-4 group-hover:underline">
                      {c.checkpoints[cp.key].title}
                    </span>
                    {hasLessons ? null : <span className="text-xs font-semibold text-[#7A1E2C]">{c.inPreparation}</span>}
                  </a>
                </li>
              );
            })}
          </ol>
        </nav>

        <ol className="relative mt-10 space-y-6 lg:mt-12">
          <div className="pointer-events-none absolute left-[1.375rem] top-2 h-[calc(100%-1rem)] w-0.5 bg-[#C9A84A]/60" aria-hidden />
          {checkpoints.map((cp) => {
            const Glyph = CHECKPOINT_GLYPHS[cp.key];
            const label = c.checkpoints[cp.key];
            const hasLessons = cp.items.length > 0;
            const headingId = `aprender-${checkpointAnchor(cp.key)}`;
            return (
              <li key={cp.key} id={checkpointAnchor(cp.key)} className="relative flex scroll-mt-24 gap-3 sm:gap-4" aria-labelledby={headingId}>
                <span
                  className={`relative z-10 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-[#C9A84A]/70 ${
                    hasLessons ? "bg-[#2A4536] text-[#F3D98A]" : "bg-[#FFFDF7] text-[#7A1E2C]"
                  }`}
                  aria-hidden
                >
                  <Glyph className="h-5 w-5" />
                </span>

                <div className={`min-w-0 flex-1 rounded-2xl border bg-[#FFFDF7] shadow-[0_10px_28px_-20px_rgba(31,36,28,0.3)] ${hasLessons ? "border-[#E8DFD0] p-4 sm:p-6" : "border-dashed border-[#D6C7AD] p-4 sm:p-5"}`}>
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <p className="text-[0.66rem] font-bold uppercase tracking-[0.14em] text-[#556B3E]">
                      {c.checkpointLabel} {String(cp.index + 1).padStart(2, "0")}
                    </p>
                    <h3 id={headingId} className="font-serif text-xl font-bold leading-tight text-[#2A4536] sm:text-2xl">
                      {label.title}
                    </h3>
                  </div>
                  <p className="mt-1 text-sm leading-snug text-[#5C5346]">{label.body}</p>
                  <p className={`mt-3 font-serif text-[1.05rem] italic leading-snug ${accent.ink}`}>{focus[cp.key]}</p>

                  {hasLessons ? (
                    <ul className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                      {cp.items.map(({ lesson, entry }) => {
                        const title = lang === "es" ? lesson.titleEs : lesson.titleEn;
                        const resources = resourcesByLessonId.get(lesson.id) ?? [];
                        return (
                          <li key={lesson.id} className="min-w-0">
                            <article className="flex h-full flex-col rounded-xl border border-[#E8DFD0] bg-[#FAF6EE] p-4">
                              <p className="flex flex-wrap items-center gap-2 text-xs font-bold">
                                <span className={`rounded-full px-2.5 py-0.5 ${accent.chip}`}>{c.depth[entry.depth]}</span>
                                <span className="rounded-full border border-[#C9A84A]/70 bg-[#FFFDF7] px-2.5 py-0.5 text-[#2A4536]">{c.urgency[entry.urgency]}</span>
                                <span className="ml-auto inline-flex items-center gap-1 font-normal text-[#5C5346]">
                                  <FiClock className="h-3.5 w-3.5" aria-hidden />
                                  {lesson.estimatedMinutes} {chrome.minutesLabel}
                                </span>
                              </p>
                              <h4 className="mt-3 break-words font-serif text-lg font-bold leading-snug text-[#1E1810]">{title}</h4>
                              <p className="mt-1.5 break-words text-sm leading-relaxed text-[#3D3428]">{entry.framing[lang]}</p>
                              <p className="mt-3 flex-1 break-words border-l-2 border-[#C9A84A] pl-3 text-sm leading-relaxed text-[#3D3428]">
                                <span className="block text-[0.66rem] font-bold uppercase tracking-[0.14em] text-[#556B3E]">{c.actionLabel}</span>
                                {entry.action[lang]}
                              </p>
                              {resources.length > 0 ? (
                                <ul className="mt-3 space-y-1 text-xs leading-snug text-[#5C5346]" aria-label={c.includesLabel}>
                                  {resources.map((r) => (
                                    <li key={r.id} className="flex items-start gap-1.5">
                                      <FiCheckSquare className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#556B3E]" aria-hidden />
                                      <span className="break-words">
                                        <span className="font-semibold">{c.includesLabel}:</span> {lang === "es" ? r.titleEs : r.titleEn}
                                      </span>
                                    </li>
                                  ))}
                                </ul>
                              ) : null}
                              <Link href={lessonHref(lesson.lessonKey, routeLang, journey)} className={`mt-2 ${LEARNING_LINK}`}>
                                {c.openLesson}
                                <span className="sr-only">: {title}</span>
                                <FiArrowRight className="h-4 w-4" aria-hidden />
                              </Link>
                            </article>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <p className="mt-3 flex flex-col items-start gap-2 text-sm leading-relaxed text-[#5C5346] sm:flex-row">
                      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-dashed border-[#7A1E2C]/45 px-2.5 py-0.5 text-xs font-bold text-[#7A1E2C]">
                        <FiClock className="h-3.5 w-3.5" aria-hidden />
                        {c.inPreparation}
                      </span>
                      {cp.key === firstEmptyKey ? <span>{c.inPreparationBody}</span> : null}
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
