"use client";

import type { ComponentType } from "react";

import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { formatPhoneInputDisplay } from "@/app/clasificados/publicar/servicios/lib/serviciosPhoneUi";
import { EmpleosFieldLabel } from "@/app/publicar/empleos/shared/ui/empleosFormPrimitives";
import { FaFacebook, FaInstagram, FaLinkedin, FaTiktok, FaYoutube } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";

import { normalizeSocialUrlForOpen } from "../lib/communityWebsiteAndSocial";
import type { CommunityCommonDraft, CommunitySocialLinks } from "../types/communityQuickDraft";

const INPUT = "mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm";

type FieldKey = keyof CommunitySocialLinks;

type Copy = {
  smsPhone: string;
  smsPhoneHelper: string;
  socialTitle: string;
  socialIntro: string;
  gentleInvalid: string;
  fields: Record<
    FieldKey,
    { label: string; example: string; placeholder: string }
  >;
};

const COPY: Record<Lang, Copy> = {
  es: {
    smsPhone: "Número para mensajes de texto",
    smsPhoneHelper: "Puedes usar el mismo número de teléfono si recibes textos ahí.",
    socialTitle: "Redes sociales del organizador (opcional)",
    socialIntro:
      "Agrega las redes donde las personas pueden conocer más del organizador. Solo mostraremos los íconos que completes.",
    gentleInvalid: "Este enlace no coincide con la red; no se mostrará públicamente hasta que lo corrijas.",
    fields: {
      facebook: {
        label: "Facebook",
        example: "facebook.com/tuorganizacion",
        placeholder: "facebook.com/tuorganizacion",
      },
      instagram: {
        label: "Instagram",
        example: "instagram.com/tuorganizacion",
        placeholder: "instagram.com/tuorganizacion",
      },
      tiktok: {
        label: "TikTok",
        example: "tiktok.com/@tuorganizacion",
        placeholder: "tiktok.com/@tuorganizacion",
      },
      youtube: {
        label: "YouTube",
        example: "youtube.com/@tuorganizacion",
        placeholder: "youtube.com/@tuorganizacion",
      },
      xTwitter: {
        label: "X / Twitter",
        example: "x.com/tuorganizacion",
        placeholder: "x.com/tuorganizacion",
      },
      linkedin: {
        label: "LinkedIn",
        example: "linkedin.com/company/tuorganizacion",
        placeholder: "linkedin.com/company/tuorganizacion",
      },
    },
  },
  en: {
    smsPhone: "Text message number",
    smsPhoneHelper: "You can use the same phone number if you receive texts there.",
    socialTitle: "Organizer social media (optional)",
    socialIntro:
      "Add the profiles where people can learn more about the organizer. We only show icons for fields you fill in.",
    gentleInvalid: "This link doesn’t match that network; it won’t show publicly until corrected.",
    fields: {
      facebook: {
        label: "Facebook",
        example: "facebook.com/yourpage",
        placeholder: "facebook.com/yourpage",
      },
      instagram: {
        label: "Instagram",
        example: "instagram.com/yourpage",
        placeholder: "instagram.com/yourpage",
      },
      tiktok: {
        label: "TikTok",
        example: "tiktok.com/@yourhandle",
        placeholder: "tiktok.com/@yourhandle",
      },
      youtube: {
        label: "YouTube",
        example: "youtube.com/@yourchannel",
        placeholder: "youtube.com/@yourchannel",
      },
      xTwitter: {
        label: "X / Twitter",
        example: "x.com/yourhandle",
        placeholder: "x.com/yourhandle",
      },
      linkedin: {
        label: "LinkedIn",
        example: "linkedin.com/company/yourcompany",
        placeholder: "linkedin.com/company/yourcompany",
      },
    },
  },
};

const FIELD_ORDER: { key: FieldKey; Icon: ComponentType<{ className?: string }> }[] = [
  { key: "facebook", Icon: FaFacebook },
  { key: "instagram", Icon: FaInstagram },
  { key: "tiktok", Icon: FaTiktok },
  { key: "youtube", Icon: FaYoutube },
  { key: "xTwitter", Icon: FaXTwitter },
  { key: "linkedin", Icon: FaLinkedin },
];

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
    <div className="space-y-6">
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

      <fieldset
        className="space-y-3 rounded-xl border border-[#C9B46A]/35 bg-[#FCF9F2]/40 px-4 py-4 ring-1 ring-[#C9B46A]/15"
        data-testid="community-organizer-social-fields"
      >
        <legend className="px-1 text-sm font-semibold text-[color:var(--lx-text)]">{t.socialTitle}</legend>
        <p className="text-xs leading-relaxed text-[color:var(--lx-text-2)]">{t.socialIntro}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          {FIELD_ORDER.map(({ key, Icon }) => {
            const fc = t.fields[key];
            const val = socialLinks[key];
            const trimmed = String(val ?? "").trim();
            const invalid = Boolean(trimmed && normalizeSocialUrlForOpen(trimmed, key) === null);
            return (
              <label key={key} className="block min-w-0 text-sm">
                <span className="flex items-center gap-2">
                  <Icon className="h-4 w-4 shrink-0 text-[#C9B46A]" aria-hidden />
                  <span className="text-xs font-semibold text-[color:var(--lx-text)]">{fc.label}</span>
                </span>
                <input
                  value={val}
                  onChange={(e) => patchSocial({ [key]: e.target.value } as Partial<CommunitySocialLinks>)}
                  className={INPUT}
                  type="text"
                  inputMode="url"
                  autoComplete="off"
                  placeholder={fc.placeholder}
                  aria-invalid={invalid || undefined}
                />
                <p className="mt-1 text-[11px] text-[color:var(--lx-text-2)]">
                  {lang === "es" ? "Ejemplo:" : "Example:"}{" "}
                  <span className="font-medium text-[color:var(--lx-text)]">{fc.example}</span>
                </p>
                {invalid ? (
                  <p className="mt-1 text-[11px] text-amber-800/90" role="status">
                    {t.gentleInvalid}
                  </p>
                ) : null}
              </label>
            );
          })}
        </div>
      </fieldset>
    </div>
  );
}
