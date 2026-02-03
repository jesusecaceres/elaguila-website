
'use client';

import Image from 'next/image';
import { useSearchParams } from 'next/navigation';

export default function PlaceholderCard() {
  const params = useSearchParams()!;
  const lang = params.get('lang') === 'en' ? 'en' : 'es';

  const label = lang === 'en' ? 'Advertise Here' : 'Anúnciate Aquí';

  return (
    <div className="relative rounded-xl overflow-hidden border border-yellow-400/30 bg-black hover:scale-[1.01] transition">
      <Image
        src="/classifieds/placeholders/classifieds-placeholder-bilingual.png"
        alt={label}
        width={600}
        height={600}
        className="object-cover w-full h-full"
      />
      <div className="absolute inset-0 flex items-center justify-center bg-black/40">
        <span className="text-xl font-bold text-yellow-300">
          {label}
        </span>
      </div>
    </div>
  );
}
