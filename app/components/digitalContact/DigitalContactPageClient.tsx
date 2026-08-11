"use client";

import { useEffect, useState } from "react";
import { getDigitalContactCopy } from "@/app/lib/digitalContact/digitalContactCopy";
import { sanitizeDigitalContactFileNameBase } from "@/app/lib/digitalContact/digitalContactFileName";
import { digitalContactCanonicalUrl } from "@/app/lib/digitalContact/digitalContactSeo";
import { executiveThemeCssVars, resolveExecutiveTheme } from "@/app/lib/digitalContact/digitalContactExecutiveTheme";
import type { DigitalContactLang, DigitalContactProfile } from "@/app/lib/digitalContact/digitalContactTypes";
import { trackDigitalContactEvent } from "@/app/lib/digitalContact/digitalContactAnalyticsClient";

import { DigitalContactHero } from "./DigitalContactHero";
import { DigitalContactExecutiveCard } from "./DigitalContactExecutiveCard";
import { DigitalContactQuickActions } from "./DigitalContactQuickActions";
import { DigitalContactSaveButton } from "./DigitalContactSaveButton";
import { DigitalContactQrCode } from "./DigitalContactQrCode";
import { DigitalContactWhatWeDo } from "./DigitalContactWhatWeDo";
import { DigitalContactAbout } from "./DigitalContactAbout";
import { DigitalContactFocusAreas } from "./DigitalContactFocusAreas";
import { DigitalContactSocialCards } from "./DigitalContactSocialCards";
import { DigitalContactShowcase } from "./DigitalContactShowcase";
import { DigitalContactBusinessHubTeaser } from "./DigitalContactBusinessHubTeaser";
import { DigitalContactLeadForm } from "./DigitalContactLeadForm";
import { DigitalContactClosingCta } from "./DigitalContactClosingCta";
import { DigitalContactFooter } from "./DigitalContactFooter";
import { DigitalContactEmailModal } from "./DigitalContactEmailModal";

type Props = {
  profile: DigitalContactProfile;
  initialLang: DigitalContactLang;
};

/** QR download filename shares the same sanitizer as the server vCard route (kept in sync, no duplication). */
function qrFileNameFor(profile: DigitalContactProfile): string {
  return `${sanitizeDigitalContactFileNameBase(profile.fullName, profile.slug)}-qr.png`;
}

export function DigitalContactPageClient({ profile, initialLang }: Props) {
  const [lang, setLang] = useState<DigitalContactLang>(initialLang);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const copy = getDigitalContactCopy(lang);
  const canonicalUrl = digitalContactCanonicalUrl(profile.slug);
  const executiveTheme = resolveExecutiveTheme(profile.theme);
  const themeVars = executiveThemeCssVars(executiveTheme);

  useEffect(() => {
    trackDigitalContactEvent(profile.slug, "page_view", { lang });
    // Track once per mount — lang toggles are a UI preference, not a new page view.
  }, [profile.slug]);

  return (
    <div className="min-h-screen bg-[var(--dc-gradient-end)]" style={themeVars}>
      <div className="flex justify-center pt-3">
        <div
          className="inline-flex rounded-full border border-[#D6C7AD] bg-[#FFFDF7] p-0.5 text-xs font-semibold shadow-sm"
          role="group"
          aria-label={copy.heroKicker}
        >
          {(["es", "en"] as const).map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => setLang(code)}
              aria-pressed={lang === code}
              className={`rounded-full px-3 py-1.5 transition-colors ${
                lang === code
                  ? "bg-[var(--dc-button-primary)] text-white shadow-sm"
                  : "text-[#3D3428] hover:bg-[#E8DCC5]/60"
              }`}
            >
              {copy.langToggle[code]}
            </button>
          ))}
        </div>
      </div>

      {/*
       * Gate 2 — one continuous gradient spans the hero AND the executive card, so the
       * brand-to-cream fade only completes after the card (no hard stop mid-page).
       * `color-mix` derives the transitional tones from the theme's own colors, so this
       * stays banding-free and elegant for any future Executive Theme, not just Leonix.
       */}
      <div
        className="relative overflow-hidden"
        style={{
          backgroundImage:
            "linear-gradient(to bottom, var(--dc-gradient-start) 0%, var(--dc-primary-dark) 32%, color-mix(in srgb, var(--dc-primary-dark) 58%, var(--dc-gradient-end) 42%) 60%, color-mix(in srgb, var(--dc-primary-dark) 14%, var(--dc-gradient-end) 86%) 84%, var(--dc-gradient-end) 100%)",
        }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_55%_at_50%_0%,var(--dc-accent-soft),transparent_60%)]"
        />
        <DigitalContactHero profile={profile} copy={copy} />
        <DigitalContactExecutiveCard profile={profile} copy={copy} onOpenEmail={() => setEmailModalOpen(true)} />
      </div>
      <main>
        <DigitalContactQuickActions profile={profile} copy={copy} onOpenEmail={() => setEmailModalOpen(true)} />
        <DigitalContactSaveButton profile={profile} copy={copy} />
        <DigitalContactQrCode profileSlug={profile.slug} value={canonicalUrl} fileName={qrFileNameFor(profile)} copy={copy} />
        <DigitalContactWhatWeDo copy={copy} />
        <DigitalContactAbout profile={profile} lang={lang} copy={copy} />
        <DigitalContactFocusAreas profile={profile} copy={copy} />
        <DigitalContactSocialCards profile={profile} copy={copy} />
        <DigitalContactShowcase profileSlug={profile.slug} lang={lang} copy={copy} />
        <DigitalContactBusinessHubTeaser copy={copy} />
        <DigitalContactLeadForm profileSlug={profile.slug} lang={lang} copy={copy} />
        <DigitalContactClosingCta profileSlug={profile.slug} copy={copy} />
      </main>
      <DigitalContactFooter profile={profile} copy={copy} />

      <DigitalContactEmailModal
        open={emailModalOpen}
        onClose={() => setEmailModalOpen(false)}
        email={profile.email}
        copy={copy}
      />
    </div>
  );
}
