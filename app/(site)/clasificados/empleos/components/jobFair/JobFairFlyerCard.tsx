import Image from "next/image";

type Props = {
  imageSrc: string;
  imageAlt: string;
};

export function JobFairFlyerCard({ imageSrc, imageAlt }: Props) {
  return (
    <div className="rounded-lg border border-black/[0.06] bg-white p-4 shadow-[0_4px_28px_rgba(30,24,16,0.07)] sm:p-8 lg:p-10">
      <div className="mx-auto max-w-2xl">
        <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg bg-neutral-200 shadow-inner sm:aspect-[4/5]">
          <Image
            src={imageSrc}
            alt={imageAlt}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 672px"
            priority
          />
        </div>
      </div>
    </div>
  );
}
