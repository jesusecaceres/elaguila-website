"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useLayoutEffect, useMemo, useState } from "react";
import {
  isEnVentaPublishResumeRequested,
  persistEnVentaPreviewHandoffAsync,
  resolveEnVentaPublishFormInitialState,
} from "@/app/clasificados/en-venta/preview/enVentaPreviewDraft";
const EN_VENTA_LANDING = "/clasificados/en-venta";
import { enVentaPublicLabel } from "@/app/clasificados/en-venta/shared/constants/enVentaPublicLabels";
import {
  clearLeonixReturningToEditSessionFlag,
  enVentaFormHasProgress,
} from "@/app/clasificados/lib/publishFlowLifecycleClient";
import EnVentaPlanIntakeCallout from "@/app/clasificados/en-venta/shared/components/EnVentaPlanIntakeCallout";
import EnVentaPreviewBeforePublishCta from "@/app/clasificados/en-venta/publish/EnVentaPublishWizard";
import { EnVentaPublishSubmitBar } from "@/app/clasificados/en-venta/publish/EnVentaPublishSubmitBar";
import {
  confirmLeaveEnVentaPublishFlow,
  EN_VENTA_AUTOSAVE_COPY,
  useEnVentaFormAutosave,
} from "@/app/clasificados/en-venta/publish/useEnVentaFormAutosave";
import { useEnVentaPublishLeaveGuard } from "@/app/clasificados/en-venta/publish/useEnVentaPublishLeaveGuard";
import { collectEnVentaCoreBlockers } from "@/app/clasificados/en-venta/publish/enVentaPublishValidation";
import ListingRulesConfirmationSection from "@/app/clasificados/en-venta/shared/components/ListingRulesConfirmationSection";
import { CategorySelectionSection } from "../../free/application/sections/CategorySelectionSection";
import { BasicInfoSection } from "../../free/application/sections/BasicInfoSection";
import { ConditionSection } from "../../free/application/sections/ConditionSection";
import { EnVentaExternalVideoUrlsSection } from "../../free/application/sections/EnVentaExternalVideoUrlsSection";
import { PhotosSection } from "../../free/application/sections/PhotosSection";
import { LocationSection } from "../../free/application/sections/LocationSection";
import { FulfillmentSection } from "../../free/application/sections/FulfillmentSection";
import { SellerContactSection } from "../../free/application/sections/SellerContactSection";
import { ItemDetailsSection } from "../../free/application/sections/ItemDetailsSection";
import { evaluateEnVentaFamilySafetyFromState } from "@/app/clasificados/en-venta/moderation/enVentaFamilySafety";
import { createEmptyEnVentaFreeState } from "../../free/application/schema/enVentaFreeFormState";

type Lang = "es" | "en";

/**
 * Varios publish application (`/clasificados/publicar/en-venta/pro`).
 */
export default function LeonixEnVentaProApplication() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const lang: Lang = searchParams?.get("lang") === "en" ? "en" : "es";
  const resumeRequested = isEnVentaPublishResumeRequested(searchParams?.get("resume"));
  const [state, setState] = useState(createEmptyEnVentaFreeState);
  const [familySafetyMsg, setFamilySafetyMsg] = useState<string | null>(null);

  useLayoutEffect(() => {
    clearLeonixReturningToEditSessionFlag();
    let cancelled = false;
    void resolveEnVentaPublishFormInitialState("pro", resumeRequested).then((next) => {
      if (!cancelled) setState(next);
    });
    return () => {
      cancelled = true;
    };
  }, [resumeRequested]);

  const previewBlockers = useMemo(() => collectEnVentaCoreBlockers(lang, state), [lang, state]);

  const copy = useMemo(
    () =>
      lang === "es"
        ? {
            title: `Publicar — ${enVentaPublicLabel("es")}`,
            subtitle:
              "Anuncio incluido sin costo. Publica con fotos, video opcional y opciones de contacto. Sin pago. Sin comisión.",
            back: `Volver a ${enVentaPublicLabel("es")}`,
          }
        : {
            title: `Post — ${enVentaPublicLabel("en")}`,
            subtitle:
              "For Sale listing included at no cost. Post with photos, optional video, and contact options. No payment. No commission.",
            back: `Back to ${enVentaPublicLabel("en")}`,
          },
    [lang]
  );

  const qs = new URLSearchParams();
  qs.set("lang", lang);

  const isDirty = enVentaFormHasProgress(state);

  useEnVentaFormAutosave("pro", state, lang);
  useEnVentaPublishLeaveGuard({ lang, plan: "pro", isDirty, state });

  const leaveAndGo = useCallback(
    (href: string) => {
      if (!isDirty || confirmLeaveEnVentaPublishFlow(lang)) {
        router.push(href);
      }
    },
    [isDirty, lang, router]
  );

  const onBeforePreview = useCallback(
    async (clickedPlan: "free" | "pro") => {
      const safety = evaluateEnVentaFamilySafetyFromState(state, lang);
      if (safety.status !== "safe") {
        setFamilySafetyMsg(safety.userMessage);
        throw new Error("en-venta-family-safety-block");
      }
      setFamilySafetyMsg(null);
      const saved = await persistEnVentaPreviewHandoffAsync(clickedPlan, state);
      if (!saved) {
        throw new Error("en-venta-preview-draft-save-failed");
      }
    },
    [state, lang]
  );

  return (
    <main className="min-h-screen bg-[#F6F0E2] text-[#3D2C12] pt-28 pb-16">
      <div className="mx-auto max-w-2xl px-4">
        <div className="mb-5 rounded-2xl border border-[#D8C79A]/70 bg-[#FFFCF4] p-4 shadow-[0_8px_22px_rgba(113,84,22,0.08)] sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h1 className="text-3xl font-extrabold text-[#3D2C12]">{copy.title}</h1>
              <p className="mt-1.5 text-[#6E4E18]">{copy.subtitle}</p>
            </div>
            <div className="inline-flex w-fit flex-wrap items-center gap-2 rounded-xl border border-[#D8C79A]/65 bg-[#FFF7E7] p-1.5 shadow-sm">
              <button
                type="button"
                className="rounded-lg border border-[#D8C79A]/70 bg-[#FFFCF4] px-3 py-2 text-sm font-semibold text-[#3D2C12] hover:bg-[#FFF6E7]"
                onClick={() => leaveAndGo(`${EN_VENTA_LANDING}?${qs.toString()}`)}
              >
                {copy.back}
              </button>
            </div>
          </div>
        </div>

        <div className="mb-5">
          <EnVentaPlanIntakeCallout lang={lang} plan="pro" />
        </div>

        <div
          className="mb-5 rounded-2xl border border-[#C9B46A]/35 bg-[#FBF7EF] px-4 py-3 text-xs leading-relaxed text-[#5C5346]"
          role="status"
        >
          <p className="font-semibold text-[#3D2C12]">{EN_VENTA_AUTOSAVE_COPY[lang].title}</p>
          <p className="mt-1">{EN_VENTA_AUTOSAVE_COPY[lang].body}</p>
        </div>

        <div className="space-y-6 [&_section]:border-[#E5D6B0] [&_section]:bg-[#FFFCF4] [&_h2]:text-[#3D2C12] [&_label]:text-[#5D4A25]/80 [&_input]:border-[#DCCAA0] [&_input]:bg-white [&_input]:text-[#3D2C12] [&_select]:border-[#DCCAA0] [&_select]:bg-white [&_select]:text-[#3D2C12] [&_textarea]:border-[#DCCAA0] [&_textarea]:bg-white [&_textarea]:text-[#3D2C12] [&_p]:text-[#5D4A25]/80">
          <CategorySelectionSection lang={lang} state={state} setState={setState} />
          <BasicInfoSection lang={lang} state={state} setState={setState} />
          <ConditionSection lang={lang} state={state} setState={setState} />
          <PhotosSection
            lang={lang}
            state={state}
            setState={setState}
            maxPhotos={12}
            allowVideo={false}
          />
          <EnVentaExternalVideoUrlsSection lang={lang} state={state} setState={setState} />
          <LocationSection lang={lang} state={state} setState={setState} />
          <FulfillmentSection lang={lang} state={state} setState={setState} />
          <SellerContactSection lang={lang} state={state} setState={setState} showSellerKind />
          <ItemDetailsSection lang={lang} state={state} setState={setState} />
          {familySafetyMsg ? (
            <p className="text-sm font-medium text-red-800" role="alert" data-testid="ev-family-safety-preview">
              {familySafetyMsg}
            </p>
          ) : null}
          <EnVentaPreviewBeforePublishCta
            lang={lang}
            onBeforePreview={onBeforePreview}
            previewBlockers={previewBlockers}
          />
          <ListingRulesConfirmationSection
            lang={lang}
            confirmAccurate={state.confirmListingAccurate}
            confirmPhotos={state.confirmPhotosRepresentItem}
            confirmRules={state.confirmCommunityRules}
            onAccurate={(v) => setState((s) => ({ ...s, confirmListingAccurate: v }))}
            onPhotos={(v) => setState((s) => ({ ...s, confirmPhotosRepresentItem: v }))}
            onRules={(v) => setState((s) => ({ ...s, confirmCommunityRules: v }))}
          />
          <EnVentaPublishSubmitBar lang={lang} plan="pro" state={state} />
        </div>
      </div>
    </main>
  );
}
