import type { ComponentType } from "react";
import {
  TbBolt,
  TbBook,
  TbBuildingStore,
  TbCar,
  TbHome,
  TbPaw,
  TbPlant2,
  TbSpray,
  TbTool,
} from "react-icons/tb";

/**
 * Professional line glyphs for Servicios landing category tiles.
 * Replaces cartoon emoji with a restrained Leonix-styled icon set.
 * Keyed by `ServiciosLandingExploreCategory.id`.
 */
const CATEGORY_GLYPHS: Record<string, ComponentType<{ className?: string; "aria-hidden"?: boolean }>> = {
  plomeria: TbTool,
  electricista: TbBolt,
  roof: TbHome,
  limpieza: TbSpray,
  "reparacion-auto": TbCar,
  tutoria: TbBook,
  jardineria: TbPlant2,
  mascotas: TbPaw,
};

export function ServiceCategoryGlyph({ id, className }: { id: string; className?: string }) {
  const Glyph = CATEGORY_GLYPHS[id] ?? TbBuildingStore;
  return <Glyph className={className} aria-hidden />;
}
