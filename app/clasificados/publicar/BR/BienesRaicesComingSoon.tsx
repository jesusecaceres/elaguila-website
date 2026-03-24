import Link from "next/link";

type Lane = "negocio" | "privado";
type Lang = "es" | "en";

const COPY: Record<
  Lane,
  Record<Lang, { title: string; status: string; body: string }>
> = {
  negocio: {
    es: {
      title: "Bienes Raíces — Negocio o profesional",
      status: "Próximamente",
      body: "Esta experiencia se está reconstruyendo. La publicación para esta ruta aún no está disponible.",
    },
    en: {
      title: "Real Estate — Business or professional",
      status: "Coming soon",
      body: "This experience is being rebuilt. Posting for this route is not available yet.",
    },
  },
  privado: {
    es: {
      title: "Bienes Raíces — Vendedor particular",
      status: "Próximamente",
      body: "Esta experiencia se está reconstruyendo. La publicación para esta ruta aún no está disponible.",
    },
    en: {
      title: "Real Estate — Private seller",
      status: "Coming soon",
      body: "This experience is being rebuilt. Posting for this route is not available yet.",
    },
  },
};

export default function BienesRaicesComingSoon({ lane, lang }: { lane: Lane; lang: Lang }) {
  const t = COPY[lane][lang];
  const chooserHref = `/clasificados/bienes-raices?lang=${lang}`;
  const publicarHref = `/clasificados/publicar?lang=${lang}`;

  return (
    <main className="min-h-screen bg-[#D9D9D9] px-6 pb-16 pt-28 text-[#111111]">
      <div className="mx-auto max-w-lg">
        <div className="rounded-2xl border border-black/10 bg-[#F5F5F5] p-6 shadow-sm sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#111111]/50">Leonix Clasificados</p>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-[#111111]">{t.title}</h1>
          <p className="mt-3 inline-block rounded-full border border-[#C9B46A]/50 bg-[#FAF7EF] px-3 py-1 text-sm font-semibold text-[#111111]">
            {t.status}
          </p>
          <p className="mt-4 text-sm leading-relaxed text-[#111111]/85">{t.body}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              href={chooserHref}
              className="inline-flex items-center justify-center rounded-xl border border-black/15 bg-white px-4 py-3 text-sm font-semibold text-[#111111] hover:bg-[#EFEFEF]"
            >
              {lang === "es" ? "Volver al selector de Bienes Raíces" : "Back to Real Estate chooser"}
            </Link>
            <Link
              href={publicarHref}
              className="inline-flex items-center justify-center rounded-xl border border-black/10 bg-[#111111] px-4 py-3 text-sm font-semibold text-white hover:opacity-95"
            >
              {lang === "es" ? "Publicar (categorías)" : "Post (categories)"}
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
