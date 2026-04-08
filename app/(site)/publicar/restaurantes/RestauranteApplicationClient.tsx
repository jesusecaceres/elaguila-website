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
import { RestauranteApplicationSectionNav, scrollToRestauranteSection } from "./RestauranteApplicationSectionNav";

const PREVIEW_HREF = "/clasificados/restaurantes/preview";

const CARD =
  "rounded-[20px] border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] p-5 shadow-[0_8px_32px_-8px_rgba(42,36,22,0.1)] sm:p-6";

/** Anchor offset for sticky mobile bar + nav */
const SECTION_SCROLL = "scroll-mt-24 lg:scroll-mt-28";
const sectionSurface = `${CARD} ${SECTION_SCROLL}`;

/** Stacks I / J / K — visually dominant vs. canonical service modes + channel rows below */
const PRIMARY_OP_CARD =
  "flex h-full flex-col rounded-2xl border-2 border-[color:var(--lx-gold-border)]/70 bg-gradient-to-b from-[color:var(--lx-section)] to-[color:var(--lx-card)] p-5 shadow-[0_8px_28px_-10px_rgba(42,36,22,0.18)] ring-2 ring-[color:var(--lx-gold-border)]/25";

/** Secondary fulfillment toggles — lighter visual weight */
const SECONDARY_CHANNEL_CLUSTER =
  "rounded-2xl border border-dashed border-[color:var(--lx-nav-border)]/90 bg-[color:var(--lx-section)]/40 p-4";

const OTHER_INPUT =
  "mt-1.5 w-full max-w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-3 py-2 text-sm text-[color:var(--lx-text)]";

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

export default function RestauranteApplicationClient() {
  const { hydrated, draft, draftRef, setDraftPatch, resetDraft } = useRestauranteDraft();
  const [serviceErr, setServiceErr] = useState(false);
  /** Display names for last picked files (draft stores data URLs only). */
  const [uploadLabels, setUploadLabels] = useState<Record<string, string>>({});

  const minPreviewOk = useMemo(() => satisfiesRestauranteMinimumValidPreview(draft), [draft]);
  const serviceOk = useMemo(() => satisfiesRestauranteServiceModes(draft.serviceModes), [draft.serviceModes]);

  const setDay = useCallback(
    (key: keyof RestauranteListingDraft, sched: RestauranteDaySchedule) => {
      setDraftPatch({ [key]: sched } as Partial<RestauranteListingDraft>);
    },
    [setDraftPatch]
  );

  const goPreview = useCallback(() => {
    if (!satisfiesRestauranteServiceModes(draft.serviceModes)) {
      setServiceErr(true);
      requestAnimationFrame(() => {
        scrollToRestauranteSection("restaurantes-section-b");
      });
      return;
    }
    setServiceErr(false);
    window.location.href = PREVIEW_HREF;
  }, [draft.serviceModes]);

  const sectionNavItems = useMemo(() => buildRestauranteApplicationSectionNavItems(draft), [draft]);

  const [activeSectionId, setActiveSectionId] = useState("restaurantes-section-a");

  useEffect(() => {
    setActiveSectionId((prev) => {
      const ids = sectionNavItems.map((s) => s.id);
      if (ids.includes(prev)) return prev;
      return ids[0] ?? prev;
    });
  }, [sectionNavItems]);

  useEffect(() => {
    const update = () => {
      if (!sectionNavItems.length) return;
      const mid = window.scrollY + window.innerHeight * 0.2;
      let best = sectionNavItems[0].id;
      for (const s of sectionNavItems) {
        const el = document.getElementById(s.id);
        if (!el) continue;
        const top = el.getBoundingClientRect().top + window.scrollY;
        if (top <= mid + 80) best = s.id;
      }
      setActiveSectionId(best);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update, { passive: true });
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [sectionNavItems]);

  const toggleHighlight = useCallback(
    (key: string) => {
      const cur = draft.highlights ?? [];
      const next = cur.includes(key) ? cur.filter((k) => k !== key) : [...cur, key];
      setDraftPatch({ highlights: next });
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

        <div className="min-w-0 flex flex-col gap-8">
        {/* A */}
        <section id="restaurantes-section-a" className={sectionSurface}>
          <SectionTitle>A · Identidad del negocio</SectionTitle>
          <div className="mt-4 grid gap-4">
            <div>
              <FieldLabel required>Nombre del negocio</FieldLabel>
              <input
                className="mt-1 w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-3 py-2 text-sm"
                value={draft.businessName}
                onChange={(e) => setDraftPatch({ businessName: e.target.value })}
              />
            </div>
            <div>
              <FieldLabel required>Tipo de negocio</FieldLabel>
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
              <p className="mt-1 text-xs text-[color:var(--lx-muted)]">Misma lista que arriba; desplázate si hay muchas opciones.</p>
              <div className="mt-2 max-h-52 overflow-y-auto rounded-xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-section)]/60 p-3">
                <div className="flex flex-wrap gap-2">
                  {RESTAURANTE_CUISINES.map((o) => (
                    <label key={o.key} className="inline-flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={(draft.additionalCuisines ?? []).includes(o.key)}
                        onChange={() => {
                          const cur = draft.additionalCuisines ?? [];
                          const next = cur.includes(o.key) ? cur.filter((k) => k !== o.key) : [...cur, o.key];
                          const patch: Partial<RestauranteListingDraft> = { additionalCuisines: next };
                          if (o.key === TAXONOMY_KEY_OTHER && cur.includes(o.key) && !next.includes(o.key)) {
                            patch.additionalCuisineOtherCustom = undefined;
                          }
                          setDraftPatch(patch);
                        }}
                      />
                      {o.labelEs}
                    </label>
                  ))}
                </div>
              </div>
              {(draft.additionalCuisines ?? []).includes(TAXONOMY_KEY_OTHER) ? (
                <div className="mt-3">
                  <FieldLabel optional>Especifica “Otra” en cocinas adicionales</FieldLabel>
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
              <textarea
                className="mt-1 min-h-[88px] w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-3 py-2 text-sm"
                value={draft.shortSummary}
                onChange={(e) => setDraftPatch({ shortSummary: e.target.value })}
              />
            </div>
            <div>
              <FieldLabel optional>Descripción larga</FieldLabel>
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
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <FieldLabel optional>Barrio / zona</FieldLabel>
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
              <div className="mt-2 flex flex-wrap gap-2">
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

        {/* B */}
        <section id="restaurantes-section-b" className={sectionSurface}>
          <SectionTitle>B · Modelo de operación</SectionTitle>
          <p className="mt-2 text-xs text-[color:var(--lx-text-2)]">
            <span className="font-semibold text-red-600">*</span> Al menos un <strong>modo de servicio</strong> (abajo) para
            el botón «Vista previa» con validación.
          </p>
          <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-[color:var(--lx-muted)]">
            Interruptores principales (stacks I · J · K)
          </p>
          <p className="mt-1 text-sm leading-relaxed text-[color:var(--lx-text-2)]">
            Estos tres bloques van primero: cada uno puede abrir un apartado extra del formulario (no sustituyen los modos
            de servicio de más abajo).
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
            <p className="text-sm font-semibold text-[color:var(--lx-text)]">Lista operativa y modos de servicio</p>
            <p className="mt-2 text-sm text-[color:var(--lx-muted)]">
              Selecciona al menos un{" "}
              <strong className="font-semibold text-[color:var(--lx-text-2)]">modo de servicio</strong> en la lista
              canónica (obligatorio para la vista previa con el botón principal). Las casillas de canal complementan el
              modelo.
            </p>
            <div className="mt-3 rounded-xl border border-[color:var(--lx-gold-border)]/35 bg-[color:var(--lx-nav-hover)]/40 px-4 py-3 text-xs leading-relaxed text-[color:var(--lx-text-2)]">
              <strong className="text-[color:var(--lx-text)]">Nota:</strong> lo de arriba solo controla si ves las secciones{" "}
              <strong>I</strong> (móvil), <strong>J</strong> (desde casa) y <strong>K</strong> (catering/eventos). Todo lo
              siguiente es independiente y se puede combinar.
            </div>
          </div>

          <p className="mt-6 text-sm font-semibold text-[color:var(--lx-text)]">
            Modos de servicio (lista canónica) <span className="text-red-600">*</span>
          </p>
          <p className="mt-1 text-xs text-[color:var(--lx-muted)]">
            Obligatorio: al menos una opción para usar el botón «Vista previa».
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

          <p className="mt-8 text-sm font-semibold text-[color:var(--lx-text)]">Canal y opciones de servicio</p>
          <p className="mt-1 text-xs text-[color:var(--lx-muted)]">
            Complementa el modelo: local, entrega, reservas, food truck, pop-up, chef, etc. (peso visual menor que los
            interruptores de arriba).
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

        {/* C */}
        <section id="restaurantes-section-c" className={sectionSurface}>
          <SectionTitle>C · Horarios</SectionTitle>
          <p className="mt-2 text-xs text-[color:var(--lx-text-2)]">
            <span className="font-semibold text-red-600">*</span> Completa cada día (cerrado u horario) o usa nota especial /
            temporal abajo — necesario para la vista previa estructural.
          </p>
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
              <input
                className="mt-1 w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-3 py-2 text-sm"
                value={draft.specialHoursNote ?? ""}
                onChange={(e) => setDraftPatch({ specialHoursNote: e.target.value || undefined })}
              />
            </div>
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={Boolean(draft.temporaryHoursActive)}
                onChange={(e) => setDraftPatch({ temporaryHoursActive: e.target.checked })}
              />
              Horario temporal activo
            </label>
            <div>
              <FieldLabel optional>Nota de horario temporal</FieldLabel>
              <textarea
                className="mt-1 min-h-[72px] w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-3 py-2 text-sm"
                value={draft.temporaryHoursNote ?? ""}
                onChange={(e) => setDraftPatch({ temporaryHoursNote: e.target.value || undefined })}
              />
            </div>
          </div>
        </section>

        {/* D */}
        <section id="restaurantes-section-d" className={sectionSurface}>
          <SectionTitle>D · Contacto y CTAs</SectionTitle>
          <p className="mt-2 text-sm text-[color:var(--lx-muted)]">
            <span className="text-red-600">*</span> Al menos una vía de contacto (sitio, teléfono, correo, redes, menú/archivo,
            etc.) para la vista previa mínima.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {(
              [
                ["websiteUrl", "Sitio web"],
                ["phoneNumber", "Teléfono"],
                ["email", "Correo"],
                ["whatsAppNumber", "WhatsApp (número)"],
                ["instagramUrl", "Instagram (URL)"],
                ["facebookUrl", "Facebook (URL)"],
                ["tiktokUrl", "TikTok (URL)"],
                ["youtubeUrl", "YouTube (URL)"],
                ["reservationUrl", "Reservas (URL)"],
                ["orderUrl", "Pedidos (URL)"],
                ["menuUrl", "Menú (URL)"],
                ["verUbicacionUrl", "Ver ubicación (URL maps)"],
              ] as const
            ).map(([key, lab]) => (
              <div key={key} className={key === "websiteUrl" ? "sm:col-span-2" : ""}>
                <FieldLabel optional>{lab}</FieldLabel>
                <input
                  className="mt-1 w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-3 py-2 text-sm"
                  placeholder={RESTAURANTE_CONTACT_PLACEHOLDERS[key] ?? undefined}
                  value={(draft[key] as string | undefined) ?? ""}
                  onChange={(e) => setDraftPatch({ [key]: e.target.value || undefined } as Partial<RestauranteListingDraft>)}
                />
              </div>
            ))}
            <div className="sm:col-span-2">
              <FieldLabel optional>Menú (archivo — vista previa local)</FieldLabel>
              <RestauranteUploadRow
                buttonLabel="Subir archivo"
                helperText="PDF o imagen. Se usa solo en tu navegador para la vista previa."
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
            <label className="inline-flex items-center gap-2 text-sm sm:col-span-2">
              <input
                type="checkbox"
                checked={Boolean(draft.allowMessageCTA)}
                onChange={(e) => setDraftPatch({ allowMessageCTA: e.target.checked })}
              />
              Mostrar CTA de mensaje (SMS) cuando haya teléfono
            </label>
          </div>
        </section>

        {/* E */}
        <section id="restaurantes-section-e" className={sectionSurface}>
          <SectionTitle>E · Ubicación y privacidad</SectionTitle>
          <div className="mt-4 grid gap-3">
            <div>
              <FieldLabel optional>Dirección línea 1</FieldLabel>
              <input
                className="mt-1 w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-3 py-2 text-sm"
                value={draft.addressLine1 ?? ""}
                onChange={(e) => setDraftPatch({ addressLine1: e.target.value || undefined })}
              />
            </div>
            <div>
              <FieldLabel optional>Dirección línea 2</FieldLabel>
              <input
                className="mt-1 w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-3 py-2 text-sm"
                value={draft.addressLine2 ?? ""}
                onChange={(e) => setDraftPatch({ addressLine2: e.target.value || undefined })}
              />
            </div>
            <div>
              <FieldLabel optional>Estado</FieldLabel>
              <input
                className="mt-1 w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-3 py-2 text-sm"
                value={draft.state ?? ""}
                onChange={(e) => setDraftPatch({ state: e.target.value || undefined })}
              />
            </div>
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={Boolean(draft.showExactAddress)}
                onChange={(e) => setDraftPatch({ showExactAddress: e.target.checked })}
              />
              Mostrar dirección exacta cuando aplique
            </label>
            <div>
              <FieldLabel optional>Área de servicio (texto)</FieldLabel>
              <input
                className="mt-1 w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-3 py-2 text-sm"
                value={draft.serviceAreaText ?? ""}
                onChange={(e) => setDraftPatch({ serviceAreaText: e.target.value || undefined })}
              />
            </div>
            <div>
              <FieldLabel optional>Radio de entrega (millas)</FieldLabel>
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

        {/* F */}
        <section id="restaurantes-section-f" className={sectionSurface}>
          <SectionTitle>F · Platos destacados (máx. 4)</SectionTitle>
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
                    <input
                      className="mt-1 w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-3 py-2 text-sm"
                      value={dish.title}
                      onChange={(e) => patchFeatured(i, { title: e.target.value })}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <FieldLabel>Nota corta</FieldLabel>
                    <textarea
                      className="mt-1 min-h-[64px] w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-3 py-2 text-sm"
                      value={dish.shortNote}
                      onChange={(e) => patchFeatured(i, { shortNote: e.target.value })}
                    />
                  </div>
                  <div>
                    <FieldLabel optional>Precio / etiqueta</FieldLabel>
                    <input
                      className="mt-1 w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-3 py-2 text-sm"
                      value={dish.priceLabel ?? ""}
                      onChange={(e) => patchFeatured(i, { priceLabel: e.target.value || undefined })}
                    />
                  </div>
                  <div>
                    <FieldLabel optional>Enlace al menú</FieldLabel>
                    <input
                      className="mt-1 w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-3 py-2 text-sm"
                      placeholder={RESTAURANTE_CONTACT_PLACEHOLDERS.menuUrl}
                      value={dish.menuLink ?? ""}
                      onChange={(e) => patchFeatured(i, { menuLink: e.target.value || undefined })}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <FieldLabel>Imagen</FieldLabel>
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

        {/* G */}
        <section id="restaurantes-section-g" className={sectionSurface}>
          <SectionTitle>G · Galería y medios</SectionTitle>
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
                  <div className="relative mt-3 w-full max-w-lg overflow-hidden rounded-2xl border-2 border-[color:var(--lx-gold-border)] bg-[color:var(--lx-section)] shadow-sm">
                    <div className="relative aspect-[16/9] min-h-[160px] w-full">
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
              <p className="mt-1 text-xs text-[color:var(--lx-muted)]">
                Opcional. Si pegas un enlace, se borra cualquier video local para evitar duplicados; la vista previa usa
                primero el archivo local cuando existe.
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

        {/* H */}
        <section id="restaurantes-section-h" className={sectionSurface}>
          <SectionTitle>H · Destacados del lugar</SectionTitle>
          <p className="mt-2 text-sm text-[color:var(--lx-muted)]">En la vista previa se muestran hasta 6 en el shell.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {RESTAURANTE_HIGHLIGHTS.map((o) => (
              <label
                key={o.key}
                className="inline-flex items-center gap-2 rounded-full border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-section)] px-3 py-1.5 text-sm"
              >
                <input
                  type="checkbox"
                  checked={(draft.highlights ?? []).includes(o.key)}
                  onChange={() => toggleHighlight(o.key)}
                />
                {o.labelEs}
              </label>
            ))}
          </div>
        </section>

        {/* I */}
        {draft.movingVendor ? (
          <section id="restaurantes-section-i" className={sectionSurface}>
            <SectionTitle>I · Ubicación móvil</SectionTitle>
            <div className="mt-4 grid gap-3">
              {(
                [
                  ["currentLocationText", "Ubicación actual"],
                  ["currentLocationUrl", "URL ubicación"],
                  ["todayHoursText", "Horario de hoy"],
                  ["nextStopText", "Próxima parada"],
                  ["nextStopTime", "Hora próxima parada"],
                  ["weeklyRouteText", "Ruta semanal"],
                  ["notifyCopy", "Texto de avisos"],
                ] as const
              ).map(([k, lab]) => (
                <div key={k}>
                  <FieldLabel optional>{lab}</FieldLabel>
                  <input
                    className="mt-1 w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-3 py-2 text-sm"
                    value={(draft.movingVendorStack?.[k] as string | undefined) ?? ""}
                    onChange={(e) =>
                      setDraftPatch({
                        movingVendorStack: { ...draft.movingVendorStack, [k]: e.target.value || undefined },
                      })
                    }
                  />
                </div>
              ))}
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={Boolean(draft.movingVendorStack?.activeNow)}
                  onChange={(e) =>
                    setDraftPatch({
                      movingVendorStack: { ...draft.movingVendorStack, activeNow: e.target.checked },
                    })
                  }
                />
                Activo ahora
              </label>
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={Boolean(draft.movingVendorStack?.allowFollowNotify)}
                  onChange={(e) =>
                    setDraftPatch({
                      movingVendorStack: { ...draft.movingVendorStack, allowFollowNotify: e.target.checked },
                    })
                  }
                />
                Permitir seguimiento / avisos (solo UI por ahora)
              </label>
            </div>
          </section>
        ) : null}

        {/* J */}
        {draft.homeBasedBusiness ? (
          <section id="restaurantes-section-j" className={sectionSurface}>
            <SectionTitle>J · Negocio desde casa</SectionTitle>
            <div className="mt-4 grid gap-3">
              <div>
                <FieldLabel optional>Instrucciones de recogida</FieldLabel>
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
        {draft.cateringAvailable || draft.eventFoodService ? (
          <section id="restaurantes-section-k" className={sectionSurface}>
            <SectionTitle>K · Catering y eventos</SectionTitle>
            <div className="mt-4 grid gap-3">
              <div>
                <FieldLabel optional>Tamaños de evento</FieldLabel>
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

        {/* L */}
        <section id="restaurantes-section-l" className={sectionSurface}>
          <SectionTitle>L · Confianza y reputación en Leonix</SectionTitle>
          <p className="mt-2 text-sm leading-relaxed text-[color:var(--lx-muted)]">
            Aquí refuerzas la <strong className="font-medium text-[color:var(--lx-text-2)]">confianza</strong> dentro del
            anuncio: resumen de reputación, testimonio y, si quieres, un resumen asistido. Los enlaces a otras plataformas
            son <strong className="font-medium text-[color:var(--lx-text-2)]">opcionales</strong> — no son el centro de la
            experiencia; sirven como respaldo si ya tienes presencia allá.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <FieldLabel optional>Enlace a reseñas (Google u otro) — opcional</FieldLabel>
              <input
                className="mt-1 w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-3 py-2 text-sm"
                placeholder={RESTAURANTE_CONTACT_PLACEHOLDERS.googleReviewUrl}
                value={draft.googleReviewUrl ?? ""}
                onChange={(e) => setDraftPatch({ googleReviewUrl: e.target.value || undefined })}
              />
            </div>
            <div className="sm:col-span-2">
              <FieldLabel optional>Otro enlace de prueba social — opcional</FieldLabel>
              <input
                className="mt-1 w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-3 py-2 text-sm"
                placeholder={RESTAURANTE_CONTACT_PLACEHOLDERS.yelpReviewUrl}
                value={draft.yelpReviewUrl ?? ""}
                onChange={(e) => setDraftPatch({ yelpReviewUrl: e.target.value || undefined })}
              />
            </div>
            <div>
              <FieldLabel optional>Resumen de calificación (0–5)</FieldLabel>
              <p className="mt-0.5 text-xs text-[color:var(--lx-muted)]">Si publicas una nota agregada, sin sustituir reseñas nativas de Leonix.</p>
              <input
                type="number"
                step="0.1"
                min={0}
                max={5}
                className="mt-1 w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-3 py-2 text-sm"
                value={draft.externalRatingValue ?? ""}
                onChange={(e) =>
                  setDraftPatch({
                    externalRatingValue: e.target.value === "" ? undefined : Number(e.target.value),
                  })
                }
              />
            </div>
            <div>
              <FieldLabel optional>Cantidad de opiniones (referencia)</FieldLabel>
              <input
                type="number"
                min={0}
                className="mt-1 w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-3 py-2 text-sm"
                value={draft.externalReviewCount ?? ""}
                onChange={(e) =>
                  setDraftPatch({
                    externalReviewCount: e.target.value === "" ? undefined : Number(e.target.value),
                  })
                }
              />
            </div>
            <div className="sm:col-span-2">
              <FieldLabel optional>Testimonio o frase de cliente</FieldLabel>
              <textarea
                className="mt-1 min-h-[72px] w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-3 py-2 text-sm"
                value={draft.testimonialSnippet ?? ""}
                onChange={(e) => setDraftPatch({ testimonialSnippet: e.target.value || undefined })}
              />
            </div>
            <label className="flex cursor-pointer items-start gap-2 text-sm sm:col-span-2">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 rounded border-[color:var(--lx-nav-border)]"
                checked={Boolean(draft.aiSummaryEnabled)}
                onChange={(e) => setDraftPatch({ aiSummaryEnabled: e.target.checked })}
              />
              <span>
                <span className="font-semibold text-[color:var(--lx-text)]">Resumen corto asistido (opcional)</span>
                <span className="mt-0.5 block text-xs text-[color:var(--lx-muted)]">
                  Puede ayudar a sintetizar tu reputación para el anuncio en Leonix cuando haya datos o enlaces útiles.
                </span>
              </span>
            </label>
          </div>
        </section>

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
