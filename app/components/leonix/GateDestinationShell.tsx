"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useMemo, type ReactNode } from "react";
import type { GateLang } from "@/app/(site)/lib/parseGateLang";

type GateDestinationShellProps = {
  lang: GateLang;
  title: string;
  subtitle: string;
  body: string;
  children: ReactNode;
  /** Query keys to preserve when switching language (e.g. `source`). */
  preserveQueryKeys?: string[];
};

function buildLangHref(
  pathname: string,
  searchParams: URLSearchParams | null,
  lang: GateLang,
  preserveQueryKeys?: string[]
) {
  const params = new URLSearchParams();
  params.set("lang", lang);
  if (preserveQueryKeys?.length && searchParams) {
    for (const key of preserveQueryKeys) {
      const value = searchParams.get(key);
      if (value) params.set(key, value);
    }
  }
  return `${pathname}?${params.toString()}`;
}

export function GateDestinationShell({
  lang,
  title,
  subtitle,
  body,
  children,
  preserveQueryKeys,
}: GateDestinationShellProps) {
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const otherLang: GateLang = lang === "es" ? "en" : "es";
  const switchLabel = lang === "es" ? "English" : "Español";
  const switchHref = useMemo(
    () => buildLangHref(pathname, searchParams, otherLang, preserveQueryKeys),
    [pathname, searchParams, otherLang, preserveQueryKeys]
  );

  return (
    <main className="min-h-screen bg-[#F8F4EA] text-[#1F241C]">
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Link href={lang === "es" ? "/?lang=es" : "/?lang=en"} className="inline-block shrink-0">
            <Image
              src="/logo-clean.png"
              alt="Leonix Media"
              width={160}
              height={56}
              className="h-11 w-auto object-contain"
              priority
            />
          </Link>
          <Link
            href={switchHref}
            className="self-start rounded-full border border-[#D6C7AD] bg-[#FFFDF7] px-4 py-2 text-sm font-semibold text-[#3D3428] transition hover:border-[#C9A84A] hover:text-[#7A1E2C] sm:self-center"
          >
            {switchLabel}
          </Link>
        </div>

        <p className="inline-flex rounded-full border border-[#7A1E2C]/30 bg-[#7A1E2C]/10 px-3 py-1 text-xs font-bold tracking-wide text-[#7A1E2C]">
          Leonix Media
        </p>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-[#7A1E2C] sm:text-4xl">{title}</h1>
        <p className="mt-3 text-lg font-semibold text-[#556B3E]">{subtitle}</p>
        <p className="mt-4 text-base leading-relaxed text-[#3D3428]">{body}</p>

        <div className="mt-8">{children}</div>
      </div>
    </main>
  );
}
