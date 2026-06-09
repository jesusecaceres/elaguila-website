import type { Metadata } from "next";
import { Suspense } from "react";
import { leonixPageTitle } from "@/app/lib/leonixBrand";
import { getPublicLocaleCopy } from "@/app/lib/leonix/publicFormCopy";
import { normalizeLang } from "@/app/lib/language";
import NewsletterPageClient from "./NewsletterPageClient";

type PageProps = { searchParams?: Promise<{ lang?: string; source?: string }> };

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const sp = await searchParams;
  const lang = normalizeLang(sp?.lang);
  const copy = getPublicLocaleCopy(lang).newsletter;
  const title = copy.title;
  const description = copy.subtitle;
  return {
    title: leonixPageTitle(title),
    description,
  };
}

export default function NewsletterPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-[50vh] items-center justify-center bg-[#F8F4EA] text-[#3D3428]">
          <p className="text-sm font-medium">…</p>
        </main>
      }
    >
      <NewsletterPageClient />
    </Suspense>
  );
}
