
import MagazineReader from "@/app/components/MagazineReader";
import { getMagazinePages } from "@/app/lib/getMagazinePages";

export default function January() {
  const pages = getMagazinePages("2026", "january");
  return <MagazineReader pages={pages} lang="en" />;
}
