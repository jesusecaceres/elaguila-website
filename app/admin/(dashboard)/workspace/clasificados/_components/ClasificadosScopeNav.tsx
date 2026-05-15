import Link from "next/link";

import type { AdminLang } from "@/app/admin/_lib/adminI18nCookie";
import { adminTr } from "@/app/admin/_lib/adminStrings";
import { adminCtaChipCompact } from "@/app/admin/_components/adminTheme";

export function ClasificadosScopeNav(props: {
  lang: AdminLang;
  queueHref: string;
  liveHref: string;
  active: "queue" | "live";
}) {
  const { lang, queueHref, liveHref, active } = props;
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
    </div>
  );
}
