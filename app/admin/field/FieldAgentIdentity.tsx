import Image from "next/image";
import Link from "next/link";

/** Compact Field Agent identity — Business Concierge mode, not a second product. */
export function FieldAgentHomeHeader() {
  return (
    <header className="rounded-2xl border border-[#D6C7AD]/85 bg-[#FFFDF7] p-4">
      <div className="flex items-start gap-3">
        <Image src="/logo-clean.png" alt="" width={40} height={40} className="h-8 w-8 shrink-0 object-contain" />
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8A6B1F]">Business Concierge</p>
          <h1 className="mt-0.5 font-serif text-xl font-bold leading-tight text-[#1E1810]">Field Agent</h1>
          <p className="mt-1 text-xs text-[#7A7164]">Captura rápida en el campo. / Quick capture in the field.</p>
        </div>
      </div>
      <Link
        href="/admin/businesses"
        className="mt-3 inline-flex min-h-[44px] w-full items-center justify-center rounded-lg border border-[#C9A84A]/70 bg-white px-4 py-2 text-xs font-semibold text-[#7A1E2C]"
      >
        Staff Command Center
      </Link>
    </header>
  );
}

export function FieldAgentBusinessHeader({
  businessName,
  businessId,
}: {
  businessName: string;
  businessId: string;
}) {
  return (
    <header className="rounded-2xl border border-[#D6C7AD]/85 bg-[#FFFDF7] p-4">
      <Link href="/admin/field" className="text-xs font-semibold text-[#7A1E2C] underline">
        ← Field Agent
      </Link>
      <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#8A6B1F]">
        Business Concierge — Field Agent
      </p>
      <h1 className="mt-1 font-serif text-xl font-bold leading-tight text-[#1E1810]">{businessName}</h1>
      <p className="mt-1 text-xs text-[#7A7164]">Captura rápida / Quick Capture</p>
      <p className="mt-1 text-[11px] text-[#7A7164]">
        Field Agent es captura rápida. El Business Dashboard es el workspace completo.
      </p>
      <div className="mt-3 flex flex-col gap-2">
        <Link
          href={`/admin/businesses/${businessId}`}
          className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-[#7A1E2C] px-4 py-2 text-xs font-semibold text-white"
        >
          Open Business Dashboard
        </Link>
        <Link
          href="/admin/businesses"
          className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-[#C9A84A]/70 bg-white px-4 py-2 text-xs font-semibold text-[#1E1810]"
        >
          Staff Command Center
        </Link>
      </div>
    </header>
  );
}
