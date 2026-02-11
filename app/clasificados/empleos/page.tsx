"use client";

import Image from "next/image";
import React, { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "../../components/Navbar";
import newLogo from "../../../public/logo.png";

type Lang = "es" | "en";

const PRESERVE_KEYS = ["q", "city", "zip", "r", "sort", "view"];

export default function EmpleosPage() {
  const sp = useSearchParams();
  const router = useRouter();

  const lang = ((sp?.get("lang") ?? "es") === "en" ? "en" : "es") as Lang;

  const [jtype, setJtype] = useState("");
      const [jpmin, setJpmin] = useState("");
      const [jpmax, setJpmax] = useState("");
      const [jremote, setJremote] = useState("");
      const [jindustry, setJindustry] = useState("");

  const hasActive = useMemo(() => {
    return (
      jtype !== "" ||
          jpmin !== "" ||
          jpmax !== "" ||
          jremote !== "" ||
          jindustry !== ""
    );
  }, [jtype, jpmin, jpmax, jremote, jindustry]);

  function buildListaUrl() {
    const p = new URLSearchParams();

    for (const k of PRESERVE_KEYS) {
      const v = sp?.get(k);
      if (v) p.set(k, v);
    }

    p.set("lang", lang);
    p.set("cat", "empleos");

    if (jtype) p.set("jtype", jtype); else p.delete("jtype");
        if (jpmin) p.set("jpmin", jpmin); else p.delete("jpmin");
        if (jpmax) p.set("jpmax", jpmax); else p.delete("jpmax");
        if (jremote) p.set("jremote", jremote); else p.delete("jremote");
        if (jindustry) p.set("jindustry", jindustry); else p.delete("jindustry");

    return `/clasificados/lista?${p.toString()}`;
  }

  function resetAll() {
    setJtype("");
        setJpmin("");
        setJpmax("");
        setJremote("");
        setJindustry("");
  }

  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />

      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.16),transparent_55%)]" />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 pt-16 sm:pt-20 pb-10">
          <div className="flex flex-col items-center text-center">
            <Image
              src={newLogo}
              alt="LEONIX"
              width={92}
              height={92}
              className="h-20 w-20 sm:h-24 sm:w-24"
              priority
            />
            <h1 className="mt-4 text-3xl sm:text-4xl font-extrabold tracking-tight text-[#d4af37]">
              {lang === "es" ? "Empleos" : "Jobs"}
            </h1>
            <p className="mt-3 max-w-2xl text-sm sm:text-base text-white/80">
              {lang === "es" ? "Explora oportunidades por tipo de empleo, pago y modalidad. Manténlo simple y efectivo." : "Browse jobs by type, pay, and work mode. Simple and effective."}
            </p>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              <button
                onClick={() => router.push(buildListaUrl())}
                className="rounded-xl bg-[#d4af37] px-5 py-2.5 text-sm font-semibold text-black hover:brightness-95"
              >
                {lang === "es" ? "Ver resultados" : "See results"}
              </button>
              <button
                onClick={() => router.push(`/clasificados?lang=${lang}`)}
                className="rounded-xl border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10"
              >
                {lang === "es" ? "Explorar todas las categorías" : "Explore all categories"}
              </button>
              {hasActive && (
                <button
                  onClick={resetAll}
                  className="text-sm text-white/70 hover:text-white underline underline-offset-4"
                >
                  {lang === "es" ? "Restablecer" : "Reset"}
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-6">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-white">
                {lang === "es" ? "Filtros rápidos" : "Quick filters"}
              </p>
              <p className="mt-0.5 text-xs text-white/70">
                {lang === "es" ? "Ajusta lo básico y abre Más filtros para detalles." : "Set the basics, then open More filters for details."}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
            >
              {lang === "es" ? "Más filtros" : "More filters"}
            </button>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <FieldContainer label={lang === "es" ? "Tipo de empleo" : "Job type"}>
  <select
    value={jtype}
    onChange={(e) => setJtype(e.target.value)}
    className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-[#d4af37]/60"
  >
    <option value="">{lang === "es" ? "Cualquiera" : "Any"}</option>
    <option value="full-time">{lang === "es" ? "Tiempo completo" : "Full-time"}</option>
    <option value="part-time">{lang === "es" ? "Medio tiempo" : "Part-time"}</option>
    <option value="contract">{lang === "es" ? "Contrato" : "Contract"}</option>
    <option value="temporary">{lang === "es" ? "Temporal" : "Temporary"}</option>
  </select>
</FieldContainer>
            <FieldContainer label={lang === "es" ? "Pago mín." : "Pay min"}>
  <input
    type="number"
    value={jpmin}
    onChange={(e) => setJpmin(e.target.value)}
    placeholder={lang === "es" ? "ej. 18" : "e.g. 18"}
    className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-white/40 outline-none focus:border-[#d4af37]/60"
  />
</FieldContainer>
            <FieldContainer label={lang === "es" ? "Pago máx." : "Pay max"}>
  <input
    type="number"
    value={jpmax}
    onChange={(e) => setJpmax(e.target.value)}
    placeholder={lang === "es" ? "ej. 35" : "e.g. 35"}
    className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-white/40 outline-none focus:border-[#d4af37]/60"
  />
</FieldContainer>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={() => router.push(buildListaUrl())}
              className="rounded-xl bg-[#d4af37] px-5 py-2.5 text-sm font-semibold text-black hover:brightness-95"
            >
              {lang === "es" ? "Ver resultados" : "See results"}
            </button>

            <button
              onClick={() => setDrawerOpen(true)}
              className="rounded-xl border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10"
            >
              {lang === "es" ? "Abrir filtros avanzados" : "Open advanced filters"}
            </button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 sm:px-6 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <aside className="hidden lg:block lg:col-span-4">
            <div className="sticky top-24 rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-white">
                    {lang === "es" ? "Filtros avanzados" : "Advanced filters"}
                  </p>
                  <p className="mt-0.5 text-xs text-white/70">
                    {lang === "es" ? "Refina tu búsqueda sin saturar la vista." : "Refine without clutter."}
                  </p>
                </div>
                {hasActive && (
                  <button
                    onClick={resetAll}
                    className="text-xs text-white/70 hover:text-white underline underline-offset-4"
                  >
                    {lang === "es" ? "Restablecer" : "Reset"}
                  </button>
                )}
              </div>

              <div className="mt-4 space-y-3">
                <FieldContainer label={lang === "es" ? "Modalidad" : "Work mode"}>
  <select
    value={jremote}
    onChange={(e) => setJremote(e.target.value)}
    className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-[#d4af37]/60"
  >
    <option value="">{lang === "es" ? "Cualquiera" : "Any"}</option>
    <option value="onsite">{lang === "es" ? "Presencial" : "On-site"}</option>
    <option value="remote">{lang === "es" ? "Remoto" : "Remote"}</option>
    <option value="hybrid">{lang === "es" ? "Híbrido" : "Hybrid"}</option>
  </select>
</FieldContainer>
            <FieldContainer label={lang === "es" ? "Industria" : "Industry"}>
  <select
    value={jindustry}
    onChange={(e) => setJindustry(e.target.value)}
    className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-[#d4af37]/60"
  >
    <option value="">{lang === "es" ? "Cualquiera" : "Any"}</option>
    <option value="construction">{lang === "es" ? "Construcción" : "Construction"}</option>
    <option value="restaurant">{lang === "es" ? "Restaurante" : "Restaurant"}</option>
    <option value="office">{lang === "es" ? "Oficina" : "Office"}</option>
    <option value="healthcare">{lang === "es" ? "Salud" : "Healthcare"}</option>
    <option value="warehouse">{lang === "es" ? "Bodega/Almacén" : "Warehouse"}</option>
    <option value="drivers">{lang === "es" ? "Choferes" : "Drivers"}</option>
  </select>
</FieldContainer>
              </div>

              <button
                onClick={() => router.push(buildListaUrl())}
                className="mt-4 w-full rounded-xl bg-[#d4af37] px-5 py-2.5 text-sm font-semibold text-black hover:brightness-95"
              >
                {lang === "es" ? "Ver resultados" : "See results"}
              </button>
            </div>
          </aside>

          <div className="lg:col-span-8">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm font-semibold text-white">
                {lang === "es" ? "Resultados" : "Results"}
              </p>
              <p className="mt-1 text-sm text-white/70">
                {lang === "es"
                  ? "Tus resultados aparecen en la página de Lista. Usa el botón arriba para verlos con tus filtros."
                  : "Results render on the Lista page. Use the button above to view them with your filters."}
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                <button
                  onClick={() => router.push(buildListaUrl())}
                  className="rounded-xl bg-[#d4af37] px-5 py-2.5 text-sm font-semibold text-black hover:brightness-95"
                >
                  {lang === "es" ? "Ver resultados ahora" : "View results now"}
                </button>
                <button
                  onClick={() => router.push(`/clasificados/lista?lang=${lang}`)}
                  className="rounded-xl border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10"
                >
                  {lang === "es" ? "Explorar todo" : "Explore all"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {drawerOpen && (
        <div className="fixed inset-0 z-50">
          <button
            aria-label="Close"
            onClick={() => setDrawerOpen(false)}
            className="absolute inset-0 bg-black/70"
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[82vh] rounded-t-3xl border border-white/10 bg-[#0b0b0c] p-4 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-white">
                  {lang === "es" ? "Filtros avanzados" : "Advanced filters"}
                </p>
                <p className="mt-0.5 text-xs text-white/70">
                  {lang === "es" ? "Ajusta detalles y aplica." : "Adjust details and apply."}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {hasActive && (
                  <button
                    onClick={resetAll}
                    className="text-xs text-white/70 hover:text-white underline underline-offset-4"
                  >
                    {lang === "es" ? "Restablecer" : "Reset"}
                  </button>
                )}
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold text-white hover:bg-white/10"
                >
                  {lang === "es" ? "Cerrar" : "Close"}
                </button>
              </div>
            </div>

            <div className="mt-4 space-y-3 overflow-auto pr-1">
              <FieldContainer label={lang === "es" ? "Modalidad" : "Work mode"}>
  <select
    value={jremote}
    onChange={(e) => setJremote(e.target.value)}
    className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-[#d4af37]/60"
  >
    <option value="">{lang === "es" ? "Cualquiera" : "Any"}</option>
    <option value="onsite">{lang === "es" ? "Presencial" : "On-site"}</option>
    <option value="remote">{lang === "es" ? "Remoto" : "Remote"}</option>
    <option value="hybrid">{lang === "es" ? "Híbrido" : "Hybrid"}</option>
  </select>
</FieldContainer>
            <FieldContainer label={lang === "es" ? "Industria" : "Industry"}>
  <select
    value={jindustry}
    onChange={(e) => setJindustry(e.target.value)}
    className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-[#d4af37]/60"
  >
    <option value="">{lang === "es" ? "Cualquiera" : "Any"}</option>
    <option value="construction">{lang === "es" ? "Construcción" : "Construction"}</option>
    <option value="restaurant">{lang === "es" ? "Restaurante" : "Restaurant"}</option>
    <option value="office">{lang === "es" ? "Oficina" : "Office"}</option>
    <option value="healthcare">{lang === "es" ? "Salud" : "Healthcare"}</option>
    <option value="warehouse">{lang === "es" ? "Bodega/Almacén" : "Warehouse"}</option>
    <option value="drivers">{lang === "es" ? "Choferes" : "Drivers"}</option>
  </select>
</FieldContainer>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                onClick={() => {
                  setDrawerOpen(false);
                  router.push(buildListaUrl());
                }}
                className="flex-1 rounded-xl bg-[#d4af37] px-5 py-2.5 text-sm font-semibold text-black hover:brightness-95"
              >
                {lang === "es" ? "Aplicar" : "Apply"}
              </button>
              <button
                onClick={() => setDrawerOpen(false)}
                className="rounded-xl border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10"
              >
                {lang === "es" ? "Seguir viendo" : "Keep browsing"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <span className="text-xs text-white/70">{children}</span>;
}

function FieldContainer({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="mb-1"><FieldLabel>{label}</FieldLabel></div>
      {children}
    </label>
  );
}
