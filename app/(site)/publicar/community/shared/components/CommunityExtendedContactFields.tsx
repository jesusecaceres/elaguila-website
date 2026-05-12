"use client";

import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { formatPhoneInputDisplay } from "@/app/clasificados/publicar/servicios/lib/serviciosPhoneUi";
import { EmpleosFieldLabel } from "@/app/publicar/empleos/shared/ui/empleosFormPrimitives";

import type { CommunityCommonDraft, CommunitySocialLinks } from "../types/communityQuickDraft";

const INPUT = "mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm";

type Copy = {
  smsPhone: string;
  smsPhoneHelper: string;
  socialSection: string;
  socialFacebook: string;
  socialInstagram: string;
  socialTiktok: string;
  socialYoutube: string;
  socialX: string;
  socialLinkedin: string;
};

const COPY: Record<Lang, Copy> = {
  es: {
    smsPhone: "Número para mensajes de texto",
    smsPhoneHelper: "Puedes usar el mismo número de teléfono si recibes textos ahí.",
    socialSection: "Redes sociales",
    socialFacebook: "Facebook",
    socialInstagram: "Instagram",
    socialTiktok: "TikTok",
    socialYoutube: "YouTube",
    socialX: "X (Twitter)",
    socialLinkedin: "LinkedIn",
  },
  en: {
    smsPhone: "Text message number",
    smsPhoneHelper: "You can use the same phone number if you receive texts there.",
    socialSection: "Social media",
    socialFacebook: "Facebook",
    socialInstagram: "Instagram",
    socialTiktok: "TikTok",
    socialYoutube: "YouTube",
    socialX: "X (Twitter)",
    socialLinkedin: "LinkedIn",
  },
};

type Props = {
  lang: Lang;
  smsPhone: string;
  socialLinks: CommunitySocialLinks;
  onChange: (p: Partial<Pick<CommunityCommonDraft, "smsPhone" | "socialLinks">>) => void;
};

export function CommunityExtendedContactFields({ lang, smsPhone, socialLinks, onChange }: Props) {
  const t = COPY[lang];
  const patchSocial = (p: Partial<CommunitySocialLinks>) =>
    onChange({ socialLinks: { ...socialLinks, ...p } });

  return (
    <div className="space-y-4">
      <label className="block text-sm">
        <EmpleosFieldLabel lang={lang} optional>
          {t.smsPhone}
        </EmpleosFieldLabel>
        <input
          value={smsPhone}
          onChange={(e) => onChange({ smsPhone: formatPhoneInputDisplay(e.target.value) })}
          className={INPUT}
          type="tel"
          inputMode="numeric"
          maxLength={14}
          placeholder="(555) 123-4567"
        />
        <p className="mt-1 text-xs text-[color:var(--lx-text-2)]">{t.smsPhoneHelper}</p>
      </label>

      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold text-[color:var(--lx-text)]">{t.socialSection}</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="text-xs font-semibold text-[color:var(--lx-text)]">{t.socialFacebook}</span>
            <input
              value={socialLinks.facebook}
              onChange={(e) => patchSocial({ facebook: e.target.value })}
              className={INPUT}
              type="text"
              inputMode="url"
              placeholder="https://facebook.com/…"
            />
          </label>
          <label className="block text-sm">
            <span className="text-xs font-semibold text-[color:var(--lx-text)]">{t.socialInstagram}</span>
            <input
              value={socialLinks.instagram}
              onChange={(e) => patchSocial({ instagram: e.target.value })}
              className={INPUT}
              type="text"
              placeholder="https://instagram.com/…"
            />
          </label>
          <label className="block text-sm">
            <span className="text-xs font-semibold text-[color:var(--lx-text)]">{t.socialTiktok}</span>
            <input
              value={socialLinks.tiktok}
              onChange={(e) => patchSocial({ tiktok: e.target.value })}
              className={INPUT}
              type="text"
              placeholder="https://tiktok.com/@…"
            />
          </label>
          <label className="block text-sm">
            <span className="text-xs font-semibold text-[color:var(--lx-text)]">{t.socialYoutube}</span>
            <input
              value={socialLinks.youtube}
              onChange={(e) => patchSocial({ youtube: e.target.value })}
              className={INPUT}
              type="text"
              placeholder="https://youtube.com/…"
            />
          </label>
          <label className="block text-sm">
            <span className="text-xs font-semibold text-[color:var(--lx-text)]">{t.socialX}</span>
            <input
              value={socialLinks.xTwitter}
              onChange={(e) => patchSocial({ xTwitter: e.target.value })}
              className={INPUT}
              type="text"
              placeholder="https://x.com/…"
            />
          </label>
          <label className="block text-sm">
            <span className="text-xs font-semibold text-[color:var(--lx-text)]">{t.socialLinkedin}</span>
            <input
              value={socialLinks.linkedin}
              onChange={(e) => patchSocial({ linkedin: e.target.value })}
              className={INPUT}
              type="text"
              placeholder="https://linkedin.com/…"
            />
          </label>
        </div>
      </fieldset>
    </div>
  );
}
