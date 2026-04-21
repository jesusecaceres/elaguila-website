// Footer.tsx
import { CookiePreferencesTrigger } from "./CookiePreferencesTrigger";
import { LEONIX_GLOBAL_EMAIL, LEONIX_MEDIA_BRAND } from "@/app/data/leonixGlobalContact";
import { LEONIX_GLOBAL_LLC, LEONIX_MEDIA_SLOGAN, LEONIX_SITE_ORIGIN } from "@/app/lib/leonixBrand";

export default function Footer() {
  return (
    <footer className="w-full bg-[color:var(--lx-section)] text-[color:var(--lx-text)] py-12 mt-20 border-t border-[color:var(--lx-nav-border)]">
      <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-10">
        <div>
          <h3 className="text-xl font-bold text-[color:var(--lx-gold)] mb-3">Síguenos</h3>
          <ul className="space-y-2 text-[color:var(--lx-text-2)]/90">
            <li>
              <a
                href={LEONIX_SITE_ORIGIN}
                className="hover:text-[color:var(--lx-gold)] transition font-medium"
                rel="noopener noreferrer"
              >
                {LEONIX_SITE_ORIGIN.replace(/^https:\/\//, "")}
              </a>
            </li>
            <li className="text-sm text-[color:var(--lx-muted)]">
              Enlaces a redes sociales oficiales próximamente.
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-xl font-bold text-[color:var(--lx-gold)] mb-3">Contacto</h3>
          <p>
            <span className="text-[color:var(--lx-text-2)]/90">Email: </span>
            <a className="underline decoration-[color:var(--lx-gold)]" href={`mailto:${LEONIX_GLOBAL_EMAIL}`}>
              {LEONIX_GLOBAL_EMAIL}
            </a>
          </p>
          <p className="text-[color:var(--lx-text-2)]/90">Tel: (408) 937-1063</p>
          <p className="mt-2 text-xs text-[color:var(--lx-muted)]">Una empresa bajo {LEONIX_GLOBAL_LLC}.</p>
        </div>

        <div>
          <h3 className="text-xl font-bold text-[color:var(--lx-gold)] mb-3">Anuncia con nosotros</h3>
          <p className="text-[color:var(--lx-text-2)]/85">
            {LEONIX_MEDIA_BRAND} conecta negocios, clasificados y comunidad en un solo ecosistema bilingüe para el Área
            de la Bahía y el norte de California.
          </p>
          <a
            href="/contacto?lang=es"
            className="text-[color:var(--lx-text)] underline decoration-[color:var(--lx-gold)] underline-offset-4 mt-2 inline-block hover:text-[color:var(--lx-gold)] transition"
          >
            Más información →
          </a>
        </div>
      </div>

      <div className="mt-10 flex flex-col items-center gap-3 text-center px-4">
        <CookiePreferencesTrigger />
        <p className="text-[color:var(--lx-muted)] text-sm max-w-xl">{LEONIX_MEDIA_SLOGAN}</p>
        <p className="text-[color:var(--lx-muted)] text-sm">
          © {new Date().getFullYear()} {LEONIX_MEDIA_BRAND} · {LEONIX_GLOBAL_LLC}
        </p>
      </div>
    </footer>
  );
}
