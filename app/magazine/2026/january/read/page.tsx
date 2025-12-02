const PAGES = [1, 2, 3];

export default function January2026Reader() {
  return (
    <main className="min-h-screen w-full bg-black text-white pt-28 pb-16 px-4 md:px-10">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-extrabold text-yellow-300 mb-6 drop-shadow">
          January 2026 — Digital Reader
        </h1>
        <p className="text-gray-300 mb-4">
          Replace the placeholder images in{" "}
          <code className="text-xs">public/magazine-pages/2026/january/</code>{" "}
          with exported JPG pages from your real magazine (page-01.jpg, page-02.jpg, etc.).
        </p>

        <div className="space-y-8">
          {PAGES.map((page) => (
            <div
              key={page}
              className="bg-neutral-900/80 border border-neutral-700/80 rounded-2xl shadow-2xl overflow-hidden"
            >
              <img
                src={`/magazine-pages/2026/january/page-${String(page).padStart(2, "0")}.jpg`}
                alt={`January 2026 - Page ${page}`}
                className="w-full h-auto object-contain"
              />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}