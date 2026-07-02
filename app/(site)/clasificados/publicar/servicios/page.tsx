import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Publicar · Servicios · Leonix Clasificados",
  description:
    "Crea el perfil premium de tu negocio en Servicios Leonix: tipo de negocio, servicios, medios y contacto.",
  alternates: {
    canonical: "/clasificados/publicar/servicios",
  },
  openGraph: {
    title: "Publicar · Servicios · Leonix",
    description: "Perfil de negocio guiado para Servicios en Leonix Clasificados.",
    url: "/clasificados/publicar/servicios",
    siteName: "LEONIX",
    type: "website",
  },
};

export default function ClasificadosPublicarServiciosPage() {
  redirect("/clasificados/publicar/servicios/checkpoint");
}
