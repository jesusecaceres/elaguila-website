"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { FiArrowRight, FiBriefcase, FiHome, FiMapPin } from "react-icons/fi";
import { BR_PUBLICAR_NEGOCIO } from "@/app/clasificados/bienes-raices/shared/constants/brPublishRoutes";
import {
  BR_NEGOCIO_Q_PROPIEDAD,
  BR_NEGOCIO_DEFAULT_CATEGORIA,
  type BrNegocioCategoriaPropiedad,
} from "@/app/clasificados/bienes-raices/shared/brNegocioBranchParams";
import {
  normalizeBrAgenteResidencialLang,
  withBrAgenteResLangParam,
} from "@/app/clasificados/publicar/bienes-raices/negocio/agente-individual/application/brAgenteResidencialLang";

const CARD =
  "flex w-full cursor-pointer flex-col rounded-2xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] p-4 text-left shadow-[0_6px_24px_-12px_rgba(42,36,22,0.12)] transition hover:border-[color:var(--lx-gold-border)] hover:shadow-[0_10px_32px_-14px_rgba(42,36,22,0.14)] sm:p-5";

const CARD_ON = "border-[color:var(--lx-gold-border)] bg-[color:var(--lx-nav-hover)] ring-1 ring-[color:var(--lx-gold-border)]/40";

const PROP_OPTIONS: { id: BrNegocioCategoriaPropiedad; label: string; hint: string }[] = [
  { id: "residencial", label: "Residencial", hint: "Casas, condominios, townhomes." },
  { id: "comercial", label: "Comercial", hint: "Locales, oficinas, retail." },
  { id: "terreno_lote", label: "Terreno / lote", hint: "Parcelas y tierras." },
];

export function PublicarBienesRaicesNegocioSelectorClient() {
  const searchParams = useSearchParams();
  const lang = useMemo(() => normalizeBrAgenteResidencialLang(searchParams?.get("lang")), [searchParams]);

  const [propiedad, setPropiedad] = useState<BrNegocioCategoriaPropiedad>(BR_NEGOCIO_DEFAULT_CATEGORIA);

  const continuarHref = useMemo(() => {
    const qs = new URLSearchParams();
    qs.set(BR_NEGOCIO_Q_PROPIEDAD, propiedad);
    const path = `${BR_PUBLICAR_NEGOCIO}?${qs.toString()}`;
    return withBrAgenteResLangParam(path, lang);
  }, [propiedad, lang]);

  const publicarHubHref = "/clasificados/publicar";

  return (
    <div
      className="min-h-screen overflow-x-hidden pb-16 pt-10 text-[color:var(--lx-text)] sm:pb-20 sm:pt-12"
      style={{
        backgroundColor: "var(--lx-page)",
        backgroundImage:
          "radial-gradient(ellipse 120% 80% at 50% -20%, rgba(201, 180, 106, 0.16), transparent 55%)",
      }}
    >
      <div className="mx-auto w-full min-w-0 max-w-2xl px-4 sm:px-6">
        <nav className="text-xs font-semibold text-[color:var(--lx-muted)]">
          <Link
            href={publicarHubHref}
            className="text-[color:var(--lx-text-2)] underline decoration-[color:var(--lx-gold-border)] underline-offset-4 transition hover:text-[color:var(--lx-gold)]"
          >
            ← Publicar
          </Link>
        </nav>

        <header className="mt-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[color:var(--lx-muted)]">Bienes Raíces · Negocio</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-[color:var(--lx-text)] sm:text-3xl">Empezar publicación</h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-[color:var(--lx-text-2)]">
            Publicación como agente o vendedor. Elige el tipo de propiedad; podrás completar el anuncio en los pasos siguientes.
          </p>
        </header>

        <section className="mt-8 rounded-2xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[color:var(--lx-gold-border)] bg-[color:var(--lx-nav-hover)] text-[color:var(--lx-gold)]">
              <FiBriefcase className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--lx-muted)]">Publicación</p>
              <p className="mt-1 text-sm font-bold text-[color:var(--lx-text)]">Agente / vendedor</p>
              <p className="mt-1 text-xs leading-relaxed text-[color:var(--lx-text-2)]">
                Un solo flujo profesional. Podrás añadir un segundo agente o contacto de apoyo más adelante en el formulario.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--lx-muted)]">Tipo de propiedad</h2>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {PROP_OPTIONS.map((o) => {
              const on = propiedad === o.id;
              return (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => setPropiedad(o.id)}
                  className={`${CARD} ${on ? CARD_ON : ""}`}
                >
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[color:var(--lx-gold-border)] bg-[color:var(--lx-nav-hover)] text-[color:var(--lx-gold)]">
                    {o.id === "terreno_lote" ? (
                      <FiMapPin className="h-5 w-5" aria-hidden />
                    ) : (
                      <FiHome className="h-5 w-5" aria-hidden />
                    )}
                  </span>
                  <span className="mt-3 text-sm font-bold text-[color:var(--lx-text)]">{o.label}</span>
                  <span className="mt-1 text-xs leading-relaxed text-[color:var(--lx-text-2)]">{o.hint}</span>
                </button>
              );
            })}
          </div>
        </section>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href={continuarHref}
            className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-[color:var(--lx-gold)] px-6 text-sm font-bold text-[#1E1810] shadow-sm transition hover:brightness-95"
          >
            Continuar al formulario
            <FiArrowRight className="h-4 w-4 shrink-0" aria-hidden />
          </Link>
          <p className="text-[11px] text-[color:var(--lx-muted)]">La categoría elegida se refleja en la URL del formulario.</p>
        </div>
      </div>
    </div>
  );
}
