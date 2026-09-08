"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import CityAutocomplete from "@/app/components/CityAutocomplete";
import { MascotasPerdidosShellLayout } from "@/app/(site)/clasificados/mascotas-y-perdidos/shared/MascotasPerdidosShellLayout";
import {
  mascotasPerdidosLangFromSearchParams,
  mascotasPerdidosRouteLangFromSearchParams,
} from "@/app/(site)/clasificados/mascotas-y-perdidos/shared/mascotasPerdidosShellCopy";
import { EmpleosReadinessBanner } from "@/app/publicar/empleos/shared/components/EmpleosReadinessBanner";
import { EmpleosApplicationFinalStep } from "@/app/publicar/empleos/shared/components/EmpleosApplicationFinalStep";
import { EmpleosImageGalleryEditor } from "@/app/publicar/empleos/shared/media/EmpleosImageGalleryEditor";
import {
  EmpleosFieldLabel,
  EmpleosSectionCard,
} from "@/app/publicar/empleos/shared/ui/empleosFormPrimitives";
import {
  flushCommunityDraftToSession,
  useCommunityDraftSession,
} from "@/app/publicar/community/shared/hooks/useCommunityDraftSession";
import { CommunityPublishConfirmationSection } from "@/app/publicar/community/shared/components/CommunityPublishConfirmationSection";
import { COMMUNITY_PUBLISH_COPY } from "@/app/publicar/community/shared/copy/communityPublishCopy";

import { markPublishFlowOpeningPreview } from "@/app/clasificados/lib/publishFlowLifecycleClient";

import { mascotasPerdidosFormCopy } from "../shared/mascotasPerdidosFormCopy";
import { mascotasPerdidosHandoffPreviewUrl } from "../shared/mascotasPerdidosPublishRoutes";
import {
  emptyMascotasPerdidosQuickDraft,
  MAX_MASCOTAS_PHOTOS,
  normalizeMascotasPerdidosQuickDraft,
} from "../shared/mascotasPerdidosQuickDraft";
import { gateMascotasPerdidosQuickPreview } from "../shared/mascotasPerdidosRequiredForPreview";
import { MASCOTAS_PERDIDOS_QUICK_DRAFT_KEY } from "../shared/mascotasPerdidosSessionKeys";
import {
  MASCOTAS_PERDIDOS_NOTICE_OPTIONS,
  MASCOTAS_SEX_OPTIONS,
  MASCOTAS_SIZE_OPTIONS,
} from "../shared/mascotasPerdidosTaxonomy";
import { isPetNoticeType } from "../shared/mascotasPerdidosQuickTypes";
import {
  findMascotasLocationOption,
  isMascotasUsCountry,
  MASCOTAS_COUNTRY_OPTIONS,
  MASCOTAS_LOCATION_OTHER_VALUE,
  MASCOTAS_US_STATE_OPTIONS,
} from "../shared/mascotasPerdidosLocationOptions";

const INPUT =
  "mt-1 min-h-[44px] w-full rounded-lg border border-[#C9B46A]/40 bg-white px-3 py-2.5 text-sm text-[#111111] outline-none focus:border-[#A98C2A]/70 focus:ring-2 focus:ring-[#C9B46A]/30";
const TEXTAREA =
  "mt-1 min-h-[160px] w-full rounded-lg border border-[#C9B46A]/40 bg-white px-3 py-2.5 text-sm text-[#111111] outline-none focus:border-[#A98C2A]/70 focus:ring-2 focus:ring-[#C9B46A]/30";

export default function MascotasPerdidosQuickFormClient() {
  const router = useRouter();
  const sp = useSearchParams();
  const lang = mascotasPerdidosLangFromSearchParams(sp);
  const routeLang = mascotasPerdidosRouteLangFromSearchParams(sp);
  const copy = mascotasPerdidosFormCopy(lang);
  const sharedCopy = COMMUNITY_PUBLISH_COPY[lang];
  const { state, patch, reset, hydrated } = useCommunityDraftSession(
    MASCOTAS_PERDIDOS_QUICK_DRAFT_KEY,
    emptyMascotasPerdidosQuickDraft(),
    (raw) => normalizeMascotasPerdidosQuickDraft(raw),
  );

  const gate = useMemo(() => gateMascotasPerdidosQuickPreview(state, lang), [state, lang]);
  const previewDisabled = !gate.ok;
  const previewIssues = gate.ok ? [] : gate.issues;

  // Owner-QA ⚠️68 — structured country/state. A value that doesn't match a known option (legacy
  // free text, or a country/state Leonix hasn't listed yet) falls back to the "Otro" select value
  // + a preserved, editable free-text box — nothing is ever silently dropped. Explicit local flags
  // (not just "value is non-empty") are what keep the free-text box open right after picking
  // "Otro", before the user has typed anything into it.
  const [countryOtherMode, setCountryOtherMode] = useState(false);
  const [stateOtherMode, setStateOtherMode] = useState(false);

  const matchedCountry = useMemo(
    () => (state.country.trim() ? findMascotasLocationOption(MASCOTAS_COUNTRY_OPTIONS, state.country) : null),
    [state.country],
  );
  const countryIsOther = !matchedCountry && (countryOtherMode || Boolean(state.country.trim()));
  const countrySelectValue = matchedCountry ? matchedCountry.value : countryIsOther ? MASCOTAS_LOCATION_OTHER_VALUE : "";
  const isUsCountry = isMascotasUsCountry(state.country) || matchedCountry?.value === "United States";

  const matchedState = useMemo(
    () => (isUsCountry && state.state.trim() ? findMascotasLocationOption(MASCOTAS_US_STATE_OPTIONS, state.state) : null),
    [isUsCountry, state.state],
  );
  const stateIsOther = !matchedState && (stateOtherMode || Boolean(state.state.trim()));
  const stateSelectValue = matchedState ? matchedState.value : stateIsOther ? MASCOTAS_LOCATION_OTHER_VALUE : "";

  const continueToPreview = useCallback(() => {
    if (previewDisabled) return;
    flushCommunityDraftToSession(MASCOTAS_PERDIDOS_QUICK_DRAFT_KEY, state, (raw) =>
      normalizeMascotasPerdidosQuickDraft(raw),
    );
    markPublishFlowOpeningPreview();
    router.push(mascotasPerdidosHandoffPreviewUrl(routeLang));
  }, [previewDisabled, state, router, routeLang]);

  if (!hydrated) {
    return (
      <MascotasPerdidosShellLayout lang={lang}>
        <div className="min-h-[40vh] animate-pulse rounded-xl bg-[#EDE8DF]/60" aria-busy="true" />
      </MascotasPerdidosShellLayout>
    );
  }

  const isPet = isPetNoticeType(state.noticeType);
  const isLost = state.noticeType === "mascota-perdida";
  const isFound = state.noticeType === "mascota-encontrada";
  const isAdoption = state.noticeType === "adopcion-mascota";
  const isObject = state.noticeType === "objeto-perdido" || state.noticeType === "objeto-encontrado";
  const rewardEligible = isLost || state.noticeType === "objeto-perdido";

  const triOptions = (
    field: "microchip" | "vaccinated" | "spayedNeutered",
  ) => (
    <select
      className={INPUT}
      value={state[field]}
      onChange={(e) => patch({ [field]: e.target.value } as never)}
    >
      <option value="">{lang === "es" ? "— Selecciona —" : "— Select —"}</option>
      <option value="si">{copy.triState.yes}</option>
      <option value="no">{copy.triState.no}</option>
      <option value="no_se">{copy.triState.unsure}</option>
    </select>
  );

  return (
    <MascotasPerdidosShellLayout lang={lang}>
      <p className="text-sm text-[#5C5346]/90">{copy.pageSubtitle}</p>

      <EmpleosReadinessBanner visible={!gate.ok} intro={copy.gateFail} issues={previewIssues} />

      <div className="mt-5 space-y-5">
        <EmpleosSectionCard title={copy.sections.main}>
          <label className="block text-sm">
            <EmpleosFieldLabel lang={lang} required>
              {copy.fields.noticeType}
            </EmpleosFieldLabel>
            <select
              className={INPUT}
              value={state.noticeType}
              onChange={(e) => patch({ noticeType: e.target.value as typeof state.noticeType })}
            >
              <option value="">{lang === "es" ? "— Selecciona —" : "— Select —"}</option>
              {MASCOTAS_PERDIDOS_NOTICE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {lang === "en" ? opt.labelEn : opt.labelEs}
                </option>
              ))}
            </select>
          </label>

          {isPet ? (
            <label className="block text-sm">
              <EmpleosFieldLabel lang={lang} optional>
                {copy.fields.petName}
              </EmpleosFieldLabel>
              <input className={INPUT} value={state.petName} onChange={(e) => patch({ petName: e.target.value })} maxLength={100} />
            </label>
          ) : null}

          <label className="block text-sm">
            <EmpleosFieldLabel lang={lang} required>
              {copy.fields.title}
            </EmpleosFieldLabel>
            <input className={INPUT} value={state.title} onChange={(e) => patch({ title: e.target.value })} maxLength={200} />
          </label>

          <label className="block text-sm">
            <EmpleosFieldLabel lang={lang} required>
              {copy.fields.description}
            </EmpleosFieldLabel>
            <textarea className={TEXTAREA} value={state.description} onChange={(e) => patch({ description: e.target.value })} maxLength={1500} />
          </label>
        </EmpleosSectionCard>

        <EmpleosSectionCard title={copy.sections.media}>
          <p className="text-xs text-[#5C5346]/85">{copy.imageHint}</p>
          <EmpleosImageGalleryEditor
            images={state.images}
            onChange={(images) => patch({ images: images.slice(0, MAX_MASCOTAS_PHOTOS) })}
            urlPlaceholder="https://…"
            addUrlLabel={lang === "es" ? "Añadir URL" : "Add URL"}
            uploadLabel={lang === "es" ? "Subir foto" : "Upload photo"}
            mainLabel={copy.imageMain}
            removeLabel={copy.imageRemove}
            upLabel={lang === "es" ? "Subir" : "Up"}
            downLabel={lang === "es" ? "Bajar" : "Down"}
            altPlaceholder={lang === "es" ? "Descripción de la foto" : "Photo description"}
            lang={lang}
          />
        </EmpleosSectionCard>

        {isPet ? (
          <EmpleosSectionCard title={copy.sections.petDetails}>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm">
                <EmpleosFieldLabel lang={lang} optional>
                  {copy.fields.species}
                </EmpleosFieldLabel>
                <input className={INPUT} value={state.species} onChange={(e) => patch({ species: e.target.value })} placeholder={lang === "es" ? "Ej. Perro, Gato" : "E.g. Dog, Cat"} />
              </label>
              <label className="block text-sm">
                <EmpleosFieldLabel lang={lang} optional>
                  {copy.fields.breed}
                </EmpleosFieldLabel>
                <input className={INPUT} value={state.breed} onChange={(e) => patch({ breed: e.target.value })} />
              </label>
              <label className="block text-sm">
                <EmpleosFieldLabel lang={lang} optional>
                  {copy.fields.color}
                </EmpleosFieldLabel>
                <input className={INPUT} value={state.color} onChange={(e) => patch({ color: e.target.value })} />
              </label>
              <label className="block text-sm">
                <EmpleosFieldLabel lang={lang} optional>
                  {copy.fields.sex}
                </EmpleosFieldLabel>
                <select className={INPUT} value={state.sex} onChange={(e) => patch({ sex: e.target.value as typeof state.sex })}>
                  <option value="">{lang === "es" ? "— Selecciona —" : "— Select —"}</option>
                  {MASCOTAS_SEX_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {lang === "en" ? o.labelEn : o.labelEs}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                <EmpleosFieldLabel lang={lang} optional>
                  {copy.fields.ageApprox}
                </EmpleosFieldLabel>
                <input className={INPUT} value={state.ageApprox} onChange={(e) => patch({ ageApprox: e.target.value })} placeholder={lang === "es" ? "Ej. 2 años" : "E.g. 2 years"} />
              </label>
              <label className="block text-sm">
                <EmpleosFieldLabel lang={lang} optional>
                  {copy.fields.size}
                </EmpleosFieldLabel>
                <select className={INPUT} value={state.size} onChange={(e) => patch({ size: e.target.value })}>
                  <option value="">{lang === "es" ? "— Selecciona —" : "— Select —"}</option>
                  {MASCOTAS_SIZE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {lang === "en" ? o.labelEn : o.labelEs}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="block text-sm">
              <EmpleosFieldLabel lang={lang} optional>
                {copy.fields.identifyingMarks}
              </EmpleosFieldLabel>
              <textarea className={`${INPUT} min-h-[100px]`} value={state.identifyingMarks} onChange={(e) => patch({ identifyingMarks: e.target.value })} />
            </label>

            <label className="flex min-h-[40px] cursor-pointer items-center gap-2 text-sm">
              <input type="checkbox" checked={state.hasCollar} onChange={(e) => patch({ hasCollar: e.target.checked })} className="h-4 w-4 rounded border-black/20" />
              {copy.fields.hasCollar}
            </label>
            {state.hasCollar ? (
              <label className="block text-sm">
                <EmpleosFieldLabel lang={lang} optional>
                  {copy.fields.collarNote}
                </EmpleosFieldLabel>
                <input className={INPUT} value={state.collarNote} onChange={(e) => patch({ collarNote: e.target.value })} />
              </label>
            ) : null}

            {(isLost || isFound) ? (
              <label className="block text-sm">
                <EmpleosFieldLabel lang={lang} optional>
                  {copy.fields.microchip}
                </EmpleosFieldLabel>
                {triOptions("microchip")}
              </label>
            ) : null}
          </EmpleosSectionCard>
        ) : null}

        {isObject ? (
          <EmpleosSectionCard title={copy.sections.objectDetails}>
            <label className="block text-sm">
              <EmpleosFieldLabel lang={lang} optional>
                {copy.fields.objectType}
              </EmpleosFieldLabel>
              <input className={INPUT} value={state.objectType} onChange={(e) => patch({ objectType: e.target.value })} />
            </label>
            <label className="block text-sm">
              <EmpleosFieldLabel lang={lang} optional>
                {copy.fields.color}
              </EmpleosFieldLabel>
              <input className={INPUT} value={state.color} onChange={(e) => patch({ color: e.target.value })} />
            </label>
            <label className="block text-sm">
              <EmpleosFieldLabel lang={lang} optional>
                {copy.fields.identifyingMarks}
              </EmpleosFieldLabel>
              <textarea className={`${INPUT} min-h-[100px]`} value={state.identifyingMarks} onChange={(e) => patch({ identifyingMarks: e.target.value })} />
            </label>
          </EmpleosSectionCard>
        ) : null}

        {isLost ? (
          <EmpleosSectionCard title={copy.sections.lostDetails}>
            <label className="block text-sm">
              <EmpleosFieldLabel lang={lang} optional>
                {copy.fields.lastSeenDate}
              </EmpleosFieldLabel>
              <input type="date" className={INPUT} value={state.lastSeenDate} onChange={(e) => patch({ lastSeenDate: e.target.value })} />
            </label>
            <label className="block text-sm">
              <EmpleosFieldLabel lang={lang} optional>
                {copy.fields.safetyNote}
              </EmpleosFieldLabel>
              <textarea className={`${INPUT} min-h-[100px]`} value={state.safetyNote} onChange={(e) => patch({ safetyNote: e.target.value })} />
            </label>
          </EmpleosSectionCard>
        ) : null}

        {isFound ? (
          <EmpleosSectionCard title={copy.sections.foundDetails}>
            <label className="block text-sm">
              <EmpleosFieldLabel lang={lang} optional>
                {copy.fields.foundDate}
              </EmpleosFieldLabel>
              <input type="date" className={INPUT} value={state.foundDate} onChange={(e) => patch({ foundDate: e.target.value })} />
            </label>
            <label className="block text-sm">
              <EmpleosFieldLabel lang={lang} optional>
                {copy.fields.currentStatus}
              </EmpleosFieldLabel>
              <textarea className={`${INPUT} min-h-[100px]`} value={state.currentStatus} onChange={(e) => patch({ currentStatus: e.target.value })} />
            </label>
            <label className="block text-sm">
              <EmpleosFieldLabel lang={lang} optional>
                {copy.fields.claimInstructions}
              </EmpleosFieldLabel>
              <textarea className={`${INPUT} min-h-[100px]`} value={state.claimInstructions} onChange={(e) => patch({ claimInstructions: e.target.value })} />
            </label>
          </EmpleosSectionCard>
        ) : null}

        {isAdoption ? (
          <EmpleosSectionCard title={copy.sections.adoptionDetails}>
            <label className="block text-sm">
              <EmpleosFieldLabel lang={lang} optional>
                {copy.fields.temperament}
              </EmpleosFieldLabel>
              <textarea className={`${INPUT} min-h-[100px]`} value={state.temperament} onChange={(e) => patch({ temperament: e.target.value })} />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm">
                <EmpleosFieldLabel lang={lang} optional>
                  {copy.fields.vaccinated}
                </EmpleosFieldLabel>
                {triOptions("vaccinated")}
              </label>
              <label className="block text-sm">
                <EmpleosFieldLabel lang={lang} optional>
                  {copy.fields.spayedNeutered}
                </EmpleosFieldLabel>
                {triOptions("spayedNeutered")}
              </label>
            </div>
            <label className="block text-sm">
              <EmpleosFieldLabel lang={lang} optional>
                {copy.fields.specialNeeds}
              </EmpleosFieldLabel>
              <textarea className={`${INPUT} min-h-[100px]`} value={state.specialNeeds} onChange={(e) => patch({ specialNeeds: e.target.value })} />
            </label>
            <label className="block text-sm">
              <EmpleosFieldLabel lang={lang} optional>
                {copy.fields.adoptionDetails}
              </EmpleosFieldLabel>
              <textarea className={`${INPUT} min-h-[100px]`} value={state.adoptionDetails} onChange={(e) => patch({ adoptionDetails: e.target.value })} />
            </label>
          </EmpleosSectionCard>
        ) : null}

        {rewardEligible ? (
          <EmpleosSectionCard title={copy.sections.reward}>
            <fieldset>
              <legend className="text-sm font-semibold text-[color:var(--lx-text)]">{copy.fields.offersReward}</legend>
              <div className="mt-2 flex flex-wrap gap-4 text-sm">
                {([false, true] as const).map((value) => (
                  <label key={String(value)} className="inline-flex items-center gap-2">
                    <input
                      type="radio"
                      name="mascotas-offers-reward"
                      checked={state.offersReward === value}
                      onChange={() => patch({ offersReward: value, ...(value ? null : { rewardAmount: "" }) })}
                    />
                    {value ? copy.triState.yes : copy.triState.no}
                  </label>
                ))}
              </div>
            </fieldset>
            {state.offersReward ? (
              <label className="block text-sm">
                <EmpleosFieldLabel lang={lang} required>
                  {copy.fields.rewardAmount}
                </EmpleosFieldLabel>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-sm font-bold text-[#2A2826]">$</span>
                  <input
                    className={INPUT}
                    style={{ marginTop: 0 }}
                    value={state.rewardAmount}
                    onChange={(e) => patch({ rewardAmount: e.target.value.replace(/[^\d.]/g, "") })}
                    inputMode="decimal"
                    placeholder={copy.rewardAmountPlaceholder}
                  />
                </div>
                <p className="mt-1 text-xs text-[#5C5346]/85">{copy.rewardAmountHelper}</p>
              </label>
            ) : null}
          </EmpleosSectionCard>
        ) : null}

        <EmpleosSectionCard title={copy.sections.location}>
          <label className="block text-sm">
            <EmpleosFieldLabel lang={lang} required>
              {copy.fields.city}
            </EmpleosFieldLabel>
            <CityAutocomplete value={state.city} onChange={(v) => patch({ city: v })} placeholder={lang === "es" ? "Ciudad" : "City"} lang={lang} variant="light" className={INPUT} />
          </label>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="block text-sm">
              <EmpleosFieldLabel lang={lang} optional>
                {copy.fields.state}
              </EmpleosFieldLabel>
              {isUsCountry ? (
                <>
                  <select
                    className={INPUT}
                    value={stateSelectValue}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v === MASCOTAS_LOCATION_OTHER_VALUE) {
                        setStateOtherMode(true);
                        return;
                      }
                      setStateOtherMode(false);
                      patch({ state: v });
                    }}
                  >
                    <option value="">{lang === "es" ? "— Selecciona —" : "— Select —"}</option>
                    {MASCOTAS_US_STATE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {lang === "en" ? opt.labelEn : opt.labelEs}
                      </option>
                    ))}
                    <option value={MASCOTAS_LOCATION_OTHER_VALUE}>{lang === "es" ? "Otro" : "Other"}</option>
                  </select>
                  {stateIsOther ? (
                    <input
                      className={`${INPUT} mt-2`}
                      value={state.state}
                      onChange={(e) => patch({ state: e.target.value })}
                      placeholder={lang === "es" ? "Escribe el estado" : "Type the state"}
                    />
                  ) : null}
                </>
              ) : (
                <input className={INPUT} value={state.state} onChange={(e) => patch({ state: e.target.value })} />
              )}
            </label>
            <label className="block text-sm">
              <EmpleosFieldLabel lang={lang} optional>
                {copy.fields.country}
              </EmpleosFieldLabel>
              <select
                className={INPUT}
                value={countrySelectValue}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === MASCOTAS_LOCATION_OTHER_VALUE) {
                    setCountryOtherMode(true);
                    return;
                  }
                  setCountryOtherMode(false);
                  patch({ country: v });
                }}
              >
                <option value="">{lang === "es" ? "— Selecciona —" : "— Select —"}</option>
                {MASCOTAS_COUNTRY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {lang === "en" ? opt.labelEn : opt.labelEs}
                  </option>
                ))}
                <option value={MASCOTAS_LOCATION_OTHER_VALUE}>{lang === "es" ? "Otro país" : "Other country"}</option>
              </select>
              {countryIsOther ? (
                <input
                  className={`${INPUT} mt-2`}
                  value={state.country}
                  onChange={(e) => patch({ country: e.target.value })}
                  placeholder={lang === "es" ? "Escribe el país" : "Type the country"}
                />
              ) : null}
            </label>
            <label className="block text-sm">
              <EmpleosFieldLabel lang={lang} optional>
                {copy.fields.zip}
              </EmpleosFieldLabel>
              <input className={INPUT} value={state.zip} onChange={(e) => patch({ zip: e.target.value })} />
            </label>
          </div>
          <label className="block text-sm">
            <EmpleosFieldLabel lang={lang} required>
              {copy.fields.lastSeenLocation}
            </EmpleosFieldLabel>
            <input className={INPUT} value={state.lastSeenLocation} onChange={(e) => patch({ lastSeenLocation: e.target.value })} maxLength={200} />
            <p className="mt-1 text-xs text-[#5C5346]/85">{copy.lastSeenLocationHelper}</p>
          </label>
          <label className="block text-sm">
            <EmpleosFieldLabel lang={lang} optional>
              {copy.fields.landmark}
            </EmpleosFieldLabel>
            <input className={INPUT} value={state.landmark} onChange={(e) => patch({ landmark: e.target.value })} maxLength={200} />
            <p className="mt-1 text-xs text-[#5C5346]/85">{copy.landmarkHelper}</p>
          </label>
        </EmpleosSectionCard>

        <EmpleosSectionCard title={copy.sections.contact}>
          <p className="text-xs text-[#5C5346]/85">{copy.contactHelper}</p>
          <label className="block text-sm">
            <EmpleosFieldLabel lang={lang} optional>
              {copy.fields.phone}
            </EmpleosFieldLabel>
            <input className={INPUT} type="tel" inputMode="tel" autoComplete="tel" value={state.phone} onChange={(e) => patch({ phone: e.target.value })} />
          </label>
          <label className="block text-sm">
            <EmpleosFieldLabel lang={lang} optional>
              {copy.fields.smsPhone}
            </EmpleosFieldLabel>
            <input className={INPUT} type="tel" inputMode="tel" value={state.smsPhone} onChange={(e) => patch({ smsPhone: e.target.value })} />
          </label>
          <label className="block text-sm">
            <EmpleosFieldLabel lang={lang} optional>
              {copy.fields.whatsapp}
            </EmpleosFieldLabel>
            <input className={INPUT} type="tel" inputMode="tel" value={state.whatsapp} onChange={(e) => patch({ whatsapp: e.target.value })} />
          </label>
          <label className="block text-sm">
            <EmpleosFieldLabel lang={lang} optional>
              {copy.fields.email}
            </EmpleosFieldLabel>
            <input className={INPUT} type="email" inputMode="email" autoComplete="email" value={state.email} onChange={(e) => patch({ email: e.target.value })} />
          </label>
        </EmpleosSectionCard>

        <EmpleosSectionCard title={copy.sections.social}>
          <label className="block text-sm">
            <EmpleosFieldLabel lang={lang} optional>
              {copy.fields.facebook}
            </EmpleosFieldLabel>
            <input className={INPUT} type="url" value={state.facebook} onChange={(e) => patch({ facebook: e.target.value })} placeholder="https://facebook.com/…" />
          </label>
          <label className="block text-sm">
            <EmpleosFieldLabel lang={lang} optional>
              {copy.fields.instagram}
            </EmpleosFieldLabel>
            <input className={INPUT} type="url" value={state.instagram} onChange={(e) => patch({ instagram: e.target.value })} placeholder="https://instagram.com/…" />
          </label>
        </EmpleosSectionCard>
      </div>

      <CommunityPublishConfirmationSection
        variant="mascotas"
        lang={lang}
        value={state.publishConfirmations}
        onChange={(p) => patch({ publishConfirmations: { ...state.publishConfirmations, ...p } })}
      />

      <EmpleosApplicationFinalStep
        copy={{ ...sharedCopy.finalStep, previewCta: copy.previewCta }}
        previewDisabled={previewDisabled}
        onVistaPrevia={continueToPreview}
        onPublicar={() => {}}
        onDelete={() => reset()}
        stagedSuccessText={null}
        publishErrorText={null}
        publishGateBlockedHint={previewDisabled ? copy.gateFail : null}
        finalBlockingIssues={previewIssues}
        finalBlockingIntro={previewDisabled && previewIssues.length ? sharedCopy.stillNeededTitle : null}
        showSecondaryActions={false}
      />
    </MascotasPerdidosShellLayout>
  );
}
