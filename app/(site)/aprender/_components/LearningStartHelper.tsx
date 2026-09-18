import Link from "next/link";
import { FiArrowRight, FiClock } from "react-icons/fi";
import type { SupportedLang } from "@/app/lib/language";
import type { LearningLesson } from "@/app/lib/business/learning/types";
import type { Lang, LearningLandingCopy } from "../learningCopy";
import { LEARNING_ANCHORS, buildJourneyHref, lessonHref } from "../learningJourneys";
import { LEARNING_BTN_OUTLINE, LEARNING_CONTAINER, LEARNING_EYEBROW, LEARNING_LINK, LEARNING_SECTION } from "./learningUi";

/**
 * Gate G1 — "No sé por dónde empezar": the small helper that replaces the Phase-1 Start Here grid
 * on the landing. One recommendation (the idea pathway) and, when it is published, the first real
 * lesson of that pathway. No curriculum is listed here — that lives on the pathway pages.
 */
export function LearningStartHelper({
  copy,
  chrome,
  lang,
  routeLang,
  firstLesson,
}: {
  copy: LearningLandingCopy;
  chrome: { minutesLabel: string };
  lang: Lang;
  routeLang: SupportedLang;
  firstLesson: LearningLesson | null;
}) {
  const c = copy.helper;
  return (
    <section id={LEARNING_ANCHORS.helper} className={`${LEARNING_SECTION} border-t border-[#D6C7AD]/70 py-8 sm:py-10`} aria-labelledby="aprender-helper-title">
      <div className={LEARNING_CONTAINER}>
        <div className="grid gap-5 rounded-2xl border border-[#C9A84A]/45 bg-[#FFFDF7] p-5 shadow-[0_14px_36px_-24px_rgba(31,36,28,0.3)] sm:p-7 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:items-center lg:gap-10">
          <div>
            <p className={LEARNING_EYEBROW}>{c.eyebrow}</p>
            <h2 id="aprender-helper-title" className="mt-1 font-serif text-2xl font-bold leading-snug text-[#2A4536]">
              {c.title}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#3D3428] sm:text-[0.9375rem]">{c.body}</p>
          </div>
          <div className="flex flex-col items-start gap-2">
            <Link href={buildJourneyHref("idea", routeLang)} className={LEARNING_BTN_OUTLINE}>
              {c.cta}
              <FiArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            {firstLesson ? (
              <p className="text-xs text-[#5C5346]">
                {c.firstLessonLabel}{" "}
                <Link href={lessonHref(firstLesson.lessonKey, routeLang, "idea")} className={LEARNING_LINK}>
                  <span className="break-words">{lang === "es" ? firstLesson.titleEs : firstLesson.titleEn}</span>
                  <span className="inline-flex shrink-0 items-center gap-1 text-xs font-normal text-[#5C5346]">
                    <FiClock className="h-3.5 w-3.5" aria-hidden />
                    {firstLesson.estimatedMinutes} {chrome.minutesLabel}
                  </span>
                </Link>
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
