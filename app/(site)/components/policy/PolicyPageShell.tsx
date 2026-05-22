import Link from "next/link";
import type { ReactNode } from "react";

export type PolicyLang = "es" | "en";

const CONTACT_EMAIL = "chuy@leonixmedia.com";

export function PolicyPageShell({
  lang,
  path,
  title,
  lastUpdated,
  children,
}: {
  lang: PolicyLang;
  path: "/privacy" | "/terms" | "/data-deletion";
  title: string;
  lastUpdated: string;
  children: ReactNode;
}) {
  const swap: PolicyLang = lang === "en" ? "es" : "en";

  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-[color:var(--lx-page)] text-[color:var(--lx-text)]">
      <div className="mx-auto max-w-3xl px-4 pb-20 pt-28 sm:px-6">
        <div className="mb-6 flex justify-end">
          <Link
            href={`${path}?lang=${swap}`}
            className="text-sm font-medium text-[color:var(--lx-text-2)] underline hover:text-[color:var(--lx-text)]"
          >
            {lang === "en" ? "Español" : "English"}
          </Link>
        </div>

        <article className="rounded-3xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] p-6 shadow-[0_18px_48px_rgba(42,36,22,0.10)] sm:p-8">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
          <p className="mt-2 text-sm text-[color:var(--lx-muted)]">{lastUpdated}</p>
          <div className="prose-policy mt-8 space-y-6 text-sm leading-relaxed text-[color:var(--lx-text-2)]/95 [&_h2]:text-base [&_h2]:font-bold [&_h2]:text-[color:var(--lx-text)] [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5">
            {children}
          </div>
          <p className="mt-10 border-t border-[color:var(--lx-nav-border)] pt-6 text-sm text-[color:var(--lx-text-2)]/95">
            {lang === "es" ? "Contacto" : "Contact"}:{" "}
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
