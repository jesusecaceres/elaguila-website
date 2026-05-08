import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { appendLangToPath } from "@/app/clasificados/lib/hubUrl";

import type { CommunityKind } from "./communitySessionKeys";

export const COMMUNITY_PUBLISH_ROUTES = {
  clases: {
    quick: "/publicar/clases/quick",
  },
  comunidad: {
    quick: "/publicar/comunidad/quick",
  },
} as const;

export const COMMUNITY_PREVIEW_ROUTES = {
  clases: "/publicar/clases/quick/preview",
  comunidad: "/publicar/comunidad/quick/preview",
} as const;

export function communityHandoffPreviewUrl(kind: CommunityKind, lang: Lang): string {
  const base = COMMUNITY_PREVIEW_ROUTES[kind];
  return appendLangToPath(`${base}?from=publicar`, lang);
}

export function communityQuickEditUrl(kind: CommunityKind, lang: Lang): string {
  return appendLangToPath(COMMUNITY_PUBLISH_ROUTES[kind].quick, lang);
}
