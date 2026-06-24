import type { SupportedLang } from "@/app/lib/language";
import {
  ADVERTISE_DROPDOWN_COPY,
  type AdvertiseLane,
} from "@/app/lib/advertiseDropdownConfig";

/** Advertise dropdown labels remain es/en; route lang is preserved in hrefs. */
export function magazineReaderAdvertiseCopyLang(routeLang: SupportedLang): "es" | "en" {
  return routeLang === "en" ? "en" : "es";
}

function appendRouteLang(path: string, routeLang: SupportedLang): string {
  const [base, hash] = path.split("#");
  const joiner = base.includes("?") ? "&" : "?";
  const withParam = `${base}${joiner}lang=${routeLang}`;
  return hash ? `${withParam}#${hash}` : withParam;
}

function buildClasificadosHref(routeLang: SupportedLang): string {
  const redirect = encodeURIComponent(`/clasificados/publicar?lang=${routeLang}`);
  return `/login?mode=post&lang=${routeLang}&redirect=${redirect}`;
}

function buildLaneHref(lane: AdvertiseLane, routeLang: SupportedLang): string {
  switch (lane) {
    case "clasificados":
      return buildClasificadosHref(routeLang);
    case "negocios-locales":
      return appendRouteLang("/negocios-locales", routeLang);
    case "recursos-comunitarios":
      return appendRouteLang("/recursos-comunitarios", routeLang);
  }
}

export type MagazineReaderAdvertiseOption = {
  id: AdvertiseLane;
  label: string;
  href: string;
};

export function getMagazineReaderAdvertiseOptions(
  routeLang: SupportedLang,
): MagazineReaderAdvertiseOption[] {
  const copy = ADVERTISE_DROPDOWN_COPY[magazineReaderAdvertiseCopyLang(routeLang)];
  return [
    {
      id: "clasificados",
      label: copy.clasificados,
      href: buildLaneHref("clasificados", routeLang),
    },
    {
      id: "negocios-locales",
      label: copy.negociosLocales,
      href: buildLaneHref("negocios-locales", routeLang),
    },
    {
      id: "recursos-comunitarios",
      label: copy.recursosComunitarios,
      href: buildLaneHref("recursos-comunitarios", routeLang),
    },
  ];
}

export function getMagazineReaderAdvertiseCopy(routeLang: SupportedLang) {
  return ADVERTISE_DROPDOWN_COPY[magazineReaderAdvertiseCopyLang(routeLang)];
}
