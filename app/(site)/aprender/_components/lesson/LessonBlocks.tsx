/**
 * Gate G2 — static (server-rendered) lesson blocks. Each LessonBlock type has one deliberately
 * different editorial treatment so a lesson reads as a taught sequence, not as an article and not
 * as a wall of identical cards. Interactive blocks (activity, prompt, checklist) are small client
 * islands mounted by LessonRenderer.
 */
import Link from "next/link";
import type { ReactNode } from "react";
import { FiArrowDown, FiArrowRight, FiCheck, FiX } from "react-icons/fi";
import type { LearningResource } from "@/app/lib/business/learning/types";
import type {
  CompareBlock,
  ExampleBlock,
  ExplainBlock,
  GlossaryBlock,
  HookBlock,
  LessonJourneyKey,
  LessonLang,
  MistakesBlock,
  NoteBlock,
  OutcomesBlock,
  ProHelpBlock,
  RecapBlock,
  ResourceBlock,
  StepsBlock,
  VerifyBlock,
  VisualModelBlock,
} from "@/app/lib/business/learning/lessonPackage/types";
import type { LessonCopy } from "../../lessonCopy";
import { LEARNING_EYEBROW, LEARNING_LINK } from "../learningUi";
import { LessonVisual } from "./lessonVisuals";

export const LESSON_COLUMN = "mx-auto w-full max-w-3xl px-4 sm:px-6";
/** Clears the fixed site header plus the sticky lesson-mode bar. */
export const LESSON_SCROLL_MT = "scroll-mt-32";

export function LessonSection({
  id,
  eyebrow,
  title,
  children,
  band = false,
}: {
  id: string;
  eyebrow: string;
  title?: string;
  children: ReactNode;
  band?: boolean;
}) {
  const headingId = `${id}-titulo`;
  return (
    <section id={id} aria-labelledby={headingId} className={`${LESSON_SCROLL_MT} py-9 sm:py-11 ${band ? "border-y border-[#D6C7AD]/70 bg-[#FFFDF7]/70" : ""}`}>
      <div className={LESSON_COLUMN}>
        <p className={LEARNING_EYEBROW}>{eyebrow}</p>
        <h2 id={headingId} className={title ? "mt-1.5 font-serif text-[1.6rem] font-bold leading-snug text-[#2A4536] sm:text-[1.85rem]" : "sr-only"}>
          {title ?? eyebrow}
        </h2>
        <div className="mt-5">{children}</div>
      </div>
    </section>
  );
}

function labelsFor(record: Record<string, { es: string; en: string }>, lang: LessonLang): Record<string, string> {
  return Object.fromEntries(Object.entries(record).map(([k, v]) => [k, v[lang]]));
}

/* VISUAL HOOK — the first thing the learner sees: one idea, one picture. */
export function HookBlockView({ block, lang, copy }: { block: HookBlock; lang: LessonLang; copy: LessonCopy }) {
  return (
    <section aria-labelledby="gancho-titulo" className="border-y border-[#D6C7AD]/70 bg-[#F3EBDC]/60">
      <div className="mx-auto grid w-full max-w-5xl items-center gap-6 px-4 py-9 sm:px-6 sm:py-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-12">
        <div>
          <h2 id="gancho-titulo" className="font-serif text-[2rem] font-bold leading-[1.12] text-[#7A1E2C] sm:text-[2.6rem]">
            {block.headline[lang]}
          </h2>
          <p className="mt-4 max-w-md font-serif text-xl italic leading-snug text-[#3D3428]">{block.support[lang]}</p>
        </div>
        <figure className="min-w-0">
          <LessonVisual visualKey={block.visualKey} labels={labelsFor(block.visualLabels, lang)} className="mx-auto block h-auto w-full max-w-md" />
          <figcaption className="mt-3 text-sm leading-relaxed text-[#5C5346]">
            <span className="font-semibold text-[#2A4536]">{copy.sections.diagramDescription}: </span>
            {block.textAlternative[lang]}
          </figcaption>
        </figure>
      </div>
    </section>
  );
}

/* OUTCOMES — a promise, not a card. */
export function OutcomesBlockView({ block, lang }: { block: OutcomesBlock; lang: LessonLang }) {
  return (
    <>
      <p className="text-base leading-relaxed text-[#3D3428]">{block.intro[lang]}</p>
      <ol className="mt-4 space-y-3">
        {block.items.map((item, i) => (
          <li key={item.es} className="flex items-start gap-4">
            <span className="w-7 shrink-0 font-serif text-3xl font-bold leading-none text-[#C9A84A]" aria-hidden>
              {i + 1}
            </span>
            <span className="pt-0.5 font-serif text-xl leading-snug text-[#1E1810]">{item[lang]}</span>
          </li>
        ))}
      </ol>
    </>
  );
}

/* EXPLAIN — short chunks on a gold rule; never one long body. */
export function ExplainBlockView({ block, lang }: { block: ExplainBlock; lang: LessonLang }) {
  return (
    <>
      <div className="space-y-6 border-l-2 border-[#C9A84A]/70 pl-5">
        {block.chunks.map((chunk, i) => {
          const text = chunk.body[lang];
          if (!text) return null;
          return (
            <div key={i}>
              {chunk.heading ? <h3 className="font-serif text-xl font-bold leading-snug text-[#2A4536]">{chunk.heading[lang]}</h3> : null}
              <p className={`${chunk.heading ? "mt-1.5" : ""} break-words text-[1.0625rem] leading-relaxed text-[#3D3428] first-letter:uppercase`}>{text}</p>
            </div>
          );
        })}
      </div>
      {block.pullQuote ? (
        <p className="mt-8 border-y border-[#C9A84A]/60 py-5 text-center font-serif text-2xl italic leading-snug text-[#7A1E2C]">{block.pullQuote[lang]}</p>
      ) : null}
    </>
  );
}

/* VISUAL MODEL — a progression: vertical on phones, horizontal from md. Never scrolls sideways. */
export function VisualModelBlockView({ block, lang }: { block: VisualModelBlock; lang: LessonLang }) {
  const last = block.steps.length - 1;
  return (
    <figure>
      <ol className="flex flex-col items-stretch gap-2 md:flex-row md:items-stretch" aria-label={block.textAlternative[lang]}>
        {block.steps.map((step, i) => (
          <li key={step.label.es} className="flex flex-col items-stretch gap-2 md:flex-1 md:flex-row md:items-center">
            <div
              className={`flex-1 rounded-2xl border-2 p-4 text-center ${
                i === last ? "border-[#7A1E2C] bg-[#7A1E2C] text-[#FFFDF7]" : i === 0 ? "border-dashed border-[#D6C7AD] bg-[#FFFDF7]/60 text-[#5C5346]" : "border-[#C9A84A] bg-[#FFFDF7] text-[#1E1810]"
              }`}
            >
              <p className="text-[0.66rem] font-bold uppercase tracking-[0.14em] opacity-80">{String(i + 1).padStart(2, "0")}</p>
              <p className="mt-0.5 font-serif text-xl font-bold leading-tight">{step.label[lang]}</p>
              <p className="mt-1.5 text-sm leading-snug opacity-90">{step.note[lang]}</p>
            </div>
            {i < last ? (
              <span className="flex justify-center text-[#C9A84A]" aria-hidden>
                <FiArrowDown className="h-6 w-6 md:hidden" />
                <FiArrowRight className="hidden h-6 w-6 md:block" />
              </span>
            ) : null}
          </li>
        ))}
      </ol>
      <figcaption className="mt-4 text-center font-serif text-lg italic text-[#3D3428]">{block.caption[lang]}</figcaption>
    </figure>
  );
}

/* EXAMPLE — a story panel in the deep-green band; always labelled as illustrative. */
export function ExampleBlockView({ block, lang, journey }: { block: ExampleBlock; lang: LessonLang; journey: LessonJourneyKey | null }) {
  const variant = block.variants.find((v) => journey && v.journey === journey) ?? block.variants.find((v) => !v.journey) ?? block.variants[0];
  return (
    <section id={`b-${block.id}`} aria-labelledby={`b-${block.id}-titulo`} className={`${LESSON_SCROLL_MT} py-9 sm:py-11`}>
      <div className={LESSON_COLUMN}>
        <div className="rounded-2xl bg-[#2A4536] p-6 shadow-[0_20px_48px_-24px_rgba(31,36,28,0.55)] sm:p-8">
          <p className="inline-flex rounded-full border border-[#C9A84A]/70 px-3 py-0.5 text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[#F3D98A]">{block.label[lang]}</p>
          <h2 id={`b-${block.id}-titulo`} className="mt-3 font-serif text-[1.7rem] font-bold leading-snug text-[#F8F4EA]">
            {block.business[lang]}
          </h2>
          <p className="mt-3 break-words text-[1.0625rem] leading-relaxed text-[#EDE6D6]">{variant.story[lang]}</p>
          <p className="mt-5 border-t border-[#C9A84A]/35 pt-4 font-serif text-lg italic leading-snug text-[#F3D98A]">{block.takeaway[lang]}</p>
        </div>
      </div>
    </section>
  );
}

/* COMPARE — weak vs strong. Meaning is carried by icon + words, never by colour alone. */
export function CompareBlockView({ block, lang, copy }: { block: CompareBlock; lang: LessonLang; copy: LessonCopy }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="rounded-2xl border-2 border-dashed border-[#5C5346]/45 bg-[#FFFDF7]/60 p-5">
        <p className="flex items-center gap-2 text-sm font-bold text-[#5C5346]">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#5C5346]/60" aria-hidden>
            <FiX className="h-4 w-4" />
          </span>
          {block.weak.label[lang]} · {copy.sections.weakMark}
        </p>
        <p className="mt-3 font-serif text-xl leading-snug text-[#3D3428]">{block.weak.text[lang]}</p>
        <p className="mt-3 text-sm leading-relaxed text-[#5C5346]">{block.weak.why[lang]}</p>
      </div>
      <div className="rounded-2xl border-2 border-[#2A4536] bg-[#FFFDF7] p-5">
        <p className="flex items-center gap-2 text-sm font-bold text-[#2A4536]">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#2A4536] text-[#F3D98A]" aria-hidden>
            <FiCheck className="h-4 w-4" />
          </span>
          {block.strong.label[lang]} · {copy.sections.strongMark}
        </p>
        <p className="mt-3 font-serif text-xl leading-snug text-[#1E1810]">{block.strong.text[lang]}</p>
      </div>
      <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2 md:col-span-2">
        {block.strong.annotations.map((a) => (
          <div key={a.tag.es} className="border-l-2 border-[#C9A84A] pl-3">
            <dt className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[#7A1E2C]">{a.tag[lang]}</dt>
            <dd className="mt-0.5 text-sm leading-relaxed text-[#3D3428]">
              <span className="font-serif text-base italic text-[#1E1810]">“{a.fragment[lang]}”</span>
              <span className="block">{a.note[lang]}</span>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export function MistakesBlockView({ block, lang, copy }: { block: MistakesBlock; lang: LessonLang; copy: LessonCopy }) {
  return (
    <div className="space-y-4">
      {block.items.map((item) => (
        <div key={item.mistake.es} className="rounded-2xl border border-[#7A1E2C]/25 bg-[#7A1E2C]/[0.05] p-5">
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[#7A1E2C]">{copy.sections.mistakeLabel}</p>
          <p className="mt-1 font-serif text-xl leading-snug text-[#1E1810]">{item.mistake[lang]}</p>
          <p className="mt-4 text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[#2A4536]">{copy.sections.insteadLabel}</p>
          <p className="mt-1 text-base leading-relaxed text-[#3D3428]">{item.instead[lang]}</p>
        </div>
      ))}
    </div>
  );
}

/* GLOSSARY — real published glossary rows only; a missing key is skipped, never invented. */
export function GlossaryBlockView({ block, lang, resources, glossaryHref, copy }: { block: GlossaryBlock; lang: LessonLang; resources: readonly LearningResource[]; glossaryHref: string; copy: LessonCopy }) {
  const terms = block.resourceKeys
    .map((key) => resources.find((r) => r.resourceKey === key && r.resourceType === "glossary_term" && r.status === "published"))
    .filter((r): r is LearningResource => Boolean(r));
  if (terms.length === 0) return null;
  return (
    <>
      <dl className="divide-y divide-[#D6C7AD]/70 border-y border-[#D6C7AD]/70">
        {terms.map((t) => (
          <div key={t.id} className="grid gap-1 py-3 sm:grid-cols-[11rem_minmax(0,1fr)] sm:gap-4">
            <dt className="font-serif text-lg font-bold text-[#2A4536]">{lang === "es" ? t.titleEs : t.titleEn}</dt>
            <dd className="break-words text-sm leading-relaxed text-[#3D3428]">{lang === "es" ? t.bodyEs : t.bodyEn}</dd>
          </div>
        ))}
      </dl>
      <Link href={glossaryHref} className={`mt-2 ${LEARNING_LINK}`}>
        {copy.sections.glossaryLink}
        <FiArrowRight className="h-4 w-4" aria-hidden />
      </Link>
    </>
  );
}

export function glossaryBlockHasTerms(block: GlossaryBlock, resources: readonly LearningResource[]): boolean {
  return block.resourceKeys.some((key) => resources.some((r) => r.resourceKey === key && r.resourceType === "glossary_term" && r.status === "published"));
}

/* RESOURCE — existing published checklists/templates, as stored. */
export function ResourceBlockView({ block, lang, resources, labels }: { block: ResourceBlock; lang: LessonLang; resources: readonly LearningResource[]; labels: { checklist: string; template: string } }) {
  const items = block.resourceKeys
    .map((key) => resources.find((r) => r.resourceKey === key && r.resourceType !== "glossary_term" && r.status === "published"))
    .filter((r): r is LearningResource => Boolean(r));
  if (items.length === 0) return null;
  return (
    <ul className="space-y-4">
      {items.map((r) => {
        const lines = (lang === "es" ? r.bodyEs : r.bodyEn).split("\n").map((l) => l.trim()).filter(Boolean);
        return (
          <li key={r.id} className="rounded-2xl border border-[#C9A84A]/45 bg-[#FFFDF7] p-5">
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[#556B3E]">{r.resourceType === "checklist" ? labels.checklist : labels.template}</p>
            <h3 className="mt-1 break-words font-serif text-lg font-bold text-[#2A4536]">{lang === "es" ? r.titleEs : r.titleEn}</h3>
            <ul className="mt-3 space-y-2">
              {lines.map((line) => (
                <li key={line} className="flex items-start gap-2 text-sm leading-relaxed text-[#3D3428]">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#C9A84A]" aria-hidden />
                  <span className="break-words">{line}</span>
                </li>
              ))}
            </ul>
          </li>
        );
      })}
    </ul>
  );
}

export function resourceBlockHasItems(block: ResourceBlock, resources: readonly LearningResource[]): boolean {
  return block.resourceKeys.some((key) => resources.some((r) => r.resourceKey === key && r.resourceType !== "glossary_term" && r.status === "published"));
}

/* VERIFY — "AI helps. You verify." */
export function VerifyBlockView({ block, lang }: { block: VerifyBlock; lang: LessonLang }) {
  return (
    <div className="rounded-2xl border-2 border-[#2A4536]/35 bg-[#2A4536]/[0.05] p-5 sm:p-6">
      <p className="font-serif text-xl leading-snug text-[#1E1810]">{block.statement[lang]}</p>
      <ol className="mt-4 space-y-2">
        {block.steps.map((s, i) => (
          <li key={s.es} className="flex items-start gap-3 text-base leading-relaxed text-[#3D3428]">
            <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#2A4536] text-xs font-bold text-[#F3D98A]" aria-hidden>
              {i + 1}
            </span>
            <span>{s[lang]}</span>
          </li>
        ))}
      </ol>
      <p className="mt-5 font-serif text-2xl font-bold text-[#2A4536]">{block.doctrine[lang]}</p>
    </div>
  );
}

export function ProHelpBlockView({ block, lang, copy }: { block: ProHelpBlock; lang: LessonLang; copy: LessonCopy }) {
  const list = (items: { es: string; en: string }[]) => (
    <ul className="mt-1 list-disc space-y-1 pl-5 text-sm leading-relaxed text-[#3D3428] marker:text-[#C9A84A]">
      {items.map((i) => (
        <li key={i.es}>{i[lang]}</li>
      ))}
    </ul>
  );
  return (
    <div className="grid gap-5 rounded-2xl border border-[#7A1E2C]/25 bg-[#FFFDF7] p-5 sm:grid-cols-2 sm:p-6">
      <div>
        <h3 className="font-serif text-lg font-bold text-[#2A4536]">{copy.sections.proHelpCanTeach}</h3>
        <p className="mt-1 text-sm leading-relaxed text-[#3D3428]">{block.canTeach[lang]}</p>
      </div>
      <div>
        <h3 className="font-serif text-lg font-bold text-[#7A1E2C]">{copy.sections.proHelpMustVerify}</h3>
        <p className="mt-1 text-sm leading-relaxed text-[#3D3428]">{block.mustVerify[lang]}</p>
      </div>
      <div>
        <h3 className="font-serif text-lg font-bold text-[#2A4536]">{copy.sections.proHelpPrepare}</h3>
        {list(block.prepare)}
      </div>
      <div>
        <h3 className="font-serif text-lg font-bold text-[#2A4536]">{copy.sections.proHelpQuestions}</h3>
        {list(block.questionsToBring)}
      </div>
    </div>
  );
}

export function RecapBlockView({ block, lang }: { block: RecapBlock; lang: LessonLang }) {
  return (
    <ol className="grid gap-4 sm:grid-cols-3">
      {block.points.map((p, i) => (
        <li key={p.es} className="border-t-2 border-[#C9A84A] pt-3">
          <span className="font-serif text-3xl font-bold leading-none text-[#C9A84A]" aria-hidden>
            {i + 1}
          </span>
          <p className="mt-2 text-base leading-relaxed text-[#1E1810]">{p[lang]}</p>
        </li>
      ))}
    </ol>
  );
}

/* STEPS — numbered practical steps (legacy lessons store five of these). */
export function StepsBlockView({ block, lang }: { block: StepsBlock; lang: LessonLang }) {
  return (
    <ol className="relative space-y-4">
      {block.items.map((item, i) => {
        const text = item[lang];
        if (!text) return null;
        return (
          <li key={i} className="flex items-start gap-4">
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-[#C9A84A]/70 bg-[#2A4536] font-serif text-lg font-bold text-[#F3D98A]" aria-hidden>
              {i + 1}
            </span>
            <p className="min-w-0 break-words pt-1.5 text-[1.0625rem] leading-relaxed text-[#3D3428]">{text}</p>
          </li>
        );
      })}
    </ol>
  );
}

export function NoteBlockView({ block, lang }: { block: NoteBlock; lang: LessonLang }) {
  return <p className="break-words rounded-2xl border border-[#C9A84A]/55 bg-[#C9A84A]/[0.12] p-5 font-serif text-lg leading-relaxed text-[#1E1810] first-letter:uppercase">{block.body[lang]}</p>;
}
