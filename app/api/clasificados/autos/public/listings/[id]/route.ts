import { NextResponse } from "next/server";
import {
  getActiveLiveAutosBundle,
  isAutosClassifiedsDbConfigured,
} from "@/app/lib/clasificados/autos/autosClassifiedsListingService";
import type { AutosClassifiedsLang } from "@/app/lib/clasificados/autos/autosClassifiedsTypes";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Props) {
  const { id } = await params;
  const u = new URL(request.url);
  const lang: AutosClassifiedsLang = u.searchParams.get("lang") === "en" ? "en" : "es";
  if (!isAutosClassifiedsDbConfigured()) {
    return NextResponse.json({ ok: false, error: "db_not_configured" }, { status: 503 });
  }
  const bundle = await getActiveLiveAutosBundle(id, lang);
  if (!bundle) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }
  return NextResponse.json({
    ok: true,
    listing: bundle.listing,
    lane: bundle.lane,
    lang,
  });
}
