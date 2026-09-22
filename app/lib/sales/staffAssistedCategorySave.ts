/**
 * Shared staff-assisted save resolution for category publishers that already exist.
 * Not a second publisher: each route still writes through its own mapper/table.
 *
 * Fail-closed: unknown action, missing HMAC, category mismatch, mixed customer session,
 * listing-id disagreement, or unauthorized clientUserId never fall through to a customer insert.
 */
import "server-only";

import type { NextRequest } from "next/server";
import { customerUserIdFromBearer } from "@/app/lib/auth/customerBearerUserId";
import { readActiveAssistedPublishingContext, type AssistedPublishingContext } from "@/app/lib/auth/assistedPublishingSession";
import { isClientAuthorizedForBusiness } from "@/app/lib/sales/assistedClientAuthorization";
import {
  assertAssistedIdentity,
  resolveAssistedRowBinding,
  resolveAssistedSessionConflict,
} from "@/app/lib/sales/assistedSameRowBinding";
import type { QuickSalesCategory } from "@/app/lib/sales/quickSalesCategories";

export type StaffAssistedSaveResolution =
  | { assisted: false }
  | {
      assisted: true;
      ctx: AssistedPublishingContext;
      listingId: string;
      clientUserId: string | null;
      isSave: boolean;
      isPublish: boolean;
    };

export type StaffAssistedSaveRefusal = {
  ok: false;
  status: number;
  error: string;
};

export async function resolveStaffAssistedCategorySave(input: {
  request: NextRequest;
  expectedCategory: QuickSalesCategory;
  assistedActionRaw: string;
  bodyListingId?: string | null;
  bodyClientUserId?: string | null;
}): Promise<StaffAssistedSaveResolution | StaffAssistedSaveRefusal> {
  const action = (input.assistedActionRaw ?? "").trim();
  const isSave = action === "save_for_client";
  const isPublish = action === "publish_for_client";
  if (!isSave && !isPublish) return { assisted: false };

  const ctx = await readActiveAssistedPublishingContext(input.request.cookies);
  if (!ctx) return { ok: false, status: 403, error: "assisted_context_required" };

  const identity = assertAssistedIdentity({
    contextCategory: ctx.category,
    expectedCategory: input.expectedCategory,
    contextBusinessId: ctx.businessId,
  });
  if (identity) return { ok: false, status: identity.status, error: identity.error };

  const binding = resolveAssistedRowBinding({
    contextListingId: ctx.listingId,
    contextAssistedAction: ctx.assistedAction,
    requestedAction: action,
    bodyListingId: input.bodyListingId ?? null,
  });
  if (!binding.ok) return { ok: false, status: binding.status, error: binding.error };

  const sessionConflict = resolveAssistedSessionConflict({
    assistedActive: true,
    contextClientUserId: ctx.clientUserId ?? null,
    customerUserId: await customerUserIdFromBearer(input.request),
  });
  if (sessionConflict) return { ok: false, status: sessionConflict.status, error: sessionConflict.error };

  const claimedClient = typeof input.bodyClientUserId === "string" ? input.bodyClientUserId.trim() : "";
  const clientUserId = claimedClient || (typeof ctx.clientUserId === "string" ? ctx.clientUserId.trim() : "") || null;
  if (clientUserId) {
    const authorized = await isClientAuthorizedForBusiness({ businessId: ctx.businessId, clientUserId });
    if (!authorized) return { ok: false, status: 403, error: "client_not_authorized_for_business" };
  }

  return {
    assisted: true,
    ctx,
    listingId: binding.listingId,
    clientUserId,
    isSave,
    isPublish,
  };
}
