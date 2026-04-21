import type { Metadata } from "next";
import { LEONIX_MEDIA_SITE_NAME } from "@/app/lib/leonixBrand";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  const segment = "Anuncio";
  const description =
    "Detalle del anuncio en Leonix Media: fotos, descripción y contacto — clasificados y visibilidad local bajo Leonix Global LLC.";

  return {
    title: segment,
    description,
    keywords: [
      "Leonix Media",
      "clasificados",
      "anuncio",
      "Northern California",
      "Bay Area",
      "local discovery",
    ],
    alternates: {
      canonical: `/clasificados/anuncio/${id}`,
    },
    openGraph: {
      title: `${segment} | ${LEONIX_MEDIA_SITE_NAME}`,
      description,
      url: `/clasificados/anuncio/${id}`,
      siteName: LEONIX_MEDIA_SITE_NAME,
      type: "article",
    },
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
