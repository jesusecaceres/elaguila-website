"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
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
    <main className="min-h-screen bg-[#0f0f0f] text-[#F5F5F5] pt-28 pb-16">
      <div className="mx-auto max-w-2xl px-4">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-white">{copy.title}</h1>
            <p className="mt-2 text-[#C9B46A]">{copy.subtitle}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`${EN_VENTA_PUBLICAR_HUB}?${qs.toString()}`}
              className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm font-semibold text-white hover:bg-white/10"
            >
              {copy.back}
            </Link>
            <Link
              href={`${EN_VENTA_PUBLICAR_FREE}?${qs.toString()}`}
              className="rounded-xl border border-[#C9B46A]/40 bg-[#C9B46A]/15 px-3 py-2 text-sm font-semibold text-[#111111] hover:bg-[#C9B46A]/25"
            >
              {copy.switchFree}
            </Link>
          </div>
        </div>

        <div className="mb-6">
          <EnVentaPlanIntakeCallout lang={lang} plan="pro" />
        </div>

        <div className="space-y-6 [&_section]:border-white/10 [&_section]:bg-[#1a1a1a] [&_h2]:text-white [&_label]:text-white/55 [&_input]:border-white/15 [&_input]:bg-[#111111] [&_input]:text-white [&_select]:border-white/15 [&_select]:bg-[#111111] [&_select]:text-white [&_textarea]:border-white/15 [&_textarea]:bg-[#111111] [&_textarea]:text-white [&_p]:text-white/65">
          <CategorySelectionSection lang={lang} state={state} setState={setState} />
          <BasicInfoSection lang={lang} state={state} setState={setState} />
          <ConditionSection lang={lang} state={state} setState={setState} />
          <PhotosSection
            lang={lang}
            state={state}
            setState={setState}
            maxPhotos={12}
            allowVideo
            surface="dark"
          />
          <LocationSection lang={lang} state={state} setState={setState} />
          <FulfillmentSection lang={lang} state={state} setState={setState} />
          <SellerContactSection lang={lang} state={state} setState={setState} showSellerKind={false} />
          <ItemDetailsSection lang={lang} state={state} setState={setState} />
          <EnVentaPreviewBeforePublishCta lang={lang} variant="dark" />
          <ListingRulesConfirmationSection
            lang={lang}
            variant="dark"
            confirmAccurate={state.confirmListingAccurate}
            confirmPhotos={state.confirmPhotosRepresentItem}
            confirmRules={state.confirmCommunityRules}
            onAccurate={(v) => setState((s) => ({ ...s, confirmListingAccurate: v }))}
            onPhotos={(v) => setState((s) => ({ ...s, confirmPhotosRepresentItem: v }))}
            onRules={(v) => setState((s) => ({ ...s, confirmCommunityRules: v }))}
          />
        </div>

        <p className="mt-8 text-center text-xs text-white/45">{copy.draft}</p>
      </div>
    </main>
  );
}
