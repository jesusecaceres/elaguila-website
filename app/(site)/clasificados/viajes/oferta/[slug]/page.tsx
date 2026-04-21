import type { Metadata } from "next";
import { notFound } from "next/navigation";

import Navbar from "@/app/components/Navbar";
import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { appendLangToPath } from "@/app/clasificados/lib/hubUrl";

import { ViajesLangSwitch } from "../../components/ViajesLangSwitch";
import { ViajesOfferDetailLayout } from "../../components/ViajesOfferDetailLayout";
import { getViajesOfferDetailBySlug, VIAJES_OFFER_SLUGS } from "../../data/viajesOfferDetailSampleData";
import { getViajesUi } from "../../data/viajesUiCopy";
import { resolveViajesOfferBack } from "../../lib/viajesOfferLink";
import { resolveViajesOfferDetailFromStagedSlug } from "../../lib/resolveViajesOfferDetailFromStagedServer";

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
  return VIAJES_OFFER_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { slug } = await params;
  const sp = await searchParams;
  const lang = pickLang(sp);
  const staged = await resolveViajesOfferDetailFromStagedSlug(slug, lang);
  const offer = staged ?? getViajesOfferDetailBySlug(slug);
  if (!offer) return { title: "Oferta | Leonix Viajes" };
  return {
    title: `${offer.title} | Leonix Viajes`,
    description: offer.description.slice(0, 155),
  };
}

export default async function ClasificadosViajesOfertaPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  const lang = pickLang(sp);
  const staged = await resolveViajesOfferDetailFromStagedSlug(slug, lang);
  const offer = staged ?? getViajesOfferDetailBySlug(slug);
  if (!offer) notFound();
  const ui = getViajesUi(lang);
  const fallback = appendLangToPath("/clasificados/viajes", lang);
  const { href: backHref, label: backLabel } = resolveViajesOfferBack(sp.back, fallback, lang);
  const exploreViajesHref = appendLangToPath("/clasificados/viajes", lang);

  return (
    <div className="min-h-screen bg-[color:var(--lx-page)] text-[color:var(--lx-text)]">
      <Navbar />
      <div className="border-b border-[color:var(--lx-nav-border)] bg-[color:var(--lx-nav-bg)] px-4 py-2 sm:px-5">
        <div className="mx-auto flex max-w-7xl justify-end">
          <ViajesLangSwitch compact />
        </div>
      </div>
      <ViajesOfferDetailLayout
        offer={offer}
        backHref={backHref}
        backLabel={backLabel}
        ui={ui}
        exploreViajesHref={exploreViajesHref}
      />
    </div>
  );
}
