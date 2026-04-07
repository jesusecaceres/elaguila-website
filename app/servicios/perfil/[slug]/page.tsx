import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ServiciosProfileView } from "../../components/ServiciosProfileView";
import { getServiciosProfileBySlug } from "../../data/demoServiciosBusinessProfile";
import { resolveServiciosProfile } from "../../lib/resolveServiciosProfile";
import type { ServiciosLang } from "../../types/serviciosBusinessProfile";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ lang?: string }>;
};

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const { slug } = await props.params;
  const sp = (await props.searchParams) ?? {};
  const lang: ServiciosLang = sp.lang === "en" ? "en" : "es";
  const raw = getServiciosProfileBySlug(slug, lang);
  const profile = resolveServiciosProfile(raw, lang);
  const title = `${profile.identity.businessName} · Leonix Servicios`;
  return {
    title,
    description:
      profile.about?.text?.slice(0, 155) ||
      `${profile.identity.businessName} — servicios locales verificados en Leonix.`,
    openGraph: {
      title,
      type: "website",
    },
  };
}

export default async function ServiciosPerfilPage(props: PageProps) {
  const { slug } = await props.params;
  const sp = (await props.searchParams) ?? {};
  const lang: ServiciosLang = sp.lang === "en" ? "en" : "es";

  if (!slug || slug.length > 200) notFound();

  const raw = getServiciosProfileBySlug(slug, lang);
  const profile = resolveServiciosProfile(raw, lang);

  return <ServiciosProfileView profile={profile} lang={lang} />;
}
