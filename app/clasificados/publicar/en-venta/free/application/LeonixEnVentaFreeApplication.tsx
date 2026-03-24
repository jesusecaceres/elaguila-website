"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import {
  EN_VENTA_PUBLICAR_HUB,
  EN_VENTA_PUBLICAR_PRO,
} from "@/app/clasificados/en-venta/shared/constants/enVentaPublishRoutes";
import EnVentaPlanIntakeCallout from "@/app/clasificados/en-venta/shared/components/EnVentaPlanIntakeCallout";
import EnVentaPreviewBeforePublishCta from "@/app/clasificados/en-venta/publish/EnVentaPublishWizard";
import ListingRulesConfirmationSection from "@/app/clasificados/en-venta/shared/components/ListingRulesConfirmationSection";
import { createEmptyEnVentaFreeState } from "./schema/enVentaFreeFormState";
import { CategorySelectionSection } from "./sections/CategorySelectionSection";
import { BasicInfoSection } from "./sections/BasicInfoSection";
import { ConditionSection } from "./sections/ConditionSection";
import { PhotosSection } from "./sections/PhotosSection";
import { LocationSection } from "./sections/LocationSection";
import { FulfillmentSection } from "./sections/FulfillmentSection";
import { SellerContactSection } from "./sections/SellerContactSection";
import { ItemDetailsSection } from "./sections/ItemDetailsSection";

type Lang = "es" | "en";

/**
 * Free lane — real form owner for `/clasificados/publicar/en-venta/free`.
 */
export default function LeonixEnVentaFreeApplication() {
  const searchParams = useSearchParams();
  const lang: Lang = searchParams?.get("lang") === "en" ? "en" : "es";
  const [state, setState] = useState(createEmptyEnVentaFreeState);

  const copy = useMemo(
    () =>
      lang === "es"
        ? {
            title: "Publicar — En Venta (Gratis)",
            subtitle: "Flujo rápido para vendedores particulares.",
            back: "Elegir plan",
            switchPro: "Cambiar a Pro",
            draft: "Borrador guardado localmente en tu navegador (próximo paso: publicar).",
          }
        : {
            title: "Post — For Sale (Free)",
            subtitle: "Fast path for casual sellers.",
            back: "Choose plan",
            switchPro: "Switch to Pro",
            draft: "Draft stays in this browser until publish is wired.",
          },
    [lang]
  );

  const qs = new URLSearchParams();
  qs.set("lang", lang);

  return (
    <main className="min-h-screen bg-[#D9D9D9] text-[#111111] pt-28 pb-16">
      <div className="mx-auto max-w-2xl px-4">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-[#111111]">{copy.title}</h1>
            <p className="mt-2 text-[#111111]/75">{copy.subtitle}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`${EN_VENTA_PUBLICAR_HUB}?${qs.toString()}`}
              className="rounded-xl border border-black/15 bg-white px-3 py-2 text-sm font-semibold text-[#111111] hover:bg-[#EFEFEF]"
            >
              {copy.back}
            </Link>
            <Link
              href={`${EN_VENTA_PUBLICAR_PRO}?${qs.toString()}`}
              className="rounded-xl border border-black/15 bg-[#111111] px-3 py-2 text-sm font-semibold text-[#F5F5F5] hover:bg-black/90"
            >
              {copy.switchPro}
            </Link>
          </div>
        </div>

        <div className="mb-6">
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
          <SellerContactSection lang={lang} state={state} setState={setState} showSellerKind={false} />
          <ItemDetailsSection lang={lang} state={state} setState={setState} />
          <EnVentaPreviewBeforePublishCta lang={lang} variant="light" />
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

        <p className="mt-8 text-center text-xs text-[#111111]/55">{copy.draft}</p>
      </div>
    </main>
  );
}
