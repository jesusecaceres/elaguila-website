/**
 * Program 7, Gate 7G — Offline fallback page.
 * Truthful: shows "you are offline" — never fake data.
 */
import { RetryButton } from "./RetryButton";

export const metadata = {
  title: "Sin conexión / Offline",
};

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[color:var(--lx-page)] px-6 text-center">
      <div className="max-w-md">
        <h1 className="mb-4 text-2xl font-bold text-[color:var(--lx-text)]">
          Sin conexión / You are offline
        </h1>
        <p className="mb-2 text-sm text-[color:var(--lx-text-muted)]">
          No puedes acceder a las herramientas del Business Concierge sin conexión a internet.
        </p>
        <p className="text-sm text-[color:var(--lx-text-muted)]">
          You cannot access Business Concierge tools without an internet connection.
        </p>
        <RetryButton />
      </div>
    </div>
  );
}
