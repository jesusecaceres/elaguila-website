"use client";

import { useState } from "react";
import { buildSendEmailIntent, CtaActionSheet } from "@/app/components/cta";
import type { CtaSheetIntent } from "@/app/components/cta/types";
import type { ComidaLocalPreviewContactAction } from "@/app/lib/clasificados/comida-local/comidaLocalPreviewTypes";
import {
  comidaLocalAnalyticsSourceForContactAction,
  comidaLocalContactActionToEventType,
  trackComidaLocalListingEvent,
  type ComidaLocalAnalyticsContext,
} from "@/app/lib/clasificados/comida-local/comidaLocalAnalytics";
import { comidaLocalContactButtonClass } from "./comidaLocalContactStyles";

type Props = {
  actions: ComidaLocalPreviewContactAction[];
  /** When absent (preview), no analytics are recorded. */
  analyticsContext?: ComidaLocalAnalyticsContext | null;
  businessName?: string;
};

export function ComidaLocalContactActions({ actions, analyticsContext, businessName }: Props) {
  const [emailIntent, setEmailIntent] = useState<CtaSheetIntent | null>(null);
  if (actions.length === 0) return null;

  const ctx = analyticsContext?.listingId?.trim() ? analyticsContext : null;

  const fireAnalytics = (action: ComidaLocalPreviewContactAction) => {
    if (!ctx) return;
    const eventType = comidaLocalContactActionToEventType(action.id);
    if (!eventType) return;
    trackComidaLocalListingEvent({
      listingId: ctx.listingId,
      leonixAdId: ctx.leonixAdId,
      eventType,
      source: comidaLocalAnalyticsSourceForContactAction(action.id),
      metadata: {
        contact_action_id: action.id,
        ...(ctx.slug ? { slug: ctx.slug } : {}),
      },
    });
  };

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {actions.map((action) => {
          if (action.id === "email") {
            return (
              <button
                key={action.id}
                type="button"
                className={comidaLocalContactButtonClass(action.variant, action.platform)}
                onClick={() => {
                  fireAnalytics(action);
                  const email = action.href.replace(/^mailto:/i, "");
                  setEmailIntent(
                    buildSendEmailIntent({
                      email,
                      subject: businessName ? `Leonix · ${businessName}` : "Leonix",
                      body: "",
                    }),
                  );
                }}
              >
                {action.label}
              </button>
            );
          }
          return (
            <a
              key={action.id}
              href={action.href}
              target={action.id === "call" || action.id === "sms" ? undefined : "_blank"}
              rel={action.id === "call" || action.id === "sms" ? undefined : "noopener noreferrer"}
              className={comidaLocalContactButtonClass(action.variant, action.platform)}
              onClick={() => fireAnalytics(action)}
            >
              {action.label}
            </a>
          );
        })}
      </div>
      <CtaActionSheet open={emailIntent != null} onClose={() => setEmailIntent(null)} intent={emailIntent} lang="es" />
    </>
  );
}
