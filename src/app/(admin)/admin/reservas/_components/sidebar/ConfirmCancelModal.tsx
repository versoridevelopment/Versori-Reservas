"use client";

import { X, AlertTriangle } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: (motivo?: string | null) => void;
  loading?: boolean;
}

export default function ConfirmCancelModal({
  open,
  onClose,
  onConfirm,
  loading,
}: Props) {
  if (!open) return null;

  let motivo = "";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 p-6 animate-in fade-in zoom-in-95">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1 rounded-full hover:bg-slate-100 text-slate-400"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="bg-rose-100 text-rose-600 p-2 rounded-full">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">
            Cancelar reserva
          </h3>
        </div>

        <p className="text-sm text-slate-600 mb-4">
          ¿Estás seguro de que querés cancelar esta reserva?
          <br />
          Esta acción <b>no se puede deshacer</b>.
        </p>

        <textarea
          placeholder="Motivo (opcional)"
          className="w-full border border-slate-200 rounded-xl p-3 text-sm resize-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
          rows={3}
          onChange={(e) => (motivo = e.target.value)}
        />

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50"
            disabled={loading}
          >
            Volver
          </button>

          <button
            onClick={() => onConfirm(motivo || null)}
            disabled={loading}
            className="flex-1 py-3 rounded-xl bg-rose-600 text-white font-bold hover:bg-rose-700 disabled:opacity-60"
          >
            {loading ? "Cancelando..." : "Sí, cancelar"}
          </button>
        </div>
      </div>
    </div>
  );
}
