"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { AdminCategoriesHubEntry } from "@/app/admin/_lib/adminCategoriesHubEntries";
import type { AdminLang } from "@/app/admin/_lib/adminI18nCookie";
import { adminMessages } from "@/app/admin/_lib/adminStrings";
import { ADMIN_CATEGORIES_ADVANCED_REGISTRY_HREF } from "@/app/admin/_lib/adminGlobalNav";
import { adminCardBase, adminLinkAccent } from "@/app/admin/_components/adminTheme";
import {
  ClasificadosCategorySelectedPanel,
  ClasificadosCategorySelectorButton,
} from "./_components/ClasificadosCategoryPanelShared";

export function ClasificadosCategoryCommandCenter({
  registry,
  lang,
  showRegistryLink = true,
}: {
  registry: AdminCategoriesHubEntry[];
  lang: AdminLang;
  showRegistryLink?: boolean;
}) {
  const m = adminMessages(lang);
  const [selectedSlug, setSelectedSlug] = useState(registry[0]?.slug ?? "");

  const selected = useMemo(() => {
    return registry.find((e) => e.slug === selectedSlug) ?? registry[0] ?? null;
  }, [registry, selectedSlug]);

  if (!registry.length || !selected) {
    return (
      <div className={`${adminCardBase} p-6 text-sm text-[#7A7164]`} role="status">
        No categories in registry.
      </div>
    );
  }

  return (
    <section className="mb-8 min-w-0" aria-labelledby="clasificados-command-center-heading" data-testid="clasificados-category-command-center">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h2 id="clasificados-command-center-heading" className="text-lg font-bold text-[#1E1810]">
            Categories command center
          </h2>
          <p className="mt-1 max-w-3xl text-sm leading-relaxed text-[#5C5346]">
            {(() => {
              const intro = m("hub.intro");
              const marker = "categorySchema";
              const i = intro.indexOf(marker);
              if (i < 0) return intro;
              return (
                <>
                  {intro.slice(0, i)}
                  <code className="rounded bg-[#FBF7EF] px-1 text-[11px]">{marker}</code>
                  {intro.slice(i + marker.length)}
                </>
              );
            })()}
          </p>
        </div>
        {showRegistryLink ? (
          <Link href={ADMIN_CATEGORIES_ADVANCED_REGISTRY_HREF} className={`${adminLinkAccent} shrink-0 text-sm font-bold`}>
            {m("hub.categoriesRegistry")}
          </Link>
        ) : null}
      </div>

      <div className="mb-3 overflow-x-auto overscroll-x-contain lg:hidden">
        <div className="flex gap-2 pb-1 [-webkit-overflow-scrolling:touch]" data-testid="clasificados-category-mobile-rail">
          {registry.map((entry) => (
            <button
              key={entry.slug}
              type="button"
              onClick={() => setSelectedSlug(entry.slug)}
              className={`inline-flex min-h-[44px] shrink-0 items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold ${
                entry.slug === selected.slug
                  ? "border-[#C9B46A] bg-[#FFFCF7] text-[#2C2416]"
                  : "border-[#E8DFD0] bg-[#FAF7F2] text-[#5C5346]"
              }`}
              aria-pressed={entry.slug === selected.slug}
            >
              <span aria-hidden>{entry.emoji}</span>
              {entry.displayNameEs}
            </button>
          ))}
        </div>
      </div>

      <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(240px,300px)_1fr]">
        <nav
          className={`${adminCardBase} hidden min-w-0 overflow-hidden p-3 lg:block`}
          aria-label="Category selector"
          data-testid="clasificados-category-drawer"
        >
          <p className="mb-2 px-1 text-[11px] font-bold uppercase tracking-wide text-[#7A7164]">All categories</p>
          <div className="flex max-h-[min(70vh,520px)] flex-col gap-2 overflow-y-auto overscroll-contain pr-1 [-webkit-overflow-scrolling:touch]">
            {registry.map((entry) => (
              <ClasificadosCategorySelectorButton
                key={entry.slug}
                entry={entry}
                selected={entry.slug === selected.slug}
                onSelect={() => setSelectedSlug(entry.slug)}
              />
            ))}
          </div>
        </nav>

        <ClasificadosCategorySelectedPanel entry={selected} lang={lang} showRegistryLink={showRegistryLink} />
      </div>
    </section>
  );
}
