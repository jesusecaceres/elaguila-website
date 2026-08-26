"use client";

import { FiCheck } from "react-icons/fi";
import type {
  AdBrandBackgroundId,
  AdBrandShadeId,
  AdBrandThemeId,
  AdBrandingProfile,
  LogoPresentationId,
} from "@/app/lib/adBranding";
import {
  AD_BRAND_THEMES,
  applyAdBrandBackgroundSelection,
  applyAdBrandLogoPresentationSelection,
  applyAdBrandShadeSelection,
  applyAdBrandThemeSelection,
} from "@/app/lib/adBranding";
import { LX } from "@/app/(site)/servicios/components/serviciosLeonixBrand";
import type { ServiciosLang } from "../lib/clasificadosServiciosApplicationTypes";
import {
  SERVICIOS_AD_BRANDING_PANEL_COPY,
  SERVICIOS_AD_BRANDING_SECTION_LABELS,
  SERVICIOS_AD_BRAND_BACKGROUND_COPY,
  SERVICIOS_AD_BRAND_DEFAULT_OPTION_COPY,
  SERVICIOS_AD_BRAND_LOGO_PRESENTATION_COPY,
  SERVICIOS_AD_BRAND_SHADE_COPY,
  SERVICIOS_AD_BRAND_THEME_COPY,
} from "../lib/serviciosAdBrandingCopy";

/**
 * Leonix Ad Branding Layer (Gate 2D) — Servicios owner-facing branding controls.
 *
 * A bounded picker, not a design tool: every option here is one of the fixed, pre-approved
 * values from `app/lib/adBranding` — no free text, no hex input, no layout control. Selecting
 * a theme/shade/background/logo presentation updates `state.adBranding` through the same
 * update helpers the global contract exports, so an invalid theme+background combination can
 * never be produced. The change flows into the existing draft state the application already
 * persists (Gate 2A) and the existing preview/hero/results-card renderers already consume
 * (Gates 2B/2C) — this panel renders no preview of its own.
 */

const THEME_IDS: readonly AdBrandThemeId[] = ["lion-heritage", "savannah-trust", "sunset-comunidad", "black-lion-premium"];
const SHADE_IDS: readonly AdBrandShadeId[] = ["light", "standard", "deep"];
const LOGO_PRESENTATION_IDS: readonly LogoPresentationId[] = ["boxed", "circular", "banner"];

function OptionButton({
  selected,
  onClick,
  ariaLabel,
  children,
  className = "",
}: {
  selected: boolean;
  onClick: () => void;
  ariaLabel: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      aria-label={ariaLabel}
      className={`flex min-h-[44px] items-center gap-2 rounded-xl border-2 px-3 py-2 text-left text-sm font-semibold text-[#3B2117] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84A]/70 focus-visible:ring-offset-1 ${
        selected ? "border-[#7A1E2C] bg-[#7A1E2C]/[0.06] shadow-sm" : "border-[#D8C79A]/70 bg-white hover:border-[#C9A84A]"
      } ${className}`.trim()}
    >
      <span className="flex h-4 w-4 shrink-0 items-center justify-center" aria-hidden>
        {selected ? <FiCheck className="h-4 w-4" style={{ color: LX.burgundy }} /> : null}
      </span>
      {children}
    </button>
  );
}

function ThemeSwatch({ themeId }: { themeId: AdBrandThemeId }) {
  const colors = AD_BRAND_THEMES[themeId].shades.standard;
  return (
    <span className="flex shrink-0 -space-x-1" aria-hidden>
      <span className="h-4 w-4 rounded-full border border-white/70 shadow-sm" style={{ backgroundColor: colors.primary }} />
      <span className="h-4 w-4 rounded-full border border-white/70 shadow-sm" style={{ backgroundColor: colors.secondary }} />
      <span className="h-4 w-4 rounded-full border border-white/70 shadow-sm" style={{ backgroundColor: colors.accent }} />
    </span>
  );
}

export function ServiciosAdBrandingPanel({
  adBranding,
  onChange,
  lang,
}: {
  adBranding: AdBrandingProfile | null;
  onChange: (next: AdBrandingProfile | null) => void;
  lang: ServiciosLang;
}) {
  const panelCopy = SERVICIOS_AD_BRANDING_PANEL_COPY[lang];
  const sectionLabels = SERVICIOS_AD_BRANDING_SECTION_LABELS[lang];
  const defaultCopy = SERVICIOS_AD_BRAND_DEFAULT_OPTION_COPY[lang];

  const selectTheme = (themeId: AdBrandThemeId) => onChange(applyAdBrandThemeSelection(adBranding, themeId));
  const selectShade = (shadeId: AdBrandShadeId) => {
    if (!adBranding) return;
    onChange(applyAdBrandShadeSelection(adBranding, shadeId));
  };
  const selectBackground = (backgroundId: AdBrandBackgroundId) => {
    if (!adBranding) return;
    onChange(applyAdBrandBackgroundSelection(adBranding, backgroundId));
  };
  const selectLogoPresentation = (presentation: LogoPresentationId) => {
    if (!adBranding) return;
    onChange(applyAdBrandLogoPresentationSelection(adBranding, presentation));
  };

  return (
    <div className="mt-10 border-t border-[#D8C79A]/30 pt-8">
      <p className="text-sm font-semibold text-neutral-800">{panelCopy.title}</p>
      <p className="mt-1 max-w-xl text-xs leading-relaxed text-[#6b5c42]">{panelCopy.intro}</p>

      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <OptionButton selected={!adBranding} onClick={() => onChange(null)} ariaLabel={defaultCopy.label} className="sm:min-w-[11rem]">
          <span className="flex min-w-0 flex-col">
            <span className="truncate">{defaultCopy.label}</span>
            <span className="truncate text-xs font-normal text-[#6b5c42]">{defaultCopy.descriptor}</span>
          </span>
        </OptionButton>
        {THEME_IDS.map((themeId) => {
          const copy = SERVICIOS_AD_BRAND_THEME_COPY[themeId][lang];
          const selected = adBranding?.themeId === themeId;
          return (
            <OptionButton
              key={themeId}
              selected={selected}
              onClick={() => selectTheme(themeId)}
              ariaLabel={`${copy.label} — ${copy.descriptor}`}
              className="sm:min-w-[11rem]"
            >
              <ThemeSwatch themeId={themeId} />
              <span className="flex min-w-0 flex-col">
                <span className="truncate">{copy.label}</span>
                <span className="truncate text-xs font-normal text-[#6b5c42]">{copy.descriptor}</span>
              </span>
            </OptionButton>
          );
        })}
      </div>

      {adBranding ? (
        <div className="mt-6 flex flex-col gap-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-[#6b5c42]">{sectionLabels.shade}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {SHADE_IDS.map((shadeId) => (
                <OptionButton
                  key={shadeId}
                  selected={adBranding.shadeId === shadeId}
                  onClick={() => selectShade(shadeId)}
                  ariaLabel={SERVICIOS_AD_BRAND_SHADE_COPY[shadeId][lang]}
                >
                  {SERVICIOS_AD_BRAND_SHADE_COPY[shadeId][lang]}
                </OptionButton>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-[#6b5c42]">{sectionLabels.background}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {AD_BRAND_THEMES[adBranding.themeId].backgroundOptions.map((backgroundId) => (
                <OptionButton
                  key={backgroundId}
                  selected={adBranding.backgroundId === backgroundId}
                  onClick={() => selectBackground(backgroundId)}
                  ariaLabel={SERVICIOS_AD_BRAND_BACKGROUND_COPY[backgroundId][lang]}
                >
                  {SERVICIOS_AD_BRAND_BACKGROUND_COPY[backgroundId][lang]}
                </OptionButton>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-[#6b5c42]">{sectionLabels.logoPresentation}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {LOGO_PRESENTATION_IDS.map((presentation) => (
                <OptionButton
                  key={presentation}
                  selected={adBranding.logo.presentation === presentation}
                  onClick={() => selectLogoPresentation(presentation)}
                  ariaLabel={SERVICIOS_AD_BRAND_LOGO_PRESENTATION_COPY[presentation][lang]}
                >
                  {SERVICIOS_AD_BRAND_LOGO_PRESENTATION_COPY[presentation][lang]}
                </OptionButton>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
