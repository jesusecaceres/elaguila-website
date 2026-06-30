"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import CityAutocomplete from "@/app/components/CityAutocomplete";
import { BuscoShellLayout } from "@/app/(site)/clasificados/busco/shared/BuscoShellLayout";
import { buscoLangFromSearchParams } from "@/app/(site)/clasificados/busco/shared/buscoShellCopy";
import { markPublishFlowOpeningPreview } from "@/app/clasificados/lib/publishFlowLifecycleClient";
import { EmpleosReadinessBanner } from "@/app/publicar/empleos/shared/components/EmpleosReadinessBanner";
import {
  EmpleosFieldLabel,
  EmpleosSectionCard,
} from "@/app/publicar/empleos/shared/ui/empleosFormPrimitives";
import {
  flushCommunityDraftToSession,
  useCommunityDraftSession,
} from "@/app/publicar/community/shared/hooks/useCommunityDraftSession";
import { formatPhoneInputDisplay } from "@/app/clasificados/publicar/servicios/lib/serviciosPhoneUi";

import { buscoFormCopy } from "../shared/buscoFormCopy";
import { buscoHandoffPreviewUrl } from "../shared/buscoPublishRoutes";
import { emptyBuscoQuickDraft, normalizeBuscoQuickDraft } from "../shared/buscoQuickDraft";
import { gateBuscoQuickPreview } from "../shared/buscoRequiredForPreview";
import { BUSCO_QUICK_DRAFT_KEY } from "../shared/buscoSessionKeys";
import { BUSCO_TYPE_OPTIONS } from "../shared/buscoTaxonomy";

const INPUT =
  "mt-1 min-h-[44px] w-full rounded-lg border border-[#C9B46A]/35 bg-white px-3 py-2.5 text-sm text-[#2A2826] outline-none focus:border-[#7B2D42]/50 focus:ring-2 focus:ring-[#C9B46A]/20";
const TEXTAREA =
  "mt-1 min-h-[96px] w-full rounded-lg border border-[#C9B46A]/35 bg-white px-3 py-2.5 text-sm text-[#2A2826] outline-none focus:border-[#7B2D42]/50 focus:ring-2 focus:ring-[#C9B46A]/20";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

export default function BuscoQuickFormClient() {
  const router = useRouter();
  const sp = useSearchParams();
  const lang = buscoLangFromSearchParams(sp);
  const copy = buscoFormCopy(lang);
  const fileRef = useRef<HTMLInputElement>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  const { state, patch, hydrated } = useCommunityDraftSession(
    BUSCO_QUICK_DRAFT_KEY,
    emptyBuscoQuickDraft(),
    (raw) => normalizeBuscoQuickDraft(raw),
  );

  const gate = useMemo(() => gateBuscoQuickPreview(state, lang), [state, lang]);
  const previewDisabled = !gate.ok;
  const previewIssues = gate.ok ? [] : gate.issues;

  const goPreview = useCallback(() => {
    if (previewDisabled) return;
    flushCommunityDraftToSession(BUSCO_QUICK_DRAFT_KEY, state, (raw) => normalizeBuscoQuickDraft(raw));
    markPublishFlowOpeningPreview();
    router.push(buscoHandoffPreviewUrl(lang));
  }, [previewDisabled, state, router, lang]);

  const onImagePick = useCallback(
    (file: File | null) => {
      setImageError(null);
      if (!file) {
        patch({ imageDataUrl: "", imageFileName: "" });
        return;
      }
      if (!/^image\/(jpeg|png|webp)$/i.test(file.type)) {
        setImageError(lang === "es" ? "Usa JPG, PNG o WebP." : "Use JPG, PNG, or WebP.");
        return;
      }
      if (file.size > MAX_IMAGE_BYTES) {
        setImageError(lang === "es" ? "La imagen es demasiado grande (máx. 8 MB)." : "Image is too large (max 8 MB).");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const url = typeof reader.result === "string" ? reader.result : "";
        patch({ imageDataUrl: url, imageFileName: file.name });
      };
      reader.onerror = () => {
        setImageError(lang === "es" ? "No se pudo leer la imagen." : "Could not read the image.");
      };
      reader.readAsDataURL(file);
    },
    [patch, lang],
  );

  if (!hydrated) {
    return (
      <BuscoShellLayout lang={lang}>
        <div className="min-h-[40vh] animate-pulse rounded-xl bg-[#FCF9F2]" aria-busy="true" />
      </BuscoShellLayout>
    );
  }

  return (
    <BuscoShellLayout lang={lang}>
      <p className="text-sm text-[#6B5E4E]/90">{copy.pageSubtitle}</p>

      <EmpleosReadinessBanner visible={!gate.ok} intro={copy.gateFail} issues={previewIssues} />

      <form
        className="mt-5 space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          goPreview();
        }}
      >
        {/* ── 1. Tu solicitud ────────────────────────────────── */}
        <EmpleosSectionCard title={copy.sections.main}>
          <label className="block text-sm">
            <EmpleosFieldLabel lang={lang} required>
              {copy.fields.type}
            </EmpleosFieldLabel>
            <select
              className={INPUT}
              value={state.buscoType}
              onChange={(e) =>
                patch({
                  buscoType: e.target.value as typeof state.buscoType,
                  ...(e.target.value !== "otro" ? { buscoTypeCustom: "" } : {}),
                })
              }
            >
              <option value="">{lang === "es" ? "— Selecciona —" : "— Select —"}</option>
              {BUSCO_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {lang === "en" ? opt.labelEn : opt.labelEs}
                </option>
              ))}
            </select>
          </label>

          {state.buscoType === "otro" ? (
            <label className="block text-sm">
              <EmpleosFieldLabel lang={lang} required>
                {copy.fields.typeOther}
              </EmpleosFieldLabel>
              <input
                className={INPUT}
                value={state.buscoTypeCustom}
                onChange={(e) => patch({ buscoTypeCustom: e.target.value })}
                maxLength={120}
              />
            </label>
          ) : null}

          <label className="block text-sm">
            <EmpleosFieldLabel lang={lang} required>
              {copy.fields.title}
            </EmpleosFieldLabel>
            <input
              className={INPUT}
              value={state.title}
              onChange={(e) => patch({ title: e.target.value })}
              maxLength={200}
            />
          </label>

          <label className="block text-sm">
            <EmpleosFieldLabel lang={lang} required>
              {copy.fields.description}
            </EmpleosFieldLabel>
            <textarea
              className={TEXTAREA}
              value={state.description}
              onChange={(e) => patch({ description: e.target.value })}
              maxLength={2000}
              rows={4}
            />
          </label>
        </EmpleosSectionCard>

        {/* ── 2. Ubicación aproximada ────────────────────────── */}
        <EmpleosSectionCard title={copy.sections.location}>
          <p className="rounded-lg border border-[#C9B46A]/30 bg-[#FFFDF5] px-3 py-2 text-xs text-[#6B5E4E]">
            {copy.locationPrivacyWarning}
          </p>
          <label className="block text-sm">
            <EmpleosFieldLabel lang={lang} required>
              {copy.fields.city}
            </EmpleosFieldLabel>
            <CityAutocomplete
              value={state.city}
              onChange={(v) => patch({ city: v })}
              placeholder={lang === "es" ? "Ciudad" : "City"}
              lang={lang}
              variant="light"
              className={INPUT}
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <EmpleosFieldLabel lang={lang} optional>
                {copy.fields.state}
              </EmpleosFieldLabel>
              <input
                className={INPUT}
                value={state.state}
                onChange={(e) => patch({ state: e.target.value })}
                maxLength={80}
                placeholder={lang === "es" ? "Ej. California" : "e.g. California"}
              />
            </label>
            <label className="block text-sm">
              <EmpleosFieldLabel lang={lang} optional>
                {copy.fields.country}
              </EmpleosFieldLabel>
              <input
                className={INPUT}
                value={state.country}
                onChange={(e) => patch({ country: e.target.value })}
                maxLength={80}
                placeholder={lang === "es" ? "Ej. Estados Unidos" : "e.g. United States"}
              />
            </label>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <EmpleosFieldLabel lang={lang} optional>
                {copy.fields.zip}
              </EmpleosFieldLabel>
              <input
                className={INPUT}
                value={state.zip}
                onChange={(e) => patch({ zip: e.target.value })}
                maxLength={20}
                placeholder="95382"
              />
            </label>
            <label className="block text-sm">
              <EmpleosFieldLabel lang={lang} optional>
                {copy.fields.zone}
              </EmpleosFieldLabel>
              <input
                className={INPUT}
                value={state.zone}
                onChange={(e) => patch({ zone: e.target.value })}
                maxLength={120}
                placeholder={lang === "es" ? "Ej. Barrio norte" : "e.g. North side"}
              />
            </label>
          </div>
        </EmpleosSectionCard>

        {/* ── 3. Presupuesto y urgencia ──────────────────────── */}
        <EmpleosSectionCard title={copy.sections.budgetUrgency}>
          <label className="block text-sm">
            <EmpleosFieldLabel lang={lang} optional>
              {copy.fields.budget}
            </EmpleosFieldLabel>
            <input
              className={INPUT}
              value={state.budget}
              onChange={(e) => patch({ budget: e.target.value })}
              maxLength={80}
              placeholder={lang === "es" ? "Ej. $50–100, Gratis, Intercambio" : "e.g. $50–100, Free, Trade"}
            />
          </label>
          <label className="block text-sm">
            <EmpleosFieldLabel lang={lang} optional>
              {copy.fields.urgency}
            </EmpleosFieldLabel>
            <select
              className={INPUT}
              value={state.urgency}
              onChange={(e) => patch({ urgency: e.target.value as typeof state.urgency })}
            >
              <option value="normal">{copy.urgencyOptions.normal}</option>
              <option value="pronto">{copy.urgencyOptions.pronto}</option>
              <option value="urgente">{copy.urgencyOptions.urgente}</option>
            </select>
          </label>
        </EmpleosSectionCard>

        {/* ── 4. Contacto ───────────────────────────────────── */}
        <EmpleosSectionCard title={copy.sections.contact}>
          <p className="text-xs text-[#6B5E4E]/85">{copy.contactHint}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <EmpleosFieldLabel lang={lang} optional>
                {copy.fields.phone}
              </EmpleosFieldLabel>
              <input
                className={INPUT}
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={state.phone}
                onChange={(e) => patch({ phone: formatPhoneInputDisplay(e.target.value) })}
                maxLength={14}
              />
            </label>
            <label className="block text-sm">
              <EmpleosFieldLabel lang={lang} optional>
                {copy.fields.whatsapp}
              </EmpleosFieldLabel>
              <input
                className={INPUT}
                type="tel"
                inputMode="tel"
                value={state.whatsapp}
                onChange={(e) => patch({ whatsapp: formatPhoneInputDisplay(e.target.value) })}
                maxLength={14}
              />
            </label>
            <label className="block text-sm">
              <EmpleosFieldLabel lang={lang} optional>
                {copy.fields.smsPhone}
              </EmpleosFieldLabel>
              <input
                className={INPUT}
                type="tel"
                inputMode="tel"
                value={state.smsPhone}
                onChange={(e) => patch({ smsPhone: formatPhoneInputDisplay(e.target.value) })}
                maxLength={14}
                placeholder={lang === "es" ? "Si es diferente al teléfono" : "If different from call phone"}
              />
            </label>
            <label className="block text-sm">
              <EmpleosFieldLabel lang={lang} optional>
                {copy.fields.email}
              </EmpleosFieldLabel>
              <input
                className={INPUT}
                type="email"
                inputMode="email"
                autoComplete="email"
                value={state.email}
                onChange={(e) => patch({ email: e.target.value })}
              />
            </label>
          </div>
          <label className="block text-sm">
            <EmpleosFieldLabel lang={lang} optional>
              {copy.fields.preferredContact}
            </EmpleosFieldLabel>
            <select
              className={INPUT}
              value={state.preferredContact}
              onChange={(e) => patch({ preferredContact: e.target.value as typeof state.preferredContact })}
            >
              <option value="telefono">{copy.preferredContactOptions.telefono}</option>
              <option value="whatsapp">{copy.preferredContactOptions.whatsapp}</option>
              <option value="mensaje">{copy.preferredContactOptions.mensaje}</option>
              <option value="correo">{copy.preferredContactOptions.correo}</option>
            </select>
          </label>
        </EmpleosSectionCard>

        {/* ── 5. Redes o enlace opcional ─────────────────────── */}
        <EmpleosSectionCard title={copy.sections.socials}>
          <p className="text-xs text-[#6B5E4E]/85">{copy.socialsIntro}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <EmpleosFieldLabel lang={lang} optional>
                {copy.fields.facebook}
              </EmpleosFieldLabel>
              <input
                className={INPUT}
                type="text"
                inputMode="url"
                value={state.facebook}
                onChange={(e) => patch({ facebook: e.target.value })}
                placeholder="facebook.com/tupagina"
                autoComplete="off"
              />
            </label>
            <label className="block text-sm">
              <EmpleosFieldLabel lang={lang} optional>
                {copy.fields.instagram}
              </EmpleosFieldLabel>
              <input
                className={INPUT}
                type="text"
                inputMode="url"
                value={state.instagram}
                onChange={(e) => patch({ instagram: e.target.value })}
                placeholder="instagram.com/tuperfil"
                autoComplete="off"
              />
            </label>
            <label className="block text-sm">
              <EmpleosFieldLabel lang={lang} optional>
                {copy.fields.tiktok}
              </EmpleosFieldLabel>
              <input
                className={INPUT}
                type="text"
                inputMode="url"
                value={state.tiktok}
                onChange={(e) => patch({ tiktok: e.target.value })}
                placeholder="tiktok.com/@tuusuario"
                autoComplete="off"
              />
            </label>
          </div>
          <p className="text-xs text-[#6B5E4E]/70">{copy.otherLinkHint}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <EmpleosFieldLabel lang={lang} optional>
                {copy.fields.otherContactLabel}
              </EmpleosFieldLabel>
              <input
                className={INPUT}
                type="text"
                value={state.otherContactLabel}
                onChange={(e) => patch({ otherContactLabel: e.target.value })}
                maxLength={60}
                placeholder={lang === "es" ? "Ej. Telegram" : "e.g. Telegram"}
              />
            </label>
            <label className="block text-sm">
              <EmpleosFieldLabel lang={lang} optional>
                {copy.fields.otherContactUrl}
              </EmpleosFieldLabel>
              <input
                className={INPUT}
                type="text"
                inputMode="url"
                value={state.otherContactUrl}
                onChange={(e) => patch({ otherContactUrl: e.target.value })}
                placeholder="https://..."
                autoComplete="off"
              />
            </label>
          </div>
        </EmpleosSectionCard>

        {/* ── 6. Imagen de referencia ────────────────────────── */}
        <EmpleosSectionCard title={copy.sections.media}>
          <p className="text-xs text-[#6B5E4E]/85">{copy.imageHelperText}</p>
          <p className="text-xs text-[#6B5E4E]/70">{copy.imageHint}</p>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null;
              onImagePick(f);
              e.target.value = "";
            }}
          />
          {state.imageDataUrl ? (
            <div>
              <img
                src={state.imageDataUrl}
                alt=""
                className="max-h-48 w-full rounded-xl border border-[#C9B46A]/35 object-cover"
              />
              <button
                type="button"
                onClick={() => {
                  patch({ imageDataUrl: "", imageFileName: "" });
                  setImageError(null);
                }}
                className="mt-2 min-h-[40px] rounded-lg border border-[#C9B46A]/40 px-3 py-2 text-sm font-semibold text-[#7B2D42]"
              >
                {copy.imageRemove}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex min-h-[48px] w-full items-center justify-center rounded-xl border border-dashed border-[#C9B46A]/50 bg-[#FCF9F2] px-4 py-3 text-sm font-semibold text-[#7B2D42]"
            >
              {copy.fields.image}
            </button>
          )}
          {imageError ? <p className="mt-1 text-sm text-red-700">{imageError}</p> : null}
        </EmpleosSectionCard>

        <button
          type="submit"
          disabled={previewDisabled}
          className="flex min-h-[52px] w-full items-center justify-center rounded-xl bg-[#7B2D42] px-5 py-3 text-sm font-bold text-[#FCF9F2] shadow-sm transition hover:bg-[#9B3A52] disabled:cursor-not-allowed disabled:opacity-45"
        >
          {copy.previewCta}
        </button>
      </form>
    </BuscoShellLayout>
  );
}
