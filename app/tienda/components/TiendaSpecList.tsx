import type { Lang, TiendaBilingual } from "../types/tienda";

export function TiendaSpecList(props: {
  lang: Lang;
  title: string;
  items: TiendaBilingual[];
}) {
  const { lang, title, items } = props;
  if (!items.length) return null;
  return (
    <div>
      <h3 className="text-sm font-semibold tracking-tight text-white">{title}</h3>
      <ul className="mt-3 space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-[rgba(255,255,255,0.74)]">
            <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[rgba(201,168,74,0.75)]" />
            <span>{lang === "en" ? item.en : item.es}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
