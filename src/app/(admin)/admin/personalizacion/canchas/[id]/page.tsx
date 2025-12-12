// src/app/(admin)/admin/personalizacion/canchas/[id]/page.tsx
import { getCurrentClub } from "@/lib/ObetenerClubUtils/getCurrentClub";
import EditarCanchaClient from "./EditarCanchaClient";

export default async function EditarCanchaPage({
  params,
}: {
  params: { id: string };
}) {
  const club = await getCurrentClub();

  if (!club) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-rose-700">
        No se pudo detectar el club actual por subdominio.
      </div>
    );
  }

  return (
    <EditarCanchaClient
      clubId={club.id_club}
      clubNombre={club.nombre}
      idCancha={Number(params.id)}
    />
  );
}
