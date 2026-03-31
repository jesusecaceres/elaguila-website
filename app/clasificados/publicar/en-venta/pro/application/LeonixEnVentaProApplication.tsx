"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { saveEnVentaPreviewDraft } from "@/app/clasificados/en-venta/preview/enVentaPreviewDraft";
import {
  EN_VENTA_PUBLICAR_FREE,
  EN_VENTA_PUBLICAR_HUB,
} from "@/app/clasificados/en-venta/shared/constants/enVentaPublishRoutes";
import EnVentaPlanIntakeCallout from "@/app/clasificados/en-venta/shared/components/EnVentaPlanIntakeCallout";
import EnVentaPreviewBeforePublishCta from "@/app/clasificados/en-venta/publish/EnVentaPublishWizard";
import { EnVentaPublishSubmitBar } from "@/app/clasificados/en-venta/publish/EnVentaPublishSubmitBar";
import ListingRulesConfirmationSection from "@/app/clasificados/en-venta/shared/components/ListingRulesConfirmationSection";
import { CategorySelectionSection } from "../../free/application/sections/CategorySelectionSection";
import { BasicInfoSection } from "../../free/application/sections/BasicInfoSection";
import { ConditionSection } from "../../free/application/sections/ConditionSection";
import { PhotosSection } from "../../free/application/sections/PhotosSection";
import { LocationSection } from "../../free/application/sections/LocationSection";
import { FulfillmentSection } from "../../free/application/sections/FulfillmentSection";
import { SellerContactSection } from "../../free/application/sections/SellerContactSection";
import { ItemDetailsSection } from "../../free/application/sections/ItemDetailsSection";
import { createEmptyEnVentaProState } from "./schema/enVentaProFormState";

type Lang = "es" | "en";

/**
 * Pro lane — premium listing upgrade (`/clasificados/publicar/en-venta/pro`).
 * Business/storefront onboarding lives in the Storefront lane (coming soon).
 */
export default function LeonixEnVentaProApplication() {
  const searchParams = useSearchParams();
  const lang: Lang = searchParams?.get("lang") === "en" ? "en" : "es";
  const [state, setState] = useState(createEmptyEnVentaProState);

  const copy = useMemo(
    () =>
      lang === "es"
        ? {
            title: "Publicar — En Venta (Pro)",
            subtitle: "Anuncio premium: más fotos, video y mejor presentación por listado.",
            back: "Elegir plan",
            switchFree: "Cambiar a Gratis",
          }
        : {
            title: "Post — For Sale (Pro)",
            subtitle: "Premium listing: more photos, video, and stronger presentation per ad.",
            back: "Choose plan",
            switchFree: "Switch to Free",
          },
    [lang]
  );

  const qs = new URLSearchParams();
  qs.set("lang", lang);

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
              <Link
                href={`${EN_VENTA_PUBLICAR_HUB}?${qs.toString()}`}
                className="rounded-lg border border-[#D8C79A]/70 bg-[#FFFCF4] px-3 py-2 text-sm font-semibold text-[#3D2C12] hover:bg-[#FFF6E7]"
              >
                {copy.back}
              </Link>
              <Link
                href={`${EN_VENTA_PUBLICAR_FREE}?${qs.toString()}`}
                className="rounded-lg border border-[#B28A2F]/45 bg-[#B28A2F]/12 px-3 py-2 text-sm font-semibold text-[#6E4E18] hover:bg-[#B28A2F]/20"
              >
                {copy.switchFree}
              </Link>
            </div>
          </div>
        </div>

        <div className="mb-5">
          <EnVentaPlanIntakeCallout lang={lang} plan="pro" />
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
            allowVideo
          />
          <LocationSection lang={lang} state={state} setState={setState} />
          <FulfillmentSection lang={lang} state={state} setState={setState} />
          <SellerContactSection lang={lang} state={state} setState={setState} showSellerKind={false} />
          <ItemDetailsSection lang={lang} state={state} setState={setState} />
          <EnVentaPreviewBeforePublishCta
            lang={lang}
            onBeforePreview={(plan) => saveEnVentaPreviewDraft(plan, state)}
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
