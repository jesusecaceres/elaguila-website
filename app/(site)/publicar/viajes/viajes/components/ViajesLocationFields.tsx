"use client";

import { useId } from "react";
import type { ViajesStructuredAddress } from "@/app/(site)/clasificados/viajes/lib/v2/viajesOfferModelV2";

const LABEL = "block text-xs font-bold uppercase tracking-[0.1em] text-[color:var(--lx-muted)]";
const INPUT =
  "mt-1 w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-[#FFFCF7] px-3 py-2 text-sm text-[color:var(--lx-text)] outline-none ring-[color:var(--lx-focus-ring)] focus:ring-2";
const CARD =
  "rounded-[20px] border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] p-4 shadow-[0_8px_28px_-12px_rgba(42,36,22,0.12)] sm:p-5";

type ViajesLocationFieldsProps = {
  value: ViajesStructuredAddress;
  onChange: (value: ViajesStructuredAddress) => void;
  title: string;
  privacyHint?: string;
  /** When true, showPublicly / showMap stay false and checkboxes are disabled. */
  privacyLocked?: boolean;
};

export function ViajesLocationFields({
  value,
  onChange,
  title,
  privacyHint,
  privacyLocked = false,
}: ViajesLocationFieldsProps) {
  const baseId = useId();
  const patch = (partial: Partial<ViajesStructuredAddress>) => {
    if (privacyLocked) {
      onChange({ ...value, ...partial, showPublicly: false, showMap: false });
      return;
    }
    onChange({ ...value, ...partial });
  };

  const field = (
    key: keyof ViajesStructuredAddress,
    label: string,
    opts?: { placeholder?: string; autoComplete?: string },
  ) => {
    const id = `${baseId}-${key}`;
    const val = value[key];
    if (typeof val !== "string") return null;
    return (
      <div>
        <label className={LABEL} htmlFor={id}>
          {label}
        </label>
        <input
          id={id}
          className={INPUT}
          value={val}
          autoComplete={opts?.autoComplete}
          placeholder={opts?.placeholder}
          onChange={(e) => patch({ [key]: e.target.value } as Partial<ViajesStructuredAddress>)}
        />
      </div>
    );
  };

  return (
    <section className={`${CARD} space-y-4`} aria-labelledby={`${baseId}-title`}>
      <div>
        <h3 id={`${baseId}-title`} className="text-sm font-bold text-[color:var(--lx-text)] sm:text-base">
          {title}
        </h3>
        {privacyHint ? <p className="mt-1 text-xs leading-relaxed text-[color:var(--lx-muted)]">{privacyHint}</p> : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {field("street", "Calle / dirección", { autoComplete: "street-address" })}
        {field("unit", "Unidad / apto", { placeholder: "Opcional" })}
        {field("city", "Ciudad", { autoComplete: "address-level2" })}
        {field("stateRegion", "Estado / región", { autoComplete: "address-level1" })}
        {field("postalCode", "Código postal", { autoComplete: "postal-code" })}
        {field("country", "País", { autoComplete: "country-name" })}
      </div>

      {field("publicLabel", "Etiqueta pública", {
        placeholder: "Ej. Centro de Cancún · Pickup hotel",
      })}

      <div className="flex flex-wrap gap-4 border-t border-[color:var(--lx-nav-border)] pt-3">
        <label
          htmlFor={`${baseId}-showPublic`}
          className={`flex items-center gap-2 text-sm text-[color:var(--lx-text-2)] ${privacyLocked ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}
        >
          <input
            id={`${baseId}-showPublic`}
            type="checkbox"
            className="h-4 w-4 rounded border-[color:var(--lx-nav-border)]"
            checked={privacyLocked ? false : value.showPublicly}
            disabled={privacyLocked}
            onChange={(e) => patch({ showPublicly: e.target.checked })}
          />
          Mostrar públicamente
        </label>
        <label
          htmlFor={`${baseId}-showMap`}
          className={`flex items-center gap-2 text-sm text-[color:var(--lx-text-2)] ${privacyLocked ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}
        >
          <input
            id={`${baseId}-showMap`}
            type="checkbox"
            className="h-4 w-4 rounded border-[color:var(--lx-nav-border)]"
            checked={privacyLocked ? false : value.showMap}
            disabled={privacyLocked}
            onChange={(e) => patch({ showMap: e.target.checked })}
          />
          Mostrar en mapa
        </label>
      </div>
    </section>
  );
}
