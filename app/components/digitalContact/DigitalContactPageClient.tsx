"use client";

import { useEffect, useState } from "react";
import { CtaActionSheet } from "@/app/components/cta/CtaActionSheet";
import type { CtaSheetIntent } from "@/app/components/cta/types";
import { getDigitalContactCopy } from "@/app/lib/digitalContact/digitalContactCopy";
import { sanitizeDigitalContactFileNameBase } from "@/app/lib/digitalContact/digitalContactFileName";
import { digitalContactCanonicalUrl } from "@/app/lib/digitalContact/digitalContactSeo";
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
  const [sheetOpen, setSheetOpen] = useState(false);
  const [intent, setIntent] = useState<CtaSheetIntent | null>(null);
  const copy = getDigitalContactCopy(lang);
  const canonicalUrl = digitalContactCanonicalUrl(profile.slug);

  useEffect(() => {
    trackDigitalContactEvent(profile.slug, "page_view", { lang });
    // Track once per mount — lang toggles are a UI preference, not a new page view.
  }, [profile.slug]);

  function openSheet(next: CtaSheetIntent) {
    setIntent(next);
    setSheetOpen(true);
  }

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

      <DigitalContactHero profile={profile} copy={copy} />
      <main>
        <DigitalContactExecutiveCard profile={profile} copy={copy} onOpenSheet={openSheet} />
        <DigitalContactQuickActions profile={profile} copy={copy} onOpenSheet={openSheet} />
        <DigitalContactSaveButton profile={profile} copy={copy} />
        <DigitalContactQrCode profileSlug={profile.slug} value={canonicalUrl} fileName={qrFileNameFor(profile)} copy={copy} />
        <DigitalContactShowcase profileSlug={profile.slug} lang={lang} copy={copy} />
        <DigitalContactLeadForm profileSlug={profile.slug} lang={lang} copy={copy} />
        <DigitalContactClosingCta profileSlug={profile.slug} copy={copy} />
      </main>
      <DigitalContactFooter profile={profile} copy={copy} />

      <CtaActionSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        intent={intent}
        lang={lang}
      />
    </div>
  );
}
