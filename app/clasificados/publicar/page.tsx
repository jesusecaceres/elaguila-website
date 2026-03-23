"use client";

import type { ComponentType } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
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
import { categoryConfig, type CategoryKey } from "@/app/clasificados/config/categoryConfig";

type Lang = "es" | "en";

const CHOOSER_CATEGORIES: Array<{
  key: Exclude<CategoryKey, "all">;
  Icon: ComponentType<{ className?: string }>;
}> = [
  { key: "en-venta", Icon: FiShoppingCart },
  { key: "bienes-raices", Icon: FiLayers },
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

/**
 * Category selection only for `/clasificados/publicar`.
 * Each card links to the category-owned publish route; auth/session is enforced on the destination.
 */
export default function PublicarRootPage() {
  const searchParams = useSearchParams();
  const lang: Lang = searchParams?.get("lang") === "en" ? "en" : "es";
  const otherLang: Lang = lang === "es" ? "en" : "es";
  const qs = new URLSearchParams(searchParams?.toString() ?? "");
  qs.set("lang", otherLang);
  const toggleHref = `/clasificados/publicar?${qs.toString()}`;

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
    <main className="min-h-screen bg-[#D9D9D9] text-[#111111] pt-28 pb-16">
      <div className="max-w-4xl mx-auto px-6">
        <div className="rounded-2xl border border-black/10 bg-[#F5F5F5] p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-[#111111] text-center sm:text-left">
                {copy.title}
              </h1>
              <p className="mt-2 text-[#111111]/80 text-center sm:text-left max-w-xl">{copy.subtitle}</p>
            </div>
            <Link
              href={toggleHref}
              className="shrink-0 self-center sm:self-start rounded-xl border border-black/15 bg-white px-4 py-2 text-sm font-semibold text-[#111111] hover:bg-[#E8E8E8]"
            >
              {copy.langToggle}
            </Link>
          </div>

          <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-3">
            {CHOOSER_CATEGORIES.map(({ key, Icon }) => {
              const label = categoryConfig[key].label[lang];
              const href = `/clasificados/publicar/${key}?lang=${lang}`;
              return (
                <Link
                  key={key}
                  href={href}
                  className={cx(
                    "flex flex-col items-center justify-center gap-2 rounded-xl border py-4 px-3 transition-colors",
                    "border-black/10 bg-white text-[#111111] hover:bg-[#F5F5F5] active:bg-[#EFEFEF]",
                    "focus:outline-none focus:ring-2 focus:ring-[#A98C2A]/30"
                  )}
                >
                  <Icon className="h-7 w-7 shrink-0 text-[#111111]" aria-hidden />
                  <span className="text-sm font-medium leading-tight text-center">{label}</span>
                </Link>
              );
            })}
          </div>

          <div className="mt-8 flex justify-center">
            <Link
              href={`/clasificados?lang=${lang}`}
              className="text-sm font-semibold text-[#111111]/80 underline hover:text-[#111111]"
            >
              {copy.back}
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
