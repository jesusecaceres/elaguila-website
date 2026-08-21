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
import type { RestauranteListingDraft } from "@/app/clasificados/restaurantes/application/restauranteDraftTypes";
import type { RestauranteDraftPatch } from "@/app/clasificados/restaurantes/application/useRestauranteDraft";
import type { RestauranteAppUiLang } from "./restauranteApplicationFormCopy";
import {
  RESTAURANTE_AD_BRANDING_SECTION_LABELS,
  RESTAURANTE_AD_BRAND_BACKGROUND_COPY,
  RESTAURANTE_AD_BRAND_DEFAULT_OPTION_COPY,
  RESTAURANTE_AD_BRAND_LOGO_PRESENTATION_COPY,
  RESTAURANTE_AD_BRAND_SHADE_COPY,
  RESTAURANTE_AD_BRAND_THEME_COPY,
  restauranteAdBrandingPanelIntro,
  restauranteAdBrandingPanelTitle,
} from "./restauranteAdBrandingCopy";

/**
 * Leonix Ad Branding Layer (Gate 3D) — Restaurantes owner-facing branding controls.
 *
 * A bounded picker, not a design tool: every option is one of the fixed, pre-approved values
 * from `app/lib/adBranding` — no free text, no hex input, no layout control. Selecting a
 * theme/shade/background/logo presentation updates `draft.adBranding` through the same global
 * update helpers Servicios (Gate 2D) already uses, via the existing `setDraftPatch` — no
 * second draft state, no new storage key, no second preview. The already-built renderers from
 * Gates 3B/3C (`RestauranteProfileHeader`, `RestaurantePreviewCard`) pick the change up for
 * free the moment the draft changes.
 */

type Props = {
  draft: RestauranteListingDraft;
  setDraftPatch: (patch: RestauranteDraftPatch) => void;
  lang?: RestauranteAppUiLang;
};

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
      className={`flex min-h-[44px] items-center gap-2 rounded-xl border-2 px-3 py-2 text-left text-sm font-semibold text-[color:var(--lx-text)] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--lx-gold)]/60 focus-visible:ring-offset-1 ${
        selected
          ? "border-[color:var(--lx-lion)] bg-[color:var(--lx-lion)]/[0.08] shadow-sm"
          : "border-[color:var(--lx-nav-border)] bg-white hover:border-[color:var(--lx-gold-border)]"
      } ${className}`.trim()}
    >
      <span className="flex h-4 w-4 shrink-0 items-center justify-center" aria-hidden>
        {selected ? <FiCheck className="h-4 w-4 text-[color:var(--lx-lion)]" /> : null}
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

export function RestauranteAdBrandingPanel({ draft, setDraftPatch, lang = "es" }: Props) {
  const adBranding = draft.adBranding;
  const sectionLabels = RESTAURANTE_AD_BRANDING_SECTION_LABELS[lang];
  const defaultCopy = RESTAURANTE_AD_BRAND_DEFAULT_OPTION_COPY[lang];

  const patchAdBranding = (next: AdBrandingProfile | undefined) => setDraftPatch({ adBranding: next });

  const selectTheme = (themeId: AdBrandThemeId) => patchAdBranding(applyAdBrandThemeSelection(adBranding ?? null, themeId));
  const selectShade = (shadeId: AdBrandShadeId) => {
    if (!adBranding) return;
    patchAdBranding(applyAdBrandShadeSelection(adBranding, shadeId));
  };
  const selectBackground = (backgroundId: AdBrandBackgroundId) => {
    if (!adBranding) return;
    patchAdBranding(applyAdBrandBackgroundSelection(adBranding, backgroundId));
  };
  const selectLogoPresentation = (presentation: LogoPresentationId) => {
    if (!adBranding) return;
    patchAdBranding(applyAdBrandLogoPresentationSelection(adBranding, presentation));
  };

  return (
    <div className="mt-8 rounded-xl border border-[color:var(--lx-nav-border)]/80 bg-[color:var(--lx-section)]/30 p-4 sm:p-5">
      <h3 className="text-base font-bold text-[color:var(--lx-text)]">{restauranteAdBrandingPanelTitle(lang)}</h3>
      <p className="mt-2 text-xs leading-relaxed text-[color:var(--lx-muted)] sm:max-w-2xl">
        {restauranteAdBrandingPanelIntro(lang)}
      </p>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <OptionButton selected={!adBranding} onClick={() => patchAdBranding(undefined)} ariaLabel={defaultCopy.label} className="sm:min-w-[11rem]">
          <span className="flex min-w-0 flex-col">
            <span className="truncate">{defaultCopy.label}</span>
            <span className="truncate text-xs font-normal text-[color:var(--lx-muted)]">{defaultCopy.descriptor}</span>
          </span>
        </OptionButton>
        {THEME_IDS.map((themeId) => {
          const copy = RESTAURANTE_AD_BRAND_THEME_COPY[themeId][lang];
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
                <span className="truncate text-xs font-normal text-[color:var(--lx-muted)]">{copy.descriptor}</span>
              </span>
            </OptionButton>
          );
        })}
      </div>

      {adBranding ? (
        <div className="mt-5 flex flex-col gap-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-[color:var(--lx-muted)]">{sectionLabels.shade}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {SHADE_IDS.map((shadeId) => (
                <OptionButton
                  key={shadeId}
                  selected={adBranding.shadeId === shadeId}
                  onClick={() => selectShade(shadeId)}
                  ariaLabel={RESTAURANTE_AD_BRAND_SHADE_COPY[shadeId][lang]}
                >
                  {RESTAURANTE_AD_BRAND_SHADE_COPY[shadeId][lang]}
                </OptionButton>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-[color:var(--lx-muted)]">{sectionLabels.background}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {AD_BRAND_THEMES[adBranding.themeId].backgroundOptions.map((backgroundId) => (
                <OptionButton
                  key={backgroundId}
                  selected={adBranding.backgroundId === backgroundId}
                  onClick={() => selectBackground(backgroundId)}
                  ariaLabel={RESTAURANTE_AD_BRAND_BACKGROUND_COPY[backgroundId][lang]}
                >
                  {RESTAURANTE_AD_BRAND_BACKGROUND_COPY[backgroundId][lang]}
                </OptionButton>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-[color:var(--lx-muted)]">{sectionLabels.logoPresentation}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {LOGO_PRESENTATION_IDS.map((presentation) => (
                <OptionButton
                  key={presentation}
                  selected={adBranding.logo.presentation === presentation}
                  onClick={() => selectLogoPresentation(presentation)}
                  ariaLabel={RESTAURANTE_AD_BRAND_LOGO_PRESENTATION_COPY[presentation][lang]}
                >
                  {RESTAURANTE_AD_BRAND_LOGO_PRESENTATION_COPY[presentation][lang]}
                </OptionButton>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
