"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import CityAutocomplete from "@/app/components/CityAutocomplete";
import { BuscoShellLayout } from "@/app/(site)/clasificados/busco/shared/BuscoShellLayout";
import { buscoLangFromSearchParams, buscoRouteLangFromSearchParams } from "@/app/(site)/clasificados/busco/shared/buscoShellCopy";
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
import { CommunityPublishConfirmationSection } from "@/app/publicar/community/shared/components/CommunityPublishConfirmationSection";
import { formatPhoneInputDisplay, formatWhatsAppInputDisplay } from "@/app/clasificados/publicar/servicios/lib/serviciosPhoneUi";
import { useBusinessApplicationLeaveGuard } from "@/app/lib/businessApplications/useBusinessApplicationLeaveGuard";

import { buscoFormCopy } from "../shared/buscoFormCopy";
import { buscoHandoffPreviewUrl } from "../shared/buscoPublishRoutes";
import { emptyBuscoQuickDraft, normalizeBuscoQuickDraft } from "../shared/buscoQuickDraft";
import { gateBuscoQuickPreview } from "../shared/buscoRequiredForPreview";
import { BUSCO_QUICK_DRAFT_KEY } from "../shared/buscoSessionKeys";
import { BUSCO_BUDGET_MODE_OPTIONS, BUSCO_TYPE_OPTIONS, BUSCO_URGENCY_OPTIONS } from "../shared/buscoTaxonomy";

const INPUT =
  "mt-1 min-h-[44px] w-full rounded-lg border border-[#C9B46A]/35 bg-white px-3 py-2.5 text-sm text-[#2A2826] outline-none focus:border-[#7B2D42]/50 focus:ring-2 focus:ring-[#C9B46A]/20";
const TEXTAREA =
  "mt-1 min-h-[140px] w-full rounded-lg border border-[#C9B46A]/35 bg-white px-3 py-2.5 text-sm text-[#2A2826] outline-none focus:border-[#7B2D42]/50 focus:ring-2 focus:ring-[#C9B46A]/20";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

export default function BuscoQuickFormClient() {
  const router = useRouter();
  const sp = useSearchParams();
  const lang = buscoLangFromSearchParams(sp);
  const routeLang = buscoRouteLangFromSearchParams(sp);
  const copy = buscoFormCopy(lang);
  const fileRef = useRef<HTMLInputElement>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  const { state, patch, hydrated } = useCommunityDraftSession(
    BUSCO_QUICK_DRAFT_KEY,
    emptyBuscoQuickDraft(),
    (raw) => normalizeBuscoQuickDraft(raw),
  );

  // Globalization Build D-F5 — this application had zero native browser-exit protection.
  // useCommunityDraftSession already persists synchronously on every state change, so this only
  // adds the "are you sure" warning on a real tab close; the flush call is a harmless no-op
  // safety net for the same session storage write.
  useBusinessApplicationLeaveGuard({
    isDirty: hydrated && state.title.trim() !== "",
    persist: () => flushCommunityDraftToSession(BUSCO_QUICK_DRAFT_KEY, state, (raw) => normalizeBuscoQuickDraft(raw)),
  });

  const gate = useMemo(() => gateBuscoQuickPreview(state, lang), [state, lang]);
  const previewDisabled = !gate.ok;
  const previewIssues = gate.ok ? [] : gate.issues;

  const goPreview = useCallback(() => {
    if (previewDisabled) return;
    flushCommunityDraftToSession(BUSCO_QUICK_DRAFT_KEY, state, (raw) => normalizeBuscoQuickDraft(raw));
    markPublishFlowOpeningPreview();
    router.push(buscoHandoffPreviewUrl(routeLang));
  }, [previewDisabled, state, router, routeLang]);

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

  const isArticulo = state.buscoType === "articulo";
  const isTrabajo = state.buscoType === "trabajo";
  const isServicio = state.buscoType === "servicio";
  const isTransporte = state.buscoType === "transporte";
  const isVoluntarios = state.buscoType === "voluntarios";
  const isAyudaRecursoGrupo =
    state.buscoType === "ayuda" || state.buscoType === "recurso_comunitario" || state.buscoType === "grupo_actividad";
  const showWhenNeeded = isServicio || isTransporte || isVoluntarios || isAyudaRecursoGrupo;
  const showDetailsSection = isArticulo || isTrabajo || isTransporte || isVoluntarios || showWhenNeeded;

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
            {isTrabajo ? <p className="mt-1.5 text-xs text-[#6B5E4E]/85">{copy.workNote}</p> : null}
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
              maxLength={3000}
              rows={7}
            />
          </label>
        </EmpleosSectionCard>

        {/* ── 2. Imagen de referencia — Section N: moved earlier in the form ─ */}
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

        {/* ── 3. Ubicación aproximada ────────────────────────── */}
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
          {isTransporte ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm">
                <EmpleosFieldLabel lang={lang} optional>
                  {copy.fields.transportOrigin}
                </EmpleosFieldLabel>
                <input
                  className={INPUT}
                  value={state.transportOrigin}
                  onChange={(e) => patch({ transportOrigin: e.target.value })}
                  maxLength={120}
                />
              </label>
              <label className="block text-sm">
                <EmpleosFieldLabel lang={lang} optional>
                  {copy.fields.transportDestination}
                </EmpleosFieldLabel>
                <input
                  className={INPUT}
                  value={state.transportDestination}
                  onChange={(e) => patch({ transportDestination: e.target.value })}
                  maxLength={120}
                />
              </label>
            </div>
          ) : null}
        </EmpleosSectionCard>

        {/* ── 4. Presupuesto y urgencia ──────────────────────── */}
        <EmpleosSectionCard title={copy.sections.budgetUrgency}>
          <label className="block text-sm">
            <EmpleosFieldLabel lang={lang} optional>
              {copy.fields.budgetMode}
            </EmpleosFieldLabel>
            <select
              className={INPUT}
              value={state.budgetMode}
              onChange={(e) => patch({ budgetMode: e.target.value as typeof state.budgetMode })}
            >
              {BUSCO_BUDGET_MODE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {lang === "en" ? opt.labelEn : opt.labelEs}
                </option>
              ))}
            </select>
          </label>
          {state.budgetMode === "tiene" ? (
            <label className="block text-sm">
              <EmpleosFieldLabel lang={lang} optional>
                {copy.fields.budgetAmount}
              </EmpleosFieldLabel>
              <div className="relative mt-1">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#6B5E4E]">$</span>
                <input
                  className={`${INPUT} mt-0 pl-6`}
                  inputMode="decimal"
                  value={state.budgetAmount}
                  onChange={(e) => patch({ budgetAmount: e.target.value.replace(/[^0-9.]/g, "") })}
                  maxLength={9}
                  placeholder="50"
                />
              </div>
            </label>
          ) : null}
          <label className="block text-sm">
            <EmpleosFieldLabel lang={lang} optional>
              {copy.fields.urgency}
            </EmpleosFieldLabel>
            <select
              className={INPUT}
              value={state.urgency}
              onChange={(e) => patch({ urgency: e.target.value as typeof state.urgency })}
            >
              {BUSCO_URGENCY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {lang === "en" ? opt.labelEn : opt.labelEs}
                </option>
              ))}
            </select>
          </label>
        </EmpleosSectionCard>

        {/* ── 5. Detalles de tu búsqueda — light, type-conditional (Section C) ─ */}
        {showDetailsSection ? (
          <EmpleosSectionCard title={copy.sections.details}>
            {isArticulo ? (
              <label className="block text-sm">
                <EmpleosFieldLabel lang={lang} optional>
                  {copy.fields.preferredCondition}
                </EmpleosFieldLabel>
                <input
                  className={INPUT}
                  value={state.preferredCondition}
                  onChange={(e) => patch({ preferredCondition: e.target.value })}
                  maxLength={120}
                  placeholder={lang === "es" ? "Ej. Nuevo, usado, cualquiera" : "e.g. New, used, any"}
                />
              </label>
            ) : null}
            {isTrabajo ? (
              <>
                <label className="block text-sm">
                  <EmpleosFieldLabel lang={lang} optional>
                    {copy.fields.workType}
                  </EmpleosFieldLabel>
                  <input
                    className={INPUT}
                    value={state.workType}
                    onChange={(e) => patch({ workType: e.target.value })}
                    maxLength={160}
                    placeholder={lang === "es" ? "Ej. Jardinería, limpieza, mudanzas" : "e.g. Landscaping, cleaning, moving"}
                  />
                </label>
                <label className="block text-sm">
                  <EmpleosFieldLabel lang={lang} optional>
                    {copy.fields.workSkills}
                  </EmpleosFieldLabel>
                  <textarea
                    className={INPUT}
                    value={state.workSkills}
                    onChange={(e) => patch({ workSkills: e.target.value })}
                    maxLength={500}
                    rows={3}
                  />
                </label>
                <label className="block text-sm">
                  <EmpleosFieldLabel lang={lang} optional>
                    {copy.fields.workAvailability}
                  </EmpleosFieldLabel>
                  <input
                    className={INPUT}
                    value={state.workAvailability}
                    onChange={(e) => patch({ workAvailability: e.target.value })}
                    maxLength={160}
                    placeholder={lang === "es" ? "Ej. Fines de semana, tiempo completo" : "e.g. Weekends, full time"}
                  />
                </label>
              </>
            ) : null}
            {isVoluntarios ? (
              <label className="block text-sm">
                <EmpleosFieldLabel lang={lang} optional>
                  {copy.fields.volunteersCount}
                </EmpleosFieldLabel>
                <input
                  className={INPUT}
                  inputMode="numeric"
                  value={state.volunteersCount}
                  onChange={(e) => patch({ volunteersCount: e.target.value.replace(/[^0-9]/g, "") })}
                  maxLength={4}
                  placeholder="5"
                />
              </label>
            ) : null}
            {showWhenNeeded ? (
              <label className="block text-sm">
                <EmpleosFieldLabel lang={lang} optional>
                  {copy.fields.whenNeeded}
                </EmpleosFieldLabel>
                <input
                  className={INPUT}
                  value={state.whenNeeded}
                  onChange={(e) => patch({ whenNeeded: e.target.value })}
                  maxLength={160}
                />
              </label>
            ) : null}
          </EmpleosSectionCard>
        ) : null}

        {/* ── 6. Contacto ───────────────────────────────────── */}
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
                onChange={(e) => patch({ whatsapp: formatWhatsAppInputDisplay(e.target.value) })}
                maxLength={16}
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
        </EmpleosSectionCard>

        {/* ── 7. Redes o enlace opcional ─────────────────────── */}
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
            <label className="block text-sm">
              <EmpleosFieldLabel lang={lang} optional>
                {copy.fields.youtube}
              </EmpleosFieldLabel>
              <input
                className={INPUT}
                type="text"
                inputMode="url"
                value={state.youtube}
                onChange={(e) => patch({ youtube: e.target.value })}
                placeholder="youtube.com/@tucanal"
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

        {/* ── 8. Confirmación antes de publicar (Section P) ──── */}
        <CommunityPublishConfirmationSection
          variant="busco"
          lang={lang}
          value={state.publishConfirmations}
          onChange={(p) => patch({ publishConfirmations: { ...state.publishConfirmations, ...p } })}
        />

        {/* ── Raw form's ONLY final action (Section R) ────────── */}
        <button
          type="submit"
          disabled={previewDisabled}
          className="flex min-h-[52px] w-full items-center justify-center rounded-xl bg-[#7B2D42] px-5 py-3 text-sm font-bold text-[#FCF9F2] shadow-sm transition hover:bg-[#9B3A52] disabled:cursor-not-allowed disabled:opacity-45"
          data-testid="busco-form-preview-cta"
        >
          {copy.previewCta}
        </button>
      </form>
    </BuscoShellLayout>
  );
}
