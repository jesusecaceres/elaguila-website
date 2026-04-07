"use client";

type Lang = "es" | "en";

export function EnVentaSellerCard({
  lang,
  sellerKind,
  businessName,
}: {
  lang: Lang;
  sellerKind: "personal" | "business";
  businessName?: string | null;
}) {
  const isBiz = sellerKind === "business";
  return (
    <div className="rounded-2xl border border-black/10 bg-[#F5F5F5] p-4">
      <div className="text-xs font-semibold uppercase tracking-wide text-[#111111]/50">
        {lang === "es" ? "Vendedor" : "Seller"}
      </div>
      <div className="mt-1 text-lg font-semibold text-[#111111]">
        {isBiz ? businessName || (lang === "es" ? "Negocio" : "Business") : lang === "es" ? "Particular" : "Private seller"}
      </div>
      <p className="mt-2 text-sm text-[#111111]/65">
        {lang === "es"
          ? "Leonix no procesa pagos entre particulares. Revisa el artículo en persona cuando sea posible."
          : "Leonix does not process peer-to-peer payments. Inspect items in person when possible."}
      </p>
    </div>
  );
}
