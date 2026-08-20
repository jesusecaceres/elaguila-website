import { buildPublicPillarJsonLd, type PublicPillarId } from "@/app/lib/leonix/publicPillarSeo";
import type { SupportedLang } from "@/app/lib/language";

export function PublicPillarJsonLd({ id, lang }: { id: PublicPillarId; lang: SupportedLang }) {
  const jsonLd = buildPublicPillarJsonLd(id, lang);
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
  );
}
