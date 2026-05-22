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
  const title = lang === "en" ? "Privacy Policy" : "Política de privacidad";
  const description =
    lang === "en"
      ? `How ${LEONIX_MEDIA_SITE_NAME} collects and uses account and listing information.`
      : `Cómo ${LEONIX_MEDIA_SITE_NAME} recopila y usa información de cuenta y anuncios.`;
  return { title: leonixPageTitle(title), description };
}

export default async function PrivacyPage(props: { searchParams?: Promise<{ lang?: string }> }) {
  const sp = (await props.searchParams) ?? {};
  const lang = langFromSearch(sp.lang);
  const updated =
    lang === "en" ? "Last updated: May 21, 2026" : "Última actualización: 21 de mayo de 2026";

  return (
    <PolicyPageShell lang={lang} path="/privacy" title={lang === "en" ? "Privacy Policy" : "Política de privacidad"} lastUpdated={updated}>
      {lang === "en" ? (
        <>
          <p>
            This Privacy Policy describes how {LEONIX_MEDIA_SITE_NAME} ({LEONIX_GLOBAL_LLC}) collects, uses, and
            protects information when you use our website, accounts, and advertising platform at leonixmedia.com.
          </p>
          <section>
            <h2>Information we collect</h2>
            <ul>
              <li>
                <strong>Account information</strong> when you sign in: email address, display name, and profile photo
                provided by login providers (for example Google) or information you enter in your profile.
              </li>
              <li>
                <strong>Listing and business information</strong> you choose to submit: ad copy, photos, contact details,
                location, category, and related account or business profile fields.
              </li>
              <li>
                <strong>Usage and technical data</strong> such as device/browser type, pages visited, and security logs
                needed to operate and protect the service.
              </li>
            </ul>
          </section>
          <section>
            <h2>How we use information</h2>
            <ul>
              <li>To create and manage your account and session.</li>
              <li>To publish, display, and moderate listings and business content you submit.</li>
              <li>To respond to messages, support requests, and platform notifications.</li>
              <li>To improve security, prevent abuse, and comply with legal obligations.</li>
            </ul>
          </section>
          <section>
            <h2>Sharing</h2>
            <p>
              We do not sell your personal information. We use service providers (such as hosting, authentication, email,
              and payments where applicable) only to operate the platform. Public listing content you publish may be
              visible to other users and search engines according to your listing settings.
            </p>
          </section>
          <section>
            <h2>Your choices</h2>
            <p>
              You may update profile information in your dashboard, sign out at any time, and request account or data
              deletion as described on our{" "}
              <a href="/data-deletion?lang=en" className="font-semibold underline">
                Data Deletion Instructions
              </a>{" "}
              page.
            </p>
          </section>
          <section>
            <h2>Contact</h2>
            <p>
              For privacy questions or requests, email us at{" "}
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
            Esta Política de privacidad describe cómo {LEONIX_MEDIA_SITE_NAME} ({LEONIX_GLOBAL_LLC}) recopila, usa y
            protege la información cuando utilizas nuestro sitio web, cuentas y plataforma de anuncios en leonixmedia.com.
          </p>
          <section>
            <h2>Información que recopilamos</h2>
            <ul>
              <li>
                <strong>Información de cuenta</strong> al iniciar sesión: correo electrónico, nombre para mostrar y foto de
                perfil proporcionados por proveedores de acceso (por ejemplo Google) o datos que ingreses en tu perfil.
              </li>
              <li>
                <strong>Información de anuncios y negocio</strong> que decides enviar: textos, fotos, datos de contacto,
                ubicación, categoría y campos relacionados del perfil de cuenta o negocio.
              </li>
              <li>
                <strong>Datos de uso y técnicos</strong> como tipo de dispositivo/navegador, páginas visitadas y registros de
                seguridad necesarios para operar y proteger el servicio.
              </li>
            </ul>
          </section>
          <section>
            <h2>Cómo usamos la información</h2>
            <ul>
              <li>Para crear y administrar tu cuenta y sesión.</li>
              <li>Para publicar, mostrar y moderar anuncios y contenido de negocio que envíes.</li>
              <li>Para responder mensajes, solicitudes de soporte y notificaciones de la plataforma.</li>
              <li>Para mejorar la seguridad, prevenir abuso y cumplir obligaciones legales.</li>
            </ul>
          </section>
          <section>
            <h2>Compartición</h2>
            <p>
              No vendemos tu información personal. Usamos proveedores de servicios (por ejemplo alojamiento, autenticación,
              correo y pagos cuando aplique) solo para operar la plataforma. El contenido público de anuncios que publiques
              puede ser visible para otros usuarios y buscadores según la configuración de tu anuncio.
            </p>
          </section>
          <section>
            <h2>Tus opciones</h2>
            <p>
              Puedes actualizar tu perfil en el panel, cerrar sesión en cualquier momento y solicitar eliminación de cuenta
              o datos según nuestras{" "}
              <a href="/data-deletion?lang=es" className="font-semibold underline">
                Instrucciones de eliminación de datos
              </a>
              .
            </p>
          </section>
          <section>
            <h2>Contacto</h2>
            <p>
              Para preguntas o solicitudes de privacidad, escríbenos a{" "}
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
