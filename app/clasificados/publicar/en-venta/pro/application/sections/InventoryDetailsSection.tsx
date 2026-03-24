"use client";

import SectionShell from "@/app/clasificados/en-venta/shared/components/SectionShell";
import type { EnVentaProApplicationState } from "../schema/enVentaProFormState";
import type { EnVentaFreeSectionProps } from "../../../free/application/types/sectionProps";
import { inputClass, labelClass } from "../../../free/application/helpers/fieldCx";

const COPY = {
  es: {
    title: "Inventario y referencias",
    desc: "SKU y existencias opcionales para vendedores recurrentes.",
    sku: "SKU (opcional)",
    ref: "Referencia interna (opcional)",
    qty: "Cantidad en inventario (opcional)",
  },
  en: {
    title: "Inventory & references",
    desc: "Optional SKU and stock for repeat sellers.",
    sku: "SKU (optional)",
    ref: "Internal reference (optional)",
    qty: "Inventory quantity (optional)",
  },
} as const;

export function InventoryDetailsSection({
  lang,
  state,
  setState,
}: EnVentaFreeSectionProps<EnVentaProApplicationState>) {
  const t = COPY[lang];
  return (
    <SectionShell lang={lang} title={t.title} description={t.desc}>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className={labelClass}>{t.sku}</label>
          <input
            className={`${inputClass} mt-2`}
            value={state.sku}
            onChange={(e) => setState((s) => ({ ...s, sku: e.target.value }))}
          />
        </div>
        <div>
          <label className={labelClass}>{t.ref}</label>
          <input
            className={`${inputClass} mt-2`}
            value={state.internalRef}
            onChange={(e) => setState((s) => ({ ...s, internalRef: e.target.value }))}
          />
        </div>
        <div>
          <label className={labelClass}>{t.qty}</label>
          <input
            className={`${inputClass} mt-2`}
            inputMode="numeric"
            value={state.inventoryQty}
            onChange={(e) => setState((s) => ({ ...s, inventoryQty: e.target.value }))}
          />
        </div>
      </div>
    </SectionShell>
  );
}
