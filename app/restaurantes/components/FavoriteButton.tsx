"use client";

import { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "leonix_restaurant_favorites_v1";

function readIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.filter((x) => typeof x === "string");
    return [];
  } catch {
    return [];
  }
}

function writeIds(ids: string[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // ignore
  }
}

export default function FavoriteButton({
  id,
  lang = "es",
  size = "md",
  className = "",
}: {
  id: string;
  lang?: "es" | "en";
  size?: "sm" | "md";
  className?: string;
}) {
  const [fav, setFav] = useState(false);

  useEffect(() => {
    const ids = readIds();
    setFav(ids.includes(id));
  }, [id]);

  const label = useMemo(() => {
    if (lang === "en") return fav ? "Remove from saved" : "Save";
    return fav ? "Quitar de guardados" : "Guardar";
  }, [fav, lang]);

  const dims = size === "sm" ? "h-9 w-9" : "h-10 w-10";

  function toggle() {
    const ids = readIds();
    const next = ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id];
    writeIds(next);
    setFav(next.includes(id));
    // broadcast to other components on the page
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("leonix:favorites", { detail: { ids: next } }));
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      className={[
        "inline-flex items-center justify-center rounded-xl border transition",
        dims,
        fav
          ? "bg-yellow-500/20 border-yellow-500/40 text-yellow-200"
          : "bg-black/30 border-white/10 text-gray-200 hover:bg-black/40",
        className,
      ].join(" ")}
    >
      <svg
        viewBox="0 0 24 24"
        className={size === "sm" ? "h-5 w-5" : "h-6 w-6"}
        fill={fav ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M12 21s-7.5-4.7-9.6-9.1C.9 8.7 2.5 6 5.5 6c1.8 0 3 .9 3.7 1.8.7-.9 1.9-1.8 3.7-1.8 3 0 4.6 2.7 3.1 5.9C19.5 16.3 12 21 12 21z" />
      </svg>
    </button>
  );
}

export function getFavoriteIds(): string[] {
  return readIds();
}
