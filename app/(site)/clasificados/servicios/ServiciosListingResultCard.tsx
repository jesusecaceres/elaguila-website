import Image from "next/image";
import Link from "next/link";
import { FiGlobe, FiMapPin, FiMessageCircle, FiPhone } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import { resolveServiciosProfile } from "@/app/servicios/lib/resolveServiciosProfile";
import { getServiciosProfileLabels } from "@/app/servicios/copy/serviciosProfileCopy";
import type { ServiciosPublicListingRow } from "./lib/serviciosPublicListingsServer";
import type { ServiciosLang } from "@/app/servicios/types/serviciosBusinessProfile";
import { formatServiciosInternalGroupForDiscovery } from "./lib/serviciosInternalGroupDisplay";
import { inferServiciosSellerPresentation } from "./lib/serviciosSellerKind";
import { isServiciosListingPromoted } from "./lib/serviciosResultsFilter";

/**
 * Discovery card — only fields that exist on the resolved profile; empty data hides cleanly.
 */
export function ServiciosListingResultCard({ row, lang }: { row: ServiciosPublicListingRow; lang: ServiciosLang }) {
  const L = getServiciosProfileLabels(lang);
  const wire = { ...row.profile_json };
  wire.identity = { ...wire.identity, leonixVerified: row.leonix_verified === true };
  if ((row.review_rating_count ?? 0) > 0 && typeof row.review_rating_avg === "number" && Number.isFinite(row.review_rating_avg)) {
    wire.hero = {
      ...wire.hero,
      rating: row.review_rating_avg,
      reviewCount: row.review_rating_count ?? undefined,
    };
  }
  const profile = resolveServiciosProfile(wire, lang);

  const href = `/clasificados/servicios/${encodeURIComponent(row.slug)}?lang=${lang}`;
  const thumb =
    profile.hero.logoUrl ||
    profile.gallery[0]?.url ||
    profile.hero.coverImageUrl ||
    null;
  const category = profile.hero.categoryLine?.trim();
  const location = profile.hero.locationSummary?.trim() || row.city?.trim();
  const snippet = profile.about?.text?.trim().slice(0, 140);
  const hasSnippet = Boolean(snippet && snippet.length > 0);
  const phone = profile.contact.phoneDisplay;
  const tel = profile.contact.phoneTelHref;
  const web = profile.contact.websiteHref;
  const wa = profile.contact.socialLinks?.whatsapp;
  const msg = profile.contact.messageEnabled === true;
  const promo = profile.promo?.headline?.trim();
  const qf = profile.quickFacts[0]?.label;
  const groupDiscovery = formatServiciosInternalGroupForDiscovery(row.internal_group, lang);
  const groupLabel = groupDiscovery?.trim() ?? "";
  const showGroupChip = Boolean(groupLabel) && (!category || groupLabel !== category.trim());
  const sellerKind = inferServiciosSellerPresentation(row.profile_json);
  const promoted = isServiciosListingPromoted(row);

  const cardSurface = promoted
    ? "border-[#C9A84A]/35 bg-white shadow-[0_22px_52px_-32px_rgba(201,168,74,0.28)] ring-2 ring-[#C9A84A]/20 transition hover:border-[#C9A84A]/45 hover:shadow-[0_26px_58px_-30px_rgba(201,168,74,0.35)]"
    : "border-neutral-200/90 bg-white shadow-sm transition hover:border-[#3B66AD]/35 hover:shadow-md";

  return (
    <li>
      <Link
        href={href}
        className={`flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border ${cardSurface}`}
      >
        <div className="relative aspect-[16/9] w-full bg-gradient-to-br from-[#3B66AD]/8 to-[#F6F0E2]/40">
          {thumb ? (
            <Image src={thumb} alt="" fill className="object-cover" unoptimized sizes="(max-width:640px) 100vw, (max-width:1280px) 50vw, 33vw" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs font-semibold uppercase tracking-wide text-[#3B66AD]/40">
              Leonix
            </div>
          )}
          <div className="absolute left-2 top-2 flex max-w-[calc(100%-1rem)] flex-wrap gap-1">
            {promoted ? (
              <span className="rounded-full border border-white/70 bg-gradient-to-r from-[#EA580C] to-[#C2410C] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
                {lang === "en" ? "Featured" : "Destacado"}
              </span>
            ) : null}
            {row.leonix_verified ? (
              <span className="rounded-full border border-white/80 bg-white/95 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#2d528d] shadow-sm">
                {lang === "en" ? "Verified" : "Verificado"}
              </span>
            ) : null}
            <span
              className={
                sellerKind === "business"
                  ? "rounded-full border border-white/80 bg-[#1a3352]/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm"
                  : "rounded-full border border-white/80 bg-white/95 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#3D2C12] shadow-sm"
              }
            >
              {sellerKind === "business"
                ? lang === "en"
                  ? "Business"
                  : "Negocio"
                : lang === "en"
                  ? "Independent"
                  : "Independiente"}
            </span>
          </div>
          {promo ? (
            <span className="absolute bottom-2 left-2 right-2 truncate rounded-lg bg-black/55 px-2 py-1 text-center text-[11px] font-semibold text-white backdrop-blur-sm">
              {promo}
            </span>
          ) : null}
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-2 p-3.5 sm:p-4">
          {showGroupChip ? (
            <span className="w-fit rounded-full bg-[#C9A84A]/12 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#7a6220]">
              {groupLabel}
            </span>
          ) : null}
          {category ? (
            <span className="line-clamp-2 text-[11px] font-bold uppercase tracking-wide text-[#3B66AD]">{category}</span>
          ) : null}
          <span className="text-base font-bold leading-snug text-[#3D2C12]">{profile.identity.businessName}</span>
          {row.city?.trim() ? (
            <span className="text-[11px] font-medium uppercase tracking-wide text-[#64748b]">
              {lang === "en" ? "Listing base:" : "Base del anuncio:"}{" "}
              <span className="font-semibold text-[#3d4f62]">{row.city.trim()}</span>
            </span>
          ) : null}
          {location ? (
            <span className="flex items-start gap-1.5 text-sm text-neutral-600">
              <FiMapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#3B66AD]" aria-hidden />
              <span className="line-clamp-2">{location}</span>
            </span>
          ) : null}
          {qf ? <span className="text-xs font-medium text-neutral-500">{qf}</span> : null}
          {hasSnippet ? <p className="line-clamp-3 text-sm leading-relaxed text-neutral-600">{snippet}</p> : null}

          <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-neutral-100 pt-2.5 sm:gap-2 sm:pt-3">
            <span className="text-[12px] font-bold text-[#3B66AD]">
              {lang === "en" ? "View profile →" : "Ver vitrina →"}
            </span>
            <div className="flex flex-wrap justify-end gap-1.5 sm:gap-2">
            {phone && tel ? (
              <span className="inline-flex min-h-[40px] items-center gap-1 rounded-full border border-neutral-200 bg-[#F9F8F6] px-2.5 py-1.5 text-[11px] font-semibold text-neutral-800">
                <FiPhone className="h-3.5 w-3.5 text-[#3B66AD]" aria-hidden />
                {L.call}
              </span>
            ) : null}
            {wa ? (
              <span className="inline-flex min-h-[40px] items-center gap-1 rounded-full border border-neutral-200 bg-[#F9F8F6] px-2.5 py-1.5 text-[11px] font-semibold text-neutral-800">
                <FaWhatsapp className="h-3.5 w-3.5 text-[#25D366]" aria-hidden />
                WhatsApp
              </span>
            ) : null}
            {msg ? (
              <span className="inline-flex min-h-[40px] items-center gap-1 rounded-full border border-neutral-200 bg-[#F9F8F6] px-2.5 py-1.5 text-[11px] font-semibold text-neutral-800">
                <FiMessageCircle className="h-3.5 w-3.5 text-[#3B66AD]" aria-hidden />
                {L.message}
              </span>
            ) : null}
            {web ? (
              <span className="inline-flex min-h-[40px] items-center gap-1 rounded-full border border-neutral-200 bg-[#F9F8F6] px-2.5 py-1.5 text-[11px] font-semibold text-neutral-800">
                <FiGlobe className="h-3.5 w-3.5 text-[#3B66AD]" aria-hidden />
                {L.visitWebsite}
              </span>
            ) : null}
            </div>
          </div>
        </div>
      </Link>
    </li>
  );
}
