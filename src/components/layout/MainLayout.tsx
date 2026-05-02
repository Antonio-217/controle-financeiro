import { Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Settings, LogOut, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { BottomNav } from "./BottomNav";

export function MainLayout() {
  const { user, logout, loading } = useAuth();
  const navigate = useNavigate();

  // Previne renderização caso o estado de autenticação ainda esteja carregando
  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-zinc-950">
        <Loader2 className="h-8 w-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  // Pega o primeiro nome para a saudação e as iniciais para o Avatar
  const firstName = user?.name?.split(" ")[0] || "Estrategista";
  const initials = user?.name
    ?.split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "FA";

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-emerald-500/30">
      
      {/* CABEÇALHO */}
      <header className="sticky top-0 z-50 w-full border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md">
        <div className="max-w-4xl mx-auto flex items-center justify-between p-4">
          
          {/* Lado Esquerdo: Avatar e Saudação */}
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border border-zinc-800 shadow-sm">
              <AvatarImage src={user?.photoURL || ""} alt={user?.name} />
              <AvatarFallback className="bg-zinc-800 text-emerald-500 font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-xs text-zinc-400">Bem-vindo(a),</span>
              <span className="text-sm font-semibold text-zinc-100 leading-tight">
                {firstName}
              </span>
            </div>
          </div>

          {/* Lado Direito: Ações (Configurações e Sair) */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/settings")}
              className="text-zinc-400 hover:text-emerald-500 p-1.5 hover:bg-emerald-500/10 rounded transition-colors"
            >
              <Settings className="h-5 w-5" />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="text-zinc-400 hover:text-red-400 p-1.5 rounded hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>

        </div>
      </header>

      {/* ÁREA CENTRAL (Onde as páginas são renderizadas) */}
      <main className="flex-1 w-full max-w-4xl mx-auto p-4 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out fill-mode-both">
        <Outlet />
      </main>

      {/* MENU INFERIOR */}
      <BottomNav />

    </div>
  );
}