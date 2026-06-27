import type { ComponentType } from "react";
import {
  TbBolt,
  TbBook,
  TbBuildingStore,
  TbCalculator,
  TbCar,
  TbHeartbeat,
  TbPlant2,
  TbScale,
  TbScissors,
  TbSpray,
  TbTool,
} from "react-icons/tb";

/**
 * Professional line glyphs for Servicios landing category tiles.
 * Replaces cartoon emoji with a restrained Leonix-styled icon set.
 * Keyed by `ServiciosLandingExploreCategory.id`.
 */
const CATEGORY_GLYPHS: Record<string, ComponentType<{ className?: string; "aria-hidden"?: boolean }>> = {
  abogado: TbScale,
  contador: TbCalculator,
  dentista: TbHeartbeat,
  plomeria: TbTool,
  electricista: TbBolt,
  limpieza: TbSpray,
  "reparacion-auto": TbCar,
  "belleza-barberia": TbScissors,
  tutoria: TbBook,
  jardineria: TbPlant2,
};

export function ServiceCategoryGlyph({ id, className }: { id: string; className?: string }) {
  const Glyph = CATEGORY_GLYPHS[id] ?? TbBuildingStore;
  return <Glyph className={className} aria-hidden />;
}
