import Image from "next/image";
import Link from "next/link";
import type { Lang } from "../types/tienda";
import { tiendaHeroAssets } from "../data/tiendaVisualAssets";
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

  const step1 = lang === "en" ? "Pick your product" : "Elige tu producto";
  const step2 = lang === "en" ? "Upload or design" : "Sube o diseña";
  const step3 = lang === "en" ? "We print & prep pickup" : "Imprimimos y coordinamos entrega";
  const processLead =
    lang === "en"
      ? "Three clear steps — most jobs start online; Leonix confirms details before production."
      : "Tres pasos claros — la mayoría empieza en línea; Leonix confirma antes de producir.";

  return (
    <section className="relative overflow-hidden rounded-[2.2rem] border border-[rgba(255,255,255,0.10)] bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] shadow-[0_30px_120px_rgba(0,0,0,0.45)]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -right-28 h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle_at_center,rgba(201,168,74,0.20),rgba(0,0,0,0))]" />
        <div className="absolute -bottom-44 -left-28 h-[560px] w-[560px] rounded-full bg-[radial-gradient(circle_at_center,rgba(255,252,247,0.10),rgba(0,0,0,0))]" />
        <div className="absolute inset-x-0 top-0 h-[1px] bg-[linear-gradient(90deg,rgba(255,255,255,0.0),rgba(201,168,74,0.55),rgba(255,255,255,0.0))]" />
      </div>

      <div className="relative grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-10 p-7 sm:p-10 lg:p-12">
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

          <div className="mt-6 text-xs sm:text-sm text-[rgba(255,255,255,0.64)]">{supportingLine}</div>
        </div>

        <div className="relative min-h-[340px] lg:min-h-[420px]">
          <div className="grid h-full grid-cols-2 gap-4">
            <div className="relative overflow-hidden rounded-3xl border border-[rgba(201,168,74,0.28)] bg-[rgba(0,0,0,0.35)] shadow-[0_18px_60px_rgba(0,0,0,0.4)]">
              <div className="relative h-[140px] w-full sm:h-[160px]">
                <Image
                  src={tiendaHeroAssets.businessCards}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 45vw, 380px"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[rgba(30,24,16,0.85)] via-transparent to-transparent" />
              </div>
              <div className="relative px-4 pb-4 pt-1">
                <div className="text-[10px] tracking-[0.16em] uppercase text-[rgba(255,247,226,0.78)]">
                  {lang === "en" ? "Business cards" : "Tarjetas"}
                </div>
                <div className="mt-1 text-sm font-semibold text-[rgba(255,247,226,0.96)]">
                  {lang === "en" ? "Premium stock & finish" : "Papel y acabado premium"}
                </div>
                <div className="mt-0.5 text-xs text-[rgba(255,247,226,0.72)]">
                  {lang === "en" ? "Online builder + upload paths" : "Constructor en línea + subida"}
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-3xl border border-[rgba(255,255,255,0.12)] bg-[rgba(0,0,0,0.35)] shadow-[0_18px_60px_rgba(0,0,0,0.4)]">
              <div className="relative h-[140px] w-full sm:h-[160px]">
                <Image
                  src={tiendaHeroAssets.bannersSigns}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 45vw, 380px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
              </div>
              <div className="relative px-4 pb-4 pt-1">
                <div className="text-[10px] tracking-[0.16em] uppercase text-[rgba(255,247,226,0.72)]">
                  {lang === "en" ? "Banners & large format" : "Banners y gran formato"}
                </div>
                <div className="mt-1 text-sm font-semibold text-white">
                  {lang === "en" ? "Event & retail presence" : "Presencia en evento y punto de venta"}
                </div>
                <div className="mt-0.5 text-xs text-[rgba(255,255,255,0.65)]">
                  {lang === "en" ? "Print-ready uploads" : "Archivos listos para imprenta"}
                </div>
              </div>
            </div>

            <div className="relative col-span-2 overflow-hidden rounded-3xl border border-[rgba(255,255,255,0.10)] bg-[rgba(0,0,0,0.45)] shadow-[0_18px_60px_rgba(0,0,0,0.4)]">
              <div className="relative flex min-h-[168px] flex-col sm:flex-row">
                <div className="relative h-[120px] w-full sm:h-auto sm:w-[44%] shrink-0">
                  <Image
                    src={tiendaHeroAssets.printWorkflow}
                    alt=""
                    fill
                    className="object-cover sm:object-cover"
                    sizes="(max-width: 640px) 100vw, 300px"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/55 sm:bg-gradient-to-l" />
                </div>
                <div className="relative flex flex-1 flex-col justify-center px-5 py-4 sm:py-5">
                  <div className="text-[10px] tracking-[0.16em] uppercase text-[rgba(255,247,226,0.72)]">
                    {lang === "en" ? "Easy process" : "Proceso sencillo"}
                  </div>
                  <p className="mt-1.5 text-sm text-[rgba(255,247,226,0.88)] leading-snug">{processLead}</p>
                  <ol className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-[11px] text-[rgba(255,255,255,0.78)]">
                    <li className="flex items-center gap-1.5">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[rgba(201,168,74,0.25)] text-[10px] font-bold text-[rgba(201,168,74,0.95)]">
                        1
                      </span>
                      {step1}
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[rgba(201,168,74,0.25)] text-[10px] font-bold text-[rgba(201,168,74,0.95)]">
                        2
                      </span>
                      {step2}
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[rgba(201,168,74,0.25)] text-[10px] font-bold text-[rgba(201,168,74,0.95)]">
                        3
                      </span>
                      {step3}
                    </li>
                  </ol>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 border-t border-[rgba(255,255,255,0.08)] bg-black/25 px-3 py-3">
                {[
                  { src: tiendaHeroAssets.thumbFlyers, labelEn: "Flyers", labelEs: "Volantes" },
                  { src: tiendaHeroAssets.thumbBrochures, labelEn: "Brochures", labelEs: "Brochures" },
                  { src: tiendaHeroAssets.thumbStickers, labelEn: "Stickers", labelEs: "Stickers" },
                ].map((t) => (
                  <div key={t.labelEn} className="relative overflow-hidden rounded-2xl border border-[rgba(255,255,255,0.10)]">
                    <div className="relative aspect-[4/3] w-full">
                      <Image
                        src={t.src}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="120px"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                      <span className="absolute bottom-1.5 left-2 right-2 text-[10px] font-semibold text-white/95">
                        {lang === "en" ? t.labelEn : t.labelEs}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
