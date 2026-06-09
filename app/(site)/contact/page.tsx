import { redirect } from "next/navigation";
import { parseInquiryType } from "@/app/lib/leonix/inquiryTypes";

type SearchParams = Record<string, string | string[] | undefined>;

function firstParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function buildContactoRedirect(searchParams: SearchParams): string {
  const params = new URLSearchParams();

  for (const [key, raw] of Object.entries(searchParams)) {
    const v = firstParam(raw);
    if (v) params.set(key, v);
  }

  const interest = params.get("interest");
  if (interest === "launch") {
    params.delete("interest");
    if (!params.get("source")) params.set("source", "contact-redirect");
    const q = params.toString();
    return `/newsletter${q ? `?${q}` : ""}`;
  }

  if (interest && !params.get("inquiryType")) {
    params.set("inquiryType", parseInquiryType(interest, "general"));
    params.delete("interest");
  }

  if (!params.get("lang")) params.set("lang", "es");

  const q = params.toString();
  return `/contacto${q ? `?${q}` : ""}`;
}

export default async function ContactPage(props: { searchParams?: Promise<SearchParams> }) {
  const sp = (await props.searchParams) ?? {};
  redirect(buildContactoRedirect(sp));
}
