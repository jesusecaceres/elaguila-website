"use client";

import type { BusinessIdentityCopy } from "../../_components/businessIdentityCopy";
import type { PrimaryLanguage } from "@/app/lib/business/types";

export function Step1SetupLanguage({
  t,
  purpose,
  privacyShort,
  legend,
  value,
  onSelect,
}: {
  t: BusinessIdentityCopy["wizard"]["step1"];
  purpose: BusinessIdentityCopy["wizard"]["purpose"];
  privacyShort: BusinessIdentityCopy["wizard"]["privacyShort"];
  legend: string;
  value: PrimaryLanguage;
  onSelect: (lang: PrimaryLanguage) => void;
}) {
  return (
    <div className="space-y-5">
      <h2 className="text-lg font-bold text-[#1E1810]">{t.title}</h2>
      <p className="text-sm text-[#5C5346]">{t.lead}</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2" role="radiogroup" aria-label={t.title}>
        {(["es", "en"] as const).map((option) => (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={value === option}
            onClick={() => onSelect(option)}
            className={`min-h-[64px] rounded-2xl border-2 px-5 py-4 text-left text-base font-bold transition ${
              value === option ? "border-[#C9A84A] bg-[#FBF7EF] text-[#1E1810]" : "border-[#E8DFD0] bg-white text-[#3D3428] hover:bg-[#FAF7F2]"
            }`}
          >
            {option === "es" ? t.esOption : t.enOption}
          </button>
        ))}
      </div>
      {!value ? <p className="text-xs text-[#7A7164]">{t.continueHint}</p> : null}

      <section className="rounded-2xl border border-[#E8DFD0] bg-[#FAF7F2]/60 p-4">
        <h3 className="text-sm font-bold text-[#1E1810]">{purpose.title}</h3>
        {purpose.body.split("\n\n").map((para) => (
          <p key={para} className="mt-2 text-sm text-[#5C5346]">
            {para}
          </p>
        ))}
        <ul className="mt-3 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
          {purpose.benefits.map((b) => (
            <li key={b} className="flex gap-2 text-xs text-[#5C5346]">
              <span aria-hidden="true">·</span>
              {b}
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-dashed border-[#D6C7AD] bg-[#FBF7EF]/60 p-4">
        <h3 className="text-sm font-bold text-[#1E1810]">{privacyShort.title}</h3>
        <p className="mt-1.5 text-xs text-[#5C5346]">{privacyShort.body}</p>
      </section>

      <p className="text-xs italic text-[#7A7164]">{legend}</p>
    </div>
  );
}
