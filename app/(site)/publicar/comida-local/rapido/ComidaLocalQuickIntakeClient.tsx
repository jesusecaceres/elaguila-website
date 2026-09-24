"use client";

/**
 * Comida Local Quick intake — "Quick food business" front door into the EXISTING Comida Local product.
 * LESS INPUT → SAME existing canonical draft (`ComidaLocalDraft`) → SAME existing readiness validator
 * → SAME existing localStorage draft key (so the EXISTING preview reads it unmodified) → SAME existing
 * preview → SAME existing checkpoint/Stripe checkout → SAME public output, admin, dashboard, lifecycle.
 *
 * A dedicated, additive route (`/publicar/comida-local/rapido`) — never touches the certified Quick
 * Classifieds (`app/(site)/publicar/rapido`, `app/lib/quickClassifieds`) or Quick Business Core
 * (`app/lib/quickBusiness`, `app/(site)/publicar/negocio-rapido`) trees, and never widens their closed
 * category-key unions (Quick Business Core's verifier locks "exactly four live categories").
 *
 * Reuses UNMODIFIED the certified Quick Classifieds primitives: `QuickShell`, `QuickFieldRenderer`,
 * `QuickMediaStep`, the pure validation (`validateQuickStep`, `validateQuickMedia`, `quickStr`), the
 * framework types (`QuickIntakeStep`, `QuickMediaItem`, `QuickIntakeValues`) and the shared ES/EN copy
 * (`quickCopy`, `qt`) — same interaction contract as every other Quick intake: raw keystrokes, one-key
 * patches, Back/Next move only the step index, tab-scoped persistence.
 *
 * MEDIA EXCEPTION (documented, narrow, self-tested — see scripts/verify-quick-remaining-families-01.ts):
 * unlike every other Quick category, `ComidaLocalDraft.mainPhoto`/`galleryImages` are typed as ALREADY
 * UPLOADED metadata ("no base64, blob, or File handles" — comidaLocalTypes.ts), and the EXISTING publish
 * route (`app/api/clasificados/comida-local/publish/route.ts`, `detectHeavyMedia`) REJECTS a `data:`/`blob:`
 * image URL outright. The Full Comida Local application itself uploads on file-select via the EXISTING
 * `uploadComidaLocalDraftImage()` helper (`ComidaLocalImageUploadField.tsx`), not at a later checkout step.
 * This is the ONLY architecturally valid way to produce a publishable draft, so this file — and only this
 * file, in the whole Quick program — calls that SAME existing uploader at submit time, reusing the EXISTING
 * `/api/clasificados/comida-local/draft-media-upload` endpoint the Full form already calls. Nothing new is
 * inserted, priced, or owned by Quick: the upload is anonymous/session-scoped exactly as it is for a Full
 * customer picking a photo, and it stores no owner id, no price, no row.
 */

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { resolveClasificadosPublishLang, withClasificadosPublishLang } from "@/app/lib/clasificados/clasificadosPublishLang";
import { getCanonicalCityName } from "@/app/data/locations/californiaLocationHelpers";
import type { ComidaLocalDraft, ComidaLocalFoodType } from "@/app/lib/clasificados/comida-local/comidaLocalTypes";
import { createEmptyComidaLocalDraft } from "@/app/lib/clasificados/comida-local/createEmptyComidaLocalDraft";
import { COMIDA_LOCAL_FOOD_TYPE_OPTIONS, COMIDA_LOCAL_GALLERY_MAX } from "@/app/lib/clasificados/comida-local/comidaLocalConstants";
import { validateComidaLocalDraftForFuturePublish } from "@/app/lib/clasificados/comida-local/comidaLocalValidation";
import { ensureComidaLocalDraftListingId } from "@/app/lib/clasificados/comida-local/comidaLocalImageNormalize";
import { saveComidaLocalDraftToStorage } from "@/app/lib/clasificados/comida-local/comidaLocalDraftPersistence";
import { uploadComidaLocalDraftImage } from "@/app/lib/clasificados/comida-local/comidaLocalDraftMediaUpload";
import { getRevenuePackagePriceCents, formatRevenuePriceLabel } from "@/app/lib/listingPlans/revenuePricingMatrix";
import { qt, quickCopy } from "@/app/lib/quickClassifieds/quickClassifiedCopy";
import type { QuickClassifiedFieldDefinition, QuickIntakeStep, QuickIntakeValue, QuickIntakeValues, QuickLang, QuickMediaItem } from "@/app/lib/quickClassifieds/quickClassifiedTypes";
import { quickFieldIsVisible, quickStr, validateQuickMedia, validateQuickStep } from "@/app/lib/quickClassifieds/quickClassifiedValidation";
import { QuickFieldRenderer } from "@/app/publicar/rapido/_components/QuickFieldRenderer";
import { QuickMediaStep } from "@/app/publicar/rapido/_components/QuickMediaStep";
import { QuickShell, quickCard, quickPrimaryBtn, quickSecondaryBtn } from "@/app/publicar/rapido/_components/QuickShell";
import {
  clearComidaLocalRapidoDraft,
  emptyComidaLocalRapidoDraft,
  loadComidaLocalRapidoDraft,
  saveComidaLocalRapidoDraft,
  type ComidaLocalRapidoDraft,
} from "./comidaLocalRapidoDraftStore";

const COPY = {
  eyebrow: { es: "Comida rápida", en: "Quick food" },
  title: { es: "🌮 Publica tu comida local", en: "🌮 Publish your local food" },
  tagline: { es: "Tu negocio + un plato real que vendes", en: "Your business + one real dish you sell" },
  mediaIntro: {
    es: "Se necesita al menos una foto real de tu comida o tu puesto (no un logo). La primera será la portada.",
    en: "At least one real photo of your food or stand is required (not a logo). The first one is the cover.",
  },
  reviewPaidNote: {
    es: "Este perfil es una suscripción mensual. Verás el precio exacto y pagarás después de revisar la vista previa.",
    en: "This profile is a monthly subscription. You will see the exact price and pay after reviewing the preview.",
  },
  reviewHandoffNote: {
    es: "Después de la vista previa continúas en la misma pantalla de Leonix que usa todo el mundo — horarios, extras y más los agregas después desde tu panel.",
    en: "After the preview you continue on the same Leonix screen everyone uses — add hours, extras and more later from your dashboard.",
  },
  manageLink: { es: "¿Ya publicaste? Administra tu Comida Local", en: "Already published? Manage your Comida Local" },
  uploadFailed: {
    es: "No pudimos subir una de tus fotos. Inténtalo de nuevo.",
    en: "We couldn't upload one of your photos. Please try again.",
  },
} as const;

const FOOD_TYPE_OPTIONS = COMIDA_LOCAL_FOOD_TYPE_OPTIONS.map((o) => ({ value: o.value, label: { es: o.labelEs, en: o.labelEn } }));
const isOtherFoodType = (v: QuickIntakeValues) => quickStr(v, "foodType") === "otro";

const STEPS: readonly QuickIntakeStep[] = [
  {
    id: "business",
    title: { es: "Tu negocio de comida", en: "Your food business" },
    fields: [
      { key: "businessName", kind: "text", label: { es: "Nombre de tu puesto o negocio", en: "Your stand or business name" }, placeholder: { es: "Ej. Tacos El Compa", en: "e.g. El Compa Tacos" }, required: true, maxLength: 80 },
      { key: "foodType", kind: "select", label: { es: "Tipo de comida", en: "Food type" }, required: true, options: FOOD_TYPE_OPTIONS },
      { key: "foodTypeCustom", kind: "text", label: { es: "Describe tu tipo de comida", en: "Describe your food type" }, required: isOtherFoodType, showWhen: isOtherFoodType, maxLength: 60 },
      { key: "city", kind: "city", cityMode: "free", label: { es: "Ciudad", en: "City" }, required: true },
      { key: "queVendes", kind: "textarea", label: { es: "¿Qué vendes?", en: "What do you sell?" }, hint: { es: "Mínimo 20 caracteres.", en: "Minimum 20 characters." }, required: true, maxLength: 1000 },
    ] satisfies QuickClassifiedFieldDefinition[],
  },
  {
    id: "contact",
    title: { es: "¿Cómo te contactan?", en: "How do customers reach you?" },
    intro: { es: "Solo se muestra lo que escribas aquí.", en: "Only what you enter here is shown." },
    fields: [
      { key: "phone", kind: "phone", label: { es: "Teléfono", en: "Phone" }, placeholder: { es: "(408) 555-0123", en: "(408) 555-0123" }, autoComplete: "tel", inputMode: "tel" },
      { key: "whatsapp", kind: "phone", label: { es: "WhatsApp", en: "WhatsApp" }, hint: { es: "Si es el mismo número, escríbelo también aquí.", en: "If it is the same number, enter it here too." }, inputMode: "tel" },
    ] satisfies QuickClassifiedFieldDefinition[],
    atLeastOne: { keys: ["phone", "whatsapp"], message: { es: "Agrega tu teléfono o WhatsApp para que te contacten.", en: "Add your phone or WhatsApp so people can reach you." } },
  },
];

function priceLine(lang: QuickLang): string | null {
  const { priceCents } = getRevenuePackagePriceCents({ category: "comida-local", packageKey: "comida_local_base_monthly" });
  if (priceCents == null) return null;
  return `${formatRevenuePriceLabel(priceCents)}${lang === "en" ? "/mo" : "/mes"}`;
}

async function dataUrlToFile(dataUrl: string, fileName: string): Promise<File> {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  return new File([blob], fileName, { type: blob.type || "image/jpeg" });
}

/** Values → the canonical `ComidaLocalDraft` shape (same fields the Full application writes). */
function buildDraftFromValues(values: QuickIntakeValues, draftListingId: string): ComidaLocalDraft {
  const cityRaw = quickStr(values, "city");
  return {
    ...createEmptyComidaLocalDraft(),
    draftListingId,
    businessName: quickStr(values, "businessName"),
    foodType: (quickStr(values, "foodType") || "") as ComidaLocalFoodType | "",
    foodTypeCustom: quickStr(values, "foodTypeCustom"),
    cityDisplay: cityRaw,
    cityCanonical: getCanonicalCityName(cityRaw) || "",
    queVendes: quickStr(values, "queVendes"),
    phone: quickStr(values, "phone"),
    whatsapp: quickStr(values, "whatsapp"),
  };
}

export function ComidaLocalQuickIntakeClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { routeLang, copyLang: lang } = useMemo(() => resolveClasificadosPublishLang(searchParams?.get("lang")), [searchParams]);
  const src = searchParams?.get("src");

  const [draft, setDraft] = useState<ComidaLocalRapidoDraft>(() => emptyComidaLocalRapidoDraft());
  const [hydrated, setHydrated] = useState(false);
  const [issues, setIssues] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void loadComidaLocalRapidoDraft().then((loaded) => {
      if (cancelled) return;
      if (loaded) setDraft(loaded);
      setHydrated(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const t = window.setTimeout(() => void saveComidaLocalRapidoDraft(draft), 250);
    return () => window.clearTimeout(t);
  }, [hydrated, draft]);

  const mediaIndex = STEPS.length;
  const reviewIndex = STEPS.length + 1;
  const stepIndex = Math.min(draft.stepIndex, reviewIndex);
  const totalSteps = STEPS.length + 2;

  const setValue = useCallback((key: string, value: QuickIntakeValue) => {
    setDraft((d) => ({ ...d, values: { ...d.values, [key]: value } }));
  }, []);
  const setMedia = useCallback((media: QuickMediaItem[]) => setDraft((d) => ({ ...d, media })), []);
  const goTo = useCallback((index: number) => {
    setIssues([]);
    setDraft((d) => ({ ...d, stepIndex: index }));
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // NO-VIDEO POLICY: Comida Local does not promise or accept video. `videoOptional: true` is only the
  // literal the shared Quick Classifieds contract TYPE requires; it renders nothing (QuickMediaStep is
  // image/* only) and the publish validator forces `maxExternalVideos: 0`. Never add video copy or
  // capture here. Photos are capped at what the flat base package can actually publish: the main photo
  // plus COMIDA_LOCAL_GALLERY_MAX gallery photos (the draft merge would otherwise silently drop extras).
  const mediaContract = {
    minImages: 1 as const,
    maxImages: 1 + COMIDA_LOCAL_GALLERY_MAX,
    videoOptional: true as const,
    note: COPY.mediaIntro,
  };

  function next() {
    if (stepIndex < mediaIndex) {
      const found = validateQuickStep(STEPS[stepIndex]!, draft.values, lang);
      if (found.length) {
        setIssues(found);
        return;
      }
    } else if (stepIndex === mediaIndex) {
      const found = validateQuickMedia(draft.media, mediaContract, lang);
      if (found.length) {
        setIssues(found);
        return;
      }
    }
    goTo(stepIndex + 1);
  }

  async function submit() {
    setSubmitting(true);
    setIssues([]);
    try {
      const allIssues: string[] = [];
      for (const s of STEPS) allIssues.push(...validateQuickStep(s, draft.values, lang));
      allIssues.push(...validateQuickMedia(draft.media, mediaContract, lang));
      if (allIssues.length) {
        setIssues(allIssues);
        return;
      }
      const draftListingId = ensureComidaLocalDraftListingId(undefined);
      let canonical = buildDraftFromValues(draft.values, draftListingId);

      // Real upload (see file header "MEDIA EXCEPTION"): the canonical draft's image fields only
      // accept already-uploaded HTTPS URLs — the EXISTING publish route rejects `data:`/`blob:`.
      try {
        const first = draft.media[0];
        if (!first) throw new Error("missing_required_image");
        const mainFile = await dataUrlToFile(first.dataUrl, first.fileName || "foto.jpg");
        const mainUploaded = await uploadComidaLocalDraftImage({ file: mainFile, role: "main", draftListingId });
        if (!mainUploaded.ok) throw new Error(mainUploaded.error);
        canonical = { ...canonical, mainPhoto: mainUploaded.image };
        const rest = draft.media.slice(1, 1 + COMIDA_LOCAL_GALLERY_MAX);
        const galleryImages = [];
        for (const item of rest) {
          const galleryFile = await dataUrlToFile(item.dataUrl, item.fileName || "foto.jpg");
          const galleryUploaded = await uploadComidaLocalDraftImage({ file: galleryFile, role: "gallery", draftListingId });
          if (!galleryUploaded.ok) throw new Error(galleryUploaded.error);
          galleryImages.push(galleryUploaded.image);
        }
        canonical = { ...canonical, galleryImages };
      } catch {
        setIssues([qt(COPY.uploadFailed, lang)]);
        return;
      }

      const issuesFound = validateComidaLocalDraftForFuturePublish(canonical, lang === "es");
      if (issuesFound.length) {
        setIssues(issuesFound.map((i) => i.message));
        return;
      }

      // Same default storage key the Full application + existing preview both read/write.
      saveComidaLocalDraftToStorage(canonical);
      clearComidaLocalRapidoDraft();
      router.push(withClasificadosPublishLang("/clasificados/comida-local/preview", routeLang));
    } catch {
      setIssues([quickCopy("errorGeneric", lang)]);
    } finally {
      setSubmitting(false);
    }
  }

  const chooserHref = withClasificadosPublishLang("/publicar/comida-local", routeLang);
  const price = priceLine(lang);
  const progress = quickCopy("stepOf", lang, { n: stepIndex + 1, total: totalSteps });

  return (
    <QuickShell lang={lang} eyebrow={qt(COPY.eyebrow, lang)} title={qt(COPY.title, lang)} subtitle={stepIndex === 0 ? qt(COPY.tagline, lang) : progress} backHref={stepIndex === 0 ? chooserHref : undefined}>
      {src === "staff" ? (
        <p className="mb-3 rounded-xl border border-[#C9A84A]/60 bg-[#FFF6E7] px-3 py-2 text-xs text-[#6E4E18]">
          {lang === "en" ? "This link was shared by the Leonix team. Sign in with your email and the profile will be in your name." : "Este enlace te lo compartió el equipo Leonix. Inicia sesión con tu correo y el perfil quedará a tu nombre."}
        </p>
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
          <h2 className="text-lg font-extrabold">{qt(STEPS[stepIndex]!.title, lang)}</h2>
          {STEPS[stepIndex]!.intro ? <p className="mt-1 text-sm text-[#5D4A25]/90">{qt(STEPS[stepIndex]!.intro!, lang)}</p> : null}
          <div className="mt-4 space-y-4">
            {STEPS[stepIndex]!.fields.filter((f) => quickFieldIsVisible(f, draft.values)).map((f) => (
              <QuickFieldRenderer key={f.key} field={f} values={draft.values} lang={lang} onChange={setValue} />
            ))}
          </div>
        </section>
      ) : stepIndex === mediaIndex ? (
        <>
          <p className="mb-2 text-sm text-[#5D4A25]/90">{qt(COPY.mediaIntro, lang)}</p>
          <QuickMediaStep lang={lang} contract={mediaContract} media={draft.media} onChange={setMedia} />
        </>
      ) : (
        <div className="space-y-4">
          <section className={quickCard}>
            <h2 className="text-lg font-extrabold">{quickCopy("reviewTitle", lang)}</h2>
            <p className="mt-1 text-sm text-[#5D4A25]/90">{quickCopy("reviewIntro", lang)}</p>
            <div className="mt-3 space-y-3">
              {STEPS.map((step, i) => (
                <div key={step.id} className="rounded-xl border border-[#E8DFD0] bg-white p-3">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-bold">{qt(step.title, lang)}</h3>
                    <button type="button" onClick={() => goTo(i)} className="min-h-[36px] text-xs font-semibold text-[#7A1E2C] underline">
                      {quickCopy("reviewEdit", lang)}
                    </button>
                  </div>
                  <dl className="mt-2 space-y-1 text-sm">
                    {step.fields
                      .filter((f) => quickFieldIsVisible(f, draft.values))
                      .map((f) => {
                        const raw = draft.values[f.key];
                        if (raw == null || raw === "") return null;
                        const display = f.kind === "select" ? (FOOD_TYPE_OPTIONS.find((o) => o.value === raw)?.label ? qt(FOOD_TYPE_OPTIONS.find((o) => o.value === raw)!.label, lang) : String(raw)) : String(raw);
                        return (
                          <div key={f.key} className="flex gap-2">
                            <dt className="w-2/5 shrink-0 text-[#7A7164]">{qt(f.label, lang)}</dt>
                            <dd className="min-w-0 flex-1 break-words font-medium">{display}</dd>
                          </div>
                        );
                      })}
                  </dl>
                </div>
              ))}
              <div className="rounded-xl border border-[#E8DFD0] bg-white p-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-bold">{quickCopy("reviewPhotos", lang)}</h3>
                  <button type="button" onClick={() => goTo(mediaIndex)} className="min-h-[36px] text-xs font-semibold text-[#7A1E2C] underline">
                    {quickCopy("reviewEdit", lang)}
                  </button>
                </div>
                <div className="mt-2 flex gap-2 overflow-x-auto">
                  {draft.media.map((m) => (
                    <img key={m.id} src={m.dataUrl} alt="" className="h-16 w-16 shrink-0 rounded-lg object-cover" />
                  ))}
                </div>
              </div>
            </div>
          </section>
          <section className={quickCard}>
            <p className="text-sm font-semibold">{price ? `${qt(COPY.reviewPaidNote, lang)} ${price}` : qt(COPY.reviewPaidNote, lang)}</p>
            <p className="mt-1 text-xs text-[#7A7164]">{qt(COPY.reviewHandoffNote, lang)}</p>
            {issues.length ? (
              <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">
                <p className="font-semibold">{quickCopy("fixIssues", lang)}</p>
                <ul className="mt-1 list-disc pl-5">
                  {issues.map((i) => (
                    <li key={i}>{i}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            <button type="button" className={`${quickPrimaryBtn} mt-4`} disabled={submitting || draft.media.length === 0} onClick={() => void submit()}>
              {submitting ? quickCopy("reviewSubmitting", lang) : `👀 ${quickCopy("reviewSubmit", lang)}`}
            </button>
          </section>
        </div>
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
        <Link href={withClasificadosPublishLang("/dashboard/mis-anuncios?cat=comida-local", routeLang)} className="font-semibold text-[#7A1E2C] underline">
          {qt(COPY.manageLink, lang)}
        </Link>
      </p>
    </QuickShell>
  );
}
