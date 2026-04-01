import type { BusinessCardLeoIntake } from "./businessCardLeoTypes";
import type { BusinessCardDocument, TextFieldRole } from "./types";
import type { BusinessCardTemplateId } from "./businessCardTemplateCatalog";
import { leoShouldBoostTypography } from "./businessCardLeoScoring";
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
    if (templateId === "leonix-orbit-halo") {
      front = {
        ...front,
        textBlocks: front.textBlocks.map((b) =>
          b.role !== "custom" ? { ...b, yPct: Math.max(10, b.yPct - 10) } : b
        ),
        logoGeom: { ...front.logoGeom, widthPct: 0.1, yPct: 50 },
      };
    }
    if (templateId === "carbon-soft-elevated") {
      front = {
        ...front,
        textBlocks: front.textBlocks.map((b) =>
          b.role !== "custom" ? { ...b, yPct: Math.max(10, b.yPct - 4) } : b
        ),
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
    const shiftUp = (y: number) => Math.max(10, y - 3);
    if (templateId === "clean-white-premium" || templateId === "monochrome-power") {
      front = {
        ...front,
        textBlocks: front.textBlocks.map((b) =>
          b.role !== "custom" ? { ...b, yPct: shiftUp(b.yPct) } : b
        ),
      };
    }
    if (templateId === "dental-clinical-clean" || templateId === "luxe-editorial") {
      front = {
        ...front,
        textBlocks: front.textBlocks.map((b) =>
          b.role !== "custom" ? { ...b, yPct: Math.max(10, b.yPct - 4) } : b
        ),
      };
    }
  } else if (intake.emphasis === "logo") {
    const extraWide =
      templateId === "leonix-orbit-halo" || templateId === "leonix-ledger-stripe" || templateId === "azure-confidence-strip"
        ? 6
        : 4;
    front = {
      ...front,
      logo: { ...front.logo, visible: true, scale: "lg" },
      logoGeom: {
        ...front.logoGeom,
        widthPct: Math.min(36, front.logoGeom.widthPct + extraWide),
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

function boostFont(fs: number): number {
  return Math.min(16, fs + 1);
}

/**
 * Slightly larger type on key lines when intake is sparse — fills the card more confidently.
 */
export function leoBoostSparseTypography(doc: BusinessCardDocument, intake: BusinessCardLeoIntake): BusinessCardDocument {
  if (!leoShouldBoostTypography(intake)) return doc;

  const bilingualBoost = doc.selectedTemplateId?.startsWith("bilingual-") ?? false;

  const boostSide = (side: BusinessCardDocument["front"]) => ({
    ...side,
    textBlocks: side.textBlocks.map((b) => {
      if (b.role === "custom") return b;
      const primaryLine =
        b.role === "company" ||
        b.role === "personName" ||
        b.role === "phone" ||
        b.role === "email" ||
        b.role === "title";
      const bilingualTag = bilingualBoost && b.role === "tagline";
      if (primaryLine || bilingualTag) {
        return { ...b, fontSize: boostFont(b.fontSize) };
      }
      return b;
    }),
  });

  return {
    ...doc,
    front: syncSideBlocksFromFields(boostSide(doc.front)),
    back: syncSideBlocksFromFields(boostSide(doc.back)),
  };
}
