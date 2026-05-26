import type { Metadata } from "next";
import Link from "next/link";
import {
  BR_PUBLICAR_NEGOCIO_SELECTOR,
  BR_PUBLICAR_PRIVADO,
} from "@/app/clasificados/bienes-raices/shared/constants/brPublishRoutes";

type Lang = "es" | "en";

const COPY = {
  es: {
    title: "Publicar en Bienes Raíces",
    body: "Dos caminos claros: particular (privado) o perfil profesional (negocio). Ambos pagan por publicación en este lanzamiento.",
    particularKicker: "Particular",
    particularTitle: "Privado",
    particularBody: "Para dueños y anuncios personales.",
    proKicker: "Profesional",
    proTitle: "Negocio",
    proBody: "Agentes, equipos, oficinas y desarrolladores.",
  },
  en: {
    title: "Publish in Real Estate",
    body: "Two clear paths: individual (private) or professional profile (business). Both are paid per listing in this launch.",
    particularKicker: "Individual",
    particularTitle: "Private",
    particularBody: "For owners and personal listings.",
    proKicker: "Professional",
    proTitle: "Business",
    proBody: "Agents, teams, offices, and developers.",
  },
} as const;

export const metadata: Metadata = {
  title: "Publicar Bienes Raíces | Leonix Clasificados",
  description: "Elige si publicas como particular o negocio profesional.",
};

type PageProps = {
  searchParams?: Promise<{ lang?: string }>;
};

export default async function BienesRaicesPublicarHubPage(props: PageProps) {
  const sp = props.searchParams ? await props.searchParams : {};
  const lang: Lang = sp.lang === "en" ? "en" : "es";
  const t = COPY[lang];

  const withLang = (path: string) => {
    const joiner = path.includes("?") ? "&" : "?";
    return `${path}${joiner}lang=${lang}`;
  };

  return (
    <main className="min-h-screen bg-[#F6F0E2] px-4 pb-20 pt-28 text-[#2C2416]">
      <div className="mx-auto max-w-lg">
        <h1 className="text-3xl font-extrabold text-[#1E1810]">{t.title}</h1>
        <p className="mt-2 text-sm text-[#5C5346]/88">
          {t.body}
        </p>
        <div className="mt-8 space-y-4">
          <Link
            href={withLang(BR_PUBLICAR_PRIVADO)}
            className="block rounded-2xl border border-[#E8DFD0] bg-[#FFFCF7] p-5 shadow-sm transition hover:border-[#C9B46A]/50"
          >
            <p className="text-xs font-bold uppercase tracking-wide text-[#B8954A]">{t.particularKicker}</p>
            <p className="mt-1 text-lg font-bold text-[#1E1810]">{t.particularTitle}</p>
            <p className="mt-1 text-sm text-[#5C5346]/85">{t.particularBody}</p>
          </Link>
          <Link
            href={withLang(BR_PUBLICAR_NEGOCIO_SELECTOR)}
            className="block rounded-2xl border border-[#C9B46A]/45 bg-gradient-to-br from-[#FFF6E7] to-[#FFFCF7] p-5 shadow-md transition hover:border-[#B8954A]"
          >
            <p className="text-xs font-bold uppercase tracking-wide text-[#B8954A]">{t.proKicker}</p>
            <p className="mt-1 text-lg font-bold text-[#1E1810]">{t.proTitle}</p>
            <p className="mt-1 text-sm text-[#5C5346]/85">{t.proBody}</p>
          </Link>
        </div>
      </div>
    </main>
  );
}
