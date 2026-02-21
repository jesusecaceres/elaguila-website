import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Clasificados",
  description: "Explora anuncios locales y descubre oportunidades en tu comunidad — LEONIX Clasificados.",
  alternates: {
    canonical: "/clasificados",
  },
  openGraph: {
    title: "Clasificados — LEONIX",
    description: "Explora anuncios locales y descubre oportunidades en tu comunidad — LEONIX Clasificados.",
    url: "/clasificados",
    siteName: "LEONIX",
    type: "website",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
