"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import Navbar from "@/app/components/Navbar";
import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { appendLangToPath } from "@/app/clasificados/lib/hubUrl";
import { ViajesLangSwitch } from "@/app/(site)/clasificados/viajes/components/ViajesLangSwitch";
import { getPublicarViajesNegociosCopy } from "../data/publicarViajesNegociosCopy";

const CARD =
  "rounded-[20px] border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] p-4 shadow-[0_8px_28px_-12px_rgba(42,36,22,0.12)] sm:p-5";
const LABEL = "block text-xs font-bold uppercase tracking-[0.1em] text-[color:var(--lx-muted)]";
const INPUT =
  "mt-1 w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-[#FFFCF7] px-3 py-2 text-sm text-[color:var(--lx-text)] outline-none ring-[color:var(--lx-focus-ring)] focus:ring-2";
const GRID2 = "grid gap-4 sm:grid-cols-2";

export function ViajesNegociosApplicationShell() {
  const sp = useSearchParams();
  const lang: Lang = sp?.get("lang") === "en" ? "en" : "es";
  const c = getPublicarViajesNegociosCopy(lang);

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
    document.title = c.documentTitle;
  }, [c.documentTitle]);

  const branchHref = appendLangToPath("/publicar/viajes", lang);
  const previewHref = appendLangToPath("/clasificados/viajes/preview", lang);

  const chk = (id: string, checked: boolean, onChange: (v: boolean) => void, label: string) => (
    <label htmlFor={id} className="flex cursor-pointer items-center gap-2 text-sm text-[color:var(--lx-text-2)]">
      <input id={id} type="checkbox" className="h-4 w-4 rounded border-[color:var(--lx-nav-border)]" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
  const a = c.audience;

  return (
    <div
      className="min-h-screen overflow-x-hidden pb-24 text-[color:var(--lx-text)]"
      style={{
        backgroundColor: "var(--lx-page)",
        backgroundImage: "radial-gradient(ellipse 120% 80% at 50% -20%, rgba(201, 180, 106, 0.14), transparent 55%)",
      }}
    >
      <Navbar />
      <div className="mx-auto flex max-w-3xl justify-end px-4 pb-2 pt-4 sm:px-6">
        <ViajesLangSwitch compact />
      </div>
      <div className="mx-auto max-w-3xl px-4 pb-8 pt-2 sm:px-6 sm:pt-4">
        <nav className="text-xs font-semibold text-[color:var(--lx-muted)]">
          <Link href={branchHref} className="hover:text-[color:var(--lx-text)]">
            ← {c.navBack}
          </Link>
        </nav>
        <header className="mt-4">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{c.h1}</h1>
          <p className="mt-2 text-sm leading-relaxed text-[color:var(--lx-text-2)]">{c.intro}</p>
        </header>

        <form className="mt-8 space-y-6" onSubmit={(e) => e.preventDefault()}>
          <section className={CARD}>
            <h2 className="text-base font-bold text-[color:var(--lx-text)]">{c.sections.main}</h2>
            <div className={`mt-4 ${GRID2}`}>
              <div>
                <label className={LABEL} htmlFor="tipoOferta">
                  {c.offerType.label}
                </label>
                <select id="tipoOferta" className={INPUT} value={tipoOferta} onChange={(e) => setTipoOferta(e.target.value)}>
                  {(Object.keys(c.offerType.options) as Array<keyof typeof c.offerType.options>).map((key) => (
                    <option key={String(key)} value={key}>
                      {c.offerType.options[key]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={LABEL} htmlFor="ctaType">
                  {c.ctaType.label}
                </label>
                <select id="ctaType" className={INPUT} value={ctaType} onChange={(e) => setCtaType(e.target.value)}>
                  {(Object.keys(c.ctaType.options) as Array<keyof typeof c.ctaType.options>).map((key) => (
                    <option key={key} value={key}>
                      {c.ctaType.options[key]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-4">
              <label className={LABEL} htmlFor="titulo">
                {c.title.label}
              </label>
              <input id="titulo" className={INPUT} value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder={c.title.placeholder} />
            </div>
            <div className={`mt-4 ${GRID2}`}>
              <div>
                <label className={LABEL} htmlFor="destino">
                  {c.destination.label}
                </label>
                <input id="destino" className={INPUT} value={destino} onChange={(e) => setDestino(e.target.value)} placeholder={c.destination.placeholder} />
              </div>
              <div>
                <label className={LABEL} htmlFor="ciudadSalida">
                  {c.departureCity.label}
                </label>
                <input id="ciudadSalida" className={INPUT} value={ciudadSalida} onChange={(e) => setCiudadSalida(e.target.value)} placeholder={c.departureCity.placeholder} />
              </div>
            </div>
            <div className={`mt-4 ${GRID2}`}>
              <div>
                <label className={LABEL} htmlFor="precio">
                  {c.price.label}
                </label>
                <input id="precio" className={INPUT} value={precio} onChange={(e) => setPrecio(e.target.value)} placeholder={c.price.placeholder} />
              </div>
              <div>
                <label className={LABEL} htmlFor="duracion">
                  {c.duration.label}
                </label>
                <input id="duracion" className={INPUT} value={duracion} onChange={(e) => setDuracion(e.target.value)} placeholder={c.duration.placeholder} />
              </div>
            </div>
            <div className="mt-4">
              <label className={LABEL} htmlFor="fechas">
                {c.dates.label}
              </label>
              <input id="fechas" className={INPUT} value={fechas} onChange={(e) => setFechas(e.target.value)} placeholder={c.dates.placeholder} />
            </div>
            <div className="mt-4">
              <label className={LABEL} htmlFor="descripcion">
                {c.shortDescription.label}
              </label>
              <textarea id="descripcion" className={`${INPUT} min-h-[88px] resize-y`} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} rows={3} />
            </div>
            <div className="mt-4">
              <label className={LABEL} htmlFor="incluye">
                {c.includes.label}
              </label>
              <textarea id="incluye" className={`${INPUT} min-h-[100px] resize-y`} value={incluye} onChange={(e) => setIncluye(e.target.value)} placeholder={c.includes.placeholder} rows={4} />
            </div>
          </section>

          <section className={CARD}>
            <h2 className="text-base font-bold text-[color:var(--lx-text)]">{c.sections.audience}</h2>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {chk("familias", familias, setFamilias, a.families)}
              {chk("parejas", parejas, setParejas, a.couples)}
              {chk("grupos", grupos, setGrupos, a.groups)}
              {chk("guiaEs", guiaEspanol, setGuiaEspanol, a.spanishGuide)}
            </div>
            <div className={`mt-4 ${GRID2}`}>
              <div>
                <label className={LABEL} htmlFor="presupuestoTag">
                  {a.budgetTag.label}
                </label>
                <select id="presupuestoTag" className={INPUT} value={presupuestoTag} onChange={(e) => setPresupuestoTag(e.target.value)}>
                  <option value="">{a.budgetTag.empty}</option>
                  <option value="economico">{a.budgetTag.economy}</option>
                  <option value="moderado">{a.budgetTag.moderate}</option>
                  <option value="premium">{a.budgetTag.premium}</option>
                </select>
              </div>
              <div>
                <label className={LABEL} htmlFor="idiomaAtencion">
                  {a.serviceLanguage.label}
                </label>
                <input id="idiomaAtencion" className={INPUT} value={idiomaAtencion} onChange={(e) => setIdiomaAtencion(e.target.value)} />
              </div>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              {chk("hotel", incluyeHotel, setIncluyeHotel, a.includesHotel)}
              {chk("transporte", incluyeTransporte, setIncluyeTransporte, a.includesTransport)}
              {chk("comida", incluyeComida, setIncluyeComida, a.includesFood)}
            </div>
          </section>

          <section className={CARD}>
            <h2 className="text-base font-bold text-[color:var(--lx-text)]">{c.sections.media}</h2>
            <div className="mt-4">
              <label className={LABEL} htmlFor="imgMain">
                {c.multimedia.heroUrl.label}
              </label>
              <input id="imgMain" className={INPUT} value={imagenPrincipal} onChange={(e) => setImagenPrincipal(e.target.value)} placeholder={c.multimedia.heroUrl.placeholder} />
            </div>
            <div className="mt-4">
              <span className={LABEL}>{c.multimedia.gallery.label}</span>
              <p className="mt-1 text-xs text-[color:var(--lx-muted)]">{c.multimedia.gallery.helper}</p>
              <textarea className={`${INPUT} mt-2 min-h-[72px]`} value={galeriaNota} onChange={(e) => setGaleriaNota(e.target.value)} placeholder={c.multimedia.gallery.placeholder} />
            </div>
            <div className={`mt-4 ${GRID2}`}>
              <div>
                <label className={LABEL} htmlFor="logo">
                  {c.multimedia.logo.label}
                </label>
                <input id="logo" className={INPUT} value={logoSocio} onChange={(e) => setLogoSocio(e.target.value)} />
              </div>
              <div>
                <label className={LABEL} htmlFor="video">
                  {c.multimedia.video.label}
                </label>
                <input id="video" className={INPUT} value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder={c.multimedia.video.placeholder} />
              </div>
            </div>
          </section>

          <section className={CARD}>
            <h2 className="text-base font-bold text-[color:var(--lx-text)]">{c.sections.business}</h2>
            <div className="mt-4">
              <label className={LABEL} htmlFor="biz">
                {c.business.name.label}
              </label>
              <input id="biz" className={INPUT} value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
            </div>
            <div className={`mt-4 ${GRID2}`}>
              <div>
                <label className={LABEL} htmlFor="tel">
                  {c.business.phone.label}
                </label>
                <input id="tel" className={INPUT} value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div>
                <label className={LABEL} htmlFor="wa">
                  {c.business.whatsapp.label}
                </label>
                <input id="wa" className={INPUT} value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
              </div>
            </div>
            <div className="mt-4">
              <label className={LABEL} htmlFor="web">
                {c.business.website.label}
              </label>
              <input id="web" className={INPUT} value={website} onChange={(e) => setWebsite(e.target.value)} />
            </div>
            <div className="mt-4">
              <label className={LABEL} htmlFor="socials">
                {c.business.socials.label}
              </label>
              <input id="socials" className={INPUT} value={socials} onChange={(e) => setSocials(e.target.value)} placeholder={c.business.socials.placeholder} />
            </div>
            <div className={`mt-4 ${GRID2}`}>
              <div>
                <label className={LABEL} htmlFor="destServed">
                  {c.business.destinationsServed.label}
                </label>
                <input id="destServed" className={INPUT} value={destinationsServed} onChange={(e) => setDestinationsServed(e.target.value)} placeholder={c.business.destinationsServed.placeholder} />
              </div>
              <div>
                <label className={LABEL} htmlFor="langs">
                  {c.business.languages.label}
                </label>
                <input id="langs" className={INPUT} value={languages} onChange={(e) => setLanguages(e.target.value)} placeholder={c.business.languages.placeholder} />
              </div>
            </div>
          </section>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              href={previewHref}
              className="inline-flex min-h-[52px] flex-1 items-center justify-center rounded-xl bg-[#D97706] px-6 text-sm font-bold text-white shadow-md transition hover:brightness-105"
            >
              {c.previewCta}
            </Link>
            <button
              type="button"
              className="inline-flex min-h-[52px] flex-1 items-center justify-center rounded-xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] px-6 text-sm font-bold text-[color:var(--lx-muted)]"
              disabled
            >
              {c.submitSoon}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
