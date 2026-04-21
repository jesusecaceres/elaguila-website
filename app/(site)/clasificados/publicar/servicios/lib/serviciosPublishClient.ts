"use client";

import type { ServiciosBusinessProfile } from "@/app/servicios/types/serviciosBusinessProfile";
import type { ClasificadosServiciosApplicationState } from "./clasificadosServiciosApplicationTypes";
import type { ServiciosLang } from "./clasificadosServiciosApplicationTypes";

export type ServiciosPublishPersistence = "database" | "dev_workspace" | "none";

export type ServiciosPublishApiResponse = {
  ok?: boolean;
  slug?: string;
  persistence?: ServiciosPublishPersistence;
  persistedToDatabase?: boolean;
  persistedToDevWorkspace?: boolean;
  /** Legacy field — same as persistedToDatabase */
  persisted?: boolean;
  profile?: ServiciosBusinessProfile;
  missing?: { id?: string; label: string }[];
  error?: string;
};

export async function postServiciosPublishApi(args: {
  state: ClasificadosServiciosApplicationState;
  lang: ServiciosLang;
}): Promise<{ res: Response; data: ServiciosPublishApiResponse }> {
  const res = await fetch("/api/clasificados/servicios/publish", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ state: args.state, lang: args.lang }),
  });
  const data = (await res.json()) as ServiciosPublishApiResponse;
  return { res, data };
}
