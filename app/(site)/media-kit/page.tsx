import type { Metadata } from "next";
import { Suspense } from "react";
import { parseGateLang } from "@/app/(site)/lib/parseGateLang";
import { leonixPageTitle } from "@/app/lib/leonixBrand";
import { getMediaKitPageCopy } from "@/app/lib/leonix/mediaKitPageCopy";
import MediaKitPageClient from "./MediaKitPageClient";

type PageProps = { searchParams?: Promise<{ lang?: string }> };

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const sp = await searchParams;
  const lang = parseGateLang(sp?.lang);
  const copy = getMediaKitPageCopy(lang);
  return {
    title: leonixPageTitle(copy.metaTitle),
    description: copy.metaDescription,
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
