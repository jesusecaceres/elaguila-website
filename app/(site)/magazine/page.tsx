import type { Metadata } from "next";
import { PublicPillarJsonLd } from "@/app/components/PublicPillarJsonLd";
import { normalizeLang } from "@/app/lib/language";
import { buildPublicPillarMetadata } from "@/app/lib/leonix/publicPillarSeo";
import { resolveCurrentMagazineEdition } from "@/app/lib/magazine/currentEdition";
import { resolvePublicMagazineManifest } from "@/app/lib/magazine/magazineManifestServer";
import { getMagazineEditionSponsors } from "@/app/lib/magazine/magazineSponsors";
import MagazineHubPage from "./MagazineHubClient";

export async function generateMetadata(props: {
  searchParams?: Promise<{ lang?: string }>;
}): Promise<Metadata> {
  const sp = (await props.searchParams) ?? {};
  return buildPublicPillarMetadata("magazine", normalizeLang(sp.lang));
}

export default async function MagazinePage(props: { searchParams?: Promise<{ lang?: string }> }) {
  const sp = (await props.searchParams) ?? {};
  const lang = normalizeLang(sp.lang);
  // The same public manifest Home reads (and `/api/magazine/manifest` serves). Resolved on the server so the
  // current edition and the archive are in the first paint. A manifest failure falls back to the shared base edition.
  const manifest = await resolvePublicMagazineManifest().catch(() => null);
  // Sponsors of THIS edition, from the canonical issue↔sponsor source (none exists yet → empty → truthful empty state).
  const sponsors = getMagazineEditionSponsors(resolveCurrentMagazineEdition(manifest));
  return (
    <>
      <PublicPillarJsonLd id="magazine" lang={lang} />
      <MagazineHubPage manifest={manifest} sponsors={sponsors} />
    </>
  );
}
