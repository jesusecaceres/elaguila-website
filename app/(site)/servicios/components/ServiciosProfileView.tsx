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
  editBackHref,
}: {
  profile: ServiciosProfileResolved;
  lang: ServiciosLang;
  /** Clasificados draft preview — subtle return to the application */
  editBackHref?: string;
}) {
  return (
    <div className="min-h-screen overflow-x-hidden pb-16" style={{ backgroundColor: SV.bg }}>
      <ServiciosTopBar lang={lang} editBackHref={editBackHref} />

      <main className="mx-auto max-w-[1280px] px-4 pb-10 pt-4 sm:pt-6 md:px-6 md:pt-8">
        {hasHeroIdentityResolved(profile) ? <ServiciosHero profile={profile} lang={lang} /> : null}

        {hasQuickFactsResolved(profile) ? (
          <div className="mt-5 md:mt-8">
            <ServiciosQuickFacts facts={profile.quickFacts} />
          </div>
        ) : null}

        {/*
          Mobile / tablet: action panel stacks above main column (order) so CTAs sit near hero + quick facts.
          lg+: classic two-column [content | sticky panel].
        */}
        <div className="mt-6 grid grid-cols-1 gap-6 sm:mt-8 sm:gap-8 lg:grid-cols-[minmax(0,1fr)_min(100%,380px)] lg:gap-10 xl:grid-cols-[minmax(0,1fr)_400px]">
          <aside className="order-1 min-w-0 lg:order-2 lg:sticky lg:top-[4.5rem] lg:z-10 lg:self-start">
            <ServiciosActionPanel profile={profile} lang={lang} />
          </aside>
          <div className="order-2 flex min-w-0 flex-col gap-6 sm:gap-8 lg:order-1">
            {hasAboutSectionResolved(profile) ? <ServiciosAbout profile={profile} lang={lang} /> : null}
            <ServiciosServicesGrid profile={profile} lang={lang} />
            <ServiciosGallery profile={profile} lang={lang} />
            <ServiciosTrustSection profile={profile} lang={lang} />
            <ServiciosReviews profile={profile} lang={lang} />
            <ServiciosServiceAreas profile={profile} lang={lang} />
          </div>
        </div>
      </main>
    </div>
  );
}
