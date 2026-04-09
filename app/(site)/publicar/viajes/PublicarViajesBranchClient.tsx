"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { FiArrowRight, FiBriefcase, FiUser } from "react-icons/fi";

import Navbar from "@/app/components/Navbar";
import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { appendLangToPath } from "@/app/clasificados/lib/hubUrl";
import { ViajesLangSwitch } from "@/app/(site)/clasificados/viajes/components/ViajesLangSwitch";
import { getPublicarViajesHubCopy } from "./data/publicarViajesHubCopy";

const CARD =
  "group flex h-full flex-col rounded-[20px] border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] p-5 shadow-[0_8px_28px_-12px_rgba(42,36,22,0.12)] transition hover:border-[color:var(--lx-gold-border)] hover:shadow-[0_12px_36px_-14px_rgba(42,36,22,0.14)] sm:p-6";

export function PublicarViajesBranchClient() {
  const sp = useSearchParams();
  const lang: Lang = sp?.get("lang") === "en" ? "en" : "es";
  const copy = getPublicarViajesHubCopy(lang);

  useEffect(() => {
    document.title = copy.documentTitle;
  }, [copy.documentTitle]);

  const hubHref = appendLangToPath("/clasificados/publicar", lang);
  const negociosHref = appendLangToPath("/publicar/viajes/negocios", lang);
  const privadoHref = appendLangToPath("/publicar/viajes/privado", lang);
  const viajesHref = appendLangToPath("/clasificados/viajes", lang);

  return (
    <div
      className="min-h-screen overflow-x-hidden pb-16 pt-6 text-[color:var(--lx-text)] sm:pb-20 sm:pt-8"
      style={{
        backgroundColor: "var(--lx-page)",
        backgroundImage: "radial-gradient(ellipse 120% 80% at 50% -20%, rgba(201, 180, 106, 0.16), transparent 55%)",
      }}
    >
      <Navbar />
      <div className="mx-auto flex w-full min-w-0 max-w-3xl justify-end px-4 pb-2 sm:px-6">
        <ViajesLangSwitch compact />
      </div>
      <div className="mx-auto w-full min-w-0 max-w-3xl px-4 sm:px-6">
        <nav className="text-xs font-semibold text-[color:var(--lx-muted)]">
          <Link
            href={hubHref}
            className="text-[color:var(--lx-text-2)] underline decoration-[color:var(--lx-gold-border)] underline-offset-4 transition hover:text-[color:var(--lx-gold)]"
          >
            {copy.back}
          </Link>
        </nav>

        <header className="mt-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[color:var(--lx-muted)]">{copy.kicker}</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-[color:var(--lx-text)] sm:text-3xl md:text-4xl">{copy.title}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[color:var(--lx-text-2)] sm:text-base">{copy.intro}</p>
        </header>

        <section className="mt-8 rounded-2xl border border-[color:var(--lx-gold-border)]/50 bg-[color:var(--lx-section)]/70 p-4 sm:p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[color:var(--lx-muted)]">{copy.stepsTitle}</p>
          <ol className="mt-3 space-y-2">
            {copy.steps.map((s) => (
              <li key={s.label} className="flex flex-col gap-0.5 rounded-xl border border-[color:var(--lx-nav-border)]/80 bg-[color:var(--lx-card)] px-3 py-2.5 text-sm sm:flex-row sm:items-baseline sm:gap-2">
                <span className="shrink-0 font-bold text-[color:var(--lx-text)]">{s.label}</span>
                <span className="text-[color:var(--lx-text-2)]">{s.detail}</span>
              </li>
            ))}
          </ol>
          <p className="mt-4 text-xs leading-relaxed text-[color:var(--lx-muted)]">{copy.modeNote}</p>
        </section>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2">
          <Link href={negociosHref} className={CARD}>
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[color:var(--lx-gold-border)] bg-[color:var(--lx-nav-hover)] text-[color:var(--lx-gold)]">
              <FiBriefcase className="h-5 w-5" aria-hidden />
            </span>
            <h2 className="mt-4 text-lg font-bold text-[color:var(--lx-text)]">{copy.negociosTitle}</h2>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-[color:var(--lx-text-2)]">{copy.negociosBody}</p>
            <span className="mt-6 inline-flex min-h-[48px] items-center gap-2 text-sm font-bold text-[#D97706] group-hover:underline">
              {copy.negociosCta}
              <FiArrowRight className="h-4 w-4 shrink-0 transition group-hover:translate-x-0.5" aria-hidden />
            </span>
          </Link>

          <Link href={privadoHref} className={CARD}>
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[color:var(--lx-gold-border)] bg-[color:var(--lx-nav-hover)] text-[color:var(--lx-gold)]">
              <FiUser className="h-5 w-5" aria-hidden />
            </span>
            <h2 className="mt-4 text-lg font-bold text-[color:var(--lx-text)]">{copy.privadoTitle}</h2>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-[color:var(--lx-text-2)]">{copy.privadoBody}</p>
            <span className="mt-6 inline-flex min-h-[48px] items-center gap-2 text-sm font-bold text-[#D97706] group-hover:underline">
              {copy.privadoCta}
              <FiArrowRight className="h-4 w-4 shrink-0 transition group-hover:translate-x-0.5" aria-hidden />
            </span>
          </Link>
        </div>

        <p className="mt-10 text-center text-sm text-[color:var(--lx-muted)]">
          <Link href={viajesHref} className="font-semibold text-[color:var(--lx-text)] underline-offset-4 hover:underline">
            {copy.footLink}
          </Link>{" "}
          {copy.footRest}
        </p>
      </div>
    </div>
  );
}
