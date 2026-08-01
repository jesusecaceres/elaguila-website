"use client";

import { ALLOWED_PREFERRED_CHANNEL_KINDS_BY_CONTACT_TYPE, CONTACT_CAPABILITIES, CONTACT_LABELS, CUSTOM_LINK_TYPES, DIGITAL_PROFILE_PLATFORMS, PREFERRED_RESPONSE_METHODS } from "@/app/lib/business/constants";
import { normalizeEmail, normalizeWebsiteDisplayValue } from "@/app/lib/business/normalization";
import { validatePreferredResponseMethod } from "@/app/lib/business/validation";
import type { ChannelKind, ContactLabel, ContactType, ContactVisibility, CustomLinkType, PreferredResponseMethod } from "@/app/lib/business/types";
import { WhyWeAsk } from "../../_components/OptionToggleGroup";
import type { BusinessIdentityCopy, Lang } from "../../_components/businessIdentityCopy";
import type { WizardContactDraftV2, WizardCustomLinkDraft, WizardDraftPayloadV2 } from "../wizardTypes";
import { newContactDraftV2, newCustomLinkDraft, newDigitalProfileDraft } from "../wizardTypes";

function updateContact(payload: WizardDraftPayloadV2, id: string, patch: Partial<WizardContactDraftV2>): WizardDraftPayloadV2 {
  return { ...payload, contacts: payload.contacts.map((c) => (c.id === id ? { ...c, ...patch } : c)) };
}

function updateCustomLink(payload: WizardDraftPayloadV2, id: string, patch: Partial<WizardCustomLinkDraft>): WizardDraftPayloadV2 {
  return { ...payload, customLinks: payload.customLinks.map((l) => (l.id === id ? { ...l, ...patch } : l)) };
}

/**
 * Display-only US/Canada (NANP) formatting — used both on the Step 6 input's blur (never while
 * focused, to avoid the classic cursor-jump bug live-reformatting causes) and, as of Gate
 * BCO-3R-B.5, to render Step 9 review and the completed-profile page so raw canonical digits
 * (e.g. "14088021531") are never shown to the owner. A bare 10-digit number, or an 11-digit
 * number with the "1" NANP country code (with or without a leading "+"), both format the same
 * friendly way; the leading "1" is the country code implied by the parenthesized-area-code format
 * itself, not lost information. Every other length/country code is left exactly as typed — a
 * meaningful (non-NANP) country code is never stripped, and canonical storage normalization still
 * happens separately via normalizePhone/normalizeContactValue, unchanged by this display step.
 */
export function formatUsPhoneForDisplay(raw: string): string {
  const digitsWithCountryCode = raw.replace(/\D/g, "");
  const digits = digitsWithCountryCode.length === 11 && digitsWithCountryCode.startsWith("1") ? digitsWithCountryCode.slice(1) : digitsWithCountryCode;
  if (digits.length !== 10) return raw;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

const PLATFORM_HOMEPAGE_DOMAINS: Partial<Record<string, string>> = {
  facebook: "facebook.com",
  instagram: "instagram.com",
  tiktok: "tiktok.com",
  youtube: "youtube.com",
  linkedin: "linkedin.com",
  x: "x.com",
  yelp: "yelp.com",
  snapchat: "snapchat.com",
  pinterest: "pinterest.com",
};

/** True when the value is just the platform's bare homepage — not an actual business profile link. */
export function isPlatformHomepageOnly(platform: string, raw: string): boolean {
  const domain = PLATFORM_HOMEPAGE_DOMAINS[platform];
  if (!domain || !raw.trim()) return false;
  const trimmed = raw.trim().replace(/^https?:\/\//i, "").replace(/^www\./i, "");
  const [host, ...rest] = trimmed.split("/");
  const path = rest.join("/").replace(/[?#].*$/, "");
  return host.toLowerCase() === domain && path.trim().length === 0;
}

export function normalizeHandleOrUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return trimmed;
  if (trimmed.startsWith("@") || !/[./]/.test(trimmed)) return trimmed; // bare handle, e.g. @business — leave as-is
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function contactValueLabel(t: BusinessIdentityCopy["wizard"]["step6"], contactType: ContactType | "", lang: Lang): string {
  if (contactType === "phone") return lang === "es" ? "Número de teléfono" : "Phone number";
  if (contactType === "email") return lang === "es" ? "Correo electrónico" : "Email address";
  if (contactType === "website") return lang === "es" ? "Sitio web" : "Website";
  return t.contactValueLabel;
}

export function Step6ContactsProfiles({
  t,
  whyWeAskLabel,
  lang,
  payload,
  onChange,
  errors,
}: {
  t: BusinessIdentityCopy["wizard"]["step6"];
  whyWeAskLabel: string;
  lang: Lang;
  payload: WizardDraftPayloadV2;
  onChange: (next: WizardDraftPayloadV2) => void;
  errors: readonly string[];
}) {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold text-[#1E1810]">{t.title}</h2>

      <div>
        <h3 className="text-sm font-bold text-[#1E1810]">{t.contactsSectionTitle}</h3>
        <div className="mt-2 space-y-3">
          {payload.contacts.map((contact) => {
            const allowedChannels = contact.contactType ? ALLOWED_PREFERRED_CHANNEL_KINDS_BY_CONTACT_TYPE[contact.contactType] : [];
            return (
              <div key={contact.id} className="rounded-2xl border border-[#E8DFD0] bg-[#FAF7F2]/60 p-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label htmlFor={`contact-type-${contact.id}`} className="block text-xs font-semibold text-[#3D3428]">
                      {t.contactTypeLabel}
                    </label>
                    <select
                      id={`contact-type-${contact.id}`}
                      value={contact.contactType}
                      onChange={(e) => onChange(updateContact(payload, contact.id, { contactType: e.target.value as ContactType, channelKind: null, preferredChannel: false }))}
                      className="mt-1 w-full min-h-[44px] rounded-xl border border-[#E8DFD0] bg-white px-3 py-2 text-sm text-[#1E1810]"
                    >
                      <option value="">—</option>
                      <option value="phone">{lang === "es" ? "Teléfono" : "Phone"}</option>
                      <option value="email">{lang === "es" ? "Correo electrónico" : "Email"}</option>
                      <option value="website">{lang === "es" ? "Sitio web" : "Website"}</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor={`contact-value-${contact.id}`} className="block text-xs font-semibold text-[#3D3428]">
                      {contactValueLabel(t, contact.contactType, lang)}
                    </label>
                    <input
                      id={`contact-value-${contact.id}`}
                      type={contact.contactType === "email" ? "email" : contact.contactType === "phone" ? "tel" : "text"}
                      inputMode={contact.contactType === "phone" ? "tel" : contact.contactType === "email" ? "email" : "text"}
                      autoComplete={contact.contactType === "phone" ? "tel" : contact.contactType === "email" ? "email" : "url"}
                      value={contact.rawValue}
                      onChange={(e) => onChange(updateContact(payload, contact.id, { rawValue: e.target.value }))}
                      onBlur={(e) => {
                        const raw = e.target.value;
                        if (contact.contactType === "phone") {
                          onChange(updateContact(payload, contact.id, { rawValue: formatUsPhoneForDisplay(raw) }));
                        } else if (contact.contactType === "email") {
                          const normalized = normalizeEmail(raw);
                          if (normalized) onChange(updateContact(payload, contact.id, { rawValue: normalized }));
                        } else if (contact.contactType === "website") {
                          const normalized = normalizeWebsiteDisplayValue(raw);
                          if (normalized) onChange(updateContact(payload, contact.id, { rawValue: normalized }));
                        }
                      }}
                      className="mt-1 w-full min-h-[44px] rounded-xl border border-[#E8DFD0] bg-white px-3 py-2 text-sm text-[#1E1810]"
                    />
                  </div>
                  <div>
                    <label htmlFor={`contact-label-${contact.id}`} className="block text-xs font-semibold text-[#3D3428]">
                      {t.contactLabelLabel}
                    </label>
                    <select
                      id={`contact-label-${contact.id}`}
                      value={contact.label}
                      onChange={(e) => onChange(updateContact(payload, contact.id, { label: e.target.value as ContactLabel }))}
                      className="mt-1 w-full min-h-[44px] rounded-xl border border-[#E8DFD0] bg-white px-3 py-2 text-sm text-[#1E1810]"
                    >
                      {CONTACT_LABELS.map((l) => (
                        <option key={l.value} value={l.value}>
                          {l[lang]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-[#3D3428]">{t.contactVisibilityLabel}</span>
                    <div className="mt-1 flex gap-2">
                      {(["public", "private"] as const).map((v) => (
                        <button
                          key={v}
                          type="button"
                          role="radio"
                          aria-checked={contact.visibility === v}
                          onClick={() => onChange(updateContact(payload, contact.id, { visibility: v as ContactVisibility }))}
                          className={`min-h-[36px] rounded-lg border px-3 py-1.5 text-xs font-semibold ${contact.visibility === v ? "border-[#C9A84A] bg-[#FBF7EF]" : "border-[#E8DFD0] bg-white"}`}
                        >
                          {t.contactVisibilityOptions[v]}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {contact.contactType === "phone" ? (
                  <div className="mt-3">
                    <span className="block text-xs font-semibold text-[#3D3428]">{t.capabilitiesLabel}</span>
                    <div className="mt-1.5 flex flex-wrap gap-3">
                      {CONTACT_CAPABILITIES.map((cap) => (
                        <label key={cap.value} className="flex items-center gap-1.5 text-xs font-medium text-[#3D3428]">
                          <input
                            type="checkbox"
                            checked={contact.capabilities.includes(cap.value)}
                            onChange={(e) =>
                              onChange(
                                updateContact(payload, contact.id, {
                                  capabilities: e.target.checked
                                    ? [...contact.capabilities, cap.value]
                                    : contact.capabilities.filter((c) => c !== cap.value),
                                }),
                              )
                            }
                            className="h-4 w-4"
                          />
                          {cap[lang]}
                        </label>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="mt-3 flex flex-wrap items-center gap-4">
                  {/* Only one contact may be primary / preferred at a time (mirrors the DB's own
                      one-row unique index) — checking one here unchecks it on every other contact,
                      rather than letting the UI silently produce a combination the RPC would reject. */}
                  <label className="flex items-center gap-2 text-xs font-medium text-[#3D3428]">
                    <input
                      type="checkbox"
                      checked={contact.isPrimary}
                      onChange={(e) =>
                        onChange({
                          ...payload,
                          contacts: payload.contacts.map((c) => (c.id === contact.id ? { ...c, isPrimary: e.target.checked } : { ...c, isPrimary: e.target.checked ? false : c.isPrimary })),
                        })
                      }
                      className="h-4 w-4"
                    />
                    {t.primaryLabel}
                  </label>
                  <label className="flex items-center gap-2 text-xs font-medium text-[#3D3428]">
                    <input
                      type="checkbox"
                      checked={contact.preferredChannel}
                      disabled={!contact.contactType || allowedChannels.length === 0}
                      onChange={(e) =>
                        onChange({
                          ...payload,
                          contacts: payload.contacts.map((c) =>
                            c.id === contact.id
                              ? { ...c, preferredChannel: e.target.checked, channelKind: e.target.checked ? allowedChannels[0] ?? null : null }
                              : { ...c, preferredChannel: e.target.checked ? false : c.preferredChannel, channelKind: e.target.checked ? null : c.channelKind },
                          ),
                        })
                      }
                      className="h-4 w-4"
                    />
                    {t.preferredChannelLabel}
                  </label>
                  {contact.preferredChannel && allowedChannels.length > 0 ? (
                    <select
                      aria-label={t.preferredChannelKindLabel}
                      value={contact.channelKind ?? ""}
                      onChange={(e) => onChange(updateContact(payload, contact.id, { channelKind: e.target.value as ChannelKind }))}
                      className="min-h-[36px] rounded-lg border border-[#E8DFD0] bg-white px-2 py-1 text-xs text-[#1E1810]"
                    >
                      {allowedChannels.map((k) => (
                        <option key={k} value={k}>
                          {k}
                        </option>
                      ))}
                    </select>
                  ) : null}
                </div>

                {payload.contacts.length > 1 ? (
                  <button type="button" onClick={() => onChange({ ...payload, contacts: payload.contacts.filter((c) => c.id !== contact.id) })} className="mt-3 text-xs font-semibold text-[#7A1E2C] underline">
                    {t.removeContact}
                  </button>
                ) : null}
              </div>
            );
          })}
        </div>

        {errors.includes("contacts") ? <p role="alert" className="mt-2 text-xs text-[#7A1E2C]">{t.atLeastOne}</p> : null}

        <button
          type="button"
          onClick={() => onChange({ ...payload, contacts: [...payload.contacts, newContactDraftV2()] })}
          className="mt-3 inline-flex min-h-[40px] items-center justify-center rounded-xl border border-[#E8DFD0] bg-white px-4 py-2 text-xs font-semibold text-[#3D3428] hover:bg-[#FAF7F2]"
        >
          {t.addContact}
        </button>
      </div>

      <div>
        <h3 className="text-sm font-bold text-[#1E1810]">{t.preferredMethodSectionTitle}</h3>
        <p className="mt-0.5 text-xs text-[#7A7164]">{t.preferredMethodHint}</p>
        <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label={t.preferredMethodSectionTitle}>
          <button
            type="button"
            role="radio"
            aria-checked={payload.preferredResponseMethod === ""}
            onClick={() => onChange({ ...payload, preferredResponseMethod: "" })}
            className={`min-h-[40px] rounded-xl border px-4 py-2 text-sm font-semibold ${payload.preferredResponseMethod === "" ? "border-[#C9A84A] bg-[#FBF7EF] text-[#1E1810]" : "border-[#E8DFD0] bg-white text-[#3D3428] hover:bg-[#FAF7F2]"}`}
          >
            {t.preferredMethodNoneOption}
          </button>
          {PREFERRED_RESPONSE_METHODS.map((method) => {
            const compatible = validatePreferredResponseMethod({
              method: method.value,
              contacts: payload.contacts.filter((c) => c.contactType).map((c) => ({ contactType: c.contactType, capabilities: c.capabilities })),
            }).ok;
            const selected = payload.preferredResponseMethod === method.value;
            return (
              <button
                key={method.value}
                type="button"
                role="radio"
                aria-checked={selected}
                disabled={!compatible}
                title={!compatible ? t.preferredMethodIncompatible : undefined}
                onClick={() => onChange({ ...payload, preferredResponseMethod: method.value as PreferredResponseMethod })}
                className={`min-h-[40px] rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                  selected ? "border-[#C9A84A] bg-[#FBF7EF] text-[#1E1810]" : !compatible ? "cursor-not-allowed border-[#E8DFD0] bg-white text-[#B8AF9E]" : "border-[#E8DFD0] bg-white text-[#3D3428] hover:bg-[#FAF7F2]"
                }`}
              >
                {method[lang]}
              </button>
            );
          })}
        </div>
      </div>

      <WhyWeAsk label={whyWeAskLabel} text={t.whyWeAskText} />

      <div>
        <h3 className="text-sm font-bold text-[#1E1810]">{t.digitalProfilesSectionTitle}</h3>
        <p className="mt-0.5 text-xs text-[#7A7164]">{t.digitalProfilesHint}</p>
        <div className="mt-2 space-y-2">
          {DIGITAL_PROFILE_PLATFORMS.map((platformOption) => {
            const existing = payload.digitalProfiles.find((p) => p.platform === platformOption.value);
            const checked = Boolean(existing);
            return (
              <div key={platformOption.value} className="rounded-xl border border-[#E8DFD0] bg-[#FAF7F2]/50 p-3">
                <label className="flex items-center gap-2 text-sm font-medium text-[#3D3428]">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => {
                      if (e.target.checked) {
                        onChange({ ...payload, digitalProfiles: [...payload.digitalProfiles, { ...newDigitalProfileDraft(), platform: platformOption.value }] });
                      } else {
                        onChange({ ...payload, digitalProfiles: payload.digitalProfiles.filter((p) => p.platform !== platformOption.value) });
                      }
                    }}
                    className="h-4 w-4"
                  />
                  {platformOption[lang]}
                </label>
                {checked && existing ? (
                  <>
                    <input
                      type="text"
                      value={existing.handleOrUrl}
                      onChange={(e) =>
                        onChange({ ...payload, digitalProfiles: payload.digitalProfiles.map((p) => (p.id === existing.id ? { ...p, handleOrUrl: e.target.value } : p)) })
                      }
                      onBlur={(e) => {
                        const normalized = normalizeHandleOrUrl(e.target.value);
                        if (normalized !== existing.handleOrUrl) {
                          onChange({ ...payload, digitalProfiles: payload.digitalProfiles.map((p) => (p.id === existing.id ? { ...p, handleOrUrl: normalized } : p)) });
                        }
                      }}
                      placeholder={t.handleOrUrlLabel}
                      aria-label={`${platformOption[lang]} — ${t.handleOrUrlLabel}`}
                      className="mt-2 w-full min-h-[40px] rounded-lg border border-[#E8DFD0] bg-white px-3 py-2 text-sm text-[#1E1810]"
                    />
                    {isPlatformHomepageOnly(platformOption.value, existing.handleOrUrl) ? (
                      <p role="alert" className="mt-1 text-xs text-[#7A1E2C]">
                        {lang === "es"
                          ? `Eso parece ser la página principal de ${platformOption.es}, no tu perfil de negocio. Agrega el enlace directo a tu perfil.`
                          : `That looks like ${platformOption.en}'s homepage, not your business profile. Add the direct link to your profile.`}
                      </p>
                    ) : null}
                  </>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-bold text-[#1E1810]">{t.customLinksSectionTitle}</h3>
        <p className="mt-0.5 text-xs text-[#7A7164]">{t.customLinksHint}</p>
        <div className="mt-2 space-y-3">
          {payload.customLinks.map((link) => (
            <div key={link.id} className="rounded-2xl border border-[#E8DFD0] bg-[#FAF7F2]/60 p-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor={`custom-link-type-${link.id}`} className="block text-xs font-semibold text-[#3D3428]">
                    {t.customLinkTypeLabel}
                  </label>
                  <select
                    id={`custom-link-type-${link.id}`}
                    value={link.linkType}
                    onChange={(e) => onChange(updateCustomLink(payload, link.id, { linkType: e.target.value as CustomLinkType }))}
                    className="mt-1 w-full min-h-[44px] rounded-xl border border-[#E8DFD0] bg-white px-3 py-2 text-sm text-[#1E1810]"
                  >
                    <option value="">—</option>
                    {CUSTOM_LINK_TYPES.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o[lang]}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor={`custom-link-url-${link.id}`} className="block text-xs font-semibold text-[#3D3428]">
                    {t.customLinkUrlLabel}
                  </label>
                  <input
                    id={`custom-link-url-${link.id}`}
                    type="text"
                    value={link.rawUrl}
                    onChange={(e) => onChange(updateCustomLink(payload, link.id, { rawUrl: e.target.value }))}
                    onBlur={(e) => {
                      const normalized = normalizeHandleOrUrl(e.target.value);
                      if (normalized !== link.rawUrl) onChange(updateCustomLink(payload, link.id, { rawUrl: normalized }));
                    }}
                    className="mt-1 w-full min-h-[44px] rounded-xl border border-[#E8DFD0] bg-white px-3 py-2 text-sm text-[#1E1810]"
                  />
                </div>
              </div>
              {link.linkType === "other" ? (
                <div className="mt-3">
                  <label htmlFor={`custom-link-label-${link.id}`} className="block text-xs font-semibold text-[#3D3428]">
                    {t.customLabelLabel}
                  </label>
                  <input
                    id={`custom-link-label-${link.id}`}
                    type="text"
                    value={link.customLabel}
                    onChange={(e) => onChange(updateCustomLink(payload, link.id, { customLabel: e.target.value }))}
                    placeholder={t.customLabelPlaceholder}
                    className="mt-1 w-full min-h-[44px] rounded-xl border border-[#E8DFD0] bg-white px-3 py-2 text-sm text-[#1E1810]"
                  />
                </div>
              ) : null}
              <button
                type="button"
                onClick={() => onChange({ ...payload, customLinks: payload.customLinks.filter((l) => l.id !== link.id) })}
                className="mt-3 text-xs font-semibold text-[#7A1E2C] underline"
              >
                {t.removeCustomLink}
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => onChange({ ...payload, customLinks: [...payload.customLinks, newCustomLinkDraft()] })}
          className="mt-3 inline-flex min-h-[40px] items-center justify-center rounded-xl border border-[#E8DFD0] bg-white px-4 py-2 text-xs font-semibold text-[#3D3428] hover:bg-[#FAF7F2]"
        >
          {t.addCustomLink}
        </button>
      </div>
    </div>
  );
}

