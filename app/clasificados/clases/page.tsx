"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "../../components/Navbar";
import newLogo from "../../../public/logo.png";

type Lang = "es" | "en";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function withLang(path: string, lang: Lang) {
  const hasQuery = path.includes("?");
  return `${path}${hasQuery ? "&" : "?"}lang=${lang}`;
}

export default function ClasesPage() {
  const router = useRouter();
  const sp = useSearchParams();

  // ✅ Null-safe (some setups type this hook as possibly null)
  const lang = useMemo<Lang>(() => {
    const v = sp?.get("lang");
    return v === "en" ? "en" : "es";
  }, [sp]);

  // Lightweight filter collectors (no engine duplication)
  const [subject, setSubject] = useState("");
  const [level, setLevel] = useState("");
  const [mode, setMode] = useState<"" | "online" | "in-person">("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [city, setCity] = useState("");
  const [radius, setRadius] = useState("");

  const t = useMemo(
    () => ({
      title: lang === "es" ? "Clases" : "Classes",
      subtitle:
        lang === "es"
          ? "Encuentra instructores, cursos y programas en tu área."
          : "Find instructors, courses, and programs near you.",
      cta: lang === "es" ? "Ver resultados" : "View results",
      clear: lang === "es" ? "Limpiar" : "Clear",
      subject: lang === "es" ? "Tema" : "Subject",
      level: lang === "es" ? "Nivel" : "Level",
      mode: lang === "es" ? "Modalidad" : "Mode",
      online: lang === "es" ? "En línea" : "Online",
      inPerson: lang === "es" ? "Presencial" : "In-person",
      price: lang === "es" ? "Precio" : "Price",
      city: lang === "es" ? "Ciudad" : "City",
      radius: lang === "es" ? "Radio" : "Radius",
      miles: lang === "es" ? "millas" : "miles",
      back: lang === "es" ? "Regresar" : "Back",
    }),
    [lang]
  );

  function goToLista() {
    const params = new URLSearchParams();
    params.set("lang", lang);
    params.set("cat", "clases");

    if (subject.trim()) params.set("q", subject.trim());
    if (level.trim()) params.set("level", level.trim());
    if (mode) params.set("mode", mode);

    if (minPrice.trim()) params.set("min", minPrice.trim());
    if (maxPrice.trim()) params.set("max", maxPrice.trim());

    if (city.trim()) params.set("city", city.trim());
    if (radius.trim()) params.set("radius", radius.trim());

    router.push(`/clasificados/lista?${params.toString()}`);
  }

  function clearAll() {
    setSubject("");
    setLevel("");
    setMode("");
    setMinPrice("");
    setMaxPrice("");
    setCity("");
    setRadius("");
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      <main className="max-w-6xl mx-auto px-6 pt-28 pb-16">
        {/* Hero */}
        <section className="text-center">
          <div className="flex items-center justify-center mb-6">
            <Image
              src={newLogo}
              alt="LEONIX"
              width={90}
              height={90}
              className="h-[90px] w-[90px]"
              priority
            />
          </div>

          <h1 className="text-3xl md:text-4xl font-semibold text-yellow-400 tracking-tight">
            {t.title}
          </h1>
          <p className="mt-3 text-gray-300 max-w-2xl mx-auto">
            {t.subtitle}
          </p>

          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              onClick={() => router.push(withLang("/clasificados", lang))}
              className={cx(
                "rounded-xl border border-yellow-600/30 bg-black/40 px-4 py-2 text-sm",
                "hover:border-yellow-500/40 hover:bg-black/55 transition"
              )}
            >
              {t.back}
            </button>

            <button
              onClick={goToLista}
              className={cx(
                "rounded-xl bg-yellow-500 px-4 py-2 text-sm font-semibold text-black",
                "hover:bg-yellow-400 transition"
              )}
            >
              {t.cta}
            </button>
          </div>
        </section>

        {/* Filters */}
        <section className="mt-10">
          <div className="rounded-2xl border border-yellow-600/20 bg-black/35 p-5 md:p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-gray-300">{t.subject}</label>
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-sm text-white outline-none focus:border-yellow-600/40"
                  placeholder={lang === "es" ? "Ej: Inglés, Matemáticas" : "e.g., English, Math"}
                />
              </div>

              <div>
                <label className="text-xs text-gray-300">{t.level}</label>
                <input
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-sm text-white outline-none focus:border-yellow-600/40"
                  placeholder={lang === "es" ? "Ej: Básico, Avanzado" : "e.g., Beginner, Advanced"}
                />
              </div>

              <div>
                <label className="text-xs text-gray-300">{t.mode}</label>
                <select
                  value={mode}
                  onChange={(e) => setMode(e.target.value as any)}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-sm text-white outline-none focus:border-yellow-600/40"
                >
                  <option value="">—</option>
                  <option value="online">{t.online}</option>
                  <option value="in-person">{t.inPerson}</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-gray-300">{t.price}</label>
                <div className="mt-2 grid grid-cols-2 gap-3">
                  <input
                    inputMode="numeric"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-sm text-white outline-none focus:border-yellow-600/40"
                    placeholder={lang === "es" ? "Mín" : "Min"}
                  />
                  <input
                    inputMode="numeric"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-sm text-white outline-none focus:border-yellow-600/40"
                    placeholder={lang === "es" ? "Máx" : "Max"}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-300">{t.city}</label>
                <input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-sm text-white outline-none focus:border-yellow-600/40"
                  placeholder={lang === "es" ? "Ej: San José" : "e.g., San Jose"}
                />
              </div>

              <div>
                <label className="text-xs text-gray-300">{t.radius}</label>
                <input
                  inputMode="numeric"
                  value={radius}
                  onChange={(e) => setRadius(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-sm text-white outline-none focus:border-yellow-600/40"
                  placeholder={lang === "es" ? `Ej: 25 ${t.miles}` : `e.g., 25 ${t.miles}`}
                />
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-end gap-3">
              <button
                onClick={clearAll}
                className="rounded-xl border border-yellow-600/30 bg-black/40 px-4 py-2 text-sm hover:border-yellow-500/40 hover:bg-black/55 transition"
              >
                {t.clear}
              </button>
              <button
                onClick={goToLista}
                className="rounded-xl bg-yellow-500 px-4 py-2 text-sm font-semibold text-black hover:bg-yellow-400 transition"
              >
                {t.cta}
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
