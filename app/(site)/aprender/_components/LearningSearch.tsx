"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { learningCopy, type Lang } from "../learningCopy";

type LessonSummary = {
  lessonKey: string;
  titleEs: string;
  titleEn: string;
  summaryEs: string;
  summaryEn: string;
  estimatedMinutes: number;
};

/** TODAY-1 — simple client-side search box over the public Learning Center catalog. Public data, no auth required. */
export function LearningSearch({ lang }: { lang: Lang }) {
  const t = learningCopy(lang);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<LessonSummary[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const handle = setTimeout(() => {
      fetch(`/api/dashboard/business/learning/catalog?q=${encodeURIComponent(query)}&lang=${lang}`)
        .then((res) => res.json())
        .then((json: { ok: boolean; lessons?: LessonSummary[] }) => {
          if (cancelled) return;
          setResults(json.ok ? (json.lessons ?? []) : []);
        })
        .catch(() => {
          if (!cancelled) setResults([]);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [query, lang]);

  return (
    <div className="space-y-2">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t.searchPlaceholder}
        className="min-h-11 w-full rounded-xl border border-[#E8DFD0] bg-white px-4 text-sm text-[#3D3428] outline-none focus:border-[#C9B46A]"
      />
      {loading ? <p className="text-xs text-[#9A9184]">{t.loading}</p> : null}
      {results !== null && !loading ? (
        results.length === 0 ? (
          <p className="text-xs text-[#9A9184]">{t.searchNoResults}</p>
        ) : (
          <ul className="space-y-2">
            {results.map((l) => (
              <li key={l.lessonKey}>
                <Link
                  href={`/aprender/leccion/${l.lessonKey}?lang=${lang}`}
                  className="block min-h-11 rounded-xl border border-[#E8DFD0] bg-white p-3"
                >
                  <p className="break-words text-sm font-semibold text-[#1E1810]">{lang === "es" ? l.titleEs : l.titleEn}</p>
                  <p className="mt-1 break-words text-xs text-[#5C5346]">{lang === "es" ? l.summaryEs : l.summaryEn}</p>
                </Link>
              </li>
            ))}
          </ul>
        )
      ) : null}
    </div>
  );
}
