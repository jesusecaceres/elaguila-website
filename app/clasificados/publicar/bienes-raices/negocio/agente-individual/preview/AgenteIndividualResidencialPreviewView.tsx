"use client";

import Link from "next/link";
import type { AgenteIndividualResidencialPreviewVm } from "../mapping/agenteIndividualResidencialPreviewVm";

const IVORY = "#F9F6F1";
const CREAM = "#FDFBF7";
const CHARCOAL = "#2C2416";
const MUTED = "#5C5346";
const BRONZE = "#B8954A";
const BORDER = "rgba(44, 36, 22, 0.12)";

function EmptySlot({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div
      className="flex h-full min-h-[140px] w-full flex-col items-center justify-center gap-2 rounded-2xl border px-4 py-6 text-center"
      style={{ borderColor: BORDER, background: "rgba(253,251,247,0.9)", color: MUTED }}
    >
      <p className="text-xs font-bold uppercase tracking-wide" style={{ color: BRONZE }}>
        {title}
      </p>
      <p className="text-xs leading-relaxed">{subtitle}</p>
    </div>
  );
}

export function AgenteIndividualResidencialPreviewView({
  vm,
  editHref,
  footerExtra,
  onBeforeNavigateToEdit,
}: {
  vm: AgenteIndividualResidencialPreviewVm;
  editHref?: string;
  footerExtra?: string;
  onBeforeNavigateToEdit?: () => void;
}) {
  const h = vm.hero;
  const sb = vm.sidebar;
  const m = vm.media;
  const mapsUrl = vm.extras.mapQuery
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(vm.extras.mapQuery)}`
    : null;

  return (
    <div className="min-h-screen antialiased" style={{ backgroundColor: IVORY, color: CHARCOAL }}>
      <header className="border-b" style={{ borderColor: BORDER, background: "rgba(253,251,247,0.96)" }}>
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-3 px-5 py-3 lg:px-8">
          <div className="flex items-center gap-3">
            <a href="/clasificados" className="text-[10px] font-bold tracking-[0.2em]" style={{ color: MUTED }}>
              LEONIX
            </a>
            <span className="rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide" style={{ borderColor: BORDER }}>
              Vista previa · Negocio
            </span>
          </div>
          {editHref ? (
            <Link
              href={editHref}
              prefetch={false}
              className="text-[11px] font-bold uppercase tracking-wide underline"
              style={{ color: BRONZE }}
              onClick={() => onBeforeNavigateToEdit?.()}
            >
              Volver a editar
            </Link>
          ) : null}
        </div>
      </header>

      <main className="mx-auto max-w-[1200px] px-5 pb-16 pt-6 lg:px-8">
        <p className="text-center text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: MUTED }}>
          Vista previa del anuncio
        </p>

        {/* 1 Hero + rail */}
        <section className="mt-6 grid gap-8 lg:grid-cols-[1fr_320px] lg:items-start">
          <div>
            <h1
              className="text-[1.65rem] font-bold leading-tight tracking-tight sm:text-[2rem]"
              style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
            >
              {h.title}
            </h1>
            <p className="mt-1 text-sm font-medium" style={{ color: MUTED }}>
              {h.operationLine}
            </p>
            <p className="mt-2 flex flex-wrap items-center gap-2 text-sm" style={{ color: MUTED }}>
              <span>{h.locationLine}</span>
            </p>
            <div className="mt-4 flex flex-wrap items-end gap-3">
              <span className="text-3xl font-bold sm:text-4xl" style={{ color: "#A67C2D", fontFamily: "Georgia, serif" }}>
                {h.priceDisplay}
              </span>
              <span
                className="mb-1 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wider"
                style={{ borderColor: `${BRONZE}55`, background: "rgba(197, 160, 89, 0.12)", color: BRONZE }}
              >
                {h.statusPill}
              </span>
            </div>
            <div
              className="mt-5 grid grid-cols-3 gap-2 rounded-2xl border p-3 sm:gap-3"
              style={{ borderColor: BORDER, background: CREAM }}
            >
              {h.quickFacts.map((q, i) => (
                <div key={i} className="min-w-0 text-center">
                  <p className="text-[9px] font-bold uppercase tracking-wide" style={{ color: MUTED }}>
                    {q.label}
                  </p>
                  <p className="mt-1 truncate text-sm font-bold">{q.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right rail */}
          <aside className="rounded-2xl border p-5 shadow-lg" style={{ borderColor: BORDER, background: CREAM }}>
            <div className="mx-auto w-full max-w-[220px]">
              {sb.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={sb.photoUrl} alt="" className="mx-auto aspect-square w-full max-h-56 rounded-2xl object-cover" />
              ) : (
                <div className="flex aspect-square w-full items-center justify-center rounded-2xl border text-xs" style={{ borderColor: BORDER, color: MUTED }}>
                  Foto del agente
                </div>
              )}
            </div>
            <p className="mt-4 text-center text-lg font-bold">{sb.name}</p>
            <p className="mt-1 text-center text-xs font-semibold uppercase tracking-wide" style={{ color: BRONZE }}>
              {sb.title}
            </p>
            {sb.marcaOficina ? (
              <p className="mt-2 text-center text-sm" style={{ color: MUTED }}>
                {sb.marcaOficina}
              </p>
            ) : null}
            {sb.bioLine ? (
              <p className="mt-3 text-center text-xs leading-relaxed" style={{ color: MUTED }}>
                {sb.bioLine}
              </p>
            ) : null}
            {sb.licenciaLine ? (
              <p className="mt-3 text-center text-xs" style={{ color: MUTED }}>
                {sb.licenciaLine}
              </p>
            ) : null}
            <div className="mt-4 space-y-1 border-t pt-4 text-center text-sm" style={{ borderColor: BORDER }}>
              <p className="font-medium">{sb.phoneDisplay}</p>
              <p className="truncate text-xs opacity-90">{sb.email}</p>
            </div>
            {sb.websiteHref && (
              <a
                href={sb.websiteHref}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 flex w-full items-center justify-center rounded-xl border py-2.5 text-xs font-bold"
                style={{ borderColor: BRONZE, color: BRONZE }}
              >
                {sb.websiteLabel}
              </a>
            )}
            {sb.socialLinks.length > 0 ? (
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                {sb.socialLinks.map((s) => (
                  <a
                    key={s.href}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-9 min-w-[2rem] items-center justify-center rounded-full border px-2.5 text-[10px] font-bold"
                    style={{ borderColor: BORDER }}
                  >
                    {s.label}
                  </a>
                ))}
              </div>
            ) : null}

            <div className="mt-5 space-y-2 border-t pt-4" style={{ borderColor: BORDER }}>
              {vm.cta.showLlamar && vm.cta.llamarHref ? (
                <a
                  href={vm.cta.llamarHref}
                  className="flex w-full items-center justify-center rounded-xl py-3 text-sm font-bold text-[#1E1810] shadow"
                  style={{ background: `linear-gradient(180deg, #C9A85A 0%, ${BRONZE} 100%)` }}
                >
                  Llamar ahora
                </a>
              ) : null}
              {vm.cta.showWhatsapp && vm.cta.whatsappHref ? (
                <a
                  href={vm.cta.whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center rounded-xl border py-2.5 text-sm font-semibold"
                  style={{ borderColor: "rgba(37,211,102,0.35)" }}
                >
                  WhatsApp
                </a>
              ) : null}
              {vm.cta.showEmail && vm.cta.emailHref ? (
                <a href={vm.cta.emailHref} className="flex w-full items-center justify-center rounded-xl border py-2.5 text-sm font-semibold">
                  Enviar mensaje
                </a>
              ) : null}
              {vm.cta.showProgramarVisita && vm.cta.visitaHref ? (
                <a href={vm.cta.visitaHref} className="flex w-full items-center justify-center rounded-xl border py-2.5 text-sm font-semibold">
                  Programar visita
                </a>
              ) : null}
              {vm.cta.showVerSitioWeb && vm.cta.verSitioHref ? (
                <a
                  href={vm.cta.verSitioHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center rounded-xl border py-2 text-xs font-bold"
                >
                  Ver sitio web
                </a>
              ) : null}
              {vm.cta.showVerRedes && vm.cta.primeraRedHref ? (
                <a
                  href={vm.cta.primeraRedHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center rounded-xl border py-2 text-xs font-bold"
                >
                  Ver redes
                </a>
              ) : null}
              {vm.cta.showVerListado && vm.cta.verListadoHref ? (
                <a
                  href={vm.cta.verListadoHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center rounded-xl border-2 py-2.5 text-xs font-bold"
                  style={{ borderColor: BRONZE, color: BRONZE }}
                >
                  Ver listado completo
                </a>
              ) : null}
              {vm.cta.showVerTour && vm.cta.verTourHref ? (
                <a
                  href={vm.cta.verTourHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center rounded-xl border py-2 text-xs font-bold"
                >
                  Ver recorrido
                </a>
              ) : null}
              {vm.cta.showVerFolleto && vm.cta.verFolletoHref ? (
                <a href={vm.cta.verFolletoHref} target="_blank" rel="noopener noreferrer" className="flex w-full items-center justify-center rounded-xl border py-2 text-xs font-bold">
                  Ver folleto / PDF
                </a>
              ) : null}
            </div>
          </aside>
        </section>

        {/* Media grid */}
        <section className="mt-10">
          <h2 className="text-xs font-bold uppercase tracking-[0.14em]" style={{ color: MUTED }}>
            Galería
          </h2>
          <div className="mt-3 grid gap-3 lg:grid-cols-12">
            <div className="lg:col-span-7">
              {m.heroUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={m.heroUrl} alt="" className="aspect-[16/10] w-full rounded-2xl border object-cover shadow" style={{ borderColor: BORDER }} />
              ) : (
                <EmptySlot title="Foto principal" subtitle="Agrega fotos en el formulario." />
              )}
            </div>
            <div className="grid grid-cols-2 gap-2 lg:col-span-5">
              {m.secondaryUrls.slice(0, 2).map((u, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src={u} alt="" className="aspect-[4/3] w-full rounded-xl border object-cover" style={{ borderColor: BORDER }} />
              ))}
              {m.secondaryUrls.length < 2
                ? Array.from({ length: 2 - m.secondaryUrls.length }).map((_, i) => (
                    <EmptySlot key={`e-${i}`} title={`Foto ${m.secondaryUrls.length + i + 2}`} subtitle="Opcional" />
                  ))
                : null}
              {m.videoEmbedUrl ? (
                m.videoEmbedUrl.startsWith("data:") ? (
                  <video src={m.videoEmbedUrl} controls className="aspect-[4/3] w-full rounded-xl border object-cover" style={{ borderColor: BORDER }} />
                ) : (
                  <a
                    href={m.videoEmbedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex aspect-[4/3] w-full flex-col items-center justify-center rounded-xl border text-xs font-bold"
                    style={{ borderColor: BORDER, background: "#1a2744", color: "#fff" }}
                  >
                    Ver video
                  </a>
                )
              ) : (
                <EmptySlot title="Video" subtitle="Pega un enlace o sube un archivo." />
              )}
              {m.tourHref ? (
                <a
                  href={m.tourHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex aspect-[4/3] w-full flex-col items-center justify-center rounded-xl border text-center text-xs font-bold"
                  style={{ borderColor: BORDER, background: "#243a5e", color: "#fff" }}
                >
                  Tour / 360°
                </a>
              ) : (
                <EmptySlot title="Tour" subtitle="Enlace o archivo." />
              )}
            </div>
          </div>
          {m.photoCount > 0 ? (
            <p className="mt-2 text-center text-[11px]" style={{ color: MUTED }}>
              {m.photoCount} fotos en total
            </p>
          ) : null}
        </section>

        {/* Property + destacados */}
        <section className="mt-10 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border p-6 shadow-sm" style={{ borderColor: BORDER, background: CREAM }}>
            <h3 className="text-xs font-bold uppercase tracking-[0.14em]" style={{ color: MUTED }}>
              Detalles de la propiedad
            </h3>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              {vm.propertyRows.map((r) => (
                <div key={r.label}>
                  <dt className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: MUTED }}>
                    {r.label}
                  </dt>
                  <dd className="mt-1 text-sm font-medium">{r.value}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="rounded-2xl border p-6 shadow-sm" style={{ borderColor: BORDER, background: CREAM }}>
            <h3 className="text-xs font-bold uppercase tracking-[0.14em]" style={{ color: MUTED }}>
              Características destacadas
            </h3>
            {vm.destacadosLabels.length ? (
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {vm.destacadosLabels.map((t) => (
                  <li key={t} className="flex items-center gap-2 text-sm">
                    <span className="text-[#C9A85A]">✓</span>
                    {t}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm" style={{ color: MUTED }}>
                Sin características seleccionadas.
              </p>
            )}
          </div>
        </section>

        {/* Descripción */}
        <section className="mt-8 rounded-2xl border p-6 shadow-sm" style={{ borderColor: BORDER, background: CREAM }}>
          <h3 className="text-xs font-bold uppercase tracking-[0.14em]" style={{ color: MUTED }}>
            Descripción
          </h3>
          {vm.hasDescription ? (
            <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed">{vm.descripcionPrincipal}</p>
          ) : (
            <p className="mt-4 text-sm" style={{ color: MUTED }}>
              Sin descripción todavía.
            </p>
          )}
          {vm.hasNotas ? (
            <div className="mt-6 border-t pt-4" style={{ borderColor: BORDER }}>
              <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: MUTED }}>
                Notas adicionales
              </p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed" style={{ color: MUTED }}>
                {vm.notasAdicionales}
              </p>
            </div>
          ) : null}
        </section>

        {/* Lower optional */}
        {(vm.extras.openHouseSummary ||
          vm.extras.asesorBlock ||
          vm.extras.puntosCercanos ||
          vm.extras.transporte ||
          mapsUrl) && (
          <section className="mt-10 space-y-6">
            <h2 className="text-center text-lg font-bold" style={{ fontFamily: "Georgia, serif" }}>
              Más información
            </h2>
            <div className="grid gap-6 lg:grid-cols-2">
              {vm.extras.openHouseSummary ? (
                <div className="rounded-2xl border p-5" style={{ borderColor: BORDER, background: CREAM }}>
                  <h4 className="text-xs font-bold uppercase tracking-wide" style={{ color: MUTED }}>
                    Open house
                  </h4>
                  <p className="mt-3 whitespace-pre-line text-sm">{vm.extras.openHouseSummary}</p>
                </div>
              ) : null}
              {vm.extras.asesorBlock ? (
                <div className="rounded-2xl border p-5" style={{ borderColor: BORDER, background: CREAM }}>
                  <h4 className="text-xs font-bold uppercase tracking-wide" style={{ color: MUTED }}>
                    Contacto de financiamiento
                  </h4>
                  <p className="mt-2 text-sm font-semibold">{vm.extras.asesorBlock.name}</p>
                  <p className="text-sm">{vm.extras.asesorBlock.phone}</p>
                  <p className="truncate text-xs">{vm.extras.asesorBlock.email}</p>
                </div>
              ) : null}
              {vm.extras.puntosCercanos || vm.extras.transporte ? (
                <div className="rounded-2xl border p-5 lg:col-span-2" style={{ borderColor: BORDER, background: CREAM }}>
                  <h4 className="text-xs font-bold uppercase tracking-wide" style={{ color: MUTED }}>
                    Entorno
                  </h4>
                  {vm.extras.puntosCercanos ? <p className="mt-2 text-sm">Puntos cercanos: {vm.extras.puntosCercanos}</p> : null}
                  {vm.extras.transporte ? <p className="mt-2 text-sm">Transporte: {vm.extras.transporte}</p> : null}
                </div>
              ) : null}
              {mapsUrl ? (
                <div className="rounded-2xl border p-5 lg:col-span-2" style={{ borderColor: BORDER, background: CREAM }}>
                  <h4 className="text-xs font-bold uppercase tracking-wide" style={{ color: MUTED }}>
                    Ubicación aproximada
                  </h4>
                  <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex rounded-xl border-2 px-4 py-2 text-xs font-bold" style={{ borderColor: BRONZE, color: BRONZE }}>
                    Abrir en mapa
                  </a>
                </div>
              ) : null}
            </div>
          </section>
        )}

        {footerExtra ? (
          <footer className="mt-10 border-t pt-6 text-center text-xs" style={{ borderColor: BORDER, color: MUTED }}>
            {footerExtra}
          </footer>
        ) : null}
      </main>
    </div>
  );
}
