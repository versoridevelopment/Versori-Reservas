import type { CanchaUI, ReservaUI } from "../../types";

export type TipoTurno =
  | "normal"
  | "profesor"
  | "torneo"
  | "escuela"
  | "cumpleanos"
  | "abonado";

export type Segmento = "publico" | "profe";

export type ReservaSidebarProps = {
  isOpen: boolean;
  onClose: () => void;

  // Esquema on-demand
  reservaId?: number | null;
  initialData?: Partial<ReservaUI>;

  isCreating: boolean;
  selectedDate: Date;

  // ✅ Prop opcional para recibir la fecha exacta (ej: "2024-01-02")
  fecha?: string;

  preSelectedCanchaId?: number | null;
  preSelectedTime?: string | null;

  idClub: number;
  canchas: CanchaUI[];
  reservas?: ReservaUI[];

  startHour?: number;
  endHour?: number;

  onCreated: () => void;
};

export type { CanchaUI, ReservaUI };

export type CobroState = {
  showCobro: boolean;
  cobroMonto: number;
  cobroMetodo: string;
  cobroNota: string;
  cobroLoading: boolean;
  cobroError: string | null;
};

export type FormDataState = {
  idClienteManual: number | null;

  nombre: string;
  telefono: string;
  email: string;

  esTurnoFijo: boolean;
  tipoTurno: TipoTurno;

  // auto
  duracion: number;
  horaInicio: string;

  // manual
  precioManual: boolean;
  horaInicioManual: string;
  horaFinManual: string;

  precio: number;
  notas: string;
  canchaId: string;

  weeksAhead: number;
  endDate: string;
};
