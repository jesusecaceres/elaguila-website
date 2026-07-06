import { appendLangToPath } from "@/app/clasificados/lib/hubUrl";
import type { SupportedLang } from "@/app/lib/language";

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

export function communityHandoffPreviewUrl(kind: CommunityKind, routeLang: SupportedLang): string {
  const base = COMMUNITY_PREVIEW_ROUTES[kind];
  return appendLangToPath(`${base}?from=publicar`, routeLang);
}

export function communityQuickEditUrl(kind: CommunityKind, routeLang: SupportedLang): string {
  return appendLangToPath(COMMUNITY_PUBLISH_ROUTES[kind].quick, routeLang);
}
