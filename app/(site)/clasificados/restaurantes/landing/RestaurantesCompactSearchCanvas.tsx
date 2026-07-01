"use client";

import type { FormEventHandler, ReactNode } from "react";
import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { buildRestaurantesResultsHref } from "@/app/clasificados/restaurantes/lib/restaurantesDiscoveryContract";import { LeonixLocalBusinessCompactSearchCanvas } from "@/app/(site)/clasificados/shared/components/LeonixLocalBusinessCompactSearchCanvas";
import {
  LEONIX_LB_DEFAULT_COUNTRY,
  LEONIX_LB_DEFAULT_STATE,
} from "@/app/(site)/clasificados/shared/constants/leonixLocalBusinessLocationContract";

type Props = {
  lang: Lang;
  defaultQ?: string;
  defaultCity?: string;
  defaultState?: string;
  defaultZip?: string;
  defaultCountry?: string;
  onSubmitCapture?: FormEventHandler<HTMLFormElement>;
  secondRow?: ReactNode;
  showBrowseAll?: boolean;
};

export function RestaurantesCompactSearchCanvas({
  lang,
  defaultQ = "",
  defaultCity = "",
  defaultState = LEONIX_LB_DEFAULT_STATE,
  defaultZip = "",
  defaultCountry = LEONIX_LB_DEFAULT_COUNTRY,
  onSubmitCapture,
  secondRow,
  showBrowseAll = true,
}: Props) {
  const resultsHref = buildRestaurantesResultsHref(lang, {});

  const handleCapture: FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    onSubmitCapture?.(e);
  };

  return (
    <LeonixLocalBusinessCompactSearchCanvas
      lang={lang}
      routeLang={lang}
      action={resultsHref}
      method="get"
      onSubmit={onSubmitCapture ? handleCapture : undefined}
      onSubmitCapture={onSubmitCapture ? undefined : onSubmitCapture}
      defaultQ={defaultQ}
      defaultCity={defaultCity}
      defaultState={defaultState}
      defaultZip={defaultZip}
      defaultCountry={defaultCountry}
      keywordPlaceholder={lang === "es" ? "Restaurante, cocina o platillo…" : "Restaurant, cuisine, or dish…"}
      searchButtonLabel={lang === "es" ? "Buscar" : "Search"}
      filtersHref={resultsHref}
      browseAllHref={showBrowseAll ? resultsHref : undefined}
      browseAllLabel={lang === "es" ? "Ver todos los anuncios" : "View all listings"}
      cityDatalistId="restaurantes-city-presets"
      secondRow={secondRow}
    />
  );
}
