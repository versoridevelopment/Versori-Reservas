import "../../globals.css";
import { Sidebar } from "./components/Sidebar";

export const metadata = {
  title: "Panel Admin | Versori",
};

// Layout del panel admin
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="bg-gray-50">
        <div className="flex h-screen text-gray-900">
          {/* Sidebar es client component */}
          <Sidebar />
          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>
      </body>
    </html>
  );
}
