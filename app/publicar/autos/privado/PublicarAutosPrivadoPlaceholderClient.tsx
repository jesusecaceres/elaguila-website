"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { normalizeAutosNegociosLang, withLangParam } from "@/app/clasificados/autos/negocios/lib/autosNegociosLang";
import { getAutosBranchCopy } from "../autosBranchCopy";

const CARD =
  "rounded-[20px] border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] p-6 shadow-[0_8px_28px_-12px_rgba(42,36,22,0.12)] sm:p-8";

export function PublicarAutosPrivadoPlaceholderClient() {
  const searchParams = useSearchParams();
  const lang = useMemo(() => normalizeAutosNegociosLang(searchParams?.get("lang")), [searchParams]);
  const branch = useMemo(() => getAutosBranchCopy(lang), [lang]);
  const p = branch.privadoPlaceholder;

  useEffect(() => {
    document.title = `${p.title} — LEONIX`;
  }, [p.title]);

  const autosHref = withLangParam("/publicar/autos", lang);
  const negociosHref = withLangParam("/publicar/autos/negocios", lang);

  return (
    <div
      className="min-h-screen overflow-x-hidden pb-16 pt-10 text-[color:var(--lx-text)] sm:pb-20 sm:pt-12"
      style={{
        backgroundColor: "var(--lx-page)",
        backgroundImage:
          "radial-gradient(ellipse 120% 80% at 50% -20%, rgba(201, 180, 106, 0.14), transparent 55%)",
      }}
    >
      <div className="mx-auto w-full min-w-0 max-w-2xl px-4 sm:px-6">
        <div className={CARD}>
          <h1 className="text-xl font-bold tracking-tight text-[color:var(--lx-text)] sm:text-2xl">{p.title}</h1>
          <p className="mt-4 text-sm leading-relaxed text-[color:var(--lx-text-2)] sm:text-base">{p.body}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              href={autosHref}
              className="inline-flex min-h-[48px] flex-1 items-center justify-center rounded-[14px] border border-[color:var(--lx-nav-border)] bg-[#FFFCF7] px-5 text-sm font-bold text-[color:var(--lx-text)] shadow-sm transition hover:bg-[color:var(--lx-nav-hover)] sm:flex-initial"
            >
              {p.branch}
            </Link>
            <Link
              href={negociosHref}
              className="inline-flex min-h-[48px] flex-1 items-center justify-center rounded-[14px] bg-[color:var(--lx-cta-dark)] px-5 text-sm font-bold text-[#FFFCF7] shadow-lg transition hover:bg-[color:var(--lx-cta-dark-hover)] sm:flex-initial"
            >
              {branch.negocios.cta}
            </Link>
          </div>
          <p className="mt-6 text-center sm:text-left">
            <Link
              href={autosHref}
              className="text-sm font-semibold text-[color:var(--lx-muted)] underline-offset-4 hover:text-[color:var(--lx-text-2)] hover:underline"
            >
              {p.back}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
