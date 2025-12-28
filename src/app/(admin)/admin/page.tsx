"use client";

import { useEffect, useState } from "react";
import { StatCard } from "./components/StatCard";
import { ChartReservas } from "./components/ChartReservas";
// Si aún no tienes estos componentes creados, coméntalos para evitar errores de importación:
// import { ChartCanchaPopular } from "./components/ChartCanchaPopular";
// import { TransactionsTable } from "./components/TransactionsTable";

import { Rol } from "@/lib/roles"; // Asegúrate de que la ruta a 'roles' sea correcta
import {
  CalendarDays,
  Users,
  Trophy,
  CreditCard,
  Activity,
} from "lucide-react";
import { supabase } from "@/lib/supabase/supabaseClient";

export default function DashboardPage() {
  const [userRole] = useState<Rol>("Administrador");
  const [loading, setLoading] = useState(true);

  // Estado para los valores numéricos
  const [stats, setStats] = useState({
    reservasSemana: 0,
    clientesTotal: 0,
    ingresosMes: 0,
    canchaTop: "Cargando...",
  });

  // --- EFECTO PARA CARGAR DATOS (Simulado) ---
  useEffect(() => {
    async function fetchStats() {
      try {
        // Simulación de carga de datos
        await new Promise((resolve) => setTimeout(resolve, 1000));

        setStats({
          reservasSemana: 42,
          clientesTotal: 156,
          ingresosMes: 450000,
          canchaTop: "Cancha Panorámica",
        });
      } catch (error) {
        console.error("Error cargando stats", error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* --- ENCABEZADO --- */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">
            Panel de Control
          </h1>
          <p className="text-slate-500 mt-1">
            Resumen de actividad y rendimiento del club.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-600 bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm">
          <Activity size={16} className="text-green-600 animate-pulse" />
          <span>Sistema operativo · Actualizado hace 1m</span>
        </div>
      </div>

      {/* --- TARJETAS DE ESTADÍSTICAS (Aquí estaba el error, ahora pasamos el icono explícitamente) --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Reservas Semana"
          value={loading ? "..." : stats.reservasSemana}
          icon={CalendarDays} // <--- Pasamos el componente del icono
          trend="+12%"
          trendUp={true}
          description="vs. semana anterior"
          color="blue"
        />
        <StatCard
          title="Clientes Registrados"
          value={loading ? "..." : stats.clientesTotal}
          icon={Users} // <--- Icono
          trend="+5"
          trendUp={true}
          description="Nuevos este mes"
          color="purple"
        />
        <StatCard
          title="Ingresos (Mes)"
          value={loading ? "..." : `$${stats.ingresosMes.toLocaleString()}`}
          icon={CreditCard} // <--- Icono
          trend="+8.2%"
          trendUp={true}
          description="Proyección positiva"
          color="green"
        />
        <StatCard
          title="Cancha Favorita"
          value={loading ? "..." : stats.canchaTop}
          icon={Trophy} // <--- Icono
          description="Más horas ocupadas"
          color="orange"
        />
      </div>

      {/* --- GRÁFICOS --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Gráfico Principal (Ocupa 2 columnas) */}
        <div className="lg:col-span-2">
          <ChartReservas />
        </div>

        {/* Gráfico Secundario o Info Extra */}
        {userRole === "Administrador" && (
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm h-[400px] flex flex-col">
            <div className="mb-4">
              <h3 className="text-lg font-bold text-slate-800">
                Distribución de Canchas
              </h3>
              <p className="text-slate-500 text-sm">
                Preferencia de usuarios este mes
              </p>
            </div>
            <div className="flex-1 flex items-center justify-center relative">
              <div className="text-center space-y-2 opacity-50">
                <Trophy size={48} className="mx-auto text-yellow-500 mb-2" />
                <p className="text-sm font-medium text-slate-600">
                  Gráfico de Canchas
                </p>
                <p className="text-xs text-slate-400">Próximamente</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* --- TABLA DE TRANSACCIONES (Opcional si tienes el componente) --- */}
      {/* {userRole === "Administrador" && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <div>
                <h3 className="text-lg font-bold text-slate-800">Últimas Transacciones</h3>
                <p className="text-slate-500 text-sm">Historial reciente de pagos y reservas.</p>
            </div>
          </div>
          <div className="p-0">
            <TransactionsTable />
          </div>
        </div>
      )} 
      */}
    </div>
  );
}
