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
  const title = lang === "en" ? "Data Deletion Instructions" : "Instrucciones de eliminación de datos";
  const description =
    lang === "en"
      ? `How to request deletion of your ${LEONIX_MEDIA_SITE_NAME} account and associated data.`
      : `Cómo solicitar la eliminación de tu cuenta y datos en ${LEONIX_MEDIA_SITE_NAME}.`;
  return { title: leonixPageTitle(title), description };
}

export default async function DataDeletionPage(props: { searchParams?: Promise<{ lang?: string }> }) {
  const sp = (await props.searchParams) ?? {};
  const lang = langFromSearch(sp.lang);
  const updated =
    lang === "en" ? "Last updated: May 21, 2026" : "Última actualización: 21 de mayo de 2026";

  return (
    <PolicyPageShell
      lang={lang}
      path="/data-deletion"
      title={lang === "en" ? "Data Deletion Instructions" : "Instrucciones de eliminación de datos"}
      lastUpdated={updated}
    >
      {lang === "en" ? (
        <>
          <p>
            You may request deletion of your {LEONIX_MEDIA_SITE_NAME} account and associated personal data held by{" "}
            {LEONIX_GLOBAL_LLC}. This page explains how to submit a request.
          </p>
          <section>
            <h2>What you can request</h2>
            <ul>
              <li>Deletion of your user account (email sign-in, Google sign-in, or other linked login).</li>
              <li>Removal of profile information (name, contact fields, and account metadata).</li>
              <li>Deletion or deactivation of listings and business content tied to your account, subject to legal retention needs.</li>
            </ul>
          </section>
          <section>
            <h2>How to request deletion</h2>
            <ol className="list-decimal space-y-2 pl-5">
              <li>
                Email{" "}
                <a href="mailto:chuy@leonixmedia.com" className="font-semibold underline">
                  chuy@leonixmedia.com
                </a>{" "}
                from the address associated with your account (or explain how we can verify ownership).
              </li>
              <li>Include the subject line: <strong>Data deletion request</strong>.</li>
              <li>
                Tell us your account email and, if helpful, your display name or listing titles so we can locate your data.
              </li>
              <li>We will confirm receipt and complete verified requests within a reasonable timeframe.</li>
            </ol>
          </section>
          <section>
            <h2>Before you delete</h2>
            <p>
              Deletion is permanent for account access. Some information may be retained where required by law, fraud
              prevention, or dispute resolution. Public copies cached by third parties are outside our control.
            </p>
          </section>
          <section>
            <h2>Related policies</h2>
            <p>
              See also our{" "}
              <a href="/privacy?lang=en" className="font-semibold underline">
                Privacy Policy
              </a>{" "}
              and{" "}
              <a href="/terms?lang=en" className="font-semibold underline">
                Terms of Service
              </a>
              .
            </p>
          </section>
        </>
      ) : (
        <>
          <p>
            Puedes solicitar la eliminación de tu cuenta de {LEONIX_MEDIA_SITE_NAME} y los datos personales asociados
            que conserva {LEONIX_GLOBAL_LLC}. Esta página explica cómo enviar la solicitud.
          </p>
          <section>
            <h2>Qué puedes solicitar</h2>
            <ul>
              <li>Eliminación de tu cuenta de usuario (acceso por correo, Google u otro inicio de sesión vinculado).</li>
              <li>Eliminación de información de perfil (nombre, contacto y metadatos de cuenta).</li>
              <li>
                Eliminación o desactivación de anuncios y contenido de negocio vinculados a tu cuenta, sujeto a retención
                legal cuando aplique.
              </li>
            </ul>
          </section>
          <section>
            <h2>Cómo solicitar la eliminación</h2>
            <ol className="list-decimal space-y-2 pl-5">
              <li>
                Envía un correo a{" "}
                <a href="mailto:chuy@leonixmedia.com" className="font-semibold underline">
                  chuy@leonixmedia.com
                </a>{" "}
                desde la dirección asociada a tu cuenta (o indica cómo podemos verificar titularidad).
              </li>
              <li>Asunto sugerido: <strong>Solicitud de eliminación de datos</strong>.</li>
              <li>
                Incluye el correo de tu cuenta y, si ayuda, tu nombre para mostrar o títulos de anuncios para ubicar tus datos.
              </li>
              <li>Confirmaremos la recepción y completaremos solicitudes verificadas en un plazo razonable.</li>
            </ol>
          </section>
          <section>
            <h2>Antes de eliminar</h2>
            <p>
              La eliminación es permanente para el acceso a la cuenta. Parte de la información puede conservarse cuando la
              ley, la prevención de fraude o la resolución de disputas lo exijan. Copias públicas en caché de terceros están
              fuera de nuestro control.
            </p>
          </section>
          <section>
            <h2>Políticas relacionadas</h2>
            <p>
              Consulta también nuestra{" "}
              <a href="/privacy?lang=es" className="font-semibold underline">
                Política de privacidad
              </a>{" "}
              y los{" "}
              <a href="/terms?lang=es" className="font-semibold underline">
                Términos de servicio
              </a>
              .
            </p>
          </section>
        </>
      )}
    </PolicyPageShell>
  );
}
