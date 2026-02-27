"use client";

import { useEffect, useMemo, useState } from "react";
import { addReview, getAlertPrefs, getReviewStats, saveAlertPrefs, getRecentCities, pushRecentCity, saveGeoState, getGeoState } from "./restaurantR3Storage";

type Lang = "es" | "en";

function t(lang: Lang, es: string, en: string) {
  return lang === "es" ? es : en;
}

function Stars({ value }: { value: number }) {
  const full = Math.round(value);
  return (
    <div className="flex items-center gap-0.5" aria-label={`${value} stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={i < full ? "text-yellow-300" : "text-gray-600"} aria-hidden="true">
          ★
        </span>
      ))}
    </div>
  );
}

export function ReviewSummary({ restaurantId, lang }: { restaurantId: string; lang: Lang }) {
  const [stats, setStats] = useState<{ avg: number; count: number; recommendPct: number }>({ avg: 0, count: 0, recommendPct: 0 });

  useEffect(() => {
    setStats(getReviewStats(restaurantId));
  }, [restaurantId]);

  if (!stats.count) {
    return (
      <div className="text-xs text-gray-400">
        {t(lang, "Sé el primero en dejar una reseña positiva (ayuda a otras familias).", "Be the first to leave a positive review (it helps other families).")}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-xs text-gray-300">
      <Stars value={stats.avg} />
      <span className="font-semibold text-white">{stats.avg.toFixed(1)}</span>
      <span className="text-gray-500">({stats.count})</span>
      {stats.count >= 3 && (
        <span className="ml-2 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-200">
          {t(lang, "Recomendado", "Recommended")} {stats.recommendPct}%
        </span>
      )}
    </div>
  );
}

export function ReviewButton({ restaurantId, lang }: { restaurantId: string; lang: Lang }) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState<number>(5);
  const [recommend, setRecommend] = useState<boolean>(true);
  const [note, setNote] = useState("");

  function submit() {
    addReview(restaurantId, { rating, recommend, note });
    setNote("");
    setRecommend(true);
    setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white hover:bg-white/10 transition"
      >
        {t(lang, "Dejar reseña", "Leave review")}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-lg rounded-2xl border border-yellow-400/20 bg-black p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-lg font-semibold text-white">{t(lang, "Reseña (positiva primero)", "Review (positive-first)")}</div>
                <div className="mt-1 text-sm text-gray-400">
                  {t(
                    lang,
                    "Aquí celebramos lo bueno. Si hubo un problema serio, usa 'Email' o 'Texto' para resolverlo directamente.",
                    "We celebrate the good. If there was a serious issue, use Email or Text to resolve it directly."
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-gray-200 hover:bg-white/10"
                aria-label={t(lang, "Cerrar", "Close")}
              >
                ✕
              </button>
            </div>

            <div className="mt-5">
              <div className="text-sm font-semibold text-white">{t(lang, "Calificación", "Rating")}</div>
              <div className="mt-2 flex items-center gap-2">
                <select
                  value={rating}
                  onChange={(e) => setRating(Number(e.target.value))}
                  className="w-28 rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none"
                >
                  {[5, 4, 3, 2, 1].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
                <div className="text-sm text-gray-400">{t(lang, "1–5 estrellas", "1–5 stars")}</div>
              </div>

              <div className="mt-4">
                <div className="text-sm font-semibold text-white">{t(lang, "¿Lo recomiendas a familias?", "Would you recommend to families?")}</div>
                <div className="mt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setRecommend(true)}
                    className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${recommend ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-200" : "border-white/10 bg-white/5 text-gray-200 hover:bg-white/10"}`}
                  >
                    {t(lang, "Sí", "Yes")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setRecommend(false)}
                    className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${!recommend ? "border-red-400/40 bg-red-500/10 text-red-200" : "border-white/10 bg-white/5 text-gray-200 hover:bg-white/10"}`}
                  >
                    {t(lang, "No", "No")}
                  </button>
                  <div className="text-sm text-gray-400">{t(lang, "Solo para orientar a otros.", "Just to guide others.")}</div>
                </div>
              </div>

              <div className="mt-4 text-sm font-semibold text-white">{t(lang, "Mensaje", "Message")}</div>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={4}
                placeholder={t(lang, "¿Qué te gustó? (servicio, sabor, ambiente…)", "What did you like? (service, flavor, vibe…)")}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-gray-600 outline-none"
              />

              <div className="mt-5 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-gray-200 hover:bg-white/10"
                >
                  {t(lang, "Cancelar", "Cancel")}
                </button>
                <button
                  type="button"
                  onClick={submit}
                  className="rounded-xl border border-yellow-400/45 bg-yellow-500/10 px-4 py-2 text-sm font-semibold text-yellow-200 hover:bg-yellow-500/15"
                >
                  {t(lang, "Guardar", "Save")}
                </button>
              </div>

              <div className="mt-3 text-xs text-gray-500">
                {t(lang, "Guardado solo en este dispositivo por ahora (R3).", "Saved on this device for now (R3).")}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function AlertsPanel({ lang }: { lang: Lang }) {
  const [expanded, setExpanded] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [cuisine, setCuisine] = useState("");
  const [radiusMi, setRadiusMi] = useState<10 | 25 | 40 | 50>(25);
  const [frequency, setFrequency] = useState<"weekly" | "biweekly" | "monthly">("weekly");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const prefs = getAlertPrefs();
    setEnabled(prefs.enabled);
    setCuisine(prefs.cuisine || "");
    setRadiusMi(prefs.radiusMi);
    setFrequency(prefs.frequency);
  }, []);

  const hint = useMemo(() => {
    const freq = frequency === "weekly" ? t(lang, "semanal", "weekly") : frequency === "biweekly" ? t(lang, "cada 2 semanas", "every 2 weeks") : t(lang, "mensual", "monthly");
    return t(lang, `Recibirás un aviso ${freq} cuando aparezcan nuevos restaurantes.`, `You'll get a ${freq} note when new restaurants appear.`);
  }, [frequency, lang]);

  function save() {
    saveAlertPrefs({ enabled, cuisine, radiusMi, frequency });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (!expanded) {
    return (
      <div className="rounded-2xl border border-yellow-400/15 bg-black/30 p-5 text-left">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-base font-semibold text-white">{t(lang, "Alertas (opt‑in)", "Alerts (opt‑in)")}</div>
          <button
            type="button"
            onClick={() => setExpanded(false)}
            className="mt-2 text-xs font-semibold text-gray-300 hover:text-white"
          >
            {t(lang, "Cerrar configuración", "Close setup")}
          </button>
            <div className="mt-1 text-sm text-gray-400">
              {t(lang, "Recibe avisos cuando aparezcan nuevos lugares. Sin spam.", "Get a note when new spots appear. No spam.")}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="rounded-xl border border-yellow-400/45 bg-yellow-500/10 px-4 py-2 text-sm font-semibold text-yellow-200 hover:bg-yellow-500/15"
          >
            {t(lang, "Configurar", "Set up")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-yellow-400/20 bg-black/40 p-6 text-left">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-lg font-semibold text-white">{t(lang, "Alertas (opt‑in)", "Alerts (opt‑in)")}</div>
          <button
            type="button"
            onClick={() => setExpanded(false)}
            className="mt-2 text-xs font-semibold text-gray-300 hover:text-white"
          >
            {t(lang, "Cerrar configuración", "Close setup")}
          </button>
          <div className="mt-1 text-sm text-gray-400">
            {t(lang, "Sin spam. Tú eliges comida, radio y frecuencia. Cancela cuando quieras.", "No spam. You choose cuisine, radius, and frequency. Cancel anytime.")}
          </div>
        </div>

        <label className="inline-flex items-center gap-2 text-sm text-gray-200">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="h-4 w-4 accent-yellow-300"
          />
          {t(lang, "Activar", "Enable")}
        </label>
      </div>

      <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <div className="text-xs font-semibold text-gray-300">{t(lang, "Cocina", "Cuisine")}</div>
          <input
            value={cuisine}
            onChange={(e) => setCuisine(e.target.value)}
            placeholder={t(lang, "Ej: Tacos, Pupusas…", "Ex: Tacos, Pupusas…")}
            className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-gray-600 outline-none"
          />
        </div>

        <div>
          <div className="text-xs font-semibold text-gray-300">{t(lang, "Radio", "Radius")}</div>
          <select
            value={radiusMi}
            onChange={(e) => setRadiusMi(Number(e.target.value) as any)}
            className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none"
          >
            {[10, 25, 40, 50].map((n) => (
              <option key={n} value={n}>
                {n} mi
              </option>
            ))}
          </select>
        </div>

        <div>
          <div className="text-xs font-semibold text-gray-300">{t(lang, "Frecuencia", "Frequency")}</div>
          <select
            value={frequency}
            onChange={(e) => setFrequency(e.target.value as any)}
            className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none"
          >
            <option value="weekly">{t(lang, "Semanal", "Weekly")}</option>
            <option value="biweekly">{t(lang, "Cada 2 semanas", "Every 2 weeks")}</option>
            <option value="monthly">{t(lang, "Mensual", "Monthly")}</option>
          </select>
        </div>
      </div>

      <div className="mt-3 text-xs text-gray-500">{hint}</div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <div className="text-xs text-gray-500">
          {t(lang, "R3: Preferencias guardadas en este dispositivo.", "R3: Preferences saved on this device.")}
        </div>
        <button
          type="button"
          onClick={save}
          className="rounded-xl border border-yellow-400/45 bg-yellow-500/10 px-4 py-2 text-sm font-semibold text-yellow-200 hover:bg-yellow-500/15"
        >
          {saved ? t(lang, "Guardado ✅", "Saved ✅") : t(lang, "Guardar alertas", "Save alerts")}
        </button>
      </div>
    </div>
  );
}



type DiscoveryState = {
  q: string;
  city: string;
  radiusMi: 10 | 25 | 40 | 50;
  cuisine: string;
  price: "" | "$" | "$$" | "$$$";
  savedOnly: boolean;
  openNow: boolean;
  family: boolean;
  diet: "" | "vegan" | "halal" | "glutenfree";
};

export function DiscoveryPanel({
  lang,
  initial,
  onApply,
}: {
  lang: Lang;
  initial: DiscoveryState;
  onApply: (next: DiscoveryState) => void;
}) {
  const [q, setQ] = useState(initial.q);
  const [city, setCity] = useState(initial.city);
  const [radiusMi, setRadiusMi] = useState<10 | 25 | 40 | 50>(initial.radiusMi);
  const [cuisine, setCuisine] = useState(initial.cuisine);
  const [price, setPrice] = useState<"" | "$" | "$$" | "$$$">(initial.price);
  const [savedOnly, setSavedOnly] = useState(initial.savedOnly);
  const [openNow, setOpenNow] = useState(initial.openNow);
  const [family, setFamily] = useState(initial.family);
  const [diet, setDiet] = useState<"" | "vegan" | "halal" | "glutenfree">(initial.diet);

  const [recentCities, setRecentCities] = useState<string[]>([]);
  const [geoStatus, setGeoStatus] = useState<"idle" | "saving" | "saved" | "blocked">("idle");

  useEffect(() => {
    setRecentCities(getRecentCities());
    const g = getGeoState();
    if (g) setGeoStatus("saved");
  }, []);

  function apply() {
    const next: DiscoveryState = {
      q: q.trim(),
      city: city.trim(),
      radiusMi,
      cuisine,
      price,
      savedOnly,
      openNow,
      family,
      diet,
    };
    if (next.city) pushRecentCity(next.city);
    onApply(next);
  }

  function useMyLocation() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGeoStatus("blocked");
      return;
    }
    setGeoStatus("saving");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        saveGeoState(pos.coords.latitude, pos.coords.longitude);
        setGeoStatus("saved");
      },
      () => setGeoStatus("blocked"),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 }
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="flex flex-col lg:flex-row gap-4 lg:items-end lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-white">{t(lang, "Buscar", "Search")}</div>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t(lang, "Tacos, pho, carne asada…", "Tacos, pho, BBQ…")}
            className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-gray-500 outline-none focus:border-yellow-400/45"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:w-[520px]">
          <div>
            <div className="text-sm font-semibold text-white">{t(lang, "Ciudad", "City")}</div>
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder={t(lang, "Ej: San José", "e.g., San Jose")}
              className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-gray-500 outline-none focus:border-yellow-400/45"
            />
          </div>

          <div>
            <div className="text-sm font-semibold text-white">{t(lang, "Radio", "Radius")}</div>
            <select
              value={radiusMi}
              onChange={(e) => setRadiusMi(Number(e.target.value) as any)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-3 text-sm text-white outline-none focus:border-yellow-400/45"
            >
              <option value={10}>10 mi</option>
              <option value={25}>25 mi</option>
              <option value={40}>40 mi</option>
              <option value={50}>50 mi</option>
            </select>
          </div>

          <div className="flex flex-col">
            <div className="text-sm font-semibold text-white">{t(lang, "Ubicación", "Location")}</div>
            <button
              type="button"
              onClick={useMyLocation}
              className="mt-2 inline-flex items-center justify-center rounded-xl border border-yellow-400/25 bg-yellow-500/10 px-3 py-3 text-sm font-semibold text-yellow-200 hover:bg-yellow-500/15 transition"
            >
              {t(lang, "Usar mi ubicación", "Use my location")}
            </button>
            <div className="mt-1 text-[11px] text-gray-400">
              {geoStatus === "saved"
                ? t(lang, "Listo: usaremos tu zona cuando haya datos.", "Saved: we'll use your area once listings exist.")
                : geoStatus === "blocked"
                  ? t(lang, "Permiso denegado o no disponible.", "Permission denied or unavailable.")
                  : t(lang, "Opcional. Respeta tu privacidad.", "Optional. Privacy-respectful.")}
            </div>
          </div>
        </div>
      </div>

      {recentCities.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <div className="text-xs font-semibold text-gray-400">{t(lang, "Recientes:", "Recent:")}</div>
          {recentCities.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCity(c)}
              className="rounded-full border border-white/10 bg-black/30 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/10 transition"
            >
              {c}
            </button>
          ))}
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-2">
        {[
          "Mexican",
          "Latino",
          "American",
          "BBQ",
          "Chinese",
          "Japanese",
          "Korean",
          "Thai",
          "Vietnamese",
          "Indian",
          "Greek",
          "Italian",
          "Seafood",
          "Breakfast",
          "Coffee",
          "Dessert",
        ].map((c) => {
          const active = cuisine.toLowerCase() === c.toLowerCase();
          return (
            <button
              key={c}
              type="button"
              onClick={() => setCuisine(active ? "" : c)}
              className={
                active
                  ? "rounded-full border border-yellow-400/45 bg-yellow-500/15 px-3 py-1.5 text-xs font-semibold text-yellow-100"
                  : "rounded-full border border-white/10 bg-black/30 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/10 transition"
              }
            >
              {c}
            </button>
          );
        })}
      </div>

      <div className="mt-5 grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div>
          <div className="text-sm font-semibold text-white">{t(lang, "Precio", "Price")}</div>
          <select
            value={price}
            onChange={(e) => setPrice((e.target.value as any) || "")}
            className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-3 text-sm text-white outline-none focus:border-yellow-400/45"
          >
            <option value="">{t(lang, "Cualquiera", "Any")}</option>
            <option value="$">$</option>
            <option value="$$">$$</option>
            <option value="$$$">$$$</option>
          </select>
        </div>

        <Toggle lang={lang} label={t(lang, "Abierto ahora", "Open now")} value={openNow} onChange={setOpenNow} hint={t(lang, "Se activará cuando los negocios agreguen horario.", "Will activate once businesses add hours.")} disabled />
        <Toggle lang={lang} label={t(lang, "Familiar", "Family-friendly")} value={family} onChange={setFamily} hint={t(lang, "Opcional.", "Optional.")} />
        <div>
          <div className="text-sm font-semibold text-white">{t(lang, "Dietas", "Diet")}</div>
          <select
            value={diet}
            onChange={(e) => setDiet((e.target.value as any) || "")}
            className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-3 text-sm text-white outline-none focus:border-yellow-400/45"
          >
            <option value="">{t(lang, "Opcional", "Optional")}</option>
            <option value="vegan">{t(lang, "Vegano", "Vegan")}</option>
            <option value="halal">Halal</option>
            <option value="glutenfree">{t(lang, "Sin gluten", "Gluten-free")}</option>
          </select>
        </div>
      </div>

      <div className="mt-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <label className="inline-flex items-center gap-2 text-sm font-semibold text-white">
          <input
            type="checkbox"
            checked={savedOnly}
            onChange={(e) => setSavedOnly(e.target.checked)}
            className="h-4 w-4 rounded border border-white/20 bg-black/40"
          />
          {t(lang, "Solo guardados", "Saved only")}
        </label>

        <button
          type="button"
          onClick={apply}
          className="inline-flex items-center justify-center rounded-xl border border-yellow-400/25 bg-yellow-500/10 px-5 py-3 text-sm font-semibold text-yellow-200 hover:bg-yellow-500/15 transition"
        >
          {t(lang, "Aplicar", "Apply")}
        </button>
      </div>
    </div>
  );
}

function Toggle({
  lang,
  label,
  value,
  onChange,
  hint,
  disabled,
}: {
  lang: Lang;
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  hint?: string;
  disabled?: boolean;
}) {
  return (
    <div className={disabled ? "opacity-60" : ""}>
      <div className="text-sm font-semibold text-white">{label}</div>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(!value)}
        className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-3 text-sm font-semibold text-white hover:bg-white/10 transition disabled:cursor-not-allowed"
      >
        {value ? t(lang, "Activado", "On") : t(lang, "Apagado", "Off")}
      </button>
      {hint && <div className="mt-1 text-[11px] text-gray-400">{hint}</div>}
    </div>
  );
}
