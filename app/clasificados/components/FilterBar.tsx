"use client";

import { CategoryKey, categoryConfig } from "../config/categoryConfig";

export default function FilterBar({
  category,
  lang,
}: {
  category: CategoryKey;
  lang: "es" | "en";
}) {
  const cfg = categoryConfig[category];

  return (
    <div className="mt-6 mb-8 rounded-xl border border-slate-200 bg-white px-6 py-4">
      <p className="text-sm text-slate-600">
        {lang === "es"
          ? `Próximamente: filtros para ${cfg.label.es}`
          : `Coming soon: filters for ${cfg.label.en}`}
      </p>
    </div>
  );
}