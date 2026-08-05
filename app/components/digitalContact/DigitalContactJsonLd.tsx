import { buildDigitalContactJsonLdGraph } from "@/app/lib/digitalContact/digitalContactSeo";
import type { DigitalContactProfile } from "@/app/lib/digitalContact/digitalContactTypes";

/** Person + Organization JSON-LD for a Digital Contact profile (server-rendered for crawlers). */
export function DigitalContactJsonLd({ profile }: { profile: DigitalContactProfile }) {
  const graph = buildDigitalContactJsonLdGraph(profile);
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }} />;
}
