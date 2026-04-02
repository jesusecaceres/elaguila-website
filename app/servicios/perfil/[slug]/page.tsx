import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ServiciosProfileView } from "../../components/ServiciosProfileView";
import { getServiciosProfileBySlug } from "../../data/demoServiciosBusinessProfile";
import type { ServiciosLang } from "../../types/serviciosBusinessProfile";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ lang?: string }>;
};

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const { slug } = await props.params;
  const sp = (await props.searchParams) ?? {};
  const lang: ServiciosLang = sp.lang === "en" ? "en" : "es";
  const profile = getServiciosProfileBySlug(slug, lang);
  const title = `${profile.businessName} · Leonix Servicios`;
  return {
    title,
    description:
      profile.aboutText?.slice(0, 155) ||
      `${profile.businessName} — servicios locales verificados en Leonix.`,
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

  const profile = getServiciosProfileBySlug(slug, lang);

  return <ServiciosProfileView profile={profile} lang={lang} />;
}
