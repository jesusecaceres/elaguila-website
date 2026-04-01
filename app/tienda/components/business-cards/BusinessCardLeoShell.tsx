"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { leoAssistCopy, leoPick } from "../../data/businessCardLeoAssistantCopy";
import { LOGO_MAX_MB } from "../../product-configurators/business-cards/constants";
import { buildBusinessCardDocumentFromLeoIntake } from "../../product-configurators/business-cards/businessCardLeoAdvisor";
import type {
  BusinessCardLeoIntake,
  LeoBackStyle,
  LeoEmphasis,
  LeoPreferredStyle,
} from "../../product-configurators/business-cards/businessCardLeoTypes";
import type { BusinessCardProductSlug } from "../../product-configurators/business-cards/types";
import type { Lang } from "../../types/tienda";
import { BC_UPLOAD_DRAFT_PREFIX } from "../../order/mappers/businessCardDocumentToReview";
import {
  buildSessionPayloadWithLogos,
  writeSessionDesignDraft,
} from "../../product-configurators/business-cards/businessCardDraftPersistence";
import { businessCardConfigurePath, withLang } from "../../utils/tiendaRouting";
import { LeoBrandMark } from "./LeoBrandMark";

const STEP_COUNT = 4;

const emptyIntake: BusinessCardLeoIntake = {
  profession: "",
  businessName: "",
  personName: "",
  title: "",
  phone: "",
  email: "",
  website: "",
  address: "",
  slogan: "",
  preferredStyle: "modern",
  preferredColors: "",
  emphasis: "company",
  backStyle: "clean",
  logoDataUrl: null,
  logoNaturalWidth: null,
  logoNaturalHeight: null,
};

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

const inputClass =
  "mt-1 w-full min-h-[48px] rounded-xl border border-[rgba(255,255,255,0.14)] bg-[rgba(255,255,255,0.06)] px-4 py-3 text-[15px] text-white placeholder:text-[rgba(255,255,255,0.35)] focus:outline-none focus:ring-2 focus:ring-[rgba(201,168,74,0.45)]";

const labelClass = "block text-sm font-medium text-[rgba(255,247,226,0.88)]";

export function BusinessCardLeoShell(props: { productSlug: BusinessCardProductSlug; lang: Lang }) {
  const { productSlug, lang } = props;
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [intake, setIntake] = useState<BusinessCardLeoIntake>(emptyIntake);
  const [logoFileName, setLogoFileName] = useState<string | null>(null);
  const [logoLoadError, setLogoLoadError] = useState<string | null>(null);
  const [stepError, setStepError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const setField = useCallback(<K extends keyof BusinessCardLeoIntake>(key: K, value: BusinessCardLeoIntake[K]) => {
    setIntake((s) => ({ ...s, [key]: value }));
  }, []);

  const validateStep = useCallback((): boolean => {
    if (step === 0) {
      if (!intake.businessName.trim() || !intake.personName.trim() || !intake.profession.trim()) {
        setStepError(leoPick(leoAssistCopy.errRequired, lang));
        return false;
      }
    }
    if (step === 1) {
      if (!intake.phone.trim() && !intake.email.trim()) {
        setStepError(leoPick(leoAssistCopy.errContact, lang));
        return false;
      }
    }
    return true;
  }, [step, intake, lang]);

  const goNext = useCallback(() => {
    if (!validateStep()) return;
    setStepError(null);
    setStep((s) => Math.min(STEP_COUNT - 1, s + 1));
  }, [validateStep]);

  const goBack = useCallback(() => {
    setStepError(null);
    setStep((s) => Math.max(0, s - 1));
  }, []);

  const onLogo = useCallback(
    async (file: File | null) => {
      setLogoLoadError(null);
      if (!file) {
        setField("logoDataUrl", null);
        setField("logoNaturalWidth", null);
        setField("logoNaturalHeight", null);
        setLogoFileName(null);
        return;
      }
      if (file.size > LOGO_MAX_MB * 1024 * 1024) {
        setLogoLoadError(
          lang === "en" ? `Logo must be under ${LOGO_MAX_MB} MB.` : `El logo debe ser menor a ${LOGO_MAX_MB} MB.`
        );
        return;
      }
      try {
        const dataUrl = await readAsDataUrl(file);
        const img = new window.Image();
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error("decode"));
          img.src = dataUrl;
        });
        setField("logoDataUrl", dataUrl);
        setField("logoNaturalWidth", img.naturalWidth);
        setField("logoNaturalHeight", img.naturalHeight);
        setLogoFileName(file.name);
      } catch {
        setField("logoDataUrl", null);
        setField("logoNaturalWidth", null);
        setField("logoNaturalHeight", null);
        setLogoFileName(null);
        setLogoLoadError(
          lang === "en"
            ? "Could not load that image. Try PNG, JPG, WebP, or SVG."
            : "No se pudo cargar la imagen. Prueba PNG, JPG, WebP o SVG."
        );
      }
    },
    [lang, setField]
  );

  const finish = useCallback(async () => {
    if (!validateStep()) return;
    setSaveError(null);
    setSaving(true);
    try {
      const { document: doc } = buildBusinessCardDocumentFromLeoIntake(intake, productSlug, lang);
      const payload = await buildSessionPayloadWithLogos(
        doc,
        { front: doc.front.logo.previewUrl, back: doc.back.logo.previewUrl },
        logoFileName ? { frontFileName: logoFileName } : undefined
      );
      const w = writeSessionDesignDraft(productSlug, payload);
      if (!w.ok) {
        setSaveError(
          lang === "en"
            ? "Could not save this draft. Your browser storage may be full, or logos are too large for this session. Try a smaller logo, clear site data for this site, or continue without a logo and upload it in the builder — your text answers are still here until you leave this page."
            : "No se pudo guardar el borrador. El almacenamiento del navegador puede estar lleno o el logo es demasiado grande. Prueba un logo más pequeño, borra datos del sitio, o continúa sin logo y súbelo en el constructor — tus datos de texto siguen aquí mientras no salgas de esta página."
        );
        return;
      }
      sessionStorage.removeItem(`${BC_UPLOAD_DRAFT_PREFIX}${productSlug}`);
      router.push(withLang(businessCardConfigurePath(productSlug, { entry: "leo" }), lang));
    } catch {
      setSaveError(
        lang === "en"
          ? "Something went wrong while preparing your draft. Please try again."
          : "Algo salió mal al preparar el borrador. Intenta de nuevo."
      );
    } finally {
      setSaving(false);
    }
  }, [intake, productSlug, lang, router, validateStep, logoFileName]);

  const styleOptions: { v: LeoPreferredStyle; label: keyof typeof leoAssistCopy }[] = [
    { v: "luxury", label: "styleLuxury" },
    { v: "modern", label: "styleModern" },
    { v: "bold", label: "styleBold" },
    { v: "minimal", label: "styleMinimal" },
    { v: "elegant", label: "styleElegant" },
  ];

  const emphOptions: { v: LeoEmphasis; label: keyof typeof leoAssistCopy }[] = [
    { v: "logo", label: "emphLogo" },
    { v: "company", label: "emphCompany" },
    { v: "contact", label: "emphContact" },
  ];

  const backOptions: { v: LeoBackStyle; label: keyof typeof leoAssistCopy }[] = [
    { v: "clean", label: "backClean" },
    { v: "services", label: "backServices" },
    { v: "address", label: "backAddress" },
    { v: "map-style", label: "backMap" },
  ];

  return (
    <main className="min-h-screen bg-[#050506] text-white">
      <header className="border-b border-[rgba(201,168,74,0.12)] bg-[linear-gradient(165deg,rgba(201,168,74,0.1),rgba(5,5,6,0.98))]">
        <div className="mx-auto max-w-lg px-4 pt-24 sm:pt-28 sm:px-6 pb-8 text-center">
          <Link
            href={withLang(`/tienda/p/${productSlug}`, lang)}
            className="inline-block text-sm font-medium text-[rgba(255,247,226,0.82)] hover:text-[rgba(201,168,74,0.95)]"
          >
            {leoPick(leoAssistCopy.backLink, lang)}
          </Link>
          <div className="mt-6 flex justify-center">
            <LeoBrandMark width={152} className="mx-auto max-w-[min(100%,168px)]" />
          </div>
          <h1 className="mt-6 text-2xl font-semibold tracking-tight text-[rgba(255,247,226,0.98)] sm:text-[1.65rem]">
            {leoPick(leoAssistCopy.pageTitle, lang)}
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-[rgba(255,255,255,0.68)] sm:text-[15px]">
            {leoPick(leoAssistCopy.pageSubtitle, lang)}
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-lg px-4 sm:px-6 pb-20 pt-8">
        <div className="flex items-center gap-2" aria-live="polite" role="status">
          {Array.from({ length: STEP_COUNT }, (_, i) => (
            <div
              key={i}
              className={[
                "h-2 flex-1 rounded-full transition duration-300",
                i <= step ? "bg-[color:var(--lx-gold)] shadow-[0_0_12px_rgba(201,168,74,0.35)]" : "bg-[rgba(255,255,255,0.1)]",
              ].join(" ")}
            />
          ))}
        </div>
        {stepError ? (
          <div
            className="mt-4 rounded-xl border border-[rgba(220,80,80,0.45)] bg-[rgba(80,20,20,0.35)] px-4 py-3 text-sm text-[rgba(255,230,230,0.95)]"
            role="alert"
          >
            {stepError}
          </div>
        ) : null}

        <div className="mt-3 flex items-center justify-between text-xs text-[rgba(255,255,255,0.5)]">
          <span>
            {leoPick(leoAssistCopy.progress, lang)} {step + 1}/{STEP_COUNT}
          </span>
          <span className="font-medium text-[rgba(201,168,74,0.85)]">
            {step === 0
              ? leoPick(leoAssistCopy.step1Title, lang)
              : step === 1
                ? leoPick(leoAssistCopy.step2Title, lang)
                : step === 2
                  ? leoPick(leoAssistCopy.step3Title, lang)
                  : leoPick(leoAssistCopy.step4Title, lang)}
          </span>
        </div>

        {step === 0 ? (
          <section className="mt-8 space-y-5">
            <h2 className="text-lg font-semibold text-[rgba(255,247,226,0.95)]">{leoPick(leoAssistCopy.step1Title, lang)}</h2>
            <details className="rounded-2xl border border-[rgba(201,168,74,0.22)] bg-[rgba(201,168,74,0.05)] px-4 py-3.5">
              <summary className="cursor-pointer list-none text-left text-sm font-semibold text-[rgba(255,247,226,0.92)] [&::-webkit-details-marker]:hidden">
                {leoPick(leoAssistCopy.whyTitle, lang)}
                <span className="ml-1 text-[rgba(201,168,74,0.9)]">+</span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-[rgba(255,255,255,0.72)]">{leoPick(leoAssistCopy.whyBody, lang)}</p>
            </details>
            <div>
              <label className={labelClass}>{leoPick(leoAssistCopy.profession, lang)}</label>
              <input
                className={inputClass}
                value={intake.profession}
                onChange={(e) => setField("profession", e.target.value)}
                autoComplete="organization-title"
              />
            </div>
            <div>
              <label className={labelClass}>{leoPick(leoAssistCopy.businessName, lang)}</label>
              <input
                className={inputClass}
                value={intake.businessName}
                onChange={(e) => setField("businessName", e.target.value)}
                autoComplete="organization"
              />
            </div>
            <div>
              <label className={labelClass}>{leoPick(leoAssistCopy.personName, lang)}</label>
              <input
                className={inputClass}
                value={intake.personName}
                onChange={(e) => setField("personName", e.target.value)}
                autoComplete="name"
              />
            </div>
            <div>
              <label className={labelClass}>{leoPick(leoAssistCopy.title, lang)}</label>
              <input className={inputClass} value={intake.title} onChange={(e) => setField("title", e.target.value)} />
            </div>
          </section>
        ) : null}

        {step === 1 ? (
          <section className="mt-8 space-y-5">
            <h2 className="text-lg font-semibold text-[rgba(255,247,226,0.95)]">{leoPick(leoAssistCopy.step2Title, lang)}</h2>
            <div>
              <label className={labelClass}>{leoPick(leoAssistCopy.phone, lang)}</label>
              <input className={inputClass} value={intake.phone} onChange={(e) => setField("phone", e.target.value)} type="tel" />
            </div>
            <div>
              <label className={labelClass}>{leoPick(leoAssistCopy.email, lang)}</label>
              <input className={inputClass} value={intake.email} onChange={(e) => setField("email", e.target.value)} type="email" />
            </div>
            <div>
              <label className={labelClass}>{leoPick(leoAssistCopy.website, lang)}</label>
              <input className={inputClass} value={intake.website} onChange={(e) => setField("website", e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>{leoPick(leoAssistCopy.address, lang)}</label>
              <textarea
                className={`${inputClass} min-h-[88px] resize-y`}
                value={intake.address}
                onChange={(e) => setField("address", e.target.value)}
                rows={3}
              />
            </div>
          </section>
        ) : null}

        {step === 2 ? (
          <section className="mt-8 space-y-5">
            <h2 className="text-lg font-semibold text-[rgba(255,247,226,0.95)]">{leoPick(leoAssistCopy.step3Title, lang)}</h2>
            <div>
              <label className={labelClass}>{leoPick(leoAssistCopy.slogan, lang)}</label>
              <textarea
                className={`${inputClass} min-h-[80px] resize-y`}
                value={intake.slogan}
                onChange={(e) => setField("slogan", e.target.value)}
                rows={2}
              />
            </div>
            <div>
              <span className={labelClass}>{leoPick(leoAssistCopy.preferredStyle, lang)}</span>
              <div className="mt-2 flex flex-wrap gap-2">
                {styleOptions.map(({ v, label }) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setField("preferredStyle", v)}
                    className={[
                      "min-h-[48px] rounded-full px-4 text-sm font-semibold transition",
                      intake.preferredStyle === v
                        ? "bg-[color:var(--lx-gold)] text-[color:var(--lx-text)]"
                        : "border border-[rgba(255,255,255,0.2)] bg-transparent text-[rgba(255,247,226,0.88)]",
                    ].join(" ")}
                  >
                    {leoPick(leoAssistCopy[label], lang)}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className={labelClass}>{leoPick(leoAssistCopy.preferredColors, lang)}</label>
              <input className={inputClass} value={intake.preferredColors} onChange={(e) => setField("preferredColors", e.target.value)} />
            </div>
            <div>
              <span className={labelClass}>{leoPick(leoAssistCopy.emphasis, lang)}</span>
              <div className="mt-2 flex flex-wrap gap-2">
                {emphOptions.map(({ v, label }) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setField("emphasis", v)}
                    className={[
                      "min-h-[48px] rounded-full px-4 text-sm font-semibold transition",
                      intake.emphasis === v
                        ? "bg-[color:var(--lx-gold)] text-[color:var(--lx-text)]"
                        : "border border-[rgba(255,255,255,0.2)] bg-transparent text-[rgba(255,247,226,0.88)]",
                    ].join(" ")}
                  >
                    {leoPick(leoAssistCopy[label], lang)}
                  </button>
                ))}
              </div>
            </div>
            {productSlug === "two-sided-business-cards" ? (
              <div>
                <span className={labelClass}>{leoPick(leoAssistCopy.backStyle, lang)}</span>
                <div className="mt-2 flex flex-col gap-2">
                  {backOptions.map(({ v, label }) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setField("backStyle", v)}
                      className={[
                        "min-h-[48px] w-full rounded-xl px-4 text-sm font-semibold text-left transition",
                        intake.backStyle === v
                          ? "bg-[rgba(201,168,74,0.22)] border border-[rgba(201,168,74,0.45)] text-[rgba(255,247,226,0.98)]"
                          : "border border-[rgba(255,255,255,0.14)] bg-[rgba(255,255,255,0.04)] text-[rgba(255,247,226,0.88)]",
                      ].join(" ")}
                    >
                      {leoPick(leoAssistCopy[label], lang)}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-[rgba(255,255,255,0.5)]">
                {lang === "en" ? "One-sided product — back layout options apply when you upgrade to two-sided." : "Producto de un lado — el reverso aplica si eliges tarjeta a dos caras."}
              </p>
            )}
          </section>
        ) : null}

        {step === 3 ? (
          <section className="mt-8 space-y-5">
            <h2 className="text-lg font-semibold text-[rgba(255,247,226,0.95)]">{leoPick(leoAssistCopy.step4Title, lang)}</h2>
            <div>
              <label className={labelClass}>{leoPick(leoAssistCopy.logo, lang)}</label>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                className="mt-2 block w-full text-sm text-[rgba(255,255,255,0.75)] file:mr-3 file:rounded-lg file:border-0 file:bg-[rgba(201,168,74,0.2)] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[rgba(255,247,226,0.95)]"
                onChange={(e) => void onLogo(e.target.files?.[0] ?? null)}
              />
            </div>
            {logoLoadError ? (
              <p className="text-sm text-[rgba(255,180,180,0.95)]" role="alert">
                {logoLoadError}
              </p>
            ) : null}
            {intake.logoDataUrl ? (
              <div className="mt-4 rounded-2xl border border-[rgba(201,168,74,0.25)] bg-[rgba(0,0,0,0.35)] p-4">
                <div className="flex items-start gap-4">
                  {/* eslint-disable-next-line @next/next/no-img-element -- user-uploaded data URL preview */}
                  <img
                    src={intake.logoDataUrl}
                    alt=""
                    className="h-20 w-auto max-w-[140px] object-contain rounded-lg bg-white/5 ring-1 ring-white/10"
                  />
                  <div className="min-w-0 flex-1 text-left text-sm">
                    <div className="font-semibold text-[rgba(255,247,226,0.95)]">
                      {lang === "en" ? "Logo preview" : "Vista previa del logo"}
                    </div>
                    {logoFileName ? (
                      <div className="mt-1 truncate text-[rgba(255,255,255,0.65)]" title={logoFileName}>
                        {logoFileName}
                      </div>
                    ) : null}
                    {intake.logoNaturalWidth && intake.logoNaturalHeight ? (
                      <div className="mt-1 text-xs text-[rgba(255,255,255,0.45)]">
                        {intake.logoNaturalWidth} × {intake.logoNaturalHeight}px
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : null}
            <p className="text-sm text-[rgba(255,255,255,0.55)]">
              {lang === "en"
                ? "LEO will place your logo on the front when provided. You can nudge it in the builder."
                : "LEO colocará el logo al frente si lo subes. Podrás ajustarlo en el constructor."}
            </p>
          </section>
        ) : null}

        {saveError ? (
          <div
            className="mt-8 rounded-xl border border-[rgba(220,80,80,0.45)] bg-[rgba(80,20,20,0.35)] px-4 py-3 text-sm text-[rgba(255,230,230,0.95)]"
            role="alert"
          >
            {saveError}
          </div>
        ) : null}

        <div className="mt-10 flex flex-col-reverse sm:flex-row gap-3">
          <button
            type="button"
            onClick={goBack}
            disabled={step === 0}
            className="min-h-[52px] rounded-full border border-[rgba(255,255,255,0.18)] px-6 text-sm font-semibold text-[rgba(255,247,226,0.88)] disabled:opacity-35"
          >
            {leoPick(leoAssistCopy.back, lang)}
          </button>
          {step < STEP_COUNT - 1 ? (
            <button
              type="button"
              onClick={goNext}
              className="min-h-[52px] flex-1 rounded-full bg-[color:var(--lx-gold)] px-6 text-sm font-semibold text-[color:var(--lx-text)] shadow-[0_12px_34px_rgba(201,168,74,0.22)]"
            >
              {leoPick(leoAssistCopy.next, lang)}
            </button>
          ) : (
            <button
              type="button"
              disabled={saving}
              onClick={() => void finish()}
              className="min-h-[52px] flex-1 rounded-full bg-[color:var(--lx-gold)] px-6 text-sm font-semibold text-[color:var(--lx-text)] shadow-[0_12px_34px_rgba(201,168,74,0.22)] disabled:opacity-60"
            >
              {saving
                ? lang === "en"
                  ? "Saving…"
                  : "Guardando…"
                : leoPick(leoAssistCopy.finish, lang)}
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
