import type { ReactNode } from "react";

export function TiendaOrderShell(props: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-[#070708] text-white">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 pt-24 sm:pt-28 pb-20 space-y-10">{props.children}</div>
    </main>
  );
}
