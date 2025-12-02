// src/app/admin/components/UserProfile.tsx
"use client";
import Image from "next/image";

export function UserProfile() {
  const user = {
    name: "Juan Cruz",
    role: "Administrador",
    image: "/admin/avatar.jpg", // puedes poner tu imagen local o URL
  };

  return (
    <div className="flex flex-col items-center text-white py-4 border-t border-gray-700">
      <Image
        src={user.image}
        alt="Foto de perfil"
        width={64}
        height={64}
        className="rounded-full border-2 border-gray-600"
      />
      <p className="mt-2 font-semibold">{user.name}</p>
      <p className="text-sm text-gray-400">{user.role}</p>
    </div>
  );
}
