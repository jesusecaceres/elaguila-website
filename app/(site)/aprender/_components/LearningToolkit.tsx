import Link from "next/link";
import { FiArrowRight, FiCheckSquare, FiLogIn } from "react-icons/fi";
import type { SupportedLang } from "@/app/lib/language";
import { withLang } from "@/app/lib/language";
import type { LearningLandingCopy } from "../learningCopy";
import { LEARNING_ANCHORS, LEARNING_ROUTES } from "../learningJourneys";
import { GlossaryMark, IdeaMark } from "./learningGlyphs";
import { LEARNING_BTN_OUTLINE, LEARNING_CONTAINER, LEARNING_EYEBROW, LEARNING_H2, LEARNING_INTRO, LEARNING_SECTION } from "./learningUi";

/**
 * Gate L1G — "Kit práctico": the three capabilities that exist today (glossary, checklists &
 * templates, Idea Builder) as three distinct editorial panels. Counts are real published counts;
 * the Idea Builder note states the truth (the tool requires sign-in). Lives on the pathway pages
 * since G1; the landing uses the compact LearningToolsRow.
 */
export function LearningToolkit({
  copy,
  routeLang,
  glossaryCount,
  resourceCount,
}: {
  copy: LearningLandingCopy;
  routeLang: SupportedLang;
  glossaryCount: number;
  resourceCount: number;
}) {
  const c = copy.toolkit;
  return (
    <section id={LEARNING_ANCHORS.toolkit} className={`${LEARNING_SECTION} border-t border-[#D6C7AD]/70 py-12 sm:py-14`} aria-labelledby="aprender-toolkit-title">
      <div className={LEARNING_CONTAINER}>
        <p className={LEARNING_EYEBROW}>{c.eyebrow}</p>
        <h2 id="aprender-toolkit-title" className={LEARNING_H2}>
          {c.title}
        </h2>
        <p className={LEARNING_INTRO}>{c.intro}</p>

        <div className="mt-8 grid gap-4 md:grid-cols-3 lg:gap-5">
          {/* Glossary — deep green editorial panel */}
          <article className="flex h-full flex-col rounded-2xl border border-[#2A4536]/25 bg-[#2A4536] p-6 text-[#F8F4EA] shadow-[0_18px_44px_-26px_rgba(31,36,28,0.6)]">
            <div className="flex items-center justify-between gap-3">
              <GlossaryMark className="h-12 w-12 text-2xl" />
              {glossaryCount > 0 ? (
                <p className="text-right">
                  <span className="block font-serif text-3xl font-bold leading-none text-[#F3D98A]">{glossaryCount}</span>
                  <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[#EDE6D6]">{c.glossary.countLabel}</span>
                </p>
              ) : null}
            </div>
            <h3 className="mt-5 font-serif text-2xl font-bold">{c.glossary.title}</h3>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-[#EDE6D6]">{c.glossary.body}</p>
            <Link
              href={withLang(LEARNING_ROUTES.glossary, routeLang)}
              className="mt-6 inline-flex min-h-[2.875rem] items-center justify-center gap-2 rounded-full border-2 border-[#C9A84A]/70 px-6 text-sm font-bold text-[#F8F4EA] transition hover:bg-[#F8F4EA]/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C9A84A]"
            >
              {c.glossary.cta}
              <FiArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </article>

          {/* Checklists & templates — cream panel with checklist glyph */}
          <article className="flex h-full flex-col rounded-2xl border border-[#C9A84A]/45 bg-[#FFFDF7] p-6 shadow-[0_14px_36px_-24px_rgba(31,36,28,0.35)]">
            <div className="flex items-center justify-between gap-3">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#C9A84A] text-[#1E1810]" aria-hidden>
                <FiCheckSquare className="h-6 w-6" />
              </span>
              {resourceCount > 0 ? (
                <p className="text-right">
                  <span className="block font-serif text-3xl font-bold leading-none text-[#7A1E2C]">{resourceCount}</span>
                  <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[#556B3E]">{c.resources.countLabel}</span>
                </p>
              ) : null}
            </div>
            <h3 className="mt-5 font-serif text-2xl font-bold text-[#2A4536]">{c.resources.title}</h3>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-[#3D3428]">{c.resources.body}</p>
            <Link href={withLang(LEARNING_ROUTES.resources, routeLang)} className={`mt-6 ${LEARNING_BTN_OUTLINE}`}>
              {c.resources.cta}
              <FiArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </article>

          {/* Idea Builder — vignette panel, honest sign-in note */}
          <article className="flex h-full flex-col rounded-2xl border border-[#7A1E2C]/25 bg-[#7A1E2C]/[0.05] p-6 shadow-[0_14px_36px_-24px_rgba(31,36,28,0.35)]">
            <IdeaMark className="h-14 w-14" />
            <h3 className="mt-5 font-serif text-2xl font-bold text-[#7A1E2C]">{c.ideaBuilder.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-[#3D3428]">{c.ideaBuilder.body}</p>
            <p className="mt-3 flex flex-1 items-start gap-2 text-xs leading-relaxed text-[#5C5346]">
              <FiLogIn className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#7A1E2C]" aria-hidden />
              {c.ideaBuilder.note}
            </p>
            <Link href={withLang(LEARNING_ROUTES.ideaBuilder, routeLang)} className={`mt-6 ${LEARNING_BTN_OUTLINE}`}>
              {c.ideaBuilder.cta}
              <FiArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </article>
        </div>
      </div>
    </section>
  );
}
