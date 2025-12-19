// src/app/(admin)/admin/personalizacion/club/page.tsx
import { getCurrentClub } from "@/lib/ObetenerClubUtils/getCurrentClub";
import ClubForm from "./ClubForm";

export default async function Page() {
  const club = await getCurrentClub();

  if (!club) {
    return (
      <div className="p-8 text-center text-red-600 font-semibold bg-red-50 rounded-lg m-4">
        Error de configuración: No se ha detectado el club asociado a este
        dominio.
      </div>
    );
  }

  return <ClubForm initialData={club} />;
}
