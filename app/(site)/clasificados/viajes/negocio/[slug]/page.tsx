import type { Metadata } from "next";
import { notFound } from "next/navigation";

import Navbar from "@/app/components/Navbar";
import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { appendLangToPath } from "@/app/clasificados/lib/hubUrl";

import { ViajesLangSwitch } from "../../components/ViajesLangSwitch";
import { ViajesNegocioProfileLayout } from "../../components/ViajesNegocioProfileLayout";
import { getViajesNegocioProfileBySlug, VIAJES_NEGOCIO_SLUGS } from "../../data/viajesNegocioProfileSampleData";
import { getViajesUi } from "../../data/viajesUiCopy";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function pickLang(sp: Record<string, string | string[] | undefined>): Lang {
  const v = sp.lang;
  const raw = Array.isArray(v) ? v[0] : v;
  return raw === "en" ? "en" : "es";
}

export function generateStaticParams() {
  return VIAJES_NEGOCIO_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = getViajesNegocioProfileBySlug(slug);
  if (!p) return { title: "Negocio | Leonix Viajes" };
  return {
    title: `${p.businessName} | Leonix Viajes`,
    description: p.tagline,
  };
}

export default async function ClasificadosViajesNegocioPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const profile = getViajesNegocioProfileBySlug(slug);
  if (!profile) notFound();

  const sp = await searchParams;
  const lang = pickLang(sp);
  const ui = getViajesUi(lang);
  const backHref = appendLangToPath("/clasificados/viajes/resultados", lang);

  return (
    <div className="min-h-screen bg-[color:var(--lx-page)] text-[color:var(--lx-text)]">
      <Navbar />
      <div className="border-b border-[color:var(--lx-nav-border)] bg-[color:var(--lx-nav-bg)] px-4 py-2 sm:px-5">
        <div className="mx-auto flex max-w-7xl justify-end">
          <ViajesLangSwitch compact />
        </div>
      </div>
      <ViajesNegocioProfileLayout profile={profile} backHref={backHref} backLabel={ui.backToResults} ui={ui} />
    </div>
  );
}
