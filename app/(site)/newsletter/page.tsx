import type { Metadata } from "next";
import { Suspense } from "react";
import { parseGateLang } from "@/app/(site)/lib/parseGateLang";
import { leonixPageTitle } from "@/app/lib/leonixBrand";
import NewsletterPageClient from "./NewsletterPageClient";

type PageProps = { searchParams?: Promise<{ lang?: string; source?: string }> };

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const sp = await searchParams;
  const lang = parseGateLang(sp?.lang);
  const title = lang === "es" ? "Lanzamiento" : "Launch";
  const description =
    lang === "es"
      ? "Únete a la lista de interés de Leonix Media para recibir noticias y el lanzamiento oficial."
      : "Join the Leonix Media interest list for launch news and official updates.";
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
