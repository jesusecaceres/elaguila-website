"use client";

import type { ComponentType } from "react";

import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { formatPhoneInputDisplay } from "@/app/clasificados/publicar/servicios/lib/serviciosPhoneUi";
import { EmpleosFieldLabel } from "@/app/publicar/empleos/shared/ui/empleosFormPrimitives";
import { FaFacebook, FaInstagram, FaLinkedin, FaPinterest, FaSnapchat, FaTiktok, FaYoutube } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { normalizeWebsiteForOpen, normalizeSocialUrlForOpen } from "../lib/communityWebsiteAndSocial";
import type {
  ClasesClassLinks,
  ComunidadEventLinks,
  CommunityCommonDraft,
  CommunitySocialLinks,
} from "../types/communityQuickDraft";

const INPUT = "mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm";

type FieldKey = keyof CommunitySocialLinks;

type SocialCopy = {
  smsPhone: string;
  smsPhoneHelper: string;
  socialTitle: string;
  socialIntro: string;
  gentleInvalid: string;
  fields: Record<FieldKey, { label: string; example: string; placeholder: string }>;
};

const SOCIAL_COPY: Record<Lang, SocialCopy> = {
  es: {
    smsPhone: "Número para mensajes de texto",
    smsPhoneHelper: "Puedes usar el mismo número de teléfono si recibes textos ahí.",
    socialTitle: "Redes sociales del organizador (opcional)",
    socialIntro:
      "Solo mostraremos los íconos que completes en la página pública del evento.",
    gentleInvalid: "Este enlace no coincide con la red; no se mostrará públicamente hasta que lo corrijas.",
    fields: {
      facebook: { label: "Facebook", example: "facebook.com/tuorganizacion", placeholder: "facebook.com/tuorganizacion" },
      instagram: { label: "Instagram", example: "instagram.com/tuorganizacion", placeholder: "instagram.com/tuorganizacion" },
      tiktok: { label: "TikTok", example: "tiktok.com/@tuorganizacion", placeholder: "tiktok.com/@tuorganizacion" },
      youtube: { label: "YouTube", example: "youtube.com/@tuorganizacion", placeholder: "youtube.com/@tuorganizacion" },
      xTwitter: { label: "X / Twitter", example: "x.com/tuorganizacion", placeholder: "x.com/tuorganizacion" },
      linkedin: { label: "LinkedIn", example: "linkedin.com/company/tuorganizacion", placeholder: "linkedin.com/company/tuorganizacion" },
      snapchat: { label: "Snapchat", example: "snapchat.com/add/tuusuario", placeholder: "snapchat.com/add/tuusuario" },
      pinterest: { label: "Pinterest", example: "pinterest.com/tuorganizacion", placeholder: "pinterest.com/tuorganizacion" },
    },
  },
  en: {
    smsPhone: "Text message number",
    smsPhoneHelper: "You can use the same phone number if you receive texts there.",
    socialTitle: "Instructor social media (optional)",
    socialIntro:
      "We only show the icons you complete on the public class page.",
    gentleInvalid: "This link doesn't match that network; it won't show publicly until corrected.",
    fields: {
      facebook: { label: "Facebook", example: "facebook.com/yourpage", placeholder: "facebook.com/yourpage" },
      instagram: { label: "Instagram", example: "instagram.com/yourpage", placeholder: "instagram.com/yourpage" },
      tiktok: { label: "TikTok", example: "tiktok.com/@yourhandle", placeholder: "tiktok.com/@yourhandle" },
      youtube: { label: "YouTube", example: "youtube.com/@yourchannel", placeholder: "youtube.com/@yourchannel" },
      xTwitter: { label: "X / Twitter", example: "x.com/yourhandle", placeholder: "x.com/yourhandle" },
      linkedin: { label: "LinkedIn", example: "linkedin.com/company/yourcompany", placeholder: "linkedin.com/company/yourcompany" },
      snapchat: { label: "Snapchat", example: "snapchat.com/add/youruser", placeholder: "snapchat.com/add/youruser" },
      pinterest: { label: "Pinterest", example: "pinterest.com/yourpage", placeholder: "pinterest.com/yourpage" },
    },
  },
};

const SOCIAL_FIELD_ORDER: { key: FieldKey; Icon: ComponentType<{ className?: string }> }[] = [
  { key: "facebook", Icon: FaFacebook },
  { key: "instagram", Icon: FaInstagram },
  { key: "tiktok", Icon: FaTiktok },
  { key: "youtube", Icon: FaYoutube },
  { key: "xTwitter", Icon: FaXTwitter },
  { key: "linkedin", Icon: FaLinkedin },
  { key: "snapchat", Icon: FaSnapchat },
  { key: "pinterest", Icon: FaPinterest },
];

type EventLinksCopy = {
  sectionTitle: string;
  sectionIntro: string;
  registrationUrl: string;
  registrationUrlPlaceholder: string;
  registrationUrlConfirm: string;
  ticketsUrl: string;
  donationUrl: string;
  eventProgramUrl: string;
  eventGuideUrl: string;
  vendorListUrl: string;
  foodVendorsUrl: string;
  sponsorsUrl: string;
  customLink1Label: string;
  customLink1Url: string;
  customLink2Label: string;
  customLink2Url: string;
  customLabelPlaceholder: string;
  customUrlPlaceholder: string;
  urlExample: string;
  registrationRevealedBecause: string;
};

const EVENT_LINKS_COPY: Record<Lang, EventLinksCopy> = {
  es: {
    sectionTitle: "7. Enlaces útiles del evento",
    sectionIntro: "Agrega solo los enlaces que aplican. En la página pública mostraremos botones claros, no URLs largas.",
    registrationUrl: "Enlace de registro",
    registrationUrlPlaceholder: "https://ejemplo.com/registro",
    registrationUrlConfirm: "✓ Enlace de registro agregado",
    ticketsUrl: "Boletos",
    donationUrl: "Donación",
    eventProgramUrl: "Programa del evento",
    eventGuideUrl: "Guía del evento",
    vendorListUrl: "Lista de vendedores",
    foodVendorsUrl: "Comida / puestos",
    sponsorsUrl: "Patrocinadores",
    customLink1Label: "Título del enlace",
    customLink1Url: "URL del enlace",
    customLink2Label: "Título del enlace (2)",
    customLink2Url: "URL del enlace (2)",
    customLabelPlaceholder: "Ej. Mapa del evento",
    customUrlPlaceholder: "https://ejemplo.com",
    urlExample: "Ej. https://ejemplo.com",
    registrationRevealedBecause: "Seleccionaste \"Se requiere registro\" — agrega el enlace aquí.",
  },
  en: {
    sectionTitle: "7. Useful event links",
    sectionIntro: "Add only the links that apply. On the public page we show clean buttons, not long URLs.",
    registrationUrl: "Registration link",
    registrationUrlPlaceholder: "https://example.com/register",
    registrationUrlConfirm: "✓ Registration link added",
    ticketsUrl: "Tickets",
    donationUrl: "Donation",
    eventProgramUrl: "Event program",
    eventGuideUrl: "Event guide",
    vendorListUrl: "Vendor list",
    foodVendorsUrl: "Food / vendors",
    sponsorsUrl: "Sponsors",
    customLink1Label: "Additional link 1 — label",
    customLink1Url: "Additional link 1 — URL",
    customLink2Label: "Additional link 2 — label",
    customLink2Url: "Additional link 2 — URL",
    customLabelPlaceholder: "e.g. Event map",
    customUrlPlaceholder: "https://example.com",
    urlExample: "e.g. https://example.com",
    registrationRevealedBecause: "You selected \"Registration required\" — add the link here.",
  },
};

type SocialProps = {
  lang: Lang;
  smsPhone: string;
  socialLinks: CommunitySocialLinks;
  onChange: (p: Partial<Pick<CommunityCommonDraft, "smsPhone" | "socialLinks">>) => void;
};

export function CommunityExtendedContactFields({ lang, smsPhone, socialLinks, onChange }: SocialProps) {
  const t = SOCIAL_COPY[lang];
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
          {SOCIAL_FIELD_ORDER.map(({ key, Icon }) => {
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

type EventLinksProps = {
  lang: Lang;
  registrationRequired: string;
  eventLinks: ComunidadEventLinks;
  onChangeLinks: (p: Partial<ComunidadEventLinks>) => void;
};

function UrlField({
  label,
  value,
  onChange,
  placeholder,
  hint,
  confirmText,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  hint?: string;
  confirmText?: string;
}) {
  const trimmed = value.trim();
  const isValid = Boolean(trimmed && normalizeWebsiteForOpen(trimmed));
  return (
    <label className="block min-w-0 text-sm">
      <span className="text-xs font-semibold text-[color:var(--lx-text)]">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${INPUT} ${isValid ? "border-emerald-400/70" : ""}`}
        type="text"
        inputMode="url"
        autoComplete="off"
        placeholder={placeholder}
      />
      {hint ? <p className="mt-1 text-[11px] text-[color:var(--lx-text-2)]">{hint}</p> : null}
      {isValid && confirmText ? (
        <p className="mt-1 text-[11px] font-semibold text-emerald-700" role="status">
          {confirmText}
        </p>
      ) : null}
    </label>
  );
}

const CLASS_LINKS_COPY: Record<Lang, {
  sectionTitle: string;
  sectionIntro: string;
  registrationUrl: string;
  registrationUrlPlaceholder: string;
  registrationUrlConfirm: string;
  paymentUrl: string;
  ticketsUrl: string;
  donationUrl: string;
  classMaterialsUrl: string;
  syllabusUrl: string;
  classGuideUrl: string;
  instructorPageUrl: string;
  studentPortalUrl: string;
  vendorsResourcesUrl: string;
  foodVendorsUrl: string;
  sponsorsUrl: string;
  customLink1Label: string;
  customLink1Url: string;
  customLink2Label: string;
  customLink2Url: string;
  customLabelPlaceholder: string;
  customUrlPlaceholder: string;
  urlExample: string;
  registrationRevealedBecause: string;
  opt: string;
}> = {
  es: {
    sectionTitle: "7. Enlaces útiles de la clase",
    sectionIntro: "Agrega solo los enlaces que aplican. En la página pública mostraremos botones claros, no URLs largas.",
    registrationUrl: "Enlace de registro",
    registrationUrlPlaceholder: "https://ejemplo.com/registro",
    registrationUrlConfirm: "✓ Enlace de registro agregado",
    paymentUrl: "Enlace de pago",
    ticketsUrl: "Boletos",
    donationUrl: "Donación / beca",
    classMaterialsUrl: "Materiales de la clase",
    syllabusUrl: "Programa / temario",
    classGuideUrl: "Guía de la clase",
    instructorPageUrl: "Página del instructor",
    studentPortalUrl: "Portal del estudiante",
    vendorsResourcesUrl: "Vendedores / recursos",
    foodVendorsUrl: "Comida / puestos",
    sponsorsUrl: "Patrocinadores",
    customLink1Label: "Enlace adicional 1 — etiqueta",
    customLink1Url: "Enlace adicional 1 — URL",
    customLink2Label: "Enlace adicional 2 — etiqueta",
    customLink2Url: "Enlace adicional 2 — URL",
    customLabelPlaceholder: "Ej. Mapa de la clase",
    customUrlPlaceholder: "https://ejemplo.com",
    urlExample: "Ej. https://ejemplo.com",
    registrationRevealedBecause: "Seleccionaste \"Se requiere registro\" — agrega el enlace aquí.",
    opt: "opcional",
  },
  en: {
    sectionTitle: "7. Useful class links",
    sectionIntro: "Add only the links that apply. On the public page we show clean buttons, not long URLs.",
    registrationUrl: "Registration link",
    registrationUrlPlaceholder: "https://example.com/register",
    registrationUrlConfirm: "✓ Registration link added",
    paymentUrl: "Payment link",
    ticketsUrl: "Tickets",
    donationUrl: "Donation / scholarship",
    classMaterialsUrl: "Class materials",
    syllabusUrl: "Program / syllabus",
    classGuideUrl: "Class guide",
    instructorPageUrl: "Instructor page",
    studentPortalUrl: "Student portal",
    vendorsResourcesUrl: "Vendors / resources",
    foodVendorsUrl: "Food / vendors",
    sponsorsUrl: "Sponsors",
    customLink1Label: "Additional link 1 — label",
    customLink1Url: "Additional link 1 — URL",
    customLink2Label: "Additional link 2 — label",
    customLink2Url: "Additional link 2 — URL",
    customLabelPlaceholder: "e.g. Class map",
    customUrlPlaceholder: "https://example.com",
    urlExample: "e.g. https://example.com",
    registrationRevealedBecause: "You selected \"Registration required\" — add the link here.",
    opt: "optional",
  },
};

type ClassLinksProps = {
  lang: Lang;
  registrationRequired: string;
  classLinks: ClasesClassLinks;
  onChangeLinks: (p: Partial<ClasesClassLinks>) => void;
};

export function ClasesClassLinksSection({ lang, registrationRequired, classLinks, onChangeLinks }: ClassLinksProps) {
  const t = CLASS_LINKS_COPY[lang];
  const registrationIsRequired = registrationRequired === "si";
  const opt = `(${t.opt})`;

  return (
    <fieldset
      className="space-y-4 rounded-xl border border-[#C9B46A]/35 bg-[#FCF9F2]/40 px-4 py-4 ring-1 ring-[#C9B46A]/15"
      data-testid="clases-class-links-section"
    >
      <legend className="px-1 text-sm font-semibold text-[color:var(--lx-text)]">{t.sectionTitle}</legend>
      <p className="text-xs leading-relaxed text-[color:var(--lx-text-2)]">{t.sectionIntro}</p>

      {registrationIsRequired ? (
        <div className="rounded-lg border border-emerald-300/60 bg-emerald-50/70 px-3 py-2.5 text-xs text-emerald-900">
          {t.registrationRevealedBecause}
        </div>
      ) : null}

      {registrationIsRequired || classLinks.registrationUrl.trim() ? (
        <UrlField
          label={t.registrationUrl}
          value={classLinks.registrationUrl}
          onChange={(v) => onChangeLinks({ registrationUrl: v })}
          placeholder={t.registrationUrlPlaceholder}
          confirmText={t.registrationUrlConfirm}
        />
      ) : (
        <UrlField
          label={`${t.registrationUrl} ${opt}`}
          value={classLinks.registrationUrl}
          onChange={(v) => onChangeLinks({ registrationUrl: v })}
          placeholder={t.registrationUrlPlaceholder}
          confirmText={t.registrationUrlConfirm}
        />
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <UrlField
          label={`${t.paymentUrl} ${opt}`}
          value={classLinks.paymentUrl}
          onChange={(v) => onChangeLinks({ paymentUrl: v })}
          placeholder={t.urlExample}
        />
        <UrlField
          label={`${t.ticketsUrl} ${opt}`}
          value={classLinks.ticketsUrl}
          onChange={(v) => onChangeLinks({ ticketsUrl: v })}
          placeholder={t.urlExample}
        />
        <UrlField
          label={`${t.donationUrl} ${opt}`}
          value={classLinks.donationUrl}
          onChange={(v) => onChangeLinks({ donationUrl: v })}
          placeholder={t.urlExample}
        />
        <UrlField
          label={`${t.classMaterialsUrl} ${opt}`}
          value={classLinks.classMaterialsUrl}
          onChange={(v) => onChangeLinks({ classMaterialsUrl: v })}
          placeholder={t.urlExample}
        />
        <UrlField
          label={`${t.syllabusUrl} ${opt}`}
          value={classLinks.syllabusUrl}
          onChange={(v) => onChangeLinks({ syllabusUrl: v })}
          placeholder={t.urlExample}
        />
        <UrlField
          label={`${t.classGuideUrl} ${opt}`}
          value={classLinks.classGuideUrl}
          onChange={(v) => onChangeLinks({ classGuideUrl: v })}
          placeholder={t.urlExample}
        />
        <UrlField
          label={`${t.instructorPageUrl} ${opt}`}
          value={classLinks.instructorPageUrl}
          onChange={(v) => onChangeLinks({ instructorPageUrl: v })}
          placeholder={t.urlExample}
        />
        <UrlField
          label={`${t.studentPortalUrl} ${opt}`}
          value={classLinks.studentPortalUrl}
          onChange={(v) => onChangeLinks({ studentPortalUrl: v })}
          placeholder={t.urlExample}
        />
        <UrlField
          label={`${t.vendorsResourcesUrl} ${opt}`}
          value={classLinks.vendorsResourcesUrl}
          onChange={(v) => onChangeLinks({ vendorsResourcesUrl: v })}
          placeholder={t.urlExample}
        />
        <UrlField
          label={`${t.foodVendorsUrl} ${opt}`}
          value={classLinks.foodVendorsUrl}
          onChange={(v) => onChangeLinks({ foodVendorsUrl: v })}
          placeholder={t.urlExample}
        />
        <UrlField
          label={`${t.sponsorsUrl} ${opt}`}
          value={classLinks.sponsorsUrl}
          onChange={(v) => onChangeLinks({ sponsorsUrl: v })}
          placeholder={t.urlExample}
        />
      </div>

      {/* Custom links */}
      <div className="space-y-3 border-t border-[#C9B46A]/25 pt-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block min-w-0 text-sm">
            <span className="text-xs font-semibold text-[color:var(--lx-text)]">{t.customLink1Label}</span>
            <input
              value={classLinks.customLink1Label}
              onChange={(e) => onChangeLinks({ customLink1Label: e.target.value })}
              className={INPUT}
              type="text"
              placeholder={t.customLabelPlaceholder}
            />
          </label>
          <UrlField
            label={t.customLink1Url}
            value={classLinks.customLink1Url}
            onChange={(v) => onChangeLinks({ customLink1Url: v })}
            placeholder={t.customUrlPlaceholder}
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block min-w-0 text-sm">
            <span className="text-xs font-semibold text-[color:var(--lx-text)]">{t.customLink2Label}</span>
            <input
              value={classLinks.customLink2Label}
              onChange={(e) => onChangeLinks({ customLink2Label: e.target.value })}
              className={INPUT}
              type="text"
              placeholder={t.customLabelPlaceholder}
            />
          </label>
          <UrlField
            label={t.customLink2Url}
            value={classLinks.customLink2Url}
            onChange={(v) => onChangeLinks({ customLink2Url: v })}
            placeholder={t.customUrlPlaceholder}
          />
        </div>
      </div>
    </fieldset>
  );
}

export function ComunidadEventLinksSection({ lang, registrationRequired, eventLinks, onChangeLinks }: EventLinksProps) {
  const t = EVENT_LINKS_COPY[lang];
  const registrationIsRequired = registrationRequired === "si";

  return (
    <fieldset
      className="space-y-4 rounded-xl border border-[#C9B46A]/35 bg-[#FCF9F2]/40 px-4 py-4 ring-1 ring-[#C9B46A]/15"
      data-testid="comunidad-event-links-section"
    >
      <legend className="px-1 text-sm font-semibold text-[color:var(--lx-text)]">{t.sectionTitle}</legend>
      <p className="text-xs leading-relaxed text-[color:var(--lx-text-2)]">{t.sectionIntro}</p>

      {registrationIsRequired ? (
        <div className="rounded-lg border border-emerald-300/60 bg-emerald-50/70 px-3 py-2.5 text-xs text-emerald-900">
          {t.registrationRevealedBecause}
        </div>
      ) : null}

      {/* Registration link — always shown if registration is required, otherwise optional */}
      {registrationIsRequired || eventLinks.registrationUrl.trim() ? (
        <UrlField
          label={t.registrationUrl}
          value={eventLinks.registrationUrl}
          onChange={(v) => onChangeLinks({ registrationUrl: v })}
          placeholder={t.registrationUrlPlaceholder}
          confirmText={t.registrationUrlConfirm}
        />
      ) : (
        <UrlField
          label={`${t.registrationUrl} (${lang === "es" ? "opcional" : "optional"})`}
          value={eventLinks.registrationUrl}
          onChange={(v) => onChangeLinks({ registrationUrl: v })}
          placeholder={t.registrationUrlPlaceholder}
          confirmText={t.registrationUrlConfirm}
        />
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <UrlField
          label={`${t.ticketsUrl} (${lang === "es" ? "opcional" : "optional"})`}
          value={eventLinks.ticketsUrl}
          onChange={(v) => onChangeLinks({ ticketsUrl: v })}
          placeholder={t.urlExample}
        />
        <UrlField
          label={`${t.donationUrl} (${lang === "es" ? "opcional" : "optional"})`}
          value={eventLinks.donationUrl}
          onChange={(v) => onChangeLinks({ donationUrl: v })}
          placeholder={t.urlExample}
        />
        <UrlField
          label={`${t.eventProgramUrl} (${lang === "es" ? "opcional" : "optional"})`}
          value={eventLinks.eventProgramUrl}
          onChange={(v) => onChangeLinks({ eventProgramUrl: v })}
          placeholder={t.urlExample}
        />
        <UrlField
          label={`${t.eventGuideUrl} (${lang === "es" ? "opcional" : "optional"})`}
          value={eventLinks.eventGuideUrl}
          onChange={(v) => onChangeLinks({ eventGuideUrl: v })}
          placeholder={t.urlExample}
        />
        <UrlField
          label={`${t.vendorListUrl} (${lang === "es" ? "opcional" : "optional"})`}
          value={eventLinks.vendorListUrl}
          onChange={(v) => onChangeLinks({ vendorListUrl: v })}
          placeholder={t.urlExample}
        />
        <UrlField
          label={`${t.foodVendorsUrl} (${lang === "es" ? "opcional" : "optional"})`}
          value={eventLinks.foodVendorsUrl}
          onChange={(v) => onChangeLinks({ foodVendorsUrl: v })}
          placeholder={t.urlExample}
        />
        <UrlField
          label={`${t.sponsorsUrl} (${lang === "es" ? "opcional" : "optional"})`}
          value={eventLinks.sponsorsUrl}
          onChange={(v) => onChangeLinks({ sponsorsUrl: v })}
          placeholder={t.urlExample}
        />
      </div>

      {/* Custom links */}
      <div className="space-y-3 border-t border-[#C9B46A]/25 pt-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block min-w-0 text-sm">
            <span className="text-xs font-semibold text-[color:var(--lx-text)]">{t.customLink1Label}</span>
            <input
              value={eventLinks.customLink1Label}
              onChange={(e) => onChangeLinks({ customLink1Label: e.target.value })}
              className={INPUT}
              type="text"
              placeholder={t.customLabelPlaceholder}
            />
          </label>
          <UrlField
            label={t.customLink1Url}
            value={eventLinks.customLink1Url}
            onChange={(v) => onChangeLinks({ customLink1Url: v })}
            placeholder={t.customUrlPlaceholder}
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block min-w-0 text-sm">
            <span className="text-xs font-semibold text-[color:var(--lx-text)]">{t.customLink2Label}</span>
            <input
              value={eventLinks.customLink2Label}
              onChange={(e) => onChangeLinks({ customLink2Label: e.target.value })}
              className={INPUT}
              type="text"
              placeholder={t.customLabelPlaceholder}
            />
          </label>
          <UrlField
            label={t.customLink2Url}
            value={eventLinks.customLink2Url}
            onChange={(v) => onChangeLinks({ customLink2Url: v })}
            placeholder={t.customUrlPlaceholder}
          />
        </div>
      </div>
    </fieldset>
  );
}
