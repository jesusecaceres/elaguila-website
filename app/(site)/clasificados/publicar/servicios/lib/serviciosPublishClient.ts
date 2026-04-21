"use client";

import type { ServiciosBusinessProfile } from "@/app/servicios/types/serviciosBusinessProfile";
import type { ClasificadosServiciosApplicationState } from "./clasificadosServiciosApplicationTypes";
import type { ServiciosLang } from "./clasificadosServiciosApplicationTypes";

export type ServiciosPublishPersistence = "database" | "dev_workspace" | "none";

export type ServiciosPublishApiResponse = {
  ok?: boolean;
  slug?: string;
  /** Directory row status after publish (e.g. `pending_review` when moderation mode is on). */
  listingStatus?: string;
  persistence?: ServiciosPublishPersistence;
  persistedToDatabase?: boolean;
  persistedToDevWorkspace?: boolean;
  /** Legacy field — same as persistedToDatabase */
  persisted?: boolean;
  profile?: ServiciosBusinessProfile;
  missing?: { id?: string; label: string }[];
  error?: string;
  message?: string;
};

const SESSION_SLUG_KEY = "servicios_last_published_slug";

export async function postServiciosPublishApi(args: {
  state: ClasificadosServiciosApplicationState;
  lang: ServiciosLang;
  accessToken?: string | null;
}): Promise<{ res: Response; data: ServiciosPublishApiResponse }> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (args.accessToken) {
    headers.Authorization = `Bearer ${args.accessToken}`;
  }

  const existingPublicSlug =
    typeof window !== "undefined" ? sessionStorage.getItem(SESSION_SLUG_KEY) ?? undefined : undefined;

  const res = await fetch("/api/clasificados/servicios/publish", {
    method: "POST",
    headers,
    body: JSON.stringify({
      state: args.state,
      lang: args.lang,
      ...(existingPublicSlug ? { existingPublicSlug } : {}),
    }),
  });
  const data = (await res.json()) as ServiciosPublishApiResponse;

  if (typeof window !== "undefined" && data.ok && data.slug) {
    sessionStorage.setItem(SESSION_SLUG_KEY, data.slug);
  }

  return { res, data };
}
