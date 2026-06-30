"use client";

import Link from "next/link";
import type { AutosPublicBlueprintCopy } from "../../lib/autosPublicBlueprintCopy";

type AutosLaneCrossNavMode = "landing" | "results-neutral" | "results-private" | "results-dealer";

type Props = {
  copy: AutosPublicBlueprintCopy;
  privateResultsHref: string;
  dealerResultsHref: string;
  privatePublishHref: string;
  dealerPublishHref: string;
  mode: AutosLaneCrossNavMode;
};

type Card = {
  key: string;
  title: string;
  body: string;
  cta: string;
  href: string;
  tone: "private" | "dealer" | "sell" | "dealerPublish";
};

const toneClass: Record<Card["tone"], string> = {
  private: "border-[#C9B46A]/45 bg-[#FFFCF7] text-[#7A1E2C]",
  dealer: "border-[#7A1E2C]/18 bg-[#FFF7F2] text-[#7A1E2C]",
  sell: "border-[#C9B46A]/55 bg-[#FBF4E4] text-[#2A241C]",
  dealerPublish: "border-[#2F5E46]/25 bg-[#F4FAF3] text-[#214A35]",
};

function cardsForMode({
  copy,
  privateResultsHref,
  dealerResultsHref,
  privatePublishHref,
  dealerPublishHref,
  mode,
}: Props): Card[] {
  const c = copy.crossNav;
  const all: Card[] = [
    {
      key: "private-results",
      title: c.privateTitle,
      body: c.privateBody,
      cta: c.privateCta,
      href: privateResultsHref,
      tone: "private",
    },
    {
      key: "dealer-results",
      title: c.dealerTitle,
      body: c.dealerBody,
      cta: c.dealerCta,
      href: dealerResultsHref,
      tone: "dealer",
    },
    {
      key: "private-publish",
      title: c.sellTitle,
      body: c.sellBody,
      cta: c.sellCta,
      href: privatePublishHref,
      tone: "sell",
    },
    {
      key: "dealer-publish",
      title: c.dealerPublishTitle,
      body: c.dealerPublishBody,
      cta: c.dealerPublishCta,
      href: dealerPublishHref,
      tone: "dealerPublish",
    },
  ];

  if (mode === "landing") return all;
  if (mode === "results-private") return [all[1]!, all[2]!];
  if (mode === "results-dealer") return [all[0]!, all[3]!];
  return [all[0]!, all[1]!];
}

export function AutosLaneCrossNav(props: Props) {
  const cards = cardsForMode(props);
  const landing = props.mode === "landing";

  return (
    <section
      className={
        landing
          ? "mx-auto w-full max-w-[min(100%,90rem)] px-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] sm:px-6"
          : "w-full"
      }
      aria-label="Autos lane navigation"
    >
      <div
        className={
          landing
            ? "grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
            : "-mx-1 flex gap-3 overflow-x-auto px-1 pb-1 [scrollbar-width:thin] sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 sm:pb-0"
        }
      >
        {cards.map((card) => (
          <Link
            key={card.key}
            href={card.href}
            className={`group min-w-[min(18rem,82vw)] rounded-[20px] border p-4 shadow-[0_12px_32px_-18px_rgba(31,36,28,0.28)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_38px_-18px_rgba(31,36,28,0.34)] sm:min-w-0 ${
              toneClass[card.tone]
            }`}
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] opacity-75">
              {card.tone === "dealer" || card.tone === "dealerPublish" ? "Dealer de Autos" : "Autos Privado"}
            </p>
            <h2 className={`${landing ? "mt-2 text-lg" : "mt-1.5 text-base"} font-extrabold leading-tight tracking-tight text-[#1E1810]`}>
              {card.title}
            </h2>
            <p className={`${landing ? "mt-2" : "mt-1.5"} text-sm leading-relaxed text-[#5C5346]`}>{card.body}</p>
            <span className="mt-4 inline-flex min-h-[40px] items-center rounded-full bg-[#2A2620] px-4 text-xs font-bold text-[#FFFCF7] transition group-hover:bg-[#7A1E2C]">
              {card.cta}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
