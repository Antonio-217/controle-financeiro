import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, TrendingUp, Plus } from "lucide-react";
import { NewTransactionModal } from "../dashboard/NewTransactionModal";
import { Button } from "../ui/button";

export function BottomMenu() {
  const location = useLocation();
  const path = location.pathname;

  // Função auxiliar para definir estilo do ícone ativo
  const getLinkClass = (isActive: boolean) => 
    `flex flex-col items-center justify-center gap-1 transition-colors ${
      isActive ? "text-emerald-600 font-medium" : "text-zinc-400 hover:text-emerald-600"
    }`;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-zinc-100 pb-safe pt-2 px-6 h-20 shadow-[0_-5px_20px_rgba(0,0,0,0.03)] z-40">
      <div className="max-w-lg mx-auto flex items-center justify-between h-full pb-2">
        
        {/* BOTÃO ESQUERDA: DASHBOARD */}
        <Link to="/" className={getLinkClass(path === "/")}>
          <LayoutDashboard className="h-6 w-6" />
          <span className="text-[10px]">Início</span>
        </Link>

        {/* BOTÃO MEIO: ADICIONAR (Com Modal) */}
        <div className="-mt-8">
          <NewTransactionModal>
            <Button className="h-14 w-14 rounded-full bg-emerald-600 hover:bg-emerald-800 shadow-xl shadow-emerald-900/10 flex items-center justify-center transition-transform active:scale-95">
              <Plus className="h-7 w-7 text-white" />
            </Button>
          </NewTransactionModal>
        </div>

        {/* BOTÃO DIREITA: INVESTIMENTOS */}
        <Link to="/investments" className={getLinkClass(path === "/investments")}>
          <TrendingUp className="h-6 w-6" />
          <span className="text-[10px]">Carteira</span>
        </Link>

      </div>
    </div>
  );
}