import Link from "next/link";

import { appendLangToPath } from "@/app/clasificados/lib/hubUrl";

import type { ViajesUi } from "../data/viajesUiCopy";

export function ViajesTrustFooter({ ui }: { ui: ViajesUi }) {
  const contactHref = appendLangToPath("/contacto", ui.lang);
  const legalHref = appendLangToPath("/legal", ui.lang);

  return (
    <footer className="mt-14 border-t border-[color:var(--lx-nav-border)] bg-[color:var(--lx-section)]/60 px-4 py-10 sm:px-5 lg:px-6">
      <div className="mx-auto max-w-7xl space-y-4 text-sm text-[color:var(--lx-text-2)]">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[color:var(--lx-muted)]">{ui.trustFooter.aboutViajes}</p>
        <p className="max-w-3xl leading-relaxed">{ui.trustFooter.aboutBody}</p>
        <div className="flex flex-wrap gap-x-4 gap-y-2 pt-2 text-xs font-semibold">
          <Link href={contactHref} className="text-[color:var(--lx-text)] underline-offset-4 hover:underline">
            {ui.trustFooter.contact}
          </Link>
          <Link href={legalHref} className="text-[color:var(--lx-text)] underline-offset-4 hover:underline">
            {ui.legal.privacy}
          </Link>
          <Link href={legalHref} className="text-[color:var(--lx-text)] underline-offset-4 hover:underline">
            {ui.legal.terms}
          </Link>
        </div>
      </div>
    </footer>
  );
}
