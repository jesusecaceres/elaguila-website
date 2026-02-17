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
    <div className="mt-6 mb-8 rounded-2xl border border-yellow-600/20 bg-black/30 px-6 py-4">
      <p className="text-sm text-gray-300">
        {lang === "es"
          ? `Próximamente: filtros para ${cfg.label.es}`
          : `Coming soon: filters for ${cfg.label.en}`}
      </p>
    </div>
  );
}