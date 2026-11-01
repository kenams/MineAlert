import { MapPageClient } from "@/components/dashboard/MapPageClient";
import { getMines } from "@/lib/server/data";

/**
 * Vue cartographique mondiale des mines, branchée sur Supabase.
 */
export default async function MapPage(): Promise<JSX.Element> {
  const mines = await getMines();

  return <MapPageClient mines={mines} />;
}
