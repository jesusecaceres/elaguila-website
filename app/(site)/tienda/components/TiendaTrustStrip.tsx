import type { Lang } from "../types/tienda";

function CheckIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4" fill="none">
      <path
        d="M4.5 10.5 8.2 14.2 15.8 6.6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function TiendaTrustStrip(props: { lang: Lang; items: string[] }) {
  const { items } = props;
  return (
    <section className="rounded-3xl border border-[rgba(201,168,74,0.22)] bg-[linear-gradient(180deg,rgba(201,168,74,0.10),rgba(255,255,255,0.02))] p-6 sm:p-10 shadow-[0_24px_90px_rgba(0,0,0,0.35)]">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item, idx) => (
          <div
            key={idx}
            className="flex items-start gap-3 rounded-2xl border border-[rgba(255,255,255,0.10)] bg-[rgba(0,0,0,0.20)] p-5"
          >
            <span className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-xl border border-[rgba(201,168,74,0.30)] bg-[rgba(201,168,74,0.12)] text-[rgba(255,247,226,0.88)]">
              <CheckIcon />
            </span>
            <div className="text-sm leading-relaxed text-[rgba(255,255,255,0.76)]">
              {item}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

