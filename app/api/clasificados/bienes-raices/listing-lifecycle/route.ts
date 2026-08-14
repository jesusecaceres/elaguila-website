/**
 * Gate G.2.3.1 — server-authorized Bienes Raíces Negocio owner lifecycle mutation endpoint.
 * All validation lives in `brListingLifecycleService.ts`; this route only extracts the
 * authenticated user + request body and maps the service's typed result to an HTTP response.
 * Never returns a raw database error message to the client.
 */
import { NextResponse, type NextRequest } from "next/server";
import { getBearerUserId } from "@/app/api/clasificados/_lib/bearerUser";
import {
  applyBrLifecycleMutation,
  BR_LIFECYCLE_AUTH_REQUIRED_ERROR,
  BR_LIFECYCLE_MUTATION_KEYS,
  type BrLifecycleErrorCode,
  type BrLifecycleMutationKey,
} from "@/app/lib/clasificados/bienes-raices/brListingLifecycleService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Body = {
  listingId?: string | null;
  mutation?: string | null;
};

function isBrLifecycleMutationKey(value: unknown): value is BrLifecycleMutationKey {
  return typeof value === "string" && (BR_LIFECYCLE_MUTATION_KEYS as readonly string[]).includes(value);
}

function statusForError(error: BrLifecycleErrorCode): number {
  switch (error) {
    case "br_lifecycle_auth_required":
      return 401;
    case "br_lifecycle_listing_not_found":
      return 404;
    case "br_lifecycle_owner_mismatch":
      return 403;
    case "br_lifecycle_listing_not_eligible":
    case "br_lifecycle_parent_invalid":
    case "br_lifecycle_parent_inactive":
      return 422;
    case "br_lifecycle_transition_not_allowed":
    case "br_active_property_limit_reached":
      return 409;
    case "supabase_not_configured":
      return 503;
    default:
      return 400;
  }
}

export async function POST(request: NextRequest) {
  const bearerUserId = await getBearerUserId(request);
  if (!bearerUserId) {
    return NextResponse.json(
      { ok: false, code: BR_LIFECYCLE_AUTH_REQUIRED_ERROR, message: "Authentication required." },
      { status: 401 },
    );
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, code: "invalid_json", message: "Invalid JSON body." }, { status: 400 });
  }

  const listingId = typeof body.listingId === "string" ? body.listingId.trim() : "";
  if (!listingId || !isBrLifecycleMutationKey(body.mutation)) {
    return NextResponse.json(
      { ok: false, code: "invalid_request", message: "listingId and a supported mutation are required." },
      { status: 400 },
    );
  }

  const result = await applyBrLifecycleMutation({ listingId, bearerUserId, mutation: body.mutation });
  if (!result.ok) {
    return NextResponse.json({ ok: false, code: result.error }, { status: statusForError(result.error) });
  }
  return NextResponse.json({ ok: true, id: result.id, status: result.status, isPublished: result.isPublished });
}
