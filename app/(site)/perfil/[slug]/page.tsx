import { notFound } from "next/navigation";
import { getPublicBusinessProfileBySlug } from "@/app/lib/business/profile/repository";
import { BusinessProfilePresentation } from "@/app/lib/business/profile/BusinessProfilePresentation";

export const dynamic = "force-dynamic";

/**
 * Staff-Created Business Profile pipeline -- the real public Leonix Business Profile page. The
 * ONLY data source is get_public_business_profile() (see the migration), which already refuses
 * anything that is not an ACTIVE business with a PUBLISHED business_profiles row -- an unknown or
 * not-yet-public slug 404s here, exactly like a category listing's public detail page.
 */
export default async function PublicBusinessProfilePage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams?: Promise<{ lang?: string }> }) {
  const { slug } = await params;
  const sp = (await searchParams) ?? {};
  const lang: "es" | "en" = sp.lang === "en" ? "en" : "es";

  const bundle = await getPublicBusinessProfileBySlug(slug);
  if (!bundle) notFound();

  return (
    <BusinessProfilePresentation
      mode="public"
      lang={lang}
      business={bundle.business}
      profile={bundle.profile}
      contacts={bundle.contacts}
      digitalProfiles={bundle.digitalProfiles}
      customLinks={bundle.customLinks}
      serviceAreas={bundle.serviceAreas}
    />
  );
}
