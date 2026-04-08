"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

const VIAJES_ACCENT = "#D97706";

type ViajesSearchBarProps = {
  resultsBasePath?: string;
};

export function ViajesSearchBar({ resultsBasePath = "/clasificados/viajes/resultados" }: ViajesSearchBarProps) {
  const [destination, setDestination] = useState("");
  const [departure, setDeparture] = useState("");
  const [tripType, setTripType] = useState("");
  const [budget, setBudget] = useState("");

  const exploreHref = useMemo(() => {
    const q = new URLSearchParams();
    if (destination.trim()) q.set("dest", destination.trim());
    if (departure.trim()) q.set("from", departure.trim());
    if (tripType.trim()) q.set("t", tripType.trim());
    if (budget.trim()) q.set("budget", budget.trim());
    const qs = q.toString();
    return qs ? `${resultsBasePath}?${qs}` : resultsBasePath;
  }, [budget, departure, destination, resultsBasePath, tripType]);

  return (
    <div
      className="rounded-2xl border border-white/80 bg-white/95 p-4 shadow-[0_20px_50px_-20px_rgba(42,36,22,0.25)] backdrop-blur-md sm:p-5 md:p-6"
      style={{ boxShadow: "0 24px 48px -12px rgba(42, 36, 22, 0.18), 0 0 0 1px rgba(201, 180, 106, 0.12)" }}
    >
      <div className="grid grid-cols-1 gap-3 md:grid-cols-12 md:items-end md:gap-4">
        <label className="md:col-span-3">
          <span className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-[color:var(--lx-muted)]">
            <span aria-hidden>⌕</span>
            ¿A dónde quieres ir?
          </span>
          <input
            className="w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] px-3 py-2.5 text-sm text-[color:var(--lx-text)] outline-none ring-[color:var(--lx-focus-ring)] placeholder:text-[color:var(--lx-muted)] focus:ring-2"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="Playa, ciudad, país…"
            autoComplete="off"
          />
        </label>
        <label className="md:col-span-2">
          <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.1em] text-[color:var(--lx-muted)]">Salida desde</span>
          <select
            className="w-full cursor-pointer rounded-xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] px-3 py-2.5 text-sm text-[color:var(--lx-text)] outline-none ring-[color:var(--lx-focus-ring)] focus:ring-2"
            value={departure}
            onChange={(e) => setDeparture(e.target.value)}
          >
            <option value="">Cualquier origen</option>
            <option value="san-jose">San José (SJO)</option>
            <option value="san-francisco">San Francisco</option>
            <option value="oakland">Oakland</option>
          </select>
        </label>
        <label className="md:col-span-2">
          <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.1em] text-[color:var(--lx-muted)]">Tipo de viaje</span>
          <select
            className="w-full cursor-pointer rounded-xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] px-3 py-2.5 text-sm text-[color:var(--lx-text)] outline-none ring-[color:var(--lx-focus-ring)] focus:ring-2"
            value={tripType}
            onChange={(e) => setTripType(e.target.value)}
          >
            <option value="">Todos</option>
            <option value="resort">Resort / todo incluido</option>
            <option value="tour">Tour / excursión</option>
            <option value="crucero">Crucero</option>
            <option value="escapada">Escapada</option>
          </select>
        </label>
        <label className="md:col-span-2">
          <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.1em] text-[color:var(--lx-muted)]">Presupuesto</span>
          <select
            className="w-full cursor-pointer rounded-xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] px-3 py-2.5 text-sm text-[color:var(--lx-text)] outline-none ring-[color:var(--lx-focus-ring)] focus:ring-2"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
          >
            <option value="">Flexible</option>
            <option value="economico">Económico</option>
            <option value="moderado">Moderado</option>
            <option value="premium">Premium</option>
          </select>
        </label>
        <div className="md:col-span-3">
          <Link
            href={exploreHref}
            className="flex min-h-[48px] w-full items-center justify-center rounded-xl px-4 py-3 text-sm font-bold text-white shadow-md transition hover:brightness-[1.05] active:brightness-95"
            style={{ backgroundColor: VIAJES_ACCENT }}
          >
            Explorar viajes
          </Link>
        </div>
      </div>
    </div>
  );
}
