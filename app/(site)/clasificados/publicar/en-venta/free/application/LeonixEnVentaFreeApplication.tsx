"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useLayoutEffect, useMemo, useState } from "react";
import {
  saveEnVentaPreviewDraft,
  saveEnVentaPreviewReturnDraft,
  takeEnVentaPreviewReturnInitialState,
} from "@/app/clasificados/en-venta/preview/enVentaPreviewDraft";
import {
  EN_VENTA_PUBLICAR_HUB,
  EN_VENTA_PUBLICAR_PRO,
} from "@/app/clasificados/en-venta/shared/constants/enVentaPublishRoutes";
import {
  abandonLeonixPublishFlowClient,
  collectMuxAssetIdsFromEnVentaState,
  confirmLeavePublishFlow,
  enVentaFormHasProgress,
  markPublishFlowOpeningPreview,
  useLeonixPublishLeaveGuard,
} from "@/app/clasificados/lib/publishFlowLifecycleClient";
import EnVentaPlanIntakeCallout from "@/app/clasificados/en-venta/shared/components/EnVentaPlanIntakeCallout";
import EnVentaPreviewBeforePublishCta from "@/app/clasificados/en-venta/publish/EnVentaPublishWizard";
import { EnVentaPublishSubmitBar } from "@/app/clasificados/en-venta/publish/EnVentaPublishSubmitBar";
import ListingRulesConfirmationSection from "@/app/clasificados/en-venta/shared/components/ListingRulesConfirmationSection";
import { CategorySelectionSection } from "./sections/CategorySelectionSection";
import { BasicInfoSection } from "./sections/BasicInfoSection";
import { ConditionSection } from "./sections/ConditionSection";
import { PhotosSection } from "./sections/PhotosSection";
import { LocationSection } from "./sections/LocationSection";
import { FulfillmentSection } from "./sections/FulfillmentSection";
import { SellerContactSection } from "./sections/SellerContactSection";
import { ItemDetailsSection } from "./sections/ItemDetailsSection";
import { createEmptyEnVentaFreeState } from "./schema/enVentaFreeFormState";

type Lang = "es" | "en";

/**
 * Free lane — real form owner for `/clasificados/publicar/en-venta/free`.
 */
export default function LeonixEnVentaFreeApplication() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const lang: Lang = searchParams?.get("lang") === "en" ? "en" : "es";
  const [state, setState] = useState(createEmptyEnVentaFreeState);

  useLayoutEffect(() => {
    setState(takeEnVentaPreviewReturnInitialState("free"));
  }, []);

  const copy = useMemo(
    () =>
      lang === "es"
        ? {
            title: "Publicar — En Venta (Gratis)",
            subtitle: "Flujo rápido para vendedores particulares.",
            back: "Elegir plan",
            switchPro: "Cambiar a Pro",
          }
        : {
            title: "Post — For Sale (Free)",
            subtitle: "Fast path for casual sellers.",
            back: "Choose plan",
            switchPro: "Switch to Pro",
          },
    [lang]
  );

  const qs = new URLSearchParams();
  qs.set("lang", lang);

  const isDirty = enVentaFormHasProgress(state);
  const muxIds = collectMuxAssetIdsFromEnVentaState(state);

  useLeonixPublishLeaveGuard({
    lang,
    isDirty,
    muxAssetIds: muxIds,
  });

  const leaveAndGo = useCallback(
    (href: string) => {
      if (!isDirty || confirmLeavePublishFlow(lang)) {
        abandonLeonixPublishFlowClient({ muxAssetIds: muxIds, useBeacon: false });
        router.push(href);
      }
    },
    [isDirty, lang, muxIds, router]
  );

  const onBeforePreview = useCallback(
    (plan: "free" | "pro") => {
      if (plan !== "free") return;
      markPublishFlowOpeningPreview();
      saveEnVentaPreviewDraft("free", state);
      saveEnVentaPreviewReturnDraft("free", state);
    },
    [state]
  );

  return (
    <main
      className="min-h-screen bg-[#F6F0E2] text-[#3D2C12] pt-28 pb-16"
      data-testid="ev-free-publish-root"
    >
      <div className="mx-auto max-w-2xl px-4">
        <div className="mb-5 rounded-2xl border border-[#D8C79A]/70 bg-[#FFFCF4] p-4 shadow-[0_8px_22px_rgba(113,84,22,0.08)] sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h1 className="text-3xl font-extrabold text-[#3D2C12]">{copy.title}</h1>
              <p className="mt-1.5 text-[#5D4A25]/80">{copy.subtitle}</p>
            </div>
            <div className="inline-flex w-fit flex-wrap items-center gap-2 rounded-xl border border-[#D8C79A]/65 bg-[#FFF7E7] p-1.5 shadow-sm">
              <button
                type="button"
                className="rounded-lg border border-[#D8C79A]/70 bg-[#FFFCF4] px-3 py-2 text-sm font-semibold text-[#3D2C12] hover:bg-[#FFF6E7]"
                onClick={() => leaveAndGo(`${EN_VENTA_PUBLICAR_HUB}?${qs.toString()}`)}
              >
                {copy.back}
              </button>
              <button
                type="button"
                className="rounded-lg border border-[#B28A2F]/45 bg-[#B28A2F]/12 px-3 py-2 text-sm font-semibold text-[#6E4E18] hover:bg-[#B28A2F]/20"
                onClick={() => leaveAndGo(`${EN_VENTA_PUBLICAR_PRO}?${qs.toString()}`)}
              >
                {copy.switchPro}
              </button>
            </div>
          </div>
        </div>

        <div className="mb-5">
          <EnVentaPlanIntakeCallout lang={lang} plan="free" />
        </div>

        <div className="space-y-6">
          <CategorySelectionSection lang={lang} state={state} setState={setState} />
          <BasicInfoSection lang={lang} state={state} setState={setState} />
          <ConditionSection lang={lang} state={state} setState={setState} />
          <PhotosSection
            lang={lang}
            state={state}
            setState={setState}
            maxPhotos={3}
            allowVideo={false}
          />
          <LocationSection lang={lang} state={state} setState={setState} />
          <FulfillmentSection lang={lang} state={state} setState={setState} />
          <SellerContactSection lang={lang} state={state} setState={setState} showSellerKind />
          <ItemDetailsSection lang={lang} state={state} setState={setState} />
          <EnVentaPreviewBeforePublishCta lang={lang} variant="light" onBeforePreview={onBeforePreview} />
          <ListingRulesConfirmationSection
            lang={lang}
            confirmAccurate={state.confirmListingAccurate}
            confirmPhotos={state.confirmPhotosRepresentItem}
            confirmRules={state.confirmCommunityRules}
            onAccurate={(v) => setState((s) => ({ ...s, confirmListingAccurate: v }))}
            onPhotos={(v) => setState((s) => ({ ...s, confirmPhotosRepresentItem: v }))}
            onRules={(v) => setState((s) => ({ ...s, confirmCommunityRules: v }))}
          />
          <EnVentaPublishSubmitBar lang={lang} plan="free" state={state} />
        </div>
      </div>
    </main>
  );
}
