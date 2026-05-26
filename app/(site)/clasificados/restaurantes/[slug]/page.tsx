import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { mapRestauranteDraftToShellData } from "@/app/clasificados/restaurantes/application/mapRestauranteDraftToShell";
import { listingJsonToDraft } from "@/app/clasificados/restaurantes/lib/restaurantesPublicListingMapper";
import { getRestaurantePublicListingBySlugFromDb } from "@/app/clasificados/restaurantes/lib/restaurantesPublicListingsServer";
import { ClasificadosPreviewAdCanvas } from "@/app/clasificados/lib/preview/ClasificadosPreviewAdCanvas";
import { RestauranteAdStoryPreview } from "@/app/clasificados/restaurantes/shell/RestauranteAdStoryPreview";
import { RestaurantesShellChrome } from "@/app/clasificados/restaurantes/shell/RestaurantesShellChrome";

type Lang = "es" | "en";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ lang?: string }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const { slug } = await props.params;
  const row = await getRestaurantePublicListingBySlugFromDb(slug);
  if (!row) {
    return { title: "Restaurante · Leonix Clasificados" };
  }
  const name = row.business_name.trim() || "Restaurante";
  const summary = row.summary_short?.trim();
  return {
    title: `${name} · Restaurantes · Leonix`,
    description: summary?.slice(0, 155),
    openGraph: {
      title: `${name} · Restaurantes`,
      type: "website",
    },
  };
}

/**
 * Public open-card detail: `/clasificados/restaurantes/[slug]`
 * Backed by `restaurantes_public_listings.listing_json` → same draft→shell mapping as preview.
 */
export default async function RestaurantePublicDetailPage(props: PageProps) {
  const { slug } = await props.params;
  const sp = props.searchParams ? await props.searchParams : {};
  const lang: Lang = sp.lang === "en" ? "en" : "es";
  const row = await getRestaurantePublicListingBySlugFromDb(slug);
  if (!row) notFound();

  const draft = listingJsonToDraft(row.listing_json);
  const shellData = mapRestauranteDraftToShellData(draft);
  const shellForPublic = { ...shellData, id: row.id };

  return (
    <RestaurantesShellChrome lang={lang}>
      <div className="mx-auto max-w-[1280px] space-y-3 px-4 pt-4 md:px-5 lg:px-6">
        <p className="text-xs text-[color:var(--lx-muted)]">
          {lang === "en" ? "Listed on Leonix Classifieds" : "Listado publicado en Leonix Clasificados"} ·{" "}
          <Link
            href={`/clasificados/restaurantes/resultados?lang=${lang}`}
            className="font-semibold text-[color:var(--lx-text-2)] underline decoration-[color:var(--lx-gold-border)] underline-offset-4 hover:text-[color:var(--lx-gold)]"
          >
            {lang === "en" ? "See more restaurants" : "Ver más restaurantes"}
          </Link>
        </p>
        <ClasificadosPreviewAdCanvas className="overflow-hidden">
          <RestauranteAdStoryPreview
            data={shellForPublic}
            listingId={(row.leonix_ad_id ?? "").trim() || row.id}
            lang={lang}
            analyticsOwnerUserId={row.owner_user_id}
            persistListingEngagement
          />
        </ClasificadosPreviewAdCanvas>
        {row.leonix_ad_id ? (
          <p className="pb-6 pt-1 text-xs text-[color:var(--lx-muted)]">
            Leonix Ad ID # {row.leonix_ad_id}
          </p>
        ) : null}
      </div>
    </RestaurantesShellChrome>
  );
}
