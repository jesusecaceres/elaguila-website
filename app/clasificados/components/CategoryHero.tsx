
'use client';

import Image from 'next/image';

export default function CategoryHero({ title }: { title: string }) {
  return (
    <section className="relative flex items-center justify-center h-[40vh]">
      <div className="absolute inset-0 bg-gradient-to-b from-black via-black to-[#1f1400]" />
      <div className="relative z-10 text-center">
        <Image src="/logo.png" alt="El Águila" width={140} height={140} />
        <h1 className="mt-6 text-4xl md:text-5xl font-bold text-yellow-400">
          {title}
        </h1>
      </div>
    </section>
  );
}
