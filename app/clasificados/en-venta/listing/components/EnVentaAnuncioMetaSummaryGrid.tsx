"use client";

export function EnVentaAnuncioMetaSummaryGrid(props: {
  metaCategoryTitle: string;
  metaConditionTitle: string;
  metaCityTitle: string;
  metaPostedTitle: string;
  categoryLabel: string;
  conditionDisplay: string;
  city: string;
  postedAgoDisplay: string;
}) {
  const {
    metaCategoryTitle,
    metaConditionTitle,
    metaCityTitle,
    metaPostedTitle,
    categoryLabel,
    conditionDisplay,
    city,
    postedAgoDisplay,
  } = props;

  const card =
    "rounded-2xl border border-[#C9B46A]/55 bg-[#F5F5F5] backdrop-blur ring-1 ring-[#C9B46A]/25 shadow-[0_16px_40px_-28px_rgba(0,0,0,0.85)] p-5";

  return (
    <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className={card}>
        <div className="text-xs text-[#111111]">{metaCategoryTitle}</div>
        <div className="mt-1 text-[#111111] font-semibold">{categoryLabel}</div>
      </div>

      <div className={card}>
        <div className="text-xs text-[#111111]">{metaConditionTitle}</div>
        <div className="mt-1 text-[#111111] font-semibold">{conditionDisplay}</div>
      </div>

      <div className={card}>
        <div className="text-xs text-[#111111]">{metaCityTitle}</div>
        <div className="mt-1 text-[#111111] font-semibold">{city}</div>
      </div>

      <div className={card}>
        <div className="text-xs text-[#111111]">{metaPostedTitle}</div>
        <div className="mt-1 text-[#111111] font-semibold">{postedAgoDisplay}</div>
      </div>
    </div>
  );
}
