"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import Navbar from "@/app/components/Navbar";
import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { appendLangToPath } from "@/app/clasificados/lib/hubUrl";

const CARD =
  "rounded-[20px] border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] p-4 shadow-[0_8px_28px_-12px_rgba(42,36,22,0.12)] sm:p-5";
const LABEL = "block text-xs font-bold uppercase tracking-[0.1em] text-[color:var(--lx-muted)]";
const INPUT =
  "mt-1 w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-[#FFFCF7] px-3 py-2 text-sm text-[color:var(--lx-text)] outline-none ring-[color:var(--lx-focus-ring)] focus:ring-2";
const GRID2 = "grid gap-4 sm:grid-cols-2";

export function ViajesNegociosApplicationShell() {
  const sp = useSearchParams();
  const lang: Lang = sp?.get("lang") === "en" ? "en" : "es";

  const [tipoOferta, setTipoOferta] = useState("");
  const [titulo, setTitulo] = useState("");
  const [destino, setDestino] = useState("");
  const [ciudadSalida, setCiudadSalida] = useState("");
  const [precio, setPrecio] = useState("");
  const [duracion, setDuracion] = useState("");
  const [fechas, setFechas] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [incluye, setIncluye] = useState("");
  const [ctaType, setCtaType] = useState("whatsapp");

  const [familias, setFamilias] = useState(false);
  const [parejas, setParejas] = useState(false);
  const [grupos, setGrupos] = useState(false);
  const [presupuestoTag, setPresupuestoTag] = useState("");
  const [incluyeHotel, setIncluyeHotel] = useState(false);
  const [incluyeTransporte, setIncluyeTransporte] = useState(false);
  const [incluyeComida, setIncluyeComida] = useState(false);
  const [guiaEspanol, setGuiaEspanol] = useState(false);
  const [idiomaAtencion, setIdiomaAtencion] = useState("español");

  const [imagenPrincipal, setImagenPrincipal] = useState("");
  const [galeriaNota, setGaleriaNota] = useState("");
  const [logoSocio, setLogoSocio] = useState("");
  const [videoUrl, setVideoUrl] = useState("");

  const [businessName, setBusinessName] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [socials, setSocials] = useState("");
  const [destinationsServed, setDestinationsServed] = useState("");
  const [languages, setLanguages] = useState("");

  useEffect(() => {
    document.title = lang === "en" ? "Travel business application · Leonix" : "Solicitud negocio Viajes · Leonix";
  }, [lang]);

  const branchHref = appendLangToPath("/publicar/viajes", lang);
  const previewHref = appendLangToPath("/clasificados/viajes/preview", lang);

  const chk = (id: string, checked: boolean, onChange: (v: boolean) => void, label: string) => (
    <label htmlFor={id} className="flex cursor-pointer items-center gap-2 text-sm text-[color:var(--lx-text-2)]">
      <input id={id} type="checkbox" className="h-4 w-4 rounded border-[color:var(--lx-nav-border)]" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );

  return (
    <div
      className="min-h-screen overflow-x-hidden pb-24 text-[color:var(--lx-text)]"
      style={{
        backgroundColor: "var(--lx-page)",
        backgroundImage: "radial-gradient(ellipse 120% 80% at 50% -20%, rgba(201, 180, 106, 0.14), transparent 55%)",
      }}
    >
      <Navbar />
      <div className="mx-auto max-w-3xl px-4 pb-8 pt-6 sm:px-6 sm:pt-8">
        <nav className="text-xs font-semibold text-[color:var(--lx-muted)]">
          <Link href={branchHref} className="hover:text-[color:var(--lx-text)]">
            ← {lang === "en" ? "Back to Viajes publishing" : "Volver a publicar Viajes"}
          </Link>
        </nav>
        <header className="mt-4">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {lang === "en" ? "Business travel offer" : "Oferta de viajes — negocio"}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-[color:var(--lx-text-2)]">
            {lang === "en"
              ? "Structured draft — fields will map to your public listing. Nothing is submitted yet."
              : "Borrador estructurado — los campos mapearán a tu ficha pública. Aún no se envía nada."}
          </p>
        </header>

        <form className="mt-8 space-y-6" onSubmit={(e) => e.preventDefault()}>
          <section className={CARD}>
            <h2 className="text-base font-bold text-[color:var(--lx-text)]">1. Información principal</h2>
            <div className={`mt-4 ${GRID2}`}>
              <div>
                <label className={LABEL} htmlFor="tipoOferta">
                  Tipo de oferta
                </label>
                <select id="tipoOferta" className={INPUT} value={tipoOferta} onChange={(e) => setTipoOferta(e.target.value)}>
                  <option value="">Selecciona…</option>
                  <option value="paquete">Paquete</option>
                  <option value="tour">Tour / excursión</option>
                  <option value="crucero">Crucero</option>
                  <option value="resort">Resort / hotel</option>
                  <option value="escapada">Escapada</option>
                </select>
              </div>
              <div>
                <label className={LABEL} htmlFor="ctaType">
                  Tipo de CTA principal
                </label>
                <select id="ctaType" className={INPUT} value={ctaType} onChange={(e) => setCtaType(e.target.value)}>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="telefono">Teléfono</option>
                  <option value="correo">Correo</option>
                  <option value="sitio">Sitio web</option>
                </select>
              </div>
            </div>
            <div className="mt-4">
              <label className={LABEL} htmlFor="titulo">
                Título
              </label>
              <input id="titulo" className={INPUT} value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ej. Riviera Maya todo incluido 5 noches" />
            </div>
            <div className={`mt-4 ${GRID2}`}>
              <div>
                <label className={LABEL} htmlFor="destino">
                  Destino
                </label>
                <input id="destino" className={INPUT} value={destino} onChange={(e) => setDestino(e.target.value)} placeholder="Ciudad, región o país" />
              </div>
              <div>
                <label className={LABEL} htmlFor="ciudadSalida">
                  Ciudad de salida
                </label>
                <input id="ciudadSalida" className={INPUT} value={ciudadSalida} onChange={(e) => setCiudadSalida(e.target.value)} placeholder="Ej. San José, SFO…" />
              </div>
            </div>
            <div className={`mt-4 ${GRID2}`}>
              <div>
                <label className={LABEL} htmlFor="precio">
                  Precio / precio desde
                </label>
                <input id="precio" className={INPUT} value={precio} onChange={(e) => setPrecio(e.target.value)} placeholder="USD, por persona…" />
              </div>
              <div>
                <label className={LABEL} htmlFor="duracion">
                  Duración
                </label>
                <input id="duracion" className={INPUT} value={duracion} onChange={(e) => setDuracion(e.target.value)} placeholder="Ej. 5 días / 4 noches" />
              </div>
            </div>
            <div className="mt-4">
              <label className={LABEL} htmlFor="fechas">
                Fechas o rango
              </label>
              <input id="fechas" className={INPUT} value={fechas} onChange={(e) => setFechas(e.target.value)} placeholder="Temporada, meses o fechas fijas" />
            </div>
            <div className="mt-4">
              <label className={LABEL} htmlFor="descripcion">
                Descripción corta
              </label>
              <textarea id="descripcion" className={`${INPUT} min-h-[88px] resize-y`} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} rows={3} />
            </div>
            <div className="mt-4">
              <label className={LABEL} htmlFor="incluye">
                Qué incluye
              </label>
              <textarea id="incluye" className={`${INPUT} min-h-[100px] resize-y`} value={incluye} onChange={(e) => setIncluye(e.target.value)} placeholder="Un ítem por línea o párrafo breve" rows={4} />
            </div>
          </section>

          <section className={CARD}>
            <h2 className="text-base font-bold text-[color:var(--lx-text)]">2. Audiencia y contexto</h2>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {chk("familias", familias, setFamilias, "Apto para familias")}
              {chk("parejas", parejas, setParejas, "Para parejas")}
              {chk("grupos", grupos, setGrupos, "Para grupos")}
              {chk("guiaEs", guiaEspanol, setGuiaEspanol, "Guía en español")}
            </div>
            <div className={`mt-4 ${GRID2}`}>
              <div>
                <label className={LABEL} htmlFor="presupuestoTag">
                  Etiqueta de presupuesto
                </label>
                <select id="presupuestoTag" className={INPUT} value={presupuestoTag} onChange={(e) => setPresupuestoTag(e.target.value)}>
                  <option value="">—</option>
                  <option value="economico">Económico</option>
                  <option value="moderado">Moderado</option>
                  <option value="premium">Premium</option>
                </select>
              </div>
              <div>
                <label className={LABEL} htmlFor="idiomaAtencion">
                  Idioma de atención
                </label>
                <input id="idiomaAtencion" className={INPUT} value={idiomaAtencion} onChange={(e) => setIdiomaAtencion(e.target.value)} />
              </div>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              {chk("hotel", incluyeHotel, setIncluyeHotel, "Incluye hotel")}
              {chk("transporte", incluyeTransporte, setIncluyeTransporte, "Incluye transporte")}
              {chk("comida", incluyeComida, setIncluyeComida, "Incluye comida")}
            </div>
          </section>

          <section className={CARD}>
            <h2 className="text-base font-bold text-[color:var(--lx-text)]">3. Multimedia</h2>
            <div className="mt-4">
              <label className={LABEL} htmlFor="imgMain">
                Imagen principal (URL de prueba)
              </label>
              <input id="imgMain" className={INPUT} value={imagenPrincipal} onChange={(e) => setImagenPrincipal(e.target.value)} placeholder="https://…" />
            </div>
            <div className="mt-4">
              <span className={LABEL}>Galería</span>
              <p className="mt-1 text-xs text-[color:var(--lx-muted)]">Pronto: subida múltiple. Por ahora describe o pega URLs.</p>
              <textarea className={`${INPUT} mt-2 min-h-[72px]`} value={galeriaNota} onChange={(e) => setGaleriaNota(e.target.value)} placeholder="URLs separadas por coma o notas" />
            </div>
            <div className={`mt-4 ${GRID2}`}>
              <div>
                <label className={LABEL} htmlFor="logo">
                  Logo del negocio (URL opcional)
                </label>
                <input id="logo" className={INPUT} value={logoSocio} onChange={(e) => setLogoSocio(e.target.value)} />
              </div>
              <div>
                <label className={LABEL} htmlFor="video">
                  Video (URL opcional)
                </label>
                <input id="video" className={INPUT} value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="YouTube o Vimeo" />
              </div>
            </div>
          </section>

          <section className={CARD}>
            <h2 className="text-base font-bold text-[color:var(--lx-text)]">4. Datos del negocio</h2>
            <div className="mt-4">
              <label className={LABEL} htmlFor="biz">
                Nombre del negocio
              </label>
              <input id="biz" className={INPUT} value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
            </div>
            <div className={`mt-4 ${GRID2}`}>
              <div>
                <label className={LABEL} htmlFor="tel">
                  Teléfono
                </label>
                <input id="tel" className={INPUT} value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div>
                <label className={LABEL} htmlFor="wa">
                  WhatsApp
                </label>
                <input id="wa" className={INPUT} value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
              </div>
            </div>
            <div className="mt-4">
              <label className={LABEL} htmlFor="web">
                Sitio web
              </label>
              <input id="web" className={INPUT} value={website} onChange={(e) => setWebsite(e.target.value)} />
            </div>
            <div className="mt-4">
              <label className={LABEL} htmlFor="socials">
                Redes sociales
              </label>
              <input id="socials" className={INPUT} value={socials} onChange={(e) => setSocials(e.target.value)} placeholder="@usuario o enlaces" />
            </div>
            <div className={`mt-4 ${GRID2}`}>
              <div>
                <label className={LABEL} htmlFor="destServed">
                  Destinos que atienden
                </label>
                <input id="destServed" className={INPUT} value={destinationsServed} onChange={(e) => setDestinationsServed(e.target.value)} placeholder="Separados por coma" />
              </div>
              <div>
                <label className={LABEL} htmlFor="langs">
                  Idiomas
                </label>
                <input id="langs" className={INPUT} value={languages} onChange={(e) => setLanguages(e.target.value)} placeholder="Ej. Español, inglés" />
              </div>
            </div>
          </section>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              href={previewHref}
              className="inline-flex min-h-[52px] flex-1 items-center justify-center rounded-xl bg-[#D97706] px-6 text-sm font-bold text-white shadow-md transition hover:brightness-105"
            >
              {lang === "en" ? "Preview public card" : "Vista previa de la ficha"}
            </Link>
            <button
              type="button"
              className="inline-flex min-h-[52px] flex-1 items-center justify-center rounded-xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] px-6 text-sm font-bold text-[color:var(--lx-muted)]"
              disabled
            >
              {lang === "en" ? "Submit (soon)" : "Enviar (próximamente)"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
