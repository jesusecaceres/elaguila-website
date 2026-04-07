"use client";

import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";

export default function MagazineThumbnail() {
  const params = useSearchParams()!;
  const lang = params.get("lang") || "es";
  const router = useRouter();

  const isES = lang === "es";

  const title = isES ? "Revista Digital" : "Digital Magazine";
  const cta = isES ? "Leer ahora" : "Read Now";

  const goToMagazine = () => {
    router.push(`/magazine?lang=${lang}`);
  };

  return (
    <div
      className="cursor-pointer bg-white/70 backdrop-blur-xl p-6 rounded-2xl shadow-xl"
      onClick={goToMagazine}
    >
      <Image
        src="/magazine-thumb.png"
        width={800}
        height={600}
        alt="magazine cover"
        className="rounded-xl"
      />

      <h3 className="text-3xl font-bold mt-4 text-black">{title}</h3>
      <p className="text-lg text-gray-800">{cta}</p>
    </div>
  );
}
