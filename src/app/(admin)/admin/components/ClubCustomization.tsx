// src/app/admin/components/ClubCustomization.tsx
"use client";
import { useState } from "react";

export function ClubCustomization() {
  const [primary, setPrimary] = useState("#0d1b2a");
  const [secondary, setSecondary] = useState("#1b263b");

  return (
    <div className="bg-white shadow p-4 rounded-xl w-full">
      <h2 className="text-lg font-semibold mb-3">
        🎨 Personalización del club
      </h2>
      <div className="space-y-2">
        <div>
          <label className="text-sm text-gray-600">Color primario</label>
          <input
            type="color"
            value={primary}
            onChange={(e) => setPrimary(e.target.value)}
            className="ml-2"
          />
        </div>
        <div>
          <label className="text-sm text-gray-600">Color secundario</label>
          <input
            type="color"
            value={secondary}
            onChange={(e) => setSecondary(e.target.value)}
            className="ml-2"
          />
        </div>
      </div>
      <button className="mt-4 bg-[#0d1b2a] text-white px-3 py-1 rounded-md hover:bg-[#1b263b] transition">
        Guardar cambios
      </button>
    </div>
  );
}
