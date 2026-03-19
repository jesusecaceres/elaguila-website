import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/app/components/Navbar";
import { categoryConfig, type CategoryKey } from "@/app/clasificados/config/categoryConfig";
import {
  isValidPublicAgentId,
  loadPublicAgentPageData,
  type PublicAgentListingSummary,
} from "@/app/lib/agentProfile/loadPublicAgentPageData";
import { formatListingPrice } from "@/app/lib/formatListingPrice";
import { safePublishFlowReturnUrl } from "@/app/lib/safePublishReturnUrl";
import AgentProfileHero from "./AgentProfileHero";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ lang?: string | string[]; returnTo?: string | string[] }>;
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

function listingHrefForAgentGrid(item: PublicAgentListingSummary, lang: "es" | "en") {
  if (item.category === "servicios") {
    return `/clasificados/servicios/${item.id}?lang=${lang}`;
  }
  return `/clasificados/anuncio/${item.id}?lang=${lang}`;
}

function categoryChipLabel(category: string | null, lang: "es" | "en"): string | null {
  if (!category) return null;
  const k = category as CategoryKey;
  if (k !== "all" && k in categoryConfig) {
    return categoryConfig[k].label[lang];
  }
  return null;
}

export default async function PublicAgentProfilePage(props: PageProps) {
  const params = await props.params;
  const rawId = typeof params?.id === "string" ? params.id.trim() : "";

  const sp = props.searchParams ? await props.searchParams : {};
  const langRaw = typeof sp.lang === "string" ? sp.lang : Array.isArray(sp.lang) ? sp.lang[0] : "";
  const lang = langRaw === "en" ? "en" : "es";
  const returnToRaw = typeof sp.returnTo === "string" ? sp.returnTo : Array.isArray(sp.returnTo) ? sp.returnTo[0] : "";
  const publishReturnHref = safePublishFlowReturnUrl(returnToRaw);

  if (!isValidPublicAgentId(rawId)) {
    notFound();
  }

  const data = await loadPublicAgentPageData(rawId);
  if (!data) {
    notFound();
  }

  const d = data.display;

  const t =
    lang === "es"
      ? {
          back: "← Volver a Clasificados",
          backPreview: "← Volver a la vista previa",
          about: "Sobre el agente",
          location: "Ubicación",
          hours: "Horario",
          openMap: "Abrir en mapa",
          mapAria: "Abrir ubicación en Google Maps",
          clasificadosHref: "/clasificados?lang=es",
          listingsTitle: "Anuncios activos",
          listingsEmpty: "Este miembro aún no tiene otros anuncios activos publicados.",
          listingsCity: "Ciudad",
        }
      : {
          back: "← Back to classifieds",
          backPreview: "← Back to preview",
          about: "About the agent",
          location: "Location",
          hours: "Hours",
          openMap: "Open map",
          mapAria: "Open location in Google Maps",
          clasificadosHref: "/clasificados?lang=en",
          listingsTitle: "Active listings",
          listingsEmpty: "This member does not have any other active listings yet.",
          listingsCity: "City",
        };

  const mapsUrl = d.mapQuery
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(d.mapQuery)}`
    : null;

  const shellClass =
    "rounded-[1.35rem] border border-[#C9B46A]/45 bg-gradient-to-b from-[#FFFCF6] to-[#F5F0E4] shadow-[0_18px_48px_-28px_rgba(17,17,17,0.35)] ring-1 ring-[#C9B46A]/20";

  const showLocationBlock = Boolean(d.businessAddressLine || d.hours || mapsUrl);

  const backHref = publishReturnHref ?? t.clasificadosHref;
  const backLabel = publishReturnHref != null ? t.backPreview : t.back;

  return (
    <main className="min-h-screen bg-[#FAF9F5] text-[#111111]">
      <Navbar />
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 pt-20 pb-16">
        <Link
          href={backHref}
          className="mb-4 inline-flex text-sm font-semibold text-[#3F5A43] hover:text-[#2F4A33]"
        >
          {backLabel}
        </Link>

        <div className="mx-auto w-full max-w-3xl space-y-8">
          <AgentProfileHero
            lang={lang}
            agentName={d.agentName}
            agentLicense={d.agentLicense}
            serviceAreaLines={d.serviceAreaLines}
            website={d.website}
            socialLinks={d.socialLinks}
            officePhone={d.officePhone}
            officePhoneTelDigits={d.officePhoneTelDigits}
            agentEmail={d.agentEmail}
            languages={d.languages}
            agentPhotoUrl={d.agentPhotoUrl}
            logoUrl={d.logoUrl}
            businessName={d.businessName}
          />

          {d.about ? (
            <section
              className="rounded-2xl border border-[#C9B46A]/18 bg-[#FFFEFB]/90 px-4 py-5 sm:px-5 sm:py-6 shadow-sm"
              aria-labelledby="agent-about-heading"
            >
              <h2 id="agent-about-heading" className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#8B6914]/90">
                {t.about}
              </h2>
              <div className="max-w-[70ch] text-sm text-[#111111]/88 leading-relaxed whitespace-pre-wrap">{d.about}</div>
            </section>
          ) : null}

          {showLocationBlock ? (
            <section
              className="rounded-2xl border border-[#C9B46A]/18 bg-[#FFFEFB]/90 px-4 py-5 sm:px-5 sm:py-6 shadow-sm"
              aria-labelledby="agent-location-heading"
            >
              <h2 id="agent-location-heading" className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#8B6914]/90">
                {t.location}
              </h2>
              {d.businessAddressLine ? (
                <p className="text-sm font-medium leading-relaxed text-[#111111]/85 max-w-[70ch]">{d.businessAddressLine}</p>
              ) : null}
              {mapsUrl ? (
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={t.mapAria}
                  className="mt-3 inline-flex items-center justify-center rounded-xl border border-[#3F5A43]/70 bg-[#3F5A43] px-4 py-2.5 text-sm font-semibold text-[#F7F4EC] shadow-sm transition hover:bg-[#36503A]"
                >
                  {t.openMap}
                </a>
              ) : null}
              {d.hours ? (
                <p className="mt-4 max-w-[70ch] text-sm text-[#111111]/80">
                  <span className="font-semibold text-[#111111]/65">{t.hours}: </span>
                  {d.hours}
                </p>
              ) : null}
            </section>
          ) : null}
        </div>

        <section className="mt-10" aria-labelledby="agent-listings-heading">
          <h2
            id="agent-listings-heading"
            className="text-sm font-semibold uppercase tracking-wide text-[#111111]/55 mb-4"
          >
            {t.listingsTitle}
          </h2>
          {data.listings.length === 0 ? (
            <p className="text-sm text-[#111111]/65 rounded-2xl border border-[#C9B46A]/30 bg-[#FFFCF6]/80 px-5 py-4">
              {t.listingsEmpty}
            </p>
          ) : (
            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.listings.map((item) => {
                const href = listingHrefForAgentGrid(item, lang);
                const priceLabel = formatListingPrice(item.price, { lang, isFree: item.isFree });
                const catLabel = categoryChipLabel(item.category, lang);
                const titleShow =
                  item.title.trim() ||
                  (lang === "es" ? "(Sin título)" : "(No title)");
                return (
                  <li key={item.id}>
                    <Link
                      href={href}
                      prefetch={false}
                      className={cx(
                        shellClass,
                        "block overflow-hidden p-0 hover:ring-2 hover:ring-[#C9B46A]/40 transition"
                      )}
                    >
                      <div className="relative h-36 w-full bg-[#E8E4DC] border-b border-[#C9B46A]/20">
                        <img
                          src={item.imageUrl}
                          alt=""
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                      </div>
                      <div className="p-4 space-y-1.5">
                        {catLabel ? (
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-[#8B6914]/90">
                            {catLabel}
                          </p>
                        ) : null}
                        <p className="text-sm font-bold text-[#111111] line-clamp-2 leading-snug">{titleShow}</p>
                        <p className="text-base font-extrabold text-[#2F4A33] tabular-nums">{priceLabel}</p>
                        {item.city ? (
                          <p className="text-xs text-[#111111]/60">
                            <span className="font-medium">{t.listingsCity}: </span>
                            {item.city}
                          </p>
                        ) : null}
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
