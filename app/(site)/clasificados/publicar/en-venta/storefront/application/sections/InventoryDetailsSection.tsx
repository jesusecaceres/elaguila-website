"use client";

import SectionShell from "@/app/clasificados/en-venta/shared/components/SectionShell";
import type { EnVentaStorefrontApplicationState } from "../schema/enVentaStorefrontFormState";
import type { EnVentaFreeSectionProps } from "../../../free/application/types/sectionProps";
import { inputClass, labelClass } from "../../../free/application/helpers/fieldCx";

const COPY = {
  es: {
    title: "Inventario y referencias",
    desc: "SKU, referencias y notas internas son opcionales; ayudan si vendes seguido o con catálogo.",
    sku: "SKU (opcional)",
    skuH: "Si no usas SKU, déjalo en blanco.",
    ref: "Referencia interna (opcional)",
    refH: "Tu código interno o almacén — no tiene por qué ser público al comprador.",
    qty: "Cantidad en inventario (opcional)",
    qtyH: "Útil si manejas existencias o variantes.",
    notes: "Notas de inventario (opcional)",
    notesH: "Empaque múltiple, lotes, condiciones especiales de stock…",
    repeat: "Vendo con frecuencia como negocio en Leonix",
    repeatH: "Opcional — ayuda a contextualizar tu tienda; no es un ranking ni verificación.",
  },
  en: {
    title: "Inventory & references",
    desc: "SKU, refs, and notes are optional — they help repeat sellers and small shops.",
    sku: "SKU (optional)",
    skuH: "Leave blank if you don’t use SKUs.",
    ref: "Internal reference (optional)",
    refH: "Your internal code — doesn’t have to be buyer-facing.",
    qty: "Inventory quantity (optional)",
    qtyH: "Useful when you track stock or variants.",
    notes: "Inventory notes (optional)",
    notesH: "Multi-pack, lots, special stock conditions…",
    repeat: "I sell regularly as a business on Leonix",
    repeatH: "Optional — context for your shop; not a score or verification badge.",
  },
} as const;

export function InventoryDetailsSection({
  lang,
  state,
  setState,
}: EnVentaFreeSectionProps<EnVentaStorefrontApplicationState>) {
  const t = COPY[lang];
  return (
    <SectionShell lang={lang} title={t.title} description={t.desc}>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className={labelClass}>{t.sku}</label>
          <p className="mt-1 text-xs text-white/55">{t.skuH}</p>
          <input
            className={`${inputClass} mt-2`}
            value={state.sku}
            onChange={(e) => setState((s) => ({ ...s, sku: e.target.value }))}
          />
        </div>
        <div>
          <label className={labelClass}>{t.ref}</label>
          <p className="mt-1 text-xs text-white/55">{t.refH}</p>
          <input
            className={`${inputClass} mt-2`}
            value={state.internalRef}
            onChange={(e) => setState((s) => ({ ...s, internalRef: e.target.value }))}
          />
        </div>
        <div>
          <label className={labelClass}>{t.qty}</label>
          <p className="mt-1 text-xs text-white/55">{t.qtyH}</p>
          <input
            className={`${inputClass} mt-2`}
            inputMode="numeric"
            value={state.inventoryQty}
            onChange={(e) => setState((s) => ({ ...s, inventoryQty: e.target.value }))}
          />
        </div>
      </div>
      <div>
        <label className={labelClass}>{t.notes}</label>
        <p className="mt-1 text-xs text-white/55">{t.notesH}</p>
        <textarea
          className={`${inputClass} mt-2 min-h-[88px]`}
          value={state.inventoryNotes}
          onChange={(e) => setState((s) => ({ ...s, inventoryNotes: e.target.value }))}
        />
      </div>
      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/15 bg-white/5 p-3 text-sm text-white/90">
        <input
          type="checkbox"
          className="mt-1 shrink-0"
          checked={state.repeatSellerIndicator}
          onChange={(e) => setState((s) => ({ ...s, repeatSellerIndicator: e.target.checked }))}
        />
        <span>
          <span className="font-semibold">{t.repeat}</span>
          <span className="mt-1 block text-xs text-white/60">{t.repeatH}</span>
        </span>
      </label>
    </SectionShell>
  );
}
