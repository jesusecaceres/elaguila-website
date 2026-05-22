import type { Metadata } from "next";
import { PolicyPageShell, type PolicyLang } from "../components/policy/PolicyPageShell";
import { LEONIX_GLOBAL_LLC, LEONIX_MEDIA_SITE_NAME, leonixPageTitle } from "@/app/lib/leonixBrand";

function langFromSearch(v: string | undefined): PolicyLang {
  return v === "en" ? "en" : "es";
}

export async function generateMetadata(props: {
  searchParams?: Promise<{ lang?: string }>;
}): Promise<Metadata> {
  const sp = (await props.searchParams) ?? {};
  const lang = langFromSearch(sp.lang);
  const title = lang === "en" ? "Terms of Service" : "Términos de servicio";
  const description =
    lang === "en"
      ? `Terms of use for ${LEONIX_MEDIA_SITE_NAME} accounts and advertising.`
      : `Términos de uso de cuentas y publicidad en ${LEONIX_MEDIA_SITE_NAME}.`;
  return { title: leonixPageTitle(title), description };
}

export default async function TermsPage(props: { searchParams?: Promise<{ lang?: string }> }) {
  const sp = (await props.searchParams) ?? {};
  const lang = langFromSearch(sp.lang);
  const updated =
    lang === "en" ? "Last updated: May 21, 2026" : "Última actualización: 21 de mayo de 2026";

  return (
    <PolicyPageShell
      lang={lang}
      path="/terms"
      title={lang === "en" ? "Terms of Service" : "Términos de servicio"}
      lastUpdated={updated}
    >
      {lang === "en" ? (
        <>
          <p>
            These Terms of Service (&quot;Terms&quot;) govern your use of {LEONIX_MEDIA_SITE_NAME} ({LEONIX_GLOBAL_LLC}),
            including our website, user accounts, classifieds, and advertising tools. By using the service, you agree to
            these Terms.
          </p>
          <section>
            <h2>Eligibility and accounts</h2>
            <ul>
              <li>You must provide accurate account information and keep your credentials secure.</li>
              <li>You are responsible for activity under your account.</li>
              <li>We may suspend or terminate accounts that violate these Terms or applicable law.</li>
            </ul>
          </section>
          <section>
            <h2>Listings and content</h2>
            <ul>
              <li>You own or have rights to content you submit and grant us a license to host, display, and promote it on the platform.</li>
              <li>You must not post unlawful, misleading, infringing, or harmful content.</li>
              <li>We may remove or restrict content that violates community rules, law, or platform safety.</li>
            </ul>
          </section>
          <section>
            <h2>Paid features</h2>
            <p>
              Some features may require payment. Fees, billing, and refunds are described at checkout or in applicable
              product terms. You are responsible for charges you authorize.
            </p>
          </section>
          <section>
            <h2>Disclaimer and limitation</h2>
            <p>
              The service is provided &quot;as is&quot; to the extent permitted by law. {LEONIX_GLOBAL_LLC} is not liable for
              indirect or consequential damages arising from your use of the platform, subject to applicable law.
            </p>
          </section>
          <section>
            <h2>Changes</h2>
            <p>
              We may update these Terms. Continued use after changes are posted constitutes acceptance of the updated Terms.
            </p>
          </section>
          <section>
            <h2>Contact</h2>
            <p>
              Questions about these Terms:{" "}
              <a href="mailto:chuy@leonixmedia.com" className="font-semibold underline">
                chuy@leonixmedia.com
              </a>
              .
            </p>
          </section>
        </>
      ) : (
        <>
          <p>
            Estos Términos de servicio (&quot;Términos&quot;) rigen el uso de {LEONIX_MEDIA_SITE_NAME} ({LEONIX_GLOBAL_LLC}),
            incluido el sitio web, cuentas de usuario, clasificados y herramientas de publicidad. Al usar el servicio,
            aceptas estos Términos.
          </p>
          <section>
            <h2>Elegibilidad y cuentas</h2>
            <ul>
              <li>Debes proporcionar información de cuenta veraz y mantener seguras tus credenciales.</li>
              <li>Eres responsable de la actividad bajo tu cuenta.</li>
              <li>Podemos suspender o cerrar cuentas que violen estos Términos o la ley aplicable.</li>
            </ul>
          </section>
          <section>
            <h2>Anuncios y contenido</h2>
            <ul>
              <li>Eres titular o tienes derechos sobre el contenido que envías y nos concedes licencia para alojarlo, mostrarlo y promocionarlo en la plataforma.</li>
              <li>No debes publicar contenido ilegal, engañoso, que infrinja derechos o sea dañino.</li>
              <li>Podemos eliminar o restringir contenido que viole reglas de la comunidad, la ley o la seguridad de la plataforma.</li>
            </ul>
          </section>
          <section>
            <h2>Funciones de pago</h2>
            <p>
              Algunas funciones pueden requerir pago. Tarifas, facturación y reembolsos se describen al pagar o en los
              términos del producto aplicable. Eres responsable de los cargos que autorices.
            </p>
          </section>
          <section>
            <h2>Descargo y limitación</h2>
            <p>
              El servicio se ofrece &quot;tal cual&quot; en la medida permitida por la ley. {LEONIX_GLOBAL_LLC} no es
              responsable por daños indirectos o consecuentes derivados del uso de la plataforma, sujeto a la ley aplicable.
            </p>
          </section>
          <section>
            <h2>Cambios</h2>
            <p>
              Podemos actualizar estos Términos. El uso continuado después de publicar cambios constituye aceptación de los
              Términos actualizados.
            </p>
          </section>
          <section>
            <h2>Contacto</h2>
            <p>
              Preguntas sobre estos Términos:{" "}
              <a href="mailto:chuy@leonixmedia.com" className="font-semibold underline">
                chuy@leonixmedia.com
              </a>
              .
            </p>
          </section>
        </>
      )}
    </PolicyPageShell>
  );
}
