import type { ServiciosProfileResolved, ServiciosLang } from "../types/serviciosBusinessProfile";
import {
  hasAboutSectionResolved,
  hasHeroIdentityResolved,
  hasQuickFactsResolved,
} from "../lib/serviciosProfilePresence";
import { ServiciosTopBar } from "./ServiciosTopBar";
import { ServiciosHero } from "./ServiciosHero";
import { ServiciosQuickFacts } from "./ServiciosQuickFacts";
import { ServiciosAbout } from "./ServiciosAbout";
import { ServiciosServicesGrid } from "./ServiciosServicesGrid";
import { ServiciosGallery } from "./ServiciosGallery";
import { ServiciosTrustSection } from "./ServiciosTrustSection";
import { ServiciosReviews } from "./ServiciosReviews";
import { ServiciosServiceAreas } from "./ServiciosServiceAreas";
import { ServiciosActionPanel } from "./ServiciosActionPanel";
import { SV } from "./serviciosDesignTokens";

export function ServiciosProfileView({
  profile,
  lang,
}: {
  profile: ServiciosProfileResolved;
  lang: ServiciosLang;
}) {
  return (
    <div className="min-h-screen pb-16" style={{ backgroundColor: SV.bg }}>
      <ServiciosTopBar lang={lang} />

      <main className="mx-auto max-w-[1280px] px-4 pb-10 pt-6 md:px-6 md:pt-8">
        {hasHeroIdentityResolved(profile) ? <ServiciosHero profile={profile} lang={lang} /> : null}

        {hasQuickFactsResolved(profile) ? (
          <div className="mt-6 md:mt-8">
            <ServiciosQuickFacts facts={profile.quickFacts} />
          </div>
        ) : null}

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_min(100%,380px)] lg:gap-10 xl:grid-cols-[minmax(0,1fr)_400px]">
          <div className="flex min-w-0 flex-col gap-8">
            {hasAboutSectionResolved(profile) ? <ServiciosAbout profile={profile} lang={lang} /> : null}
            <ServiciosServicesGrid profile={profile} lang={lang} />
            <ServiciosGallery profile={profile} lang={lang} />
            <ServiciosTrustSection profile={profile} lang={lang} />
            <ServiciosReviews profile={profile} lang={lang} />
            <ServiciosServiceAreas profile={profile} lang={lang} />
          </div>

          <ServiciosActionPanel profile={profile} lang={lang} />
        </div>
      </main>
    </div>
  );
}
