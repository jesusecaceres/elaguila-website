import Link from "next/link";

export function PublishServiceCTA({ lang }: { lang: "es" | "en" }) {
  const publishHref = `/clasificados/publicar/servicios/checkpoint?lang=${lang}`;

  return (
    <section
      className="rounded-xl border border-[#D6C7AD]/90 bg-[#FFFDF7] px-4 py-5 shadow-[0_8px_24px_-16px_rgba(31,36,28,0.12)] sm:px-6"
      aria-labelledby="servicios-publish-cta-heading"
    >
      <div className="mx-auto flex max-w-[1080px] flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="min-w-0">
          <h2 id="servicios-publish-cta-heading" className="font-serif text-lg font-bold text-[#2A4536]">
            {lang === "en" ? "Offer a service?" : "¿Ofreces un servicio?"}
          </h2>
          <p className="mt-1 text-sm text-[#3D3428]/85">
            {lang === "en"
              ? "Reach people actively searching for local professionals."
              : "Llega a quien ya busca profesionales locales."}
          </p>
        </div>
        <Link href={publishHref} className="inline-flex min-h-[2.75rem] w-full items-center justify-center rounded-lg bg-[#7A1E2C] px-5 text-sm font-bold text-[#FFFDF7] hover:bg-[#5e1721] sm:w-auto">
          {lang === "en" ? "Publish your service" : "Publica tu servicio"}
        </Link>
      </div>
    </section>
  );
}
