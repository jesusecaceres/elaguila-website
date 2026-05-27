import type { Metadata } from "next";
import { Suspense } from "react";
import { parseGateLang } from "@/app/(site)/lib/parseGateLang";
import { leonixPageTitle } from "@/app/lib/leonixBrand";
import MediaKitPageClient from "./MediaKitPageClient";

type PageProps = { searchParams?: Promise<{ lang?: string }> };

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const sp = await searchParams;
  const lang = parseGateLang(sp?.lang);
  const title = lang === "es" ? "Media Kit" : "Media Kit";
  const description =
    lang === "es"
      ? "Solicita el Media Kit de Leonix Media — publicidad impresa y exposición digital bilingüe."
      : "Request the Leonix Media Kit — Spanish print advertising and bilingual digital exposure.";
  return {
    title: leonixPageTitle(title),
    description,
  };
}

export default function MediaKitPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-[50vh] items-center justify-center bg-[#F8F4EA] text-[#3D3428]">
          <p className="text-sm font-medium">…</p>
        </main>
      }
    >
      <MediaKitPageClient />
    </Suspense>
  );
}
