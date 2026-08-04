"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import Navbar from "@/app/components/Navbar";
import { createSupabaseBrowserClient, withAuthTimeout, AUTH_CHECK_TIMEOUT_MS } from "@/app/lib/supabase/browser";
import { appendLangToPath } from "@/app/clasificados/lib/hubUrl";
import { resolveClasificadosPublishLang } from "@/app/lib/clasificados/clasificadosPublishLang";
import { ViajesLangSwitch } from "@/app/(site)/clasificados/viajes/components/ViajesLangSwitch";
import { isViajesPrivatePublishDisabled } from "@/app/(site)/clasificados/viajes/lib/viajesPrivateLaneLaunchPolicy";
import { normalizeViajesOfferToV2 } from "@/app/(site)/clasificados/viajes/lib/v2/normalizeViajesOfferToV2";
import type { ViajesOfferModelV2 } from "@/app/(site)/clasificados/viajes/lib/v2/viajesOfferModelV2";
import { validateViajesOfferForSubmit } from "@/app/(site)/clasificados/viajes/lib/v2/viajesOfferV2Validation";
import { ViajesPublisherStepper } from "../../components/ViajesPublisherStepper";
import { getPublicarViajesPrivadoCopy } from "../data/publicarViajesPrivadoCopy";
import { useViajesPrivadoDraftV2 } from "../lib/useViajesPrivadoDraftV2";
import { ViajesPrivadoStepGetaway } from "./ViajesPrivadoStepGetaway";
import { ViajesPrivadoStepExperience } from "./ViajesPrivadoStepExperience";
import { ViajesPrivadoStepContact } from "./ViajesPrivadoStepContact";
import { ViajesPrivadoStepReview } from "./ViajesPrivadoStepReview";
import {
  viajesEnviadoSuccessHref,
  viajesPublisherPreviewHref,
} from "@/app/(site)/clasificados/viajes/lib/viajesOwnerDashboardLinks";

const CARD =
  "rounded-[20px] border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] p-4 shadow-[0_8px_28px_-12px_rgba(42,36,22,0.12)] sm:p-5";

export function ViajesPrivadoApplicationShell() {
  const router = useRouter();
  const sp = useSearchParams();
  const { routeLang, copyLang: lang } = resolveClasificadosPublishLang(sp?.get("lang"));
  const c = getPublicarViajesPrivadoCopy(lang);
  const { draft, setOffer, hydrated, setDraft } = useViajesPrivadoDraftV2(lang === "en" ? "en" : "es");
  const offer = draft.offer;
  const stagedIdFromUrl = (sp?.get("stagedId") ?? "").trim();
  const [step, setStep] = useState(0);
  const [stagedBootstrapErr, setStagedBootstrapErr] = useState<string | null>(null);
  const [submitBusy, setSubmitBusy] = useState(false);
  const [submitErr, setSubmitErr] = useState<string | null>(null);

  useEffect(() => {
    document.title = c.documentTitle;
  }, [c.documentTitle]);

  useEffect(() => {
    if (!hydrated || !stagedIdFromUrl) {
      setStagedBootstrapErr(null);
      return;
    }
    let cancelled = false;
    async function load() {
      setStagedBootstrapErr(null);
      try {
        const sb = createSupabaseBrowserClient();
        const sess = await withAuthTimeout(sb.auth.getSession(), AUTH_CHECK_TIMEOUT_MS);
        const token = sess.data.session?.access_token;
        if (!token) {
          if (!cancelled) setStagedBootstrapErr(lang === "en" ? "Sign in to load this submission." : "Inicia sesión para cargar este envío.");
          return;
        }
        const res = await fetch(`/api/clasificados/viajes/staged-owner?id=${encodeURIComponent(stagedIdFromUrl)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = (await res.json()) as { ok?: boolean; row?: { listing_json?: unknown }; error?: string };
        if (!res.ok || !json.ok || !json.row?.listing_json) {
          if (!cancelled) setStagedBootstrapErr(json.error ?? (lang === "en" ? "Could not load submission." : "No se pudo cargar el envío."));
          return;
        }
        const next = normalizeViajesOfferToV2(json.row.listing_json, { locale: lang === "en" ? "en" : "es", laneHint: "private" });
        next.lifecycle = { ...next.lifecycle, stagedListingId: stagedIdFromUrl };
        next.locations.privateExact = { ...next.locations.privateExact, showPublicly: false, showMap: false };
        if (!cancelled) setDraft({ schemaVersion: 2, offer: next });
      } catch {
        if (!cancelled) setStagedBootstrapErr(lang === "en" ? "Network error." : "Error de red.");
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [hydrated, lang, setDraft, stagedIdFromUrl]);

  const branchHref = appendLangToPath("/publicar/viajes", routeLang);
  const stagedForLinks = stagedIdFromUrl || offer.lifecycle.stagedListingId || "";
  const previewHref = viajesPublisherPreviewHref({
    lane: "private",
    stagedId: stagedForLinks,
    lang: lang === "en" ? "en" : "es",
  });
  const steps = useMemo(
    () =>
      lang === "en"
        ? ["The getaway", "Experience & photos", "Contact", "Review & publish"]
        : ["La escapada", "Experiencia y fotos", "Contacto", "Revisar y enviar"],
    [lang]
  );

  const onChangeOffer = useCallback((next: ViajesOfferModelV2) => {
    setOffer({
      ...next,
      lane: "private",
      locations: {
        ...next.locations,
        privateExact: { ...next.locations.privateExact, showPublicly: false, showMap: false },
      },
    });
  }, [setOffer]);

  const getBearerToken = useCallback(async () => {
    const sb = createSupabaseBrowserClient();
    const sess = await withAuthTimeout(sb.auth.getSession(), AUTH_CHECK_TIMEOUT_MS);
    return sess.data.session?.access_token ?? null;
  }, []);

  async function onSubmit() {
    setSubmitErr(null);
    if (isViajesPrivatePublishDisabled()) {
      setSubmitErr(lang === "en" ? "Private lane is temporarily closed." : "La vía privada está temporalmente cerrada.");
      return;
    }
    const issues = validateViajesOfferForSubmit(offer);
    if (issues.length) {
      setSubmitErr(issues[0]?.message || "validation_failed");
      setStep(Math.max(0, (issues[0]?.step ?? 1) - 1));
      return;
    }
    setSubmitBusy(true);
    try {
      const token = await getBearerToken();
      if (!token) {
        setSubmitErr(lang === "en" ? "Sign in required." : "Inicia sesión.");
        return;
      }
      const res = await fetch("/api/clasificados/viajes/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          lane: "private",
          lang: lang === "en" ? "en" : "es",
          offer,
          stagedListingId: stagedIdFromUrl || offer.lifecycle.stagedListingId || "",
        }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string; id?: string; slug?: string; lane?: string };
      if (!res.ok || !json.ok) {
        setSubmitErr(json.error || "submit_failed");
        return;
      }
      const id = (json.id || "").trim();
      const slug = (json.slug || "").trim();
      const respLane = (json.lane || "private").trim() || "private";
      if (!id || !slug) {
        setSubmitErr(lang === "en" ? "Submit succeeded but reference was incomplete." : "El envío se guardó pero faltó la referencia.");
        return;
      }
      router.push(
        viajesEnviadoSuccessHref({
          id,
          slug,
          lane: respLane,
          lang: lang === "en" ? "en" : "es",
        })
      );
    } catch {
      setSubmitErr(lang === "en" ? "Network error." : "Error de red.");
    } finally {
      setSubmitBusy(false);
    }
  }

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-[color:var(--lx-page)] text-[color:var(--lx-text)]">
        <Navbar />
        <p className="p-8 text-sm text-[color:var(--lx-muted)]">{lang === "en" ? "Loading draft…" : "Cargando borrador…"}</p>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen overflow-x-hidden pb-24 text-[color:var(--lx-text)]"
      style={{
        backgroundColor: "var(--lx-page)",
        backgroundImage: "radial-gradient(ellipse 120% 80% at 50% -20%, rgba(201, 180, 106, 0.14), transparent 55%)",
      }}
    >
      <Navbar />
      <div className="mx-auto flex max-w-3xl justify-end px-4 pb-2 pt-4 sm:px-6">
        <ViajesLangSwitch compact />
      </div>
      <div className="mx-auto max-w-3xl px-4 pb-8 pt-2 sm:px-6 sm:pt-4">
        <nav className="text-xs font-semibold text-[color:var(--lx-muted)]">
          <Link href={branchHref} className="hover:text-[color:var(--lx-text)]">
            ← {c.navBack}
          </Link>
        </nav>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-2xl font-bold text-[color:var(--lx-burgundy)] sm:text-3xl">
          {c.h1}
        </h1>
        <p className="mt-2 text-sm text-[color:var(--lx-muted)]">{c.intro}</p>

        <div className={`${CARD} mt-6`}>
          <ViajesPublisherStepper steps={steps} activeIndex={step} onStepClick={setStep} />
        </div>

        {stagedBootstrapErr ? (
          <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
            {stagedBootstrapErr}
          </p>
        ) : null}

        <div className={`${CARD} mt-4`}>
          {step === 0 ? <ViajesPrivadoStepGetaway offer={offer} onChange={onChangeOffer} lang={lang === "en" ? "en" : "es"} /> : null}
          {step === 1 ? (
            <ViajesPrivadoStepExperience
              offer={offer}
              onChange={onChangeOffer}
              lang={lang === "en" ? "en" : "es"}
              draftId={offer.id || stagedIdFromUrl || "privado-draft"}
              getBearerToken={getBearerToken}
            />
          ) : null}
          {step === 2 ? <ViajesPrivadoStepContact offer={offer} onChange={onChangeOffer} lang={lang === "en" ? "en" : "es"} /> : null}
          {step === 3 ? (
            <ViajesPrivadoStepReview offer={offer} onChange={onChangeOffer} lang={lang === "en" ? "en" : "es"} onGoStep={setStep} />
          ) : null}
        </div>

        {submitErr ? (
          <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
            {submitErr}
          </p>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-4 py-2 text-sm font-bold disabled:opacity-40"
            disabled={step <= 0}
            onClick={() => setStep((s) => Math.max(0, s - 1))}
          >
            {lang === "en" ? "Back" : "Atrás"}
          </button>
          {step < 3 ? (
            <button
              type="button"
              className="rounded-xl bg-[color:var(--lx-cta-dark)] px-4 py-2 text-sm font-bold text-[#FFFCF7]"
              onClick={() => setStep((s) => Math.min(3, s + 1))}
            >
              {lang === "en" ? "Continue" : "Continuar"}
            </button>
          ) : (
            <button
              type="button"
              className="rounded-xl bg-[color:var(--lx-cta-dark)] px-4 py-2 text-sm font-bold text-[#FFFCF7] disabled:opacity-50"
              disabled={submitBusy}
              onClick={() => void onSubmit()}
            >
              {submitBusy
                ? lang === "en"
                  ? "Submitting…"
                  : "Enviando…"
                : lang === "en"
                  ? "Submit for review"
                  : "Enviar a revisión"}
            </button>
          )}
          <Link href={previewHref} className="rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-4 py-2 text-sm font-bold">
            {lang === "en" ? "Open preview" : "Abrir vista previa"}
          </Link>
        </div>
      </div>
    </div>
  );
}
