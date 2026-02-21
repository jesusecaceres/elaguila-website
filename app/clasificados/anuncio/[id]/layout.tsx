import type { Metadata } from "next";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  const title = "Anuncio";
  const description =
    "Detalles del anuncio en LEONIX Clasificados. Explora información, fotos y contacto.";

  return {
    title: `${title} — LEONIX Clasificados`,
    description,
    alternates: {
      canonical: `/clasificados/anuncio/${id}`,
    },
    openGraph: {
      title: `${title} — LEONIX Clasificados`,
      description,
      url: `/clasificados/anuncio/${id}`,
      siteName: "LEONIX Clasificados",
      type: "article",
    },
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
