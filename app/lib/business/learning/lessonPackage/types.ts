/**
 * Gate G2 — LessonPackage: the canonical, structured, bilingual knowledge package behind one
 * Learning Center lesson (Master Construction Bible §9–§10, §16). One package feeds every mode:
 * READ (blocks), LISTEN (audio script), DO (activity/checklist), ASK AI (prompt), VERIFY, SAVE, NEXT.
 *
 * Rules that keep this shape portable to a future jsonb column without touching the UI:
 *  - plain JSON only: no JSX, no functions, no HTML, no SVG;
 *  - every human-readable leaf is `L` (Spanish + English);
 *  - visuals and activities are referenced by code-owned keys (`visualKey`, `activityKey`) that the
 *    renderer maps to React components;
 *  - AI prompts are referenced by `promptKey` + version from the prompt registry.
 *
 * The database row stays the publish-state truth and the stable lesson identity (`lesson_key`,
 * `capability_key`); a package never publishes a lesson by itself.
 */

export type L = { es: string; en: string };

export type LessonLang = "es" | "en";

export type LessonJourneyKey = "idea" | "empezando" | "negocio";

export const LESSON_PACKAGE_SCHEMA_VERSION = 1 as const;

/** Truth model (Bible §20). Anything other than "evergreen" must carry verify + pro_help blocks. */
export type LessonTruthClass = "evergreen" | "jurisdiction_sensitive" | "current";

export type ProHelpType =
  | "cpa_tax"
  | "attorney"
  | "insurance"
  | "licensing_office"
  | "health_department"
  | "labor_agency"
  | "financial"
  | "contractor_board"
  | "hr";

/** Code-owned visual components the renderer knows how to draw. */
export type LessonVisualKey = "customer_focus_orbit" | "focus_progression" | "product_vs_problem" | "pitch_vs_ask" | "alternatives_fork";

/** Code-owned interactive activities the renderer knows how to mount. */
export type LessonActivityKey = "customer_statement_builder" | "problem_statement_builder" | "conversation_plan_builder" | "alternatives_grid";

type BlockBase = {
  /** Stable within the package; used for anchors and keys. */
  id: string;
  /** When present, the block only renders inside these journeys (absent = every journey and neutral). */
  journeys?: LessonJourneyKey[];
};

export type HookBlock = BlockBase & {
  type: "hook";
  visualKey: LessonVisualKey;
  headline: L;
  support: L;
  /** Labels drawn inside the visual — content, so they live in the package, not in the component. */
  visualLabels: Record<string, L>;
  /** Full text alternative for the visual (the SVG itself is aria-hidden). */
  textAlternative: L;
};

export type OutcomesBlock = BlockBase & { type: "outcomes"; intro: L; items: L[] };

export type ExplainBlock = BlockBase & {
  type: "explain";
  title?: L;
  chunks: { heading?: L; body: L }[];
  pullQuote?: L;
};

export type VisualModelBlock = BlockBase & {
  type: "visual_model";
  visualKey: LessonVisualKey;
  title: L;
  steps: { label: L; note: L }[];
  caption: L;
  textAlternative: L;
};

export type ExampleBlock = BlockBase & {
  type: "example";
  /** e.g. "Ejemplo ilustrativo" — examples are hypothetical and always say so. */
  label: L;
  business: L;
  /** First variant whose `journey` matches wins; a variant without `journey` is the neutral default. */
  variants: { journey?: LessonJourneyKey; story: L }[];
  takeaway: L;
};

export type CompareBlock = BlockBase & {
  type: "compare";
  title: L;
  weak: { label: L; text: L; why: L };
  strong: { label: L; text: L; annotations: { tag: L; fragment: L; note: L }[] };
};

export type ActivityField = {
  key: string;
  label: L;
  placeholder: L;
  /** Longer answers (a list of questions, notes) get a textarea. */
  multiline?: boolean;
  /** Short name shown inside a blank of the result sentence, e.g. "[quién]". Defaults to the label. */
  blankLabel?: L;
};

/**
 * What a guided activity PRODUCES, as data (Gate G4): an optional one-sentence result assembled from
 * `[[fieldKey]]` markers and/or a sheet of labelled sections. Built only from the learner's own
 * words — a missing answer stays a visible blank. The `customer_statement_builder` flagship keeps
 * its own dedicated builder; every other activity declares its result here.
 */
export type ActivityResult = {
  /** e.g. "Tu frase del problema" / "Tu plan de conversaciones". */
  label: L;
  hint: L;
  sentence?: L;
  sections?: { label: L; fieldKeys: string[] }[];
  copyLabel: L;
  copiedLabel: L;
  /** Heading used on the printed sheet. */
  printLabel: L;
};

/**
 * "What do I do with this?" (Bible §44A-A): never collect an answer without showing what it is
 * useful for. Shown right after the learner's result; `cta` leads into the AI development lab.
 */
export type ActivityResultBridge = {
  title: L;
  /** What this result IS (a first working draft / hypothesis — never finished advertising copy). */
  lead: L;
  /** What it helps with, and what still has to be tested. */
  points: L[];
  /** How it carries forward into the AI templates. */
  carryForward: L;
  cta: L;
};

export type ActivityBlock = BlockBase & {
  type: "activity";
  activityKey: LessonActivityKey;
  title: L;
  intro: L;
  estimatedMinutes: number;
  fields: ActivityField[];
  result?: ActivityResult;
  resultBridge?: ActivityResultBridge;
};

/**
 * ASK AI. `promptKey` is the primary template (open by default, printed on "Mi hoja");
 * `moreTemplateKeys` are further full conversation starters in the same lab (Bible §44A-D).
 * A block with only `promptKey` is the original single-prompt form and stays valid.
 */
export type AiPromptBlock = BlockBase & { type: "ai_prompt"; promptKey: string; moreTemplateKeys?: string[]; title?: L; intro?: L };

export type MistakesBlock = BlockBase & { type: "mistakes"; items: { mistake: L; instead: L }[] };

/** References existing `business_learning_resources.resource_key` glossary rows. Missing rows are skipped, never invented. */
export type GlossaryBlock = BlockBase & { type: "glossary"; resourceKeys: string[] };

export type ChecklistBlock = BlockBase & { type: "checklist"; title: L; items: { key: string; text: L }[] };

/** References existing checklist/template resource rows by key. */
export type ResourceBlock = BlockBase & { type: "resource"; resourceKeys: string[] };

export type VerifyBlock = BlockBase & { type: "verify"; title: L; statement: L; steps: L[]; doctrine: L };

export type ProHelpBlock = BlockBase & {
  type: "pro_help";
  types: ProHelpType[];
  canTeach: L;
  mustVerify: L;
  prepare: L[];
  questionsToBring: L[];
};

export type RecapBlock = BlockBase & { type: "recap"; points: L[] };

/** Ordered practical steps (used by the legacy adapter; also valid in full packages). */
export type StepsBlock = BlockBase & { type: "steps"; title?: L; items: L[] };

/** A short boxed note (used by the legacy adapter for the stored "important note"). */
export type NoteBlock = BlockBase & { type: "note"; body: L };

export type LessonBlock =
  | HookBlock
  | OutcomesBlock
  | ExplainBlock
  | VisualModelBlock
  | ExampleBlock
  | CompareBlock
  | ActivityBlock
  | AiPromptBlock
  | MistakesBlock
  | GlossaryBlock
  | ChecklistBlock
  | ResourceBlock
  | VerifyBlock
  | ProHelpBlock
  | RecapBlock
  | StepsBlock
  | NoteBlock;

export type LessonBlockType = LessonBlock["type"];

/* ---------------------------------------------------------------------------------------------- */
/* LISTEN — a separate conversational teaching script, never a reading of the page (Bible §17).    */
/* ---------------------------------------------------------------------------------------------- */

export type AudioSegmentKind = "hook" | "learn" | "story" | "concept" | "reflect" | "action" | "parked" | "recap" | "next";

export type AudioScriptSegment = {
  id: string;
  kind: AudioSegmentKind;
  /** Chapter title shown in the transcript / player. */
  title: L;
  /** What the teacher says. Written for the ear; must stay useful without the screen. */
  text: L;
  /** Deliberate silence after the segment (reflection), in seconds. */
  pauseSeconds?: number;
};

export type AudioAsset = {
  src: string;
  mime: string;
  durationSeconds: number;
  /** Must equal `LessonAudio.scriptVersion`; a stale recording is never played against a newer script. */
  scriptVersion: number;
  sourceKind: "human" | "synthetic";
  /** Provider-agnostic: free text, informational only. */
  provider?: string;
  /** Optional chapter offsets once a recording exists. */
  chapterStarts?: { segmentId: string; startSeconds: number }[];
};

export type LessonAudio = {
  scriptVersion: number;
  estimatedMinutes: number;
  segments: AudioScriptSegment[];
  /** Per language. Absent = no recording yet → the player is not rendered. */
  assets?: Partial<Record<LessonLang, AudioAsset>>;
};

/* ---------------------------------------------------------------------------------------------- */

export type LessonPackage = {
  schemaVersion: typeof LESSON_PACKAGE_SCHEMA_VERSION;
  lessonKey: string;
  /**
   * "package" = authored canonical lesson (full validator rules).
   * "legacy"  = derived at render time from the stored plain body by the legacy adapter (reduced,
   *             honest structure; never claims to be a full package).
   */
  source: "package" | "legacy";
  meta: {
    title: L;
    /** One-line outcome under the title. */
    outcome: L;
    readMinutes: number;
    truthClass: LessonTruthClass;
    /** True when acting on the lesson can have legal/tax/financial/safety consequences. */
    consequential: boolean;
  };
  blocks: LessonBlock[];
  audio?: LessonAudio;
  /**
   * NEXT — preferred next lesson_keys per journey (and for no journey), tried in order before the
   * journey's own sequence. A key that is not published is skipped, never linked.
   */
  next?: { preferred?: Partial<Record<LessonJourneyKey | "neutral", string[]>> };
};

/* ---------------------------------------------------------------------------------------------- */
/* ASK AI — versioned, assistant-neutral prompt (Bible §14).                                       */
/* ---------------------------------------------------------------------------------------------- */

export type LessonPromptField = {
  /** Token name; appears in the body as `[[token]]`. */
  token: string;
  label: L;
  /** Shown in brackets while the learner has not filled it. */
  placeholder: L;
  /** Optional link to an activity answer (`activityFieldKey`) or to the journey stage. */
  prefillFrom?: { kind: "activity_field"; fieldKey: string } | { kind: "journey_stage" };
};

export type LessonPrompt = {
  promptKey: string;
  version: number;
  title: L;
  /** "Para qué sirve" — one line on what this conversation helps with. */
  purpose?: L;
  /** Prompt text with `[[token]]` markers. This is the neutral body (no journey context). */
  body: L;
  /**
   * Stage-aware bodies (Bible §44A-C): same topic, different stage, different AI conversation.
   * A journey without a variant — and a lesson opened with no/unknown journey — uses `body`.
   */
  variants?: Partial<Record<LessonJourneyKey, { body: L }>>;
  fields: LessonPromptField[];
  whyItWorks: L[];
  customize: L[];
  followUps: L[];
  privacy: { intro: L; never: L[] };
  verify: L;
  /** Consequential prompts must carry a non-empty `verify` line (validator-enforced). */
  consequential: boolean;
  /** Stage wording used when `prefillFrom.kind === "journey_stage"`. */
  journeyStageLabels?: Record<LessonJourneyKey, L>;
};
