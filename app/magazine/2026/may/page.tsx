export default function ComingSoonMagazine() {
  return (
    <main className="min-h-screen w-full bg-black text-white flex items-center justify-center px-6">
      <div className="max-w-xl text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold text-yellow-300 mb-4 drop-shadow">
          Digital Magazine — Coming Soon
        </h1>
        <p className="text-lg text-gray-200 mb-2">
          This edition is not live yet.
        </p>
        <p className="text-sm text-gray-400">
          Once you&apos;re ready, duplicate the January 2026 folder, update the images
          inside <code className="text-xs">public/magazine-covers</code> and{" "}
          <code className="text-xs">public/magazine-pages</code>, and customize this text.
        </p>
      </div>
    </main>
  );
}