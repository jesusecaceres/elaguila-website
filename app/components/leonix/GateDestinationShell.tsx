"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { LeonixHeaderLanguageSelector } from "@/app/(site)/magazine/components/LeonixHeaderLanguageSelector";
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

export function GateDestinationShell({
  lang,
  title,
  subtitle,
  body,
  children,
  preserveQueryKeys: _preserveQueryKeys,
}: GateDestinationShellProps) {
  const pathname = usePathname() ?? "";
  const homeHref = `/coming-soon-v2?lang=${lang}`;

  return (
    <main lang={lang} className="min-h-screen overflow-x-hidden bg-[#F8F4EA] text-[#1F241C]">
      <div className="mx-auto max-w-2xl min-w-0 px-4 py-10 sm:px-6 sm:py-14">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Link href={homeHref} className="inline-block shrink-0">
            <Image
              src="/logo-clean.png"
              alt="Leonix Media"
              width={160}
              height={56}
              className="h-11 w-auto object-contain"
              priority
            />
          </Link>
          <LeonixHeaderLanguageSelector variant="full" pathnameOverride={pathname} className="self-start sm:self-center" />
        </div>

        <p className="inline-flex rounded-full border border-[#7A1E2C]/30 bg-[#7A1E2C]/10 px-3 py-1 text-xs font-bold tracking-wide text-[#7A1E2C]">
          Leonix Media
        </p>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-[#7A1E2C] sm:text-4xl">{title}</h1>
        {subtitle ? <p className="mt-3 text-lg font-semibold text-[#556B3E]">{subtitle}</p> : null}
        {body ? <p className="mt-4 text-base leading-relaxed text-[#3D3428]">{body}</p> : null}

        <div className="mt-8 min-w-0">{children}</div>
      </div>
    </main>
  );
}
