"use client";

import type { ReactNode } from "react";
import {
  EN_VENTA_CONTENT_STACK_COPY,
  type EnVentaContentStackModel,
} from "../types/enVentaContentStack.types";

type Lang = "es" | "en";

const CARD =
  "rounded-md border border-[#E8DFD0]/90 bg-[#FFFCF7] p-4 shadow-[0_4px_18px_-10px_rgba(42,36,22,0.08)] sm:p-5";
const TITLE = "text-xs font-bold uppercase tracking-wide text-[#7A7164]";
const BODY = "whitespace-pre-wrap text-sm leading-relaxed text-[#2C2416]/90 [overflow-wrap:anywhere]";

function SectionCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className={CARD}>
      <h2 className={TITLE}>{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function ItemFactsGrid({ facts }: { facts: EnVentaContentStackModel["itemFacts"] }) {
  return (
    <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {facts.map((fact) => (
        <div
          key={fact.label}
          className="min-w-0 rounded-md border border-[#E8DFD0]/70 bg-white/70 px-3 py-2.5"
        >
          <dt className="text-[10px] font-bold uppercase tracking-wide text-[#7A7164]">{fact.label}</dt>
          <dd className="mt-1 break-words text-sm font-semibold leading-snug text-[#1E1810]">{fact.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function TextBlock({ text }: { text: string }) {
  return <p className={BODY}>{text}</p>;
}

function DeliveryList({ items, lang }: { items: EnVentaContentStackModel["deliveryItems"]; lang: Lang }) {
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li
          key={item.label}
          className="rounded-md border border-[#E8DFD0]/70 bg-white/70 px-3 py-2.5"
        >
          <p className="text-sm font-semibold text-[#1E1810]">{item.label}</p>
          {item.note ? (
            <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-[#5C5346]/95 [overflow-wrap:anywhere]">
              {item.note}
            </p>
          ) : (
            <p className="mt-1 text-xs text-[#7A7164]/90">
              {lang === "es" ? "Disponible — coordina con el vendedor." : "Available — coordinate with the seller."}
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}

type Props = {
  lang: Lang;
  model: EnVentaContentStackModel;
  descriptionAnchorId?: string;
};

export function EnVentaDetailContentStack({ lang, model, descriptionAnchorId }: Props) {
  const t = EN_VENTA_CONTENT_STACK_COPY[lang];

  const description = typeof model.description === "string" ? model.description : "";
  const itemFacts = Array.isArray(model.itemFacts) ? model.itemFacts : [];
  const deliveryItems = Array.isArray(model.deliveryItems) ? model.deliveryItems : [];

  const hasDescription = Boolean(description.trim());
  const hasFacts = itemFacts.length > 0;
  const hasCondition = Boolean(model.conditionAndUse?.trim());
  const hasAccessories = Boolean(model.accessories?.trim());
  const hasTechnical = Boolean(model.technicalDetails?.trim());
  const hasDelivery = deliveryItems.length > 0;

  if (!hasDescription && !hasFacts && !hasCondition && !hasAccessories && !hasTechnical && !hasDelivery) {
    return null;
  }

  const sideBySide =
    hasCondition && hasAccessories ? (
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SectionCard title={t.conditionUse}>
          <TextBlock text={model.conditionAndUse!} />
        </SectionCard>
        <SectionCard title={t.accessories}>
          <TextBlock text={model.accessories!} />
        </SectionCard>
      </div>
    ) : null;

  return (
    <div className="flex flex-col gap-4">
      {hasDescription ? (
        <section id={descriptionAnchorId} className={CARD}>
          <h2 className={TITLE}>{t.description}</h2>
          <p className={`mt-3 ${BODY}`}>{description}</p>
        </section>
      ) : null}

      {hasFacts ? (
        <section className={CARD}>
          <h2 className={TITLE}>{t.itemDetails}</h2>
          <div className="mt-3">
            <ItemFactsGrid facts={itemFacts} />
          </div>
        </section>
      ) : null}

      {sideBySide ? (
        sideBySide
      ) : (
        <>
          {hasCondition ? (
            <SectionCard title={t.conditionUse}>
              <TextBlock text={model.conditionAndUse!} />
            </SectionCard>
          ) : null}
          {hasAccessories ? (
            <SectionCard title={t.accessories}>
              <TextBlock text={model.accessories!} />
            </SectionCard>
          ) : null}
        </>
      )}

      {hasTechnical ? (
        <SectionCard title={t.technical}>
          <TextBlock text={model.technicalDetails!} />
        </SectionCard>
      ) : null}

      {hasDelivery ? (
        <SectionCard title={t.delivery}>
          <DeliveryList items={deliveryItems} lang={lang} />
        </SectionCard>
      ) : null}
    </div>
  );
}
