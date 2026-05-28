import type { Metadata } from "next";
import { LEONIX_MEDIA_SITE_NAME } from "@/app/lib/leonixBrand";
import { fetchListingHeadMetadata } from "@/app/lib/seo/fetchListingHeadMetadata";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const canonical = `/clasificados/anuncio/${id}`;
  const row = await fetchListingHeadMetadata(id);

  if (!row) {
    const fallbackTitle = "Anuncio no disponible";
    const fallbackDescription =
      "Este anuncio no está disponible o no es público en Leonix Media.";
    return {
      title: fallbackTitle,
      description: fallbackDescription,
      robots: { index: false, follow: false },
      alternates: { canonical },
      openGraph: {
        title: `${fallbackTitle} | ${LEONIX_MEDIA_SITE_NAME}`,
        description: fallbackDescription,
        url: canonical,
        siteName: LEONIX_MEDIA_SITE_NAME,
        type: "article",
      },
      twitter: {
        card: "summary_large_image",
        title: `${fallbackTitle} | ${LEONIX_MEDIA_SITE_NAME}`,
        description: fallbackDescription,
      },
    };
  }

  const title = row.title;
  const description =
    row.description ||
    "Anuncio en Leonix Media: fotos, descripción y contacto — clasificados y visibilidad local bajo Leonix Global LLC.";

  const ogImages = row.imageUrl
    ? [{ url: row.imageUrl, alt: title }]
    : [{ url: "/logo.png", width: 1200, height: 630, alt: `${LEONIX_MEDIA_SITE_NAME} logo` }];

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title: `${title} | ${LEONIX_MEDIA_SITE_NAME}`,
      description,
      url: canonical,
      siteName: LEONIX_MEDIA_SITE_NAME,
      type: "article",
      images: ogImages,
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${LEONIX_MEDIA_SITE_NAME}`,
      description,
      images: ogImages.map((im) => im.url),
    },
    other: row.leonixAdId ? { leonix_ad_id: row.leonixAdId } : undefined,
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
