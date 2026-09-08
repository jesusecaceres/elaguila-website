import type { Metadata } from "next";
import { leonixPageTitle } from "@/app/lib/leonixBrand";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import { processNewsletterUnsubscribeToken } from "@/app/lib/newsletter/newsletterUnsubscribeServer";

/**
 * Public newsletter unsubscribe confirmation page.
 * Gate: CHECKOUT-NEWSLETTER-CHECKBOX-CAPTURE-01 (Step 5)
 *
 * Bilingual, truthful, no fake success. The token-based unsubscribe operation runs directly
 * server-side on page load (same idempotent, token-gated resolver the API route uses) — a repeat
 * visit/bot prefetch reports "already unsubscribed" rather than erroring, matching standard
 * one-click-unsubscribe (RFC 8058) semantics.
 */

type Lang = "es" | "en";

function langFromSearch(v: string | undefined): Lang {
  return v === "en" ? "en" : "es";
}

export async function generateMetadata(props: {
  searchParams?: Promise<{ lang?: string }>;
}): Promise<Metadata> {
  const sp = (await props.searchParams) ?? {};
  const lang = langFromSearch(sp.lang);
  return {
    title: leonixPageTitle(lang === "en" ? "Unsubscribe" : "Cancelar suscripción"),
    robots: { index: false, follow: false },
  };
}

const COPY = {
  es: {
    heading: "Cancelar suscripción",
    UNSUBSCRIBED: "Listo. Ya no recibirás correos del boletín de Leonix Media.",
    ALREADY_UNSUBSCRIBED: "Este correo ya estaba dado de baja. No recibirás más correos del boletín.",
    INVALID_TOKEN: "Este enlace de cancelación no es válido. Si necesitas ayuda, escríbenos.",
    EXPIRED_TOKEN: "Este enlace de cancelación venció. Si necesitas ayuda, escríbenos.",
    FAILED: "No pudimos procesar tu solicitud en este momento. Intenta de nuevo más tarde o escríbenos.",
    missing: "Falta el enlace de cancelación. Usa el enlace completo que recibiste por correo.",
    contact: "Contacto",
  },
  en: {
    heading: "Unsubscribe",
    UNSUBSCRIBED: "Done. You won't receive Leonix Media newsletter emails anymore.",
    ALREADY_UNSUBSCRIBED: "This email was already unsubscribed. You won't receive any more newsletter emails.",
    INVALID_TOKEN: "This unsubscribe link isn't valid. If you need help, reach out to us.",
    EXPIRED_TOKEN: "This unsubscribe link has expired. If you need help, reach out to us.",
    FAILED: "We couldn't process your request right now. Try again later or reach out to us.",
    missing: "Missing unsubscribe link. Use the full link from your email.",
    contact: "Contact",
  },
} as const;

const CONTACT_EMAIL = "chuy@leonixmedia.com";

export default async function NewsletterUnsubscribePage(props: {
  searchParams?: Promise<{ lang?: string; token?: string }>;
}) {
  const sp = (await props.searchParams) ?? {};
  const lang = langFromSearch(sp.lang);
  const token = (sp.token ?? "").trim();
  const c = COPY[lang];

  let message: string;
  if (!token) {
    message = c.missing;
  } else if (!isSupabaseAdminConfigured()) {
    message = c.FAILED;
  } else {
    try {
      const result = await processNewsletterUnsubscribeToken(getAdminSupabase(), token);
      message = c[result.status];
    } catch {
      message = c.FAILED;
    }
  }

  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-[color:var(--lx-page)] text-[color:var(--lx-text)]">
      <div className="mx-auto max-w-xl px-4 pb-20 pt-28 sm:px-6">
        <article className="rounded-3xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] p-6 shadow-[0_18px_48px_rgba(42,36,22,0.10)] sm:p-8">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{c.heading}</h1>
          <p className="mt-4 text-sm leading-relaxed text-[color:var(--lx-text-2)]/95">{message}</p>
          <p className="mt-10 border-t border-[color:var(--lx-nav-border)] pt-6 text-sm text-[color:var(--lx-text-2)]/95">
            {c.contact}:{" "}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="font-semibold text-[color:var(--lx-text)] underline decoration-[color:var(--lx-lion)]/40"
            >
              {CONTACT_EMAIL}
            </a>
          </p>
        </article>
      </div>
    </main>
  );
}
