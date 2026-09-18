/**
 * Gate G2 — pure LessonPackage validator (no I/O, no server-only guard, directly testable from
 * scripts/verify-business-learning-center-01.ts). This is the future publishing quality gate for
 * structured lessons. It does NOT replace the database 1,200-character body rule yet — no schema
 * or publish-flow change happens in G2.
 */
import {
  LESSON_PACKAGE_SCHEMA_VERSION,
  type LessonBlock,
  type LessonBlockType,
  type LessonPackage,
  type LessonPrompt,
} from "./types";

export type LessonValidationResult = { ok: boolean; errors: string[]; warnings: string[] };

const KEY_PATTERN = /^[a-z][a-z0-9_]*$/;
const TOKEN_PATTERN = /\[\[([a-z_]+)\]\]/g;

/** Block vocabulary a full ("package") lesson must contain. Activity OR checklist satisfies DO. */
export const REQUIRED_PACKAGE_BLOCKS: readonly LessonBlockType[] = ["hook", "outcomes", "explain", "example", "recap"];

function isBilingualLeaf(v: unknown): v is { es: unknown; en: unknown } {
  if (!v || typeof v !== "object" || Array.isArray(v)) return false;
  const keys = Object.keys(v as object);
  return keys.length === 2 && keys.includes("es") && keys.includes("en");
}

function looksLikeHalfLeaf(v: unknown): boolean {
  if (!v || typeof v !== "object" || Array.isArray(v)) return false;
  const keys = Object.keys(v as object);
  return keys.length === 1 && (keys[0] === "es" || keys[0] === "en");
}

/** Walks any JSON value and reports every bilingual leaf that is not a non-empty ES + EN string pair. */
export function collectParityProblems(value: unknown, path = ""): string[] {
  if (isBilingualLeaf(value)) {
    const out: string[] = [];
    for (const lang of ["es", "en"] as const) {
      const text = value[lang];
      if (typeof text !== "string" || text.trim().length === 0) out.push(`${path}.${lang} is empty`);
    }
    return out;
  }
  if (looksLikeHalfLeaf(value)) return [`${path} has only one language`];
  if (Array.isArray(value)) return value.flatMap((x, i) => collectParityProblems(x, `${path}[${i}]`));
  if (value && typeof value === "object") {
    return Object.entries(value as Record<string, unknown>).flatMap(([k, x]) => collectParityProblems(x, path ? `${path}.${k}` : k));
  }
  return [];
}

export function extractPromptTokens(text: string): string[] {
  return [...text.matchAll(TOKEN_PATTERN)].map((m) => m[1]);
}

/** AI prompt integrity: tokens ↔ fields, assistant-neutral guidance present, verify line when consequential. */
export function validateLessonPrompt(prompt: LessonPrompt): LessonValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!KEY_PATTERN.test(prompt.promptKey)) errors.push(`prompt key "${prompt.promptKey}" is not a stable snake_case key`);
  if (!Number.isInteger(prompt.version) || prompt.version < 1) errors.push(`${prompt.promptKey}: version must be a positive integer`);
  errors.push(...collectParityProblems(prompt, `prompt(${prompt.promptKey})`));

  const fieldTokens = prompt.fields.map((f) => f.token);
  if (new Set(fieldTokens).size !== fieldTokens.length) errors.push(`${prompt.promptKey}: duplicate field token`);
  // Every body — the neutral one and each stage-aware variant — must use every learner-context
  // token (so no journey silently drops part of the learner's work) and only declared tokens.
  // The stage token is optional inside a variant, whose wording already carries the stage.
  const requiredTokens = prompt.fields.filter((f) => f.prefillFrom?.kind !== "journey_stage").map((f) => f.token);
  const bodies: [string, { es: string; en: string }][] = [["body", prompt.body], ...Object.entries(prompt.variants ?? {}).map(([j, v]) => [`variants.${j}.body`, v.body] as [string, { es: string; en: string }])];
  for (const [name, body] of bodies) {
    for (const lang of ["es", "en"] as const) {
      const used = new Set(extractPromptTokens(body?.[lang] ?? ""));
      const must = name === "body" ? fieldTokens : requiredTokens;
      for (const t of must) if (!used.has(t)) errors.push(`${prompt.promptKey}: ${name}.${lang} never uses [[${t}]]`);
      for (const t of used) if (!fieldTokens.includes(t)) errors.push(`${prompt.promptKey}: ${name}.${lang} uses undeclared token [[${t}]]`);
    }
  }
  if (prompt.whyItWorks.length === 0) errors.push(`${prompt.promptKey}: "why it works" is required`);
  if (prompt.privacy.never.length === 0) errors.push(`${prompt.promptKey}: the privacy reminder must list what never to paste`);
  if (prompt.consequential && !(prompt.verify.es.trim() && prompt.verify.en.trim())) {
    errors.push(`${prompt.promptKey}: a consequential prompt must carry a verification line`);
  }
  if (prompt.fields.some((f) => f.prefillFrom?.kind === "journey_stage") && !prompt.journeyStageLabels) {
    errors.push(`${prompt.promptKey}: a journey_stage field needs journeyStageLabels`);
  }
  return { ok: errors.length === 0, errors, warnings };
}

function has(blocks: readonly LessonBlock[], type: LessonBlockType): boolean {
  return blocks.some((b) => b.type === type);
}

export function validateLessonPackage(pkg: LessonPackage, ctx: { prompts: Readonly<Record<string, LessonPrompt>> }): LessonValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Identity
  if (pkg.schemaVersion !== LESSON_PACKAGE_SCHEMA_VERSION) errors.push(`unsupported schemaVersion ${String(pkg.schemaVersion)}`);
  if (!KEY_PATTERN.test(pkg.lessonKey ?? "")) errors.push(`lessonKey "${pkg.lessonKey}" is not a stable snake_case key`);
  if (pkg.source !== "package" && pkg.source !== "legacy") errors.push("source must be 'package' or 'legacy'");
  if (!(pkg.meta?.readMinutes > 0)) errors.push("meta.readMinutes must be positive");

  // ES/EN parity on every text leaf. A legacy package mirrors stored content, so gaps are warnings there.
  const parity = collectParityProblems({ meta: pkg.meta, blocks: pkg.blocks, audio: pkg.audio });
  (pkg.source === "legacy" ? warnings : errors).push(...parity);

  // Block ids
  const ids = pkg.blocks.map((b) => b.id);
  if (ids.some((id) => !id)) errors.push("every block needs an id");
  if (new Set(ids).size !== ids.length) errors.push("block ids must be unique");

  if (!has(pkg.blocks, "explain")) errors.push("at least one explain block is required");

  if (pkg.source === "package") {
    for (const type of REQUIRED_PACKAGE_BLOCKS) if (!has(pkg.blocks, type)) errors.push(`missing required block: ${type}`);
    if (!has(pkg.blocks, "activity") && !has(pkg.blocks, "checklist")) errors.push("a lesson needs an activity or a checklist (DO)");
    if (pkg.blocks.filter((b) => b.type === "hook").length > 1) errors.push("only one hook block is allowed");
  }

  for (const b of pkg.blocks) {
    switch (b.type) {
      case "outcomes":
        if (b.items.length < 2) errors.push(`${b.id}: outcomes need at least two items`);
        break;
      case "explain":
        if (b.chunks.length === 0) errors.push(`${b.id}: explain needs at least one chunk`);
        break;
      case "example":
        if (!b.variants.some((v) => !v.journey)) errors.push(`${b.id}: example needs a neutral variant (no journey) so the lesson works without journey context`);
        break;
      case "compare":
        if (b.strong.annotations.length === 0) errors.push(`${b.id}: the strong example must be annotated`);
        for (const a of b.strong.annotations) {
          for (const lang of ["es", "en"] as const) {
            if (!b.strong.text[lang].includes(a.fragment[lang])) errors.push(`${b.id}: annotation fragment not found in strong.text.${lang}: "${a.fragment[lang]}"`);
          }
        }
        break;
      case "activity":
        if (pkg.source === "package" && !b.resultBridge) errors.push(`${b.id}: an activity must explain what its result is for (resultBridge) — never collect an answer without showing its use`);
        if (b.resultBridge && b.resultBridge.points.length < 2) errors.push(`${b.id}: resultBridge needs at least two points`);
        if (b.fields.length === 0) errors.push(`${b.id}: activity has no fields`);
        if (new Set(b.fields.map((f) => f.key)).size !== b.fields.length) errors.push(`${b.id}: duplicate activity field key`);
        break;
      case "checklist":
        if (b.items.length === 0) errors.push(`${b.id}: checklist has no items`);
        if (new Set(b.items.map((i) => i.key)).size !== b.items.length) errors.push(`${b.id}: duplicate checklist item key`);
        break;
      case "recap":
        if (pkg.source === "package" && b.points.length < 2) errors.push(`${b.id}: recap needs at least two points`);
        break;
      case "ai_prompt": {
        const keys = [b.promptKey, ...(b.moreTemplateKeys ?? [])];
        if (new Set(keys).size !== keys.length) errors.push(`${b.id}: duplicate template key`);
        const activityFieldKeys = new Set(pkg.blocks.flatMap((x) => (x.type === "activity" ? x.fields.map((f) => f.key) : [])));
        for (const key of keys) {
          const prompt = ctx.prompts[key];
          if (!prompt) {
            errors.push(`${b.id}: unknown promptKey "${key}"`);
            continue;
          }
          errors.push(...validateLessonPrompt(prompt).errors);
          if (pkg.meta.consequential && !prompt.consequential) errors.push(`${b.id}: a consequential lesson needs a consequential (verify-carrying) prompt`);
          for (const f of prompt.fields) {
            if (f.prefillFrom?.kind === "activity_field" && !activityFieldKeys.has(f.prefillFrom.fieldKey)) {
              errors.push(`${b.id}: ${key} prefills [[${f.token}]] from activity field "${f.prefillFrom.fieldKey}", which this lesson does not have`);
            }
          }
        }
        break;
      }
      case "steps":
        if (b.items.length === 0) errors.push(`${b.id}: steps block is empty`);
        break;
      default:
        break;
    }
  }

  // VERIFY / professional-help boundaries (Bible §20–§21)
  if (pkg.meta.consequential && !has(pkg.blocks, "verify")) errors.push("consequential content requires a verify block");
  if (pkg.meta.truthClass !== "evergreen") {
    if (!has(pkg.blocks, "verify")) errors.push(`${pkg.meta.truthClass} content requires a verify block`);
    if (!has(pkg.blocks, "pro_help")) errors.push(`${pkg.meta.truthClass} content requires a pro_help block`);
  }
  if (has(pkg.blocks, "ai_prompt") && !has(pkg.blocks, "verify")) warnings.push("a lesson with an AI prompt should also teach what to verify");

  // LISTEN
  if (pkg.audio) {
    const a = pkg.audio;
    if (!Number.isInteger(a.scriptVersion) || a.scriptVersion < 1) errors.push("audio.scriptVersion must be a positive integer");
    if (a.segments.length < 3) errors.push("audio script needs at least three segments");
    if (new Set(a.segments.map((s) => s.id)).size !== a.segments.length) errors.push("audio segment ids must be unique");
    for (const [lang, asset] of Object.entries(a.assets ?? {})) {
      if (!asset) continue;
      if (asset.scriptVersion !== a.scriptVersion) errors.push(`audio asset (${lang}) was recorded from script v${asset.scriptVersion}, package is v${a.scriptVersion}`);
      if (!asset.src || !(asset.durationSeconds > 0)) errors.push(`audio asset (${lang}) needs src and durationSeconds`);
    }
  }

  return { ok: errors.length === 0, errors, warnings };
}

/** True only when a real, current recording exists for this language. The UI renders a player on nothing else. */
export function hasPlayableAudio(pkg: LessonPackage, lang: "es" | "en"): boolean {
  const asset = pkg.audio?.assets?.[lang];
  return Boolean(asset && asset.src && asset.scriptVersion === pkg.audio?.scriptVersion);
}
