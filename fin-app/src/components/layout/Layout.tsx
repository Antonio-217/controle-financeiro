import { Outlet } from "react-router-dom";
import { BottomMenu } from "../investments/BottomMenu";

export function Layout() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Área do conteúdo principal (Dashboard ou Investimentos) */}
      <div className="flex-1 pb-24">
        <Outlet />
      </div>

      {/* Menu */}
      <BottomMenu />
    </div>
  );
}