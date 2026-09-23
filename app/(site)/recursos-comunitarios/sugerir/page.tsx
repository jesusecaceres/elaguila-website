import type { Metadata } from "next";
import Link from "next/link";
import { normalizeLang } from "@/app/lib/language";

export const metadata: Metadata = {
  title: "Sugerir un recurso / Suggest a resource",
  robots: { index: false, follow: false },
};

export default async function RecursosSugerirPage({
  searchParams,
}: {
  searchParams?: Promise<{ lang?: string }>;
}) {
  const lang = normalizeLang((await searchParams)?.lang);
  const es = lang !== "en";
  return (
    <main className="mx-auto max-w-2xl px-4 pb-20 pt-24 text-[#1F241C]">
      <h1 className="font-serif text-3xl font-bold text-[#2A4536]">
        {es ? "Sugerir un recurso comunitario" : "Suggest a community resource"}
      </h1>
      <p className="mt-4 text-sm leading-relaxed text-[#3D3428]">
        {es
          ? "Los recursos comunitarios de Leonix son verificados por el equipo. El público no puede publicar un recurso automáticamente."
          : "Leonix community resources are staff-verified. The public cannot auto-publish a resource."}
      </p>
      <p className="mt-3 text-sm leading-relaxed text-[#3D3428]">
        {es
          ? "Si conoces una organización de ayuda real, envía los datos a Leonix. Un miembro del equipo lo revisará antes de mostrarlo."
          : "If you know a real help organization, send the details to Leonix. A staff member will review it before it appears."}
      </p>
      <Link
        href={es ? "/recursos-comunitarios?lang=es" : "/recursos-comunitarios?lang=en"}
        className="mt-8 inline-flex min-h-[44px] items-center rounded-full bg-[#7A1E2C] px-6 text-sm font-bold text-white"
      >
        {es ? "Volver al directorio" : "Back to the directory"}
      </Link>
    </main>
  );
}
