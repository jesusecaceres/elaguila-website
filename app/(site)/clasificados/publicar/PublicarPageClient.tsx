"use client";

import type { ComponentType } from "react";
import { useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import {
  FiBook,
  FiBriefcase,
  FiCoffee,
  FiHome,
  FiLayers,
  FiMapPin,
  FiShoppingCart,
  FiTool,
  FiTruck,
  FiUsers,
} from "react-icons/fi";
import { BR_PUBLICAR_HUB } from "@/app/clasificados/bienes-raices/shared/constants/brPublishRoutes";
import { categoryConfig, type CategoryKey } from "@/app/clasificados/config/categoryConfig";
import { LEONIX_CATEGORY_VISUALS } from "@/app/clasificados/config/categoryVisuals";
import newLogo from "../../../../public/logo.png";
import { withLangParam } from "@/app/clasificados/autos/negocios/lib/autosNegociosLang";

type Lang = "es" | "en";

type ChooserDeepLinkTarget = Exclude<CategoryKey, "all"> | "bienes-raices" | "";

const CHOOSER_CATEGORIES: Array<{
  key: Exclude<CategoryKey, "all">;
  Icon: ComponentType<{ className?: string }>;
}> = [
  { key: "en-venta", Icon: FiShoppingCart },
  { key: "rentas", Icon: FiHome },
  { key: "autos", Icon: FiTruck },
  { key: "restaurantes", Icon: FiCoffee },
  { key: "servicios", Icon: FiTool },
  { key: "empleos", Icon: FiBriefcase },
  { key: "clases", Icon: FiBook },
  { key: "comunidad", Icon: FiUsers },
  { key: "travel", Icon: FiMapPin },
];

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

/** Deep-link from hub/login (`?cat=` / `?categoria=`): forward to the right publish entry route (no wizard hosted here). */
function normalizeChooserDeepLink(raw: string | null | undefined): ChooserDeepLinkTarget {
  const v = (raw ?? "").trim().toLowerCase();
  if (!v) return "";
  if (v === "bienes-raices" || v === "br") return "bienes-raices";
  const mapped = v === "viajes" ? "travel" : v;
  if (mapped === "all") return "";
  const keys = Object.keys(categoryConfig) as CategoryKey[];
  if (!keys.includes(mapped as CategoryKey)) return "";
  return mapped as Exclude<CategoryKey, "all">;
}

export default function PublicarPageClient({
  chooserKeys,
}: {
  chooserKeys: Array<Exclude<CategoryKey, "all">>;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const lang: Lang = searchParams?.get("lang") === "en" ? "en" : "es";
  const otherLang: Lang = lang === "es" ? "en" : "es";
  const qs = new URLSearchParams(searchParams?.toString() ?? "");
  qs.set("lang", otherLang);
  const toggleHref = `/clasificados/publicar?${qs.toString()}`;

  const allowed = useMemo(() => new Set(chooserKeys), [chooserKeys]);
  const gridCategories = useMemo(
    () => CHOOSER_CATEGORIES.filter(({ key }) => allowed.has(key)),
    [allowed]
  );

  const deepLinkCat = normalizeChooserDeepLink(searchParams?.get("cat") || searchParams?.get("categoria"));
  const deepLinkDoneRef = useRef(false);
  useEffect(() => {
    if (!deepLinkCat || deepLinkDoneRef.current) return;
    deepLinkDoneRef.current = true;
    const p = new URLSearchParams(searchParams?.toString() ?? "");
    p.delete("cat");
    p.delete("categoria");
    if (!p.get("lang")) p.set("lang", lang);
    const dest =
      deepLinkCat === "bienes-raices"
        ? `${BR_PUBLICAR_HUB}?${p.toString()}`
        : deepLinkCat === "autos"
          ? `/publicar/autos?${p.toString()}`
          : deepLinkCat === "servicios"
            ? `/clasificados/publicar/servicios?${p.toString()}`
            : deepLinkCat === "restaurantes"
              ? `/publicar/restaurantes?${p.toString()}`
              : `/clasificados/publicar/${deepLinkCat}?${p.toString()}`;
    router.replace(dest);
  }, [deepLinkCat, lang, router, searchParams]);

  const copy = {
    title: lang === "es" ? "Publicar anuncio" : "Post a listing",
    subtitle:
      lang === "es"
        ? "Elige una categoría para continuar."
        : "Choose a category to continue.",
    back: lang === "es" ? "Volver a Clasificados" : "Back to Classifieds",
    langToggle: lang === "es" ? "English" : "Español",
  };

  return (
    <main className="min-h-screen bg-[#F6F0E2] text-[#3D2C12] pt-28 pb-16">
      <div className="mx-auto max-w-6xl px-6">
        <section className="rounded-3xl border border-[#D8C79A]/70 bg-[#FFFDF7] p-6 shadow-[0_18px_48px_rgba(113,84,22,0.10)] sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <Image src={newLogo} alt="LEONIX" width={180} className="h-auto w-[150px] sm:w-[180px]" />
              <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-[#3D2C12] sm:text-5xl">{copy.title}</h1>
              <p className="mt-2 max-w-2xl text-base text-[#5D4A25]/85 sm:text-lg">{copy.subtitle}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2 self-start rounded-xl border border-[#D8C79A]/65 bg-[#FFF6E7] p-1.5 shadow-sm">
              <Link
                href={toggleHref}
                className="rounded-lg border border-[#D8C79A]/70 bg-[#FFFCF4] px-4 py-2 text-sm font-semibold text-[#3D2C12] hover:bg-[#FFF0DA]"
              >
                {copy.langToggle}
              </Link>
              <Link
                href={`/clasificados?lang=${lang}`}
                className="rounded-lg border border-[#B28A2F]/45 bg-[#B28A2F]/12 px-4 py-2 text-sm font-semibold text-[#6E4E18] hover:bg-[#B28A2F]/20"
              >
                {copy.back}
              </Link>
            </div>
          </div>

          {/* Mobile-only: primary Bienes Raíces publish lane above the category grid. */}
          <div className="mt-6 md:hidden">
            <div className="overflow-hidden rounded-3xl border-2 border-[#C9B46A]/70 bg-gradient-to-br from-[#2A2620] via-[#352F28] to-[#1E1810] p-5 shadow-[0_24px_56px_rgba(24,20,16,0.4)]">
              <p className="text-center text-[11px] font-bold uppercase tracking-[0.18em] text-[#C5A059]">
                {lang === "es" ? "Publicar · destacado" : "Post · featured"}
              </p>
              <h2 className="mt-2 text-center text-2xl font-extrabold tracking-tight text-[#FAF7F2]">
                🏘️ {lang === "es" ? "Bienes Raíces" : "Real estate"}
              </h2>
              <p className="mt-2 text-center text-sm font-medium leading-relaxed text-[#E8DFD0]/92">
                {lang === "es"
                  ? "Profesional (Negocio) o particular (Privado). Toca para elegir tu camino."
                  : "Professional (Business) or private seller. Tap to pick your path."}
              </p>
              <Link
                href={`${BR_PUBLICAR_HUB}?lang=${lang}`}
                className="mt-5 flex min-h-[56px] w-full items-center justify-center rounded-2xl border-2 border-[#E8D9A8]/45 bg-gradient-to-br from-[#B8954A] to-[#8A6F3A] px-4 py-3.5 text-center text-base font-extrabold text-[#1E1810] shadow-lg active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-[#FAF7F2]/40 focus:ring-offset-2 focus:ring-offset-[#2A2620]"
              >
                ✨ {lang === "es" ? "Entrar a publicar BR" : "Continue to BR posting"}
              </Link>
              <p className="mt-3 text-center text-xs text-[#C9B89A]/90">
                {lang === "es" ? "Privado + Negocio · un solo toque" : "Private + Business · one tap"}
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 md:mt-7 lg:grid-cols-3">
            <Link
              href={`${BR_PUBLICAR_HUB}?lang=${lang}`}
              className={cx(
                "hidden md:block group relative overflow-hidden rounded-2xl border bg-gradient-to-br px-4 py-4 transition-all duration-150",
                "focus:outline-none focus:ring-2 focus:ring-[#A98C2A]/35",
                LEONIX_CATEGORY_VISUALS["bienes-raices"].tint,
                LEONIX_CATEGORY_VISUALS["bienes-raices"].border,
                LEONIX_CATEGORY_VISUALS["bienes-raices"].glow
              )}
            >
              <span
                className={`inline-flex w-fit items-center rounded-full px-2.5 py-1 text-[11px] font-semibold text-[#3D2C12] ${LEONIX_CATEGORY_VISUALS["bienes-raices"].chipBg}`}
              >
                {LEONIX_CATEGORY_VISUALS["bienes-raices"].emoji}
              </span>
              <div className="mt-2 flex items-center gap-2">
                <FiLayers className="h-5 w-5 shrink-0 text-[#5D4A25]" aria-hidden />
                <span className="text-sm font-bold leading-tight text-[#3D2C12]">
                  {LEONIX_CATEGORY_VISUALS["bienes-raices"].emoji}{" "}
                  {lang === "es" ? "Bienes Raíces" : "Real estate"}
                </span>
              </div>
              <span className="mt-1 text-xs font-medium text-[#5D4A25]/80">
                {lang === "es" ? "Continuar" : "Continue"}
              </span>
              <span className="pointer-events-none absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100 bg-white/20" />
            </Link>
            {gridCategories.map(({ key, Icon }) => {
              const label = categoryConfig[key].label[lang];
              const visual = LEONIX_CATEGORY_VISUALS[key];
              const href =
                key === "autos"
                  ? withLangParam("/publicar/autos", lang)
                  : key === "servicios"
                    ? `/clasificados/publicar/servicios?lang=${lang}`
                    : key === "restaurantes"
                      ? withLangParam("/publicar/restaurantes", lang)
                      : key === "empleos"
                        ? `/clasificados/publicar/empleos?lang=${lang}`
                        : `/clasificados/publicar/${key}?lang=${lang}`;
              return (
                <Link
                  key={key}
                  href={href}
                  className={cx(
                    "group relative overflow-hidden rounded-2xl border bg-gradient-to-br px-4 py-4 transition-all duration-150",
                    "focus:outline-none focus:ring-2 focus:ring-[#A98C2A]/35",
                    visual.tint,
                    visual.border,
                    visual.glow
                  )}
                >
                  <span className={`inline-flex w-fit items-center rounded-full px-2.5 py-1 text-[11px] font-semibold text-[#3D2C12] ${visual.chipBg}`}>
                    {visual.emoji}
                  </span>
                  <div className="mt-2 flex items-center gap-2">
                    <Icon className="h-5 w-5 shrink-0 text-[#5D4A25]" aria-hidden />
                    <span className="text-sm font-bold leading-tight text-[#3D2C12]">
                      {visual.emoji} {label}
                    </span>
                  </div>
                  <span className="mt-1 text-xs font-medium text-[#5D4A25]/80">
                    {lang === "es" ? "Continuar" : "Continue"}
                  </span>
                  <span className="pointer-events-none absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100 bg-white/20" />
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
