"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import CityAutocomplete from "@/app/components/CityAutocomplete";
import type { RestauranteListingDraft } from "@/app/clasificados/restaurantes/application/restauranteDraftTypes";
import type { RestauranteDaySchedule, RestauranteFeaturedDish, RestauranteServiceMode } from "@/app/clasificados/restaurantes/application/restauranteListingApplicationModel";
import {
  RESTAURANTE_BUSINESS_TYPES,
  RESTAURANTE_CUISINES,
  RESTAURANTE_EVENT_SIZES,
  RESTAURANTE_HIGHLIGHTS,
  RESTAURANTE_LANGUAGES,
  RESTAURANTE_LOCATION_PRIVACY,
  RESTAURANTE_PICKUP_DAYS,
  RESTAURANTE_PRICE_LEVELS,
  RESTAURANTE_SERVICE_MODES,
} from "@/app/clasificados/restaurantes/application/restauranteTaxonomy";
import { useRestauranteDraft } from "@/app/clasificados/restaurantes/application/useRestauranteDraft";
import { satisfiesRestauranteMinimumValidPreview, satisfiesRestauranteServiceModes } from "@/app/clasificados/restaurantes/application/restauranteListingApplicationModel";
import { readFileAsDataUrl } from "@/app/publicar/autos/negocios/lib/readFileAsDataUrl";

const PREVIEW_HREF = "/clasificados/restaurantes/preview";

const CARD =
  "rounded-[20px] border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] p-5 shadow-[0_8px_32px_-8px_rgba(42,36,22,0.1)] sm:p-6";

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

function FieldLabel({ children, optional }: { children: React.ReactNode; optional?: boolean }) {
  return (
    <label className="block text-sm font-semibold text-[color:var(--lx-text-2)]">
      {children}
      {optional ? <span className="ml-1 font-normal text-[color:var(--lx-muted)]">(opcional)</span> : null}
    </label>
  );
}

export default function RestauranteApplicationClient() {
  const { hydrated, draft, setDraftPatch, resetDraft } = useRestauranteDraft();
  const [serviceErr, setServiceErr] = useState(false);

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
      return;
    }
    setServiceErr(false);
    window.location.href = PREVIEW_HREF;
  }, [draft.serviceModes]);

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
      setDraftPatch({ languagesSpoken: next });
    },
    [draft.languagesSpoken, setDraftPatch]
  );

  const toggleServiceMode = useCallback(
    (mode: RestauranteServiceMode) => {
      const cur = draft.serviceModes ?? [];
      const next = cur.includes(mode) ? cur.filter((m) => m !== mode) : [...cur, mode];
      setDraftPatch({ serviceModes: next });
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
    <div className="mx-auto max-w-3xl px-4 py-8 pb-24 sm:py-10">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--lx-muted)]">Leonix Clasificados</p>
        <h1 className="mt-2 text-2xl font-bold text-[color:var(--lx-text)] sm:text-3xl">Publicar restaurante</h1>
        <p className="mt-3 text-sm leading-relaxed text-[color:var(--lx-text-2)]">
          Los campos completados aparecerán en la vista previa. Los campos vacíos no se mostrarán al comprador.
        </p>
        <p className="mt-2 text-xs text-[color:var(--lx-muted)]">
          Borrador guardado en este navegador (clave <code className="rounded bg-[color:var(--lx-section)] px-1">restaurantes-draft</code>
          ).
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={goPreview}
          className="rounded-full bg-[color:var(--lx-cta-dark)] px-5 py-2.5 text-sm font-semibold text-[color:var(--lx-cta-light)] hover:bg-[color:var(--lx-cta-dark-hover)]"
        >
          Vista previa
        </button>
        <Link
          href={PREVIEW_HREF}
          className="inline-flex items-center rounded-full border border-[color:var(--lx-nav-border)] px-5 py-2.5 text-sm font-semibold text-[color:var(--lx-text)] hover:bg-[color:var(--lx-nav-hover)]"
        >
          Abrir vista previa
        </Link>
        <button
          type="button"
          onClick={() => {
            if (confirm("¿Borrar todo el borrador y empezar de nuevo?")) resetDraft();
          }}
          className="rounded-full border border-red-200 bg-red-50 px-5 py-2.5 text-sm font-semibold text-red-900 hover:bg-red-100"
        >
          Reiniciar borrador
        </button>
      </div>

      {serviceErr ? (
        <p className="mt-3 text-sm font-medium text-red-700">Selecciona al menos un modo de servicio (sección B).</p>
      ) : null}
      {!minPreviewOk ? (
        <p className="mt-2 text-sm text-[color:var(--lx-muted)]">
          Para una vista previa publicable completa: nombre, tipo, cocina, resumen, ciudad, foto principal, al menos un
          contacto y señal de horario.
        </p>
      ) : null}

      <div className="mt-10 flex flex-col gap-8">
        {/* A */}
        <section className={CARD}>
          <SectionTitle>A · Identidad del negocio</SectionTitle>
          <div className="mt-4 grid gap-4">
            <div>
              <FieldLabel>Nombre del negocio</FieldLabel>
              <input
                className="mt-1 w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-3 py-2 text-sm"
                value={draft.businessName}
                onChange={(e) => setDraftPatch({ businessName: e.target.value })}
              />
            </div>
            <div>
              <FieldLabel>Tipo de negocio</FieldLabel>
              <select
                className="mt-1 w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-3 py-2 text-sm"
                value={draft.businessType}
                onChange={(e) => setDraftPatch({ businessType: e.target.value })}
              >
                <option value="">Seleccionar…</option>
                {RESTAURANTE_BUSINESS_TYPES.map((o) => (
                  <option key={o.key} value={o.key}>
                    {o.labelEs}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <FieldLabel>Cocina principal</FieldLabel>
                <select
                  className="mt-1 w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-3 py-2 text-sm"
                  value={draft.primaryCuisine}
                  onChange={(e) => setDraftPatch({ primaryCuisine: e.target.value })}
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
                  onChange={(e) => setDraftPatch({ secondaryCuisine: e.target.value || undefined })}
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
            <div>
              <FieldLabel optional>Cocinas adicionales</FieldLabel>
              <div className="mt-2 flex flex-wrap gap-2">
                {RESTAURANTE_CUISINES.map((o) => (
                  <label key={o.key} className="inline-flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={(draft.additionalCuisines ?? []).includes(o.key)}
                      onChange={() => {
                        const cur = draft.additionalCuisines ?? [];
                        const next = cur.includes(o.key) ? cur.filter((k) => k !== o.key) : [...cur, o.key];
                        setDraftPatch({ additionalCuisines: next });
                      }}
                    />
                    {o.labelEs}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <FieldLabel>Resumen corto</FieldLabel>
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
              label="Ciudad (canónica NorCal)"
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
            </div>
          </div>
        </section>

        {/* B */}
        <section className={CARD}>
          <SectionTitle>B · Modelo de operación</SectionTitle>
          <p className="mt-2 text-sm text-[color:var(--lx-muted)]">Selecciona al menos un modo de servicio.</p>
          <div className="mt-4 flex flex-wrap gap-2">
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
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {(
              [
                ["dineIn", "Comer en local"],
                ["takeout", "Para llevar"],
                ["delivery", "Entrega"],
                ["reservationsAvailable", "Reservas"],
                ["cateringAvailable", "Catering"],
                ["preorderRequired", "Preorden obligatoria"],
                ["pickupAvailable", "Recogida"],
                ["homeBasedBusiness", "Desde casa"],
                ["movingVendor", "Ubicación móvil"],
                ["foodTruck", "Food truck"],
                ["popUp", "Pop-up"],
                ["personalChef", "Chef personal"],
                ["eventFoodService", "Comida para eventos"],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={Boolean(draft[key])}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    const patch: Partial<RestauranteListingDraft> = { [key]: checked };
                    if (key === "movingVendor" && checked) patch.movingVendorStack = { ...draft.movingVendorStack };
                    if (key === "homeBasedBusiness" && checked) patch.homeBasedStack = { ...draft.homeBasedStack };
                    if ((key === "cateringAvailable" || key === "eventFoodService") && checked) {
                      patch.cateringEventsStack = { ...draft.cateringEventsStack };
                    }
                    setDraftPatch(patch);
                  }}
                />
                {label}
              </label>
            ))}
          </div>
        </section>

        {/* C */}
        <section className={CARD}>
          <SectionTitle>C · Horarios</SectionTitle>
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
        <section className={CARD}>
          <SectionTitle>D · Contacto y CTAs</SectionTitle>
          <p className="mt-2 text-sm text-[color:var(--lx-muted)]">Al menos una vía de contacto para la vista previa mínima.</p>
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
                  value={(draft[key] as string | undefined) ?? ""}
                  onChange={(e) => setDraftPatch({ [key]: e.target.value || undefined } as Partial<RestauranteListingDraft>)}
                />
              </div>
            ))}
            <div className="sm:col-span-2">
              <FieldLabel optional>Menú (archivo — vista previa local)</FieldLabel>
              <input
                type="file"
                accept="image/*,application/pdf"
                className="mt-1 text-sm"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (!f) {
                    setDraftPatch({ menuFile: undefined });
                    return;
                  }
                  const data = await readFileAsDataUrl(f);
                  setDraftPatch({ menuFile: data });
                }}
              />
            </div>
            <div className="sm:col-span-2">
              <FieldLabel optional>Folleto (archivo)</FieldLabel>
              <input
                type="file"
                accept="image/*,application/pdf"
                className="mt-1 text-sm"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (!f) {
                    setDraftPatch({ brochureFile: undefined });
                    return;
                  }
                  const data = await readFileAsDataUrl(f);
                  setDraftPatch({ brochureFile: data });
                }}
              />
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
        <section className={CARD}>
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
        <section className={CARD}>
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
                      value={dish.menuLink ?? ""}
                      onChange={(e) => patchFeatured(i, { menuLink: e.target.value || undefined })}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <FieldLabel>Imagen</FieldLabel>
                    <input
                      type="file"
                      accept="image/*"
                      className="mt-1 text-sm"
                      onChange={async (e) => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        patchFeatured(i, { image: await readFileAsDataUrl(f) });
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
        <section className={CARD}>
          <SectionTitle>G · Galería y medios</SectionTitle>
          <div className="mt-4 grid gap-4">
            <div>
              <FieldLabel>Foto principal (hero)</FieldLabel>
              <input
                type="file"
                accept="image/*"
                className="mt-1 text-sm"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (!f) {
                    setDraftPatch({ heroImage: "" });
                    return;
                  }
                  setDraftPatch({ heroImage: await readFileAsDataUrl(f) });
                }}
              />
              {draft.heroImage ? (
                <div className="relative mt-2 aspect-[16/9] w-full max-w-lg overflow-hidden rounded-xl border">
                  <Image src={draft.heroImage} alt="" fill className="object-cover" unoptimized />
                </div>
              ) : null}
            </div>
            <div>
              <FieldLabel optional>Galería general (reordenar con botones)</FieldLabel>
              <input
                type="file"
                multiple
                accept="image/*"
                className="mt-1 text-sm"
                onChange={async (e) => {
                  const files = Array.from(e.target.files ?? []);
                  const urls: string[] = [];
                  for (const f of files) urls.push(await readFileAsDataUrl(f));
                  const next = [...(draft.galleryImages ?? []), ...urls];
                  setDraftPatch({ galleryImages: next, galleryOrder: next.map((_, i) => String(i)) });
                }}
              />
              <ul className="mt-3 space-y-2">
                {(draft.galleryImages ?? []).map((url, i) => (
                  <li key={`${i}-${url.slice(0, 24)}`} className="flex items-center gap-2 rounded-lg border p-2">
                    <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded">
                      <Image src={url} alt="" fill className="object-cover" unoptimized />
                    </div>
                    <button
                      type="button"
                      className="text-xs font-semibold text-[color:var(--lx-text-2)] disabled:opacity-30"
                      disabled={i === 0}
                      onClick={() => {
                        const imgs = [...(draft.galleryImages ?? [])];
                        [imgs[i - 1], imgs[i]] = [imgs[i], imgs[i - 1]];
                        setDraftPatch({ galleryImages: imgs, galleryOrder: imgs.map((_, j) => String(j)) });
                      }}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className="text-xs font-semibold text-[color:var(--lx-text-2)] disabled:opacity-30"
                      disabled={i === (draft.galleryImages ?? []).length - 1}
                      onClick={() => {
                        const imgs = [...(draft.galleryImages ?? [])];
                        [imgs[i + 1], imgs[i]] = [imgs[i], imgs[i + 1]];
                        setDraftPatch({ galleryImages: imgs, galleryOrder: imgs.map((_, j) => String(j)) });
                      }}
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      className="ml-auto text-xs text-red-700 underline"
                      onClick={() => {
                        const imgs = [...(draft.galleryImages ?? [])];
                        imgs.splice(i, 1);
                        setDraftPatch({ galleryImages: imgs, galleryOrder: imgs.map((_, j) => String(j)) });
                      }}
                    >
                      Quitar
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {(
                [
                  ["interiorImages", "Interiores"] as const,
                  ["foodImages", "Comida"] as const,
                  ["exteriorImages", "Exteriores"] as const,
                ] as const
              ).map(([field, lab]) => (
                <div key={field}>
                  <FieldLabel optional>{lab}</FieldLabel>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    className="mt-1 text-sm"
                    onChange={async (e) => {
                      const files = Array.from(e.target.files ?? []);
                      const urls: string[] = [];
                      for (const f of files) urls.push(await readFileAsDataUrl(f));
                      const cur = (draft[field] as string[] | undefined) ?? [];
                      setDraftPatch({ [field]: [...cur, ...urls] } as Partial<RestauranteListingDraft>);
                    }}
                  />
                </div>
              ))}
            </div>
            <div>
              <FieldLabel optional>Video (archivo)</FieldLabel>
              <input
                type="file"
                accept="video/*"
                className="mt-1 text-sm"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (!f) {
                    setDraftPatch({ videoFile: undefined });
                    return;
                  }
                  setDraftPatch({ videoFile: await readFileAsDataUrl(f) });
                }}
              />
            </div>
            <div>
              <FieldLabel optional>Video (URL)</FieldLabel>
              <input
                className="mt-1 w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-3 py-2 text-sm"
                value={draft.videoUrl ?? ""}
                onChange={(e) => setDraftPatch({ videoUrl: e.target.value || undefined })}
              />
            </div>
          </div>
        </section>

        {/* H */}
        <section className={CARD}>
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
          <section className={CARD}>
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
          <section className={CARD}>
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
          <section className={CARD}>
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
        <section className={CARD}>
          <SectionTitle>L · Confianza externa</SectionTitle>
          <p className="mt-2 text-sm text-[color:var(--lx-muted)]">Enlaces y datos externos; Leonix no muestra reseñas nativas aquí.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <FieldLabel optional>Google Reviews (URL)</FieldLabel>
              <input
                className="mt-1 w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-3 py-2 text-sm"
                value={draft.googleReviewUrl ?? ""}
                onChange={(e) => setDraftPatch({ googleReviewUrl: e.target.value || undefined })}
              />
            </div>
            <div className="sm:col-span-2">
              <FieldLabel optional>Yelp (URL)</FieldLabel>
              <input
                className="mt-1 w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-3 py-2 text-sm"
                value={draft.yelpReviewUrl ?? ""}
                onChange={(e) => setDraftPatch({ yelpReviewUrl: e.target.value || undefined })}
              />
            </div>
            <div>
              <FieldLabel optional>Calificación externa (0–5)</FieldLabel>
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
              <FieldLabel optional>Número de reseñas externas</FieldLabel>
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
              <FieldLabel optional>Testimonio breve</FieldLabel>
              <textarea
                className="mt-1 min-h-[72px] w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-3 py-2 text-sm"
                value={draft.testimonialSnippet ?? ""}
                onChange={(e) => setDraftPatch({ testimonialSnippet: e.target.value || undefined })}
              />
            </div>
            <label className="inline-flex items-center gap-2 text-sm sm:col-span-2">
              <input
                type="checkbox"
                checked={Boolean(draft.aiSummaryEnabled)}
                onChange={(e) => setDraftPatch({ aiSummaryEnabled: e.target.checked })}
              />
              Permitir resumen de confianza (IA) cuando haya enlaces externos
            </label>
          </div>
        </section>
      </div>

      <div className="mt-12 flex flex-wrap gap-3 border-t border-[color:var(--lx-nav-border)] pt-8">
        <button
          type="button"
          onClick={goPreview}
          className="rounded-full bg-[color:var(--lx-gold)] px-5 py-2.5 text-sm font-semibold text-[color:var(--lx-text)]"
        >
          Vista previa
        </button>
        <span className="self-center text-xs text-[color:var(--lx-muted)]">
          Modo de servicio: {serviceOk ? "OK" : "falta elegir al menos uno"}
        </span>
      </div>
    </div>
  );
}
