"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { DiscoveryPanel } from "./R3Widgets";

type Lang = "es" | "en";

type DiscoveryState = {
  q: string;
  city: string;
  radiusMi: 10 | 25 | 40 | 50;
  cuisine: string;
  price: "" | "$" | "$$" | "$$$";
  savedOnly: boolean;
  openNow: boolean;
  family: boolean;
  diet: "" | "vegan" | "halal" | "glutenfree";
};

function buildUrl(lang: Lang, next: DiscoveryState) {
  const params = new URLSearchParams();
  params.set("lang", lang);

  if (next.q) params.set("q", next.q);
  if (next.city) params.set("city", next.city);
  if (next.radiusMi) params.set("r", String(next.radiusMi));
  if (next.cuisine) params.set("cuisine", next.cuisine);
  if (next.price) params.set("price", next.price);

  if (next.savedOnly) params.set("saved", "1");
  if (next.openNow) params.set("open", "1");
  if (next.family) params.set("family", "1");
  if (next.diet) params.set("diet", next.diet);

  const qs = params.toString();
  return `/clasificados/restaurantes?${qs}`;
}

export default function DiscoveryClient({ lang, initial }: { lang: Lang; initial: DiscoveryState }) {
  const router = useRouter();

  const onApply = useCallback(
    (next: DiscoveryState) => {
      router.push(buildUrl(lang, next));
    },
    [lang, router]
  );

  return <DiscoveryPanel lang={lang} initial={initial} onApply={onApply} />;
}
