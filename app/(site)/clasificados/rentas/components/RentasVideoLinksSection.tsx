import { FiExternalLink, FiPlayCircle } from "react-icons/fi";

type Props = {
  urls: readonly string[] | null | undefined;
  lang: "es" | "en";
};

function cleanVideoUrls(urls: readonly string[] | null | undefined): string[] {
  const out: string[] = [];
  for (const raw of urls ?? []) {
    const url = String(raw ?? "").trim();
    if (!url || out.includes(url) || !/^https?:\/\//i.test(url)) continue;
    out.push(url);
    if (out.length >= 4) break;
  }
  return out;
}

function hostLabel(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./i, "").toLowerCase();
    if (host.includes("youtube") || host === "youtu.be") return "YouTube";
    if (host.includes("tiktok")) return "TikTok";
    if (host.includes("instagram")) return "Instagram";
    if (host.includes("facebook") || host === "fb.watch") return "Facebook";
    if (host.includes("vimeo")) return "Vimeo";
    return host || "Video";
  } catch {
    return "Video";
  }
}

export function RentasVideoLinksSection({ urls, lang }: Props) {
  const clean = cleanVideoUrls(urls);
  if (!clean.length) return null;

  return (
    <section className="mx-auto mt-8 w-full max-w-[1240px] px-4 sm:px-6 lg:px-8" data-rentas-video-links="1">
      <div className="rounded-[1.35rem] border border-[#D6C7AD]/70 bg-[#FFFCF7] p-4 shadow-[0_14px_38px_rgba(62,48,31,0.10)] sm:p-6">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#B8954A]">
              {lang === "es" ? "Videos del anuncio" : "Listing Videos"}
            </p>
            <h2 className="mt-1 font-serif text-xl font-semibold leading-tight text-[#1E1810]">
              {lang === "es" ? "Recorridos y videos" : "Tours and Videos"}
            </h2>
          </div>
          <p className="max-w-md text-sm leading-relaxed text-[#5C5346]/90">
            {lang === "es"
              ? "Los videos se abren en una pestaña nueva. Leonix muestra enlaces verificados, sin miniaturas inventadas."
              : "Videos open in a new tab. Leonix shows verified links without fake thumbnails."}
          </p>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {clean.map((url, index) => {
            const label = index === 0 ? (lang === "es" ? "Ver video" : "View video") : lang === "es" ? `Ver video ${index + 1}` : `View video ${index + 1}`;
            const host = hostLabel(url);
            return (
              <a
                key={url}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex min-h-[92px] items-center gap-3 rounded-2xl border border-[#E8DFD0] bg-gradient-to-br from-[#F8FAFC] to-[#FFF7EA] p-4 text-left transition hover:border-[#C9B46A]/80 hover:shadow-md"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#1E1810] text-[#FFF7EA] shadow-sm">
                  <FiPlayCircle className="h-6 w-6" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold text-[#1E1810]">{label}</span>
                  <span className="mt-1 block truncate text-xs font-semibold uppercase tracking-wide text-[#5B7C99]">{host}</span>
                </span>
                <FiExternalLink className="h-4 w-4 shrink-0 text-[#B8954A] transition group-hover:translate-x-0.5" aria-hidden />
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
