"use client";

import type { Lang } from "../../types/tienda";
import type { PrintUploadValidationResult } from "../../product-configurators/print-upload/types";
import { puPick, printUploadBuilderCopy } from "../../data/printUploadBuilderCopy";

export function PrintUploadValidationPanel(props: { lang: Lang; result: PrintUploadValidationResult }) {
  const { lang, result } = props;
  const hard = result.items.filter((i) => i.severity === "hard");
  const soft = result.items.filter((i) => i.severity === "soft");

  return (
    <section className="rounded-2xl border border-[rgba(255,255,255,0.10)] bg-[rgba(255,255,255,0.04)] p-5">
      <h2 className="text-base font-semibold text-white">{puPick(printUploadBuilderCopy.validationTitle, lang)}</h2>
      {hard.length > 0 ? (
        <div className="mt-3">
          <div className="text-[11px] font-bold uppercase tracking-wide text-[rgba(255,160,160,0.9)]">
            {puPick(printUploadBuilderCopy.hardLabel, lang)}
          </div>
          <ul className="mt-2 space-y-1.5">
            {hard.map((i) => (
              <li key={i.id} className="text-sm text-[rgba(255,220,220,0.88)]">
                {lang === "en" ? i.messageEn : i.messageEs}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {soft.length > 0 ? (
        <div className={hard.length ? "mt-4" : "mt-3"}>
          <div className="text-[11px] font-bold uppercase tracking-wide text-[rgba(201,168,74,0.85)]">
            {puPick(printUploadBuilderCopy.softLabel, lang)}
          </div>
          <ul className="mt-2 space-y-1.5">
            {soft.map((i) => (
              <li key={i.id} className="text-sm text-[rgba(255,247,226,0.78)]">
                {lang === "en" ? i.messageEn : i.messageEs}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {hard.length === 0 && soft.length === 0 ? (
        <p className="mt-2 text-sm text-[rgba(255,255,255,0.62)]">
          {lang === "en" ? "No issues flagged. Keep reviewing your upload." : "Sin problemas marcados. Sigue revisando tu archivo."}
        </p>
      ) : null}
    </section>
  );
}
