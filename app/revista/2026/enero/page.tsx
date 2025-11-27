
import MagazineReader from "@/app/components/MagazineReader";
import { getMagazinePages } from "@/app/lib/getMagazinePages";

export default function Enero() {
  const pages = getMagazinePages("2026", "enero");
  return <MagazineReader pages={pages} lang="es" />;
}
