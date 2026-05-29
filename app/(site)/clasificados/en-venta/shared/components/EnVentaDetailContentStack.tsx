"use client";

import type { ReactNode } from "react";
import {
  EN_VENTA_CONTENT_STACK_COPY,
  type EnVentaContentStackModel,
} from "../types/enVentaContentStack.types";
import { EN_VENTA_TYPO } from "../styles/enVentaTypography";
import { EN_VENTA_SURFACE } from "../styles/enVentaBrand";

type Lang = "es" | "en";

const CARD = EN_VENTA_SURFACE.contentCard;
const TITLE = EN_VENTA_TYPO.sectionTitle;
const BODY = EN_VENTA_TYPO.body;

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
          className={`min-w-0 ${EN_VENTA_SURFACE.contentCardInner}`}
        >
          <dt className={EN_VENTA_TYPO.factLabel}>{fact.label}</dt>
          <dd className={`mt-1 break-words ${EN_VENTA_TYPO.factValue}`}>{fact.value}</dd>
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
          className={EN_VENTA_SURFACE.contentCardInner}
        >
          <p className={EN_VENTA_TYPO.deliveryTitle}>{item.label}</p>
          {item.note ? (
            <p className={`mt-1.5 ${EN_VENTA_TYPO.deliveryNote}`}>{item.note}</p>
          ) : (
            <p className={`mt-1 ${EN_VENTA_TYPO.deliveryPlaceholder}`}>
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
