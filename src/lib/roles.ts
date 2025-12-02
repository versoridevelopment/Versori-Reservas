// Definimos los roles posibles
export type Rol = "Administrador" | "Cajero";

export const ROLE_PERMISSIONS: Record<
  Rol,
  {
    acceso: string[];
    puedeEditarEstilos: boolean;
    puedeVerFacturacion: boolean;
  }
> = {
  Administrador: {
    acceso: ["dashboard", "reservas", "usuarios", "pagos", "personalizacion"],
    puedeEditarEstilos: true,
    puedeVerFacturacion: true,
  },
  Cajero: {
    acceso: ["dashboard", "reservas", "usuarios"],
    puedeEditarEstilos: false,
    puedeVerFacturacion: false,
  },
};
