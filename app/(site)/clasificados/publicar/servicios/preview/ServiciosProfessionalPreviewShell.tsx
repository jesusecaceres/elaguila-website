"use client";

import type { ServiciosProfileResolved, ServiciosLang } from "@/app/servicios/types/serviciosBusinessProfile";
import type { ServiciosListingTemplate } from "@/app/(site)/clasificados/servicios/lib/serviciosTemplateRouting";
import { ServiciosProfessionalProfileShell } from "@/app/servicios/components/ServiciosProfessionalProfileShell";

/**
 * Thin PREVIEW ADAPTER over the ONE professional profile shell the public detail page renders
 * (`app/(site)/servicios/components/ServiciosProfessionalProfileShell.tsx`).
 *
 * This file used to be a hand-copied second shell (its own frame, its own section order, its own
 * width), which is exactly how the preview drifted from the published listing. It now owns NO
 * presentation: no frame, no width, no section markup, no translate or share implementation. It only
 * maps preview inputs onto the shared shell's props:
 *   - the resolved profile is already entitlement-resolved by the preview client (coupons/offers
 *     included or removed there), so the shell is handed it as-is;
 *   - there is no persisted listing yet, so no listing/source ids are passed and engagement is never
 *     persisted (`persistListingEngagement={false}`); Like/Share still render and work locally;
 *   - top bar and mobile section nav stay off, exactly as on the public page.
 * The "Vista previa" banner and headings live in the preview client, OUTSIDE the shell.
 */
export function ServiciosProfessionalPreviewShell({
  profile,
  lang,
  template,
}: {
  profile: ServiciosProfileResolved;
  lang: ServiciosLang;
  template: ServiciosListingTemplate;
}) {
  return (
    <ServiciosProfessionalProfileShell
      profile={profile}
      lang={lang}
      template={template}
      showTopBar={false}
      showMobileSectionNav={false}
      showEngagementControls
      persistListingEngagement={false}
      engagementListingId={profile.identity.slug}
    />
  );
}
