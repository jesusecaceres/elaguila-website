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

import { buscoFormCopy } from "../shared/buscoFormCopy";
import { buscoHandoffPreviewUrl } from "../shared/buscoPublishRoutes";
import { emptyBuscoQuickDraft, normalizeBuscoQuickDraft } from "../shared/buscoQuickDraft";
import { gateBuscoQuickPreview } from "../shared/buscoRequiredForPreview";
import { BUSCO_QUICK_DRAFT_KEY } from "../shared/buscoSessionKeys";
import { BUSCO_TYPE_OPTIONS } from "../shared/buscoTaxonomy";

const INPUT =
  "mt-1 min-h-[44px] w-full rounded-lg border border-[#B8C8EA]/40 bg-white px-3 py-2.5 text-sm text-[#111111] outline-none focus:border-[#6E8EB8]/70 focus:ring-2 focus:ring-[#B8C8EA]/30";
const TEXTAREA =
  "mt-1 min-h-[96px] w-full rounded-lg border border-[#B8C8EA]/40 bg-white px-3 py-2.5 text-sm text-[#111111] outline-none focus:border-[#6E8EB8]/70 focus:ring-2 focus:ring-[#B8C8EA]/30";

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
        setImageError(
          lang === "es" ? "Usa JPG, PNG o WebP." : "Use JPG, PNG, or WebP.",
        );
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
        <div className="min-h-[40vh] animate-pulse rounded-xl bg-[#EDE8DF]/60" aria-busy="true" />
      </BuscoShellLayout>
    );
  }

  return (
    <BuscoShellLayout lang={lang}>
      <p className="text-sm text-[#5C5346]/90">{copy.pageSubtitle}</p>

      <EmpleosReadinessBanner visible={!gate.ok} intro={copy.gateFail} issues={previewIssues} />

      <form
        className="mt-5 space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          goPreview();
        }}
      >
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

        <EmpleosSectionCard title={copy.sections.location}>
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
          <label className="block text-sm">
            <EmpleosFieldLabel lang={lang} optional>
              {copy.fields.zone}
            </EmpleosFieldLabel>
            <input
              className={INPUT}
              value={state.zone}
              onChange={(e) => patch({ zone: e.target.value })}
              maxLength={120}
            />
          </label>
          <label className="block text-sm">
            <EmpleosFieldLabel lang={lang} optional>
              {copy.fields.budget}
            </EmpleosFieldLabel>
            <input
              className={INPUT}
              value={state.budget}
              onChange={(e) => patch({ budget: e.target.value })}
              maxLength={80}
              placeholder={lang === "es" ? "Ej. $50–100" : "E.g. $50–100"}
            />
          </label>
        </EmpleosSectionCard>

        <EmpleosSectionCard title={copy.sections.contact}>
          <p className="text-xs text-[#5C5346]/85">{copy.contactHint}</p>
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
              onChange={(e) => patch({ phone: e.target.value })}
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
        </EmpleosSectionCard>

        <EmpleosSectionCard title={copy.sections.media}>
          <p className="text-xs text-[#5C5346]/85">{copy.imageHint}</p>
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
                className="max-h-48 w-full rounded-xl border border-[#B8C8EA]/35 object-cover"
              />
              <button
                type="button"
                onClick={() => {
                  patch({ imageDataUrl: "", imageFileName: "" });
                  setImageError(null);
                }}
                className="mt-2 min-h-[40px] rounded-lg border border-[#B8C8EA]/45 px-3 py-2 text-sm font-semibold text-[#3d5a73]"
              >
                {copy.imageRemove}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex min-h-[48px] w-full items-center justify-center rounded-xl border border-dashed border-[#B8C8EA]/55 bg-[#F8FAFF] px-4 py-3 text-sm font-semibold text-[#3d5a73]"
            >
              {copy.fields.image}
            </button>
          )}
          {imageError ? <p className="text-sm text-red-700">{imageError}</p> : null}
        </EmpleosSectionCard>

        <button
          type="submit"
          disabled={previewDisabled}
          className="flex min-h-[52px] w-full items-center justify-center rounded-xl bg-[#111111] px-5 py-3 text-sm font-bold text-[#F5F5F5] transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-45"
        >
          {copy.previewCta}
        </button>
      </form>
    </BuscoShellLayout>
  );
}

