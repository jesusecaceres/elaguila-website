import { BROAD_BUSINESS_TYPES, CUSTOM_LINK_TYPES, DIGITAL_PROFILE_PLATFORMS } from "@/app/lib/business/constants";
import { formatUsPhoneForDisplay } from "@/app/lib/business/phoneDisplay";

/**
 * Staff-Created Business Profile pipeline -- the ONE presentation component shared by the staff
 * preview route, the owner preview route, and the real public /perfil/[slug] page, so "what the
 * prospect sees on my phone tonight" and "what actually goes public later" are never two
 * different pieces of UI drifting apart. No staff-only chrome (notes, research, health scores,
 * pipeline status) is ever passed into this component -- every prop here is public-content-safe
 * by construction (each caller maps its own richer data down to this shape first).
 */

export type BusinessProfilePresentationMode = "public" | "staff_preview" | "owner_preview";

export type BusinessProfilePresentationProps = {
  mode: BusinessProfilePresentationMode;
  lang?: "es" | "en";
  profileStatus?: "draft" | "published";
  business: {
    displayName: string;
    publicName: string | null;
    broadBusinessType: string;
    specificBusinessType: string | null;
    customSpecificType: string | null;
  };
  profile: {
    headline: string | null;
    shortDescription: string | null;
    aboutDescription: string | null;
    logoUrl: string | null;
    heroImageUrl: string | null;
    galleryImages: readonly string[];
    featuredHighlights: readonly { title: string; description: string }[];
  };
  contacts: readonly { contactType: string; value: string; label: string; isPrimary: boolean; channelKind: string | null }[];
  digitalProfiles: readonly { platform: string; handleOrUrl: string }[];
  customLinks: readonly { linkType: string; customLabel: string | null; displayUrl: string; sortOrder: number }[];
  serviceAreas: readonly { country: string | null; cityHint: string | null; areaKind: string; isPrimary: boolean }[];
};

function labelFrom(list: readonly { value: string; es: string; en: string }[], value: string | null | undefined, lang: "es" | "en"): string {
  if (!value) return "";
  return list.find((o) => o.value === value)?.[lang] ?? value;
}

function contactHref(contactType: string, value: string, channelKind: string | null): string {
  if (contactType === "email") return `mailto:${value}`;
  if (contactType === "website") return value.startsWith("http") ? value : `https://${value}`;
  if (contactType === "phone") {
    if (channelKind === "whatsapp") return `https://wa.me/${value.replace(/[^0-9]/g, "")}`;
    return `tel:${value}`;
  }
  return value;
}

export function BusinessProfilePresentation({ mode, lang = "es", profileStatus, business, profile, contacts, digitalProfiles, customLinks, serviceAreas }: BusinessProfilePresentationProps) {
  const name = business.publicName || business.displayName;
  const categoryLine = [labelFrom(BROAD_BUSINESS_TYPES, business.broadBusinessType, lang), business.customSpecificType || business.specificBusinessType].filter(Boolean).join(" · ");
  const primaryArea = serviceAreas.find((a) => a.isPrimary) ?? serviceAreas[0] ?? null;
  const phoneContacts = contacts.filter((c) => c.contactType === "phone");
  const emailContact = contacts.find((c) => c.contactType === "email");
  const websiteContact = contacts.find((c) => c.contactType === "website");

  return (
    <div className="min-h-screen bg-[#FFFDF7] text-[#1E1810]">
      {mode !== "public" ? (
        <div className={`px-4 py-2 text-center text-xs font-bold uppercase tracking-wide ${profileStatus === "published" ? "bg-emerald-100 text-emerald-900" : "bg-amber-100 text-amber-900"}`}>
          {mode === "staff_preview"
            ? lang === "en"
              ? `Staff preview — not public${profileStatus === "published" ? " (this profile is currently live)" : ""}`
              : `Vista previa de staff — no es pública${profileStatus === "published" ? " (este perfil está publicado)" : ""}`
            : lang === "en"
              ? `Your preview — ${profileStatus === "published" ? "this is live on Leonix" : "not public yet"}`
              : `Tu vista previa — ${profileStatus === "published" ? "esto está publicado en Leonix" : "todavía no es pública"}`}
        </div>
      ) : null}

      <header className="relative">
        {profile.heroImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={profile.heroImageUrl} alt="" className="h-40 w-full object-cover sm:h-56" />
        ) : (
          <div className="h-24 w-full bg-gradient-to-r from-[#7A1E2C] to-[#5C1420] sm:h-32" />
        )}
        <div className="mx-auto -mt-10 max-w-2xl px-4 sm:-mt-12">
          <div className="flex items-end gap-3">
            {profile.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.logoUrl} alt="" className="h-20 w-20 shrink-0 rounded-2xl border-4 border-[#FFFDF7] bg-white object-contain shadow-md sm:h-24 sm:w-24" />
            ) : (
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border-4 border-[#FFFDF7] bg-[#EDE6D6] text-2xl font-bold text-[#7A1E2C] shadow-md sm:h-24 sm:w-24">
                {name.slice(0, 1).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 pb-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8A6B1F]">Leonix Business Profile</p>
              <h1 className="truncate font-serif text-xl font-bold leading-tight text-[#1E1810] sm:text-2xl">{name}</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-5 px-4 py-6">
        {categoryLine || primaryArea ? (
          <p className="text-sm text-[#7A7164]">
            {categoryLine}
            {categoryLine && primaryArea ? " · " : ""}
            {primaryArea?.cityHint ?? ""}
          </p>
        ) : null}

        {profile.headline ? <p className="text-lg font-semibold text-[#3D3428]">{profile.headline}</p> : null}
        {profile.shortDescription ? <p className="text-sm text-[#5C5346]">{profile.shortDescription}</p> : null}

        <div className="flex flex-wrap gap-2">
          {phoneContacts.map((c) => (
            <a key={`${c.contactType}-${c.value}`} href={contactHref(c.contactType, c.value, c.channelKind)} className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-[#7A1E2C] px-4 py-2 text-sm font-semibold text-white">
              {c.channelKind === "whatsapp" ? "WhatsApp" : lang === "en" ? "Call" : "Llamar"} · {formatUsPhoneForDisplay(c.value)}
            </a>
          ))}
          {websiteContact ? (
            <a href={contactHref("website", websiteContact.value, null)} target="_blank" rel="noreferrer" className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-[#C9A84A]/70 bg-[#FFFDF7] px-4 py-2 text-sm font-semibold text-[#1E1810]">
              {lang === "en" ? "Website" : "Sitio web"}
            </a>
          ) : null}
          {emailContact ? (
            <a href={contactHref("email", emailContact.value, null)} className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-[#C9A84A]/70 bg-[#FFFDF7] px-4 py-2 text-sm font-semibold text-[#1E1810]">
              {lang === "en" ? "Email" : "Correo"}
            </a>
          ) : null}
        </div>

        {profile.aboutDescription ? (
          <section className="rounded-2xl border border-[#E8DFD0] bg-white p-4">
            <h2 className="text-xs font-bold uppercase tracking-wide text-[#8A6B1F]">{lang === "en" ? "About" : "Acerca de"}</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm text-[#3D3428]">{profile.aboutDescription}</p>
          </section>
        ) : null}

        {profile.featuredHighlights.length > 0 ? (
          <section className="rounded-2xl border border-[#E8DFD0] bg-white p-4">
            <h2 className="text-xs font-bold uppercase tracking-wide text-[#8A6B1F]">{lang === "en" ? "Highlights" : "Destacados"}</h2>
            <ul className="mt-2 space-y-2">
              {profile.featuredHighlights.map((h) => (
                <li key={h.title}>
                  <p className="text-sm font-semibold text-[#1E1810]">{h.title}</p>
                  {h.description ? <p className="text-xs text-[#7A7164]">{h.description}</p> : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {profile.galleryImages.length > 0 ? (
          <section>
            <h2 className="text-xs font-bold uppercase tracking-wide text-[#8A6B1F]">{lang === "en" ? "Gallery" : "Galería"}</h2>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {profile.galleryImages.map((src) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={src} src={src} alt="" className="aspect-square w-full rounded-lg object-cover" />
              ))}
            </div>
          </section>
        ) : null}

        {digitalProfiles.length > 0 || customLinks.length > 0 ? (
          <section className="rounded-2xl border border-[#E8DFD0] bg-white p-4">
            <h2 className="text-xs font-bold uppercase tracking-wide text-[#8A6B1F]">{lang === "en" ? "Find us" : "Encuéntranos"}</h2>
            <ul className="mt-2 flex flex-wrap gap-2">
              {digitalProfiles.map((d) => (
                <li key={d.platform}>
                  <a href={d.handleOrUrl} target="_blank" rel="noreferrer" className="inline-flex items-center rounded-full border border-[#E8DFD0] bg-[#FAF7F2] px-3 py-1 text-xs font-semibold text-[#3D3428]">
                    {labelFrom(DIGITAL_PROFILE_PLATFORMS, d.platform, lang)}
                  </a>
                </li>
              ))}
              {customLinks
                .slice()
                .sort((a, b) => a.sortOrder - b.sortOrder)
                .map((l) => (
                  <li key={l.displayUrl}>
                    <a href={l.displayUrl} target="_blank" rel="noreferrer" className="inline-flex items-center rounded-full border border-[#E8DFD0] bg-[#FAF7F2] px-3 py-1 text-xs font-semibold text-[#3D3428]">
                      {l.linkType === "other" ? l.customLabel || l.displayUrl : labelFrom(CUSTOM_LINK_TYPES, l.linkType, lang)}
                    </a>
                  </li>
                ))}
            </ul>
          </section>
        ) : null}

        <p className="pt-2 text-center text-[10px] text-[#9A9184]">Leonix Business Profile · leonixmedia.com</p>
      </main>
    </div>
  );
}
