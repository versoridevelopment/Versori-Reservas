import { getCurrentClub } from "@/lib/ObetenerClubUtils/getCurrentClub";
import TarifasClient from "./TarifasClient";

export default async function TarifasPage() {
  const club = await getCurrentClub();

  if (!club) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-rose-700">
        No se pudo detectar el club actual por subdominio.
      </div>
    );
  }

  return <TarifasClient clubId={club.id_club} clubNombre={club.nombre} />;
}
