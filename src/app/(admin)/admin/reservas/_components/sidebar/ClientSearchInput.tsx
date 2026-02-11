"use client";

import { useState, useEffect, useRef } from "react";
import { Search, History, Loader2, UserPlus } from "lucide-react";

type ClienteResult = {
  id: string; // viene del endpoint (string)
  nombre: string;
  telefono: string;
  email: string;
  tipo: "manual";
};

interface Props {
  idClub: number;
  initialValue?: string;

  // ✅ cuando selecciona un resultado (cliente existente)
  onSelect: (cliente: {
    id_cliente_manual?: number;
    id_cliente?: number;
    id?: number;
    nombre: string;
    telefono: string;
    email: string;
  }) => void;

  // ✅ cuando escribe manualmente (no es selección)
  onChangeValue?: (value: string) => void;
}

export default function ClientSearchInput({
  idClub,
  initialValue = "",
  onSelect,
  onChangeValue,
}: Props) {
  const [query, setQuery] = useState(initialValue);
  const [results, setResults] = useState<ClienteResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Sync del valor inicial (ej: al abrir sidebar con data precargada)
  useEffect(() => {
    if (initialValue !== query) setQuery(initialValue);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialValue]);

  // Búsqueda con debounce
  useEffect(() => {
    if (query.length < 1) {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/admin/clientes/search?q=${encodeURIComponent(
            query,
          )}&id_club=${idClub}&type=manual`,
        );
        const json = await res.json().catch(() => null);
        setResults(json?.results || []);
        setShowDropdown(true);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, idClub]);

  // Cerrar al click afuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (cliente: ClienteResult) => {
    setQuery(cliente.nombre);
    setShowDropdown(false);

    // ✅ Convertimos id string -> number (si es numérico)
    const idNum = Number(cliente.id);
    onSelect({
      id_cliente_manual: Number.isFinite(idNum) ? idNum : undefined,
      nombre: cliente.nombre,
      telefono: cliente.telefono,
      email: cliente.email,
    });
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">
        Nombre del Jugador
      </label>

      <div className="relative group">
        <input
          type="text"
          className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm text-slate-800 placeholder-slate-400"
          placeholder="Ej: L..."
          value={query}
          onChange={(e) => {
            const v = e.target.value;
            setQuery(v);

            // ✅ AVISA AL PADRE: está escribiendo manualmente (NO selección)
            onChangeValue?.(v);

            // Si escribe algo, muestro dropdown (con resultados cuando lleguen)
            setShowDropdown(true);
          }}
          onFocus={() => query.length >= 1 && setShowDropdown(true)}
          autoComplete="off"
        />

        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Search className="w-4 h-4" />
          )}
        </div>
      </div>

      {/* DROPDOWN */}
      {showDropdown && query.length >= 1 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto custom-scrollbar ring-1 ring-black/5">
          {results.length > 0 ? (
            results.map((cliente) => (
              <button
                key={cliente.id}
                type="button"
                onClick={() => handleSelect(cliente)}
                className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b border-slate-50 last:border-0 flex items-center justify-between group transition-colors"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center bg-orange-100 text-orange-600">
                    <History className="w-4 h-4" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate group-hover:text-blue-600">
                      {cliente.nombre}
                    </p>

                    <div className="flex items-center gap-2 text-xs text-slate-500 truncate">
                      {cliente.telefono ? (
                        <span>{cliente.telefono}</span>
                      ) : (
                        <span className="italic text-slate-400">Sin tel</span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))
          ) : (
            !loading && (
              <div className="px-4 py-3 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                <UserPlus className="w-4 h-4" />
                <span>Cliente nuevo</span>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
