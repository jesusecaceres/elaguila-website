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
      <div className="rounded-3xl border border-[rgba(255,255,255,0.10)] bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] p-6 sm:p-9 shadow-[0_24px_90px_rgba(0,0,0,0.35)]">
        <div className="inline-flex rounded-full border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.06)] px-3 py-1 text-[11px] tracking-[0.16em] uppercase text-[rgba(255,255,255,0.70)]">
          {lang === "en" ? "Self‑serve" : "Auto‑servicio"}
        </div>
        <h3 className="mt-4 text-2xl font-semibold tracking-tight text-white">{left.title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-[rgba(255,255,255,0.72)]">{left.body}</p>
        <ul className="mt-5 space-y-2 text-sm text-[rgba(255,255,255,0.72)]">
          {left.bullets.map((b, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[rgba(201,168,74,0.70)]" />
              <span>{b}</span>
            </li>
          ))}
        </ul>
        <div className="mt-7">
          <Link
            href={withLang(left.ctaHref, lang)}
            className="inline-flex items-center justify-center rounded-full bg-[rgba(201,168,74,0.16)] border border-[rgba(201,168,74,0.35)] px-5 py-2.5 text-sm font-semibold text-[rgba(255,247,226,0.92)] hover:bg-[rgba(201,168,74,0.22)] transition"
          >
            {left.ctaLabel}
          </Link>
        </div>
      </div>

      <div className="rounded-3xl border border-[rgba(201,168,74,0.24)] bg-[linear-gradient(180deg,rgba(201,168,74,0.12),rgba(255,255,255,0.02))] p-6 sm:p-9 shadow-[0_24px_90px_rgba(0,0,0,0.35)]">
        <div className="inline-flex rounded-full border border-[rgba(201,168,74,0.35)] bg-[rgba(201,168,74,0.14)] px-3 py-1 text-[11px] tracking-[0.16em] uppercase text-[rgba(255,247,226,0.84)]">
          {lang === "en" ? "Custom help" : "Ayuda personalizada"}
        </div>
        <h3 className="mt-4 text-2xl font-semibold tracking-tight text-white">{right.title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-[rgba(255,255,255,0.72)]">{right.body}</p>
        <ul className="mt-5 space-y-2 text-sm text-[rgba(255,255,255,0.72)]">
          {right.bullets.map((b, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[rgba(255,247,226,0.72)]" />
              <span>{b}</span>
            </li>
          ))}
        </ul>
        <div className="mt-7 flex flex-col sm:flex-row gap-3 sm:items-center">
          <Link
            href={withLang(right.ctaHref, lang)}
            className="inline-flex items-center justify-center rounded-full bg-[color:var(--lx-gold)] px-5 py-2.5 text-sm font-semibold text-[color:var(--lx-text)] hover:brightness-95 transition shadow-[0_14px_40px_rgba(201,168,74,0.20)]"
          >
            {right.ctaLabel}
          </Link>
          <div className="text-xs text-[rgba(255,255,255,0.70)]">
            {lang === "en"
              ? "Design + custom quotes route here (no checkout yet)."
              : "Aquí irá el flujo de diseño/cotización (sin checkout aún)."}
          </div>
        </div>
      </div>
    </section>
  );
}

