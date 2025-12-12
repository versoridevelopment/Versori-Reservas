// src/app/(admin)/admin/personalizacion/canchas/nueva/page.tsx
import { getCurrentClub } from "@/lib/ObetenerClubUtils/getCurrentClub";
import NuevaCanchaClient from "./NuevaCanchaClient";

export default async function NuevaCanchaPage() {
  const club = await getCurrentClub();

  if (!club) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-rose-700">
        No se pudo detectar el club actual por subdominio.
      </div>
    );
  }

  return <NuevaCanchaClient clubId={club.id_club} clubNombre={club.nombre} />;
}
