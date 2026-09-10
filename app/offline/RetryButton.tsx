"use client";

export function RetryButton() {
  return (
    <button
      onClick={() => window.location.reload()}
      className="mt-6 rounded-lg bg-[#7A1E2C] px-6 py-3 text-sm font-semibold text-white hover:bg-[#6A1825]"
    >
      Reintentar / Retry
    </button>
  );
}
