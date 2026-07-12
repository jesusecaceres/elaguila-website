import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";
import { revenueCategoryCheckoutErrorMessage } from "@/app/lib/listingPlans/revenueCategoryCheckoutClient";
import { REVENUE_OS_AUTOS_DEALER_INVENTORY_PACK_SUPPORTED } from "@/app/lib/listingPlans/publishCheckoutCheckpoint";
import { writeAutosInventoryBoostReturnContext, type AutosInventoryBoostReturnContext } from "./autosInventoryBoostPipeline";

type Lang = "es" | "en";

export type AutosDealerInventoryBoostCheckoutResult =
  | { ok: true; checkoutUrl: string }
  | { ok: false; userMessage: string };

export async function startAutosDealerInventoryPackApplicationCheckout(input: {
  listingId: string;
  leonixAdId?: string | null;
  lang: Lang;
  returnPath?: string | null;
  boostReturnContext?: Omit<AutosInventoryBoostReturnContext, "savedAt" | "status">;
}): Promise<AutosDealerInventoryBoostCheckoutResult> {
  if (!REVENUE_OS_AUTOS_DEALER_INVENTORY_PACK_SUPPORTED) {
    return {
      ok: false,
      userMessage:
        input.lang === "es"
          ? "El checkout de inventario aún no está disponible."
          : "Inventory checkout is not available yet.",
    };
  }

  const listingId = input.listingId.trim();
  if (!listingId) {
    return {
      ok: false,
      userMessage:
        input.lang === "es"
          ? "No pudimos preparar tu solicitud para Inventory Boost. Guarda tu borrador e inténtalo de nuevo."
          : "We could not prepare your application for Inventory Boost. Save your draft and try again.",
    };
  }

  if (input.boostReturnContext) {
    writeAutosInventoryBoostReturnContext({
      ...input.boostReturnContext,
      savedAt: new Date().toISOString(),
      status: "prepared",
      parentListingId: listingId,
    });
  }

  const sb = createSupabaseBrowserClient();
  const { data: auth } = await sb.auth.getSession();
  const token = auth.session?.access_token;
  if (!token?.trim()) {
    return {
      ok: false,
      userMessage:
        input.lang === "es"
          ? "Inicia sesión para activar Inventory Boost."
          : "Sign in to activate Inventory Boost.",
    };
  }

  try {
    const res = await fetch("/api/clasificados/autos/inventory-pack/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        listingId,
        leonixAdId: input.leonixAdId?.trim() || null,
        lang: input.lang,
        returnPath: input.returnPath?.trim() || null,
      }),
    });
    const j = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      checkoutUrl?: string;
      message?: string;
      code?: string;
    };
    if (!res.ok || !j.ok || !j.checkoutUrl?.trim()) {
      return {
        ok: false,
        userMessage:
          j.message?.trim() ||
          revenueCategoryCheckoutErrorMessage(input.lang),
      };
    }
    return { ok: true, checkoutUrl: j.checkoutUrl.trim() };
  } catch {
    return {
      ok: false,
      userMessage: revenueCategoryCheckoutErrorMessage(input.lang),
    };
  }
}

export async function redirectAutosDealerInventoryPackApplicationCheckout(
  input: Parameters<typeof startAutosDealerInventoryPackApplicationCheckout>[0],
): Promise<AutosDealerInventoryBoostCheckoutResult> {
  const result = await startAutosDealerInventoryPackApplicationCheckout(input);
  if (result.ok && typeof window !== "undefined") {
    window.location.href = result.checkoutUrl;
  }
  return result;
}
