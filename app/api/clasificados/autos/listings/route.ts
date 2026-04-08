import { NextResponse } from "next/server";
import type { AutoDealerListing } from "@/app/clasificados/autos/negocios/types/autoDealerListing";
import { getAutosPublishUserIdFromRequest } from "@/app/lib/clasificados/autos/autosListingBearerAuth";
import {
  createAutosClassifiedsListing,
  isAutosClassifiedsDbConfigured,
} from "@/app/lib/clasificados/autos/autosClassifiedsListingService";
import type { AutosClassifiedsLane, AutosClassifiedsLang } from "@/app/lib/clasificados/autos/autosClassifiedsTypes";

export const dynamic = "force-dynamic";

type Body = {
  listing?: AutoDealerListing;
  lane?: AutosClassifiedsLane;
  lang?: AutosClassifiedsLang;
};

export async function POST(request: Request) {
  if (!isAutosClassifiedsDbConfigured()) {
    return NextResponse.json({ ok: false, error: "db_not_configured" }, { status: 503 });
  }
  const userId = await getAutosPublishUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }
  if (!body.listing || (body.lane !== "negocios" && body.lane !== "privado")) {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }
  const lang: AutosClassifiedsLang = body.lang === "en" ? "en" : "es";
  const row = await createAutosClassifiedsListing({
    ownerUserId: userId,
    lane: body.lane,
    lang,
    listing: body.listing,
  });
  if (!row) {
    return NextResponse.json({ ok: false, error: "create_failed" }, { status: 500 });
  }
  return NextResponse.json({ ok: true, id: row.id, status: row.status });
}
