'use client';

import Image from 'next/image';

export default function ClassifiedsHero() {
  return (
    <section className="relative flex items-center justify-center h-[55vh]">
      <div className="absolute inset-0 bg-gradient-to-b from-black via-black to-[#2a1a00]" />
      <div className="relative z-10 text-center">
        <Image
          src="/logo.png"
          alt="El Águila"
          width={160}
          height={160}
          className="mx-auto mb-6"
          priority
        />
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-yellow-400">
          Clasificados
        </h1>
      </div>
    </section>
  );
}