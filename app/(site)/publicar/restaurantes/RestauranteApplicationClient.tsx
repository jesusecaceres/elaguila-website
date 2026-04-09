"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import CityAutocomplete from "@/app/components/CityAutocomplete";
import type { RestauranteListingDraft } from "@/app/clasificados/restaurantes/application/restauranteDraftTypes";
import type { RestauranteDaySchedule, RestauranteFeaturedDish, RestauranteServiceMode } from "@/app/clasificados/restaurantes/application/restauranteListingApplicationModel";
import {
  RESTAURANTE_BUSINESS_TYPES,
  RESTAURANTE_CONTACT_PLACEHOLDERS,
  RESTAURANTE_CUISINES,
  RESTAURANTE_EVENT_SIZES,
  RESTAURANTE_HIGHLIGHTS,
  RESTAURANTE_LANGUAGES,
  RESTAURANTE_LOCATION_PRIVACY,
  RESTAURANTE_PICKUP_DAYS,
  RESTAURANTE_PRICE_LEVELS,
  RESTAURANTE_SERVICE_MODES,
  TAXONOMY_KEY_OTHER,
  TAXONOMY_KEY_OTHER_LANG,
} from "@/app/clasificados/restaurantes/application/restauranteTaxonomy";
import { RestauranteUploadRow } from "@/app/clasificados/restaurantes/application/RestauranteUploadRow";
import { useRestauranteDraft } from "@/app/clasificados/restaurantes/application/useRestauranteDraft";
import { satisfiesRestauranteMinimumValidPreview, satisfiesRestauranteServiceModes } from "@/app/clasificados/restaurantes/application/restauranteListingApplicationModel";
import { readFileAsDataUrl } from "@/app/publicar/autos/negocios/lib/readFileAsDataUrl";
import { readRestauranteImageAsDataUrl } from "@/app/clasificados/restaurantes/application/compressRestauranteImage";
import { RestaurantePublishMediaStrip } from "@/app/clasificados/restaurantes/application/RestaurantePublishMediaStrip";
import { RestauranteSubGalleryBucket } from "@/app/clasificados/restaurantes/application/RestauranteSubGalleryBucket";
import { resolveRestauranteGallerySequence } from "@/app/clasificados/restaurantes/application/restauranteGalleryMediaSequence";
import { ClasificadosApplicationTopActions } from "@/app/clasificados/lib/publishUi/ClasificadosApplicationTopActions";
import { buildRestauranteApplicationSectionNavItems } from "./restauranteApplicationSectionModel";
import { RestauranteApplicationSectionNav } from "./RestauranteApplicationSectionNav";

const PREVIEW_HREF = "/clasificados/restaurantes/preview";

const CARD =
  "rounded-[20px] border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] p-5 shadow-[0_8px_32px_-8px_rgba(42,36,22,0.1)] sm:p-6";

/** Visible step panel — one lettered section at a time (draft stays in parent; fields remount from draft). */
const stepPanel = CARD;

/** Stacks I / J / K — visually dominant vs. canonical service modes + channel rows below */
const PRIMARY_OP_CARD =
  "flex h-full flex-col rounded-2xl border-2 border-[color:var(--lx-gold-border)]/70 bg-gradient-to-b from-[color:var(--lx-section)] to-[color:var(--lx-card)] p-5 shadow-[0_8px_28px_-10px_rgba(42,36,22,0.18)] ring-2 ring-[color:var(--lx-gold-border)]/25";

/** Secondary fulfillment toggles — lighter visual weight */
const SECONDARY_CHANNEL_CLUSTER =
  "rounded-2xl border border-dashed border-[color:var(--lx-nav-border)]/90 bg-[color:var(--lx-section)]/40 p-4";

const OTHER_INPUT =
  "mt-1.5 w-full max-w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-3 py-2 text-sm text-[color:var(--lx-text)]";

/** UI cap for additional cuisine tags (stored arrays may be longer from older sessions; user can only add up to this). */
const MAX_ADDITIONAL_CUISINES = 3;

const DAY_ROWS: { key: keyof Pick<RestauranteListingDraft, "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday">; label: string }[] = [
  { key: "monday", label: "Lunes" },
  { key: "tuesday", label: "Martes" },
  { key: "wednesday", label: "Miércoles" },
  { key: "thursday", label: "Jueves" },
  { key: "friday", label: "Viernes" },
  { key: "saturday", label: "Sábado" },
  { key: "sunday", label: "Domingo" },
];

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-lg font-bold text-[color:var(--lx-text)]">{children}</h2>;
}

function FieldLabel({
  children,
  optional,
  required,
}: {
  children: React.ReactNode;
  optional?: boolean;
  /** Structural requirement for premium preview / open-card (shows *). */
  required?: boolean;
}) {
  const showStar = Boolean(required) && !optional;
  return (
    <label className="block text-sm font-semibold text-[color:var(--lx-text-2)]">
      {children}
      {optional ? <span className="ml-1 font-normal text-[color:var(--lx-muted)]">(opcional)</span> : null}
      {showStar ? (
        <span className="ml-0.5 text-red-600" aria-hidden>
          *
        </span>
      ) : null}
    </label>
  );
}

function HelperText({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={`mt-1 text-xs leading-relaxed text-[color:var(--lx-muted)] sm:max-w-2xl${className ? ` ${className}` : ""}`}>
      {children}
    </p>
  );
}

export default function RestauranteApplicationClient() {
  const { hydrated, draft, draftRef, setDraftPatch, resetDraft } = useRestauranteDraft();
  const [serviceErr, setServiceErr] = useState(false);
  /** Display names for last picked files (draft stores data URLs only). */
  const [uploadLabels, setUploadLabels] = useState<Record<string, string>>({});

  const minPreviewOk = useMemo(() => satisfiesRestauranteMinimumValidPreview(draft), [draft]);
  const serviceOk = useMemo(() => satisfiesRestauranteServiceModes(draft.serviceModes), [draft.serviceModes]);
  const deliveryRelevant = useMemo(
    () =>
      Boolean(draft.delivery) ||
      (draft.serviceModes ?? []).includes("delivery" as RestauranteServiceMode),
    [draft.delivery, draft.serviceModes]
  );

  const setDay = useCallback(
    (key: keyof RestauranteListingDraft, sched: RestauranteDaySchedule) => {
      setDraftPatch({ [key]: sched } as Partial<RestauranteListingDraft>);
    },
    [setDraftPatch]
  );

  const sectionNavItems = useMemo(() => buildRestauranteApplicationSectionNavItems(draft), [draft]);

  const [activeSectionId, setActiveSectionId] = useState("restaurantes-section-a");

  useEffect(() => {
    setActiveSectionId((prev) => {
      const ids = sectionNavItems.map((s) => s.id);
      if (ids.includes(prev)) return prev;
      return ids[0] ?? prev;
    });
  }, [sectionNavItems]);

  const activeStepIndex = useMemo(() => {
    const i = sectionNavItems.findIndex((s) => s.id === activeSectionId);
    return i < 0 ? 0 : i;
  }, [sectionNavItems, activeSectionId]);

  const phonePresent = useMemo(() => Boolean(draft.phoneNumber?.trim()), [draft.phoneNumber]);

  useEffect(() => {
    if (!phonePresent && draft.allowMessageCTA) {
      setDraftPatch({ allowMessageCTA: false });
    }
  }, [phonePresent, draft.allowMessageCTA, setDraftPatch]);

  const goPreview = useCallback(() => {
    if (!satisfiesRestauranteServiceModes(draft.serviceModes)) {
      setServiceErr(true);
      setActiveSectionId("restaurantes-section-b");
      return;
    }
    setServiceErr(false);
    window.location.href = PREVIEW_HREF;
  }, [draft.serviceModes]);

  const toggleHighlight = useCallback(
    (key: string) => {
      const cur = draft.highlights ?? [];
      if (cur.includes(key)) {
        setDraftPatch({ highlights: cur.filter((k) => k !== key) });
        return;
      }
      if (cur.length >= 6) return;
      setDraftPatch({ highlights: [...cur, key] });
    },
    [draft.highlights, setDraftPatch]
  );

  const toggleLanguage = useCallback(
    (key: string) => {
      const cur = draft.languagesSpoken ?? [];
      const next = cur.includes(key) ? cur.filter((k) => k !== key) : [...cur, key];
      const patch: Partial<RestauranteListingDraft> = { languagesSpoken: next };
      if (key === TAXONOMY_KEY_OTHER_LANG && cur.includes(key) && !next.includes(key)) {
        patch.languageOtherCustom = undefined;
      }
      setDraftPatch(patch);
    },
    [draft.languagesSpoken, setDraftPatch]
  );

  const toggleAdditionalCuisine = useCallback(
    (key: string) => {
      const cur = draft.additionalCuisines ?? [];
      if (cur.includes(key)) {
        const next = cur.filter((k) => k !== key);
        const patch: Partial<RestauranteListingDraft> = { additionalCuisines: next };
        if (key === TAXONOMY_KEY_OTHER) patch.additionalCuisineOtherCustom = undefined;
        setDraftPatch(patch);
        return;
      }
      if (cur.length >= MAX_ADDITIONAL_CUISINES) return;
      setDraftPatch({ additionalCuisines: [...cur, key] });
    },
    [draft.additionalCuisines, setDraftPatch]
  );

  const toggleServiceMode = useCallback(
    (mode: RestauranteServiceMode) => {
      const cur = draft.serviceModes ?? [];
      const next = cur.includes(mode) ? cur.filter((m) => m !== mode) : [...cur, mode];
      const patch: Partial<RestauranteListingDraft> = { serviceModes: next };
      if (mode === TAXONOMY_KEY_OTHER && cur.includes(mode) && !next.includes(mode)) {
        patch.serviceModeOtherCustom = undefined;
      }
      setDraftPatch(patch);
      setServiceErr(false);
    },
    [draft.serviceModes, setDraftPatch]
  );

  const patchFeatured = useCallback(
    (index: number, patch: Partial<RestauranteFeaturedDish>) => {
      const list = [...(draft.featuredDishes ?? [])];
      while (list.length <= index) list.push({ title: "", shortNote: "", image: "" });
      list[index] = { ...list[index], ...patch };
      setDraftPatch({ featuredDishes: list.slice(0, 4) });
    },
    [draft.featuredDishes, setDraftPatch]
  );

  const removeFeatured = useCallback(
    (index: number) => {
      const list = [...(draft.featuredDishes ?? [])];
      list.splice(index, 1);
      setDraftPatch({ featuredDishes: list });
    },
    [draft.featuredDishes, setDraftPatch]
  );

  const addFeaturedSlot = useCallback(() => {
    const list = [...(draft.featuredDishes ?? [])];
    if (list.length >= 4) return;
    list.push({ title: "", shortNote: "", image: "" });
    setDraftPatch({ featuredDishes: list });
  }, [draft.featuredDishes, setDraftPatch]);

  if (!hydrated) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center text-[color:var(--lx-muted)]">
        Cargando borrador…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 pb-24 sm:py-10">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--lx-muted)]">Leonix Clasificados</p>
        <h1 className="mt-2 text-2xl font-bold text-[color:var(--lx-text)] sm:text-3xl">Publicar restaurante</h1>
        <p className="mt-3 text-sm leading-relaxed text-[color:var(--lx-text-2)]">
          Los campos completados aparecerán en la vista previa. Los campos vacíos no se mostrarán al comprador.
        </p>
        <p className="mt-2 text-xs text-[color:var(--lx-muted)]">
          Borrador en esta sesión del navegador: se mantiene al ir a vista previa, volver y actualizar la página en la
          misma pestaña; al cerrar la pestaña o el navegador se descarta. Clave{" "}
          <code className="rounded bg-[color:var(--lx-section)] px-1">restaurantes-draft</code> (almacenamiento de sesión).
        </p>
      </div>

      <ClasificadosApplicationTopActions
        onPreviewValidated={goPreview}
        openPreviewHref={PREVIEW_HREF}
        onDeleteApplication={resetDraft}
        disableValidatedPreview={!serviceOk}
      />

      <p className="mt-3 text-xs leading-relaxed text-[color:var(--lx-muted)]">
        <strong className="text-[color:var(--lx-text-2)]">Vista previa</strong> valida modos de servicio (sección B) y te
        lleva al resultado. <strong className="text-[color:var(--lx-text-2)]">Abrir vista previa</strong> abre la misma
        URL con el borrador de esta sesión <strong>sin</strong> exigir B — útil para revisar fotos o texto.
      </p>

      {serviceErr ? (
        <div
          className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900"
          role="alert"
          aria-live="polite"
        >
          <p className="font-semibold">No se puede usar &quot;Vista previa&quot; todavía</p>
          <p className="mt-1">
            Elige al menos un <strong>modo de servicio</strong> en la sección B (comer en local, para llevar, entrega,
            etc.). Es obligatorio para el botón principal; puedes usar &quot;Ver borrador (sin validar B)&quot; si solo
            quieres revisar el diseño.
          </p>
        </div>
      ) : null}
      {!minPreviewOk ? (
        <p className="mt-2 text-sm text-[color:var(--lx-muted)]">
          Para una vista previa publicable completa: nombre, tipo, cocina, resumen, ciudad, foto principal, al menos un
          contacto y señal de horario.
        </p>
      ) : null}

      <div className="lg:hidden sticky top-14 z-30 -mx-4 mb-4 border-b border-[color:var(--lx-nav-border)]/70 bg-[color:var(--lx-page)]/95 px-4 py-2.5 backdrop-blur-md">
        <RestauranteApplicationSectionNav
          variant="chips"
          sections={sectionNavItems}
          activeId={activeSectionId}
          onSelect={setActiveSectionId}
        />
      </div>

      <div className="mt-6 lg:mt-8 lg:grid lg:grid-cols-[minmax(0,220px)_minmax(0,1fr)] lg:items-start lg:gap-10">
        <aside className="mb-6 hidden lg:mb-0 lg:block">
          <div className="sticky top-24 rounded-2xl border border-[color:var(--lx-nav-border)]/80 bg-[color:var(--lx-card)]/90 p-3 shadow-sm backdrop-blur-sm">
            <RestauranteApplicationSectionNav
              sections={sectionNavItems}
              activeId={activeSectionId}
              onSelect={setActiveSectionId}
            />
          </div>
        </aside>

        <div className="min-w-0 flex flex-col gap-6">
        {/* A */}
        {activeSectionId === "restaurantes-section-a" ? (
        <section id="restaurantes-section-a" className={stepPanel}>
          <SectionTitle>A · Identidad del negocio</SectionTitle>
          <HelperText>
            Esta sección define cómo te reconocen en resultados y en la ficha: nombre, cocinas, resumen y ciudad canónica son
            la base del anuncio.
          </HelperText>
          <div className="mt-4 grid gap-4">
            <div>
              <FieldLabel required>Nombre del negocio</FieldLabel>
              <HelperText>Título principal del listado y de la tarjeta abierta.</HelperText>
              <input
                className="mt-1 w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-3 py-2 text-sm"
                value={draft.businessName}
                onChange={(e) => setDraftPatch({ businessName: e.target.value })}
              />
            </div>
            <div>
              <FieldLabel required>Tipo de negocio</FieldLabel>
              <HelperText>Clasificación del negocio; ayuda a filtros y contexto en la ficha.</HelperText>
              <select
                className="mt-1 w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-3 py-2 text-sm"
                value={draft.businessType}
                onChange={(e) => {
                  const v = e.target.value;
                  setDraftPatch({
                    businessType: v,
                    businessTypeCustom: v === TAXONOMY_KEY_OTHER ? draft.businessTypeCustom : undefined,
                  });
                }}
              >
                <option value="">Seleccionar…</option>
                {RESTAURANTE_BUSINESS_TYPES.map((o) => (
                  <option key={o.key} value={o.key}>
                    {o.labelEs}
                  </option>
                ))}
              </select>
            </div>
            {draft.businessType === TAXONOMY_KEY_OTHER ? (
              <div>
                <FieldLabel>Especifica el tipo (Otro)</FieldLabel>
                <input
                  className={OTHER_INPUT}
                  maxLength={80}
                  placeholder="Ej. cocina oculta especializada"
                  value={draft.businessTypeCustom ?? ""}
                  onChange={(e) => setDraftPatch({ businessTypeCustom: e.target.value || undefined })}
                />
              </div>
            ) : null}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <FieldLabel required>Cocina principal</FieldLabel>
                <HelperText>
                  Identidad culinaria principal: línea de tipo/cocina en resultados y filtros. Una sola elección.
                </HelperText>
                <select
                  className="mt-1 w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-3 py-2 text-sm"
                  value={draft.primaryCuisine}
                  onChange={(e) => {
                    const v = e.target.value;
                    setDraftPatch({
                      primaryCuisine: v,
                      primaryCuisineCustom: v === TAXONOMY_KEY_OTHER ? draft.primaryCuisineCustom : undefined,
                    });
                  }}
                >
                  <option value="">Seleccionar…</option>
                  {RESTAURANTE_CUISINES.map((o) => (
                    <option key={o.key} value={o.key}>
                      {o.labelEs}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <FieldLabel optional>Cocina secundaria</FieldLabel>
                <HelperText>
                  Segunda cocina si aplica (p. ej. fusión o doble oferta). Opcional; no sustituye la principal. Una sola
                  elección.
                </HelperText>
                <select
                  className="mt-1 w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-3 py-2 text-sm"
                  value={draft.secondaryCuisine ?? ""}
                  onChange={(e) => {
                    const v = e.target.value || undefined;
                    setDraftPatch({
                      secondaryCuisine: v,
                      secondaryCuisineCustom: v === TAXONOMY_KEY_OTHER ? draft.secondaryCuisineCustom : undefined,
                    });
                  }}
                >
                  <option value="">—</option>
                  {RESTAURANTE_CUISINES.map((o) => (
                    <option key={o.key} value={o.key}>
                      {o.labelEs}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {draft.primaryCuisine === TAXONOMY_KEY_OTHER ? (
              <div>
                <FieldLabel>Especifica la cocina principal (Otra)</FieldLabel>
                <HelperText>Texto corto que verá el comprador donde corresponda «Otra» en cocina principal.</HelperText>
                <input
                  className={OTHER_INPUT}
                  maxLength={80}
                  placeholder="Ej. Sichuan, Oaxaca, fusión indo-mexicana…"
                  value={draft.primaryCuisineCustom ?? ""}
                  onChange={(e) => setDraftPatch({ primaryCuisineCustom: e.target.value || undefined })}
                />
              </div>
            ) : null}
            {draft.secondaryCuisine === TAXONOMY_KEY_OTHER ? (
              <div>
                <FieldLabel>Especifica la cocina secundaria (Otra)</FieldLabel>
                <HelperText>Complementa la etiqueta cuando la secundaria es «Otra».</HelperText>
                <input
                  className={OTHER_INPUT}
                  maxLength={80}
                  placeholder="Breve descripción"
                  value={draft.secondaryCuisineCustom ?? ""}
                  onChange={(e) => setDraftPatch({ secondaryCuisineCustom: e.target.value || undefined })}
                />
              </div>
            ) : null}
            <div>
              <FieldLabel optional>Cocinas adicionales</FieldLabel>
              <HelperText>
                Etiquetas extra para descubrimiento y riqueza en la ficha — no son la identidad principal. Elige hasta{" "}
                <strong className="font-semibold text-[color:var(--lx-text-2)]">{MAX_ADDITIONAL_CUISINES}</strong> para
                evitar ruido en resultados. Principal y secundaria siguen siendo las que definen el mensaje.
              </HelperText>
              <p className="mt-1 text-xs font-medium text-[color:var(--lx-text-2)]">
                {(draft.additionalCuisines ?? []).length}/{MAX_ADDITIONAL_CUISINES} seleccionadas
                {(draft.additionalCuisines ?? []).length > MAX_ADDITIONAL_CUISINES ? (
                  <span className="ml-1 text-amber-800">
                    — Tienes más etiquetas de las recomendadas; desmarca hasta {MAX_ADDITIONAL_CUISINES} para un listado más
                    limpio.
                  </span>
                ) : null}
              </p>
              <div className="mt-2 max-h-52 overflow-y-auto rounded-xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-section)]/60 p-3">
                <div className="flex flex-wrap gap-2">
                  {RESTAURANTE_CUISINES.map((o) => {
                    const cur = draft.additionalCuisines ?? [];
                    const checked = cur.includes(o.key);
                    const atCap = cur.length >= MAX_ADDITIONAL_CUISINES && !checked;
                    return (
                      <label
                        key={o.key}
                        className={`inline-flex items-center gap-2 text-sm ${atCap ? "cursor-not-allowed opacity-50" : ""}`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={atCap}
                          onChange={() => toggleAdditionalCuisine(o.key)}
                        />
                        {o.labelEs}
                      </label>
                    );
                  })}
                </div>
              </div>
              {(draft.additionalCuisines ?? []).includes(TAXONOMY_KEY_OTHER) ? (
                <div className="mt-3">
                  <FieldLabel optional>Especifica “Otra” en cocinas adicionales</FieldLabel>
                  <HelperText>Una línea clara; se muestra donde aplique la etiqueta «Otra».</HelperText>
                  <input
                    className={OTHER_INPUT}
                    maxLength={80}
                    placeholder="Una línea, p. ej. comida nikkei"
                    value={draft.additionalCuisineOtherCustom ?? ""}
                    onChange={(e) => setDraftPatch({ additionalCuisineOtherCustom: e.target.value || undefined })}
                  />
                </div>
              ) : null}
            </div>
            <div>
              <FieldLabel required>Resumen corto</FieldLabel>
              <HelperText>
                Línea corta alta en la tarjeta y cabecera de la ficha: quién eres y qué ofreces en una frase o dos.
              </HelperText>
              <textarea
                className="mt-1 min-h-[88px] w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-3 py-2 text-sm"
                value={draft.shortSummary}
                onChange={(e) => setDraftPatch({ shortSummary: e.target.value })}
              />
            </div>
            <div>
              <FieldLabel optional>Descripción larga</FieldLabel>
              <HelperText>
                Texto tipo «Sobre el negocio» más abajo en el detalle: historia, estilo, ambiente. Opcional; no sustituye al
                resumen corto.
              </HelperText>
              <textarea
                className="mt-1 min-h-[120px] w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-3 py-2 text-sm"
                value={draft.longDescription ?? ""}
                onChange={(e) => setDraftPatch({ longDescription: e.target.value || undefined })}
              />
            </div>
            <CityAutocomplete
              lang="es"
              variant="light"
              label="Ciudad (canónica NorCal) *"
              value={draft.cityCanonical}
              onChange={(v) => setDraftPatch({ cityCanonical: v })}
              placeholder="Ej. San José"
            />
            <HelperText>
              Ciudad estructurada de NorCal: es la que usamos para filtros y resultados coherentes. No la sustituye la
              dirección libre de la sección E.
            </HelperText>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <FieldLabel optional>Barrio / zona</FieldLabel>
                <HelperText>Texto libre para contexto local en la ficha; no reemplaza la ciudad canónica.</HelperText>
                <input
                  className="mt-1 w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-3 py-2 text-sm"
                  value={draft.neighborhood ?? ""}
                  onChange={(e) => setDraftPatch({ neighborhood: e.target.value || undefined })}
                />
              </div>
              <div>
                <FieldLabel optional>Código postal</FieldLabel>
                <input
                  className="mt-1 w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-3 py-2 text-sm"
                  inputMode="numeric"
                  value={draft.zipCode ?? ""}
                  onChange={(e) => setDraftPatch({ zipCode: e.target.value.replace(/\D/g, "").slice(0, 5) || undefined })}
                />
              </div>
            </div>
            <div>
              <FieldLabel optional>Nivel de precio</FieldLabel>
              <HelperText>Referencia rápida en la ficha cuando la completes.</HelperText>
              <select
                className="mt-1 w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-3 py-2 text-sm"
                value={draft.priceLevel ?? ""}
                onChange={(e) => setDraftPatch({ priceLevel: (e.target.value as RestauranteListingDraft["priceLevel"]) || undefined })}
              >
                <option value="">—</option>
                {RESTAURANTE_PRICE_LEVELS.map((o) => (
                  <option key={o.key} value={o.key}>
                    {o.labelEs}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <FieldLabel optional>Idiomas</FieldLabel>
              <HelperText>
                Idiomas en los que el equipo puede atender al cliente en persona, por teléfono o mensaje — no es una lista
                decorativa. Aparecen en la franja de información rápida como una línea compacta. «Otro» sirve para idiomas no
                listados; escribe el nombre concreto.
              </HelperText>
              <div className="mt-3 flex flex-wrap gap-2 rounded-xl border border-[color:var(--lx-nav-border)]/80 bg-[color:var(--lx-section)]/40 p-3">
                {RESTAURANTE_LANGUAGES.map((o) => (
                  <label key={o.key} className="inline-flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={(draft.languagesSpoken ?? []).includes(o.key)}
                      onChange={() => toggleLanguage(o.key)}
                    />
                    {o.labelEs}
                  </label>
                ))}
              </div>
              {(draft.languagesSpoken ?? []).includes(TAXONOMY_KEY_OTHER_LANG) ? (
                <div className="mt-3 max-w-md">
                  <FieldLabel optional>Especifica el idioma (Otro)</FieldLabel>
                  <HelperText>Escribe el idioma concreto si no está en la lista.</HelperText>
                  <input
                    className={OTHER_INPUT}
                    maxLength={48}
                    placeholder="Ej. portugués, ASL…"
                    value={draft.languageOtherCustom ?? ""}
                    onChange={(e) => setDraftPatch({ languageOtherCustom: e.target.value || undefined })}
                  />
                </div>
              ) : null}
            </div>
          </div>
        </section>
        ) : null}

        {/* B */}
        {activeSectionId === "restaurantes-section-b" ? (
        <section id="restaurantes-section-b" className={stepPanel}>
          <SectionTitle>B · Modelo de operación</SectionTitle>
          <p className="mt-2 text-xs text-[color:var(--lx-text-2)]">
            <span className="font-semibold text-red-600">*</span> Al menos un <strong>modo de servicio</strong> (lista
            canónica más abajo) para el botón «Vista previa» con validación.
          </p>
          <HelperText>
            Hay <strong className="text-[color:var(--lx-text)]">tres capas</strong> que conviven: (1) interruptores I / J /
            K solo <em>desbloquean secciones extra</em> del formulario; (2) la lista canónica de modos de servicio define la
            identidad de servicio en datos y vista previa; (3) los detalles complementarios refuerzan local, entrega,
            reservas, etc. No es duplicado: cada capa cumple un rol distinto.
          </HelperText>
          <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-[color:var(--lx-muted)]">
            Capa 1 — Interruptores (stacks I · J · K)
          </p>
          <p className="mt-1 text-sm leading-relaxed text-[color:var(--lx-text-2)]">
            Solo controlan si aparecen las secciones <strong>I</strong> (móvil), <strong>J</strong> (desde casa) y{" "}
            <strong>K</strong> (catering/eventos). No sustituyen los modos de servicio obligatorios para la vista previa.
          </p>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div className={PRIMARY_OP_CARD}>
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  className="mt-0.5 h-5 w-5 shrink-0 rounded border-[color:var(--lx-nav-border)]"
                  checked={Boolean(draft.movingVendor)}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    const patch: Partial<RestauranteListingDraft> = { movingVendor: checked };
                    if (checked) patch.movingVendorStack = { ...draft.movingVendorStack };
                    setDraftPatch(patch);
                  }}
                />
                <span className="min-w-0">
                  <span className="block text-base font-bold text-[color:var(--lx-text)]">Ubicación móvil</span>
                  <span className="mt-1 block text-xs leading-relaxed text-[color:var(--lx-muted)]">
                    Al activarlo, se muestra la sección <strong className="text-[color:var(--lx-text-2)]">I · Ubicación móvil</strong>{" "}
                    (ruta, paradas, avisos).
                  </span>
                </span>
              </label>
            </div>
            <div className={PRIMARY_OP_CARD}>
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  className="mt-0.5 h-5 w-5 shrink-0 rounded border-[color:var(--lx-nav-border)]"
                  checked={Boolean(draft.homeBasedBusiness)}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    const patch: Partial<RestauranteListingDraft> = { homeBasedBusiness: checked };
                    if (checked) patch.homeBasedStack = { ...draft.homeBasedStack };
                    setDraftPatch(patch);
                  }}
                />
                <span className="min-w-0">
                  <span className="block text-base font-bold text-[color:var(--lx-text)]">Desde casa</span>
                  <span className="mt-1 block text-xs leading-relaxed text-[color:var(--lx-muted)]">
                    Activa la sección <strong className="text-[color:var(--lx-text-2)]">J · Negocio desde casa</strong>{" "}
                    (recogida, ventanas, avisos).
                  </span>
                </span>
              </label>
            </div>
            <div className={PRIMARY_OP_CARD}>
              <div className="text-base font-bold text-[color:var(--lx-text)]">Catering y eventos</div>
              <p className="mt-1 text-xs leading-relaxed text-[color:var(--lx-muted)]">
                Si marcas al menos una opción, aparece la sección{" "}
                <strong className="text-[color:var(--lx-text-2)]">K · Catering y eventos</strong>.
              </p>
              <div className="mt-3 space-y-2.5">
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-[color:var(--lx-nav-border)]"
                    checked={Boolean(draft.cateringAvailable)}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      const patch: Partial<RestauranteListingDraft> = { cateringAvailable: checked };
                      if (checked) patch.cateringEventsStack = { ...draft.cateringEventsStack };
                      setDraftPatch(patch);
                    }}
                  />
                  Catering
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-[color:var(--lx-nav-border)]"
                    checked={Boolean(draft.eventFoodService)}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      const patch: Partial<RestauranteListingDraft> = { eventFoodService: checked };
                      if (checked) patch.cateringEventsStack = { ...draft.cateringEventsStack };
                      setDraftPatch(patch);
                    }}
                  />
                  Comida para eventos
                </label>
              </div>
            </div>
          </div>

          <div className="mt-8 border-t border-[color:var(--lx-nav-border)] pt-6">
            <p className="text-sm font-semibold text-[color:var(--lx-text)]">Capa 2 — Modos de servicio (lista canónica)</p>
            <p className="mt-2 text-sm text-[color:var(--lx-muted)]">
              Estos son los <strong className="font-semibold text-[color:var(--lx-text-2)]">modos formales</strong> (comer
              en local, para llevar, entrega, etc.) que valida «Vista previa» y que alimentan la identidad de servicio en la
              ficha. Son independientes de los interruptores I / J / K.
            </p>
            <div className="mt-3 rounded-xl border border-[color:var(--lx-gold-border)]/35 bg-[color:var(--lx-nav-hover)]/40 px-4 py-3 text-xs leading-relaxed text-[color:var(--lx-text-2)]">
              <strong className="text-[color:var(--lx-text)]">Recuerda:</strong> I / J / K solo abren secciones extra del
              formulario. Esta lista es la que debe tener al menos una opción marcada para el botón principal de vista
              previa.
            </div>
          </div>

          <p className="mt-6 text-sm font-semibold text-[color:var(--lx-text)]">
            Modos de servicio (lista canónica) <span className="text-red-600">*</span>
          </p>
          <p className="mt-1 text-xs text-[color:var(--lx-muted)]">
            Obligatorio: al menos una opción para usar el botón «Vista previa» con validación.
          </p>
          <div className="mt-3 rounded-2xl border border-[color:var(--lx-nav-border)]/85 bg-white/50 p-3 sm:p-4">
            <div className="flex flex-wrap gap-2">
            {RESTAURANTE_SERVICE_MODES.map((o) => (
              <label
                key={o.key}
                className="inline-flex items-center gap-2 rounded-full border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-section)] px-3 py-1.5 text-sm"
              >
                <input
                  type="checkbox"
                  checked={(draft.serviceModes ?? []).includes(o.key)}
                  onChange={() => toggleServiceMode(o.key)}
                />
                {o.labelEs}
              </label>
            ))}
            </div>
          </div>
          {(draft.serviceModes ?? []).includes(TAXONOMY_KEY_OTHER as RestauranteServiceMode) ? (
            <div className="mt-3 max-w-lg">
              <FieldLabel optional>Especifica el modo de servicio (Otro)</FieldLabel>
              <input
                className={OTHER_INPUT}
                maxLength={64}
                placeholder="Ej. venta en ferias, solo suscripciones…"
                value={draft.serviceModeOtherCustom ?? ""}
                onChange={(e) => setDraftPatch({ serviceModeOtherCustom: e.target.value || undefined })}
              />
            </div>
          ) : null}

          <p className="mt-8 text-sm font-semibold text-[color:var(--lx-text)]">
            Capa 3 — Canal y opciones de servicio (complementarios)
          </p>
          <p className="mt-1 text-xs text-[color:var(--lx-muted)]">
            Casillas de apoyo (local, entrega, reservas, food truck, pop-up, chef, etc.): refuerzan el relato operativo y la
            ficha, pero <strong className="text-[color:var(--lx-text-2)]">no reemplazan</strong> la lista canónica ni los
            interruptores I / J / K.
          </p>
          <p className="mt-2 text-xs leading-relaxed text-[color:var(--lx-text-2)]">
            <strong className="text-[color:var(--lx-text)]">Cómo no confundir términos:</strong> «Food truck» y «Pop-up»
            describen <em>formato o ubicación</em> del negocio. «Entrega» de la <strong>capa 2</strong> es el modo formal de
            servicio a domicilio. Pueden convivir (por ejemplo, entrega desde un food truck).
          </p>
          <div className={`mt-3 grid gap-2 sm:grid-cols-2 ${SECONDARY_CHANNEL_CLUSTER}`}>
            {(
              [
                ["dineIn", "Comer en local"],
                ["takeout", "Para llevar"],
                ["delivery", "Entrega"],
                ["reservationsAvailable", "Reservas"],
                ["preorderRequired", "Preorden obligatoria"],
                ["pickupAvailable", "Recogida"],
                ["foodTruck", "Food truck"],
                ["popUp", "Pop-up"],
                ["personalChef", "Chef personal"],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={Boolean(draft[key])}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setDraftPatch({ [key]: checked } as Partial<RestauranteListingDraft>);
                  }}
                />
                {label}
              </label>
            ))}
          </div>
        </section>
        ) : null}

        {/* C */}
        {activeSectionId === "restaurantes-section-c" ? (
        <section id="restaurantes-section-c" className={stepPanel}>
          <SectionTitle>C · Horarios</SectionTitle>
          <p className="mt-2 text-xs text-[color:var(--lx-text-2)]">
            <span className="font-semibold text-red-600">*</span> Completa cada día (cerrado u horario) o indica la situación
            con las notas de abajo — necesario para la vista previa estructural.
          </p>
          <HelperText>
            La cuadrícula semanal es la base en la ficha. Las notas <strong>no sustituyen</strong> horarios salvo que así lo
            indiques; sirven para excepciones, feriados o cambios puntuales visibles junto al bloque de horas.
          </HelperText>
          <div className="mt-4 space-y-3">
            {DAY_ROWS.map(({ key, label }) => {
              const s = draft[key] as RestauranteDaySchedule;
              return (
                <div
                  key={key}
                  className="grid gap-2 rounded-xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-section)] p-3 sm:grid-cols-[120px_1fr_1fr_auto]"
                >
                  <div className="font-semibold text-sm text-[color:var(--lx-text)]">{label}</div>
                  <label className="flex items-center gap-2 text-sm sm:col-span-3 lg:col-span-1">
                    <input
                      type="checkbox"
                      checked={s.closed}
                      onChange={(e) =>
                        setDay(key, { closed: e.target.checked, openTime: s.openTime, closeTime: s.closeTime })
                      }
                    />
                    Cerrado
                  </label>
                  <input
                    type="time"
                    disabled={s.closed}
                    className="rounded-lg border border-[color:var(--lx-nav-border)] px-2 py-1 text-sm disabled:opacity-50"
                    value={s.openTime ?? ""}
                    onChange={(e) => setDay(key, { ...s, openTime: e.target.value || undefined })}
                  />
                  <input
                    type="time"
                    disabled={s.closed}
                    className="rounded-lg border border-[color:var(--lx-nav-border)] px-2 py-1 text-sm disabled:opacity-50"
                    value={s.closeTime ?? ""}
                    onChange={(e) => setDay(key, { ...s, closeTime: e.target.value || undefined })}
                  />
                </div>
              );
            })}
          </div>
          <div className="mt-4 grid gap-3">
            <div>
              <FieldLabel optional>Nota de horario especial</FieldLabel>
              <HelperText>
                Aviso <strong className="text-[color:var(--lx-text-2)]">recurrente o general</strong> (p. ej. «cerrado lunes
                festivos»): no reemplaza la cuadrícula semanal. Se muestra en el resumen de horario cuando aplica y en el bloque
                «Horarios completos» bajo la lista de días.
              </HelperText>
              <input
                className="mt-1 w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-3 py-2 text-sm"
                value={draft.specialHoursNote ?? ""}
                onChange={(e) => setDraftPatch({ specialHoursNote: e.target.value || undefined })}
              />
            </div>
            <div>
              <label className="inline-flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={Boolean(draft.temporaryHoursActive)}
                  onChange={(e) => setDraftPatch({ temporaryHoursActive: e.target.checked })}
                />
                <span className="font-semibold text-[color:var(--lx-text)]">Horario temporal activo</span>
              </label>
              <HelperText>
                Actívalo para cambios <strong className="text-[color:var(--lx-text-2)]">temporales o estacionales</strong>{" "}
                (obras, feriados extendidos, horario de verano). Mientras esté activo, el estado en la cabecera prioriza tu nota
                temporal; la cuadrícula sigue visible en «Ver horarios» para referencia.
              </HelperText>
            </div>
            <div>
              <FieldLabel optional>Nota de horario temporal</FieldLabel>
              <HelperText>
                <strong className="text-[color:var(--lx-text-2)]">Mensaje que leerá el cliente:</strong> fechas, horario
                sustituto, «solo pickup», etc. Aparece en la franja de estado del héroe (con el interruptor activo) y como aviso
                destacado en «Horarios completos» — es el texto operativo del cambio temporal.
              </HelperText>
              <textarea
                className="mt-1 min-h-[72px] w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-3 py-2 text-sm"
                value={draft.temporaryHoursNote ?? ""}
                onChange={(e) => setDraftPatch({ temporaryHoursNote: e.target.value || undefined })}
              />
            </div>
          </div>
        </section>
        ) : null}

        {/* D */}
        {activeSectionId === "restaurantes-section-d" ? (
        <section id="restaurantes-section-d" className={stepPanel}>
          <SectionTitle>D · Contacto y CTAs</SectionTitle>
          <p className="mt-2 text-sm text-[color:var(--lx-muted)]">
            <span className="text-red-600">*</span> Al menos una vía de contacto (sitio, teléfono, correo, redes, menú/archivo,
            etc.) para la vista previa mínima.
          </p>
          <HelperText>
            Los enlaces web se convierten en botones en la ficha. <strong className="text-[color:var(--lx-text-2)]">Menú URL</strong>{" "}
            abre la carta en el sitio del restaurante (vista previa: confirmación y luego pestaña nueva).{" "}
            <strong className="text-[color:var(--lx-text-2)]">Menú archivo</strong> se abre en un visor dentro de la vista previa
            (PDF/imagen). Si hay ambos, verás dos botones: menú en línea y carta en archivo; el bloque de contacto también puede
            repetir el archivo para descarga/visualización.
          </HelperText>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <FieldLabel optional>Sitio web</FieldLabel>
              <HelperText>Destino principal de tu marca; botón «Sitio web» en la fila de acciones.</HelperText>
              <input
                className="mt-1 w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-3 py-2 text-sm"
                placeholder={RESTAURANTE_CONTACT_PLACEHOLDERS.websiteUrl}
                value={draft.websiteUrl ?? ""}
                onChange={(e) => setDraftPatch({ websiteUrl: e.target.value || undefined })}
              />
            </div>
            <div>
              <FieldLabel optional>Teléfono</FieldLabel>
              <HelperText>Visible y usable para «Llamar»; también habilita el CTA de SMS si lo activas abajo.</HelperText>
              <input
                className="mt-1 w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-3 py-2 text-sm"
                placeholder={RESTAURANTE_CONTACT_PLACEHOLDERS.phoneNumber}
                value={draft.phoneNumber ?? ""}
                onChange={(e) => setDraftPatch({ phoneNumber: e.target.value || undefined })}
              />
            </div>
            <div>
              <FieldLabel optional>Correo</FieldLabel>
              <input
                className="mt-1 w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-3 py-2 text-sm"
                placeholder={RESTAURANTE_CONTACT_PLACEHOLDERS.email}
                value={draft.email ?? ""}
                onChange={(e) => setDraftPatch({ email: e.target.value || undefined })}
              />
            </div>
            <div className="sm:col-span-2">
              <FieldLabel optional>WhatsApp (número)</FieldLabel>
              <HelperText>Genera el botón de WhatsApp con el número en formato internacional.</HelperText>
              <input
                className="mt-1 w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-3 py-2 text-sm"
                placeholder={RESTAURANTE_CONTACT_PLACEHOLDERS.whatsAppNumber}
                value={draft.whatsAppNumber ?? ""}
                onChange={(e) => setDraftPatch({ whatsAppNumber: e.target.value || undefined })}
              />
            </div>
            <div className="sm:col-span-2 rounded-xl border border-[color:var(--lx-nav-border)]/70 bg-[color:var(--lx-section)]/30 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--lx-muted)]">Redes</p>
              <HelperText className="!mt-0">Enlaces a perfiles; aparecen como accesos secundarios en contacto.</HelperText>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {(
                  [
                    ["instagramUrl", "Instagram (URL)"],
                    ["facebookUrl", "Facebook (URL)"],
                    ["tiktokUrl", "TikTok (URL)"],
                    ["youtubeUrl", "YouTube (URL)"],
                  ] as const
                ).map(([key, lab]) => (
                  <div key={key}>
                    <FieldLabel optional>{lab}</FieldLabel>
                    <input
                      className="mt-1 w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-3 py-2 text-sm"
                      placeholder={RESTAURANTE_CONTACT_PLACEHOLDERS[key] ?? undefined}
                      value={(draft[key] as string | undefined) ?? ""}
                      onChange={(e) => setDraftPatch({ [key]: e.target.value || undefined } as Partial<RestauranteListingDraft>)}
                    />
                  </div>
                ))}
              </div>
            </div>
            <div>
              <FieldLabel optional>Reservas (URL)</FieldLabel>
              <HelperText>Enlace directo a reservar (OpenTable, su propia web, etc.). Botón «Reservar» si existe.</HelperText>
              <input
                className="mt-1 w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-3 py-2 text-sm"
                placeholder={RESTAURANTE_CONTACT_PLACEHOLDERS.reservationUrl}
                value={draft.reservationUrl ?? ""}
                onChange={(e) => setDraftPatch({ reservationUrl: e.target.value || undefined })}
              />
            </div>
            <div>
              <FieldLabel optional>Pedidos (URL)</FieldLabel>
              <HelperText>Donde el cliente ordena en línea (app, web propia, delivery). Botón «Ordenar» si existe.</HelperText>
              <input
                className="mt-1 w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-3 py-2 text-sm"
                placeholder={RESTAURANTE_CONTACT_PLACEHOLDERS.orderUrl}
                value={draft.orderUrl ?? ""}
                onChange={(e) => setDraftPatch({ orderUrl: e.target.value || undefined })}
              />
            </div>
            <div>
              <FieldLabel optional>Menú (URL)</FieldLabel>
              <HelperText>Página pública donde está la carta (sitio propio, PDF en hosting, etc.). Si también subes archivo, la URL sigue siendo el acceso «en línea»; el archivo es la copia local en visor.</HelperText>
              <input
                className="mt-1 w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-3 py-2 text-sm"
                placeholder={RESTAURANTE_CONTACT_PLACEHOLDERS.menuUrl}
                value={draft.menuUrl ?? ""}
                onChange={(e) => setDraftPatch({ menuUrl: e.target.value || undefined })}
              />
            </div>
            <div>
              <FieldLabel optional>Ver ubicación (URL maps)</FieldLabel>
              <HelperText>
                Opcional. Si lo rellenas, <strong className="text-[color:var(--lx-text-2)]">tiene prioridad</strong> como
                consulta de mapa frente a la dirección estructurada de la sección E. Úsalo solo si necesitas un enlace
                distinto al que generamos con tu dirección.
              </HelperText>
              <input
                className="mt-1 w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-3 py-2 text-sm"
                placeholder={RESTAURANTE_CONTACT_PLACEHOLDERS.verUbicacionUrl}
                value={draft.verUbicacionUrl ?? ""}
                onChange={(e) => setDraftPatch({ verUbicacionUrl: e.target.value || undefined })}
              />
            </div>
            <div className="sm:col-span-2">
              <FieldLabel optional>Menú (archivo — vista previa local)</FieldLabel>
              <HelperText>
                PDF o imagen de la carta guardada en el borrador de sesión: en la vista previa se abre en un visor a pantalla
                completa (no sustituye a la URL si ambas existen; entonces tendrás botón web + botón archivo).
              </HelperText>
              <RestauranteUploadRow
                buttonLabel="Subir archivo"
                helperText="PDF o imagen. Se guarda en el borrador de sesión."
                accept="image/*,application/pdf"
                selectedLabel={uploadLabels.menu ?? (draft.menuFile ? "Archivo guardado en el borrador" : null)}
                onFilesSelected={async (files) => {
                  const f = files?.[0];
                  if (!f) {
                    setDraftPatch({ menuFile: undefined });
                    setUploadLabels((p) => {
                      const n = { ...p };
                      delete n.menu;
                      return n;
                    });
                    return;
                  }
                  setUploadLabels((p) => ({ ...p, menu: f.name }));
                  setDraftPatch({ menuFile: await readFileAsDataUrl(f) });
                }}
              />
              {draft.menuFile ? (
                <button
                  type="button"
                  className="mt-2 text-xs font-semibold text-red-800 underline"
                  onClick={() => {
                    setDraftPatch({ menuFile: undefined });
                    setUploadLabels((p) => {
                      const n = { ...p };
                      delete n.menu;
                      return n;
                    });
                  }}
                >
                  Quitar archivo
                </button>
              ) : null}
            </div>
            <div className="sm:col-span-2">
              <FieldLabel optional>Folleto (archivo)</FieldLabel>
              <HelperText>
                PDF o imagen de apoyo (promo, catering, menú degustación). No sustituye al menú principal: aparece como acceso
                aparte en contacto y, si es PDF/imagen en sesión, se abre en el mismo visor en contexto.
              </HelperText>
              <RestauranteUploadRow
                buttonLabel="Subir archivo"
                helperText="Imagen o PDF."
                accept="image/*,application/pdf"
                selectedLabel={uploadLabels.brochure ?? (draft.brochureFile ? "Archivo guardado en el borrador" : null)}
                onFilesSelected={async (files) => {
                  const f = files?.[0];
                  if (!f) {
                    setDraftPatch({ brochureFile: undefined });
                    setUploadLabels((p) => {
                      const n = { ...p };
                      delete n.brochure;
                      return n;
                    });
                    return;
                  }
                  setUploadLabels((p) => ({ ...p, brochure: f.name }));
                  setDraftPatch({ brochureFile: await readFileAsDataUrl(f) });
                }}
              />
              {draft.brochureFile ? (
                <button
                  type="button"
                  className="mt-2 text-xs font-semibold text-red-800 underline"
                  onClick={() => {
                    setDraftPatch({ brochureFile: undefined });
                    setUploadLabels((p) => {
                      const n = { ...p };
                      delete n.brochure;
                      return n;
                    });
                  }}
                >
                  Quitar archivo
                </button>
              ) : null}
            </div>
            <div className="sm:col-span-2 rounded-xl border border-[color:var(--lx-nav-border)]/80 bg-[color:var(--lx-card)] p-3">
              <label
                className={`flex cursor-pointer items-start gap-2 text-sm ${!phonePresent ? "cursor-not-allowed opacity-60" : ""}`}
              >
                <input
                  type="checkbox"
                  className="mt-0.5"
                  disabled={!phonePresent}
                  checked={Boolean(phonePresent && draft.allowMessageCTA)}
                  onChange={(e) => setDraftPatch({ allowMessageCTA: e.target.checked })}
                />
                <span className="font-semibold text-[color:var(--lx-text)]">Mostrar CTA de mensaje (SMS)</span>
              </label>
              <HelperText>
                {phonePresent ? (
                  <>
                    Usará el <strong className="text-[color:var(--lx-text-2)]">número de teléfono</strong> ingresado arriba. El
                    botón «Mensaje» abre SMS a ese mismo número (formato detectado automáticamente).
                  </>
                ) : (
                  <>Añade primero un teléfono en «Teléfono» para poder activar el SMS.</>
                )}
              </HelperText>
            </div>
          </div>
        </section>
        ) : null}

        {/* E */}
        {activeSectionId === "restaurantes-section-e" ? (
        <section id="restaurantes-section-e" className={stepPanel}>
          <SectionTitle>E · Ubicación y privacidad</SectionTitle>
          <HelperText>
            La <strong className="text-[color:var(--lx-text-2)]">ciudad canónica</strong> (sección A) sigue siendo el campo
            estructurado para filtros NorCal. Aquí defines <strong className="text-[color:var(--lx-text-2)]">cómo se ve</strong>{" "}
            la ubicación en la ficha: dirección, mapa y privacidad. Un restaurante con fachura fija suele mostrar dirección
            exacta; food trucks, pop-ups, cocina en casa o catering suelen combinar privacidad + área de servicio.
          </HelperText>
          <div className="mt-4 grid gap-3">
            <div>
              <FieldLabel optional>Dirección línea 1</FieldLabel>
              <HelperText>Calle y número cuando quieras anclar el pin o el bloque de contacto; respeta lo que elijas en privacidad.</HelperText>
              <input
                className="mt-1 w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-3 py-2 text-sm"
                value={draft.addressLine1 ?? ""}
                onChange={(e) => setDraftPatch({ addressLine1: e.target.value || undefined })}
              />
            </div>
            <div>
              <FieldLabel optional>Dirección línea 2</FieldLabel>
              <HelperText>Suite, piso, edificio o indicaciones; opcional.</HelperText>
              <input
                className="mt-1 w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-3 py-2 text-sm"
                value={draft.addressLine2 ?? ""}
                onChange={(e) => setDraftPatch({ addressLine2: e.target.value || undefined })}
              />
            </div>
            <div>
              <FieldLabel optional>Estado</FieldLabel>
              <HelperText>Complementa la línea de dirección junto a la ciudad canónica y el CP.</HelperText>
              <input
                className="mt-1 w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-3 py-2 text-sm"
                value={draft.state ?? ""}
                onChange={(e) => setDraftPatch({ state: e.target.value || undefined })}
              />
            </div>
            <div>
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={Boolean(draft.showExactAddress)}
                  onChange={(e) => setDraftPatch({ showExactAddress: e.target.checked })}
                />
                <span className="font-semibold text-[color:var(--lx-text)]">Mostrar dirección exacta cuando aplique</span>
              </label>
              <HelperText>
                <strong className="text-[color:var(--lx-text-2)]">Encendido:</strong> típico de local con dirección pública.{" "}
                <strong className="text-[color:var(--lx-text-2)]">Apagado + privacidad «aproximada» o solo ciudad:</strong> el
                mapa puede mostrar zona aproximada o cruce en lugar del número exacto — útil para móvil, pop-up o casa.
              </HelperText>
            </div>
            <div>
              <FieldLabel optional>Área de servicio (texto)</FieldLabel>
              <HelperText>
                Resumen en lenguaje natural de <em>dónde atiendes</em> (ej. «Península / desde San Mateo hasta SJ»). No
                sustituye la ciudad canónica ni los filtros; complementa la tarjeta.
              </HelperText>
              <input
                className="mt-1 w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-3 py-2 text-sm"
                value={draft.serviceAreaText ?? ""}
                onChange={(e) => setDraftPatch({ serviceAreaText: e.target.value || undefined })}
              />
            </div>
            <div>
              <FieldLabel optional>Radio de entrega (millas)</FieldLabel>
              <HelperText>
                {deliveryRelevant ? (
                  <>
                    Alcance aproximado cuando ofreces <strong className="text-[color:var(--lx-text-2)]">entrega</strong> (marca
                    «Entrega» en B o el interruptor de entrega). Déjalo vacío si no entregas.
                  </>
                ) : (
                  <>
                    Solo relevante si ofreces entrega (activa entrega en sección B). Si no aplica, puedes dejarlo vacío.
                  </>
                )}
              </HelperText>
              <input
                type="number"
                min={0}
                className="mt-1 w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-3 py-2 text-sm"
                value={draft.deliveryRadiusMiles ?? ""}
                onChange={(e) =>
                  setDraftPatch({
                    deliveryRadiusMiles: e.target.value === "" ? undefined : Number(e.target.value),
                  })
                }
              />
            </div>
            <div>
              <FieldLabel optional>Privacidad de ubicación</FieldLabel>
              <HelperText>
                Alinea el listado con tu modelo: exacta = fachada conocida; aproximada = zona o cruce; solo ciudad/zona = sin
                pin fino. Leonix <strong className="text-[color:var(--lx-text-2)]">no gestiona seguimiento en vivo</strong>: el
                mapa usa la dirección, esta opción y (si la pegas) la URL manual de D.
              </HelperText>
              <select
                className="mt-1 w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-3 py-2 text-sm"
                value={draft.locationPrivacyMode ?? ""}
                onChange={(e) =>
                  setDraftPatch({
                    locationPrivacyMode: (e.target.value as RestauranteListingDraft["locationPrivacyMode"]) || undefined,
                  })
                }
              >
                <option value="">—</option>
                {RESTAURANTE_LOCATION_PRIVACY.map((o) => (
                  <option key={o.key} value={o.key}>
                    {o.labelEs}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>
        ) : null}

        {/* F */}
        {activeSectionId === "restaurantes-section-f" ? (
        <section id="restaurantes-section-f" className={stepPanel}>
          <SectionTitle>F · Platos destacados (máx. 4)</SectionTitle>
          <HelperText>
            Módulo propio en la ficha abierta (no es la galería G): vende el menú con foto + título + nota. En vista previa
            los dos primeros destacan; el resto se despliega con «Ver más platillos». El precio se muestra en formato USD
            limpio; el enlace es opcional por plato.
          </HelperText>
          <div className="mt-4 space-y-6">
            {(draft.featuredDishes ?? []).map((dish, i) => (
              <div key={i} className="rounded-xl border border-[color:var(--lx-nav-border)] p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold">Plato {i + 1}</span>
                  <button type="button" className="text-sm text-red-700 underline" onClick={() => removeFeatured(i)}>
                    Quitar
                  </button>
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <FieldLabel>Título</FieldLabel>
                    <HelperText>Nombre del plato en el bloque «Platillos destacados».</HelperText>
                    <input
                      className="mt-1 w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-3 py-2 text-sm"
                      value={dish.title}
                      onChange={(e) => patchFeatured(i, { title: e.target.value })}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <FieldLabel>Nota corta</FieldLabel>
                    <HelperText>Subtítulo bajo el título (ingredientes, estilo).</HelperText>
                    <textarea
                      className="mt-1 min-h-[64px] w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-3 py-2 text-sm"
                      value={dish.shortNote}
                      onChange={(e) => patchFeatured(i, { shortNote: e.target.value })}
                    />
                  </div>
                  <div>
                    <FieldLabel optional>Precio / etiqueta</FieldLabel>
                    <HelperText>Número o texto; si es importe, la ficha lo formatea como USD (ej. 12 → $12.00).</HelperText>
                    <input
                      className="mt-1 w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-3 py-2 text-sm"
                      value={dish.priceLabel ?? ""}
                      onChange={(e) => patchFeatured(i, { priceLabel: e.target.value || undefined })}
                    />
                  </div>
                  <div>
                    <FieldLabel optional>Enlace al menú</FieldLabel>
                    <HelperText>Opcional: ancla a una sección del menú online si aplica.</HelperText>
                    <input
                      className="mt-1 w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-3 py-2 text-sm"
                      placeholder={RESTAURANTE_CONTACT_PLACEHOLDERS.menuUrl}
                      value={dish.menuLink ?? ""}
                      onChange={(e) => patchFeatured(i, { menuLink: e.target.value || undefined })}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <FieldLabel>Imagen</FieldLabel>
                    <HelperText>Foto del plato; sin foto el bloque igual muestra el título con marcador visual.</HelperText>
                    <RestauranteUploadRow
                      buttonLabel="Subir imagen"
                      helperText="Foto del plato."
                      accept="image/*"
                      selectedLabel={
                        uploadLabels[`featured-${i}`] ?? (dish.image ? "Imagen guardada en el borrador" : null)
                      }
                      onFilesSelected={async (files) => {
                        const f = files?.[0];
                        if (!f) return;
                        setUploadLabels((p) => ({ ...p, [`featured-${i}`]: f.name }));
                        patchFeatured(i, { image: await readRestauranteImageAsDataUrl(f) });
                      }}
                    />
                    {dish.image ? (
                      <div className="relative mt-2 aspect-video w-full max-w-xs overflow-hidden rounded-lg border">
                        <Image src={dish.image} alt="" fill className="object-cover" unoptimized />
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
            {(draft.featuredDishes ?? []).length < 4 ? (
              <button
                type="button"
                onClick={addFeaturedSlot}
                className="rounded-full border border-dashed border-[color:var(--lx-gold-border)] px-4 py-2 text-sm font-semibold text-[color:var(--lx-text)] hover:bg-[color:var(--lx-nav-hover)]"
              >
                + Añadir plato
              </button>
            ) : null}
          </div>
        </section>
        ) : null}

        {/* G */}
        {activeSectionId === "restaurantes-section-g" ? (
        <section id="restaurantes-section-g" className={stepPanel}>
          <SectionTitle>G · Galería y medios</SectionTitle>
          <HelperText>
            <strong className="text-[color:var(--lx-text-2)]">Hero</strong> = ancla visual superior de la ficha.{" "}
            <strong className="text-[color:var(--lx-text-2)]">Galería general + video en la tira</strong> = carrusel mixto de
            apoyo. <strong className="text-[color:var(--lx-text-2)]">Interiores / Comida / Exterior</strong> = grupos
            etiquetados en el detalle (no sustituyen a los platillos F). El video es opcional y complementa; en preview el
            archivo local gana sobre URL.
          </HelperText>
          <div className="mt-4 grid gap-4">
            <div>
              <FieldLabel required>Foto principal (hero)</FieldLabel>
              <p className="mt-1 text-xs text-[color:var(--lx-muted)]">
                Si no subes hero, la <strong>primera imagen</strong> del orden en G (galería) actúa como portada en vista previa,
                resultados y publicación.
              </p>
              <div
                className="mt-2 rounded-xl border border-dashed border-[color:var(--lx-nav-border)]/80 bg-[color:var(--lx-section)]/25 p-3"
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "copy";
                }}
                onDrop={async (e) => {
                  e.preventDefault();
                  const f = e.dataTransfer.files?.[0];
                  if (!f?.type.startsWith("image/")) return;
                  try {
                    const dataUrl = await readRestauranteImageAsDataUrl(f);
                    if (!dataUrl?.trim().startsWith("data:image")) return;
                    setDraftPatch({ heroImage: dataUrl });
                    setUploadLabels((p) => ({ ...p, hero: f.name }));
                  } catch {
                    /* ignore */
                  }
                }}
              >
                <RestauranteUploadRow
                  buttonLabel="Subir imagen"
                  helperText="Clic o arrastra una imagen aquí. Miniatura en cuanto se guarde en el borrador de sesión."
                  accept="image/*"
                  selectedLabel={
                    uploadLabels.hero ??
                    (draft.heroImage?.trim()
                      ? "Imagen en el borrador (miniatura abajo)"
                      : null)
                  }
                  onFilesSelected={async (files) => {
                    const f = files?.[0];
                    if (!f) {
                      setDraftPatch({ heroImage: "" });
                      setUploadLabels((p) => {
                        const n = { ...p };
                        delete n.hero;
                        return n;
                      });
                      return;
                    }
                    try {
                      const dataUrl = await readRestauranteImageAsDataUrl(f);
                      if (!dataUrl?.trim().startsWith("data:image")) {
                        setUploadLabels((p) => {
                          const n = { ...p };
                          delete n.hero;
                          return n;
                        });
                        return;
                      }
                      setDraftPatch({ heroImage: dataUrl });
                      setUploadLabels((p) => ({ ...p, hero: f.name }));
                    } catch {
                      setUploadLabels((p) => {
                        const n = { ...p };
                        delete n.hero;
                        return n;
                      });
                    }
                  }}
                />
              </div>
              {draft.heroImage?.trim() ? (
                <>
                  <div className="relative mt-3 w-full max-w-md overflow-hidden rounded-2xl border-2 border-[color:var(--lx-gold-border)] bg-[color:var(--lx-section)] shadow-sm">
                    <div className="relative aspect-[16/9] min-h-[120px] w-full">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={draft.heroImage}
                        alt=""
                        className="absolute inset-0 h-full w-full object-cover"
                        draggable={false}
                      />
                    </div>
                    <div className="flex flex-wrap gap-2 border-t border-[color:var(--lx-nav-border)] bg-white/80 px-3 py-2">
                      <button
                        type="button"
                        className="rounded-lg border border-[color:var(--lx-nav-border)] bg-white px-3 py-1.5 text-xs font-semibold text-[color:var(--lx-text)] hover:bg-[color:var(--lx-nav-hover)]"
                        onClick={() => document.getElementById("restaurante-hero-file")?.click()}
                      >
                        Reemplazar
                      </button>
                      <button
                        type="button"
                        className="text-xs font-semibold text-red-800 underline"
                        onClick={() => {
                          setDraftPatch({ heroImage: "" });
                          setUploadLabels((p) => {
                            const n = { ...p };
                            delete n.hero;
                            return n;
                          });
                        }}
                      >
                        Quitar imagen
                      </button>
                    </div>
                  </div>
                  <input
                    id="restaurante-hero-file"
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    aria-hidden
                    onChange={(e) => {
                      const list = e.target.files;
                      void (async () => {
                        const file = list?.[0];
                        if (!file) return;
                        try {
                          const dataUrl = await readRestauranteImageAsDataUrl(file);
                          if (dataUrl?.trim().startsWith("data:image")) {
                            setDraftPatch({ heroImage: dataUrl });
                            setUploadLabels((p) => ({ ...p, hero: file.name }));
                          }
                        } finally {
                          e.target.value = "";
                        }
                      })();
                    }}
                  />
                </>
              ) : null}
            </div>
            <RestaurantePublishMediaStrip
              draft={draft}
              setDraftPatch={setDraftPatch}
              uploadLabels={uploadLabels}
              setUploadLabels={setUploadLabels}
            />
            <div className="grid gap-6 sm:grid-cols-3">
              {(
                [
                  ["interiorImages", "Interiores", "interiores"] as const,
                  ["foodImages", "Comida", "comida"] as const,
                  ["exteriorImages", "Exteriores", "exteriores"] as const,
                ] as const
              ).map(([field, lab, hint]) => (
                <div key={field}>
                  <FieldLabel optional>{lab}</FieldLabel>
                  <HelperText>
                    {field === "interiorImages"
                      ? "Ambiente y espacio; se agrupa en la galería del detalle."
                      : field === "foodImages"
                        ? "Platos y mesa; refuerza la sección de comida en la ficha."
                        : "Fachada y entorno; se muestra en la categoría exterior."}
                  </HelperText>
                  <RestauranteSubGalleryBucket
                    field={field}
                    emptyHintLabel={hint}
                    draft={draft}
                    setDraftPatch={setDraftPatch}
                  />
                </div>
              ))}
            </div>
            <div>
              <FieldLabel optional>Video (URL externo)</FieldLabel>
              <p className="mt-1 text-xs leading-relaxed text-[color:var(--lx-muted)] sm:max-w-2xl">
                Opcional. En la ficha, <strong className="text-[color:var(--lx-text-2)]">un video local subido en la tira</strong>{" "}
                tiene prioridad sobre la URL. Si pegas una URL aquí, el formulario quita el archivo local para evitar dos
                videos a la vez.
              </p>
              <input
                className="mt-2 w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-3 py-2 text-sm"
                placeholder={RESTAURANTE_CONTACT_PLACEHOLDERS.videoUrl}
                value={draft.videoUrl ?? ""}
                onChange={(e) => {
                  const raw = e.target.value;
                  const v = raw.trim() === "" ? undefined : raw;
                  const urlActive = !!v?.trim();
                  setDraftPatch((prev) => {
                    const nextFile = urlActive ? undefined : prev.videoFile;
                    const nextUrl = v;
                    let seq =
                      prev.galleryMediaSequence ??
                      resolveRestauranteGallerySequence({
                        ...prev,
                        videoFile: nextFile,
                        videoUrl: nextUrl,
                      });
                    const hasVideo = !!(nextFile?.trim() || nextUrl?.trim());
                    if (hasVideo) {
                      if (!seq.includes("v")) seq = [...seq, "v"];
                    } else {
                      seq = seq.filter((x) => x !== "v");
                    }
                    return {
                      videoUrl: nextUrl,
                      videoFile: nextFile,
                      galleryMediaSequence: seq.length ? seq : undefined,
                    };
                  });
                }}
              />
              {draft.videoUrl?.trim() && !draft.videoFile?.trim() ? (
                <div className="mt-2 flex items-center gap-2 rounded-xl border border-[color:var(--lx-gold-border)]/50 bg-[color:var(--lx-section)] px-3 py-2 text-xs text-[color:var(--lx-text-2)]">
                  <span className="font-semibold text-[color:var(--lx-text)]">Enlace aceptado</span>
                  <span className="min-w-0 truncate">{draft.videoUrl.trim()}</span>
                </div>
              ) : null}
            </div>
          </div>
        </section>
        ) : null}

        {/* H */}
        {activeSectionId === "restaurantes-section-h" ? (
        <section id="restaurantes-section-h" className={stepPanel}>
          <SectionTitle>H · Destacados del lugar</SectionTitle>
          <p className="mt-2 text-sm text-[color:var(--lx-muted)]">
            Máximo <strong className="text-[color:var(--lx-text-2)]">6</strong> etiquetas en la ficha; aquí no puedes pasar de
            seis seleccionadas.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {RESTAURANTE_HIGHLIGHTS.map((o) => {
              const cur = draft.highlights ?? [];
              const checked = cur.includes(o.key);
              const atCap = cur.length >= 6 && !checked;
              return (
                <label
                  key={o.key}
                  className={`inline-flex items-center gap-2 rounded-full border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-section)] px-3 py-1.5 text-sm ${atCap ? "cursor-not-allowed opacity-50" : ""}`}
                >
                  <input
                    type="checkbox"
                    disabled={atCap}
                    checked={checked}
                    onChange={() => toggleHighlight(o.key)}
                  />
                  {o.labelEs}
                </label>
              );
            })}
          </div>
        </section>
        ) : null}

        {/* I */}
        {draft.movingVendor && activeSectionId === "restaurantes-section-i" ? (
          <section id="restaurantes-section-i" className={stepPanel}>
            <SectionTitle>I · Ubicación móvil</SectionTitle>
            <HelperText>
              Para <strong className="text-[color:var(--lx-text-2)]">tacos trucks, puestos móviles y pop-ups</strong> cuya
              ubicación cambia. Esto <strong className="text-[color:var(--lx-text-2)]">no es rastreo en vivo en Leonix</strong>:
              tú publicas texto y enlaces; el cliente usa tu URL (red social, mapa guardado, página de ubicación) para
              enterarse. Leonix no envía notificaciones push ni GPS.
            </HelperText>
            <div className="mt-4 grid gap-3">
              <div>
                <FieldLabel optional>Ubicación actual</FieldLabel>
                <HelperText>Texto corto de dónde estás hoy (barrio, esquina, evento).</HelperText>
                <input
                  className="mt-1 w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-3 py-2 text-sm"
                  value={draft.movingVendorStack?.currentLocationText ?? ""}
                  onChange={(e) =>
                    setDraftPatch({
                      movingVendorStack: { ...draft.movingVendorStack, currentLocationText: e.target.value || undefined },
                    })
                  }
                />
              </div>
              <div>
                <FieldLabel optional>URL ubicación</FieldLabel>
                <HelperText>Donde suele estar tu aviso actualizado (post, perfil, mapa compartido).</HelperText>
                <input
                  className="mt-1 w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-3 py-2 text-sm"
                  value={draft.movingVendorStack?.currentLocationUrl ?? ""}
                  onChange={(e) =>
                    setDraftPatch({
                      movingVendorStack: { ...draft.movingVendorStack, currentLocationUrl: e.target.value || undefined },
                    })
                  }
                />
              </div>
              <div>
                <FieldLabel optional>Horario de hoy</FieldLabel>
                <HelperText>Franja visible en el bloque móvil (aparte de la sección C general).</HelperText>
                <input
                  className="mt-1 w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-3 py-2 text-sm"
                  value={draft.movingVendorStack?.todayHoursText ?? ""}
                  onChange={(e) =>
                    setDraftPatch({
                      movingVendorStack: { ...draft.movingVendorStack, todayHoursText: e.target.value || undefined },
                    })
                  }
                />
              </div>
              <div>
                <FieldLabel optional>Próxima parada</FieldLabel>
                <input
                  className="mt-1 w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-3 py-2 text-sm"
                  value={draft.movingVendorStack?.nextStopText ?? ""}
                  onChange={(e) =>
                    setDraftPatch({
                      movingVendorStack: { ...draft.movingVendorStack, nextStopText: e.target.value || undefined },
                    })
                  }
                />
              </div>
              <div>
                <FieldLabel optional>Hora próxima parada</FieldLabel>
                <input
                  className="mt-1 w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-3 py-2 text-sm"
                  value={draft.movingVendorStack?.nextStopTime ?? ""}
                  onChange={(e) =>
                    setDraftPatch({
                      movingVendorStack: { ...draft.movingVendorStack, nextStopTime: e.target.value || undefined },
                    })
                  }
                />
              </div>
              <div>
                <FieldLabel optional>Ruta semanal</FieldLabel>
                <HelperText>Patrón recurrente (ej. «Mié–Vie SOMA»).</HelperText>
                <input
                  className="mt-1 w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-3 py-2 text-sm"
                  value={draft.movingVendorStack?.weeklyRouteText ?? ""}
                  onChange={(e) =>
                    setDraftPatch({
                      movingVendorStack: { ...draft.movingVendorStack, weeklyRouteText: e.target.value || undefined },
                    })
                  }
                />
              </div>
              <div>
                <FieldLabel optional>Texto de avisos</FieldLabel>
                <HelperText>Mensaje para quien lea el anuncio (cambios, retrasos).</HelperText>
                <input
                  className="mt-1 w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-3 py-2 text-sm"
                  value={draft.movingVendorStack?.notifyCopy ?? ""}
                  onChange={(e) =>
                    setDraftPatch({
                      movingVendorStack: { ...draft.movingVendorStack, notifyCopy: e.target.value || undefined },
                    })
                  }
                />
              </div>
              <div>
                <label className="inline-flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="mt-0.5"
                    checked={Boolean(draft.movingVendorStack?.activeNow)}
                    onChange={(e) =>
                      setDraftPatch({
                        movingVendorStack: { ...draft.movingVendorStack, activeNow: e.target.checked },
                      })
                    }
                  />
                  <span className="font-semibold text-[color:var(--lx-text)]">Activo ahora</span>
                </label>
                <HelperText>Indica en el anuncio si estás operando en este momento (texto; no seguimiento automático).</HelperText>
              </div>
            </div>
          </section>
        ) : null}

        {/* J */}
        {draft.homeBasedBusiness && activeSectionId === "restaurantes-section-j" ? (
          <section id="restaurantes-section-j" className={stepPanel}>
            <SectionTitle>J · Negocio desde casa</SectionTitle>
            <HelperText>
              <strong className="text-[color:var(--lx-text-2)]">No sustituye la sección C</strong>: C es el horario general del
              negocio; J es logística de <strong className="text-[color:var(--lx-text-2)]">recogida / ventanas / radio desde
              casa</strong> cuando operas desde domicilio.
            </HelperText>
            <div className="mt-4 grid gap-3">
              <div>
                <FieldLabel optional>Instrucciones de recogida</FieldLabel>
                <HelperText>Cómo llega el cliente (entrada, timbre, estacionamiento).</HelperText>
                <textarea
                  className="mt-1 min-h-[72px] w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-3 py-2 text-sm"
                  value={draft.homeBasedStack?.pickupInstructions ?? ""}
                  onChange={(e) =>
                    setDraftPatch({
                      homeBasedStack: { ...draft.homeBasedStack, pickupInstructions: e.target.value || undefined },
                    })
                  }
                />
              </div>
              <div>
                <FieldLabel optional>Días de recogida</FieldLabel>
                <HelperText>Días en los que aceptas pickup en casa (pueden ser un subconjunto de C).</HelperText>
                <div className="mt-2 flex flex-wrap gap-2">
                  {RESTAURANTE_PICKUP_DAYS.map((d) => (
                    <label key={d} className="inline-flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={(draft.homeBasedStack?.pickupDays ?? []).includes(d)}
                        onChange={() => {
                          const cur = draft.homeBasedStack?.pickupDays ?? [];
                          const next = cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d];
                          setDraftPatch({ homeBasedStack: { ...draft.homeBasedStack, pickupDays: next } });
                        }}
                      />
                      {d}
                    </label>
                  ))}
                </div>
              </div>
              {(
                [
                  ["pickupWindowText", "Ventana de recogida"],
                  ["preorderLeadTimeText", "Tiempo de anticipación"],
                  ["homeBusinessNotice", "Aviso al cliente"],
                ] as const
              ).map(([k, lab]) => (
                <div key={k}>
                  <FieldLabel optional>{lab}</FieldLabel>
                  {k === "pickupWindowText" ? (
                    <HelperText>Ventana horaria típica de recogida en este modelo.</HelperText>
                  ) : k === "preorderLeadTimeText" ? (
                    <HelperText>Cuánto tiempo pides pedir con anticipación.</HelperText>
                  ) : (
                    <HelperText>Aviso corto al cliente (acceso, estacionamiento).</HelperText>
                  )}
                  <input
                    className="mt-1 w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-3 py-2 text-sm"
                    value={(draft.homeBasedStack?.[k] as string | undefined) ?? ""}
                    onChange={(e) =>
                      setDraftPatch({
                        homeBasedStack: { ...draft.homeBasedStack, [k]: e.target.value || undefined },
                      })
                    }
                  />
                </div>
              ))}
              <div>
                <FieldLabel optional>Radio de entrega (millas) — hogar</FieldLabel>
                <HelperText>Alcance desde el punto de cocina/hogar cuando ofreces entrega desde casa.</HelperText>
                <input
                  type="number"
                  min={0}
                  className="mt-1 w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-3 py-2 text-sm"
                  value={draft.homeBasedStack?.deliveryRadiusMiles ?? ""}
                  onChange={(e) =>
                    setDraftPatch({
                      homeBasedStack: {
                        ...draft.homeBasedStack,
                        deliveryRadiusMiles: e.target.value === "" ? undefined : Number(e.target.value),
                      },
                    })
                  }
                />
              </div>
            </div>
          </section>
        ) : null}

        {/* K */}
        {(draft.cateringAvailable || draft.eventFoodService) && activeSectionId === "restaurantes-section-k" ? (
          <section id="restaurantes-section-k" className={stepPanel}>
            <SectionTitle>K · Catering y eventos</SectionTitle>
            <HelperText>
              Alcance de <strong className="text-[color:var(--lx-text-2)]">catering y comida para eventos</strong> — distinto
              de I (móvil) y de J (pickup hogareño). Aquí defines anticipación, dónde solicitar cotización y radio de servicio.
            </HelperText>
            <div className="mt-4 grid gap-3">
              <div>
                <FieldLabel optional>Tamaños de evento</FieldLabel>
                <HelperText>Qué tamaños de grupo puedes atender.</HelperText>
                <div className="mt-2 flex flex-wrap gap-2">
                  {RESTAURANTE_EVENT_SIZES.map((o) => (
                    <label key={o.key} className="inline-flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={(draft.cateringEventsStack?.eventSizesSupported ?? []).includes(o.key)}
                        onChange={() => {
                          const cur = draft.cateringEventsStack?.eventSizesSupported ?? [];
                          const next = cur.includes(o.key) ? cur.filter((x) => x !== o.key) : [...cur, o.key];
                          setDraftPatch({
                            cateringEventsStack: { ...draft.cateringEventsStack, eventSizesSupported: next },
                          });
                        }}
                      />
                      {o.labelEs}
                    </label>
                  ))}
                </div>
              </div>
              {(
                [
                  ["bookingLeadTimeText", "Anticipación de reserva"],
                  ["cateringInquiryUrl", "URL de solicitud"],
                  ["cateringNote", "Nota"],
                ] as const
              ).map(([k, lab]) => (
                <div key={k}>
                  <FieldLabel optional>{lab}</FieldLabel>
                  {k === "bookingLeadTimeText" ? (
                    <HelperText>Con cuánta anticipación deben contactarte (ej. «mín. 2 semanas»).</HelperText>
                  ) : k === "cateringInquiryUrl" ? (
                    <HelperText>Formulario o página donde el cliente pide presupuesto.</HelperText>
                  ) : (
                    <HelperText>Nota visible en el bloque de catering/eventos.</HelperText>
                  )}
                  <input
                    className="mt-1 w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-3 py-2 text-sm"
                    value={(draft.cateringEventsStack?.[k] as string | undefined) ?? ""}
                    onChange={(e) =>
                      setDraftPatch({
                        cateringEventsStack: { ...draft.cateringEventsStack, [k]: e.target.value || undefined },
                      })
                    }
                  />
                </div>
              ))}
              <div>
                <FieldLabel optional>Radio de servicio (millas)</FieldLabel>
                <HelperText>Distancia aproximada donde ofreces catering o servicio en sitio.</HelperText>
                <input
                  type="number"
                  min={0}
                  className="mt-1 w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-3 py-2 text-sm"
                  value={draft.cateringEventsStack?.serviceRadiusMiles ?? ""}
                  onChange={(e) =>
                    setDraftPatch({
                      cateringEventsStack: {
                        ...draft.cateringEventsStack,
                        serviceRadiusMiles: e.target.value === "" ? undefined : Number(e.target.value),
                      },
                    })
                  }
                />
              </div>
            </div>
          </section>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[color:var(--lx-nav-border)] pt-6">
          <button
            type="button"
            className="rounded-xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] px-4 py-2.5 text-sm font-semibold text-[color:var(--lx-text)] transition hover:bg-[color:var(--lx-nav-hover)] disabled:cursor-not-allowed disabled:opacity-40"
            disabled={activeStepIndex <= 0}
            onClick={() => {
              const prev = sectionNavItems[activeStepIndex - 1];
              if (prev) setActiveSectionId(prev.id);
            }}
          >
            Atrás
          </button>
          <button
            type="button"
            className="rounded-xl border border-[color:var(--lx-gold-border)] bg-[color:var(--lx-section)] px-4 py-2.5 text-sm font-semibold text-[color:var(--lx-text)] shadow-sm transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-40"
            disabled={activeStepIndex >= sectionNavItems.length - 1}
            onClick={() => {
              const next = sectionNavItems[activeStepIndex + 1];
              if (next) setActiveSectionId(next.id);
            }}
          >
            Siguiente
          </button>
        </div>

        <div className="mt-4 space-y-4 border-t border-[color:var(--lx-nav-border)] pt-8">
          <ClasificadosApplicationTopActions
            onPreviewValidated={goPreview}
            openPreviewHref={PREVIEW_HREF}
            onDeleteApplication={resetDraft}
            disableValidatedPreview={!serviceOk}
          />
          <p className="text-xs text-[color:var(--lx-muted)] sm:max-w-xl">
            {serviceOk ? (
              <span className="font-medium text-emerald-800">Modos de servicio (B): listos — «Vista previa» puede abrir.</span>
            ) : (
              <span>
                <span className="font-semibold text-amber-900">Modos de servicio (B): pendiente.</span> Elige al menos uno para
                «Vista previa» con validación; «Abrir vista previa» sigue disponible sin validación.
              </span>
            )}
          </p>
        </div>
        </div>
      </div>
    </div>
  );
}
