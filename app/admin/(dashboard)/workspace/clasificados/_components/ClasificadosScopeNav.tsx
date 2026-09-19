import Link from "next/link";

import type { AdminLang } from "@/app/admin/_lib/adminI18nCookie";
import { adminTr } from "@/app/admin/_lib/adminStrings";
import { adminCtaChipCompact } from "@/app/admin/_components/adminTheme";

export function ClasificadosScopeNav(props: {
  lang: AdminLang;
  queueHref: string;
  liveHref: string;
  /** Optional third scope (Ofertas Locales): rejected / archived / expired offers. Omitted = no History tab. */
  historyHref?: string;
  active: "queue" | "live" | "history";
}) {
  const { lang, queueHref, liveHref, historyHref, active } = props;
  return (
    <div className="flex flex-wrap gap-2 pt-2" role="navigation" aria-label={adminTr(lang, "scopeNav.aria")}>
      <Link
        href={queueHref}
        className={`${adminCtaChipCompact} ${active === "queue" ? "ring-2 ring-[#C9B46A]/80" : ""}`}
        title={adminTr(lang, "scopeNav.queueTitle")}
        aria-current={active === "queue" ? "page" : undefined}
      >
        {adminTr(lang, "scopeNav.queue")}
      </Link>
      <Link
        href={liveHref}
        className={`${adminCtaChipCompact} ${active === "live" ? "ring-2 ring-emerald-600/50" : ""}`}
        title={adminTr(lang, "scopeNav.liveTitle")}
        aria-current={active === "live" ? "page" : undefined}
      >
        {adminTr(lang, "scopeNav.live")}
      </Link>
      {historyHref ? (
        <Link
          href={historyHref}
          className={`${adminCtaChipCompact} ${active === "history" ? "ring-2 ring-slate-500/50" : ""}`}
          title={adminTr(lang, "scopeNav.historyTitle")}
          aria-current={active === "history" ? "page" : undefined}
          data-testid="scope-nav-history"
        >
          {adminTr(lang, "scopeNav.history")}
        </Link>
      ) : null}
    </div>
  );
}
