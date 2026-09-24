"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { resolveClasificadosPublishLang } from "@/app/lib/clasificados/clasificadosPublishLang";
import { qt, quickCopy } from "@/app/lib/quickClassifieds/quickClassifiedCopy";
import { getQuickClassifiedDefinition } from "@/app/lib/quickClassifieds/quickClassifiedRegistry";
import { quickClassifiedsChooserPath, quickClassifiedMyAdPath } from "@/app/lib/quickClassifieds/quickClassifiedRoutes";
import type { QuickClassifiedCategoryKey, QuickConfirmations, QuickIntakeValue, QuickIntakeValues, QuickMediaItem } from "@/app/lib/quickClassifieds/quickClassifiedTypes";
import { quickFieldIsVisible, validateQuickMedia, validateQuickStep } from "@/app/lib/quickClassifieds/quickClassifiedValidation";
import { getQuickClassifiedAdapter } from "../_adapters";
import { QuickFieldRenderer } from "./QuickFieldRenderer";
import { QuickMediaStep } from "./QuickMediaStep";
import { QuickReviewStep } from "./QuickReviewStep";
import { QuickShell, quickCard, quickPrimaryBtn, quickSecondaryBtn } from "./QuickShell";
import { emptyQuickIntakeDraft, loadQuickIntakeDraft, saveQuickIntakeDraft, type QuickIntakeDraft } from "./quickIntakeDraftStore";

/**
 * SELECT CATEGORY → ESSENTIAL QUESTIONS → ≥ 1 IMAGE → REVIEW → EXISTING PREVIEW.
 * Everything after "See my ad" is the category's own existing preview / payment / publisher.
 */
export function QuickIntakeClient({ category }: { category: QuickClassifiedCategoryKey }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { routeLang, copyLang: lang } = useMemo(() => resolveClasificadosPublishLang(searchParams?.get("lang")), [searchParams]);
  const src = searchParams?.get("src");
  const definition = getQuickClassifiedDefinition(category);
  const adapter = useMemo(() => getQuickClassifiedAdapter(category), [category]);

  const [draft, setDraft] = useState<QuickIntakeDraft>(() => emptyQuickIntakeDraft());
  const [hydrated, setHydrated] = useState(false);
  const [issues, setIssues] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const draftRef = useRef(draft);
  draftRef.current = draft;

  useEffect(() => {
    let cancelled = false;
    void loadQuickIntakeDraft(category).then((loaded) => {
      if (cancelled) return;
      if (loaded) setDraft(loaded);
      setHydrated(true);
    });
    return () => {
      cancelled = true;
    };
  }, [category]);

  useEffect(() => {
    if (!hydrated) return;
    const t = window.setTimeout(() => void saveQuickIntakeDraft(category, draftRef.current), 250);
    return () => window.clearTimeout(t);
  }, [hydrated, category, draft]);

  const steps = adapter?.steps ?? [];

  // Visible prefills (e.g. state "CA") — applied once after hydration, only where the customer typed nothing.
  useEffect(() => {
    if (!hydrated || !adapter) return;
    const missing: Record<string, string> = {};
    for (const s of adapter.steps) {
      for (const f of s.fields) {
        if (f.defaultValue != null && draftRef.current.values[f.key] === undefined) missing[f.key] = f.defaultValue;
      }
    }
    if (Object.keys(missing).length) setDraft((d) => ({ ...d, values: { ...missing, ...d.values } }));
  }, [hydrated, adapter]);
  const totalSteps = steps.length + 2; // fields… + media + review
  const mediaIndex = steps.length;
  const reviewIndex = steps.length + 1;
  const stepIndex = Math.min(draft.stepIndex, reviewIndex);

  const setValue = useCallback((key: string, value: QuickIntakeValue) => {
    setDraft((d) => ({ ...d, values: { ...d.values, [key]: value } }));
  }, []);
  const setMedia = useCallback((media: QuickMediaItem[]) => setDraft((d) => ({ ...d, media })), []);
  const setConfirmations = useCallback((confirmations: QuickConfirmations) => setDraft((d) => ({ ...d, confirmations })), []);
  const goTo = useCallback((index: number) => {
    setIssues([]);
    setDraft((d) => ({ ...d, stepIndex: index }));
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  function next() {
    if (stepIndex < mediaIndex) {
      const found = validateQuickStep(steps[stepIndex]!, draft.values, lang);
      if (found.length) {
        setIssues(found);
        return;
      }
    } else if (stepIndex === mediaIndex) {
      const found = validateQuickMedia(draft.media, definition.media, lang);
      if (found.length) {
        setIssues(found);
        return;
      }
    }
    goTo(stepIndex + 1);
  }

  async function submit() {
    if (!adapter) return;
    setSubmitting(true);
    setIssues([]);
    try {
      const allIssues: string[] = [];
      for (const s of steps) allIssues.push(...validateQuickStep(s, draft.values, lang));
      allIssues.push(...validateQuickMedia(draft.media, definition.media, lang));
      if (allIssues.length) {
        setIssues(allIssues);
        return;
      }
      const result = await adapter.buildAndWriteCanonicalDraft({
        values: draft.values as QuickIntakeValues,
        media: draft.media,
        confirmations: draft.confirmations,
        ctx: { lang, routeLang },
      });
      if (!result.ok) {
        setIssues(result.issues);
        return;
      }
      router.push(result.handoff.href);
    } catch {
      setIssues([quickCopy("errorGeneric", lang)]);
    } finally {
      setSubmitting(false);
    }
  }

  const chooserHref = quickClassifiedsChooserPath(routeLang, src === "staff" ? "staff" : undefined);

  // Blocked category (Empleos — BLOCKED_BY_EXISTING_MEDIA_OUTPUT): honest card, real existing application, no fake CTA.
  if (!adapter || definition.status === "blocked") {
    return (
      <QuickShell lang={lang} title={`${definition.emoji} ${qt(definition.label, lang)}`} subtitle={qt(definition.tagline, lang)} backHref={chooserHref}>
        <section className={quickCard}>
          <h2 className="text-lg font-extrabold">{quickCopy("blockedTitle", lang)}</h2>
          {definition.blocker ? <p className="mt-2 text-sm text-[#5D4A25]/90">{qt(definition.blocker.reason, lang)}</p> : null}
          <Link href={`${definition.standardApplicationPath}?lang=${routeLang}`} className={`${quickPrimaryBtn} mt-4`}>
            {quickCopy("blockedCta", lang)}
          </Link>
        </section>
      </QuickShell>
    );
  }

  const title = `${definition.emoji} ${qt(definition.label, lang)}`;
  const progress = quickCopy("stepOf", lang, { n: stepIndex + 1, total: totalSteps });

  return (
    <QuickShell lang={lang} title={title} subtitle={progress} backHref={stepIndex === 0 ? chooserHref : undefined}>
      {src === "staff" ? (
        <p className="mb-3 rounded-xl border border-[#C9A84A]/60 bg-[#FFF6E7] px-3 py-2 text-xs text-[#6E4E18]">{quickCopy("fromStaffBanner", lang)}</p>
      ) : null}
      <div className="mb-3 h-2 w-full overflow-hidden rounded-full bg-[#E8DFD0]" aria-hidden="true">
        <div className="h-full rounded-full bg-[#7A1E2C] transition-all" style={{ width: `${Math.round(((stepIndex + 1) / totalSteps) * 100)}%` }} />
      </div>

      {!hydrated ? (
        <div className={quickCard} aria-busy="true">
          <p className="text-sm text-[#7A7164]">…</p>
        </div>
      ) : stepIndex < mediaIndex ? (
        <section className={quickCard}>
          <h2 className="text-lg font-extrabold">{qt(steps[stepIndex]!.title, lang)}</h2>
          {steps[stepIndex]!.intro ? <p className="mt-1 text-sm text-[#5D4A25]/90">{qt(steps[stepIndex]!.intro!, lang)}</p> : null}
          <div className="mt-4 space-y-4">
            {steps[stepIndex]!.fields.filter((f) => quickFieldIsVisible(f, draft.values)).map((f) => (
              <QuickFieldRenderer key={f.key} field={f} values={draft.values} lang={lang} onChange={setValue} />
            ))}
          </div>
        </section>
      ) : stepIndex === mediaIndex ? (
        <QuickMediaStep lang={lang} contract={definition.media} media={draft.media} onChange={setMedia} />
      ) : (
        <QuickReviewStep
          lang={lang}
          definition={definition}
          steps={steps}
          values={draft.values}
          media={draft.media}
          confirmations={draft.confirmations}
          surface={adapter.confirmations}
          submitting={submitting}
          issues={issues}
          onEditStep={goTo}
          onConfirmations={setConfirmations}
          onSubmit={() => void submit()}
        />
      )}

      {hydrated && stepIndex < reviewIndex ? (
        <div className="mt-4 space-y-3">
          {issues.length ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">
              <p className="font-semibold">{quickCopy("fixIssues", lang)}</p>
              <ul className="mt-1 list-disc pl-5">
                {issues.map((i) => (
                  <li key={i}>{i}</li>
                ))}
              </ul>
            </div>
          ) : null}
          <button type="button" className={quickPrimaryBtn} onClick={next}>
            {quickCopy("next", lang)} →
          </button>
          {stepIndex > 0 ? (
            <button type="button" className={quickSecondaryBtn} onClick={() => goTo(stepIndex - 1)}>
              ← {quickCopy("back", lang)}
            </button>
          ) : null}
        </div>
      ) : null}
      {hydrated && stepIndex === reviewIndex ? (
        <button type="button" className={`${quickSecondaryBtn} mt-3`} onClick={() => goTo(stepIndex - 1)}>
          ← {quickCopy("back", lang)}
        </button>
      ) : null}

      <p className="mt-6 text-center text-xs text-[#7A7164]">
        <Link href={quickClassifiedMyAdPath(routeLang, category)} className="font-semibold text-[#7A1E2C] underline">
          {quickCopy("myAdEntry", lang)}
        </Link>
      </p>
    </QuickShell>
  );
}
