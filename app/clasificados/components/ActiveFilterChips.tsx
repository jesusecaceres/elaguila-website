"use client";

import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type Lang = "es" | "en";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function prettyRadius(mi: string) {
  const n = Number(mi);
  if (!Number.isFinite(n) || n <= 0) return "";
  return `${n} mi`;
}

export default function ActiveFilterChips({ lang }: { lang: Lang }) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname() || "";

  const t = useMemo(() => {
    const es = {
      clearAll: "Quitar filtros",
      search: "Búsqueda",
      location: "Ciudad",
      radius: "Radio",
      category: "Categoría",
      sort: "Orden",
    };
    const en = {
      clearAll: "Clear filters",
      search: "Search",
      location: "City",
      radius: "Radius",
      category: "Category",
      sort: "Sort",
    };
    return lang === "es" ? es : en;
  }, [lang]);

  const chips = useMemo(() => {
    const sp = params;
    if (!sp) return [] as Array<{ key: string; label: string; value: string }>;

    const out: Array<{ key: string; label: string; value: string }> = [];

    const q = sp.get("q")?.trim() ?? "";
    const city = sp.get("city")?.trim() ?? "";
    const radius = sp.get("radius")?.trim() ?? "";
    const cat = sp.get("cat")?.trim() ?? "";
    const sort = sp.get("sort")?.trim() ?? "";

    if (q) out.push({ key: "q", label: t.search, value: q });
    if (city) out.push({ key: "city", label: t.location, value: city });
    if (radius) out.push({ key: "radius", label: t.radius, value: prettyRadius(radius) || radius });
    if (cat) out.push({ key: "cat", label: t.category, value: cat });
    if (sort) out.push({ key: "sort", label: t.sort, value: sort });

    // Any other deep filters become chips too (UI only)
    sp.forEach((value, key) => {
      const v = value?.trim() ?? "";
      if (!v) return;
      if (["lang", "q", "city", "radius", "cat", "sort", "page"].includes(key)) return;
      out.push({ key, label: key, value: v });
    });

    return out;
  }, [params, t.category, t.location, t.radius, t.search, t.sort]);

  const clearAllHref = useMemo(() => {
    const sp = new URLSearchParams(params?.toString() ?? "");
    const langParam = sp.get("lang");
    sp.forEach((_, key) => {
      if (key !== "lang") sp.delete(key);
    });
    if (langParam) sp.set("lang", langParam);
    const qs = sp.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }, [params, pathname]);

  if (!chips.length) return null;

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      {chips.map((c) => (
        <button
          key={`${c.key}:${c.value}`}
          type="button"
          onClick={() => {
            const sp = new URLSearchParams(params?.toString() ?? "");
            sp.delete(c.key);
            const qs = sp.toString();
            router.push(qs ? `${pathname}?${qs}` : pathname);
          }}
          className={cx(
            "inline-flex items-center gap-2 rounded-full border",
            "border-white/12 bg-white/6 px-3 py-1",
            "text-xs text-gray-200 hover:bg-white/10 transition"
          )}
          aria-label={`${c.label}: ${c.value}`}
        >
          <span className="text-gray-400">{c.label}:</span>
          <span className="font-semibold text-gray-100">{c.value}</span>
          <span className="text-gray-400">×</span>
        </button>
      ))}

      <a
        href={clearAllHref}
        className="ml-2 inline-flex items-center rounded-full border border-white/12 bg-white/6 px-3 py-1 text-xs text-gray-200 hover:bg-white/10 transition"
      >
        {t.clearAll}
      </a>
    </div>
  );
}
