/**
 * Gate G2 — the canonical Leonix lesson renderer. One semantic document, server-rendered:
 * header → lesson-mode bar (anchors, not tabs — no content is ever removed from the HTML) →
 * the package's blocks in authored order → LISTEN → close (completion, SAVE) → NEXT.
 *
 * It renders ANY LessonPackage: an authored flagship package, or the reduced package the legacy
 * adapter derives from a stored plain body. A mode chip only appears when that mode really exists
 * for this lesson (no recording → no Listen chip and no player).
 */
import Link from "next/link";
import type { ReactNode } from "react";
import { FiArrowLeft, FiArrowRight, FiBookOpen, FiChevronRight, FiClock, FiEdit3, FiHeadphones, FiMessageCircle } from "react-icons/fi";
import type { SupportedLang } from "@/app/lib/language";
import { withLang } from "@/app/lib/language";
import type { LearningResource } from "@/app/lib/business/learning/types";
import { getLessonPrompt } from "@/app/lib/business/learning/lessonPackage/prompts";
import type { LessonBlock, LessonJourneyKey, LessonLang, LessonPackage } from "@/app/lib/business/learning/lessonPackage/types";
import { hasPlayableAudio } from "@/app/lib/business/learning/lessonPackage/validate";
import type { LearningLandingCopy } from "../../learningCopy";
import {
  LEARNING_ANCHORS,
  LEARNING_LESSON_CHECKPOINT,
  LEARNING_ROUTES,
  buildJourneyHref,
  checkpointAnchor,
  landingHref,
  lessonHref,
  LEARNING_CHECKPOINT_KEYS,
} from "../../learningJourneys";
import type { LearningPathwayCopy } from "../../learningPathwayCopy";
import type { LessonCopy } from "../../lessonCopy";
import { LEARNING_BTN_PRIMARY, LEARNING_EYEBROW, LEARNING_EYEBROW_BURGUNDY, LEARNING_FOCUS_RING, LEARNING_LINK } from "../learningUi";
import { LessonProgressButton } from "../LessonProgressButton";
import { LessonActivityCustomerStatement, type ActivityBridgeView } from "./LessonActivityCustomerStatement";
import { LessonActivityGuided } from "./LessonActivityGuided";
import { LessonAudioPlayer } from "./LessonAudioPlayer";
import {
  CompareBlockView,
  ExampleBlockView,
  ExplainBlockView,
  GlossaryBlockView,
  HookBlockView,
  LESSON_COLUMN,
  LESSON_SCROLL_MT,
  LessonSection,
  MistakesBlockView,
  NoteBlockView,
  OutcomesBlockView,
  ProHelpBlockView,
  RecapBlockView,
  ResourceBlockView,
  StepsBlockView,
  VerifyBlockView,
  VisualModelBlockView,
  glossaryBlockHasTerms,
  resourceBlockHasItems,
} from "./LessonBlocks";
import { LessonChecklist } from "./LessonChecklist";
import { LessonLocalCompletion } from "./LessonLocalCompletion";
import { LessonPrintSheet } from "./LessonPrintSheet";
import { LessonPromptBlock } from "./LessonPromptBlock";

export const LESSON_MODE_ANCHORS = { read: "leer", listen: "escuchar", do: "hacer", askAi: "preguntar-ia" } as const;

export type LessonNextView = { lessonKey: string; title: string; summary: string; minutes: number } | null;

function visibleBlocks(pkg: LessonPackage, journey: LessonJourneyKey | null): LessonBlock[] {
  return pkg.blocks.filter((b) => !b.journeys || (journey !== null && b.journeys.includes(journey)));
}

export function LessonRenderer({
  pkg,
  lang,
  routeLang,
  journey,
  resources,
  next,
  audioPreview,
  copy,
  landing,
  pathway,
  chrome,
}: {
  pkg: LessonPackage;
  lang: LessonLang;
  routeLang: SupportedLang;
  journey: LessonJourneyKey | null;
  /** Every published resource (glossary + checklists/templates); blocks pick theirs by key. */
  resources: readonly LearningResource[];
  next: LessonNextView;
  /** `?audio=preview`: show the authored script, clearly labelled, while no recording exists. */
  audioPreview: boolean;
  copy: LessonCopy;
  landing: LearningLandingCopy;
  pathway: LearningPathwayCopy;
  chrome: { checklistLabel: string; templateLabel: string; minutesLabel: string };
}) {
  const blocks = visibleBlocks(pkg, journey);
  const title = pkg.meta.title[lang];

  const activity = blocks.find((b): b is Extract<LessonBlock, { type: "activity" }> => b.type === "activity") ?? null;
  const checklist = blocks.find((b): b is Extract<LessonBlock, { type: "checklist" }> => b.type === "checklist") ?? null;
  const promptBlock = blocks.find((b): b is Extract<LessonBlock, { type: "ai_prompt" }> => b.type === "ai_prompt") ?? null;
  /** Primary first; unknown keys are dropped (the validator reports them). */
  const prompts = promptBlock ? [promptBlock.promptKey, ...(promptBlock.moreTemplateKeys ?? [])].flatMap((k) => getLessonPrompt(k) ?? []) : [];
  const prompt = prompts[0] ?? null;

  const playable = hasPlayableAudio(pkg, lang);
  const showListen = Boolean(pkg.audio) && (playable || audioPreview);

  // Which block carries each mode anchor (first match in authored order).
  const readBlockId = blocks.find((b) => b.type === "outcomes" || b.type === "explain")?.id ?? null;
  // DO points at the learner's own work first: the activity, else the checklist, else practical steps.
  const doBlockId = (blocks.find((b) => b.type === "activity") ?? blocks.find((b) => b.type === "checklist") ?? blocks.find((b) => b.type === "steps"))?.id ?? null;
  const anchorFor = (b: LessonBlock): string => (b.id === readBlockId ? LESSON_MODE_ANCHORS.read : b.id === doBlockId ? LESSON_MODE_ANCHORS.do : b.type === "ai_prompt" ? LESSON_MODE_ANCHORS.askAi : `b-${b.id}`);

  const modes: { key: string; href: string; label: string; icon: ReactNode }[] = [];
  if (readBlockId) modes.push({ key: "read", href: `#${LESSON_MODE_ANCHORS.read}`, label: copy.modes.read, icon: <FiBookOpen className="h-4 w-4" aria-hidden /> });
  if (showListen) modes.push({ key: "listen", href: `#${LESSON_MODE_ANCHORS.listen}`, label: copy.modes.listen, icon: <FiHeadphones className="h-4 w-4" aria-hidden /> });
  if (doBlockId) modes.push({ key: "do", href: `#${LESSON_MODE_ANCHORS.do}`, label: copy.modes.do, icon: <FiEdit3 className="h-4 w-4" aria-hidden /> });
  if (prompt) modes.push({ key: "askAi", href: `#${LESSON_MODE_ANCHORS.askAi}`, label: copy.modes.askAi, icon: <FiMessageCircle className="h-4 w-4" aria-hidden /> });

  const checkpointKey = LEARNING_LESSON_CHECKPOINT[pkg.lessonKey] ?? null;
  const pathwayHref = journey ? buildJourneyHref(journey, routeLang) : null;
  const checkpointText = checkpointKey
    ? `${copy.header.checkpointLabel} ${String(LEARNING_CHECKPOINT_KEYS.indexOf(checkpointKey) + 1).padStart(2, "0")} · ${pathway.spine.checkpoints[checkpointKey].title}`
    : "";

  const metaItems: string[] = [`${pkg.meta.readMinutes} ${copy.header.minutes} ${copy.header.read}`];
  if (showListen && pkg.audio) metaItems.push(`${pkg.audio.estimatedMinutes} ${copy.header.minutes} ${copy.header.listen}`);
  if (activity) metaItems.push(`${activity.estimatedMinutes} ${copy.header.minutes} ${copy.header.activity}`);

  const listenSection = showListen && pkg.audio ? (
    <LessonSection id={LESSON_MODE_ANCHORS.listen} eyebrow={copy.modes.listen} title={copy.audio.title} band>
      <p className="text-base leading-relaxed text-[#3D3428]">{copy.audio.intro}</p>
      {playable && pkg.audio.assets?.[lang] ? (
        <div className="mt-4">
          <LessonAudioPlayer
            src={pkg.audio.assets[lang]!.src}
            mime={pkg.audio.assets[lang]!.mime}
            title={title}
            artist={copy.print.sheetEyebrow}
            chapters={(pkg.audio.assets[lang]!.chapterStarts ?? []).flatMap((c) => {
              const seg = pkg.audio!.segments.find((s) => s.id === c.segmentId);
              return seg ? [{ id: seg.id, title: seg.title[lang], startSeconds: c.startSeconds }] : [];
            })}
            copy={{ speed: copy.audio.speed, chapters: copy.audio.chapters }}
          />
        </div>
      ) : (
        <div className="mt-4 rounded-2xl border border-dashed border-[#7A1E2C]/45 bg-[#7A1E2C]/[0.04] p-4">
          <p className="inline-flex rounded-full bg-[#7A1E2C] px-3 py-0.5 text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[#FFFDF7]">{copy.audio.previewBadge}</p>
          <p className="mt-2 text-sm leading-relaxed text-[#3D3428]">{copy.audio.previewBody}</p>
        </div>
      )}
      <p className="mt-4 text-sm font-semibold leading-relaxed text-[#2A4536]">{copy.audio.drivingNote}</p>
      <details className="mt-4 rounded-2xl border border-[#E8DFD0] bg-[#FFFDF7]" open={!playable}>
        <summary className={`flex min-h-12 cursor-pointer items-center px-4 font-serif text-lg font-bold text-[#2A4536] ${LEARNING_FOCUS_RING}`}>{copy.audio.transcript}</summary>
        <div className="space-y-5 border-t border-[#E8DFD0] px-4 py-4">
          {pkg.audio.segments.map((seg) => (
            <div key={seg.id}>
              <h3 className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[#556B3E]">{seg.title[lang]}</h3>
              <p className="mt-1 break-words text-base leading-relaxed text-[#3D3428]">{seg.text[lang]}</p>
              {seg.pauseSeconds ? (
                <p className="mt-1 text-xs italic text-[#5C5346]">
                  {copy.audio.pause} · {seg.pauseSeconds} s
                </p>
              ) : null}
            </div>
          ))}
        </div>
      </details>
    </LessonSection>
  ) : null;

  // LISTEN sits right after the hook/outcomes so an audio learner can start before the reading.
  const listenAfterId = blocks.find((b) => b.type === "outcomes")?.id ?? blocks[0]?.id ?? null;

  function bridgeView(b: Extract<LessonBlock, { type: "activity" }>): ActivityBridgeView | null {
    const r = b.resultBridge;
    if (!r) return null;
    return {
      title: r.title[lang],
      lead: r.lead[lang],
      points: r.points.map((p) => p[lang]),
      carryForward: r.carryForward[lang],
      cta: r.cta[lang],
      ctaHref: prompt ? `#${LESSON_MODE_ANCHORS.askAi}` : null,
    };
  }

  function renderBlock(b: LessonBlock): ReactNode {
    const id = anchorFor(b);
    switch (b.type) {
      case "hook":
        return <HookBlockView block={b} lang={lang} copy={copy} />;
      case "outcomes":
        return (
          <LessonSection id={id} eyebrow={copy.sections.outcomes}>
            <OutcomesBlockView block={b} lang={lang} />
          </LessonSection>
        );
      case "explain":
        return (
          <LessonSection id={id} eyebrow={copy.sections.explain} title={b.title?.[lang]}>
            <ExplainBlockView block={b} lang={lang} />
          </LessonSection>
        );
      case "visual_model":
        return (
          <LessonSection id={id} eyebrow={copy.sections.model} title={b.title[lang]} band>
            <VisualModelBlockView block={b} lang={lang} />
          </LessonSection>
        );
      case "example":
        return <ExampleBlockView block={b} lang={lang} journey={journey} />;
      case "compare":
        return (
          <LessonSection id={id} eyebrow={copy.sections.compare} title={b.title[lang]}>
            <CompareBlockView block={b} lang={lang} copy={copy} />
          </LessonSection>
        );
      case "activity":
        return (
          <section id={id} aria-labelledby={`${id}-titulo`} className={`${LESSON_SCROLL_MT} border-y-2 border-[#7A1E2C]/25 bg-[#F3EBDC]/60 py-10 sm:py-12`}>
            <div className={LESSON_COLUMN}>
              <p className={LEARNING_EYEBROW_BURGUNDY}>{copy.sections.activity}</p>
              <h2 id={`${id}-titulo`} className="mt-1.5 font-serif text-[1.6rem] font-bold leading-snug text-[#7A1E2C] sm:text-[1.85rem]">
                {b.title[lang]}
              </h2>
              <p className="mt-3 text-base leading-relaxed text-[#3D3428]">{b.intro[lang]}</p>
              <div className="mt-6">
                {b.activityKey === "customer_statement_builder" ? (
                  <LessonActivityCustomerStatement
                    lessonKey={pkg.lessonKey}
                    lang={lang}
                    fields={b.fields.map((f) => ({ key: f.key, label: f.label[lang], placeholder: f.placeholder[lang] }))}
                    bridge={bridgeView(b)}
                    copy={copy.activity}
                  />
                ) : b.result ? (
                  // Every other activity is data: the package declares its questions and its result.
                  <LessonActivityGuided lessonKey={pkg.lessonKey} lang={lang} fields={b.fields} result={b.result} bridge={bridgeView(b)} copy={copy.activity} />
                ) : null}
              </div>
            </div>
          </section>
        );
      case "ai_prompt":
        return prompt ? (
          <LessonSection id={id} eyebrow={copy.sections.askAi} title={(b.title ?? prompt.title)[lang]} band>
            <LessonPromptBlock
              lessonKey={pkg.lessonKey}
              lang={lang}
              journey={journey}
              prompts={prompts}
              intro={b.intro?.[lang] ?? null}
              activityAnchor={activity ? `#${LESSON_MODE_ANCHORS.do}` : null}
              copy={copy.prompt}
            />
          </LessonSection>
        ) : null;
      case "mistakes":
        return (
          <LessonSection id={id} eyebrow={copy.sections.mistakes}>
            <MistakesBlockView block={b} lang={lang} copy={copy} />
          </LessonSection>
        );
      case "glossary":
        return glossaryBlockHasTerms(b, resources) ? (
          <LessonSection id={id} eyebrow={copy.sections.glossary} title={copy.sections.glossaryTitle}>
            <GlossaryBlockView block={b} lang={lang} resources={resources} glossaryHref={withLang(LEARNING_ROUTES.glossary, routeLang)} copy={copy} />
          </LessonSection>
        ) : null;
      case "checklist":
        return (
          <LessonSection id={id} eyebrow={copy.sections.checklist} title={b.title[lang]}>
            <LessonChecklist lessonKey={pkg.lessonKey} items={b.items.map((i) => ({ key: i.key, text: i.text[lang] }))} />
          </LessonSection>
        );
      case "resource":
        return resourceBlockHasItems(b, resources) ? (
          <LessonSection id={id} eyebrow={copy.sections.resources} title={copy.sections.resourcesTitle}>
            <ResourceBlockView block={b} lang={lang} resources={resources} labels={{ checklist: chrome.checklistLabel, template: chrome.templateLabel }} />
          </LessonSection>
        ) : null;
      case "verify":
        return (
          <LessonSection id={id} eyebrow={copy.sections.verify} title={b.title[lang]}>
            <VerifyBlockView block={b} lang={lang} />
          </LessonSection>
        );
      case "pro_help":
        return (
          <LessonSection id={id} eyebrow={copy.sections.proHelp} title={copy.sections.proHelpTitle}>
            <ProHelpBlockView block={b} lang={lang} copy={copy} />
          </LessonSection>
        );
      case "recap":
        return (
          <LessonSection id={id} eyebrow={copy.sections.recap} title={copy.sections.recapTitle} band>
            <RecapBlockView block={b} lang={lang} />
          </LessonSection>
        );
      case "steps":
        return (
          <LessonSection id={id} eyebrow={copy.sections.steps} title={b.title?.[lang]} band>
            <StepsBlockView block={b} lang={lang} />
          </LessonSection>
        );
      case "note":
        return (
          <LessonSection id={id} eyebrow={copy.sections.note}>
            <NoteBlockView block={b} lang={lang} />
          </LessonSection>
        );
      default:
        return null;
    }
  }

  return (
    <main className="relative w-full overflow-x-clip bg-[#FAF6EE] text-[#1F241C]" data-lesson-source={pkg.source}>
      {/* HEADER — top padding clears the fixed site header, same as the landing and pathway heroes. */}
      <header className={`${LESSON_COLUMN} pb-7 pt-20 sm:pt-24`}>
        <nav aria-label={copy.header.breadcrumbAria}>
          {/*
            Phones: ONE back target (the learner's journey, or the Learning Center when there is no
            journey) plus a compact non-link checkpoint label. From sm: the full linked breadcrumb.
          */}
          <ol className="flex flex-col items-start gap-0 text-sm text-[#5C5346] sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-1">
            <li className={journey && pathwayHref ? "hidden sm:block" : undefined}>
              <Link href={landingHref(routeLang)} className={LEARNING_LINK}>
                <FiArrowLeft className="h-4 w-4" aria-hidden />
                {copy.header.home}
              </Link>
            </li>
            {journey && pathwayHref ? (
              <li className="flex items-center gap-1">
                <FiChevronRight className="hidden h-3.5 w-3.5 shrink-0 sm:block" aria-hidden />
                <Link href={pathwayHref} className={LEARNING_LINK}>
                  <FiArrowLeft className="h-4 w-4 sm:hidden" aria-hidden />
                  {landing.journeys.items[journey].title}
                </Link>
              </li>
            ) : null}
            {journey && pathwayHref && checkpointKey ? (
              <li className="flex items-center gap-1">
                <FiChevronRight className="hidden h-3.5 w-3.5 shrink-0 sm:block" aria-hidden />
                <span className="px-1 text-sm font-semibold text-[#5C5346] sm:hidden" data-checkpoint-label>
                  {checkpointText}
                </span>
                {/* The wrapper owns visibility: LEARNING_LINK carries its own display utility, which would override `hidden`. */}
                <span className="hidden sm:inline-flex">
                  <Link href={`${pathwayHref}#${checkpointAnchor(checkpointKey)}`} className={LEARNING_LINK}>
                    {checkpointText}
                  </Link>
                </span>
              </li>
            ) : null}
          </ol>
        </nav>

        <p className={`mt-3 ${LEARNING_EYEBROW_BURGUNDY}`}>{copy.header.lessonLabel}</p>
        <h1 className="mt-2 break-words font-serif text-[2.25rem] font-bold leading-[1.1] tracking-tight text-[#2A4536] sm:text-5xl">{title}</h1>
        <p className="mt-3 max-w-2xl break-words text-lg leading-relaxed text-[#3D3428]">{pkg.meta.outcome[lang]}</p>
        <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-[#5C5346]">
          <FiClock className="h-3.5 w-3.5 shrink-0" aria-hidden />
          {metaItems.map((m, i) => (
            <span key={m} className="flex items-center gap-2">
              {i > 0 ? <span aria-hidden>·</span> : null}
              {m}
            </span>
          ))}
        </p>
      </header>

      {/* LESSON MODES — anchors inside one document. Sticks just below the fixed site header. */}
      {modes.length > 1 ? (
        <nav aria-label={copy.modes.aria} className="sticky top-[3.25rem] z-20 border-y border-[#D6C7AD]/70 bg-[#FAF6EE]/95 backdrop-blur-sm sm:top-[3.75rem]" data-lesson-modes>
          <ul className={`${LESSON_COLUMN} flex items-stretch gap-1`}>
            {modes.map((m) => (
              <li key={m.key} className="min-w-0 flex-1 sm:flex-none">
                <a
                  href={m.href}
                  className={`flex min-h-11 items-center justify-center gap-1.5 rounded-lg px-1 text-[0.8125rem] font-bold text-[#2A4536] hover:bg-[#2A4536]/[0.07] sm:px-4 sm:text-sm ${LEARNING_FOCUS_RING}`}
                >
                  <span className="hidden sm:inline-flex">{m.icon}</span>
                  <span className="text-center leading-tight">{m.label}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}

      {blocks.map((b) => (
        <div key={b.id} className="contents">
          {renderBlock(b)}
          {b.id === listenAfterId ? listenSection : null}
        </div>
      ))}

      {/* CLOSE — completion pattern (device-local) + SAVE + existing account progress (semantics unchanged until G5). */}
      <section id="cierre" aria-labelledby="cierre-titulo" className={`${LESSON_SCROLL_MT} py-9 sm:py-11`}>
        <div className={LESSON_COLUMN}>
          <p className={LEARNING_EYEBROW}>{copy.completion.eyebrow}</p>
          <h2 id="cierre-titulo" className="mt-1.5 font-serif text-[1.6rem] font-bold leading-snug text-[#2A4536] sm:text-[1.85rem]">
            {copy.completion.title}
          </h2>
          <div className="mt-5 space-y-5">
            {activity || checklist ? (
              <LessonLocalCompletion
                lessonKey={pkg.lessonKey}
                activityFieldKeys={activity ? activity.fields.map((f) => f.key) : []}
                checklistKeys={checklist ? checklist.items.map((i) => i.key) : []}
                copy={copy.completion}
              />
            ) : null}
            {activity ? (
              <LessonPrintSheet
                lessonKey={pkg.lessonKey}
                lang={lang}
                journey={journey}
                lessonTitle={title}
                guided={activity.result ? { fields: activity.fields, result: activity.result } : null}
                checklist={checklist ? checklist.items.map((i) => ({ key: i.key, text: i.text[lang] })) : []}
                prompt={prompt}
                copy={copy.print}
              />
            ) : null}
            {/*
              The account "mark completed" control grants a capability record in one click. Until the
              truthful progress model lands (G5) it is NOT offered on structured packages, whose close
              is the device-local completion above. Legacy lessons keep their existing behaviour; the
              component, API and schema are untouched.
            */}
            {pkg.source === "legacy" ? (
              <div data-legacy-account-progress>
                <h3 className="font-serif text-lg font-bold text-[#2A4536]">{copy.completion.accountTitle}</h3>
                <div className="mt-2">
                  <LessonProgressButton lessonKey={pkg.lessonKey} lang={lang} />
                </div>
              </div>
            ) : null}
            {pkg.source === "legacy" ? <p className="text-xs leading-relaxed text-[#5C5346]">{copy.completion.essentialFormat}</p> : null}
          </div>
        </div>
      </section>

      {/* NEXT — journey-aware; only ever a published lesson. */}
      <section aria-labelledby="siguiente-titulo" className="border-t border-[#D6C7AD]/70 pb-14 pt-9 sm:pt-11">
        <div className={LESSON_COLUMN}>
          <p className={LEARNING_EYEBROW}>{copy.next.eyebrow}</p>
          <h2 id="siguiente-titulo" className="sr-only">
            {copy.next.title}
          </h2>
          {next ? (
            <div className="mt-3 rounded-2xl border-2 border-[#C9A84A]/60 bg-[#FFFDF7] p-5 shadow-[0_14px_36px_-24px_rgba(31,36,28,0.35)] sm:p-6">
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[#556B3E]">{copy.next.title}</p>
              <p className="mt-1 break-words font-serif text-2xl font-bold leading-snug text-[#2A4536]">{next.title}</p>
              <p className="mt-1.5 break-words text-sm leading-relaxed text-[#3D3428]">{next.summary}</p>
              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
                <Link href={lessonHref(next.lessonKey, routeLang, journey ?? undefined)} className={LEARNING_BTN_PRIMARY}>
                  {copy.next.cta}
                  <FiArrowRight className="h-4 w-4" aria-hidden />
                </Link>
                <span className="inline-flex items-center gap-1 text-sm text-[#5C5346]">
                  <FiClock className="h-3.5 w-3.5" aria-hidden />
                  {next.minutes} {chrome.minutesLabel}
                </span>
              </div>
            </div>
          ) : (
            <p className="mt-3 text-base leading-relaxed text-[#3D3428]">{copy.next.noNext}</p>
          )}
          <Link href={pathwayHref ?? landingHref(routeLang, LEARNING_ANCHORS.journeys)} className={`mt-4 ${LEARNING_LINK}`}>
            <FiArrowLeft className="h-4 w-4" aria-hidden />
            {pathwayHref ? copy.next.backToPath : copy.next.choosePath}
          </Link>
        </div>
      </section>
    </main>
  );
}
