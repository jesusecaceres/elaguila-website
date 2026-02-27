"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Navbar from "../../../components/Navbar";
import newLogo from "../../../../public/logo.png";

import { SAMPLE_LISTINGS } from "../../../data/classifieds/sampleListings";
import { extractProVideoInfo } from "../../components/proVideo";
import ProBadge from "../../components/ProBadge";
import { isProListing } from "../../components/planHelpers";
import { isVerifiedSeller } from "../../components/verifiedSeller";
import { isListingSaved, onSavedListingsChange, toggleListingSaved } from "../../components/savedListings";

type Lang = "es" | "en";

type CategoryKey =
  | "en-venta"
  | "rentas"
  | "autos"
  | "servicios"
  | "empleos"
  | "clases"
  | "comunidad"
  | "travel";

type SellerType = "personal" | "business";
type ListingStatus = "active" | "sold";

type Listing = {
  id: string;
  category: CategoryKey;
  title: { es: string; en: string };
  priceLabel: { es: string; en: string };
  city: string;
  postedAgo: { es: string; en: string };
  blurb: { es: string; en: string };
  hasImage: boolean;
  condition: "any" | "new" | "good" | "fair";
  sellerType: SellerType;
  status?: ListingStatus;
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function AnuncioDetallePage() {
  const params = useParams<{ id: string }>();

  // ✅ Null-safe guard: some setups type useSearchParams() as possibly null
  const sp = useSearchParams();
  const searchParams = sp ?? new URLSearchParams();

  const lang = ((searchParams.get("lang") || "es") as Lang) === "en" ? "en" : "es";

  const t = useMemo(() => {
    const ui = {
      es: {
        back: "Volver a Clasificados",
        title: "Detalle del anuncio",
        notFoundTitle: "Anuncio no encontrado",
        notFoundBody:
          "Este anuncio no existe o fue eliminado. Regresa a la página principal para explorar otros anuncios.",
        viewAll: "Ver anuncios",
        post: "Publicar anuncio",
        signIn: "Iniciar sesión",

        statusSold: "VENDIDO",
        statusActive: "ACTIVO",

        sellerBusiness: "Negocio",
        sellerPersonal: "Personal",

        metaCity: "Ciudad",
        metaPosted: "Publicado",
        metaCondition: "Condición",
        metaCategory: "Categoría",

        actionsTitle: "Acciones",
        markSold: "Marcar como vendido",
        edit: "Editar anuncio",
        delete: "Eliminar anuncio",
        locked: "Requiere iniciar sesión",

        guardTitle: "Seguridad",
        guardBody:
          "Los anuncios se publican al instante, pero el sistema puede ocultarlos automáticamente si detecta spam o contenido inapropiado.",
        report: "Reportar anuncio",

        contactTitle: "Contacto",
        contactBody:
          "En v2, las acciones de contacto avanzadas se activan para LEONIX Pro. Por ahora, esta pantalla es de lectura y validación.",
      },
      en: {
        back: "Back to Classifieds",
        title: "Listing details",
        notFoundTitle: "Listing not found",
        notFoundBody:
          "This listing doesn’t exist or was removed. Go back to explore other listings.",
        viewAll: "View listings",
        post: "Post listing",
        signIn: "Sign in",

        statusSold: "SOLD",
        statusActive: "ACTIVE",

        sellerBusiness: "Business",
        sellerPersonal: "Personal",

        metaCity: "City",
        metaPosted: "Posted",
        metaCondition: "Condition",
        metaCategory: "Category",

        actionsTitle: "Actions",
        markSold: "Mark as sold",
        edit: "Edit listing",
        delete: "Delete listing",
        locked: "Sign in required",

        guardTitle: "Safety",
        guardBody:
          "Listings appear immediately, but the system may auto-hide them if it detects spam or inappropriate content.",
        report: "Report listing",

        contactTitle: "Contact",
        contactBody:
          "In v2, advanced contact/lead tools are enabled for LEONIX Pro. For now this screen is read-only for testing.",
      },
    } as const;
    return ui[lang];
  }, [lang]);

  const categoryLabel = useMemo(() => {
    const map: Record<CategoryKey, { es: string; en: string }> = {
      "en-venta": { es: "En Venta", en: "For Sale" },
      rentas: { es: "Rentas", en: "Rentals" },
      autos: { es: "Autos", en: "Autos" },
      servicios: { es: "Servicios", en: "Services" },
      empleos: { es: "Empleos", en: "Jobs" },
      clases: { es: "Clases", en: "Classes" },
      comunidad: { es: "Comunidad", en: "Community" },
      travel: { es: "Viajes", en: "Travel" },
    };
    return map;
  }, []);

  const listing: Listing | undefined = useMemo(() => {
    const id = params?.id;
    if (!id) return undefined;
    return (SAMPLE_LISTINGS as unknown as Listing[]).find((x) => x.id === id);
  }, [params?.id]);
  const [saved, setSaved] = useState<boolean>(() => (listing ? isListingSaved(listing.id) : false));

  useEffect(() => {
    if (!listing) return;
    return onSavedListingsChange(() => setSaved(isListingSaved(listing.id)));
  }, [listing?.id]);

  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert(lang === "es" ? "Copiado." : "Copied.");
    } catch {
      // Fallback: prompt
      window.prompt(lang === "es" ? "Copia este enlace:" : "Copy this link:", text);
    }
  };

  const buildShareMessage = () => {
    if (!listing) return "";
    const title = listing.title[lang];
    const price = listing.priceLabel[lang];
    const city = listing.city;
    const url = typeof window !== "undefined" ? window.location.href : "";
    return `${title} — ${price} (${city})\n${url}`;
  };

  const handleShare = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const title = listing ? listing.title[lang] : (lang === "es" ? "Anuncio" : "Listing");
    const text = listing ? listing.blurb[lang] : "";
    const nav: any = navigator as any;

    try {
      if (nav?.share) {
        await nav.share({ title, text, url });
        return;
      }
    } catch {
      // ignore and fall back
    }

    await copyText(url || buildShareMessage());
  };


  const status: ListingStatus = listing?.status ? listing.status : "active";
  const isSold = status === "sold";
  const isBusiness = listing?.sellerType === "business";
  const isPro = isProListing(listing as any);
  const verifiedSeller = useMemo(() => isVerifiedSeller(listing as any), [listing]);

  const proVideoInfo = useMemo(() => {
    if (!listing) return null;
    // Parse from the currently displayed blurb, but also include the other language
    // to maximize compatibility with mixed-language posts.
    const blob = `${listing.blurb?.[lang] ?? ""}\n${listing.blurb?.[lang === "es" ? "en" : "es"] ?? ""}`;
    return extractProVideoInfo(blob);
  }, [listing, lang]);

  const [showProVideo, setShowProVideo] = useState(false);

  // v2 placeholder: wired later to real auth
  const [isAuthed] = useState<boolean>(false);

  const conditionText = (c: Listing["condition"]) => {
    if (lang === "es") {
      if (c === "new") return "Nuevo";
      if (c === "good") return "Bueno";
      if (c === "fair") return "Regular";
      return "Cualquiera";
    }
    if (c === "new") return "New";
    if (c === "good") return "Good";
    if (c === "fair") return "Fair";
    return "Any";
  };

  if (!listing) {
    return (
      <div className="bg-black min-h-screen text-white pb-24">
        <Navbar />
        <section className="max-w-6xl mx-auto px-6 pt-28">
          <div className="text-center">
            <Image src={newLogo} alt="LEONIX" width={260} className="mx-auto mb-6" />
            <h1 className="text-5xl md:text-6xl font-bold text-yellow-400">{t.notFoundTitle}</h1>
            <p className="mt-5 text-gray-300 max-w-2xl mx-auto text-lg">{t.notFoundBody}</p>

            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <a
                href={`/clasificados?lang=${lang}`}
                className="px-7 py-3 rounded-full bg-yellow-400 text-black font-semibold hover:opacity-95 transition"
              >
                {t.viewAll}
              </a>
              <a
                href={`/clasificados/publicar?lang=${lang}`}
                className="px-7 py-3 rounded-full border border-white/10 bg-black/30 text-gray-100 font-semibold hover:bg-black/45 transition"
              >
                {t.post}
              </a>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="bg-black min-h-screen text-white pb-28">
      <Navbar />

      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ClassifiedAd",
            name: listing.title[lang],
            description: listing.blurb[lang],
            url: `/clasificados/anuncio/${listing.id}`,
            price: listing.priceLabel[lang],
            priceCurrency: "USD",
            address: {
              "@type": "PostalAddress",
              addressLocality: listing.city,
              addressRegion: "CA",
              addressCountry: "US",
            },
          }),
        }}
      />

      <section className="max-w-6xl mx-auto px-6 pt-28">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <a
            href={`/clasificados?lang=${lang}`}
            className="px-5 py-2.5 rounded-full border border-white/10 bg-black/30 text-gray-100 font-semibold hover:bg-black/45 transition"
          >
            ← {t.back}
          </a>

          <div className="flex flex-wrap gap-3">
            <a
              href={`/clasificados/publicar?lang=${lang}`}
              className="px-6 py-2.5 rounded-full bg-yellow-400 text-black font-semibold hover:opacity-95 transition"
            >
              {t.post}
            </a>
            <a
              href={`/clasificados/login?lang=${lang}`}
              className="px-6 py-2.5 rounded-full border border-white/10 bg-black/30 text-gray-100 font-semibold hover:bg-black/45 transition"
            >
              {t.signIn}
            </a>
          </div>
        </div>

        <div className="mt-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main card */}
          <div className="lg:col-span-8">
            <div
              className={cx(
                "rounded-2xl border bg-black/35 backdrop-blur p-8",
                isBusiness ? "border-yellow-400/45" : "border-white/10"
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h1 className="text-4xl md:text-5xl font-bold text-gray-100 leading-tight">
                    {listing.title[lang]}
                  </h1>
                  <div className="mt-3 text-2xl font-extrabold text-yellow-200">
                    {listing.priceLabel[lang]}
                  </div>

                  <div className="mt-4 text-gray-300">
                    {listing.city} • {listing.postedAgo[lang]}
                  </div>
                </div>

                <div className="shrink-0 flex flex-col items-end gap-2">
                  <span
                    className={cx(
                      "px-3 py-1 rounded-full text-xs font-semibold border",
                      isBusiness
                        ? "border-yellow-400/55 text-yellow-200 bg-yellow-400/10"
                        : "border-white/10 text-gray-200 bg-white/5"
                    )}
                  >
                    {isBusiness ? t.sellerBusiness : t.sellerPersonal}
                  </span>

                  {isPro ? <ProBadge /> : null}

                  
                    {verifiedSeller ? (
                      <span
                        className={cx(
                          "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold border border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
                        )}
                      >
                        <span aria-hidden="true">✓</span>
                        Verificado • Verified
                      </span>
                    ) : null}
<span
                    className={cx(
                      "px-3 py-1 rounded-full text-xs font-extrabold border",
                      isSold
                        ? "border-red-400/30 text-red-200 bg-red-400/10"
                        : "border-emerald-400/25 text-emerald-200 bg-emerald-400/10"
                    )}
                  >
                    {isSold ? t.statusSold : t.statusActive}
                  </span>
                </div>

<p className="mt-3 text-xs text-gray-400">
  {lang === "es"
    ? "Nota: Usamos detección anti‑spam y señales de verificación para mantener anuncios limpios y confiables."
    : "Note: We use anti-spam detection and verification signals to keep listings clean and trustworthy."}
</p>
              </div>

              <div className="mt-8 rounded-2xl border border-white/10 bg-black/30 p-6">
                <div className="text-sm text-gray-300">{listing.blurb[lang]}</div>
              </div>


{proVideoInfo && (
  <div className="mt-6 rounded-2xl border border-white/10 bg-black/30 p-6">
    <div className="flex items-center justify-between gap-3">
      <div>
        <div className="text-sm font-semibold text-yellow-200">
          {lang === "es" ? "Video (Pro)" : "Pro Video"}
        </div>
        <div className="mt-1 text-xs text-gray-400">
          {lang === "es"
            ? "Toque la miniatura para reproducir. No se reproduce automáticamente."
            : "Tap the thumbnail to play. No autoplay."}
        </div>
      </div>
      {!showProVideo && (
        <button
          type="button"
          onClick={() => setShowProVideo(true)}
          className="rounded-full border border-yellow-500/45 bg-yellow-500/10 px-4 py-2 text-xs font-semibold text-yellow-100 hover:bg-yellow-500/15"
        >
          {lang === "es" ? "Reproducir" : "Play"}
        </button>
      )}
    </div>

    <div className="mt-4">
      {!showProVideo ? (
        proVideoInfo.thumbUrl ? (
          <button
            type="button"
            onClick={() => setShowProVideo(true)}
            className="group relative block w-full overflow-hidden rounded-xl border border-white/10"
            aria-label={lang === "es" ? "Reproducir video" : "Play video"}
          >
            {/* Use <img> to avoid Next/Image remote domain config issues */}
            <img
              src={proVideoInfo.thumbUrl}
              alt={lang === "es" ? "Miniatura del video" : "Video thumbnail"}
              className="h-auto w-full object-cover opacity-95 group-hover:opacity-100"
              loading="lazy"
            />
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="rounded-full border border-white/20 bg-black/60 px-4 py-2 text-sm font-semibold text-white">
                {lang === "es" ? "▶ Reproducir" : "▶ Play"}
              </div>
            </div>
          </button>
        ) : (
          <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-gray-300">
            {lang === "es"
              ? "Este anuncio incluye un video Pro. Presione “Reproducir” para verlo."
              : "This listing includes a Pro video. Press “Play” to watch."}
          </div>
        )
      ) : (
        <video
          className="w-full rounded-xl border border-white/10 bg-black"
          controls
          preload="none"
          playsInline
          poster={proVideoInfo.thumbUrl}
          src={proVideoInfo.url}
        />
      )}
    </div>
  </div>
)}

              <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
                  <div className="text-xs text-gray-400">{t.metaCategory}</div>
                  <div className="mt-1 text-gray-100 font-semibold">
                    {categoryLabel[listing.category][lang]}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
                  <div className="text-xs text-gray-400">{t.metaCondition}</div>
                  <div className="mt-1 text-gray-100 font-semibold">
                    {conditionText(listing.condition)}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
                  <div className="text-xs text-gray-400">{t.metaCity}</div>
                  <div className="mt-1 text-gray-100 font-semibold">{listing.city}</div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
                  <div className="text-xs text-gray-400">{t.metaPosted}</div>
                  <div className="mt-1 text-gray-100 font-semibold">{listing.postedAgo[lang]}</div>
                </div>
              </div>
            </div>

            {/* Safety note */}
            <div className="mt-6 rounded-2xl border border-yellow-500/35 bg-black/30 p-6">
              <div className="text-lg font-bold text-yellow-200">{t.guardTitle}</div>
              <div className="mt-2 text-gray-300">{t.guardBody}</div>

              <div className="mt-4">
                <button
                  className="px-5 py-2.5 rounded-full border border-white/10 bg-black/30 text-gray-100 font-semibold hover:bg-black/45 transition"
                  onClick={() => alert(lang === "es" ? "Gracias — recibido." : "Thanks — received.")}
                >
                  {t.report}
                </button>
              </div>
            </div>
          </div>

          {/* Right rail */}
          <div className="lg:col-span-4 space-y-6">
            <div className="rounded-2xl border border-white/10 bg-black/30 p-6">
              <div className="text-xl font-bold text-gray-100">{t.actionsTitle}</div>

              <div className="mt-4 space-y-3">
                <button
                  type="button"
                  onClick={() => listing && setSaved(toggleListingSaved(listing.id))}
                  className={cx(
                    "w-full px-5 py-3 rounded-full font-semibold transition border",
                    "border-white/10 bg-black/40 text-gray-100 hover:bg-black/55"
                  )}
                >
                  {saved ? (lang === "es" ? "★ Guardado" : "★ Saved") : (lang === "es" ? "☆ Guardar" : "☆ Save")}
                </button>

                <button
                  type="button"
                  onClick={handleShare}
                  className="w-full px-5 py-3 rounded-full font-semibold transition border border-white/10 bg-black/40 text-gray-100 hover:bg-black/55"
                >
                  {lang === "es" ? "Compartir" : "Share"}
                </button>

                <button
                  type="button"
                  onClick={() => copyText(typeof window !== "undefined" ? window.location.href : "")}
                  className="w-full px-5 py-3 rounded-full font-semibold transition border border-white/10 bg-black/40 text-gray-100 hover:bg-black/55"
                >
                  {lang === "es" ? "Copiar enlace" : "Copy link"}
                </button>

                <button
                  type="button"
                  onClick={() => copyText(buildShareMessage())}
                  className="w-full px-5 py-3 rounded-full font-semibold transition border border-white/10 bg-black/40 text-gray-100 hover:bg-black/55"
                >
                  {lang === "es" ? "Copiar info" : "Copy info"}
                </button>

                <button
                  disabled={!isAuthed}
                  title={!isAuthed ? t.locked : ""}
                  className={cx(
                    "w-full px-5 py-3 rounded-full font-semibold transition",
                    !isAuthed
                      ? "bg-white/5 text-gray-500 border border-white/10 cursor-not-allowed"
                      : "bg-yellow-400 text-black hover:opacity-95"
                  )}
                >
                  {t.markSold}
                </button>

                <button
                  disabled={!isAuthed}
                  title={!isAuthed ? t.locked : ""}
                  className={cx(
                    "w-full px-5 py-3 rounded-full font-semibold transition border",
                    !isAuthed
                      ? "bg-white/5 text-gray-500 border-white/10 cursor-not-allowed"
                      : "bg-black/30 text-gray-100 border-white/10 hover:bg-black/45"
                  )}
                >
                  {t.edit}
                </button>

                <button
                  disabled={!isAuthed}
                  title={!isAuthed ? t.locked : ""}
                  className={cx(
                    "w-full px-5 py-3 rounded-full font-semibold transition border",
                    !isAuthed
                      ? "bg-white/5 text-gray-500 border-white/10 cursor-not-allowed"
                      : "bg-red-500/15 text-red-200 border-red-400/25 hover:bg-red-500/20"
                  )}
                >
                  {t.delete}
                </button>

                {!isAuthed && (
                  <div className="text-xs text-gray-400 pt-2">
                    {lang === "es"
                      ? "Nota: en v2 estas acciones se habilitan cuando conectemos autenticación real."
                      : "Note: in v2 these actions will enable when we wire real authentication."}
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/30 p-6">
              <div className="text-xl font-bold text-gray-100">{t.contactTitle}</div>
              <div className="mt-3 text-gray-300">{t.contactBody}</div>

              <div className="mt-5 flex flex-col gap-3">
                <button
                  disabled
                  className="w-full px-5 py-3 rounded-full border border-white/10 bg-white/5 text-gray-500 font-semibold cursor-not-allowed"
                >
                  {lang === "es" ? "Llamar" : "Call"}
                </button>
                <button
                  disabled
                  className="w-full px-5 py-3 rounded-full border border-white/10 bg-white/5 text-gray-500 font-semibold cursor-not-allowed"
                >
                  {lang === "es" ? "Enviar mensaje" : "Message"}
                </button>
                <button
                  disabled
                  className="w-full px-5 py-3 rounded-full border border-white/10 bg-white/5 text-gray-500 font-semibold cursor-not-allowed"
                >
                  {lang === "es" ? "Solicitar info" : "Request info"}
                </button>
              </div>

              <div className="mt-4 text-xs text-gray-400">
                {lang === "es"
                  ? "Estas herramientas se activan con LEONIX Pro (leads por anuncio)."
                  : "These tools activate with LEONIX Pro (per-listing leads)."}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}