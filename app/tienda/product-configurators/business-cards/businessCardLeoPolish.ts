import type { BusinessCardLeoIntake } from "./businessCardLeoTypes";
import type { BusinessCardDocument, TextFieldRole } from "./types";
import type { BusinessCardTemplateId } from "./businessCardTemplateCatalog";
import { syncSideBlocksFromFields } from "./templates";

const ROLES: TextFieldRole[] = ["personName", "title", "company", "phone", "email", "website", "address", "tagline"];

function pruneSideEmptyLines(side: BusinessCardDocument["front"]): typeof side {
  const lv = { ...side.textLayout.lineVisible };
  for (const role of ROLES) {
    if (!lv[role]) continue;
    const v = String(side.fields[role] ?? "").trim();
    if (!v) lv[role] = false;
  }
  const next = {
    ...side,
    textLayout: { ...side.textLayout, lineVisible: lv },
  };
  return syncSideBlocksFromFields(next);
}

/**
 * Hides lines with no user text so first drafts never show placeholder clutter.
 */
export function leoPruneEmptyVisibleLines(doc: BusinessCardDocument): BusinessCardDocument {
  return {
    ...doc,
    front: pruneSideEmptyLines(doc.front),
    back: pruneSideEmptyLines(doc.back),
  };
}

/**
 * Logo visibility and geometry tuned for LEO handoff — avoids empty logo slots on logo-heavy templates.
 */
export function leoAdjustLogoAndScale(doc: BusinessCardDocument, intake: BusinessCardLeoIntake, templateId: BusinessCardTemplateId): BusinessCardDocument {
  const hasLogo = !!intake.logoDataUrl?.trim();
  let front = doc.front;

  if (!hasLogo) {
    front = {
      ...front,
      logo: { ...front.logo, visible: false, previewUrl: null, file: null, naturalWidth: null, naturalHeight: null },
    };
    /* Pull text up slightly on logo-forward templates when there is no mark */
    if (templateId === "leonix-crest-mark" || templateId === "auto-dealer-stripe") {
      const shift = templateId === "leonix-crest-mark" ? -6 : -4;
      front = {
        ...front,
        textBlocks: front.textBlocks.map((b) =>
          b.role !== "custom" ? { ...b, yPct: Math.max(8, b.yPct + shift) } : b
        ),
        logoGeom: { ...front.logoGeom, widthPct: 0.1, yPct: 50 },
      };
    }
    if (templateId === "bold-modern-slab") {
      front = {
        ...front,
        textBlocks: front.textBlocks.map((b) =>
          b.role === "company" ? { ...b, yPct: Math.max(18, b.yPct - 4) } : b
        ),
      };
    }
  } else if (intake.emphasis === "logo") {
    front = {
      ...front,
      logo: { ...front.logo, visible: true, scale: "lg" },
      logoGeom: {
        ...front.logoGeom,
        widthPct: Math.min(34, front.logoGeom.widthPct + 4),
        yPct: Math.max(14, front.logoGeom.yPct - 2),
      },
    };
  } else {
    front = {
      ...front,
      logo: { ...front.logo, visible: true, scale: "md" },
    };
  }

  const contactHeavy = intake.emphasis === "contact";
  const nextLayout = {
    ...front.textLayout,
    groupScale: contactHeavy ? "lg" : front.textLayout.groupScale,
  };

  let back = doc.back;
  if (contactHeavy && doc.sidedness === "two-sided") {
    back = syncSideBlocksFromFields({
      ...back,
      textLayout: { ...back.textLayout, groupScale: "lg" },
    });
  }

  return {
    ...doc,
    front: syncSideBlocksFromFields({ ...front, textLayout: nextLayout }),
    back,
  };
}
