"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { saveEnVentaPreviewDraft } from "@/app/clasificados/en-venta/preview/enVentaPreviewDraft";
import {
  EN_VENTA_PUBLICAR_FREE,
  EN_VENTA_PUBLICAR_HUB,
} from "@/app/clasificados/en-venta/shared/constants/enVentaPublishRoutes";
import EnVentaPlanIntakeCallout from "@/app/clasificados/en-venta/shared/components/EnVentaPlanIntakeCallout";
import EnVentaPreviewBeforePublishCta from "@/app/clasificados/en-venta/publish/EnVentaPublishWizard";
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

  useEffect(() => {
    const t = window.setTimeout(() => saveEnVentaPreviewDraft("pro", state), 350);
    return () => window.clearTimeout(t);
  }, [state]);

  const copy = useMemo(
    () =>
      lang === "es"
        ? {
            title: "Publicar — En Venta (Pro)",
            subtitle: "Anuncio premium: más fotos, video y mejor presentación por listado.",
            back: "Elegir plan",
            switchFree: "Cambiar a Gratis",
            draft: "Borrador local en el navegador; publicación y pagos se conectan después.",
          }
        : {
            title: "Post — For Sale (Pro)",
            subtitle: "Premium listing: more photos, video, and stronger presentation per ad.",
            back: "Choose plan",
            switchFree: "Switch to Free",
            draft: "Local browser draft; publish and billing hook up later.",
          },
    [lang]
  );

  const qs = new URLSearchParams();
  qs.set("lang", lang);

  return (
    <main className="min-h-screen bg-[#F6F0E2] text-[#3D2C12] pt-28 pb-16">
      <div className="mx-auto max-w-2xl px-4">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-[#3D2C12]">{copy.title}</h1>
            <p className="mt-2 text-[#6E4E18]">{copy.subtitle}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`${EN_VENTA_PUBLICAR_HUB}?${qs.toString()}`}
              className="rounded-xl border border-[#D8C79A]/70 bg-[#FFFCF4] px-3 py-2 text-sm font-semibold text-[#3D2C12] hover:bg-[#FFF6E7]"
            >
              {copy.back}
            </Link>
            <Link
              href={`${EN_VENTA_PUBLICAR_FREE}?${qs.toString()}`}
              className="rounded-xl border border-[#B28A2F]/45 bg-[#B28A2F]/12 px-3 py-2 text-sm font-semibold text-[#6E4E18] hover:bg-[#B28A2F]/20"
            >
              {copy.switchFree}
            </Link>
          </div>
        </div>

        <div className="mb-6">
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
          <EnVentaPreviewBeforePublishCta lang={lang} />
          <ListingRulesConfirmationSection
            lang={lang}
            confirmAccurate={state.confirmListingAccurate}
            confirmPhotos={state.confirmPhotosRepresentItem}
            confirmRules={state.confirmCommunityRules}
            onAccurate={(v) => setState((s) => ({ ...s, confirmListingAccurate: v }))}
            onPhotos={(v) => setState((s) => ({ ...s, confirmPhotosRepresentItem: v }))}
            onRules={(v) => setState((s) => ({ ...s, confirmCommunityRules: v }))}
          />
        </div>

        <p className="mt-8 text-center text-xs text-[#5D4A25]/70">{copy.draft}</p>
      </div>
    </main>
  );
}
