import Link from "next/link";
import { FiArrowRight, FiCheckSquare, FiLogIn } from "react-icons/fi";
import type { SupportedLang } from "@/app/lib/language";
import { withLang } from "@/app/lib/language";
import type { LearningLandingCopy } from "../learningCopy";
import { LEARNING_ANCHORS, LEARNING_ROUTES } from "../learningJourneys";
import { GlossaryMark, IdeaMark } from "./learningGlyphs";
import { LEARNING_CONTAINER, LEARNING_EYEBROW, LEARNING_SECTION, LEARNING_TOOL_TILE } from "./learningUi";

/**
 * Gate G1 — compact tools row, shared by the landing and the pathway pages: three slim links to
 * what exists today (glossary, checklists & templates, Idea Builder). Counts are real published
 * counts. The Idea Builder chip states the truth: the tool requires sign-in.
 */
export function LearningToolsRow({
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
  const meta = "mt-0.5 flex items-center gap-1 text-xs text-[#5C5346]";
  return (
    <section id={LEARNING_ANCHORS.tools} className={`${LEARNING_SECTION} border-t border-[#D6C7AD]/70 bg-[#FFFDF7]/60 py-8 sm:py-10`} aria-labelledby="aprender-tools-title">
      <div className={LEARNING_CONTAINER}>
        <p className={LEARNING_EYEBROW}>{c.eyebrow}</p>
        <h2 id="aprender-tools-title" className="mt-1 font-serif text-xl font-bold leading-snug text-[#2A4536] sm:text-2xl">
          {c.rowTitle}
        </h2>

        <ul className="mt-5 grid gap-3 md:grid-cols-3">
          <li>
            <Link href={withLang(LEARNING_ROUTES.glossary, routeLang)} className={LEARNING_TOOL_TILE}>
              <GlossaryMark className="h-11 w-11 shrink-0 text-lg" />
              <span className="min-w-0 flex-1">
                <span className="block font-serif text-lg font-bold leading-tight text-[#2A4536]">{c.glossary.title}</span>
                {glossaryCount > 0 ? (
                  <span className={meta}>
                    {glossaryCount} {c.glossary.countLabel}
                  </span>
                ) : null}
              </span>
              <FiArrowRight className="h-4 w-4 shrink-0 text-[#7A1E2C] transition group-hover:translate-x-0.5" aria-hidden />
            </Link>
          </li>
          <li>
            <Link href={withLang(LEARNING_ROUTES.resources, routeLang)} className={LEARNING_TOOL_TILE}>
              <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#C9A84A] text-[#1E1810]" aria-hidden>
                <FiCheckSquare className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-serif text-lg font-bold leading-tight text-[#2A4536]">{c.resources.title}</span>
                {resourceCount > 0 ? (
                  <span className={meta}>
                    {resourceCount} {c.resources.countLabel}
                  </span>
                ) : null}
              </span>
              <FiArrowRight className="h-4 w-4 shrink-0 text-[#7A1E2C] transition group-hover:translate-x-0.5" aria-hidden />
            </Link>
          </li>
          <li>
            <Link href={withLang(LEARNING_ROUTES.ideaBuilder, routeLang)} className={LEARNING_TOOL_TILE}>
              <IdeaMark className="h-11 w-11 shrink-0" />
              <span className="min-w-0 flex-1">
                <span className="block font-serif text-lg font-bold leading-tight text-[#7A1E2C]">{c.ideaBuilder.title}</span>
                <span className={meta}>
                  <FiLogIn className="h-3.5 w-3.5 shrink-0 text-[#7A1E2C]" aria-hidden />
                  {c.ideaBuilder.signInShort}
                </span>
              </span>
              <FiArrowRight className="h-4 w-4 shrink-0 text-[#7A1E2C] transition group-hover:translate-x-0.5" aria-hidden />
            </Link>
          </li>
        </ul>
      </div>
    </section>
  );
}
