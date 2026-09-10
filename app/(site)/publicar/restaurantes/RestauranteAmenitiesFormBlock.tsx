"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import type { RestauranteListingDraft } from "@/app/clasificados/restaurantes/application/restauranteDraftTypes";
import type { RestauranteDraftPatch } from "@/app/clasificados/restaurantes/application/useRestauranteDraft";
import { RestaurantePublishChipMarker } from "@/app/clasificados/restaurantes/components/RestaurantePublishChipMarker";
import {
  getRestauranteAmenityGroupMeta,
  RESTAURANTE_AMENITY_GROUP_ORDER,
  type RestauranteAmenityGroupId,
  sanitizeRestauranteAmenities,
  sanitizeCustomRestauranteAmenitiesByGroup,
  evaluateAddCustomRestauranteAmenityOptionForGroup,
  CUSTOM_RESTAURANTE_AMENITY_LABEL_MAX,
  MAX_CUSTOM_RESTAURANTE_AMENITY_OPTIONS_PER_GROUP,
} from "@/app/(site)/clasificados/restaurantes/lib/restauranteAmenitiesCatalog";
import { clasificadosPreviewPublishCopy } from "@/app/lib/clasificados/clasificadosUiChromeCopy";
import { AddedConfirmationBadge } from "@/app/components/forms/AddedConfirmation";
import type { RestauranteAppUiLang } from "./restauranteApplicationUiCopy";

function FieldLabel({
  children,
  optional,
  lang,
}: {
  children: ReactNode;
  optional?: boolean;
  lang: RestauranteAppUiLang;
}) {
  const optionalLabel = clasificadosPreviewPublishCopy(lang).optional;
  return (
    <div className="text-sm font-semibold text-[color:var(--lx-text)]">
      {children}
      {optional ? <span className="ml-1 text-xs font-normal text-[color:var(--lx-muted)]">{optionalLabel}</span> : null}
    </div>
  );
}

function HelperText({ children }: { children: ReactNode }) {
  return <p className="mt-1 text-xs leading-relaxed text-[color:var(--lx-muted)] sm:max-w-3xl">{children}</p>;
}

export function RestauranteAmenitiesFormBlock({
  draft,
  setDraftPatch,
  lang,
}: {
  draft: RestauranteListingDraft;
  setDraftPatch: (patch: RestauranteDraftPatch) => void;
  lang: RestauranteAppUiLang;
}) {
  const cur = sanitizeRestauranteAmenities(draft.restaurantAmenities) ?? {};
  const curCustom = sanitizeCustomRestauranteAmenitiesByGroup(draft.customRestaurantAmenitiesByGroup);

  /** Pending "Otro" text per group before the owner confirms with Añadir — local, like the
   * sibling `RestauranteExternalVideoUrlsSection`'s own `draftUrl` state, since this whole block
   * unmounts/remounts when the owner navigates away from Section J and back. */
  const [pendingByGroup, setPendingByGroup] = useState<Record<string, string>>({});
  /** Momentary "✓ Añadido" confirmation per group (owner UX doctrine: INPUT -> ACCEPTED -> PERSISTED). */
  const [confirmVisibleByGroup, setConfirmVisibleByGroup] = useState<Record<string, boolean>>({});
  const confirmTimersRef = useRef<Record<string, number>>({});

  useEffect(() => {
    const timers = confirmTimersRef.current;
    return () => {
      Object.values(timers).forEach((t) => window.clearTimeout(t));
    };
  }, []);

  const flashGroupAdded = (group: RestauranteAmenityGroupId) => {
    setConfirmVisibleByGroup((prev) => ({ ...prev, [group]: true }));
    const existing = confirmTimersRef.current[group];
    if (existing != null) window.clearTimeout(existing);
    confirmTimersRef.current[group] = window.setTimeout(() => {
      setConfirmVisibleByGroup((prev) => ({ ...prev, [group]: false }));
    }, 2200);
  };

  const addCustomAmenity = (group: RestauranteAmenityGroupId) => {
    const pending = pendingByGroup[group] ?? "";
    const bucket = curCustom[group] ?? [];
    const result = evaluateAddCustomRestauranteAmenityOptionForGroup(bucket, pending);
    if (!result.ok) return;
    setDraftPatch({
      customRestaurantAmenitiesByGroup: { ...curCustom, [group]: [...bucket, result.label] },
    });
    setPendingByGroup((prev) => ({ ...prev, [group]: "" }));
    flashGroupAdded(group);
  };

  const removeCustomAmenity = (group: RestauranteAmenityGroupId, index: number) => {
    const bucket = curCustom[group] ?? [];
    setDraftPatch({
      customRestaurantAmenitiesByGroup: { ...curCustom, [group]: bucket.filter((_, i) => i !== index) },
    });
  };

  const toggle = (group: RestauranteAmenityGroupId, id: string) => {
    setDraftPatch((prev) => {
      const base = sanitizeRestauranteAmenities(prev.restaurantAmenities) ?? {};
      const list = [...(base[group] ?? [])];
      const i = list.indexOf(id);
      if (i >= 0) list.splice(i, 1);
      else list.push(id);
      const next = { ...base, [group]: list };
      const cleaned = sanitizeRestauranteAmenities(next);
      return { restaurantAmenities: cleaned };
    });
  };

  const blockTitle = lang === "en" ? "Amenities & more" : "Amenidades y más";
  const blockHelper =
    lang === "en"
      ? "Optional. Payments, service, accessibility, atmosphere, amenities, and food options. Shown on the listing only when you select at least one."
      : "Opcional. Pagos, servicio, accesibilidad, ambiente, comodidades y opciones de comida. Solo aparece en la ficha si eliges al menos una opción.";

  return (
    <div className="mt-4 space-y-8">
      <div>
        <FieldLabel optional lang={lang}>
          {blockTitle}
        </FieldLabel>
        <HelperText>{blockHelper}</HelperText>
      </div>

      {RESTAURANTE_AMENITY_GROUP_ORDER.map((group) => {
        const meta = getRestauranteAmenityGroupMeta(group);
        const selected = new Set(cur[group] ?? []);
        const groupTitle = lang === "en" ? meta.titleEn : meta.titleEs;
        return (
          <div
            key={group}
            className="rounded-xl border border-[color:var(--lx-nav-border)]/70 bg-[color:var(--lx-section)]/40 p-4 sm:p-5"
          >
            <h3 className="text-sm font-bold uppercase tracking-wide text-[color:var(--lx-text-2)]">{groupTitle}</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {meta.items.map((item) => {
                const checked = selected.has(item.id);
                const itemLabel = lang === "en" ? item.labelEn : item.labelEs;
                return (
                  <label
                    key={item.id}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] px-3 py-1.5 text-sm text-[color:var(--lx-text)] shadow-sm transition hover:border-[color:var(--lx-gold-border)]/60"
                  >
                    <input
                      type="checkbox"
                      className="mt-0.5 shrink-0"
                      checked={checked}
                      onChange={() => toggle(group, item.id)}
                    />
                    <RestaurantePublishChipMarker leading={item.leading} compact />
                    <span className="min-w-0">{itemLabel}</span>
                  </label>
                );
              })}
            </div>

            <div className="mt-3">
              {(curCustom[group] ?? []).length > 0 ? (
                <div className="mb-2 flex flex-wrap gap-2">
                  {(curCustom[group] ?? []).map((label, i) => (
                    <button
                      key={`${group}-custom-${i}-${label}`}
                      type="button"
                      title={label}
                      aria-label={`${lang === "en" ? "Remove" : "Quitar"}: ${label}`}
                      onClick={() => removeCustomAmenity(group, i)}
                      className="inline-flex max-w-full min-w-0 items-center gap-1.5 rounded-full border border-[color:var(--lx-gold-border)] bg-[color:var(--lx-card)] px-3 py-1.5 text-left text-sm font-medium text-[color:var(--lx-text)]"
                    >
                      <span className="min-w-0 truncate">{label}</span>
                      <span aria-hidden="true" className="shrink-0 opacity-70">
                        ×
                      </span>
                    </button>
                  ))}
                </div>
              ) : null}

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <input
                  className="w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-3 py-2 text-sm sm:max-w-xs"
                  placeholder={lang === "en" ? "Other (type your own)" : "Otro (escribe el tuyo)"}
                  maxLength={CUSTOM_RESTAURANTE_AMENITY_LABEL_MAX}
                  value={pendingByGroup[group] ?? ""}
                  onChange={(e) => {
                    const v = e.target.value.slice(0, CUSTOM_RESTAURANTE_AMENITY_LABEL_MAX);
                    setPendingByGroup((prev) => ({ ...prev, [group]: v }));
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addCustomAmenity(group);
                    }
                  }}
                />
                <button
                  type="button"
                  disabled={
                    !(pendingByGroup[group] ?? "").trim() ||
                    (curCustom[group]?.length ?? 0) >= MAX_CUSTOM_RESTAURANTE_AMENITY_OPTIONS_PER_GROUP
                  }
                  onClick={() => addCustomAmenity(group)}
                  className="shrink-0 rounded-xl border border-[color:var(--lx-gold-border)] bg-[color:var(--lx-section)] px-4 py-2 text-sm font-semibold text-[color:var(--lx-text)] transition hover:bg-[color:var(--lx-nav-hover)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {lang === "en" ? "Add" : "Añadir"}
                </button>
                <AddedConfirmationBadge
                  visible={Boolean(confirmVisibleByGroup[group])}
                  label={lang === "en" ? "Added" : "Añadido"}
                />
              </div>

              {(curCustom[group]?.length ?? 0) >= MAX_CUSTOM_RESTAURANTE_AMENITY_OPTIONS_PER_GROUP ? (
                <p className="mt-1.5 text-xs text-amber-800">
                  {lang === "en"
                    ? "Maximum custom entries reached for this group."
                    : "Alcanzaste el máximo de entradas personalizadas para este grupo."}
                </p>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
