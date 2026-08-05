"use client";

import { useEffect, useState } from "react";
import { getDigitalContactCopy } from "@/app/lib/digitalContact/digitalContactCopy";
import { sanitizeDigitalContactFileNameBase } from "@/app/lib/digitalContact/digitalContactFileName";
import { digitalContactCanonicalUrl } from "@/app/lib/digitalContact/digitalContactSeo";
import { resolveDigitalContactAccentTheme } from "@/app/lib/digitalContact/digitalContactAccentTheme";
import type { DigitalContactLang, DigitalContactProfile } from "@/app/lib/digitalContact/digitalContactTypes";
import { trackDigitalContactEvent } from "@/app/lib/digitalContact/digitalContactAnalyticsClient";

import { DigitalContactHero } from "./DigitalContactHero";
import { DigitalContactExecutiveCard } from "./DigitalContactExecutiveCard";
import { DigitalContactQuickActions } from "./DigitalContactQuickActions";
import { DigitalContactSaveButton } from "./DigitalContactSaveButton";
import { DigitalContactQrCode } from "./DigitalContactQrCode";
import { DigitalContactShowcase } from "./DigitalContactShowcase";
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
  const accentTheme = resolveDigitalContactAccentTheme(profile.accentThemeId);

  useEffect(() => {
    trackDigitalContactEvent(profile.slug, "page_view", { lang });
    // Track once per mount — lang toggles are a UI preference, not a new page view.
  }, [profile.slug]);

  return (
    <div className="min-h-screen bg-[#F8F4EA]">
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
                lang === code ? "bg-[#7A1E2C] text-white shadow-sm" : "text-[#3D3428] hover:bg-[#E8DCC5]/60"
              }`}
            >
              {copy.langToggle[code]}
            </button>
          ))}
        </div>
      </div>

      {/*
       * Gate 2 — one continuous gradient spans the hero AND the executive card, so the
       * burgundy-to-cream fade only completes after the card (no hard stop mid-page).
       * Percentage stops are relative to this wrapper's full rendered height, which
       * naturally includes the card since it's a child here, not a sibling of a
       * fixed-height header.
       */}
      <div
        className="relative overflow-hidden"
        style={{
          backgroundImage:
            "linear-gradient(to bottom, #7A1E2C 0%, #6B1A26 34%, #7D3341 62%, #E4CBC6 84%, #F8F4EA 100%)",
        }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_55%_at_50%_0%,rgba(201,168,74,0.16),transparent_60%)]"
        />
        <DigitalContactHero profile={profile} copy={copy} accentTheme={accentTheme} />
        <DigitalContactExecutiveCard
          profile={profile}
          copy={copy}
          onOpenEmail={() => setEmailModalOpen(true)}
          accentTheme={accentTheme}
        />
      </div>
      <main>
        <DigitalContactQuickActions profile={profile} copy={copy} onOpenEmail={() => setEmailModalOpen(true)} />
        <DigitalContactSaveButton profile={profile} copy={copy} />
        <DigitalContactQrCode profileSlug={profile.slug} value={canonicalUrl} fileName={qrFileNameFor(profile)} copy={copy} />
        <DigitalContactShowcase profileSlug={profile.slug} lang={lang} copy={copy} />
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
