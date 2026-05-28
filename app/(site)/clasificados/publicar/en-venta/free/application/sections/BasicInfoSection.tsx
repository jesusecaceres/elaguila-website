"use client";

import { useEnVentaDetailField } from "@/app/clasificados/en-venta/publish/EnVentaDetailFieldCopyContext";
import SectionShell from "@/app/clasificados/en-venta/shared/components/SectionShell";
import type { EnVentaFreeApplicationState } from "../schema/enVentaFreeFormState";
import type { EnVentaFreeSectionProps } from "../types/sectionProps";
import { cx, inputClass, labelClass } from "../helpers/fieldCx";
import { formatPriceInputDisplay, normalizePriceForState } from "../helpers/priceInput";

const COPY = {
  es: {
    title: "Información básica",
    desc: "Un buen título y descripción generan más contactos.",
    titleL: "Título del anuncio",
    titleH: "Escribe un título claro para que tu artículo se entienda rápido.",
    priceMode: "Precio",
    priceMoney: "Precio",
    amountLabel: "Precio del artículo (Monto)",
    amountH: "Escribe el precio aquí con el símbolo $. No uses el campo Cantidad para el precio.",
    priceFree: "Gratis",
    priceH: "Con «Precio», ingresa el monto en dólares. Con «Gratis», el anuncio es sin costo.",
    freeHint: "Marcado como gratis. No hace falta ingresar monto.",
    neg: "Precio negociable",
    qty: "Cantidad (opcional)",
    qtyH: "Cuántas unidades vendes (ej. 2 sillas). No es el precio.",
    brand: "Marca (opcional)",
    model: "Modelo (opcional)",
    descL: "Descripción",
    descH: "Qué es el artículo, por qué comprarlo y qué incluye la venta en general (no repitas solo condición física; eso va en la sección siguiente).",
    titlePublishHint: "Agrega un título para tu artículo.",
    pricePublishHint: "Agrega el precio del artículo.",
  },
  en: {
    title: "Basic item info",
    desc: "Clear title and description drive more replies.",
    titleL: "Listing title",
    titleH: "Use a clear title so buyers understand instantly.",
    priceMode: "Price",
    priceMoney: "Set a price",
    amountLabel: "Item price (Amount)",
    amountH: "Enter the price here with $. Do not use the Quantity field for price.",
    priceFree: "Free",
    priceH: "Choose “Set a price” for money, or “Free” when you’re giving it away.",
    freeHint: "Marked as free. No amount needed.",
    neg: "Negotiable price",
    qty: "Quantity (optional)",
    qtyH: "How many units you’re selling (e.g. 2 chairs). This is not the price.",
    brand: "Brand (optional)",
    model: "Model (optional)",
    descL: "Description",
    descH: "What it is, why buy it, and what’s included overall (save wear/defects for the next section).",
    titlePublishHint: "Add a title for your item.",
    pricePublishHint: "Add the item price.",
  },
} as const;

const modeBtn =
  "flex-1 rounded-xl border px-3 py-2.5 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-[#A98C2A]/35";
const modeActive = "border-[#A98C2A]/60 bg-[#111111] text-[#F5F5F5]";
const modeIdle = "border-black/15 bg-white text-[#111111] hover:bg-[#F5F5F5]";

export function BasicInfoSection<S extends EnVentaFreeApplicationState>({
  lang,
  state,
  setState,
}: EnVentaFreeSectionProps<S>) {
  const t = COPY[lang];
  const ovNeg = useEnVentaDetailField("negotiable");
  const ovBrand = useEnVentaDetailField("brand");
  const ovModel = useEnVentaDetailField("model");
  const money = !state.priceIsFree;
  const priceMissing = money && !String(state.price).trim();

  return (
    <SectionShell lang={lang} title={t.title} description={t.desc}>
      <div>
        <label className={labelClass}>{t.titleL}</label>
        <p className="mt-1 text-xs text-[#111111]/60">{t.titleH}</p>
        <input
          className={`${inputClass} mt-2`}
          value={state.title}
          onChange={(e) => setState((s) => ({ ...s, title: e.target.value }))}
        />
        <p className="mt-2 text-xs font-medium text-[#111111]/55">{t.titlePublishHint}</p>
      </div>

      <div>
        <label className={labelClass}>{t.priceMode}</label>
        <p className="mt-1 text-xs text-[#111111]/60">{t.priceH}</p>
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            className={cx(modeBtn, money ? modeActive : modeIdle)}
            onClick={() =>
              setState((s) => ({
                ...s,
                priceIsFree: false,
              }))
            }
          >
            {t.priceMoney}
          </button>
          <button
            type="button"
            className={cx(modeBtn, !money ? modeActive : modeIdle)}
            onClick={() =>
              setState((s) => ({
                ...s,
                priceIsFree: true,
                price: "",
                negotiable: "",
              }))
            }
          >
            {t.priceFree}
          </button>
        </div>
      </div>

      {money ? (
        <div className="space-y-4">
          <div>
            <label className={labelClass}>{t.amountLabel}</label>
            <p className="mt-1 text-xs font-medium text-[#111111]/70">{t.amountH}</p>
            <div
              className={cx(
                "mt-2 flex overflow-hidden rounded-xl border bg-white focus-within:ring-2 focus-within:ring-[#A98C2A]/35",
                priceMissing ? "border-red-400 ring-1 ring-red-400/30" : "border-black/15"
              )}
            >
              <span
                className="flex shrink-0 items-center border-r border-black/10 bg-[#F3F3F3] px-3 text-base font-bold text-[#111111]"
                aria-hidden
              >
                $
              </span>
              <input
                className="min-w-0 flex-1 border-0 bg-transparent px-3 py-3 text-base font-semibold text-[#111111] outline-none placeholder:text-[#111111]/40 placeholder:font-normal"
                inputMode="decimal"
                autoComplete="off"
                value={formatPriceInputDisplay(state.price)}
                onChange={(e) =>
                  setState((s) => ({ ...s, price: normalizePriceForState(e.target.value) }))
                }
                placeholder={lang === "es" ? "Ej: 120" : "e.g. 120"}
                aria-label={t.amountLabel}
                aria-invalid={priceMissing}
              />
            </div>
            {priceMissing ? (
              <p className="mt-2 text-xs font-semibold text-red-800" role="alert">
                {t.pricePublishHint}
              </p>
            ) : null}
          </div>
          <div>
            <label className={labelClass}>{ovNeg?.label ?? t.neg}</label>
            {ovNeg?.help ? <p className="mt-1 text-xs text-[#111111]/60">{ovNeg.help}</p> : null}
            <select
              className={`${inputClass} mt-2`}
              value={state.negotiable}
              onChange={(e) =>
                setState((s) => ({ ...s, negotiable: e.target.value as "" | "yes" }))
              }
            >
              <option value="">{lang === "es" ? "No" : "No"}</option>
              <option value="yes">{lang === "es" ? "Sí" : "Yes"}</option>
            </select>
          </div>
        </div>
      ) : (
        <p className="mt-2 rounded-xl border border-black/10 bg-[#FAFAFA] px-3 py-2.5 text-sm text-[#111111]/85">
          {t.freeHint}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>{ovBrand?.label ?? t.brand}</label>
          {ovBrand?.help ? <p className="mt-1 text-xs text-[#111111]/60">{ovBrand.help}</p> : null}
          <input
            className={`${inputClass} mt-2`}
            value={state.brand}
            onChange={(e) => setState((s) => ({ ...s, brand: e.target.value }))}
            placeholder={ovBrand?.placeholder}
          />
        </div>
        <div>
          <label className={labelClass}>{ovModel?.label ?? t.model}</label>
          {ovModel?.help ? <p className="mt-1 text-xs text-[#111111]/60">{ovModel.help}</p> : null}
          <input
            className={`${inputClass} mt-2`}
            value={state.model}
            onChange={(e) => setState((s) => ({ ...s, model: e.target.value }))}
            placeholder={ovModel?.placeholder}
          />
        </div>
      </div>

      <div className="rounded-xl border border-dashed border-black/12 bg-[#FAFAFA] px-3 py-3">
        <label className={labelClass}>{t.qty}</label>
        <p className="mt-1 text-xs text-[#111111]/60">{t.qtyH}</p>
        <input
          className={`${inputClass} mt-2 max-w-[12rem]`}
          inputMode="numeric"
          value={state.quantity}
          onChange={(e) => setState((s) => ({ ...s, quantity: e.target.value.replace(/\D/g, "") }))}
          placeholder={lang === "es" ? "Ej: 2" : "e.g. 2"}
        />
      </div>

      <div>
        <label className={labelClass}>{t.descL}</label>
        <p className="mt-1 text-xs text-[#111111]/60">{t.descH}</p>
        <textarea
          className={`${inputClass} mt-2 min-h-[120px]`}
          value={state.description}
          onChange={(e) => setState((s) => ({ ...s, description: e.target.value }))}
        />
      </div>
    </SectionShell>
  );
}
