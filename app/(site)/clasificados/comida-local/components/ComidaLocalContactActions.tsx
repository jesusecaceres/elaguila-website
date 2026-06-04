"use client";

import type { ComidaLocalPreviewContactAction } from "@/app/lib/clasificados/comida-local/comidaLocalPreviewTypes";
import { comidaLocalContactButtonClass } from "./comidaLocalContactStyles";

type Props = {
  actions: ComidaLocalPreviewContactAction[];
};

export function ComidaLocalContactActions({ actions }: Props) {
  if (actions.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((action) => (
        <a
          key={action.id}
          href={action.href}
          target={action.id === "call" || action.id === "sms" ? undefined : "_blank"}
          rel={action.id === "call" || action.id === "sms" ? undefined : "noopener noreferrer"}
          className={comidaLocalContactButtonClass(action.variant, action.platform)}
        >
          {action.label}
        </a>
      ))}
    </div>
  );
}
