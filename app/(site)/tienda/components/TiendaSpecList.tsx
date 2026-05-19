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
      <h3 className="text-sm font-semibold tracking-tight text-[color:var(--lx-text)]">{title}</h3>
      <ul className="mt-3 space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-[color:var(--lx-muted)]">
            <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[color:var(--lx-lion)]" />
            <span>{lang === "en" ? item.en : item.es}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
