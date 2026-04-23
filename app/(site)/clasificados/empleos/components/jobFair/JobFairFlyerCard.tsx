import Image from "next/image";

type Props = {
  imageSrc: string;
  imageAlt: string;
  anchorId?: string;
};

export function JobFairFlyerCard({ imageSrc, imageAlt, anchorId = "feria-flyer" }: Props) {
  return (
    <div id={anchorId} className="rounded-[18px] border border-[#E8DFD0] bg-[#FFFBF7] p-4 shadow-[0_10px_36px_rgba(42,40,38,0.07)] sm:p-8 lg:p-10">
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
