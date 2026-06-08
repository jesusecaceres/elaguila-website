import { NextResponse } from "next/server";
import {
  decodeAutosVinWithNhtsa,
  isValidVinCandidate,
  normalizeVinInput,
} from "@/app/lib/clasificados/autos/autosNhtsaVinDecode";

export const dynamic = "force-dynamic";

type Body = {
  vin?: string;
  modelYear?: number;
};

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const vin = normalizeVinInput(body.vin);
  if (!vin) {
    return NextResponse.json({ ok: false, error: "missing_vin" }, { status: 400 });
  }
  if (!isValidVinCandidate(vin)) {
    return NextResponse.json({ ok: false, error: "invalid_vin" }, { status: 400 });
  }

  const modelYear =
    typeof body.modelYear === "number" && Number.isFinite(body.modelYear) ? Math.trunc(body.modelYear) : undefined;

  const result = await decodeAutosVinWithNhtsa({ vin, modelYear });
  if (!result.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: result.error ?? "decode_failed",
        fields: result.fields,
        filledCount: result.filledCount,
      },
      { status: result.error === "invalid_vin" ? 400 : 502 },
    );
  }

  return NextResponse.json({
    ok: true,
    fields: result.fields,
    filledCount: result.filledCount,
    partial: result.metadata?.completenessStatus !== "full",
    metadata: result.metadata,
  });
}
