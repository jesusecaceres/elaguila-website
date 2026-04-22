"use client";

import type { Lang } from "../../types/tienda";
import type { PrintUploadDocument } from "../../product-configurators/print-upload/types";
import type { PrintUploadProductConfig } from "../../product-configurators/print-upload/types";
import type { PrintUploadAction } from "../../product-configurators/print-upload/printUploadReducer";
import { PRINT_UPLOAD_MIN_PPI_PROXY } from "../../product-configurators/print-upload/constants";
import { puPick, printUploadBuilderCopy } from "../../data/printUploadBuilderCopy";

function optLabel(lang: Lang, o: { labelEs: string; labelEn: string }) {
  return lang === "en" ? o.labelEn : o.labelEs;
}

export function PrintUploadSpecPanel(props: {
  lang: Lang;
  cfg: PrintUploadProductConfig;
  doc: PrintUploadDocument;
  dispatch: (a: PrintUploadAction) => void;
}) {
  const { lang, cfg, doc, dispatch } = props;
  const specs = doc.specs;
  const selectedSize = cfg.sizes.find((s) => s.id === specs.sizeId);

  const selectCls =
    "mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-[color:var(--lx-text)]";

  return (
    <section className="rounded-2xl border border-[rgba(201,180,106,0.28)] bg-[linear-gradient(180deg,rgba(255,252,247,0.98),rgba(251,247,239,0.94))] p-5 sm:p-6 space-y-4">
      <h2 className="text-lg font-semibold text-[color:var(--lx-text)]">{puPick(printUploadBuilderCopy.specPanel, lang)}</h2>

      <div>
        <label className="text-xs font-semibold text-[color:rgba(61,52,40,0.75)]">
          {puPick(printUploadBuilderCopy.quantity, lang)}
        </label>
        <select
          className={selectCls}
          value={specs.quantity}
          onChange={(e) => dispatch({ type: "SET_SPECS", patch: { quantity: Number(e.target.value) } })}
        >
          {cfg.quantities.map((q) => (
            <option key={q} value={q}>
              {q}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-xs font-semibold text-[color:rgba(61,52,40,0.75)]">
          {puPick(printUploadBuilderCopy.size, lang)}
        </label>
        <select
          className={selectCls}
          value={specs.sizeId}
          onChange={(e) => dispatch({ type: "SET_SPECS", patch: { sizeId: e.target.value } })}
        >
          {cfg.sizes.map((s) => (
            <option key={s.id} value={s.id}>
              {optLabel(lang, s)}
            </option>
          ))}
        </select>
        {selectedSize ? (
          <p className="mt-2 rounded-lg border border-black/8 bg-white/60 px-3 py-2 text-[11px] leading-relaxed text-[color:rgba(61,52,40,0.78)]">
            {lang === "en" ? "Nominal trim" : "Tamaño nominal"}: {selectedSize.widthIn} in × {selectedSize.heightIn} in ·{" "}
            {lang === "en" ? "suggested minimum for bitmaps" : "mínimo sugerido (imagen)"} ~
            {Math.round(selectedSize.widthIn * PRINT_UPLOAD_MIN_PPI_PROXY)}×
            {Math.round(selectedSize.heightIn * PRINT_UPLOAD_MIN_PPI_PROXY)} px ({PRINT_UPLOAD_MIN_PPI_PROXY}{" "}
            {lang === "en" ? "ppi rule of thumb" : "ppi aprox."})
          </p>
        ) : null}
      </div>

      <div>
        <label className="text-xs font-semibold text-[color:rgba(61,52,40,0.75)]">
          {puPick(printUploadBuilderCopy.stock, lang)}
        </label>
        <select
          className={selectCls}
          value={specs.stockId}
          onChange={(e) => dispatch({ type: "SET_SPECS", patch: { stockId: e.target.value } })}
        >
          {cfg.stocks.map((s) => (
            <option key={s.id} value={s.id}>
              {optLabel(lang, s)}
            </option>
          ))}
        </select>
      </div>

      {cfg.sides.length > 1 ? (
        <div>
          <label className="text-xs font-semibold text-[color:rgba(61,52,40,0.75)]">
            {puPick(printUploadBuilderCopy.sidedness, lang)}
          </label>
          <select
            className={selectCls}
            value={specs.sidesId}
            onChange={(e) => dispatch({ type: "SET_SPECS", patch: { sidesId: e.target.value } })}
          >
            {cfg.sides.map((s) => (
              <option key={s.id} value={s.id}>
                {optLabel(lang, s)}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <div className="text-xs text-[color:rgba(61,52,40,0.65)]">
          <span className="font-semibold">{puPick(printUploadBuilderCopy.sidedness, lang)}:</span>{" "}
          {optLabel(lang, cfg.sides[0])}
        </div>
      )}

      {cfg.folds?.length ? (
        <div>
          <label className="text-xs font-semibold text-[color:rgba(61,52,40,0.75)]">
            {puPick(printUploadBuilderCopy.fold, lang)}
          </label>
          <select
            className={selectCls}
            value={specs.foldId ?? cfg.folds[0].id}
            onChange={(e) => dispatch({ type: "SET_SPECS", patch: { foldId: e.target.value } })}
          >
            {cfg.folds.map((s) => (
              <option key={s.id} value={s.id}>
                {optLabel(lang, s)}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {cfg.materials?.length ? (
        <div>
          <label className="text-xs font-semibold text-[color:rgba(61,52,40,0.75)]">
            {puPick(printUploadBuilderCopy.material, lang)}
          </label>
          <select
            className={selectCls}
            value={specs.materialId ?? cfg.materials[0].id}
            onChange={(e) => dispatch({ type: "SET_SPECS", patch: { materialId: e.target.value } })}
          >
            {cfg.materials.map((s) => (
              <option key={s.id} value={s.id}>
                {optLabel(lang, s)}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {cfg.finishes?.length ? (
        <div>
          <label className="text-xs font-semibold text-[color:rgba(61,52,40,0.75)]">
            {puPick(printUploadBuilderCopy.finish, lang)}
          </label>
          <select
            className={selectCls}
            value={specs.finishId ?? cfg.finishes[0].id}
            onChange={(e) => dispatch({ type: "SET_SPECS", patch: { finishId: e.target.value } })}
          >
            {cfg.finishes.map((s) => (
              <option key={s.id} value={s.id}>
                {optLabel(lang, s)}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {cfg.shapes?.length ? (
        <div>
          <label className="text-xs font-semibold text-[color:rgba(61,52,40,0.75)]">
            {puPick(printUploadBuilderCopy.shape, lang)}
          </label>
          <select
            className={selectCls}
            value={specs.shapeId ?? cfg.shapes[0].id}
            onChange={(e) => dispatch({ type: "SET_SPECS", patch: { shapeId: e.target.value } })}
          >
            {cfg.shapes.map((s) => (
              <option key={s.id} value={s.id}>
                {optLabel(lang, s)}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <p className="text-xs text-[color:rgba(61,52,40,0.6)] pt-1">
        {lang === "en" ? cfg.specSimplificationNote.en : cfg.specSimplificationNote.es}
      </p>
    </section>
  );
}
