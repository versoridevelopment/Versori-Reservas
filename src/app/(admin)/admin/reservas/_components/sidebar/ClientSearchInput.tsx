"use client";

import { useState, useEffect, useRef } from "react";
import { Search, History, Loader2, UserPlus } from "lucide-react";

type ClienteResult = {
  id: string;
  nombre: string;
  telefono: string;
  email: string;
  tipo: "manual";
};

interface Props {
  idClub: number;
  initialValue?: string;
  onSelect: (cliente: {
    nombre: string;
    telefono: string;
    email: string;
  }) => void;
}

export default function ClientSearchInput({
  idClub,
  initialValue = "",
  onSelect,
}: Props) {
  const [query, setQuery] = useState(initialValue);
  const [results, setResults] = useState<ClienteResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Sincronizar si cambia el valor inicial (ej: edición)
  useEffect(() => {
    if (initialValue !== query) setQuery(initialValue);
  }, [initialValue]);

  // Búsqueda con Debounce
  useEffect(() => {
    if (query.length < 1) {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        // ✅ AQUI EL CAMBIO CLAVE: &type=manual
        const res = await fetch(
          `/api/admin/clientes/search?q=${encodeURIComponent(query)}&id_club=${idClub}&type=manual`,
        );
        const json = await res.json();
        setResults(json.results || []);
        setShowDropdown(true);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, idClub]);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (cliente: ClienteResult) => {
    setQuery(cliente.nombre);
    setShowDropdown(false);
    onSelect({
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
            setQuery(e.target.value);
            // Actualizamos el formulario padre en tiempo real mientras escribe
            onSelect({ nombre: e.target.value, telefono: "", email: "" });
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

      {/* DROPDOWN DE RESULTADOS */}
      {showDropdown && query.length >= 1 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto custom-scrollbar ring-1 ring-black/5">
          {results.length > 0
            ? results.map((cliente) => (
                <button
                  key={cliente.id}
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
            : !loading && (
                <div className="px-4 py-3 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                  <UserPlus className="w-4 h-4" />
                  <span>Cliente nuevo</span>
                </div>
              )}
        </div>
      )}
    </div>
  );
}
