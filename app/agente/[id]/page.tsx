import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/app/components/Navbar";
import {
  isValidPublicAgentId,
  loadPublicAgentPageData,
} from "@/app/lib/agentProfile/loadPublicAgentPageData";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ lang?: string | string[] }>;
};

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const params = await props.params;
  const id = typeof params?.id === "string" ? params.id.trim() : "";
  if (!isValidPublicAgentId(id)) {
    return { title: "Agente | Leonix" };
  }
  const data = await loadPublicAgentPageData(id);
  const name =
    data?.display.agentName ||
    data?.display.businessName ||
    data?.profile?.displayName ||
    "Agent";
  return {
    title: `${name} | Leonix Clasificados`,
    description: "Perfil público del agente o negocio.",
  };
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default async function PublicAgentProfilePage(props: PageProps) {
  const params = await props.params;
  const rawId = typeof params?.id === "string" ? params.id.trim() : "";

  const sp = props.searchParams ? await props.searchParams : {};
  const langRaw = typeof sp.lang === "string" ? sp.lang : Array.isArray(sp.lang) ? sp.lang[0] : "";
  const lang = langRaw === "en" ? "en" : "es";

  if (!isValidPublicAgentId(rawId)) {
    notFound();
  }

  const data = await loadPublicAgentPageData(rawId);
  if (!data) {
    notFound();
  }

  const d = data.display;
  const headline =
    d.agentName ||
    d.businessName ||
    (lang === "es" ? "Profesional inmobiliario" : "Real estate professional");

  const t =
    lang === "es"
      ? {
          back: "← Volver a Clasificados",
          identity: "Identidad",
          contact: "Contacto",
          office: "Teléfono de oficina",
          website: "Sitio web",
          socials: "Redes sociales",
          about: "Sobre el agente",
          serviceArea: "Zona de servicio",
          location: "Ubicación del negocio",
          hours: "Horario",
          openMap: "Abrir en mapa",
          mapAria: "Abrir ubicación en Google Maps",
          clasificadosHref: "/clasificados?lang=es",
        }
      : {
          back: "← Back to classifieds",
          identity: "Identity",
          contact: "Get in touch",
          office: "Office phone",
          website: "Website",
          socials: "Social",
          about: "About",
          serviceArea: "Service area",
          location: "Business location",
          hours: "Hours",
          openMap: "Open map",
          mapAria: "Open location in Google Maps",
          clasificadosHref: "/clasificados?lang=en",
        };

  const mapsUrl = d.mapQuery
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(d.mapQuery)}`
    : null;

  const shellClass =
    "rounded-[1.35rem] border border-[#C9B46A]/45 bg-gradient-to-b from-[#FFFCF6] to-[#F5F0E4] shadow-[0_18px_48px_-28px_rgba(17,17,17,0.35)] ring-1 ring-[#C9B46A]/20";

  return (
    <main className="min-h-screen bg-[#E8E4DC] text-[#111111]">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-24 pb-20">
        <Link
          href={t.clasificadosHref}
          className="inline-flex text-sm font-semibold text-[#3F5A43] hover:text-[#2F4A33] mb-6"
        >
          {t.back}
        </Link>

        <article className={cx(shellClass, "p-6 sm:p-9")}>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8B6914]/90 mb-3">
            {t.identity}
          </p>

          {/* 1) Header identity */}
          <header className="flex flex-col sm:flex-row sm:items-start gap-5 sm:gap-6">
            <div className="flex items-start gap-4 min-w-0 flex-1">
              {d.agentPhotoUrl ? (
                <img
                  src={d.agentPhotoUrl}
                  alt=""
                  className="h-[4.5rem] w-[4.5rem] sm:h-24 sm:w-24 rounded-2xl border border-[#C9B46A]/40 object-cover bg-white shadow-sm shrink-0"
                />
              ) : (
                <div className="h-[4.5rem] w-[4.5rem] sm:h-24 sm:w-24 rounded-2xl border border-[#C9B46A]/35 bg-white/80 flex items-center justify-center text-[#111111]/35 text-xs font-semibold shrink-0">
                  {lang === "es" ? "Foto" : "Photo"}
                </div>
              )}
              <div className="min-w-0">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111111] leading-tight tracking-tight break-words">
                  {headline}
                </h1>
                {d.agentRole ? (
                  <p className="mt-2 text-sm sm:text-base text-[#111111]/75 font-medium">{d.agentRole}</p>
                ) : null}
              </div>
            </div>

            {(d.logoUrl || d.businessName) && (
              <div className="flex items-center gap-3 sm:flex-col sm:items-end sm:text-right border-t sm:border-t-0 sm:border-l border-[#C9B46A]/25 pt-4 sm:pt-0 sm:pl-6 sm:min-w-[8.5rem]">
                {d.logoUrl ? (
                  <img
                    src={d.logoUrl}
                    alt=""
                    className="h-14 w-14 rounded-xl border border-black/10 object-cover bg-white shadow-sm"
                  />
                ) : null}
                {d.businessName ? (
                  <p className="text-sm font-bold text-[#111111] leading-snug break-words">{d.businessName}</p>
                ) : null}
              </div>
            )}
          </header>

          {/* 2) Get in touch */}
          {(d.officePhone || d.website || d.socialLinks.length > 0) && (
            <section className="mt-10 pt-8 border-t border-[#C9B46A]/25">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-[#111111]/55 mb-4">{t.contact}</h2>
              <div className="space-y-3 text-sm">
                {d.officePhone ? (
                  <p>
                    <span className="text-[#111111]/60 font-medium">{t.office}: </span>
                    <a className="font-semibold text-[#2F4A33] hover:underline" href={`tel:${d.officePhone.replace(/\D/g, "")}`}>
                      {d.officePhone}
                    </a>
                  </p>
                ) : null}
                {d.website ? (
                  <p>
                    <span className="text-[#111111]/60 font-medium">{t.website}: </span>
                    <a
                      className="font-semibold text-[#2F4A33] hover:underline break-all"
                      href={d.website}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {d.website.replace(/^https?:\/\//i, "")}
                    </a>
                  </p>
                ) : null}
                {d.socialLinks.length > 0 ? (
                  <div>
                    <p className="text-[#111111]/60 font-medium mb-2">{t.socials}</p>
                    <ul className="flex flex-wrap gap-2">
                      {d.socialLinks.map((s, i) => (
                        <li key={`${s.url}-${i}`}>
                          <a
                            href={s.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center rounded-xl border border-[#C9B46A]/40 bg-white/90 px-3 py-2 text-xs font-semibold text-[#111111] hover:bg-[#F8F4EA] transition"
                          >
                            {s.label}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            </section>
          )}

          {/* 3) About */}
          {d.about ? (
            <section className="mt-10 pt-8 border-t border-[#C9B46A]/25">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-[#111111]/55 mb-3">{t.about}</h2>
              <p className="text-sm sm:text-[0.95rem] text-[#111111]/85 leading-relaxed whitespace-pre-wrap">{d.about}</p>
            </section>
          ) : null}

          {/* 4) Service area */}
          {d.serviceAreaLines.length > 0 ? (
            <section className="mt-10 pt-8 border-t border-[#C9B46A]/25">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-[#111111]/55 mb-3">{t.serviceArea}</h2>
              <ul className="flex flex-wrap gap-2">
                {d.serviceAreaLines.map((line) => (
                  <li
                    key={line}
                    className="rounded-full border border-[#C9B46A]/35 bg-[#FAF3E4] px-3 py-1.5 text-xs font-semibold text-[#111111]"
                  >
                    {line}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {/* 5) Location + hours */}
          {(d.businessAddressLine || d.hours || mapsUrl) && (
            <section className="mt-10 pt-8 border-t border-[#C9B46A]/25">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-[#111111]/55 mb-3">{t.location}</h2>
              {d.businessAddressLine ? (
                <p className="text-sm text-[#111111]/85 font-medium leading-relaxed">{d.businessAddressLine}</p>
              ) : null}
              {mapsUrl ? (
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={t.mapAria}
                  className="mt-4 inline-flex items-center justify-center rounded-xl border border-[#3F5A43]/70 bg-[#3F5A43] px-5 py-3 text-sm font-semibold text-[#F7F4EC] hover:bg-[#36503A] shadow-sm transition"
                >
                  {t.openMap}
                </a>
              ) : null}
              {d.hours ? (
                <p className="mt-5 text-sm text-[#111111]/80">
                  <span className="font-semibold text-[#111111]/65">{t.hours}: </span>
                  {d.hours}
                </p>
              ) : null}
            </section>
          )}
        </article>
      </div>
    </main>
  );
}
