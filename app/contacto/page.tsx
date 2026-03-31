import type { Metadata } from "next";
import Link from "next/link";
import {
  LEONIX_GLOBAL_CONTACT_PATH,
  LEONIX_GLOBAL_EMAIL,
  LEONIX_GLOBAL_MAILTO,
  LEONIX_MEDIA_BRAND,
} from "@/app/data/leonixGlobalContact";
import { LEONIX_TIENDA_CONTACT_PATH } from "@/app/tienda/data/leonixContact";

type Lang = "es" | "en";

function normalizeLang(v: string | undefined): Lang {
  return v === "en" ? "en" : "es";
}

function withLang(href: string, lang: Lang): string {
  const [path, query = ""] = href.split("?");
  const params = new URLSearchParams(query);
  params.set("lang", lang);
  return `${path}?${params.toString()}`;
}

export async function generateMetadata(props: {
  searchParams?: Promise<{ lang?: string }>;
}): Promise<Metadata> {
  const sp = (await props.searchParams) ?? {};
  const lang = normalizeLang(sp.lang);
  const title = lang === "en" ? `Contact · ${LEONIX_MEDIA_BRAND}` : `Contacto · ${LEONIX_MEDIA_BRAND}`;
  const description =
    lang === "en"
      ? `General inquiries for ${LEONIX_MEDIA_BRAND}.`
      : `Consultas generales para ${LEONIX_MEDIA_BRAND}.`;
  return { title, description, openGraph: { title, description } };
}

export default async function ContactoPage(props: { searchParams?: Promise<{ lang?: string }> }) {
  const sp = (await props.searchParams) ?? {};
  const lang = normalizeLang(sp.lang);
  const swap = lang === "en" ? "es" : "en";

  const copy =
    lang === "en"
      ? {
          h1: "Contact",
          intro: `Reach ${LEONIX_MEDIA_BRAND} for general questions, partnerships, and editorial or media-related requests.`,
          business: "Contact details",
          emailLabel: "Email",
          hoursLabel: "Hours",
          hours: "Monday–Friday, 9:00 AM – 5:00 PM Pacific",
          formTitle: "Send a message",
          formNote:
            "This form is for general contact. It does not submit a Tienda print order — for cards, flyers, banners, and quotes, use the Tienda contact page.",
          name: "Full name",
          namePh: "Your name",
          emailF: "Email",
          emailPh: "you@example.com",
          message: "Message",
          messagePh: "How can we help?",
          submit: "Send message",
          submitHint: "Submit handler can be wired when backend is ready.",
          tiendaTitle: "Print store (Tienda)",
          tiendaBody:
            "For business printing, orders, file uploads, and Tienda quotes, use the dedicated Tienda contact page so we route you correctly.",
          tiendaCta: "Tienda help & contact",
          langSwitch: "Español",
        }
      : {
          h1: "Contacto",
          intro: `Comunícate con ${LEONIX_MEDIA_BRAND} para consultas generales, alianzas y temas editoriales o de medios.`,
          business: "Datos de contacto",
          emailLabel: "Correo",
          hoursLabel: "Horario",
          hours: "Lunes a viernes, 9:00 – 17:00 (Pacífico)",
          formTitle: "Envíanos un mensaje",
          formNote:
            "Este formulario es para contacto general. No envía un pedido de Tienda — para tarjetas, volantes, banners y cotizaciones, usa la página de contacto de Tienda.",
          name: "Nombre completo",
          namePh: "Tu nombre",
          emailF: "Correo electrónico",
          emailPh: "tu@ejemplo.com",
          message: "Mensaje",
          messagePh: "¿En qué podemos ayudarte?",
          submit: "Enviar mensaje",
          submitHint: "El envío real se puede conectar cuando haya backend.",
          tiendaTitle: "Tienda de impresión",
          tiendaBody:
            "Para impresión comercial, pedidos, subida de archivos y cotizaciones de Tienda, usa la página de contacto dedicada para enrutarte bien.",
          tiendaCta: "Ayuda y contacto Tienda",
          langSwitch: "English",
        };

  return (
    <main className="min-h-screen w-full bg-[color:var(--lx-page)] text-[color:var(--lx-text)]">
      <div className="pt-28 pb-20 px-6 max-w-4xl mx-auto">
        <div className="flex justify-end mb-6">
          <Link
            href={withLang(LEONIX_GLOBAL_CONTACT_PATH, swap)}
            className="text-sm font-medium text-[color:var(--lx-text-2)] hover:text-[color:var(--lx-text)] underline"
          >
            {copy.langSwitch}
          </Link>
        </div>

        <h1 className="text-4xl font-bold text-[color:var(--lx-text)] text-center mb-4">{copy.h1}</h1>

        <p className="text-center text-[color:var(--lx-text-2)]/85 mb-10 max-w-2xl mx-auto leading-relaxed">
          {copy.intro}
        </p>

        <div className="bg-[color:var(--lx-card)] p-6 rounded-2xl shadow-[0_18px_48px_rgba(42,36,22,0.10)] mb-8 border border-[color:var(--lx-nav-border)]">
          <h2 className="text-xl font-semibold text-[color:var(--lx-text)] mb-3">{copy.tiendaTitle}</h2>
          <p className="text-sm text-[color:var(--lx-text-2)]/90 leading-relaxed mb-4">{copy.tiendaBody}</p>
          <Link
            href={withLang(LEONIX_TIENDA_CONTACT_PATH, lang)}
            className="inline-flex items-center justify-center rounded-full bg-[color:var(--lx-cta-dark)] px-5 py-2.5 text-sm font-semibold text-[color:var(--lx-cta-light)] hover:opacity-95 transition"
          >
            {copy.tiendaCta}
          </Link>
        </div>

        <div className="bg-[color:var(--lx-card)] p-6 rounded-2xl shadow-[0_18px_48px_rgba(42,36,22,0.10)] mb-12 border border-[color:var(--lx-nav-border)]">
          <h2 className="text-2xl font-semibold text-[color:var(--lx-text)] mb-4">{copy.business}</h2>

          <div className="space-y-3 text-[color:var(--lx-text-2)]/90">
            <p>
              <span className="font-semibold text-[color:var(--lx-text)]">{copy.emailLabel}:</span>{" "}
              <a href={LEONIX_GLOBAL_MAILTO} className="underline hover:opacity-80">
                {LEONIX_GLOBAL_EMAIL}
              </a>
            </p>

            <p>
              <span className="font-semibold text-[color:var(--lx-text)]">{copy.hoursLabel}:</span> {copy.hours}
            </p>
          </div>
        </div>

        <div className="bg-[color:var(--lx-card)] p-8 rounded-2xl shadow-[0_18px_48px_rgba(42,36,22,0.10)] border border-[color:var(--lx-nav-border)]">
          <h2 className="text-2xl font-semibold text-[color:var(--lx-text)] mb-4">{copy.formTitle}</h2>
          <p className="text-sm text-[color:var(--lx-muted)] mb-6 leading-relaxed">{copy.formNote}</p>

          <form className="space-y-6">
            <div>
              <label className="block mb-1 text-[color:var(--lx-text-2)]/90">{copy.name}</label>
              <input
                type="text"
                name="name"
                className="w-full p-3 rounded-lg bg-white/70 border border-[color:var(--lx-nav-border)] text-[color:var(--lx-text)] placeholder:text-[color:var(--lx-muted)] focus:outline-none"
                placeholder={copy.namePh}
                autoComplete="name"
              />
            </div>

            <div>
              <label className="block mb-1 text-[color:var(--lx-text-2)]/90">{copy.emailF}</label>
              <input
                type="email"
                name="email"
                className="w-full p-3 rounded-lg bg-white/70 border border-[color:var(--lx-nav-border)] text-[color:var(--lx-text)] placeholder:text-[color:var(--lx-muted)] focus:outline-none"
                placeholder={copy.emailPh}
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block mb-1 text-[color:var(--lx-text-2)]/90">{copy.message}</label>
              <textarea
                name="message"
                rows={5}
                className="w-full p-3 rounded-lg bg-white/70 border border-[color:var(--lx-nav-border)] text-[color:var(--lx-text)] placeholder:text-[color:var(--lx-muted)] focus:outline-none"
                placeholder={copy.messagePh}
              />
            </div>

            <button
              type="button"
              disabled
              className="w-full py-3 rounded-xl text-lg font-semibold bg-[color:var(--lx-cta-dark)] text-[color:var(--lx-cta-light)] shadow-[0_10px_28px_rgba(42,36,22,0.18)] opacity-60 cursor-not-allowed"
            >
              {copy.submit}
            </button>
            <p className="text-xs text-[color:var(--lx-muted)] text-center">{copy.submitHint}</p>
          </form>
        </div>
      </div>
    </main>
  );
}
