"use client";

import Link from "next/link";
import type { AgenteIndividualResidencialPreviewVm } from "../mapping/agenteIndividualResidencialPreviewVm";

const IVORY = "#F9F6F1";
const CREAM = "#FDFBF7";
const CHARCOAL = "#2C2416";
const MUTED = "#5C5346";
const BRONZE = "#B8954A";
const BORDER = "rgba(44, 36, 22, 0.12)";

function anchorPropsForHref(href: string, downloadFallback?: string | null) {
  if (href.startsWith("data:")) {
    return { download: downloadFallback || "archivo.pdf" } as const;
  }
  return { target: "_blank" as const, rel: "noopener noreferrer" };
}

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

function SocialIcon({ label, href }: { label: string; href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex h-9 w-9 items-center justify-center rounded-full border text-[10px] font-bold"
      style={{ borderColor: BORDER, color: CHARCOAL }}
      title={label}
    >
      {label}
    </a>
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
  const pc = vm.professionalCard;
  const soc = vm.social;
  const m = vm.media;
  const cr = vm.contactRail;
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

          <aside className="rounded-2xl border p-5 shadow-lg" style={{ borderColor: BORDER, background: CREAM }}>
            {pc.brandLogoUrl ? (
              <div className="mx-auto mb-3 flex max-w-[180px] justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={pc.brandLogoUrl} alt="" className="max-h-16 w-auto object-contain" />
              </div>
            ) : null}
            {pc.brandName ? (
              <p className="text-center text-sm font-bold" style={{ color: MUTED }}>
                {pc.brandName}
              </p>
            ) : null}
            {pc.brandWebsiteHref ? (
              <a
                href={pc.brandWebsiteHref}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 flex w-full justify-center text-center text-xs font-semibold underline"
                style={{ color: BRONZE }}
              >
                Sitio web
              </a>
            ) : null}

            <div className="mx-auto mt-4 w-full max-w-[220px]">
              {pc.agentPhotoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={pc.agentPhotoUrl} alt="" className="mx-auto aspect-square w-full max-h-56 rounded-2xl object-cover" />
              ) : (
                <div className="flex aspect-square w-full items-center justify-center rounded-2xl border text-xs" style={{ borderColor: BORDER, color: MUTED }}>
                  Foto del agente
                </div>
              )}
            </div>
            <p className="mt-4 text-center text-lg font-bold">{pc.agentName}</p>
            <p className="mt-1 text-center text-xs font-semibold uppercase tracking-wide" style={{ color: BRONZE }}>
              {pc.agentTitle}
            </p>
            {pc.agentBio ? (
              <p className="mt-3 text-center text-xs leading-relaxed" style={{ color: MUTED }}>
                {pc.agentBio}
              </p>
            ) : null}
            {pc.areaServicioLine ? (
              <p className="mt-2 text-center text-xs" style={{ color: MUTED }}>
                Área de servicio: {pc.areaServicioLine}
              </p>
            ) : null}
            {pc.idiomasLine ? (
              <p className="mt-1 text-center text-xs" style={{ color: MUTED }}>
                Idiomas: {pc.idiomasLine}
              </p>
            ) : null}
            {pc.agentLicenseLine ? (
              <p className="mt-3 text-center text-xs" style={{ color: MUTED }}>
                {pc.agentLicenseLine}
              </p>
            ) : null}
            {pc.brandLicenseLine ? (
              <p className="mt-3 text-center text-xs" style={{ color: MUTED }}>
                {pc.brandLicenseLine}
              </p>
            ) : null}
            <div className="mt-4 space-y-1 border-t pt-4 text-center text-sm" style={{ borderColor: BORDER }}>
              <p className="font-medium">{pc.phoneDisplay}</p>
              <p className="truncate text-xs opacity-90">{pc.emailDisplay}</p>
            </div>

            {cr.showSocialIcons ? (
              <div className="mt-4 flex flex-wrap justify-center gap-2 border-t pt-4" style={{ borderColor: BORDER }}>
                {soc.instagram ? <SocialIcon label="IG" href={soc.instagram} /> : null}
                {soc.facebook ? <SocialIcon label="FB" href={soc.facebook} /> : null}
                {soc.youtube ? <SocialIcon label="YT" href={soc.youtube} /> : null}
                {soc.tiktok ? <SocialIcon label="TT" href={soc.tiktok} /> : null}
                {soc.x ? <SocialIcon label="X" href={soc.x} /> : null}
                {soc.otro ? <SocialIcon label="+" href={soc.otro} /> : null}
              </div>
            ) : null}

            <div className="mt-5 space-y-2 border-t pt-4" style={{ borderColor: BORDER }}>
              {cr.showLlamar && cr.llamarHref ? (
                <a
                  href={cr.llamarHref}
                  className="flex w-full items-center justify-center rounded-xl py-3 text-sm font-bold text-[#1E1810] shadow"
                  style={{ background: `linear-gradient(180deg, #C9A85A 0%, ${BRONZE} 100%)` }}
                >
                  Llamar ahora
                </a>
              ) : null}
              {cr.showWhatsapp && cr.whatsappHref ? (
                <a
                  href={cr.whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center rounded-xl border py-2.5 text-sm font-semibold"
                  style={{ borderColor: "rgba(37,211,102,0.35)" }}
                >
                  WhatsApp
                </a>
              ) : null}
              {cr.showSolicitarInformacion && cr.solicitarInformacionHref ? (
                <a href={cr.solicitarInformacionHref} className="flex w-full items-center justify-center rounded-xl border py-2.5 text-sm font-semibold">
                  Solicitar información
                </a>
              ) : null}
              {cr.showProgramarVisita && cr.programarVisitaHref ? (
                <a
                  href={cr.programarVisitaHref}
                  className="flex w-full items-center justify-center rounded-xl border py-2.5 text-sm font-semibold"
                  {...(cr.programarVisitaHref.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                >
                  Programar visita
                </a>
              ) : null}
              {cr.showVerSitioWeb && cr.verSitioWebHref ? (
                <a
                  href={cr.verSitioWebHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center rounded-xl border py-2 text-xs font-bold"
                >
                  Ver sitio web
                </a>
              ) : null}
              {cr.showVerListado && cr.verListadoHref ? (
                <a
                  href={cr.verListadoHref}
                  className="flex w-full items-center justify-center rounded-xl border-2 py-2.5 text-xs font-bold"
                  style={{ borderColor: BRONZE, color: BRONZE }}
                  {...anchorPropsForHref(cr.verListadoHref, cr.listadoDownloadName)}
                >
                  Ver listado completo
                </a>
              ) : null}
              {cr.showVerMls && cr.verMlsHref ? (
                <a
                  href={cr.verMlsHref}
                  className="flex w-full items-center justify-center rounded-xl border py-2 text-xs font-bold"
                  {...anchorPropsForHref(cr.verMlsHref, cr.listadoDownloadName)}
                >
                  Ver MLS
                </a>
              ) : null}
              {cr.showVerTour && cr.verTourHref ? (
                <a
                  href={cr.verTourHref}
                  className="flex w-full items-center justify-center rounded-xl border py-2 text-xs font-bold"
                  {...anchorPropsForHref(cr.verTourHref, "tour.pdf")}
                >
                  Ver tour
                </a>
              ) : null}
              {cr.showVerFolleto && cr.verFolletoHref ? (
                <a
                  href={cr.verFolletoHref}
                  className="flex w-full items-center justify-center rounded-xl border py-2 text-xs font-bold"
                  {...anchorPropsForHref(cr.verFolletoHref, "folleto.pdf")}
                >
                  Ver folleto
                </a>
              ) : null}
            </div>
          </aside>
        </section>

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
                  className="flex aspect-[4/3] w-full flex-col items-center justify-center rounded-xl border text-center text-xs font-bold"
                  style={{ borderColor: BORDER, background: "#243a5e", color: "#fff" }}
                  {...anchorPropsForHref(m.tourHref, "tour.pdf")}
                >
                  Ver tour
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

        {(vm.extras.openHouseSummary || vm.extras.asesorBlock || mapsUrl) && (
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
