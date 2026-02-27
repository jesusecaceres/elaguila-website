"use client";

import { useEffect, useMemo, useState } from "react";
import type { Restaurant } from "../../data/restaurants";

type Lang = "es" | "en";

type AlertPrefs = {
  enabled: boolean;
  phone: string;
  email: string;
  radiusMiles: number;
  cuisines: string[];
  weeklyDigest: boolean;
  rareNearbySpecials: boolean;
};

const STORAGE_KEY = "leonix_restaurant_alerts_v1";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function readPrefs(): AlertPrefs {
  if (typeof window === "undefined") {
    return {
      enabled: false,
      phone: "",
      email: "",
      radiusMiles: 25,
      cuisines: [],
      weeklyDigest: true,
      rareNearbySpecials: false,
    };
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) throw new Error("empty");
    const p = JSON.parse(raw) as Partial<AlertPrefs>;
    return {
      enabled: !!p.enabled,
      phone: (p.phone || "").toString(),
      email: (p.email || "").toString(),
      radiusMiles: typeof p.radiusMiles === "number" ? p.radiusMiles : 25,
      cuisines: Array.isArray(p.cuisines) ? p.cuisines.filter(Boolean).map(String) : [],
      weeklyDigest: p.weeklyDigest !== false,
      rareNearbySpecials: !!p.rareNearbySpecials,
    };
  } catch {
    return {
      enabled: false,
      phone: "",
      email: "",
      radiusMiles: 25,
      cuisines: [],
      weeklyDigest: true,
      rareNearbySpecials: false,
    };
  }
}

function savePrefs(prefs: AlertPrefs) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}

export default function AlertsPanel({
  open,
  onClose,
  lang,
  restaurants,
}: {
  open: boolean;
  onClose: () => void;
  lang: Lang;
  restaurants: Restaurant[];
}) {
  const [prefs, setPrefs] = useState<AlertPrefs>(() => readPrefs());
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    if (!open) return;
    setPrefs(readPrefs());
    setSavedFlash(false);
  }, [open]);

  useEffect(() => {
    if (!savedFlash) return;
    const t = window.setTimeout(() => setSavedFlash(false), 1400);
    return () => window.clearTimeout(t);
  }, [savedFlash]);

  const cuisineOptions = useMemo(() => {
    const set = new Set<string>();
    restaurants.forEach((r) => r.cuisine && set.add(r.cuisine));
    return Array.from(set).sort((a, b) => a.localeCompare(b)).slice(0, 24);
  }, [restaurants]);

  if (!open) return null;

  const title = lang === "es" ? "Alertas de restaurantes" : "Restaurant alerts";
  const subtitle =
    lang === "es"
      ? "Recibe avisos cuando haya nuevos lugares o especiales cerca de ti."
      : "Get notified when new spots or specials pop up near you.";

  const save = () => {
    savePrefs(prefs);
    setSavedFlash(true);
  };

  const toggleCuisine = (c: string) => {
    setPrefs((p) => {
      const has = p.cuisines.includes(c);
      return { ...p, cuisines: has ? p.cuisines.filter((x) => x !== c) : [...p.cuisines, c] };
    });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
      <button
        type="button"
        aria-label="Close overlay"
        onClick={onClose}
        className="absolute inset-0 bg-black/60"
      />

      <div className="relative w-full sm:max-w-2xl bg-black/90 border border-yellow-600/25 rounded-t-2xl sm:rounded-2xl shadow-2xl p-5 sm:p-6 max-h-[85vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-yellow-200 font-extrabold text-xl">{title}</div>
            <div className="text-gray-300 text-sm mt-1">{subtitle}</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-gray-100 text-sm font-semibold"
          >
            {lang === "es" ? "Cerrar" : "Close"}
          </button>
        </div>

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="block">
            <div className="text-sm font-semibold text-gray-200">{lang === "es" ? "Teléfono (SMS)" : "Phone (SMS)"}</div>
            <input
              value={prefs.phone}
              onChange={(e) => setPrefs((p) => ({ ...p, phone: e.target.value }))}
              placeholder={lang === "es" ? "Ej: 408-555-1234" : "e.g. 408-555-1234"}
              className="mt-2 w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-gray-100 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-600/40"
            />
          </label>

          <label className="block">
            <div className="text-sm font-semibold text-gray-200">{lang === "es" ? "Correo" : "Email"}</div>
            <input
              value={prefs.email}
              onChange={(e) => setPrefs((p) => ({ ...p, email: e.target.value }))}
              placeholder={lang === "es" ? "Ej: nombre@correo.com" : "e.g. name@email.com"}
              className="mt-2 w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-gray-100 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-600/40"
            />
          </label>
        </div>

        <div className="mt-5">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-semibold text-gray-200">{lang === "es" ? "Radio" : "Radius"}</div>
            <div className="text-xs text-gray-400">{lang === "es" ? "millas" : "miles"}</div>
          </div>

          <div className="mt-2 flex flex-wrap gap-2">
            {[10, 25, 40, 50].map((mi) => {
              const active = prefs.radiusMiles === mi;
              return (
                <button
                  key={mi}
                  type="button"
                  onClick={() => setPrefs((p) => ({ ...p, radiusMiles: mi }))}
                  className={cx(
                    "px-3 py-2 rounded-xl text-sm font-semibold border transition",
                    active
                      ? "bg-yellow-500/20 border-yellow-500/40 text-yellow-200"
                      : "bg-black/30 border-white/10 text-gray-100 hover:bg-white/5"
                  )}
                >
                  {mi}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-5">
          <div className="text-sm font-semibold text-gray-200">{lang === "es" ? "Cocinas" : "Cuisines"}</div>
          <div className="text-xs text-gray-400 mt-1">
            {lang === "es" ? "Elige lo que te interesa (opcional)." : "Pick what you care about (optional)."}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {cuisineOptions.map((c) => {
              const active = prefs.cuisines.includes(c);
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => toggleCuisine(c)}
                  className={cx(
                    "px-3 py-1.5 rounded-full text-sm border transition",
                    active
                      ? "bg-yellow-500/15 border-yellow-500/40 text-yellow-200"
                      : "bg-white/5 border-white/10 hover:bg-white/10 text-gray-100"
                  )}
                >
                  {c}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/30 p-3">
            <input
              type="checkbox"
              checked={prefs.weeklyDigest}
              onChange={(e) => setPrefs((p) => ({ ...p, weeklyDigest: e.target.checked }))}
              className="h-5 w-5"
            />
            <div>
              <div className="text-sm font-semibold text-gray-100">
                {lang === "es" ? "Resumen semanal" : "Weekly digest"}
              </div>
              <div className="text-xs text-gray-400">
                {lang === "es" ? "Una vez por semana (recomendado)." : "Once per week (recommended)."}
              </div>
            </div>
          </label>

          <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/30 p-3">
            <input
              type="checkbox"
              checked={prefs.rareNearbySpecials}
              onChange={(e) => setPrefs((p) => ({ ...p, rareNearbySpecials: e.target.checked }))}
              className="h-5 w-5"
            />
            <div>
              <div className="text-sm font-semibold text-gray-100">
                {lang === "es" ? "Especiales cerca (poco frecuente)" : "Nearby specials (rare)"}
              </div>
              <div className="text-xs text-gray-400">
                {lang === "es" ? "Solo cuando valga la pena." : "Only when it's worth it."}
              </div>
            </div>
          </label>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={prefs.enabled}
              onChange={(e) => setPrefs((p) => ({ ...p, enabled: e.target.checked }))}
              className="h-5 w-5"
            />
            <div className="text-sm text-gray-200 font-semibold">
              {lang === "es" ? "Activar alertas" : "Enable alerts"}
            </div>
          </label>

          <div className="flex items-center gap-2">
            {savedFlash ? (
              <div className="text-sm text-green-300 font-semibold">{lang === "es" ? "Guardado" : "Saved"}</div>
            ) : null}
            <button
              type="button"
              onClick={save}
              className="px-4 py-2 rounded-xl bg-yellow-500/20 border border-yellow-500/40 text-yellow-200 font-extrabold hover:bg-yellow-500/25"
            >
              {lang === "es" ? "Guardar" : "Save"}
            </button>
          </div>
        </div>

        <div className="mt-4 text-xs text-gray-500">
          {lang === "es"
            ? "Nota: por ahora estas alertas se guardan en este dispositivo. Con la cuenta, lo conectaremos a SMS/Email."
            : "Note: for now alerts are saved on this device. With accounts, we’ll connect SMS/Email."}
        </div>
      </div>
    </div>
  );
}
