"use client";

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
};

export function ComidaLocalContactActions({ actions, analyticsContext }: Props) {
  if (actions.length === 0) return null;

  const ctx = analyticsContext?.listingId?.trim() ? analyticsContext : null;

  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((action) => (
        <a
          key={action.id}
          href={action.href}
          target={action.id === "call" || action.id === "sms" ? undefined : "_blank"}
          rel={action.id === "call" || action.id === "sms" ? undefined : "noopener noreferrer"}
          className={comidaLocalContactButtonClass(action.variant, action.platform)}
          onClick={() => {
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
          }}
        >
          {action.label}
        </a>
      ))}
    </div>
  );
}
