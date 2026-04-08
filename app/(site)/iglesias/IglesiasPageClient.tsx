"use client";

import { useSearchParams } from "next/navigation";
import type { IglesiasPageCopy } from "@/app/lib/siteSectionContent/iglesiasPageMerge";

type Lang = "es" | "en";

export function IglesiasPageClient({ shell }: { shell: IglesiasPageCopy }) {
  const sp = useSearchParams();
  const lang: Lang = sp?.get("lang") === "en" ? "en" : "es";
  const t = shell[lang];

  return (
    <>
      <main className="mx-auto max-w-6xl px-6 pt-28 pb-16">
        <div className="rounded-3xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] p-8 shadow-[0_18px_48px_rgba(42,36,22,0.10)]">
          <h1 className="text-3xl font-extrabold tracking-tight text-[color:var(--lx-text)]">{t.title}</h1>
          <p className="mt-3 max-w-3xl text-sm text-[color:var(--lx-text-2)]/90">{t.subtitle}</p>
          <p className="mt-4 max-w-3xl text-sm text-[color:var(--lx-muted)]">{t.note}</p>

          <div className="mt-8">
            <a
              href={`/clasificados?lang=${lang}`}
              className="inline-flex rounded-full border border-[color:var(--lx-nav-border)] bg-white/60 px-5 py-2 text-sm font-semibold text-[color:var(--lx-text)] hover:bg-white/80 transition"
            >
              {t.backCta}
            </a>
          </div>
        </div>
      </main>
    </>
  );
}
