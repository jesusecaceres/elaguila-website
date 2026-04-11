import type { Metadata } from "next";
import Link from "next/link";
import {
  RENTAS_PUBLICAR_NEGOCIO,
  RENTAS_PUBLICAR_PRIVADO,
} from "@/app/clasificados/rentas/shared/utils/rentasPublishRoutes";
import { normalizeRentasLandingLang, withRentasLandingLang } from "@/app/clasificados/rentas/rentasLandingLang";

export const metadata: Metadata = {
  title: "Publicar Rentas | Leonix Clasificados",
  description: "Elige publicar como particular o con perfil comercial.",
};

type PageProps = { searchParams: Promise<{ lang?: string }> };

export default async function RentasPublicarHubPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const lang = normalizeRentasLandingLang(sp.lang);
  const privadoHref = withRentasLandingLang(RENTAS_PUBLICAR_PRIVADO, lang);
  const negocioHref = withRentasLandingLang(RENTAS_PUBLICAR_NEGOCIO, lang);
  const publicarChooserHref = `/clasificados/publicar?lang=${lang}`;

  return (
    <main className="min-h-screen bg-[#F6F0E2] px-4 pb-20 pt-28 text-[#2C2416]">
      <div className="mx-auto max-w-lg">
        <nav className="mb-6 text-sm">
          <Link href={publicarChooserHref} className="font-semibold text-[#B8954A] underline decoration-[#B8954A]/40">
            {lang === "es" ? "← Publicar" : "← Post a listing"}
          </Link>
        </nav>
        <h1 className="text-3xl font-extrabold text-[#1E1810]">
          {lang === "es" ? "Publicar en Rentas" : "Post a rental"}
        </h1>
        <p className="mt-2 text-sm text-[#5C5346]/88">
          {lang === "es"
            ? "Dos caminos: particular (privado) o negocio. La vista previa y el formulario dependen de tu elección."
            : "Two paths: private seller or business. Preview and form fields follow your choice."}
        </p>
        <div className="mt-8 space-y-4">
          <Link
            href={privadoHref}
            className="block rounded-2xl border border-[#E8DFD0] bg-[#FFFCF7] p-5 shadow-sm transition hover:border-[#C9B46A]/50"
          >
            <p className="text-xs font-bold uppercase tracking-wide text-[#B8954A]">{lang === "es" ? "Particular" : "Private"}</p>
            <p className="mt-1 text-lg font-bold text-[#1E1810]">{lang === "es" ? "Privado" : "Private seller"}</p>
            <p className="mt-1 text-sm text-[#5C5346]/85">
              {lang === "es" ? "Para dueños y anuncios personales en renta." : "For owners and personal rental listings."}
            </p>
          </Link>
          <Link
            href={negocioHref}
            className="block rounded-2xl border border-[#C9B46A]/45 bg-gradient-to-br from-[#FFF6E7] to-[#FFFCF7] p-5 shadow-md transition hover:border-[#B8954A]"
          >
            <p className="text-xs font-bold uppercase tracking-wide text-[#B8954A]">{lang === "es" ? "Profesional" : "Business"}</p>
            <p className="mt-1 text-lg font-bold text-[#1E1810]">{lang === "es" ? "Negocio" : "Business"}</p>
            <p className="mt-1 text-sm text-[#5C5346]/85">
              {lang === "es" ? "Agentes, brokers y cuentas comerciales." : "Agents, brokers, and commercial accounts."}
            </p>
          </Link>
        </div>
      </div>
    </main>
  );
}
