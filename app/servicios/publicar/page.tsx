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

export default async function ServiciosPublicarPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    if (v == null) continue;
    if (Array.isArray(v)) {
      for (const x of v) p.append(k, x);
    } else {
      p.set(k, v);
    }
  }
  if (!p.has("lang")) p.set("lang", "es");
  redirect(`/clasificados/publicar/servicios?${p.toString()}`);
}
