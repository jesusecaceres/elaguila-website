'use client';

import Image from 'next/image';

export default function ClassifiedsHero() {
  return (
    <section className="relative w-full h-[60vh] flex items-center justify-center">
      <div className="absolute inset-0 -z-10">
        <Image
          src="/cinema-flags-final-v2.png"
          alt="El Águila Background"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/60" />
      </div>

      <div className="text-center">
        <Image
          src="/logo.png"
          alt="El Águila"
          width={180}
          height={180}
          className="mx-auto mb-6"
          priority
        />
        <h1 className="text-5xl md:text-6xl font-bold text-gold">
          Clasificados
        </h1>
      </div>
    </section>
  );
}