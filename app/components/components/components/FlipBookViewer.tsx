"use client";

type FlipBookViewerProps = {
  pages: string[];
};

export default function FlipBookViewer({ pages }: FlipBookViewerProps) {
  return (
    <div className="w-full max-w-3xl mx-auto py-10">
      <h2 className="text-center text-xl font-bold mb-6">
        Revista Digital - Enero 2026
      </h2>

      <div className="flex flex-col gap-6">
        {pages.map((src, index) => (
          <img
            key={index}
            src={src}
            className="w-full rounded shadow"
            alt={`Página ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
