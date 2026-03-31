import Link from "next/link";
import type { Lang } from "../types/tienda";
import { withLang } from "../utils/tiendaRouting";

export function TiendaHero(props: {
  lang: Lang;
  eyebrow: string;
  headline: string;
  subhead: string;
  ctaPrimary: { label: string; href: string };
  ctaSecondary: { label: string; href: string };
  supportingLine: string;
}) {
  const { lang, eyebrow, headline, subhead, ctaPrimary, ctaSecondary, supportingLine } = props;

  return (
    <section className="relative overflow-hidden rounded-[2.2rem] border border-[rgba(255,255,255,0.10)] bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] shadow-[0_30px_120px_rgba(0,0,0,0.45)]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -right-28 h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle_at_center,rgba(201,168,74,0.20),rgba(0,0,0,0))]" />
        <div className="absolute -bottom-44 -left-28 h-[560px] w-[560px] rounded-full bg-[radial-gradient(circle_at_center,rgba(255,252,247,0.10),rgba(0,0,0,0))]" />
        <div className="absolute inset-x-0 top-0 h-[1px] bg-[linear-gradient(90deg,rgba(255,255,255,0.0),rgba(201,168,74,0.55),rgba(255,255,255,0.0))]" />
      </div>

      <div className="relative grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-10 p-7 sm:p-10 lg:p-12">
        <div>
          <div className="inline-flex items-center gap-2">
            <span className="h-[1px] w-10 bg-[rgba(201,168,74,0.55)]" />
            <span className="text-[11px] tracking-[0.18em] uppercase text-[rgba(255,247,226,0.78)]">
              {eyebrow}
            </span>
          </div>

          <h1 className="mt-4 text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-white">
            {headline}
          </h1>

          <p className="mt-4 text-base sm:text-lg leading-relaxed text-[rgba(255,255,255,0.72)] max-w-2xl">
            {subhead}
          </p>

          <div className="mt-7 flex flex-col sm:flex-row gap-3">
            <Link
              href={withLang(ctaPrimary.href, lang)}
              className="inline-flex items-center justify-center rounded-full bg-[color:var(--lx-gold)] px-6 py-3 text-sm font-semibold text-[color:var(--lx-text)] hover:brightness-95 transition shadow-[0_14px_40px_rgba(201,168,74,0.22)]"
            >
              {ctaPrimary.label}
            </Link>
            <Link
              href={withLang(ctaSecondary.href, lang)}
              className="inline-flex items-center justify-center rounded-full border border-[rgba(255,255,255,0.14)] bg-[rgba(255,255,255,0.06)] px-6 py-3 text-sm font-semibold text-[rgba(255,255,255,0.86)] hover:bg-[rgba(255,255,255,0.10)] transition"
            >
              {ctaSecondary.label}
            </Link>
          </div>

          <div className="mt-6 text-xs sm:text-sm text-[rgba(255,255,255,0.64)]">
            {supportingLine}
          </div>
        </div>

        {/* Editorial product-card composition (no legacy images) */}
        <div className="relative">
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-3xl border border-[rgba(201,168,74,0.24)] bg-[linear-gradient(180deg,rgba(255,252,247,0.94),rgba(255,252,247,0.88))] p-5 shadow-[0_18px_60px_rgba(0,0,0,0.35)]">
              <div className="text-[11px] tracking-[0.16em] uppercase text-[color:rgba(61,52,40,0.70)]">
                {lang === "en" ? "Business cards" : "Tarjetas"}
              </div>
              <div className="mt-3 h-24 rounded-2xl bg-[linear-gradient(135deg,rgba(201,168,74,0.18),rgba(0,0,0,0.06))] border border-black/10" />
              <div className="mt-4 text-sm font-semibold text-[color:var(--lx-text)]">
                {lang === "en" ? "Premium finish" : "Acabado premium"}
              </div>
              <div className="mt-1 text-xs text-[color:rgba(61,52,40,0.70)]">
                {lang === "en" ? "Clean. Sharp. Professional." : "Limpio. Nítido. Profesional."}
              </div>
            </div>

            <div className="rounded-3xl border border-[rgba(255,255,255,0.10)] bg-[rgba(0,0,0,0.20)] p-5 shadow-[0_18px_60px_rgba(0,0,0,0.35)]">
              <div className="text-[11px] tracking-[0.16em] uppercase text-[rgba(255,247,226,0.72)]">
                {lang === "en" ? "Banners & signs" : "Banners & letreros"}
              </div>
              <div className="mt-3 h-24 rounded-2xl bg-[linear-gradient(135deg,rgba(255,252,247,0.10),rgba(201,168,74,0.12))] border border-[rgba(255,255,255,0.10)]" />
              <div className="mt-4 text-sm font-semibold text-white">
                {lang === "en" ? "High impact" : "Alto impacto"}
              </div>
              <div className="mt-1 text-xs text-[rgba(255,255,255,0.66)]">
                {lang === "en" ? "Built for visibility." : "Hecho para verse."}
              </div>
            </div>

            <div className="col-span-2 rounded-3xl border border-[rgba(255,255,255,0.10)] bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.35)]">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <div className="text-[11px] tracking-[0.16em] uppercase text-[rgba(255,247,226,0.72)]">
                    {lang === "en" ? "Upload‑ready workflow" : "Flujo listo para subir"}
                  </div>
                  <div className="mt-2 text-lg font-semibold tracking-tight text-white">
                    {lang === "en" ? "Choose → Upload → Print" : "Elige → Sube → Imprime"}
                  </div>
                  <div className="mt-1 text-sm text-[rgba(255,255,255,0.68)]">
                    {lang === "en" ? "Storefront foundation (checkout later)." : "Base de Tienda (checkout después)."}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[rgba(201,168,74,0.75)]" />
                  <span className="text-xs text-[rgba(255,247,226,0.76)]">
                    {lang === "en" ? "Business-first" : "Enfocado en negocios"}
                  </span>
                </div>
              </div>
              <div className="mt-5 grid grid-cols-3 gap-3">
                {["Cards", "Flyers", "Stickers"].map((_, i) => (
                  <div
                    key={i}
                    className="h-12 rounded-2xl border border-[rgba(255,255,255,0.10)] bg-[rgba(0,0,0,0.18)]"
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

