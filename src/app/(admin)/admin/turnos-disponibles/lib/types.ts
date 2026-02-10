export type Cancha = { id_cancha: number; nombre: string };

export type ClubTheme = {
  logoUrl: string | null;
  primary: string | null;
  secondary: string | null;
};

export type ApiOk = {
  ok: true;
  fecha: string;
  dayTitle: string;
  duracion_min: number;
  minStart: number;
  maxEnd: number;
  slots: Record<number, string[]>;
};

export type ApiErr = { ok?: false; error: string };
export type ApiResp = ApiOk | ApiErr;
