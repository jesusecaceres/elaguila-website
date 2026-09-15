import type { PreviewPrivadoSpecRow } from "./previewPrivadoFields";
import { previewPrivadoSpecTileClass } from "./previewPrivadoTokens";

export function PreviewPrivadoHeroSpecsStrip({ items }: { items: PreviewPrivadoSpecRow[] }) {
  if (items.length === 0) return null;

  return (
    <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {items.map((item) => (
        <li key={item.key} className={previewPrivadoSpecTileClass}>
          <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#8A6B1F]">{item.label}</p>
          <p className="mt-1 break-words text-sm font-extrabold leading-tight text-[#1F241C]">{item.value}</p>
        </li>
      ))}
    </ul>
  );
}
