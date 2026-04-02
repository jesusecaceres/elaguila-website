"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { FiArrowRight, FiBriefcase, FiUser } from "react-icons/fi";
import { normalizeAutosNegociosLang, withLangParam } from "@/app/clasificados/autos/negocios/lib/autosNegociosLang";
import { getAutosBranchCopy } from "./autosBranchCopy";

const CARD =
  "group flex h-full flex-col rounded-[20px] border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] p-5 shadow-[0_8px_28px_-12px_rgba(42,36,22,0.12)] transition hover:border-[color:var(--lx-gold-border)] hover:shadow-[0_12px_36px_-14px_rgba(42,36,22,0.14)] sm:p-6";

export function PublicarAutosBranchClient() {
  const searchParams = useSearchParams();
  const lang = useMemo(() => normalizeAutosNegociosLang(searchParams?.get("lang")), [searchParams]);
  const c = useMemo(() => getAutosBranchCopy(lang), [lang]);

  useEffect(() => {
    document.title = c.metaTitle;
  }, [c.metaTitle]);

  const publicarHref = withLangParam("/clasificados/publicar", lang);
  const privadoHref = withLangParam("/publicar/autos/privado", lang);
  const negociosHref = withLangParam("/publicar/autos/negocios", lang);

  return (
    <div
      className="min-h-screen overflow-x-hidden pb-16 pt-10 text-[color:var(--lx-text)] sm:pb-20 sm:pt-12"
      style={{
        backgroundColor: "var(--lx-page)",
        backgroundImage:
          "radial-gradient(ellipse 120% 80% at 50% -20%, rgba(201, 180, 106, 0.16), transparent 55%)",
      }}
    >
      <div className="mx-auto w-full min-w-0 max-w-3xl px-4 sm:px-6">
        <nav className="text-xs font-semibold text-[color:var(--lx-muted)]">
          <Link
            href={publicarHref}
            className="text-[color:var(--lx-text-2)] underline decoration-[color:var(--lx-gold-border)] underline-offset-4 transition hover:text-[color:var(--lx-gold)]"
          >
            {c.backToPublicar}
          </Link>
        </nav>

        <header className="mt-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[color:var(--lx-muted)]">{c.kicker}</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-[color:var(--lx-text)] sm:text-3xl md:text-4xl">{c.title}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[color:var(--lx-text-2)] sm:text-base">{c.intro}</p>
        </header>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2">
          <Link href={privadoHref} className={CARD}>
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[color:var(--lx-gold-border)] bg-[color:var(--lx-nav-hover)] text-[color:var(--lx-gold)]">
              <FiUser className="h-5 w-5" aria-hidden />
            </span>
            <h2 className="mt-4 text-lg font-bold text-[color:var(--lx-text)]">{c.privado.title}</h2>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-[color:var(--lx-text-2)]">{c.privado.body}</p>
            <span className="mt-6 inline-flex min-h-[48px] items-center gap-2 text-sm font-bold text-[color:var(--lx-gold)] group-hover:underline">
              {c.privado.cta}
              <FiArrowRight className="h-4 w-4 shrink-0 transition group-hover:translate-x-0.5" aria-hidden />
            </span>
          </Link>

          <Link href={negociosHref} className={CARD}>
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[color:var(--lx-gold-border)] bg-[color:var(--lx-nav-hover)] text-[color:var(--lx-gold)]">
              <FiBriefcase className="h-5 w-5" aria-hidden />
            </span>
            <h2 className="mt-4 text-lg font-bold text-[color:var(--lx-text)]">{c.negocios.title}</h2>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-[color:var(--lx-text-2)]">{c.negocios.body}</p>
            <span className="mt-6 inline-flex min-h-[48px] items-center gap-2 text-sm font-bold text-[color:var(--lx-gold)] group-hover:underline">
              {c.negocios.cta}
              <FiArrowRight className="h-4 w-4 shrink-0 transition group-hover:translate-x-0.5" aria-hidden />
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
