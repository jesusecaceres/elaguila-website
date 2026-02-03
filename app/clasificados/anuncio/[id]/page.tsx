"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Navbar from "../../../components/Navbar";
import newLogo from "../../../../public/logo.png";

import { SAMPLE_LISTINGS } from "../../../data/classifieds/sampleListings";

type Lang = "es" | "en";

type CategoryKey =
  | "en-venta"
  | "rentas"
  | "autos"
  | "servicios"
  | "empleos"
  | "clases"
  | "comunidad";

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
          "En v2, las acciones de contacto avanzadas se activan para Business Premium. Por ahora, esta pantalla es de lectura y validación.",
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
          "In v2, advanced contact/lead tools are enabled for Business Premium. For now this screen is read-only for testing.",
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
    };
    return map;
  }, []);

  const listing: Listing | undefined = useMemo(() => {
    const id = params?.id;
    if (!id) return undefined;
    return (SAMPLE_LISTINGS as unknown as Listing[]).find((x) => x.id === id);
  }, [params?.id]);

  const status: ListingStatus = listing?.status ? listing.status : "active";
  const isSold = status === "sold";
  const isBusiness = listing?.sellerType === "business";

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
                isBusiness ? "border-yellow-400/30" : "border-white/10"
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
                        ? "border-yellow-400/40 text-yellow-200 bg-yellow-400/10"
                        : "border-white/10 text-gray-200 bg-white/5"
                    )}
                  >
                    {isBusiness ? t.sellerBusiness : t.sellerPersonal}
                  </span>

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
              </div>

              <div className="mt-8 rounded-2xl border border-white/10 bg-black/30 p-6">
                <div className="text-sm text-gray-300">{listing.blurb[lang]}</div>
              </div>

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
            <div className="mt-6 rounded-2xl border border-yellow-600/20 bg-black/30 p-6">
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
                  ? "Estas herramientas se activan con Business Premium (leads por anuncio)."
                  : "These tools activate with Business Premium (per-listing leads)."}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
