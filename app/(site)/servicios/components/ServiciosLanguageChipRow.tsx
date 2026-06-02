"use client";

import { useSyncExternalStore } from "react";
import type { ServiciosLang } from "../types/serviciosBusinessProfile";
import {
  collectServiciosLanguageLabelsFromProfile,
  formatServiciosHeroLanguageDisplay,
  SERVICIOS_HERO_LANGUAGE_MAX_VISIBLE_DESKTOP,
  SERVICIOS_HERO_LANGUAGE_MAX_VISIBLE_MOBILE,
} from "../lib/serviciosLanguageChips";

function subscribeHeroLanguageCapMq(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {};
  const mq = window.matchMedia("(min-width: 640px)");
  const handler = () => onStoreChange();
  mq.addEventListener("change", handler);
  return () => mq.removeEventListener("change", handler);
}

function getHeroLanguageCapSnapshot(): number {
  if (typeof window === "undefined") return SERVICIOS_HERO_LANGUAGE_MAX_VISIBLE_MOBILE;
  return window.matchMedia("(min-width: 640px)").matches
    ? SERVICIOS_HERO_LANGUAGE_MAX_VISIBLE_DESKTOP
    : SERVICIOS_HERO_LANGUAGE_MAX_VISIBLE_MOBILE;
}

function useServiciosHeroLanguageCap(): number {
  return useSyncExternalStore(
    subscribeHeroLanguageCapMq,
    getHeroLanguageCapSnapshot,
    () => SERVICIOS_HERO_LANGUAGE_MAX_VISIBLE_MOBILE,
  );
}

type ServiciosLanguageChipRowProps = {
  profile: Parameters<typeof collectServiciosLanguageLabelsFromProfile>[0];
  lang: ServiciosLang;
  /** Fixed hero cap. Prefer `heroCap` for responsive mobile/desktop limits. */
  maxVisible?: number;
  /** Hero: 4 chips mobile / 6 desktop before +N overflow. */
  heroCap?: boolean;
  chipClassName: string;
  overflowClassName?: string;
  className?: string;
};

/** Shared language chip row — hero (capped) or profile (all labels). */
export function ServiciosLanguageChipRow({
  profile,
  lang,
  maxVisible,
  heroCap = false,
  chipClassName,
  overflowClassName,
  className = "flex flex-wrap items-center gap-1.5 min-w-0 max-w-full",
}: ServiciosLanguageChipRowProps) {
  const responsiveCap = useServiciosHeroLanguageCap();
  const labels = collectServiciosLanguageLabelsFromProfile(profile);
  if (labels.length === 0) return null;

  const cap = heroCap ? responsiveCap : maxVisible;
  const display =
    cap != null
      ? formatServiciosHeroLanguageDisplay(labels, lang, cap)
      : { visible: labels, overflowLabel: null };

  const hiddenLabels =
    cap != null && display.overflowLabel ? labels.slice(display.visible.length).join(", ") : "";

  return (
    <div className={className}>
      {display.visible.map((label) => (
        <span key={label} className={chipClassName}>
          {label}
        </span>
      ))}
      {display.overflowLabel ? (
        <span className={overflowClassName ?? chipClassName} title={hiddenLabels || undefined}>
          {display.overflowLabel}
        </span>
      ) : null}
    </div>
  );
}
