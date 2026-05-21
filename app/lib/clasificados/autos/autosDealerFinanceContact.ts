import type { AutoDealerListing } from "@/app/clasificados/autos/negocios/types/autoDealerListing";
import { safeExternalHref } from "@/app/clasificados/autos/negocios/lib/dealerDraftSanitize";
import { whatsAppHrefFromDisplay } from "@/app/clasificados/autos/negocios/lib/dealerWhatsappHref";
import { phoneDigitsForTel } from "@/app/clasificados/autos/negocios/components/autoDealerFormatters";

function nonEmpty(s: string | undefined | null): boolean {
  return typeof s === "string" && s.trim().length > 0;
}

export function hasDealerFinanceContact(data: AutoDealerListing): boolean {
  return (
    nonEmpty(data.financeContactName) ||
    nonEmpty(data.financeContactTitle) ||
    nonEmpty(data.financeContactPhone) ||
    nonEmpty(data.financeContactWhatsapp) ||
    nonEmpty(data.financeContactEmail) ||
    nonEmpty(data.financeApplicationUrl) ||
    nonEmpty(data.financeNotes)
  );
}

export function resolveFinanceApplicationHref(data: AutoDealerListing): string | undefined {
  const raw = data.financeApplicationUrl?.trim();
  if (!raw) return undefined;
  return safeExternalHref(raw.startsWith("http") ? raw : `https://${raw}`);
}

export function resolveFinancePhoneTel(data: AutoDealerListing): string | undefined {
  const digits = phoneDigitsForTel(data.financeContactPhone ?? "");
  return digits.length >= 10 ? digits : undefined;
}

export function resolveFinanceWhatsappHref(data: AutoDealerListing): string | undefined {
  return whatsAppHrefFromDisplay(data.financeContactWhatsapp ?? undefined) ?? undefined;
}

export function resolveFinanceEmailHref(data: AutoDealerListing): string | undefined {
  const raw = data.financeContactEmail?.trim();
  if (!raw || !raw.includes("@")) return undefined;
  return `mailto:${encodeURIComponent(raw)}`;
}
