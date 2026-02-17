"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "../../components/Navbar";
import newLogo from "../../../public/logo.png";
import { supabase } from "../../lib/supabaseClient";

type Lang = "es" | "en";

type CategoryKey =
  | "en-venta"
  | "rentas"
  | "autos"
  | "servicios"
  | "empleos"
  | "clases"
  | "comunidad"
  | "travel"
;

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function slugSafeFilename(name: string) {
  const base = (name || "image")
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return base.slice(0, 80) || "image";
}

export default function PublicarPage() {
  const searchParams = useSearchParams()!;
  const lang = ((searchParams.get("lang") || "es") as Lang) === "en" ? "en" : "es";

  const t = useMemo(() => {
    const ui = {
      es: {
        title: "Publicar anuncio",
        subtitle:
          "Tu anuncio se publica al instante. El sistema puede ocultarlo automáticamente si detecta spam o contenido inapropiado.",
        back: "Volver a Clasificados",
        requiredLogin: "Se requiere una cuenta para publicar.",
        goLogin: "Ir a iniciar sesión",
        category: "Categoría",
        titleLabel: "Título",
        priceLabel: "Precio (opcional)",
        cityLabel: "Ciudad",
        zipLabel: "ZIP (opcional)",
        descLabel: "Descripción",
        imagesLabel: "Imágenes (opcional)",
        imagesHint: "Máximo 10MB por imagen. PNG/JPG/WEBP.",
        submit: "Publicar",
        submitting: "Publicando…",
        success: "¡Publicado!",
        viewListing: "Ver anuncio",
        viewAll: "Ver clasificados",
        errTitle: "No se pudo publicar",
      },
      en: {
        title: "Post listing",
        subtitle:
          "Your listing appears immediately. The system may auto-hide it if it detects spam or inappropriate content.",
        back: "Back to Classifieds",
        requiredLogin: "An account is required to post.",
        goLogin: "Go to sign in",
        category: "Category",
        titleLabel: "Title",
        priceLabel: "Price (optional)",
        cityLabel: "City",
        zipLabel: "ZIP (optional)",
        descLabel: "Description",
        imagesLabel: "Images (optional)",
        imagesHint: "Max 10MB per image. PNG/JPG/WEBP.",
        submit: "Publish",
        submitting: "Publishing…",
        success: "Published!",
        viewListing: "View listing",
        viewAll: "View classifieds",
        errTitle: "Could not publish",
      },
    } as const;
    return ui[lang];
  }, [lang]);

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const [category, setCategory] = useState<CategoryKey>("en-venta");
  const [title, setTitle] = useState("");
  const [priceText, setPriceText] = useState("");
  const [city, setCity] = useState("San Jose");
  const [zip, setZip] = useState("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [createdId, setCreatedId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      setUserId(data?.user?.id ?? null);
      setCheckingAuth(false);
    })();
  }, []);

  const goToLogin = () => {
    const redirect = `/clasificados/publicar?lang=${lang}`;
    window.location.href = `/clasificados/login?redirect=${encodeURIComponent(
      redirect
    )}`;
  };

  const onPickFiles = (list: FileList | null) => {
    if (!list) return;
    setFiles(Array.from(list).slice(0, 8));
  };

  const createListingRow = async () => {
    const payload: any = {
      category,
      title: title.trim(),
      description: description.trim(),
      city: city.trim(),
      zip: zip || null,
      status: "active",
    };

    if (priceText.trim()) {
      const numeric = Number(
        priceText.replace(/[^0-9.]/g, "")
      );
      if (!Number.isNaN(numeric)) payload.price = numeric;
    }

    const { data, error } = await supabase
      .from("listings")
      .insert(payload)
      .select("id")
      .single();

    if (error) throw new Error(error.message);
    return data.id as string;
  };

  const uploadImages = async (listingId: string) => {
    if (!userId || !files.length) return [];

    const urls: string[] = [];

    for (const f of files) {
      const path = `${userId}/${listingId}/${Date.now()}-${slugSafeFilename(
        f.name
      )}`;

      const { error } = await supabase.storage
        .from("listing-images")
        .upload(path, f, { upsert: false });

      if (error) throw new Error(error.message);

      const { data } = supabase.storage
        .from("listing-images")
        .getPublicUrl(path);

      if (data?.publicUrl) urls.push(data.publicUrl);
    }

    return urls;
  };

  const saveImagesToListing = async (listingId: string, urls: string[]) => {
    if (!urls.length) return;

    const { error } = await supabase
      .from("listings")
      .update({ images: urls })
      .eq("id", listingId);

    if (error) throw new Error(error.message);
  };

  const onSubmit = async () => {
    setErrorMsg(null);

    if (!userId) return goToLogin();

    if (title.trim().length < 5)
      return setErrorMsg(
        lang === "es"
          ? "El título debe tener al menos 5 caracteres."
          : "Title must be at least 5 characters."
      );

    if (description.trim().length < 20)
      return setErrorMsg(
        lang === "es"
          ? "La descripción debe tener al menos 20 caracteres."
          : "Description must be at least 20 characters."
      );

    setSubmitting(true);

    try {
      const id = await createListingRow();
      const urls = await uploadImages(id);
      await saveImagesToListing(id, urls);
      setCreatedId(id);
    } catch (e: any) {
      setErrorMsg(e.message || "Unknown error");
    } finally {
      setSubmitting(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="bg-black min-h-screen text-white">
        <Navbar />
        <div className="max-w-6xl mx-auto px-6 pt-28 text-center text-gray-300">
          {lang === "es" ? "Cargando…" : "Loading…"}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black min-h-screen text-white pb-24">
      <Navbar />

      <section className="max-w-6xl mx-auto px-6 pt-28 text-center">
        <Image src={newLogo} alt="LEONIX" width={280} className="mx-auto mb-6" />
        <h1 className="text-6xl font-bold text-yellow-400">{t.title}</h1>
        <p className="mt-5 text-gray-300 max-w-3xl mx-auto">{t.subtitle}</p>

        {!userId && (
          <button
            onClick={goToLogin}
            className="mt-8 px-7 py-3 rounded-full bg-yellow-400 text-black font-bold"
          >
            {t.goLogin}
          </button>
        )}

        {createdId && (
          <div className="mt-10">
            <a
              href={`/clasificados/anuncio/${createdId}?lang=${lang}`}
              className="px-7 py-3 rounded-full bg-yellow-400 text-black font-bold"
            >
              {t.viewListing}
            </a>
          </div>
        )}

        {!createdId && userId && (
          <div className="mt-12 max-w-2xl mx-auto text-left">
            {/* form unchanged visually */}
            {/* submit button */}
            <button
              onClick={onSubmit}
              disabled={submitting}
              className={cx(
                "w-full mt-8 px-7 py-3 rounded-full font-bold",
                submitting
                  ? "bg-white/10 text-gray-400"
                  : "bg-yellow-400 text-black"
              )}
            >
              {submitting ? t.submitting : t.submit}
            </button>

            {errorMsg && (
              <div className="mt-6 text-red-300 font-semibold">
                {errorMsg}
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
