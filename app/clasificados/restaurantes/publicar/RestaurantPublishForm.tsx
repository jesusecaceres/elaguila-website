"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Lang = "es" | "en";

function t(lang: Lang, es: string, en: string) {
  return lang === "es" ? es : en;
}

const PLACE_TYPES = [
  { key: "brick", es: "Local (restaurante / café)", en: "Brick & mortar (restaurant / café)" },
  { key: "truck", es: "Food truck", en: "Food truck" },
  { key: "popup", es: "Pop-up / puesto temporal", en: "Pop-up / temporary stand" },
] as const;

export default function RestaurantPublishForm({ lang, plan }: { lang: Lang; plan?: string }) {
  const router = useRouter();

  const [placeType, setPlaceType] = useState<(typeof PLACE_TYPES)[number]["key"]>("brick");
  const [name, setName] = useState("");
  const [cuisine, setCuisine] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [notes, setNotes] = useState("");

  const errors = useMemo(() => {
    const e: string[] = [];
    if (!name.trim()) e.push(t(lang, "Agrega el nombre del restaurante.", "Add the restaurant name."));
    if (!city.trim()) e.push(t(lang, "Agrega la ciudad.", "Add the city."));
    // contact method: phone or website (for R2 discovery we keep light)
    if (!phone.trim() && !website.trim()) {
      e.push(t(lang, "Agrega teléfono o sitio web (mínimo 1 contacto).", "Add phone or website (at least 1 contact method)."));
    }
    return e;
  }, [lang, name, city, phone, website]);

  function onContinue() {
    if (errors.length) return;

    const qp = new URLSearchParams();
    qp.set("category", "restaurantes");
    qp.set("categoria", "restaurantes");
    qp.set("cat", "restaurantes");
    qp.set("lang", lang);
    if (plan) qp.set("plan", plan);
    qp.set("placeType", placeType);
    qp.set("bizName", name.trim());
    if (cuisine.trim()) qp.set("cuisine", cuisine.trim());
    qp.set("city", city.trim());
    if (phone.trim()) qp.set("phone", phone.trim());
    if (website.trim()) qp.set("website", website.trim());
    if (notes.trim()) qp.set("notes", notes.trim());

    // Continue into the canonical posting flow
    router.push(`/clasificados/publicar?${qp.toString()}`);
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
      <div className="text-sm font-semibold text-white">
        {t(lang, "Información básica", "Basic info")}
      </div>
      <p className="mt-2 text-sm text-gray-300">
        {t(
          lang,
          "Esto crea tu borrador. En el siguiente paso podrás subir fotos y completar el anuncio.",
          "This creates your draft. Next you’ll upload photos and complete the listing."
        )}
      </p>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="block">
          <span className="text-xs font-semibold text-gray-200">
            {t(lang, "Tipo de negocio", "Business type")}
          </span>
          <select
            value={placeType}
            onChange={(e) => setPlaceType(e.target.value as any)}
            className="mt-2 w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-yellow-500/40"
          >
            {PLACE_TYPES.map((p) => (
              <option key={p.key} value={p.key}>
                {t(lang, p.es, p.en)}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-xs font-semibold text-gray-200">
            {t(lang, "Ciudad", "City")}
          </span>
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder={t(lang, "Ej: San José", "e.g., San Jose")}
            className="mt-2 w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-gray-500 outline-none focus:ring-2 focus:ring-yellow-500/40"
          />
        </label>

        <label className="block md:col-span-2">
          <span className="text-xs font-semibold text-gray-200">
            {t(lang, "Nombre del restaurante", "Restaurant name")}
          </span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t(lang, "Ej: Taquería El León", "e.g., Lion Taqueria")}
            className="mt-2 w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-gray-500 outline-none focus:ring-2 focus:ring-yellow-500/40"
          />
        </label>

        <label className="block">
          <span className="text-xs font-semibold text-gray-200">
            {t(lang, "Cocina (opcional)", "Cuisine (optional)")}
          </span>
          <input
            value={cuisine}
            onChange={(e) => setCuisine(e.target.value)}
            placeholder={t(lang, "Ej: Mexicana, Mariscos", "e.g., Mexican, Seafood")}
            className="mt-2 w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-gray-500 outline-none focus:ring-2 focus:ring-yellow-500/40"
          />
        </label>

        <label className="block">
          <span className="text-xs font-semibold text-gray-200">
            {t(lang, "Teléfono (opcional)", "Phone (optional)")}
          </span>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder={t(lang, "Ej: (408) 555‑1234", "e.g., (408) 555-1234")}
            className="mt-2 w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-gray-500 outline-none focus:ring-2 focus:ring-yellow-500/40"
          />
        </label>

        <label className="block md:col-span-2">
          <span className="text-xs font-semibold text-gray-200">
            {t(lang, "Sitio web (opcional)", "Website (optional)")}
          </span>
          <input
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="https://"
            className="mt-2 w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-gray-500 outline-none focus:ring-2 focus:ring-yellow-500/40"
          />
        </label>

        <label className="block md:col-span-2">
          <span className="text-xs font-semibold text-gray-200">
            {t(lang, "Notas (opcional)", "Notes (optional)")}
          </span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            placeholder={t(
              lang,
              "Horario, especialidades, si aceptas órdenes por teléfono, etc.",
              "Hours, specialties, whether you take phone orders, etc."
            )}
            className="mt-2 w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-gray-500 outline-none focus:ring-2 focus:ring-yellow-500/40"
          />
        </label>
      </div>

      {errors.length > 0 && (
        <div className="mt-5 rounded-xl border border-red-500/20 bg-red-500/5 p-4">
          <div className="text-xs font-semibold text-red-200">
            {t(lang, "Para continuar:", "To continue:")}
          </div>
          <ul className="mt-2 list-disc pl-5 text-sm text-red-100/90">
            {errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-6 flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={onContinue}
          disabled={errors.length > 0}
          className="rounded-xl border border-yellow-400/45 bg-yellow-500/10 px-4 py-2 text-sm font-semibold text-yellow-200 hover:bg-yellow-500/15 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {t(lang, "Continuar", "Continue")}
        </button>

        <div className="text-xs text-gray-400 self-center">
          {t(
            lang,
            "No publicamos nada hasta que completes el siguiente paso.",
            "Nothing is published until you complete the next step."
          )}
        </div>
      </div>
    </div>
  );
}
