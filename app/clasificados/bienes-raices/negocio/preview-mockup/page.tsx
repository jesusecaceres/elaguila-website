import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Vista previa — Bienes Raíces Negocio | Leonix",
  description: "Mockup de vista previa premium para anuncios inmobiliarios de negocio en Leonix Clasificados.",
  robots: { index: false, follow: false },
};

const IVORY = "#F9F6F1";
const CREAM_CARD = "#FDFBF7";
const CHARCOAL = "#3D3630";
const CHARCOAL_DEEP = "#2A2620";
const BRONZE = "#C5A059";
const BRONZE_SOFT = "#B8954A";
const BORDER = "rgba(61, 54, 48, 0.12)";
const MUTED = "rgba(61, 54, 48, 0.62)";

function IconHome({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 10.5L12 4l8 6.5V20a1 1 0 01-1 1h-5v-6H10v6H5a1 1 0 01-1-1v-9.5z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconPin({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 21s7-4.35 7-11a7 7 0 10-14 0c0 6.65 7 11 7 11z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="10" r="2.25" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function IconBed({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 16V8m0 8v3h16v-3M4 8V6a1 1 0 011-1h3v9M4 8h5m11 8V11a2 2 0 00-2-2h-4v9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function IconBath({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 12h14v5a2 2 0 01-2 2H7a2 2 0 01-2-2v-5zm0 0V9a3 3 0 013-3h1m-4 6V7m14 5V9a2 2 0 00-2-2h-2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconRuler({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 20L20 4M8 4h2v4M14 4h2v4M4 14h4v2M4 8h4v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function IconCar({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 17h14l-1.5-5h-11L5 17zm0 0v2m14-2v2M7 17v-3m10 3v-3M6 10l1.5-3h9L18 10"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconCalendar({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="4" y="5" width="16" height="15" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 3v4M16 3v4M4 10h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function IconSparkle({ className }: { className?: string }) {
  return (
    <svg className={className} width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 2l1.2 4.2L17 8l-3.8 1.8L12 14l-1.2-4.2L7 8l3.8-1.8L12 2zM19 15l.6 2.1 2.1.6-2.1.6-.6 2.1-.6-2.1-2.1-.6 2.1-.6.6-2.1z"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconEye({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function IconPlay({ className }: { className?: string }) {
  return (
    <svg className={className} width="28" height="28" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M8 5v14l11-7L8 5z" />
    </svg>
  );
}

function IconVr({ className }: { className?: string }) {
  return (
    <svg className={className} width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M8 12h8M6 8h12a2 2 0 012 2v4a2 2 0 01-2 2h-2l-2 2-2-2h-4l-2 2-2-2H6a2 2 0 01-2-2v-4a2 2 0 012-2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

function IconFloor({ className }: { className?: string }) {
  return (
    <svg className={className} width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="4" y="4" width="16" height="16" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <path d="M4 12h16M12 4v16" stroke="currentColor" strokeWidth="1.25" opacity="0.5" />
    </svg>
  );
}

function LeonixMark({ className }: { className?: string }) {
  return (
    <div className={`flex flex-col items-center ${className ?? ""}`} aria-hidden>
      <div
        className="flex h-11 w-11 items-center justify-center rounded-full border-2 shadow-sm"
        style={{ borderColor: BRONZE, background: CHARCOAL_DEEP }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M12 3c-1.2 1.8-3.5 2.5-5 4-.8 2.2.5 4.5 2 6-1 1.2-2.5 2-3 3.5.8.3 1.8-.2 2.5-.8.5 1.2 1.5 2 2.5 2.5 1-.5 2-1.3 2.5-2.5.7.6 1.7 1.1 2.5.8-.5-1.5-2-2.3-3-3.5 1.5-1.5 2.8-3.8 2-6-1.5-1.5-3.8-2.2-5-4z"
            fill={BRONZE}
            opacity="0.95"
          />
        </svg>
      </div>
      <span className="mt-1 text-[9px] font-bold tracking-[0.2em]" style={{ color: CHARCOAL }}>
        LEONIX
      </span>
    </div>
  );
}

function SectionIcon({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border"
      style={{ borderColor: BORDER, color: BRONZE, background: CREAM_CARD }}
    >
      {children}
    </span>
  );
}

function FactBlock({
  title,
  rows,
}: {
  title: string;
  rows: Array<{ label: string; value: string }>;
}) {
  return (
    <div
      className="rounded-2xl border p-5 sm:p-6 shadow-[0_12px_40px_-12px_rgba(42,36,22,0.08)]"
      style={{ borderColor: BORDER, background: CREAM_CARD }}
    >
      <h3 className="text-xs font-bold uppercase tracking-[0.14em]" style={{ color: MUTED }}>
        {title}
      </h3>
      <dl className="mt-4 grid gap-x-10 gap-y-5 sm:grid-cols-2">
        {rows.map((r) => (
          <div key={r.label}>
            <dt className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: MUTED }}>
              {r.label}
            </dt>
            <dd className="mt-1 text-sm font-medium leading-snug" style={{ color: CHARCOAL }}>
              {r.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function DeepSection({
  icon,
  heading,
  items,
}: {
  icon: React.ReactNode;
  heading: string;
  items: string[];
}) {
  return (
    <div
      className="rounded-2xl border p-5 sm:p-6 shadow-[0_10px_36px_-14px_rgba(42,36,22,0.07)]"
      style={{ borderColor: BORDER, background: CREAM_CARD }}
    >
      <div className="flex items-start gap-3">
        <SectionIcon>{icon}</SectionIcon>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold tracking-tight" style={{ color: CHARCOAL }}>
            {heading}
          </h3>
          <ul className="mt-4 space-y-2.5">
            {items.map((line) => (
              <li key={line} className="flex gap-2.5 text-sm leading-relaxed" style={{ color: CHARCOAL }}>
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full" style={{ background: BRONZE }} aria-hidden />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function BienesRaicesNegocioPreviewMockupPage() {
  const heroImg =
    "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1600&q=80&auto=format&fit=crop";
  const agentImg =
    "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80&auto=format&fit=crop";
  const videoThumb =
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80&auto=format&fit=crop";

  return (
    <div className="min-h-screen antialiased" style={{ backgroundColor: IVORY, color: CHARCOAL }}>
      <header
        className="border-b"
        style={{ borderColor: BORDER, background: "rgba(253, 251, 247, 0.92)" }}
      >
        <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-4 px-6 py-4 lg:px-8">
          <div className="flex flex-wrap items-center gap-5">
            <LeonixMark />
            <nav className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: MUTED }}>
              <span style={{ color: CHARCOAL }}>Bienes raíces</span>
              <span className="mx-2 opacity-40">›</span>
              <span className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1" style={{ borderColor: BORDER, background: CREAM_CARD }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="opacity-75" aria-hidden style={{ color: CHARCOAL }}>
                  <rect x="5" y="9" width="14" height="10" rx="1" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M9 9V7a3 3 0 013-3h0a3 3 0 013 3v2" stroke="currentColor" strokeWidth="1.5" />
                </svg>
                Negocio
              </span>
            </nav>
          </div>
          <div
            className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[10px] font-bold uppercase tracking-[0.16em] shadow-sm"
            style={{ borderColor: BORDER, background: CREAM_CARD, color: BRONZE_SOFT }}
          >
            <IconEye className="shrink-0 opacity-80" />
            Vista previa del anuncio
          </div>
        </div>
      </header>

      <div
        className="border-b"
        style={{ borderColor: BORDER, background: "linear-gradient(90deg, rgba(197,160,89,0.08), rgba(253,251,247,0.95))" }}
      >
        <div className="mx-auto flex max-w-[1240px] items-start gap-4 px-6 py-4 lg:px-8">
          <span className="mt-0.5 shrink-0" style={{ color: BRONZE }}>
            <IconSparkle className="block" />
          </span>
          <p className="max-w-3xl text-sm leading-relaxed" style={{ color: CHARCOAL }}>
            Este es un ejemplo de cómo se verá tu anuncio en Leonix. Puedes editar cualquier información antes de publicar.
          </p>
        </div>
      </div>

      <main className="mx-auto max-w-[1240px] px-6 pb-20 pt-10 lg:px-8">
        {/* Hero */}
        <section className="grid gap-10 lg:grid-cols-[1fr_minmax(280px,340px)] lg:items-start lg:gap-12">
          <div>
            <h1
              className="max-w-[720px] text-[1.65rem] font-bold leading-tight tracking-tight sm:text-3xl lg:text-[2.1rem]"
              style={{ color: CHARCOAL_DEEP, fontFamily: "Georgia, 'Times New Roman', serif" }}
            >
              Casa moderna con piscina en zona residencial exclusiva
            </h1>
            <p className="mt-4 flex items-start gap-2 text-sm font-medium" style={{ color: MUTED }}>
              <span className="mt-0.5 shrink-0" style={{ color: BRONZE }}>
                <IconPin className="block" />
              </span>
              Encino Hills, Los Ángeles, CA 91316
            </p>
            <div className="mt-5 flex flex-wrap items-end gap-3">
              <span className="text-4xl font-bold tracking-tight sm:text-[2.75rem]" style={{ color: BRONZE, fontFamily: "Georgia, serif" }}>
                $1,250,000
              </span>
              <span
                className="mb-1 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wider"
                style={{ borderColor: `${BRONZE}55`, background: "rgba(197, 160, 89, 0.12)", color: BRONZE_SOFT }}
              >
                En venta
              </span>
            </div>

            <div
              className="mt-8 flex flex-wrap gap-3 rounded-2xl border p-4 sm:gap-4 sm:p-5"
              style={{ borderColor: BORDER, background: CREAM_CARD, boxShadow: "0 16px 48px -20px rgba(42,36,22,0.12)" }}
            >
              {[
                { Icon: IconBed, label: "Habitaciones", value: "4" },
                { Icon: IconBath, label: "Baños", value: "3.5" },
                { Icon: IconRuler, label: "Superficie", value: "2,450 pies²" },
                { Icon: IconCar, label: "Garajes", value: "2" },
                { Icon: IconCalendar, label: "Construido", value: "2020" },
              ].map(({ Icon, label, value }) => (
                <div
                  key={label}
                  className="flex min-w-[140px] flex-1 items-center gap-3 rounded-xl border px-3 py-2.5 sm:px-4"
                  style={{ borderColor: BORDER }}
                >
                  <span style={{ color: BRONZE }} className="shrink-0">
                    <Icon className="block" />
                  </span>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: MUTED }}>
                      {label}
                    </p>
                    <p className="text-sm font-bold" style={{ color: CHARCOAL }}>
                      {value}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Identity card */}
          <aside
            className="rounded-2xl border p-5 shadow-[0_20px_56px_-16px_rgba(42,36,22,0.18)]"
            style={{ borderColor: BORDER, background: CREAM_CARD }}
          >
            <div className="overflow-hidden rounded-xl border" style={{ borderColor: BORDER }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={agentImg} alt="" className="aspect-[4/3] w-full object-cover" />
            </div>
            <p className="mt-4 text-lg font-bold" style={{ color: CHARCOAL_DEEP }}>
              Angela Meakins
            </p>
            <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.12em]" style={{ color: BRONZE_SOFT }}>
              Agente de listado
            </p>
            <div className="mt-4 rounded-xl border px-3 py-3" style={{ borderColor: BORDER, background: "rgba(249,246,241,0.6)" }}>
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: MUTED }}>
                Inmobiliaria
              </p>
              <p className="mt-1 text-sm font-bold" style={{ color: CHARCOAL }}>
                Coldwell Banker Realty
              </p>
            </div>
            <p className="mt-3 text-xs leading-relaxed" style={{ color: MUTED }}>
              <span className="font-semibold" style={{ color: CHARCOAL }}>
                Agente verificado
              </span>
              <br />
              Lic. DRE #01234567
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {["Web", "IG", "FB", "YT", "in"].map((s) => (
                <span
                  key={s}
                  className="flex h-8 w-8 items-center justify-center rounded-full border text-[10px] font-bold"
                  style={{ borderColor: BORDER, color: CHARCOAL }}
                >
                  {s}
                </span>
              ))}
            </div>
            <button
              type="button"
              className="mt-5 w-full rounded-xl border-2 py-3 text-xs font-bold uppercase tracking-wide transition hover:bg-[rgba(197,160,89,0.08)]"
              style={{ borderColor: BRONZE, color: BRONZE_SOFT }}
            >
              Ver perfil profesional →
            </button>
          </aside>
        </section>

        {/* Media */}
        <section className="mt-14">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <h2 className="text-lg font-bold" style={{ color: CHARCOAL_DEEP }}>
              Galería multimedia
            </h2>
            <p className="text-xs font-medium" style={{ color: MUTED }}>
              12 fotos · 2 videos · Tour virtual · Planos
            </p>
          </div>
          <div className="grid gap-3 lg:grid-cols-12 lg:gap-4">
            <div className="lg:col-span-7">
              <div className="overflow-hidden rounded-2xl border shadow-lg" style={{ borderColor: BORDER }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={heroImg} alt="" className="aspect-[16/10] w-full object-cover" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 lg:col-span-5">
              {[videoThumb, videoThumb].map((src, i) => (
                <div
                  key={i}
                  className="relative overflow-hidden rounded-2xl border shadow-md"
                  style={{ borderColor: BORDER }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="aspect-[4/3] w-full object-cover brightness-[0.92]" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/25">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/95 text-[#1a2744] shadow-lg">
                      <IconPlay />
                    </div>
                  </div>
                </div>
              ))}
              <div
                className="col-span-2 flex min-h-[140px] items-center gap-4 rounded-2xl border px-5 py-4 text-white shadow-md sm:min-h-[160px]"
                style={{
                  borderColor: "rgba(26,39,68,0.4)",
                  background: "linear-gradient(135deg, #1a2744 0%, #243a5e 50%, #1e3050 100%)",
                }}
              >
                <IconVr className="shrink-0 opacity-95" />
                <div>
                  <p className="text-sm font-bold">Tour virtual 3D</p>
                  <p className="mt-1 text-xs opacity-80">Recorrido inmersivo disponible para compradores calificados.</p>
                </div>
              </div>
              <div
                className="col-span-2 flex min-h-[140px] items-center gap-4 rounded-2xl border px-5 py-4 shadow-md sm:min-h-[160px]"
                style={{ borderColor: BORDER, background: CREAM_CARD }}
              >
                <span style={{ color: BRONZE }}>
                  <IconFloor className="block" />
                </span>
                <div>
                  <p className="text-sm font-bold" style={{ color: CHARCOAL }}>
                    Plano de planta
                  </p>
                  <p className="mt-1 text-xs" style={{ color: MUTED }}>
                    Distribución aproximada — documento de alta resolución en expediente del listado.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Mid row */}
        <section className="mt-16 grid gap-8 lg:grid-cols-[1fr_360px] lg:items-start lg:gap-10">
          <div className="space-y-6">
            <FactBlock
              title="Detalles de la propiedad"
              rows={[
                { label: "Tipo", value: "Casa unifamiliar" },
                { label: "Año de construcción", value: "2020" },
                { label: "Terreno", value: "7,200 pies²" },
                { label: "Estado", value: "California" },
                { label: "Condado", value: "Los Ángeles" },
                { label: "Zona MLS", value: "Encino / Sherman Oaks" },
              ]}
            />
            <FactBlock
              title="Características destacadas"
              rows={[
                { label: "Alberca", value: "Privada, climatizada" },
                { label: "Cocina", value: "Concepto abierto, electrodomésticos de lujo" },
                { label: "Pisos", value: "Madera europea en áreas sociales" },
                { label: "Climatización", value: "HVAC zonal de alta eficiencia" },
                { label: "Seguridad", value: "Sistema integral y cámaras" },
                { label: "Exterior", value: "Patio cubierto y jardín paisajístico" },
              ]}
            />
            <div
              className="rounded-2xl border p-6 sm:p-8 shadow-[0_12px_40px_-12px_rgba(42,36,22,0.08)]"
              style={{ borderColor: BORDER, background: CREAM_CARD }}
            >
              <h2 className="text-xs font-bold uppercase tracking-[0.14em]" style={{ color: MUTED }}>
                Descripción
              </h2>
              <p className="mt-5 text-sm leading-[1.75]" style={{ color: CHARCOAL }}>
                Residencia contemporánea con líneas limpias, amplios ventanales y transición fluida entre espacios interiores y
                exteriores. La cocina central con isla de cuarzo conecta con la sala y el comedor, ideal para recibir. La suite
                principal ofrece vestidor tipo boutique y baño tipo spa. El patio integra alberca, asador y área lounge con
                iluminación cálida. Ubicada en una calle tranquila de Encino Hills, con acceso rápido a colegios, parques y
                principales vías. Una propiedad pensada para quienes valoran diseño, privacidad y una experiencia de vida
                elevada en Los Ángeles.
              </p>
            </div>
          </div>

          <aside className="lg:sticky lg:top-8">
            <div
              className="overflow-hidden rounded-2xl border shadow-[0_24px_64px_-20px_rgba(26,24,20,0.35)]"
              style={{ borderColor: "rgba(255,255,255,0.08)" }}
            >
              <div className="px-5 py-4" style={{ background: CHARCOAL_DEEP }}>
                <p className="text-center text-xs font-bold uppercase tracking-[0.2em] text-[#F5F0E8]">Contactar al agente</p>
              </div>
              <div className="space-y-3 px-5 py-5" style={{ background: "#2F2A24" }}>
                <button
                  type="button"
                  className="w-full rounded-xl py-3.5 text-sm font-bold text-[#1E1810] shadow-md transition hover:brightness-105"
                  style={{ background: `linear-gradient(180deg, ${BRONZE} 0%, ${BRONZE_SOFT} 100%)` }}
                >
                  Solicitar información
                </button>
                <button
                  type="button"
                  className="w-full rounded-xl border py-3 text-sm font-semibold text-[#F5F0E8] transition hover:bg-white/5"
                  style={{ borderColor: "rgba(245,240,232,0.25)" }}
                >
                  Programar visita
                </button>
                <button
                  type="button"
                  className="w-full rounded-xl border py-3 text-sm font-semibold text-[#F5F0E8] transition hover:bg-white/5"
                  style={{ borderColor: "rgba(245,240,232,0.25)" }}
                >
                  Llamar ahora
                </button>
                <button
                  type="button"
                  className="w-full rounded-xl border py-3 text-sm font-semibold text-[#E8F5E9] transition hover:bg-white/5"
                  style={{ borderColor: "rgba(37,211,102,0.35)" }}
                >
                  Enviar por WhatsApp
                </button>
              </div>
              <div className="space-y-3 border-t px-5 py-4" style={{ borderColor: "rgba(255,255,255,0.08)", background: "#3A342E" }}>
                <div className="flex gap-3 rounded-xl border p-3" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
                  <div className="h-11 w-11 shrink-0 rounded-full bg-[#5c5348]" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#F5F0E8]">Nicole Anderson</p>
                    <p className="text-[10px] uppercase tracking-wide text-[#c4b8a8]">Segundo agente</p>
                    <p className="mt-1 text-xs text-[#e8dfd4]">(818) 555-0142</p>
                  </div>
                </div>
                <div className="flex gap-3 rounded-xl border p-3" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
                  <div className="h-11 w-11 shrink-0 rounded-full bg-[#5c5348]" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#F5F0E8]">David Ramírez</p>
                    <p className="text-[10px] uppercase tracking-wide text-[#c4b8a8]">Asesor de préstamos</p>
                    <p className="mt-1 text-xs text-[#e8dfd4]">Financiamiento y preaprobación</p>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </section>

        {/* Deep details */}
        <section className="mt-20">
          <div className="mb-10 text-center">
            <h2
              className="text-xl font-bold uppercase tracking-[0.12em] sm:text-2xl"
              style={{ color: CHARCOAL_DEEP, fontFamily: "Georgia, serif" }}
            >
              Detalles completos del inmueble
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm" style={{ color: MUTED }}>
              Ficha técnica estructurada para generar confianza: transparencia de datos, sin ruido visual.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <DeepSection
              icon={<IconHome className="h-5 w-5" />}
              heading="Tipo y estilo"
              items={[
                "Tipo de propiedad: casa unifamiliar",
                "Subtipo: contemporánea / transicional",
                "Estilo arquitectónico: moderno californiano",
                "Niveles: 2 plantas + sótano parcial",
                "Año de construcción: 2020",
                "Condición: excelente, sin reportes estructurales",
              ]}
            />
            <DeepSection
              icon={<IconRuler className="h-5 w-5" />}
              heading="Construcción y materiales"
              items={[
                "Estructura: madera y acero según planos aprobados",
                "Fachada: estuco texturizado y acentos en piedra natural",
                "Techo: tejas compuestas con garantía de 50 años",
                "Aislamiento: paredes y ático con eficiencia energética mejorada",
                "Ventanas: doble vidrio, marcos de aluminio termolacado",
                "Cimientos: losa continua en zona sísmica",
              ]}
            />
            <DeepSection
              icon={<IconBath className="h-5 w-5" />}
              heading="Interior"
              items={[
                "Calefacción: bomba de calor zonal",
                "Aire acondicionado: central multizona",
                "Pisos: madera de roble en social, porcelánico en servicio",
                "Chimenea: gas con frente lineal en sala",
                "Techos: 10 pies en planta baja, bovedilla en comedor",
                "Lavandería: interior con gabinetes y fregadero",
              ]}
            />
            <DeepSection
              icon={<IconPin className="h-5 w-5" />}
              heading="Exterior"
              items={[
                "Patio trasero: nivelado, drenaje perimetral",
                "Porch cubierto: 12 × 14 pies con iluminación LED",
                "Alberca: infinity edge, bomba variable, calefacción solar asistida",
                "Paisajismo: riego por goteo, especies de bajo consumo",
                "Barda perimetral: 6 pies, acceso peatonal y vehicular",
              ]}
            />
            <DeepSection
              icon={<IconCar className="h-5 w-5" />}
              heading="Estacionamiento"
              items={[
                "Garaje adosado: 2 plazas con cargador EV preparado",
                "Piso de garaje: epóxi texturizado",
                "Estacionamiento visitas: 2 espacios en entrada",
                "Puerta de garaje: seccional aislada con motor silencioso",
              ]}
            />
            <DeepSection
              icon={<IconRuler className="h-5 w-5" />}
              heading="Lote y terreno"
              items={[
                "Superficie del lote: 7,200 pies² (aprox.)",
                "Forma: rectangular, esquina suave",
                "Topografía: predominantemente plana",
                "Límites: según informe de título y encuesta reciente",
                "Zonificación: residencial unifamiliar (verificar con ciudad)",
              ]}
            />
            <DeepSection
              icon={<IconSparkle className="h-5 w-5" />}
              heading="Utilidades y energía"
              items={[
                "Electricidad: panel principal 200 A, subpanel cocina",
                "Agua / alcantarillado: servicios municipales",
                "Gas: natural para cocina, chimenea y calentadores",
                "Internet: fibra disponible en la cuadra (confirmar con proveedor)",
                "Energía solar: preinstalación en techo (sin paneles activos)",
              ]}
            />
            <DeepSection
              icon={<IconHome className="h-5 w-5" />}
              heading="Comunidad y HOA"
              items={[
                "HOA: sin asociación activa en calle (verificar en cierre)",
                "Cuota mensual estimada: N/A",
                "Servicios comunes: aceras municipales",
                "Restricciones: normativas de fachada según ciudad",
                "Seguridad vecinal: patrulla opcional contratada por bloque",
              ]}
            />
            <DeepSection
              icon={<IconCalendar className="h-5 w-5" />}
              heading="Información financiera"
              items={[
                "Impuestos anuales (aprox.): $18,400",
                "Valoración fiscal: sujeta a actualización del condado",
                "Prima de seguro estimada: consultar con asesor",
                "Financiamiento: opciones convencional / jumbo con David Ramírez",
                "Gastos de cierre orientativos: disponibles bajo solicitud",
              ]}
            />
            <DeepSection
              icon={<IconPin className="h-5 w-5" />}
              heading="Escuelas y ubicación"
              items={[
                "Primaria: Encino Charter Elementary (distrito LAUSD — verificar matrícula)",
                "Secundaria: opciones en radio de 2 millas",
                "Comercio: Ventura Blvd a 4 min en auto",
                "Parques: Lake Balboa y Sepulveda Basin cercanos",
                "Transporte: acceso a 101 y 405",
              ]}
            />
            <DeepSection
              icon={<IconRuler className="h-5 w-5" />}
              heading="Identificadores del inmueble"
              items={[
                "APN / Parcel: 2270-019-028 (ejemplo)",
                "MLS ID: SR-24019876 (ejemplo)",
                "Listado Leonix: LX-BR-2026-8841 (ejemplo)",
                "Última actualización de datos: marzo 2026",
              ]}
            />
            <DeepSection
              icon={<IconEye className="h-5 w-5" />}
              heading="Observaciones del agente"
              items={[
                "La propiedad ha tenido un solo dueño desde construcción; mantenimiento preventivo documentado.",
                "Se recomienda visita al atardecer para apreciar iluminación exterior y vista desde la suite.",
                "Todas las mediciones son aproximadas; el comprador debe verificar con profesional independiente.",
                "Ofertas serán presentadas conforme a instrucciones del vendedor; sin venta forzosa.",
              ]}
            />
          </div>
        </section>

        <footer className="mt-16 border-t pt-8 text-center text-xs" style={{ borderColor: BORDER, color: MUTED }}>
          <p>Vista previa generada por Leonix · Podrás editar toda la información antes de publicar.</p>
          <p className="mt-2 opacity-70">Mockup de producto — Bienes raíces · Negocio</p>
        </footer>
      </main>
    </div>
  );
}
