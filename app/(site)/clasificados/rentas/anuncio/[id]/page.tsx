import { redirect } from "next/navigation";
import { rentasListingPublicPath } from "@/app/clasificados/rentas/shared/utils/rentasPublishRoutes";

type Props = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

/** Builds a query string from an arbitrary incoming searchParams object, preserving multi-value params. */
function queryStringFromSearchParams(sp: Record<string, string | string[] | undefined>): string {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(sp)) {
    if (value == null) continue;
    if (Array.isArray(value)) {
      for (const v of value) qs.append(key, v);
    } else {
      qs.append(key, value);
    }
  }
  return qs.toString();
}

/**
 * Gate I.5.4D — old Rentas-specific alias → canonical Rentas public detail (single hop, all
 * incoming query params preserved verbatim: `lang`, `returnTo`, analytics markers, etc.). Used to
 * redirect to the shared `/clasificados/anuncio/[id]` route (a different, less-proven Rentas
 * shell) instead of the approved `RentasVisualMatchPreviewView` renderer both lanes already use.
 */
export default async function RentasLiveListingRedirectPage(props: Props) {
  const { id } = await props.params;
  if (!id) redirect("/clasificados/rentas/results");
  const sp = props.searchParams ? await props.searchParams : {};
  const qs = queryStringFromSearchParams(sp);
  redirect(qs ? `${rentasListingPublicPath(id)}?${qs}` : rentasListingPublicPath(id));
}
