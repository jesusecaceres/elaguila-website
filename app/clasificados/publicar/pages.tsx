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
  | "comunidad";

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
        signIn: "Iniciar sesión",
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
        signIn: "Sign in",
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
      const uid = data?.user?.id ?? null;
      setUserId(uid);
      setCheckingAuth(false);
    })();
  }, []);

  const goToLogin = () => {
    const redirect = `/clasificados/publicar?lang=${lang}`;
    window.location.href = `/clasificados/login?redirect=${encodeURIComponent(redirect)}`;
  };

  const onPickFiles = (list: FileList | null) => {
    if (!list) return;
    const arr = Array.from(list);
    setFiles(arr.slice(0, 8)); // keep it reasonable for v2
  };

  const createListingRow = async () => {
    // We only insert columns that are very likely to exist.
    // If your table uses different names, Supabase will return an error which we show clearly.
    const payload: any = {
      category,
      title,
      description,
      city,
      zip: zip ? zip : null,
      status: "active",
    };

    // Optional price: store as text if you don’t have numeric column yet
    if (priceText.trim()) payload.price = priceText.trim();

    // Owner
    payload.user_id = userId;

    const { data, error } = await supabase
      .from("listings")
      .insert(payload)
      .select("id")
      .single();

    if (error) throw new Error(error.message);
    return data?.id as string;
  };

  const uploadImages = async (listingId: string) => {
    if (!userId) return [];
    if (!files.length) return [];

    const urls: string[] = [];

    for (const f of files) {
      const safe = slugSafeFilename(f.name);
      const path = `${userId}/${listingId}/${Date.now()}-${safe}`;

      const { error: upErr } = await supabase.storage
        .from("listing-images")
        .upload(path, f, { upsert: false });

      if (upErr) {
        // Don’t fail the whole post if one image fails — just stop and show error
        throw new Error(upErr.message);
      }

      const { data } = supabase.storage.from("listing-images").getPublicUrl(path);
      if (data?.publicUrl) urls.push(data.publicUrl);
    }

    return urls;
  };

  const tryUpdateImageUrls = async (listingId: string, urls: string[]) => {
    if (!urls.length) return;

    // Try to update common column names; ignore if column doesn’t exist yet.
    const attempts: Array<{ col: string; value: any }> = [
      { col: "image_urls", value: urls },
      { col: "images", value: urls },
      { col: "image_url", value: urls[0] },
    ];

    for (const a of attempts) {
      const { error } = await supabase
        .from("listings")
        .update({ [a.col]: a.value })
        .eq("id", listingId);

      if (!error) return; // success
    }
  };

  const onSubmit = async () => {
    setErrorMsg(null);

    if (!userId) {
      goToLogin();
      return;
    }

    if (!title.trim() || title.trim().length < 4) {
      setErrorMsg(lang === "es" ? "Escribe un título (mínimo 4 caracteres)." : "Add a title (min 4 chars).");
      return;
    }

    if (!description.trim() || description.trim().length < 10) {
      setErrorMsg(lang === "es" ? "Escribe una descripción (mínimo 10 caracteres)." : "Add a description (min 10 chars).");
      return;
    }

    setSubmitting(true);

    try {
      const listingId = await createListingRow();
      const urls = await uploadImages(listingId);
      await tryUpdateImageUrls(listingId, urls);

      setCreatedId(listingId);
    } catch (err: any) {
      setErrorMsg(err?.message || "Unknown error");
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

      <section className="max-w-6xl mx-auto px-6 pt-28">
        <div className="text-center">
          <Image src={newLogo} alt="LEONIX" width={280} className="mx-auto mb-6" />
          <h1 className="text-6xl md:text-7xl font-bold text-yellow-400">{t.title}</h1>
          <p className="mt-5 text-gray-300 max-w-3xl mx-auto text-lg md:text-xl">{t.subtitle}</p>

          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <a
              href={`/clasificados?lang=${lang}`}
              className="px-7 py-3 rounded-full border border-white/10 bg-black/30 text-gray-100 font-semibold hover:bg-black/45 transition"
            >
              ← {t.back}
            </a>

            {!userId && (
              <button
                onClick={goToLogin}
                className="px-7 py-3 rounded-full bg-yellow-400 text-black font-semibold hover:opacity-95 transition"
              >
                {t.goLogin}
              </button>
            )}
          </div>
        </div>

        <div className="mt-12 border border-yellow-600/20 rounded-2xl bg-black/30 p-8">
          {!userId ? (
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-200">{t.requiredLogin}</div>
              <div className="mt-4">
                <button
                  onClick={goToLogin}
                  className="px-7 py-3 rounded-full bg-yellow-400 text-black font-extrabold hover:opacity-95 transition"
                >
                  {t.goLogin}
                </button>
              </div>
            </div>
          ) : createdId ? (
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-200">{t.success}</div>
              <div className="mt-6 flex flex-wrap justify-center gap-4">
                <a
                  href={`/clasificados/anuncio/${createdId}?lang=${lang}`}
                  className="px-7 py-3 rounded-full bg-yellow-400 text-black font-semibold hover:opacity-95 transition"
                >
                  {t.viewListing}
                </a>
                <a
                  href={`/clasificados?lang=${lang}`}
                  className="px-7 py-3 rounded-full border border-white/10 bg-black/30 text-gray-100 font-semibold hover:bg-black/45 transition"
                >
                  {t.viewAll}
                </a>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-6">
                <div className="text-sm text-gray-300 mb-2">{t.category}</div>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as CategoryKey)}
                  className="w-full px-5 py-3 rounded-full bg-black/40 border border-white/10 text-gray-100 focus:outline-none focus:ring-2 focus:ring-yellow-400/40"
                >
                  <option value="en-venta">{lang === "es" ? "En Venta" : "For Sale"}</option>
                  <option value="rentas">{lang === "es" ? "Rentas" : "Rentals"}</option>
                  <option value="autos">{lang === "es" ? "Autos" : "Autos"}</option>
                  <option value="servicios">{lang === "es" ? "Servicios" : "Services"}</option>
                  <option value="empleos">{lang === "es" ? "Empleos" : "Jobs"}</option>
                  <option value="clases">{lang === "es" ? "Clases" : "Classes"}</option>
                  <option value="comunidad">{lang === "es" ? "Comunidad" : "Community"}</option>
                </select>

                <div className="mt-5 text-sm text-gray-300 mb-2">{t.titleLabel}</div>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-5 py-3 rounded-full bg-black/40 border border-white/10 text-gray-100 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400/40"
                  placeholder={lang === "es" ? "Ej: Sofá en excelente condición" : "e.g., Couch in great condition"}
                />

                <div className="mt-5 text-sm text-gray-300 mb-2">{t.priceLabel}</div>
                <input
                  value={priceText}
                  onChange={(e) => setPriceText(e.target.value)}
                  className="w-full px-5 py-3 rounded-full bg-black/40 border border-white/10 text-gray-100 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400/40"
                  placeholder={lang === "es" ? "Ej: $120 o 120" : "e.g., $120 or 120"}
                />

                <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-300 mb-2">{t.cityLabel}</div>
                    <input
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-5 py-3 rounded-full bg-black/40 border border-white/10 text-gray-100 focus:outline-none focus:ring-2 focus:ring-yellow-400/40"
                      placeholder="San Jose"
                    />
                  </div>
                  <div>
                    <div className="text-sm text-gray-300 mb-2">{t.zipLabel}</div>
                    <input
                      value={zip}
                      onChange={(e) => setZip(e.target.value.replace(/[^0-9]/g, "").slice(0, 5))}
                      inputMode="numeric"
                      className="w-full px-5 py-3 rounded-full bg-black/40 border border-white/10 text-gray-100 focus:outline-none focus:ring-2 focus:ring-yellow-400/40"
                      placeholder="95112"
                    />
                  </div>
                </div>

                <div className="mt-5 text-sm text-gray-300 mb-2">{t.descLabel}</div>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full min-h-[160px] px-5 py-4 rounded-2xl bg-black/40 border border-white/10 text-gray-100 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400/40"
                  placeholder={
                    lang === "es"
                      ? "Describe el artículo, condición, entrega, etc."
                      : "Describe the item, condition, pickup/delivery, etc."
                  }
                />

                <div className="mt-6">
                  <div className="text-sm text-gray-300 mb-2">{t.imagesLabel}</div>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => onPickFiles(e.target.files)}
                    className="block w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-yellow-400 file:text-black hover:file:opacity-95"
                  />
                  <div className="mt-2 text-xs text-gray-400">{t.imagesHint}</div>

                  {files.length > 0 && (
                    <div className="mt-3 text-sm text-gray-300">
                      {lang === "es" ? "Seleccionadas:" : "Selected:"}{" "}
                      {files.map((f) => f.name).join(", ")}
                    </div>
                  )}
                </div>

                {errorMsg && (
                  <div className="mt-6 rounded-2xl border border-red-400/25 bg-red-500/10 p-4">
                    <div className="font-bold text-red-200">{t.errTitle}</div>
                    <div className="mt-1 text-red-100/90 text-sm">{errorMsg}</div>
                  </div>
                )}

                <div className="mt-8">
                  <button
                    onClick={onSubmit}
                    disabled={submitting}
                    className={cx(
                      "w-full px-7 py-3 rounded-full font-extrabold transition",
                      submitting
                        ? "bg-white/10 text-gray-400 cursor-not-allowed"
                        : "bg-yellow-400 text-black hover:opacity-95"
                    )}
                  >
                    {submitting ? t.submitting : t.submit}
                  </button>
                </div>
              </div>

              <div className="lg:col-span-6">
                <div className="rounded-2xl border border-white/10 bg-black/30 p-6">
                  <div className="text-xl font-bold text-yellow-200">
                    {lang === "es" ? "Vista previa" : "Preview"}
                  </div>
                  <div className="mt-4 text-gray-100 font-bold text-2xl">
                    {title.trim() ? title.trim() : (lang === "es" ? "Tu título aquí…" : "Your title here…")}
                  </div>
                  <div className="mt-2 text-yellow-200 font-extrabold text-xl">
                    {priceText.trim() ? priceText.trim() : (lang === "es" ? "Precio (opcional)" : "Price (optional)")}
                  </div>
                  <div className="mt-3 text-gray-300">
                    {city || "—"} {zip ? `• ${zip}` : ""}
                  </div>
                  <div className="mt-5 text-gray-300 whitespace-pre-wrap">
                    {description.trim()
                      ? description.trim()
                      : (lang === "es" ? "Tu descripción aquí…" : "Your description here…")}
                  </div>

                  <div className="mt-6 text-xs text-gray-400">
                    {lang === "es"
                      ? "Nota: la edición completa se restringe para evitar abuso. (Ventana de edición se aplicará en la siguiente iteración.)"
                      : "Note: editing will be restricted to prevent abuse. (Edit window will apply in the next iteration.)"}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
