"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { appendLangToPath } from "@/app/clasificados/lib/hubUrl";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";

type Lang = "es" | "en";

type Props = {
  category: "clases" | "comunidad";
  lang: Lang;
  title: string;
  emptyNote: string;
  errorPrefix: string;
};

export function CategoryRecentListings({ category, lang, title, emptyNote, errorPrefix }: Props) {
  const [rows, setRows] = useState<{ id: string; title: string; city: string | null }[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const sb = createSupabaseBrowserClient();
        const { data, error } = await sb
          .from("listings")
          .select("id, title, city")
          .eq("category", category)
          .eq("is_published", true)
          .in("status", ["active", "sold"])
          .order("created_at", { ascending: false })
          .limit(8);
        if (cancelled) return;
        if (error) {
          setErr(error.message);
          setRows([]);
          return;
        }
        const list = (data ?? []) as { id: string; title: string; city: string | null }[];
        setRows(list.filter((r) => r.id && r.title));
        setErr(null);
      } catch (e: unknown) {
        if (cancelled) return;
        setErr(e instanceof Error ? e.message : "error");
        setRows([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [category]);

  if (err) {
    return (
      <section className="rounded-2xl border border-red-200/70 bg-red-50/90 px-4 py-4 text-sm text-red-950">
        <p className="font-semibold">{errorPrefix}</p>
        <p className="mt-1 opacity-90">{err}</p>
      </section>
    );
  }

  if (!rows.length) {
    return (
      <section className="rounded-2xl border border-black/10 bg-white/80 px-4 py-4 text-sm text-[#111111]/75">
        <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-[#3d5a73]/85">{title}</h2>
        <p className="mt-2">{emptyNote}</p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-[#C9B46A]/22 bg-[#FFFCF7]/98 px-4 py-4 shadow-[0_6px_28px_-18px_rgba(42,36,22,0.14)] ring-1 ring-[#C9B46A]/10 sm:px-5">
      <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-[#3d5a73]/85">{title}</h2>
      <ul className="mt-3 space-y-2">
        {rows.map((r) => (
          <li key={r.id} className="min-w-0">
            <Link
              href={appendLangToPath(`/clasificados/anuncio/${r.id}`, lang)}
              className="block truncate rounded-lg border border-black/8 bg-white/90 px-3 py-2 text-sm font-medium text-[#111111] transition hover:bg-[#F5F5F5]"
            >
              <span className="text-[#2563EB] underline-offset-2 hover:underline">{r.title}</span>
              {r.city ? <span className="ml-2 text-xs font-normal text-[#5C564E]">· {r.city}</span> : null}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
