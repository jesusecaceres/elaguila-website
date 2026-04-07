import type { DesignerV2Transform } from "./transform";

/** Discriminator for the V2 object union */
export type DesignerV2ObjectKind = "text" | "image" | "shape" | "accent" | "decorative";

/**
 * Where this object came from during migration.
 * `native-v2` = created by a future editor; everything else is derived from V1 state.
 */
export type DesignerV2ObjectSource =
  | "v1-text-block"
  | "v1-logo"
  | "v1-legacy-text-synthetic"
  | "v1-legacy-logo-synthetic"
  | "native-v2";

export type DesignerV2BaseObject = {
  id: string;
  kind: DesignerV2ObjectKind;
  visible: boolean;
  zIndex: number;
  transform: DesignerV2Transform;
  source: DesignerV2ObjectSource;
};

export type DesignerV2TextStyle = {
  fontSize: number;
  fontWeight: 400 | 500 | 600 | 700;
  color: string;
  textAlign: "left" | "center" | "right";
  /** Resolved CSS `font-family` when a text block uses a non-default preset */
  fontFamily?: string;
};

/** Standard line / custom copy — maps from `BusinessCardTextBlock` today */
export type DesignerV2TextObject = DesignerV2BaseObject & {
  kind: "text";
  text: string;
  /** When migrated from V1, mirrors `BusinessCardTextBlock.role` */
  role?: string;
  style: DesignerV2TextStyle;
};

export type DesignerV2ImageRole = "logo" | "photo" | "decoration" | "custom";

/** Raster / vector image layer — today only the logo maps here; slots exist for more */
export type DesignerV2ImageObject = DesignerV2BaseObject & {
  kind: "image";
  imageRole: DesignerV2ImageRole;
};

export type DesignerV2ShapeKind = "rect" | "ellipse" | "line";

export type DesignerV2ShapeObject = DesignerV2BaseObject & {
  kind: "shape";
  shape: DesignerV2ShapeKind;
  fill?: string;
  stroke?: string;
  /** Stroke width as % of trim width (foundation placeholder) */
  strokeWidthPct?: number;
};

/** Non-geometric flourishes — foundation placeholder for stickers, icons, etc. */
export type DesignerV2DecorativeObject = DesignerV2BaseObject & {
  kind: "decorative";
  decorativeKey: string;
};

/** Section fills, bands, full-bleed accents — foundation placeholder */
export type DesignerV2AccentObject = DesignerV2BaseObject & {
  kind: "accent";
  accentKind: "band" | "corner" | "frame" | "custom";
};

export type DesignerV2Object =
  | DesignerV2TextObject
  | DesignerV2ImageObject
  | DesignerV2ShapeObject
  | DesignerV2DecorativeObject
  | DesignerV2AccentObject;
