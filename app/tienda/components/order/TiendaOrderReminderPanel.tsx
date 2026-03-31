import type { Lang } from "../../types/tienda";
import { ohPick, orderHandoffCopy } from "../../data/orderHandoffCopy";

export function TiendaOrderReminderPanel(props: { lang: Lang }) {
  const { lang } = props;
  return (
    <section className="rounded-2xl border border-[rgba(201,168,74,0.28)] bg-[rgba(201,168,74,0.06)] p-5 sm:p-6">
      <h2 className="text-sm font-semibold text-[rgba(255,247,226,0.92)]">{ohPick(orderHandoffCopy.reminderTitle, lang)}</h2>
      <p className="mt-2 text-sm text-[rgba(255,255,255,0.72)]">{ohPick(orderHandoffCopy.reminderIntro, lang)}</p>
      <ul className="mt-4 space-y-2 text-sm text-[rgba(255,255,255,0.78)] list-disc list-inside">
        {orderHandoffCopy.reminderBullets.map((b, i) => (
          <li key={i}>{lang === "en" ? b.en : b.es}</li>
        ))}
      </ul>
    </section>
  );
}
