import { notFound } from "next/navigation";
import TurnosDisponiblesClient from "./TurnosDisponiblesClient";
import { getCurrentClub } from "@/lib/ObetenerClubUtils/getCurrentClub";
import { getClubFlyerData } from "./lib/clubFlyerData";

export const runtime = "nodejs";

export default async function Page() {
  const club = await getCurrentClub();
  if (!club) return notFound();

  try {
    const { clubNombre, clubTheme, phone, canchas } = await getClubFlyerData(
      club.id_club,
    );

    return (
      <TurnosDisponiblesClient
        idClub={club.id_club}
        clubNombre={clubNombre}
        clubTheme={clubTheme}
        phone={phone}
        canchas={canchas}
      />
    );
  } catch (e: any) {
    console.error("[turnos-disponibles/page] error:", e?.message || e);
    return notFound();
  }
}
