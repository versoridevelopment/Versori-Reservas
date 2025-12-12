// src/app/(admin)/admin/personalizacion/canchas/page.tsx
import { getCurrentClub } from "@/lib/ObetenerClubUtils/getCurrentClub";
import CanchasClient from "./CanchasClient";

export default async function CanchasPage() {
  const club = await getCurrentClub();

  if (!club) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-rose-700">
        No se pudo detectar el club actual por subdominio.
        <div className="mt-2 text-gray-600">
          Verificá que estés entrando por un host tipo{" "}
          <span className="font-mono">padelcentral.localhost:3000</span>.
        </div>
      </div>
    );
  }

  return <CanchasClient clubId={club.id_club} clubNombre={club.nombre} />;
}
