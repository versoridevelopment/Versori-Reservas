"use client";

import { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import { format, subDays, startOfYear } from "date-fns";
import { es } from "date-fns/locale";
import {
  DollarSign,
  Users,
  CalendarCheck,
  TrendingUp,
  BarChart3,
  Loader2,
  ArrowUpRight,
  CalendarRange,
  PieChart,
  ArrowRight,
  Clock,
  Wallet,
  AlertCircle,
  Info,
  Zap,
  Activity,
  ShieldCheck,
  Building2,
  User,
} from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";

// Componentes de Gráficos (Asumo que ya los tienes creados en esa ruta)
import { RevenueChart } from "./components/dashboard/RevenueChart";
import { CourtRanking } from "./components/dashboard/CourtRanking";
import { ClientRanking } from "./components/dashboard/ClientRanking";
import { HourlyActivityChart } from "./components/dashboard/HourlyActivityChart";
import { PaymentStatusPie } from "./components/dashboard/PaymentStatusPie";

// --- COMPONENTE KPI CARD ---
const KpiCard = ({
  title,
  value,
  icon: Icon,
  trend,
  color,
  subtext,
  tooltip,
  isMoney,
}: any) => {
  const colorStyles: any = {
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    violet: "bg-violet-50 text-violet-600 border-violet-100",
    rose: "bg-rose-50 text-rose-600 border-rose-100",
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
    cyan: "bg-cyan-50 text-cyan-600 border-cyan-100",
    red: "bg-red-50 text-red-600 border-red-100",
  };

  // ✅ Formateo compacto para que no se rompa la vista con millones
  const displayValue =
    isMoney && typeof value === "number"
      ? new Intl.NumberFormat("es-AR", {
          maximumFractionDigits: 1,
          notation: value >= 1000000 ? "compact" : "standard",
        }).format(value)
      : value;

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 relative group/card">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <p className="text-slate-500 text-[11px] font-bold uppercase tracking-wider">
              {title}
            </p>
            {tooltip && (
              <div className="group/tooltip relative">
                <Info
                  size={12}
                  className="text-slate-300 hover:text-slate-500 cursor-help"
                />
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2.5 bg-slate-800 text-white text-[10px] leading-tight rounded-lg shadow-xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-50 pointer-events-none text-center">
                  {tooltip}
                </div>
              </div>
            )}
          </div>
          <h3 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-1">
            {isMoney && <span className="text-slate-400 font-medium">$</span>}
            {displayValue}
          </h3>
        </div>
        <div
          className={`p-3 rounded-xl border ${colorStyles[color] || "bg-slate-50"}`}
        >
          <Icon size={22} strokeWidth={2} />
        </div>
      </div>
      <div className="flex items-center gap-2">
        {trend && (
          <span className="flex items-center text-[10px] font-bold text-emerald-700 bg-emerald-100/50 px-2 py-0.5 rounded-full">
            <ArrowUpRight size={10} className="mr-1" /> {trend}
          </span>
        )}
        {subtext && (
          <p className="text-xs text-slate-400 font-medium truncate">
            {subtext}
          </p>
        )}
      </div>
    </div>
  );
};

export default function DashboardPage() {
  const [clubId, setClubId] = useState<number | null>(null);
  const [clubInfo, setClubInfo] = useState({
    name: "Mi Club",
    logo: null as string | null,
  });
  const [user, setUser] = useState({
    name: "Usuario",
    role: null as "admin" | "cajero" | null,
  });
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [dateRange, setDateRange] = useState("30days");

  const [supabase] = useState(() =>
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    ),
  );

  // 1. Reloj
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // 2. Inicializar Contexto (Club, Usuario, Rol)
  useEffect(() => {
    const init = async () => {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      if (!authUser) return;

      // Perfil
      const { data: profile } = await supabase
        .from("profiles")
        .select("nombre, apellido")
        .eq("id_usuario", authUser.id)
        .single();

      // Club por subdominio
      let cId = 9;
      let cName = "Mi Club";
      let cLogo = null;

      if (typeof window !== "undefined") {
        const sub = window.location.hostname.split(".")[0];
        if (sub && sub !== "localhost") {
          const { data: club } = await supabase
            .from("clubes")
            .select("id_club, nombre, logo_url")
            .eq("subdominio", sub)
            .single();
          if (club) {
            cId = club.id_club;
            cName = club.nombre;
            cLogo = club.logo_url;
          }
        }
      }

      // Rol
      const { data: members } = await supabase
        .from("club_usuarios")
        .select("roles(nombre)")
        .eq("id_usuario", authUser.id)
        .eq("id_club", cId);
      const isAdmin = members?.some((m: any) =>
        ["admin", "administrador", "propietario"].includes(
          m.roles?.nombre?.toLowerCase().trim(),
        ),
      );

      setClubId(cId);
      setClubInfo({ name: cName, logo: cLogo });
      setUser({
        name: profile ? `${profile.nombre} ${profile.apellido}` : "Usuario",
        role: isAdmin ? "admin" : "cajero",
      });
    };
    init();
  }, [supabase]);

  // 3. Fetch de Estadísticas
  useEffect(() => {
    if (!clubId) return;

    const loadStats = async () => {
      setLoading(true);
      try {
        const now = new Date();
        let fromDate = subDays(now, 30);
        if (dateRange === "7days") fromDate = subDays(now, 7);
        if (dateRange === "90days") fromDate = subDays(now, 90);
        if (dateRange === "year") fromDate = startOfYear(now);
        if (dateRange === "all") fromDate = new Date("2024-01-01");

        const from = format(fromDate, "yyyy-MM-dd");
        const to = format(now, "yyyy-MM-dd");

        const res = await fetch(
          `/api/dashboard/stats?clubId=${clubId}&from=${from}&to=${to}`,
        );
        if (res.ok) {
          setData(await res.json());
        }
      } catch (err) {
        console.error("Dashboard Load Error:", err);
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, [clubId, dateRange]);

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-slate-900 mb-4" />
        <p className="text-slate-500 font-medium animate-pulse">
          Sincronizando métricas...
        </p>
      </div>
    );
  }

  const { kpis, charts, comparativaCanchas } = data;
  const isAdmin = user.role === "admin";

  return (
    <div className="flex-1 w-full bg-slate-50 min-h-screen p-4 md:p-10 space-y-8 font-sans">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-slate-200 pb-8">
        <div>
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <span className="px-3 py-1 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 border border-slate-300">
              {clubInfo.logo && (
                <div className="relative w-4 h-4 rounded-full overflow-hidden bg-white">
                  <Image
                    src={clubInfo.logo}
                    alt="Logo"
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              {clubInfo.name}
            </span>
            <span className="px-3 py-1 rounded-full bg-white text-slate-500 text-[10px] font-medium border border-slate-200 flex items-center gap-1.5">
              <CalendarRange size={12} />{" "}
              {format(currentTime, "EEEE d 'de' MMMM", { locale: es })}
              <span className="w-px h-3 bg-slate-200 mx-1"></span>
              <Clock size={12} /> {format(currentTime, "HH:mm")} hs
            </span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Hola, {user.name}
          </h1>
          <p className="text-slate-500 mt-1 text-sm flex items-center gap-2">
            <ShieldCheck size={14} className="text-blue-500" />
            {isAdmin
              ? "Panel de Control Administrativo"
              : "Panel de Operaciones"}
          </p>
        </div>

        {/* RANGO DE FECHAS */}
        <div className="relative w-full md:w-auto">
          <CalendarRange className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="w-full md:w-48 pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none hover:bg-slate-50 transition-colors shadow-sm cursor-pointer appearance-none"
          >
            <option value="7days">Últimos 7 días</option>
            <option value="30days">Últimos 30 días</option>
            <option value="90days">Último Trimestre</option>
            <option value="year">Este Año</option>
            <option value="all">Histórico Total</option>
          </select>
        </div>
      </div>

      {/* KPI SECTION */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <KpiCard
          title="Venta Bruta"
          value={kpis.ingresos}
          isMoney
          color="emerald"
          icon={DollarSign}
          subtext="Facturación del periodo"
          tooltip="Ingresos totales de todas las reservas confirmadas."
        />
        <KpiCard
          title="Saldo a Cobrar"
          value={kpis.saldoCobrar}
          isMoney
          color="rose"
          icon={Wallet}
          subtext="Pendiente en club"
          tooltip="Dinero que debe abonarse al llegar al complejo."
        />
        <KpiCard
          title="Turnos"
          value={kpis.reservas}
          color="violet"
          icon={CalendarCheck}
          subtext={`${kpis.horasVendidas} horas de juego`}
        />
        <KpiCard
          title="Cancelación"
          value={`${kpis.tasaCancelacion.toFixed(1)}%`}
          color="red"
          icon={AlertCircle}
          subtext="Turnos no concretados"
        />
      </div>

      {/* GRÁFICOS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Activity size={18} className="text-blue-500" /> Evolución de
              Ingresos
            </h3>
          </div>
          <div className="h-[300px] w-full">
            <RevenueChart data={charts.revenue} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="mb-4">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <PieChart size={16} className="text-rose-500" /> Composición de
              Pagos
            </h3>
          </div>
          <div className="h-[250px] w-full">
            <PaymentStatusPie data={charts.payments} />
          </div>
        </div>
      </div>

      {/* RANKINGS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
            <BarChart3 size={18} className="text-indigo-500" /> Ocupación por
            Cancha
          </h3>
          <CourtRanking data={comparativaCanchas} />
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
            <TrendingUp size={18} className="text-emerald-500" /> Clientes
            Destacados
          </h3>
          <ClientRanking data={charts.topClientes} />
        </div>
      </div>
    </div>
  );
}
