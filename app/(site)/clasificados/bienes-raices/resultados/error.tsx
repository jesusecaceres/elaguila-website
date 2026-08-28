"use client";

/**
 * Route-segment error boundary. Mirrors `app/(site)/clasificados/rentas/results/error.tsx` — no
 * `error.tsx` existed anywhere in the app before this pass, so an uncaught client error here would
 * have silently unmounted the whole results view down to the ancestor Navbar with no recovery path.
 */
export default function BienesRaicesResultsError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-xl flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <p className="text-sm font-bold uppercase tracking-wide text-[#7A1E2C]">
        Algo salió mal · Something went wrong
      </p>
      <h1 className="font-serif text-xl font-bold text-[#1E1810]">
        No pudimos cargar los resultados de bienes raíces. / We couldn&rsquo;t load the real estate results.
      </h1>
      <p className="text-sm text-[#5C5346]">
        Intenta de nuevo, o vuelve a intentarlo en unos minutos. / Try again, or check back in a few minutes.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-2 rounded-full bg-[#7A1E2C] px-5 py-2 text-sm font-bold text-[#FFFDF7] transition hover:bg-[#5e1721]"
      >
        Reintentar / Try again
      </button>
    </div>
  );
}
