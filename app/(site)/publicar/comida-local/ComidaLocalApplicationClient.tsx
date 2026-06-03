"use client";

import { useCallback, useMemo, useState, type ReactNode } from "react";
import {
  COMIDA_LOCAL_FOOD_TYPE_OPTIONS,
  COMIDA_LOCAL_GALLERY_MAX_PLACEHOLDER,
  COMIDA_LOCAL_LANGUAGE_OPTIONS,
  COMIDA_LOCAL_PAYMENT_OPTIONS,
  COMIDA_LOCAL_PRICE_LEVEL_OPTIONS,
  COMIDA_LOCAL_PRODUCT_NAME,
  COMIDA_LOCAL_SECTIONS,
  COMIDA_LOCAL_SERVICE_OPTIONS,
} from "@/app/lib/clasificados/comida-local/comidaLocalConstants";
import { createEmptyComidaLocalDraft } from "@/app/lib/clasificados/comida-local/createEmptyComidaLocalDraft";
import {
  COMIDA_LOCAL_FIELD_COPY,
  COMIDA_LOCAL_SHELL_COPY,
} from "@/app/lib/clasificados/comida-local/comidaLocalFieldCopy";
import { formatComidaLocalPhoneInput } from "@/app/lib/clasificados/comida-local/comidaLocalFormatting";
import type {
  ComidaLocalDraft,
  ComidaLocalLanguageOption,
  ComidaLocalPaymentMethod,
  ComidaLocalPriceLevel,
  ComidaLocalSectionKey,
  ComidaLocalServiceOption,
} from "@/app/lib/clasificados/comida-local/comidaLocalTypes";
import { validateComidaLocalDraftForPreview } from "@/app/lib/clasificados/comida-local/comidaLocalValidation";

const PAGE_BG = "bg-[#FFFCF7]";
const CARD =
  "rounded-2xl border border-[#D4C4A8]/80 bg-[#FFFCF7] shadow-sm";
const INPUT =
  "w-full rounded-xl border border-[#D4C4A8]/90 bg-white px-3 py-2.5 text-sm text-[#1E1814] placeholder:text-[#1E1814]/40 focus:outline-none focus:ring-2 focus:ring-[#7A1E2C]/25";
const LABEL = "block text-xs font-semibold uppercase tracking-wide text-[#1E1814]/70";
const HELPER = "mt-1 text-xs leading-relaxed text-[#1E1814]/60";
const SECTION_TITLE = "text-lg font-semibold text-[#1E1814]";
const CHIP_ON =
  "rounded-lg border border-[#7A1E2C] bg-[#7A1E2C]/10 px-3 py-1.5 text-sm font-medium text-[#7A1E2C]";
const CHIP_OFF =
  "rounded-lg border border-[#D4C4A8] bg-white px-3 py-1.5 text-sm text-[#1E1814]/80 hover:border-[#7A1E2C]/40";

function cx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function FieldBlock({
  fieldKey,
  children,
}: {
  fieldKey: keyof typeof COMIDA_LOCAL_FIELD_COPY;
  children: ReactNode;
}) {
  const copy = COMIDA_LOCAL_FIELD_COPY[fieldKey];
  return (
    <div className="space-y-1.5">
      <label className={LABEL}>
        {copy.label}
        {copy.optional ? (
          <span className="ml-1 font-normal normal-case text-[#1E1814]/45">(opcional)</span>
        ) : null}
      </label>
      {children}
      <p className={HELPER}>{copy.helper}</p>
    </div>
  );
}

function toggleInList<T extends string>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export default function ComidaLocalApplicationClient() {
  const [draft, setDraft] = useState<ComidaLocalDraft>(() => createEmptyComidaLocalDraft());
  const [activeSection, setActiveSection] = useState<ComidaLocalSectionKey>("identidad");

  const previewIssues = useMemo(() => validateComidaLocalDraftForPreview(draft), [draft]);

  const patch = useCallback((partial: Partial<ComidaLocalDraft>) => {
    setDraft((prev) => ({ ...prev, ...partial }));
  }, []);

  const showFoodTypeCustom = draft.foodType === "otro";
  const showPaymentOther = draft.paymentMethods.includes("other");

  return (
    <div className={cx("min-h-screen", PAGE_BG)}>
      <div className="mx-auto max-w-6xl px-4 py-8 pb-16 sm:px-6 lg:px-8">
        <header className="mb-8 border-b border-[#D4C4A8]/60 pb-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#7A1E2C]">
            Leonix Clasificados
          </p>
          <h1 className="mt-2 text-2xl font-bold text-[#1E1814] sm:text-3xl">
            {COMIDA_LOCAL_SHELL_COPY.pageTitle}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-[#1E1814]/75">
            {COMIDA_LOCAL_SHELL_COPY.pageSubtitle}
          </p>
          <p className="mt-3 rounded-xl border border-[#D4C4A8]/70 bg-[#FDF8F0] px-3 py-2 text-xs text-[#1E1814]/70">
            {COMIDA_LOCAL_SHELL_COPY.scaffoldNotice}
          </p>
        </header>

        <div className="flex flex-col gap-8 lg:flex-row">
          <nav
            className="lg:w-52 lg:shrink-0"
            aria-label="Secciones del formulario"
          >
            <ul className="flex flex-wrap gap-2 lg:flex-col lg:gap-1">
              {COMIDA_LOCAL_SECTIONS.map((s) => (
                <li key={s.key}>
                  <button
                    type="button"
                    onClick={() => setActiveSection(s.key)}
                    className={cx(
                      "w-full rounded-lg px-3 py-2 text-left text-sm transition-colors",
                      activeSection === s.key
                        ? "bg-[#7A1E2C] font-medium text-[#FFFCF7]"
                        : "text-[#1E1814]/80 hover:bg-[#D4C4A8]/30"
                    )}
                  >
                    {s.title}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          <div className="min-w-0 flex-1 space-y-6">
            {activeSection === "identidad" && (
              <section className={cx(CARD, "p-5 sm:p-6")} id="identidad">
                <h2 className={SECTION_TITLE}>Identidad</h2>
                <div className="mt-5 space-y-5">
                  <FieldBlock fieldKey="businessName">
                    <input
                      className={INPUT}
                      value={draft.businessName}
                      onChange={(e) => patch({ businessName: e.target.value })}
                      placeholder={COMIDA_LOCAL_FIELD_COPY.businessName.placeholder}
                      autoComplete="organization"
                    />
                  </FieldBlock>
                  <FieldBlock fieldKey="foodType">
                    <select
                      className={INPUT}
                      value={draft.foodType}
                      onChange={(e) =>
                        patch({
                          foodType: e.target.value as ComidaLocalDraft["foodType"],
                          foodTypeCustom:
                            e.target.value === "otro" ? draft.foodTypeCustom : "",
                        })
                      }
                    >
                      <option value="">{COMIDA_LOCAL_FIELD_COPY.foodType.placeholder}</option>
                      {COMIDA_LOCAL_FOOD_TYPE_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </FieldBlock>
                  {showFoodTypeCustom ? (
                    <FieldBlock fieldKey="foodTypeCustom">
                      <input
                        className={INPUT}
                        value={draft.foodTypeCustom}
                        onChange={(e) => patch({ foodTypeCustom: e.target.value })}
                        placeholder={COMIDA_LOCAL_FIELD_COPY.foodTypeCustom.placeholder}
                      />
                    </FieldBlock>
                  ) : null}
                </div>
              </section>
            )}

            {activeSection === "zona" && (
              <section className={cx(CARD, "p-5 sm:p-6")} id="zona">
                <h2 className={SECTION_TITLE}>Zona</h2>
                <p className="mt-2 text-xs text-[#7A1E2C]/90">{COMIDA_LOCAL_SHELL_COPY.cityDeferredNote}</p>
                <div className="mt-5 space-y-5">
                  <FieldBlock fieldKey="cityDisplay">
                    <input
                      className={INPUT}
                      value={draft.cityDisplay}
                      onChange={(e) => patch({ cityDisplay: e.target.value })}
                      placeholder={COMIDA_LOCAL_FIELD_COPY.cityDisplay.placeholder}
                      autoComplete="address-level2"
                    />
                  </FieldBlock>
                  <FieldBlock fieldKey="zoneNote">
                    <input
                      className={INPUT}
                      value={draft.zoneNote}
                      onChange={(e) => patch({ zoneNote: e.target.value })}
                      placeholder={COMIDA_LOCAL_FIELD_COPY.zoneNote.placeholder}
                    />
                  </FieldBlock>
                </div>
              </section>
            )}

            {activeSection === "que-vendes" && (
              <section className={cx(CARD, "p-5 sm:p-6")} id="que-vendes">
                <h2 className={SECTION_TITLE}>Qué vendes</h2>
                <div className="mt-5">
                  <FieldBlock fieldKey="queVendes">
                    <textarea
                      className={cx(INPUT, "min-h-[120px] resize-y")}
                      value={draft.queVendes}
                      onChange={(e) => patch({ queVendes: e.target.value })}
                      placeholder={COMIDA_LOCAL_FIELD_COPY.queVendes.placeholder}
                      rows={5}
                    />
                  </FieldBlock>
                </div>
              </section>
            )}

            {activeSection === "contacto" && (
              <section className={cx(CARD, "p-5 sm:p-6")} id="contacto">
                <h2 className={SECTION_TITLE}>Contacto</h2>
                <div className="mt-5 space-y-5">
                  <FieldBlock fieldKey="phone">
                    <input
                      className={INPUT}
                      type="tel"
                      inputMode="tel"
                      value={draft.phone}
                      onChange={(e) => patch({ phone: formatComidaLocalPhoneInput(e.target.value) })}
                      placeholder={COMIDA_LOCAL_FIELD_COPY.phone.placeholder}
                      autoComplete="tel"
                    />
                  </FieldBlock>
                  <FieldBlock fieldKey="whatsapp">
                    <input
                      className={INPUT}
                      type="tel"
                      inputMode="tel"
                      value={draft.whatsapp}
                      onChange={(e) =>
                        patch({ whatsapp: formatComidaLocalPhoneInput(e.target.value) })
                      }
                      placeholder={COMIDA_LOCAL_FIELD_COPY.whatsapp.placeholder}
                    />
                  </FieldBlock>
                  <FieldBlock fieldKey="instagramUrl">
                    <input
                      className={INPUT}
                      value={draft.instagramUrl}
                      onChange={(e) => patch({ instagramUrl: e.target.value })}
                      placeholder={COMIDA_LOCAL_FIELD_COPY.instagramUrl.placeholder}
                    />
                  </FieldBlock>
                  <FieldBlock fieldKey="facebookUrl">
                    <input
                      className={INPUT}
                      value={draft.facebookUrl}
                      onChange={(e) => patch({ facebookUrl: e.target.value })}
                      placeholder={COMIDA_LOCAL_FIELD_COPY.facebookUrl.placeholder}
                    />
                  </FieldBlock>
                  <FieldBlock fieldKey="tiktokUrl">
                    <input
                      className={INPUT}
                      value={draft.tiktokUrl}
                      onChange={(e) => patch({ tiktokUrl: e.target.value })}
                      placeholder={COMIDA_LOCAL_FIELD_COPY.tiktokUrl.placeholder}
                    />
                  </FieldBlock>
                </div>
              </section>
            )}

            {activeSection === "ubicacion" && (
              <section className={cx(CARD, "p-5 sm:p-6")} id="ubicacion">
                <h2 className={SECTION_TITLE}>Ubicación y disponibilidad</h2>
                <div className="mt-5 space-y-5">
                  <FieldBlock fieldKey="locationNote">
                    <textarea
                      className={cx(INPUT, "min-h-[80px] resize-y")}
                      value={draft.locationNote}
                      onChange={(e) => patch({ locationNote: e.target.value })}
                      placeholder={COMIDA_LOCAL_FIELD_COPY.locationNote.placeholder}
                      rows={3}
                    />
                  </FieldBlock>
                  <FieldBlock fieldKey="locationUrl">
                    <input
                      className={INPUT}
                      value={draft.locationUrl}
                      onChange={(e) => patch({ locationUrl: e.target.value })}
                      placeholder={COMIDA_LOCAL_FIELD_COPY.locationUrl.placeholder}
                    />
                  </FieldBlock>
                  <FieldBlock fieldKey="availabilityNote">
                    <input
                      className={INPUT}
                      value={draft.availabilityNote}
                      onChange={(e) => patch({ availabilityNote: e.target.value })}
                      placeholder={COMIDA_LOCAL_FIELD_COPY.availabilityNote.placeholder}
                    />
                  </FieldBlock>
                  <FieldBlock fieldKey="serviceOptions">
                    <div className="flex flex-wrap gap-2">
                      {COMIDA_LOCAL_SERVICE_OPTIONS.map((o) => (
                        <button
                          key={o.value}
                          type="button"
                          className={
                            draft.serviceOptions.includes(o.value) ? CHIP_ON : CHIP_OFF
                          }
                          onClick={() =>
                            patch({
                              serviceOptions: toggleInList(
                                draft.serviceOptions,
                                o.value as ComidaLocalServiceOption
                              ),
                            })
                          }
                        >
                          {o.label}
                        </button>
                      ))}
                    </div>
                  </FieldBlock>
                </div>
              </section>
            )}

            {activeSection === "extras" && (
              <section className={cx(CARD, "p-5 sm:p-6")} id="extras">
                <h2 className={SECTION_TITLE}>Extras</h2>
                <div className="mt-5 space-y-5">
                  <FieldBlock fieldKey="paymentMethods">
                    <div className="flex flex-wrap gap-2">
                      {COMIDA_LOCAL_PAYMENT_OPTIONS.map((o) => (
                        <button
                          key={o.value}
                          type="button"
                          className={
                            draft.paymentMethods.includes(o.value) ? CHIP_ON : CHIP_OFF
                          }
                          onClick={() =>
                            patch({
                              paymentMethods: toggleInList(
                                draft.paymentMethods,
                                o.value as ComidaLocalPaymentMethod
                              ),
                            })
                          }
                        >
                          {o.label}
                        </button>
                      ))}
                    </div>
                  </FieldBlock>
                  {showPaymentOther ? (
                    <FieldBlock fieldKey="paymentOtherNote">
                      <input
                        className={INPUT}
                        value={draft.paymentOtherNote}
                        onChange={(e) => patch({ paymentOtherNote: e.target.value })}
                        placeholder={COMIDA_LOCAL_FIELD_COPY.paymentOtherNote.placeholder}
                      />
                    </FieldBlock>
                  ) : null}
                  <FieldBlock fieldKey="priceLevel">
                    <div className="flex flex-wrap gap-2">
                      {COMIDA_LOCAL_PRICE_LEVEL_OPTIONS.map((o) => (
                        <button
                          key={o.value}
                          type="button"
                          className={draft.priceLevel === o.value ? CHIP_ON : CHIP_OFF}
                          onClick={() =>
                            patch({
                              priceLevel:
                                draft.priceLevel === o.value
                                  ? ""
                                  : (o.value as ComidaLocalPriceLevel),
                            })
                          }
                        >
                          {o.label}
                        </button>
                      ))}
                    </div>
                  </FieldBlock>
                  <FieldBlock fieldKey="languages">
                    <div className="flex flex-wrap gap-2">
                      {COMIDA_LOCAL_LANGUAGE_OPTIONS.map((o) => (
                        <button
                          key={o.value}
                          type="button"
                          className={
                            draft.languages.includes(o.value) ? CHIP_ON : CHIP_OFF
                          }
                          onClick={() =>
                            patch({
                              languages: toggleInList(
                                draft.languages,
                                o.value as ComidaLocalLanguageOption
                              ),
                            })
                          }
                        >
                          {o.label}
                        </button>
                      ))}
                    </div>
                  </FieldBlock>
                </div>
              </section>
            )}

            {activeSection === "fotos" && (
              <section className={cx(CARD, "p-5 sm:p-6")} id="fotos">
                <h2 className={SECTION_TITLE}>Fotos</h2>
                <p className="mt-2 text-xs text-[#1E1814]/60">
                  {COMIDA_LOCAL_SHELL_COPY.photosDeferredNote}
                </p>
                <div className="mt-5 space-y-5">
                  <FieldBlock fieldKey="mainPhoto">
                    <div
                      className="flex min-h-[140px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#D4C4A8] bg-[#FDF8F0] px-4 py-6 text-center text-sm text-[#1E1814]/55"
                      role="group"
                      aria-label="Foto principal — próximamente"
                    >
                      <span className="font-medium text-[#7A1E2C]/80">Subida próximamente</span>
                      <span className="mt-1 text-xs">FOOD-L3 / FOOD-L4</span>
                    </div>
                  </FieldBlock>
                  <FieldBlock fieldKey="logoImage">
                    <div
                      className="flex min-h-[100px] items-center justify-center rounded-xl border border-dashed border-[#D4C4A8]/80 bg-white text-xs text-[#1E1814]/50"
                      aria-hidden
                    >
                      Logo — próximamente
                    </div>
                  </FieldBlock>
                  <FieldBlock fieldKey="galleryImages">
                    <div className="grid gap-3 sm:grid-cols-3">
                      {Array.from({ length: COMIDA_LOCAL_GALLERY_MAX_PLACEHOLDER }).map(
                        (_, i) => (
                          <div
                            key={i}
                            className="flex min-h-[88px] items-center justify-center rounded-xl border border-dashed border-[#D4C4A8]/70 bg-white text-xs text-[#1E1814]/45"
                          >
                            Foto {i + 1}
                          </div>
                        )
                      )}
                    </div>
                  </FieldBlock>
                </div>
              </section>
            )}

            <div className={cx(CARD, "flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between")}>
              <div>
                <p className="text-sm font-medium text-[#1E1814]">
                  {COMIDA_LOCAL_PRODUCT_NAME} — borrador local
                </p>
                {previewIssues.length > 0 ? (
                  <ul className="mt-2 space-y-1 text-xs text-[#7A1E2C]/90">
                    {previewIssues.map((issue) => (
                      <li key={`${issue.field}-${issue.message}`}>{issue.message}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-1 text-xs text-[#1E1814]/55">
                    Cuando conectemos la vista previa, podrás revisar la ficha aquí.
                  </p>
                )}
              </div>
              <button
                type="button"
                disabled
                className="cursor-not-allowed rounded-xl bg-[#7A1E2C]/50 px-5 py-2.5 text-sm font-semibold text-[#FFFCF7]"
                title={COMIDA_LOCAL_SHELL_COPY.previewSoon}
              >
                {COMIDA_LOCAL_SHELL_COPY.previewSoon}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
