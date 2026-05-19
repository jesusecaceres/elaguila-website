import Link from "next/link";
import type { Lang } from "../types/tienda";
import { withLang } from "../utils/tiendaRouting";

export function TiendaServiceSplit(props: {
  lang: Lang;
  left: { title: string; body: string; bullets: readonly string[]; ctaLabel: string; ctaHref: string };
  right: { title: string; body: string; bullets: readonly string[]; ctaLabel: string; ctaHref: string };
}) {
  const { lang, left, right } = props;
  return (
    <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="relative overflow-hidden rounded-3xl border border-[color:var(--lx-border)] bg-[color:var(--lx-section)] p-6 sm:p-9 shadow-[0_12px_40px_rgba(42,36,22,0.08)] transition hover:border-[color:var(--lx-lion)]/25">
        <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[radial-gradient(circle_at_center,rgba(201,168,74,0.10),transparent)]" aria-hidden />
        <div className="relative inline-flex rounded-full border border-[color:var(--lx-border)] bg-[color:var(--lx-canvas)] px-3 py-1 text-[11px] tracking-[0.16em] uppercase text-[color:var(--lx-muted)]">
          {lang === "en" ? "Self‑serve" : "Auto‑servicio"}
        </div>
        <h3 className="relative mt-4 text-2xl font-semibold tracking-tight text-[color:var(--lx-text)]">{left.title}</h3>
        <p className="relative mt-2 text-sm leading-relaxed text-[color:var(--lx-muted)]">{left.body}</p>
        <ul className="relative mt-5 space-y-2 text-sm text-[color:var(--lx-muted)]">
          {left.bullets.map((b, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[color:var(--lx-lion)]" />
              <span>{b}</span>
            </li>
          ))}
        </ul>
        <div className="relative mt-7">
          <Link
            href={withLang(left.ctaHref, lang)}
            className="inline-flex items-center justify-center rounded-full border border-[color:var(--lx-border)] bg-[color:var(--lx-canvas)] px-5 py-2.5 text-sm font-semibold text-[color:var(--lx-text)] hover:border-[color:var(--lx-lion)]/40 hover:bg-[color:var(--lx-lion)]/10 transition"
          >
            {left.ctaLabel}
          </Link>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-3xl border border-[color:var(--lx-lion)]/30 bg-[color:var(--lx-canvas)] p-6 sm:p-9 shadow-[0_12px_40px_rgba(201,120,47,0.10)] transition hover:border-[color:var(--lx-lion)]/50">
        <div className="pointer-events-none absolute -left-12 bottom-0 h-48 w-48 rounded-full bg-[radial-gradient(circle_at_center,rgba(201,168,74,0.10),transparent)]" aria-hidden />
        <div className="relative inline-flex rounded-full border border-[color:var(--lx-lion)]/35 bg-[color:var(--lx-lion)]/12 px-3 py-1 text-[11px] tracking-[0.16em] uppercase text-[color:var(--lx-text)]">
          {lang === "en" ? "Custom help" : "Ayuda personalizada"}
        </div>
        <h3 className="relative mt-4 text-2xl font-semibold tracking-tight text-[color:var(--lx-text)]">{right.title}</h3>
        <p className="relative mt-2 text-sm leading-relaxed text-[color:var(--lx-muted)]">{right.body}</p>
        <ul className="relative mt-5 space-y-2 text-sm text-[color:var(--lx-muted)]">
          {right.bullets.map((b, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[color:var(--lx-lion)]" />
              <span>{b}</span>
            </li>
          ))}
        </ul>
        <div className="relative mt-7 flex flex-col sm:flex-row gap-3 sm:items-center">
          <Link
            href={withLang(right.ctaHref, lang)}
            className="inline-flex items-center justify-center rounded-full bg-[color:var(--lx-gold)] px-5 py-2.5 text-sm font-semibold text-[color:var(--lx-text)] hover:brightness-95 transition shadow-[0_14px_40px_rgba(201,168,74,0.20)]"
          >
            {right.ctaLabel}
          </Link>
          <div className="text-xs text-[color:var(--lx-muted)]">
            {lang === "en"
              ? "Design + custom quotes: Tienda contact page (office or phone first). No checkout yet."
              : "Diseño y cotizaciones: página de contacto Tienda (oficina o teléfono primero). Sin checkout aún."}
          </div>
        </div>
      </div>
    </section>
  );
}

