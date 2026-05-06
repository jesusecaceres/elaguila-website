"use client";

import type { ReactNode } from "react";
import type { RestauranteListingDraft } from "@/app/clasificados/restaurantes/application/restauranteDraftTypes";
import type { RestauranteDraftPatch } from "@/app/clasificados/restaurantes/application/useRestauranteDraft";
import { RestaurantePublishChipMarker } from "@/app/clasificados/restaurantes/components/RestaurantePublishChipMarker";
import {
  getRestauranteAmenityGroupMeta,
  RESTAURANTE_AMENITY_GROUP_ORDER,
  type RestauranteAmenityGroupId,
  sanitizeRestauranteAmenities,
} from "@/app/clasificados/restaurantes/lib/restauranteAmenitiesCatalog";

function FieldLabel({ children, optional }: { children: ReactNode; optional?: boolean }) {
  return (
    <div className="text-sm font-semibold text-[color:var(--lx-text)]">
      {children}
      {optional ? <span className="ml-1 text-xs font-normal text-[color:var(--lx-muted)]">(opcional)</span> : null}
    </div>
  );
}

function HelperText({ children }: { children: ReactNode }) {
  return <p className="mt-1 text-xs leading-relaxed text-[color:var(--lx-muted)] sm:max-w-3xl">{children}</p>;
}

export function RestauranteAmenitiesFormBlock({
  draft,
  setDraftPatch,
}: {
  draft: RestauranteListingDraft;
  setDraftPatch: (patch: RestauranteDraftPatch) => void;
}) {
  const cur = sanitizeRestauranteAmenities(draft.restaurantAmenities) ?? {};

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

  return (
    <div className="mt-4 space-y-8">
      <div>
        <FieldLabel optional>Amenidades y más</FieldLabel>
        <HelperText>
          <span className="font-semibold text-[color:var(--lx-text-2)]">Amenities &amp; More</span> — opcional. Pagos,
          servicio, accesibilidad, ambiente, comodidades y opciones de comida. Solo aparece en la ficha si eliges al menos
          una opción.
        </HelperText>
      </div>

      {RESTAURANTE_AMENITY_GROUP_ORDER.map((group) => {
        const meta = getRestauranteAmenityGroupMeta(group);
        const selected = new Set(cur[group] ?? []);
        return (
          <div
            key={group}
            className="rounded-xl border border-[color:var(--lx-nav-border)]/70 bg-[color:var(--lx-section)]/40 p-4 sm:p-5"
          >
            <h3 className="text-sm font-bold uppercase tracking-wide text-[color:var(--lx-text-2)]">
              {meta.titleEs}
              <span className="ml-2 font-normal normal-case text-[color:var(--lx-muted)]">/ {meta.titleEn}</span>
            </h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {meta.items.map((item) => {
                const checked = selected.has(item.id);
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
                    <span className="min-w-0">{item.labelEs}</span>
                  </label>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
